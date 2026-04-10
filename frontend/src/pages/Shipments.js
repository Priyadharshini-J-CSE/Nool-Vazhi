import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { shipmentAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const statusClass = {
  Pending: 'badge-pending',
  'In Transit': 'badge-transit',
  Delivered: 'badge-delivered',
  Cancelled: 'badge-cancelled',
  'Pickup Confirmed': 'badge-transit',
  'Out for Delivery': 'badge-transit',
};

const STATUS_OPTIONS = ['Pickup Confirmed', 'In Transit', 'Out for Delivery', 'Delivered'];

export default function Shipments() {
  const { user } = useAuth();
  const isDriver = user?.role === 'driver';
  const [shipments, setShipments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [statusInput, setStatusInput] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchShipments = () => {
    setLoading(true);
    shipmentAPI.getAll()
      .then(({ data }) => setShipments(data))
      .catch(() => setShipments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchShipments(); }, []);

  const openModal = (s) => { setModal(s); setStatusInput(s.status); };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await shipmentAPI.updateLocation(modal._id, { status: statusInput });
      setModal(null);
      fetchShipments();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally { setUpdating(false); }
  };

  const statuses = ['All', 'Pickup Confirmed', 'In Transit', 'Out for Delivery', 'Delivered', 'Pending', 'Cancelled'];
  const filtered = filter === 'All' ? shipments : shipments.filter(s => s.status === filter);

  return (
    <div style={styles.layout}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{isDriver ? 'My Trips' : 'Shipments'}</h1>
            <p style={styles.sub}>{shipments.length} total {isDriver ? 'trips' : 'shipments'}</p>
          </div>
          {!isDriver && (
            <Link to="/dashboard">
              <button className="btn-primary">
                <i className="fa-solid fa-plus"></i> New Shipment
              </button>
            </Link>
          )}
        </div>

        <div style={styles.filterRow}>
          {statuses.map(s => (
            <button key={s} style={{ ...styles.filterBtn, ...(filter === s ? styles.filterActive : {}) }} onClick={() => setFilter(s)}>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.loading}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 12 }}></i>
            <p>Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <i className="fa-solid fa-inbox" style={{ fontSize: 64, color: '#cbd5e1', marginBottom: 16 }}></i>
            <p>{isDriver ? 'No trips yet. Accept shipments from the dashboard.' : 'No shipments found.'}</p>
            {!isDriver && (
              <Link to="/dashboard"><button className="btn-primary" style={{ marginTop: 16 }}>Book Your First Shipment</button></Link>
            )}
          </div>
        ) : (
          <div style={styles.list}>
            {filtered.map((s) => (
              <div key={s._id} className="card" style={styles.shipCard}>
                <div style={styles.shipTop}>
                  <div>
                    <div style={styles.shipId}>{s.shipmentId}</div>
                    <div style={styles.shipRoute}>
                      <span style={styles.city}>{s.pickup}</span>
                      <i className="fa-solid fa-arrow-right" style={{ color: '#F97316' }}></i>
                      <span style={styles.city}>{s.drop}</span>
                    </div>
                  </div>
                  <span className={`badge ${statusClass[s.status] || 'badge-pending'}`}>{s.status}</span>
                </div>

                <div style={styles.shipMeta}>
                  <div style={styles.metaItem}><span style={styles.metaLabel}>Goods</span><span>{s.goodsType}</span></div>
                  <div style={styles.metaItem}><span style={styles.metaLabel}>Bundles</span><span>{s.bundles}</span></div>
                  {isDriver ? (
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>Shipper</span>
                      <span>{s.shipper?.businessName || s.shipper?.name || 'N/A'}</span>
                    </div>
                  ) : (
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>Driver</span>
                      <span>{s.driver?.name || 'Assigning...'}</span>
                    </div>
                  )}
                  {isDriver && s.currentLocation && (
                    <div style={styles.metaItem}>
                      <span style={styles.metaLabel}>GPS Location</span>
                      <span><i className="fa-solid fa-satellite-dish" style={{ color: '#22c55e', marginRight: 4 }}></i>{s.currentLocation}</span>
                    </div>
                  )}
                  <div style={styles.metaItem}><span style={styles.metaLabel}>Date</span><span>{new Date(s.createdAt).toLocaleDateString('en-IN')}</span></div>
                  <div style={styles.metaItem}><span style={styles.metaLabel}>Cost</span><span style={{ color: '#1E3A8A', fontWeight: 700 }}>₹{s.cost?.total?.toLocaleString()}</span></div>
                </div>

                <div style={styles.shipActions}>
                  {isDriver ? (
                    s.status !== 'Delivered' && s.status !== 'Cancelled' ? (
                      <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }} onClick={() => openModal(s)}>
                        <i className="fa-solid fa-pen"></i> Update Status
                      </button>
                    ) : (
                      <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 13 }}>
                        <i className="fa-solid fa-circle-check" style={{ marginRight: 6 }}></i>
                        {s.status}
                      </span>
                    )
                  ) : (
                    <Link to={`/tracking?id=${s.shipmentId}`}>
                      <button className="btn-blue" style={{ padding: '8px 20px', fontSize: 13 }}>
                        <i className="fa-solid fa-location-dot"></i> Track
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Driver Status Modal */}
      {modal && (
        <div style={styles.modalOverlay} onClick={() => setModal(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              <i className="fa-solid fa-pen" style={{ color: '#F97316', marginRight: 8 }}></i>
              Update Status
            </h3>
            <p style={styles.modalRoute}>{modal.pickup} → {modal.drop}</p>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803d', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fa-solid fa-satellite-dish"></i>
              Location is tracked automatically via GPS
            </div>
            <div className="form-group">
              <label>Update Status</label>
              <select value={statusInput} onChange={e => setStatusInput(e.target.value)}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }} onClick={handleUpdate} disabled={updating}>
                {updating ? 'Updating...' : 'Update'}
              </button>
              <button style={styles.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh' },
  main: { flex: 1, padding: '32px', background: '#f8fafc' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 28, fontWeight: 800, color: '#1e293b' },
  sub: { color: '#64748b', marginTop: 4 },
  filterRow: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  filterBtn: { padding: '8px 18px', border: '1.5px solid #e2e8f0', borderRadius: 20, background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b', transition: 'all 0.2s' },
  filterActive: { background: '#1E3A8A', color: 'white', borderColor: '#1E3A8A' },
  loading: { textAlign: 'center', padding: 60, color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  empty: { textAlign: 'center', padding: 80, color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  shipCard: { padding: '24px' },
  shipTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  shipId: { fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px' },
  shipRoute: { display: 'flex', alignItems: 'center', gap: 10 },
  city: { fontSize: 18, fontWeight: 700, color: '#1e293b' },
  shipMeta: { display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' },
  metaItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  metaLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' },
  shipActions: { display: 'flex', gap: 10, alignItems: 'center' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 6, display: 'flex', alignItems: 'center' },
  modalRoute: { color: '#64748b', fontSize: 14, marginBottom: 24 },
  cancelBtn: { flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#64748b' },
};
