import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function OrgRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', location: '', businessName: '', gst: '', industry: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setLoading(true); setError('');
    try {
      const { data } = await authAPI.registerOrg(form);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.overlay} />
      <div style={styles.card} className="fade-in">
        <Link to="/" style={styles.logo}>
          <i className="fa-solid fa-truck" style={{ color: '#F97316', marginRight: 8 }}></i>
          Nool<span style={{ color: '#F97316' }}>-Vazhi</span>
        </Link>
        <div style={styles.badge}>
          <i className="fa-solid fa-building" style={{ marginRight: 6 }}></i>
          Organization Registration
        </div>
        <h2 style={styles.title}>Create Organization Account</h2>
        <p style={styles.sub}>Register your business to start booking shipments</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div className="form-group">
              <label>Contact Person *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
            </div>
            <div className="form-group">
              <label>Business Name *</label>
              <input name="businessName" value={form.businessName} onChange={handleChange} placeholder="ABC Traders Pvt Ltd" required />
            </div>
          </div>
          <div style={styles.row}>
            <div className="form-group">
              <label>Phone *</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@company.com" required />
            </div>
          </div>
          <div style={styles.row}>
            <div className="form-group">
              <label>Location *</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="Mumbai, Maharashtra" required />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <select name="industry" value={form.industry} onChange={handleChange}>
                <option value="">Select Industry</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="retail">Retail / E-commerce</option>
                <option value="agriculture">Agriculture</option>
                <option value="construction">Construction</option>
                <option value="pharma">Pharma / Healthcare</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>GST Number (Optional)</label>
            <input name="gst" value={form.gst} onChange={handleChange} placeholder="27AAPFU0939F1ZV" />
          </div>
          <div style={styles.row}>
            <div className="form-group">
              <label>Password *</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 8 characters" required />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <input name="confirm" type="password" value={form.confirm} onChange={handleChange} placeholder="Repeat password" required />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16 }} disabled={loading}>
            {loading ? 'Creating Account...' : <><i className="fa-solid fa-building"></i> Create Organization Account</>}
          </button>
        </form>

        <p style={styles.footer}>
          Are you a driver? <Link to="/register/driver" style={styles.link}>Register as Driver</Link>
          {' · '}
          <Link to="/login" style={styles.link}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=80") center/cover no-repeat', padding: '40px 16px' },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.60)' },
  card: { position: 'relative', background: 'white', borderRadius: 20, padding: '40px', width: '100%', maxWidth: 680, boxShadow: '0 30px 60px rgba(0,0,0,0.3)' },
  logo: { textDecoration: 'none', fontSize: 22, fontWeight: 800, color: '#1E3A8A', display: 'block', marginBottom: 16 },
  badge: { display: 'inline-block', background: '#eff6ff', color: '#1E3A8A', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 6 },
  sub: { color: '#64748b', marginBottom: 24, fontSize: 15 },
  error: { background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  footer: { textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 14 },
  link: { color: '#F97316', fontWeight: 600, textDecoration: 'none' },
};
