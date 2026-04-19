import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const INDUSTRIES = ['Manufacturing', 'Retail / E-commerce', 'Agriculture', 'Construction', 'Pharma / Healthcare', 'Other'];
const VEHICLE_TYPES = ['Mini Truck (1–2 ton)', 'Medium Truck (5–10 ton)', 'Heavy Truck (10–20 ton)', 'Trailer / Container', 'Tanker'];

export default function Profile() {
  const { user, login } = useAuth();
  const isDriver = user?.role === 'driver';

  const [form, setForm] = useState({
    name: '', phone: '', location: '',
    businessName: '', gst: '', industry: '',
    licenseNumber: '', vehicleType: '', vehicleNumber: '', capacity: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    authAPI.profile()
      .then(({ data }) => {
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          location: data.location || '',
          businessName: data.businessName || '',
          gst: data.gst || '',
          industry: data.industry || '',
          licenseNumber: data.licenseNumber || '',
          vehicleType: data.vehicleType || '',
          vehicleNumber: data.vehicleNumber || '',
          capacity: data.capacity || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const { data } = await authAPI.updateProfile(form);
      // Update local auth context with new name
      const stored = JSON.parse(localStorage.getItem('nv_user') || '{}');
      login({ ...stored, name: data.name });
      setMsg('success:Profile updated successfully!');
    } catch (err) {
      setMsg('error:' + (err.response?.data?.message || 'Update failed'));
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div style={styles.layout}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.empty}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 28, color: '#cbd5e1' }}></i></div>
      </main>
    </div>
  );

  return (
    <div style={styles.layout}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              <i className="fa-solid fa-user-pen" style={{ color: '#F97316', marginRight: 10 }}></i>
              My Profile
            </h1>
            <p style={styles.sub}>Update your personal and {isDriver ? 'vehicle' : 'business'} details</p>
          </div>
        </div>

        {msg && (
          <div style={msg.startsWith('success') ? styles.success : styles.error}>
            <i className={`fa-solid ${msg.startsWith('success') ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ marginRight: 8 }}></i>
            {msg.replace(/^(success|error):/, '')}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>
            <h3 style={styles.sectionTitle}>
              <i className="fa-solid fa-circle-info" style={{ color: '#1E3A8A', marginRight: 8 }}></i>
              Basic Information
            </h3>
            <div style={styles.grid}>
              <div className="form-group">
                <label>Full Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" required />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City, State" required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input value={user?.email || ''} disabled style={{ background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }} />
              </div>
            </div>
          </div>

          {/* Org-specific */}
          {!isDriver && (
            <div className="card" style={{ padding: 28, marginBottom: 20 }}>
              <h3 style={styles.sectionTitle}>
                <i className="fa-solid fa-building" style={{ color: '#1E3A8A', marginRight: 8 }}></i>
                Business Details
              </h3>
              <div style={styles.grid}>
                <div className="form-group">
                  <label>Business Name</label>
                  <input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} placeholder="ABC Traders Pvt Ltd" />
                </div>
                <div className="form-group">
                  <label>GST Number</label>
                  <input value={form.gst} onChange={e => setForm({ ...form, gst: e.target.value })} placeholder="27AAPFU0939F1ZV" />
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <select value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}>
                    <option value="">Select Industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i.toLowerCase()}>{i}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Driver-specific */}
          {isDriver && (
            <div className="card" style={{ padding: 28, marginBottom: 20 }}>
              <h3 style={styles.sectionTitle}>
                <i className="fa-solid fa-truck" style={{ color: '#F97316', marginRight: 8 }}></i>
                Vehicle Details
              </h3>
              <div style={styles.grid}>
                <div className="form-group">
                  <label>License Number</label>
                  <input value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} placeholder="TN0120230012345" />
                </div>
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
                    <option value="">Select Vehicle Type</option>
                    {VEHICLE_TYPES.map(v => <option key={v} value={v.toLowerCase().replace(/\s+/g, '-')}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} placeholder="TN 01 AB 1234" />
                </div>
                <div className="form-group">
                  <label>Total Capacity (tons)</label>
                  <input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 10" />
                  {form.capacity && (
                    <div style={styles.capacityHint}>
                      <i className="fa-solid fa-circle-info" style={{ marginRight: 4, color: '#1E3A8A' }}></i>
                      {form.capacity} tons = {Number(form.capacity) * 1000} kg
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ padding: '13px 36px', fontSize: 15 }} disabled={saving}>
            <i className="fa-solid fa-floppy-disk"></i>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </main>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh' },
  main: { flex: 1, padding: '32px', background: '#f8fafc', overflowY: 'auto' },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center' },
  sub: { color: '#64748b', marginTop: 4, fontSize: 14 },
  success: { background: '#d1fae5', color: '#065f46', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center' },
  error: { background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 20, display: 'flex', alignItems: 'center' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  capacityHint: { fontSize: 12, color: '#1E3A8A', marginTop: 6, fontWeight: 600 },
  empty: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' },
};
