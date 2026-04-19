import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';

function FileUpload({ label, name, accept, required, onChange, preview }) {
  return (
    <div className="form-group">
      <label>{label}{required && ' *'}</label>
      <div style={styles.fileWrap}>
        <label style={styles.fileLabel}>
          <i className="fa-solid fa-upload" style={{ marginRight: 6, color: '#c2410c' }}></i>
          {preview ? 'Change file' : 'Choose file'}
          <input type="file" name={name} accept={accept} onChange={onChange} style={{ display: 'none' }} required={required} />
        </label>
        {preview && (
          <span style={styles.fileName}>
            <i className="fa-solid fa-circle-check" style={{ color: '#22c55e', marginRight: 4 }}></i>
            {preview}
          </span>
        )}
        {!preview && <span style={styles.fileHint}>JPG, PNG or PDF · Max 5MB</span>}
      </div>
    </div>
  );
}

export default function DriverRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', location: '', licenseNumber: '', vehicleType: '', vehicleNumber: '', capacity: '', password: '', confirm: '' });
  const [files, setFiles] = useState({ licenseDoc: null, insuranceDoc: null, aadharDoc: null });
  const [previews, setPreviews] = useState({ licenseDoc: '', insuranceDoc: '', aadharDoc: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    const { name, files: f } = e.target;
    if (f[0]) {
      setFiles(prev => ({ ...prev, [name]: f[0] }));
      setPreviews(prev => ({ ...prev, [name]: f[0].name }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (!files.licenseDoc) return setError('Driving license document is required');
    if (!files.insuranceDoc) return setError('Vehicle insurance document is required');
    if (!files.aadharDoc) return setError('Aadhar card is required');
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (k !== 'confirm') fd.append(k, v); });
      fd.append('licenseDoc', files.licenseDoc);
      fd.append('insuranceDoc', files.insuranceDoc);
      fd.append('aadharDoc', files.aadharDoc);

      const { data } = await authAPI.registerDriver(fd);
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
          <i className="fa-solid fa-truck-moving" style={{ marginRight: 6 }}></i>
          Driver Registration
        </div>
        <h2 style={styles.title}>Create Driver Account</h2>
        <p style={styles.sub}>Register as a driver to start accepting loads</p>

        {error && <div style={styles.error}><i className="fa-solid fa-circle-xmark" style={{ marginRight: 8 }}></i>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div style={styles.row}>
            <div className="form-group">
              <label>Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Ravi Kumar" required />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" required />
            </div>
          </div>
          <div style={styles.row}>
            <div className="form-group">
              <label>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="driver@email.com" required />
            </div>
            <div className="form-group">
              <label>Base Location *</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="Chennai, Tamil Nadu" required />
            </div>
          </div>
          <div style={styles.row}>
            <div className="form-group">
              <label>Driving License Number *</label>
              <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} placeholder="TN0120230012345" required />
            </div>
            <div className="form-group">
              <label>Vehicle Type *</label>
              <select name="vehicleType" value={form.vehicleType} onChange={handleChange} required>
                <option value="">Select Vehicle Type</option>
                <option value="mini-truck">Mini Truck (1–2 ton)</option>
                <option value="medium-truck">Medium Truck (5–10 ton)</option>
                <option value="heavy-truck">Heavy Truck (10–20 ton)</option>
                <option value="trailer">Trailer / Container</option>
                <option value="tanker">Tanker</option>
              </select>
            </div>
          </div>
          <div style={styles.row}>
            <div className="form-group">
              <label>Vehicle Number *</label>
              <input name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange} placeholder="TN 01 AB 1234" required />
            </div>
            <div className="form-group">
              <label>Load Capacity (tons) *</label>
              <input name="capacity" value={form.capacity} onChange={handleChange} placeholder="e.g. 10" required />
            </div>
          </div>

          {/* KYC Section */}
          <div style={styles.kycSection}>
            <div style={styles.kycHeader}>
              <i className="fa-solid fa-id-card" style={{ color: '#c2410c', marginRight: 8 }}></i>
              KYC Verification Documents
            </div>
            <p style={styles.kycNote}>Both documents are mandatory. Upload clear scans or photos (JPG, PNG, PDF · max 1MB each)</p>
            <div style={styles.row}>
              <FileUpload
                label="Driving License"
                name="licenseDoc"
                accept=".jpg,.jpeg,.png,.pdf"
                required
                onChange={handleFile}
                preview={previews.licenseDoc}
              />
              <FileUpload
                label="Vehicle Insurance"
                name="insuranceDoc"
                accept=".jpg,.jpeg,.png,.pdf"
                required
                onChange={handleFile}
                preview={previews.insuranceDoc}
              />
            </div>
            <div style={styles.row}>
              <FileUpload
                label="Aadhar Card"
                name="aadharDoc"
                accept=".jpg,.jpeg,.png,.pdf"
                required
                onChange={handleFile}
                preview={previews.aadharDoc}
              />
              <div />
            </div>
            <div style={styles.kycExamples}>
              <i className="fa-solid fa-circle-info" style={{ color: '#64748b', marginRight: 6 }}></i>
              License: Front & back scan · Insurance: Valid policy document with vehicle number
            </div>
          </div>

          {/* Password */}
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

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16, background: '#F97316' }} disabled={loading}>
            {loading ? 'Creating Account...' : <><i className="fa-solid fa-truck-moving"></i> Create Driver Account</>}
          </button>
        </form>

        <p style={styles.footer}>
          Are you an organization? <Link to="/register/organization" style={styles.link}>Register as Org</Link>
          {' · '}
          <Link to="/login" style={styles.link}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'url("https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1600&q=80") center/cover no-repeat', padding: '40px 16px' },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.62)' },
  card: { position: 'relative', background: 'white', borderRadius: 20, padding: '40px', width: '100%', maxWidth: 720, boxShadow: '0 30px 60px rgba(0,0,0,0.3)' },
  logo: { textDecoration: 'none', fontSize: 22, fontWeight: 800, color: '#1E3A8A', display: 'flex', alignItems: 'center', marginBottom: 16 },
  badge: { display: 'inline-block', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 6 },
  sub: { color: '#64748b', marginBottom: 24, fontSize: 15 },
  error: { background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  kycSection: { background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, padding: '20px', marginBottom: 20 },
  kycHeader: { fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6, display: 'flex', alignItems: 'center' },
  kycNote: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  kycExamples: { fontSize: 12, color: '#64748b', marginTop: 8, display: 'flex', alignItems: 'flex-start' },
  fileWrap: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  fileLabel: { display: 'inline-flex', alignItems: 'center', padding: '8px 16px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#c2410c', whiteSpace: 'nowrap' },
  fileName: { fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center' },
  fileHint: { fontSize: 11, color: '#94a3b8' },
  footer: { textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 14 },
  link: { color: '#F97316', fontWeight: 600, textDecoration: 'none' },
};
