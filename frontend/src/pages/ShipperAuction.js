import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { auctionAPI } from '../api';

const GOODS = ['Electronics', 'Textiles', 'FMCG', 'Machinery', 'Furniture', 'Perishables', 'Chemicals', 'Other'];

function Countdown({ endTime }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) { setRemaining('Ended'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  const isUrgent = remaining !== 'Ended' && parseInt(remaining) <= 1;
  return <span style={{ color: remaining === 'Ended' ? '#94a3b8' : isUrgent ? '#ef4444' : '#F97316', fontWeight: 700 }}>
    <i className="fa-solid fa-clock" style={{ marginRight: 4 }}></i>{remaining}
  </span>;
}

const STATUS_STYLE = {
  OPEN: { bg: '#d1fae5', color: '#065f46' },
  CLOSED: { bg: '#fef3c7', color: '#92400e' },
  SELECTED: { bg: '#dbeafe', color: '#1e40af' },
  CONFIRMED: { bg: '#d1fae5', color: '#065f46' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b' },
};

export default function ShipperAuction() {
  const [auctions, setAuctions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromLocation: '', toLocation: '', weight: '', goodsType: '', description: '', auctionDuration: 10 });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [selections, setSelections] = useState({}); // { bidId: assignedWeight }
  const [submitting, setSubmitting] = useState(false);

  const [closing, setClosing] = useState(null);

  const fetchAuctions = useCallback(() => {
    auctionAPI.myAuctions().then(({ data }) => setAuctions(data)).catch(() => {});
  }, []);

  const handleClose = async (auctionId) => {
    if (!window.confirm('Close this auction now? Drivers will no longer be able to bid.')) return;
    setClosing(auctionId);
    try {
      await auctionAPI.closeAuction(auctionId);
      fetchAuctions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close auction');
    } finally { setClosing(null); }
  };

  useEffect(() => {
    fetchAuctions();
    const id = setInterval(fetchAuctions, 15000);
    return () => clearInterval(id);
  }, [fetchAuctions]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true); setMsg('');
    try {
      await auctionAPI.create(form);
      setMsg('success:Auction created! Drivers can now bid.');
      setShowForm(false);
      setForm({ fromLocation: '', toLocation: '', weight: '', goodsType: '', description: '', auctionDuration: 10 });
      fetchAuctions();
    } catch (err) {
      setMsg('error:' + (err.response?.data?.message || 'Failed'));
    } finally { setCreating(false); }
  };

  const openBids = async (auction) => {
    setSelectedAuction(auction);
    setSelections({});
    setBidsLoading(true);
    try {
      const { data } = await auctionAPI.getBids(auction._id);
      setBids(data.bids);
      setSelectedAuction(data.auction);
    } catch { setBids([]); }
    finally { setBidsLoading(false); }
  };

  const totalAssigned = Object.values(selections).reduce((s, v) => s + (Number(v) || 0), 0);

  const handleSelect = async () => {
    const sel = Object.entries(selections)
      .filter(([, w]) => Number(w) > 0)
      .map(([bidId, assignedWeight]) => ({ bidId, assignedWeight: Number(assignedWeight) }));
    if (!sel.length) return alert('Select at least one driver with weight');
    setSubmitting(true);
    try {
      await auctionAPI.selectDrivers(selectedAuction._id, { selections: sel });
      setMsg('success:Drivers selected! Waiting for their acceptance.');
      setSelectedAuction(null);
      fetchAuctions();
    } catch (err) {
      alert(err.response?.data?.message || 'Selection failed');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={styles.layout}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              <i className="fa-solid fa-gavel" style={{ color: '#F97316', marginRight: 10 }}></i>
              Auction Requests
            </h1>
            <p style={styles.sub}>Create time-bound shipment auctions and get the best bids from drivers</p>
          </div>
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setMsg(''); }}>
            <i className={`fa-solid ${showForm ? 'fa-xmark' : 'fa-plus'}`}></i>
            {showForm ? 'Cancel' : 'New Auction'}
          </button>
        </div>

        {msg && (
          <div style={msg.startsWith('success') ? styles.success : styles.error}>
            <i className={`fa-solid ${msg.startsWith('success') ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ marginRight: 8 }}></i>
            {msg.replace(/^(success|error):/, '')}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="card" style={{ padding: 28, marginBottom: 28 }}>
            <h3 style={styles.cardTitle}>
              <i className="fa-solid fa-gavel" style={{ color: '#F97316', marginRight: 8 }}></i>
              New Auction Request
            </h3>
            <form onSubmit={handleCreate}>
              <div style={styles.grid3}>
                <div className="form-group">
                  <label>From Location *</label>
                  <input value={form.fromLocation} onChange={e => setForm({ ...form, fromLocation: e.target.value })} placeholder="e.g. Chennai" required />
                </div>
                <div className="form-group">
                  <label>To Location *</label>
                  <input value={form.toLocation} onChange={e => setForm({ ...form, toLocation: e.target.value })} placeholder="e.g. Coimbatore" required />
                </div>
                <div className="form-group">
                  <label>Total Weight (kg) *</label>
                  <input type="number" min="1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 500" required />
                </div>
                <div className="form-group">
                  <label>Goods Type</label>
                  <select value={form.goodsType} onChange={e => setForm({ ...form, goodsType: e.target.value })}>
                    <option value="">Select type</option>
                    {GOODS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Auction Duration (minutes) *</label>
                  <select value={form.auctionDuration} onChange={e => setForm({ ...form, auctionDuration: Number(e.target.value) })}>
                    {[5, 10, 15, 30, 60].map(m => <option key={m} value={m}>{m} minutes</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Description (optional)</label>
                  <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Any special requirements" />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '12px 32px' }} disabled={creating}>
                <i className="fa-solid fa-gavel"></i> {creating ? 'Creating...' : 'Launch Auction'}
              </button>
            </form>
          </div>
        )}

        {/* Auctions List */}
        {auctions.length === 0 ? (
          <div style={styles.empty}>
            <i className="fa-solid fa-gavel" style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 12 }}></i>
            <p>No auctions yet. Create one to get bids from drivers.</p>
          </div>
        ) : (
          <div style={styles.auctionList}>
            {auctions.map(a => {
              const st = STATUS_STYLE[a.status] || STATUS_STYLE.CANCELLED;
              return (
                <div key={a._id} className="card" style={styles.auctionCard}>
                  <div style={styles.auctionTop}>
                    <div>
                      <div style={styles.auctionId}>{a.auctionId}</div>
                      <div style={styles.routeRow}>
                        <span style={styles.city}>{a.fromLocation}</span>
                        <i className="fa-solid fa-arrow-right" style={{ color: '#F97316' }}></i>
                        <span style={styles.city}>{a.toLocation}</span>
                      </div>
                    </div>
                    <span style={{ background: st.bg, color: st.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {a.status}
                    </span>
                  </div>

                  <div style={styles.metaRow}>
                    <span style={styles.chip}><i className="fa-solid fa-weight-hanging" style={{ marginRight: 4 }}></i>{a.weight} kg</span>
                    {a.goodsType && <span style={styles.chip}><i className="fa-solid fa-box" style={{ marginRight: 4 }}></i>{a.goodsType}</span>}
                    <span style={styles.chip}><i className="fa-solid fa-clock" style={{ marginRight: 4 }}></i>{a.auctionDuration} min auction</span>
                    {a.status === 'OPEN' && <Countdown endTime={a.auctionEndTime} />}
                    {a.status !== 'OPEN' && (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        Ended {new Date(a.auctionEndTime).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div style={styles.auctionActions}>
                    {(a.status === 'CLOSED' || a.status === 'OPEN') && (
                      <button style={styles.viewBidsBtn} onClick={() => openBids(a)}>
                        <i className="fa-solid fa-list"></i> View Bids
                      </button>
                    )}
                    {a.status === 'OPEN' && (
                      <button
                        style={styles.closeNowBtn}
                        onClick={() => handleClose(a._id)}
                        disabled={closing === a._id}
                      >
                        <i className="fa-solid fa-flag-checkered"></i>
                        {closing === a._id ? 'Closing...' : 'Close Now'}
                      </button>
                    )}
                    {a.status === 'SELECTED' && (
                      <span style={{ fontSize: 13, color: '#1e40af', fontWeight: 600 }}>
                        <i className="fa-solid fa-hourglass-half" style={{ marginRight: 6 }}></i>
                        Waiting for driver acceptance
                      </span>
                    )}
                    {a.status === 'CONFIRMED' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, color: '#065f46', fontWeight: 600 }}>
                          <i className="fa-solid fa-circle-check" style={{ marginRight: 6 }}></i>
                          Confirmed — drivers accepted
                        </span>
                        <Link to={`/tracking?id=${a.auctionId}`}>
                          <button style={styles.trackBtn}>
                            <i className="fa-solid fa-location-dot"></i> Track
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bids Modal */}
        {selectedAuction && (
          <div style={styles.modalOverlay} onClick={() => setSelectedAuction(null)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  <i className="fa-solid fa-list" style={{ color: '#1E3A8A', marginRight: 8 }}></i>
                  Bids — {selectedAuction.fromLocation} → {selectedAuction.toLocation}
                </h3>
                <button style={styles.closeBtn} onClick={() => setSelectedAuction(null)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                Total weight: <strong>{selectedAuction.weight} kg</strong> &nbsp;·&nbsp;
                Status: <strong>{selectedAuction.status}</strong>
              </p>

              {bidsLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: '#cbd5e1' }}></i>
                </div>
              ) : bids.length === 0 ? (
                <div style={styles.empty}>
                  <i className="fa-solid fa-inbox" style={{ fontSize: 36, color: '#cbd5e1', marginBottom: 8 }}></i>
                  <p>No bids yet.</p>
                </div>
              ) : (
                <>
                  <div style={styles.bidsTable}>
                    <div style={styles.bidsHead}>
                      <span>Driver</span><span>Rating</span><span>₹/kg</span><span>Total</span>
                      {selectedAuction.status === 'CLOSED' && <span>Assign (kg)</span>}
                    </div>
                    {bids.map((bid, i) => (
                      <div key={bid._id} style={{ ...styles.bidRow, background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{bid.driver?.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{bid.driver?.vehicleType} · {bid.driver?.vehicleNumber}</div>
                        </div>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                          {bid.driver?.rating > 0 ? `⭐ ${bid.driver.rating}` : 'New'}
                        </span>
                        <span style={{ fontWeight: 700, color: '#1E3A8A' }}>₹{bid.pricePerKg}</span>
                        <span style={{ fontWeight: 600 }}>₹{bid.totalPrice?.toLocaleString()}</span>
                        {selectedAuction.status === 'CLOSED' && (
                          <input
                            type="number"
                            min="0"
                            max={selectedAuction.weight}
                            placeholder="0"
                            value={selections[bid._id] || ''}
                            onChange={e => setSelections(prev => ({ ...prev, [bid._id]: e.target.value }))}
                            style={styles.weightInput}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedAuction.status === 'CLOSED' && (
                    <div style={styles.selectionFooter}>
                      <div style={styles.weightSummary}>
                        <span>Assigned: <strong style={{ color: totalAssigned > selectedAuction.weight ? '#ef4444' : '#1E3A8A' }}>{totalAssigned} kg</strong></span>
                        <span>/ {selectedAuction.weight} kg total</span>
                        {totalAssigned > selectedAuction.weight && (
                          <span style={{ color: '#ef4444', fontSize: 12 }}>
                            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }}></i>
                            Exceeds total weight!
                          </span>
                        )}
                      </div>
                      <button
                        className="btn-primary"
                        style={{ padding: '10px 24px' }}
                        onClick={handleSelect}
                        disabled={submitting || totalAssigned === 0 || totalAssigned > selectedAuction.weight}
                      >
                        <i className="fa-solid fa-check"></i>
                        {submitting ? 'Selecting...' : 'Confirm Selection'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
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
  title: { fontSize: 26, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center' },
  sub: { color: '#64748b', marginTop: 4, fontSize: 14 },
  success: { background: '#d1fae5', color: '#065f46', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center' },
  error: { background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 20, display: 'flex', alignItems: 'center' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 },
  empty: { textAlign: 'center', padding: '48px 20px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  auctionList: { display: 'flex', flexDirection: 'column', gap: 16 },
  auctionCard: { padding: 24 },
  auctionTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  auctionId: { fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4, letterSpacing: '0.5px' },
  routeRow: { display: 'flex', alignItems: 'center', gap: 10 },
  city: { fontSize: 18, fontWeight: 700, color: '#1e293b' },
  metaRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 },
  chip: { background: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center' },
  auctionActions: { display: 'flex', gap: 10, alignItems: 'center' },
  viewBidsBtn: { padding: '8px 18px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: 6 },
  trackBtn: { padding: '8px 18px', border: 'none', borderRadius: 8, background: '#1E3A8A', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  closeNowBtn: { padding: '8px 18px', border: 'none', borderRadius: 8, background: '#fee2e2', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 680, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 17, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b', padding: 4 },
  bidsTable: { border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 16 },
  bidsHead: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8, padding: '10px 16px', background: '#f1f5f9', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' },
  bidRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8, padding: '12px 16px', alignItems: 'center', fontSize: 14, borderTop: '1px solid #f1f5f9' },
  weightInput: { width: '80px', padding: '6px 8px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 13, outline: 'none' },
  selectionFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 12 },
  weightSummary: { display: 'flex', gap: 12, alignItems: 'center', fontSize: 14, color: '#475569', flexWrap: 'wrap' },
};
