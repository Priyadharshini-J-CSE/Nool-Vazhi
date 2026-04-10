import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { tripAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import LocationInput from '../components/LocationInput';

function CapacityBar({ total, available }) {
  const used = total - available;
  const pct = Math.round((used / total) * 100);
  const color = pct >= 80 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 3 }}>
        <span>{available} kg free</span><span>{pct}% filled</span>
      </div>
      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

const STATUS_COLORS = { ACTIVE: '#d1fae5|#065f46', FULL: '#fee2e2|#991b1b', COMPLETED: '#dbeafe|#1e40af', CANCELLED: '#f1f5f9|#64748b' };

export default function DriverTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromLocation: '', toLocation: '', totalCapacity: '', pricePerKg: '', minimumBookingKg: 1, hasReturnTrip: false });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');
  const [expandedTrip, setExpandedTrip] = useState(null);
  const [tripBookings, setTripBookings] = useState({});
  const [locations, setLocations] = useState([]);

  const fetchTrips = () => {
    setLoading(true);
    tripAPI.myTrips()
      .then(({ data }) => setTrips(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTrips();
    tripAPI.locations().then(({ data }) => setLocations(data)).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true); setMsg('');
    try {
      await tripAPI.create(form);
      setMsg('success:Trip created successfully!');
      setShowForm(false);
      setForm({ fromLocation: '', toLocation: '', totalCapacity: '', pricePerKg: '', minimumBookingKg: 1, hasReturnTrip: false });
      fetchTrips();
      tripAPI.locations().then(({ data }) => setLocations(data)).catch(() => {});
    } catch (err) {
      setMsg('error:' + (err.response?.data?.message || 'Failed to create trip'));
    } finally { setCreating(false); }
  };

  const handleExpand = async (tripId) => {
    if (expandedTrip === tripId) { setExpandedTrip(null); return; }
    setExpandedTrip(tripId);
    if (!tripBookings[tripId]) {
      try {
        const { data } = await tripAPI.tripBookings(tripId);
        setTripBookings(prev => ({ ...prev, [tripId]: data }));
      } catch { setTripBookings(prev => ({ ...prev, [tripId]: [] })); }
    }
  };

  const handleStatusUpdate = async (tripId, status) => {
    try {
      await tripAPI.updateStatus(tripId, status);
      fetchTrips();
    } catch (err) { alert(err.response?.data?.message || 'Update failed'); }
  };

  return (
    <div style={styles.layout}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Trips</h1>
            <p style={styles.sub}>Create and manage your capacity listings</p>
          </div>
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setMsg(''); }}>
            <i className={`fa-solid ${showForm ? 'fa-xmark' : 'fa-plus'}`}></i>
            {showForm ? 'Cancel' : 'Create Trip'}
          </button>
        </div>

        {msg && (
          <div style={msg.startsWith('success') ? styles.success : styles.error}>
            <i className={`fa-solid ${msg.startsWith('success') ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ marginRight: 8 }}></i>
            {msg.replace(/^(success|error):/, '')}
          </div>
        )}

        {/* Create Trip Form */}
        {showForm && (
          <div className="card" style={{ padding: 28, marginBottom: 28 }}>
            <h2 style={styles.cardTitle}>
              <i className="fa-solid fa-truck-moving" style={{ color: '#F97316', marginRight: 8 }}></i>
              New Trip Listing
            </h2>
            <form onSubmit={handleCreate}>
              <div style={styles.formGrid}>
                <div className="form-group">
                  <label>From Location *</label>
                  <LocationInput
                    id="drv-from"
                    value={form.fromLocation}
                    onChange={e => setForm({ ...form, fromLocation: e.target.value })}
                    placeholder="e.g. Chennai"
                    locations={locations}
                  />
                </div>
                <div className="form-group">
                  <label>To Location *</label>
                  <LocationInput
                    id="drv-to"
                    value={form.toLocation}
                    onChange={e => setForm({ ...form, toLocation: e.target.value })}
                    placeholder="e.g. Coimbatore"
                    locations={locations}
                  />
                </div>
                <div className="form-group">
                  <label>Total Capacity (kg) *</label>
                  <input type="number" min="1" value={form.totalCapacity} onChange={e => setForm({ ...form, totalCapacity: e.target.value })} placeholder="e.g. 5000" required />
                </div>
                <div className="form-group">
                  <label>Price per kg (₹) *</label>
                  <input type="number" min="1" value={form.pricePerKg} onChange={e => setForm({ ...form, pricePerKg: e.target.value })} placeholder="e.g. 8" required />
                </div>
                <div className="form-group">
                  <label>Minimum Booking (kg)</label>
                  <input type="number" min="1" value={form.minimumBookingKg} onChange={e => setForm({ ...form, minimumBookingKg: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <input type="checkbox" id="returnTrip" checked={form.hasReturnTrip} onChange={e => setForm({ ...form, hasReturnTrip: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                <label htmlFor="returnTrip" style={{ cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                  <i className="fa-solid fa-rotate" style={{ color: '#F97316', marginRight: 6 }}></i>
                  Auto-create return trip ({form.toLocation || '...'} → {form.fromLocation || '...'})
                </label>
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '12px 32px' }} disabled={creating}>
                <i className="fa-solid fa-rocket"></i>
                {creating ? 'Creating...' : 'Create Trip'}
              </button>
            </form>
          </div>
        )}

        {/* Trips List */}
        {loading ? (
          <div style={styles.empty}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 28, color: '#cbd5e1' }}></i>
          </div>
        ) : trips.length === 0 ? (
          <div style={styles.empty}>
            <i className="fa-solid fa-truck" style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 12 }}></i>
            <p>No trips yet. Create your first trip to start accepting bookings.</p>
          </div>
        ) : (
          <div style={styles.tripList}>
            {trips.map(trip => {
              const [bg, fg] = (STATUS_COLORS[trip.status] || '#f1f5f9|#64748b').split('|');
              return (
                <div key={trip._id} className="card" style={styles.tripCard}>
                  <div style={styles.tripTop}>
                    <div>
                      <div style={styles.tripId}>{trip.tripId}</div>
                      <div style={styles.routeRow}>
                        <span style={styles.city}>{trip.fromLocation}</span>
                        <i className="fa-solid fa-arrow-right" style={{ color: '#F97316' }}></i>
                        <span style={styles.city}>{trip.toLocation}</span>
                      </div>
                    </div>
                    <span style={{ background: bg, color: fg, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {trip.status}
                    </span>
                  </div>

                  <div style={styles.tripMeta}>
                    <div style={styles.metaChip}>
                      <i className="fa-solid fa-indian-rupee-sign" style={{ color: '#1E3A8A' }}></i>
                      ₹{trip.pricePerKg}/kg
                    </div>
                    <div style={styles.metaChip}>
                      <i className="fa-solid fa-weight-hanging" style={{ color: '#8b5cf6' }}></i>
                      {trip.totalCapacity} kg total
                    </div>
                    <div style={styles.metaChip}>
                      <i className="fa-solid fa-boxes-stacked" style={{ color: '#22c55e' }}></i>
                      {trip.availableCapacity} kg free
                    </div>
                  </div>

                  <CapacityBar total={trip.totalCapacity} available={trip.availableCapacity} />

                  <div style={styles.tripActions}>
                    <button style={styles.expandBtn} onClick={() => handleExpand(trip._id)}>
                      <i className={`fa-solid ${expandedTrip === trip._id ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ marginRight: 6 }}></i>
                      {expandedTrip === trip._id ? 'Hide' : 'View'} Bookings
                    </button>
                    {trip.status === 'ACTIVE' && (
                      <button style={styles.completeBtn} onClick={() => handleStatusUpdate(trip._id, 'COMPLETED')}>
                        <i className="fa-solid fa-circle-check"></i> Mark Completed
                      </button>
                    )}
                    {trip.status === 'ACTIVE' && (
                      <button style={styles.cancelBtn} onClick={() => handleStatusUpdate(trip._id, 'CANCELLED')}>
                        <i className="fa-solid fa-xmark"></i> Cancel
                      </button>
                    )}
                  </div>

                  {/* Bookings on this trip */}
                  {expandedTrip === trip._id && (
                    <div style={styles.bookingsSection}>
                      <h4 style={styles.bookingsTitle}>Bookings on this trip</h4>
                      {!tripBookings[trip._id] ? (
                        <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</p>
                      ) : tripBookings[trip._id].length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: 13 }}>No bookings yet.</p>
                      ) : (
                        <div style={styles.bookingRows}>
                          {tripBookings[trip._id].map(b => (
                            <div key={b._id} style={styles.bookingRow}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{b.shipper?.businessName || b.shipper?.name}</div>
                                <div style={{ color: '#64748b', fontSize: 12 }}>{b.goodsType} · {b.bookedWeight} kg</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, color: '#1E3A8A' }}>₹{b.totalPrice?.toLocaleString()}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>₹{b.pricePerKg}/kg</div>
                              </div>
                            </div>
                          ))}
                          <div style={styles.bookingTotal}>
                            Total booked: {tripBookings[trip._id].reduce((s, b) => s + b.bookedWeight, 0)} kg &nbsp;·&nbsp;
                            ₹{tripBookings[trip._id].reduce((s, b) => s + b.totalPrice, 0).toLocaleString()} earned
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh' },
  main: { flex: 1, padding: '32px', background: '#f8fafc', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 26, fontWeight: 800, color: '#1e293b' },
  sub: { color: '#64748b', marginTop: 4 },
  success: { background: '#d1fae5', color: '#065f46', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center' },
  error: { background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: 700, color: '#1e293b', marginBottom: 20, display: 'flex', alignItems: 'center' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  tripList: { display: 'flex', flexDirection: 'column', gap: 16 },
  tripCard: { padding: 24 },
  tripTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  tripId: { fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4, letterSpacing: '0.5px' },
  routeRow: { display: 'flex', alignItems: 'center', gap: 10 },
  city: { fontSize: 18, fontWeight: 700, color: '#1e293b' },
  tripMeta: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  metaChip: { background: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 },
  tripActions: { display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  expandBtn: { padding: '7px 16px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center' },
  completeBtn: { padding: '7px 16px', border: 'none', borderRadius: 8, background: '#d1fae5', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#065f46', display: 'flex', alignItems: 'center', gap: 6 },
  cancelBtn: { padding: '7px 16px', border: 'none', borderRadius: 8, background: '#fee2e2', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 },
  bookingsSection: { marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 },
  bookingsTitle: { fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 },
  bookingRows: { display: 'flex', flexDirection: 'column', gap: 8 },
  bookingRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' },
  bookingTotal: { fontSize: 13, fontWeight: 700, color: '#1E3A8A', padding: '8px 14px', background: '#eff6ff', borderRadius: 8, marginTop: 4 },
};
