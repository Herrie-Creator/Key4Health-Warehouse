import React, { useState } from 'react';
import { useApp, WRITEOFF_REASONS } from '../contexts/AppContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ScannerInput, ExpiryBadge, SearchBar } from '../components/UI.jsx';
import { ScanLine, CheckCircle, AlertTriangle, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function WriteOff() {
  const { products, batches, writeoffs, writeOff, findByBarcode,
          getProductStock, getExpiryStatus, toast } = useApp();
  const { currentUser } = useAuth();

  const [tab,       setTab]       = useState('write-off'); // write-off | history
  const [step,      setStep]      = useState('scan');      // scan | select-batch | reason | confirm | done
  const [scanned,   setScanned]   = useState(null);
  const [selBatch,  setSelBatch]  = useState(null);
  const [reason,    setReason]    = useState(null);
  const [qty,       setQty]       = useState('');
  const [note,      setNote]      = useState('');
  const [search,    setSearch]    = useState('');

  const handleScan = (barcode) => {
    const prod = findByBarcode(barcode);
    if (!prod) { toast(`Barcode not found: ${barcode}`, 'error'); return; }
    const avail = getProductStock(prod.id);
    if (avail <= 0) { toast(`No stock for ${prod.name}`, 'error'); return; }
    setScanned(prod);
    setSelBatch(null); setReason(null); setQty(''); setNote('');
    setStep('select-batch');
  };

  const handleConfirm = () => {
    if (!selBatch || !reason || !qty) return;
    writeOff({
      productId:   scanned.id,
      batchId:     selBatch.id,
      qty,
      reason:      reason.id,
      reasonLabel: reason.label,
      note,
    }, currentUser.id);
    setStep('done');
    setTimeout(() => { setStep('scan'); setScanned(null); setSelBatch(null); setReason(null); setQty(''); setNote(''); }, 2500);
  };

  const cancel = () => { setStep('scan'); setScanned(null); setSelBatch(null); setReason(null); setQty(''); setNote(''); };

  const totalLossAllTime = writeoffs.reduce((s, w) => s + (w.totalLoss || 0), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const lossThisMonth = writeoffs.filter(w => w.date?.startsWith(thisMonth)).reduce((s, w) => s + (w.totalLoss || 0), 0);

  const filteredHistory = writeoffs.filter(w => {
    if (!search) return true;
    const prod = products.find(p => p.id === w.productId);
    return prod?.name?.toLowerCase().includes(search.toLowerCase())
      || w.reasonLabel?.toLowerCase().includes(search.toLowerCase())
      || w.batchNumber?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1 className="page-title">Write-Off / Damage Log</h1>
        <p className="page-sub">Record damaged, expired, or lost stock and remove it from inventory</p>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'write-off' ? 'active' : ''}`} onClick={() => { setTab('write-off'); cancel(); }}>
          Write Off Stock
        </button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          Write-Off History ({writeoffs.length})
        </button>
      </div>

      {/* ── WRITE OFF TAB ─────────────────────────────────────────────── */}
      {tab === 'write-off' && (
        <>
          {/* SCAN */}
          {step === 'scan' && (
            <>
              <div className="card" style={{ padding: 28, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ background: 'var(--red-bg)', borderRadius: 8, padding: 8 }}>
                    <Trash2 size={20} color="var(--red)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>Scan Product to Write Off</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>Supports all barcode formats · Select batch and reason after scanning</div>
                  </div>
                </div>
                <ScannerInput onScan={handleScan} placeholder="Scan barcode or type and press Enter…" />
              </div>

              {/* Quick product list — highlight expired/damaged candidates */}
              <div className="card">
                <div className="card-header">
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Stock — tap to write off</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border2)' }}>
                  {products.map(p => {
                    const qty         = getProductStock(p.id);
                    const prodBatches = batches.filter(b => b.productId === p.id && b.qty > 0);
                    const hasExpired  = prodBatches.some(b => getExpiryStatus(b.expiryDate).status === 'expired');
                    return (
                      <button key={p.id} disabled={qty <= 0} onClick={() => handleScan(p.barcode)} style={{
                        background: hasExpired ? 'rgba(248,81,73,0.06)' : 'var(--surface)',
                        padding: '13px 16px', border: 'none',
                        cursor: qty <= 0 ? 'not-allowed' : 'pointer',
                        textAlign: 'left', opacity: qty <= 0 ? 0.4 : 1,
                        borderLeft: hasExpired ? '3px solid var(--red)' : '3px solid transparent',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{p.name.length > 28 ? p.name.slice(0, 28) + '…' : p.name}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: qty <= 0 ? 'var(--text3)' : 'var(--text2)' }}>{qty}</span>
                        </div>
                        {hasExpired && <span className="badge badge-red" style={{ fontSize: 9, marginTop: 4 }}>⚠️ Expired batch</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* SELECT BATCH */}
          {step === 'select-batch' && scanned && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div style={{ fontWeight: 600 }}>Select Batch to Write Off</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{scanned.name}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={cancel}>Cancel</button>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {batches
                  .filter(b => b.productId === scanned.id && b.qty > 0)
                  .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
                  .map(b => {
                    const ex = getExpiryStatus(b.expiryDate);
                    const isSelected = selBatch?.id === b.id;
                    return (
                      <button key={b.id} onClick={() => setSelBatch(b)} style={{
                        background: isSelected ? 'rgba(248,81,73,0.1)' : 'var(--surface2)',
                        border: `2px solid ${isSelected ? 'var(--red)' : 'var(--border)'}`,
                        borderRadius: 8, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{b.batchNumber}</div>
                            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
                              {b.qty} units available · Location: {b.location || '—'} · Received: {b.receivedDate ? format(new Date(b.receivedDate), 'dd MMM yyyy') : '—'}
                            </div>
                          </div>
                          <ExpiryBadge expiryDate={b.expiryDate} />
                        </div>
                      </button>
                    );
                  })}
              </div>
              <div style={{ padding: '0 20px 20px' }}>
                <button className="btn btn-primary btn-lg w-full" style={{ justifyContent: 'center' }}
                  disabled={!selBatch} onClick={() => setStep('reason')}>
                  Next — Select Reason
                </button>
              </div>
            </div>
          )}

          {/* SELECT REASON + QTY */}
          {step === 'reason' && scanned && selBatch && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div style={{ fontWeight: 600 }}>Write-Off Details</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    {scanned.name} · Batch <span className="mono">{selBatch.batchNumber}</span> · {selBatch.qty} units available
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={cancel}>Cancel</button>
              </div>
              <div style={{ padding: 20 }}>
                <div className="form-label" style={{ marginBottom: 10 }}>Reason for Write-Off *</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                  {WRITEOFF_REASONS.map(r => (
                    <button key={r.id} onClick={() => setReason(r)} style={{
                      background: reason?.id === r.id ? 'rgba(248,81,73,0.12)' : 'var(--surface2)',
                      border: `2px solid ${reason?.id === r.id ? 'var(--red)' : 'var(--border)'}`,
                      borderRadius: 8, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.12s',
                    }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{r.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: reason?.id === r.id ? 'var(--red)' : 'var(--text)' }}>
                        {r.label}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="grid-2" style={{ marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Quantity to Write Off *</label>
                    <input className="form-input" type="number" min="1" max={selBatch.qty}
                      value={qty} onChange={e => setQty(e.target.value)}
                      placeholder={`Max: ${selBatch.qty}`} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estimated Loss</label>
                    <div className="form-input" style={{ color: 'var(--red)', fontWeight: 700, background: 'var(--red-bg)' }}>
                      {qty && selBatch.costPrice
                        ? `R ${(parseInt(qty) * parseFloat(selBatch.costPrice)).toFixed(2)}`
                        : '—'}
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">Additional Notes</label>
                  <input className="form-input" value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Describe the damage, circumstances, etc." />
                </div>

                <button className="btn btn-lg w-full"
                  style={{ justifyContent: 'center', background: reason && qty ? 'var(--red)' : 'var(--surface2)', color: reason && qty ? '#fff' : 'var(--text3)', fontWeight: 700 }}
                  disabled={!reason || !qty}
                  onClick={() => setStep('confirm')}>
                  Review Write-Off
                </button>
              </div>
            </div>
          )}

          {/* CONFIRM */}
          {step === 'confirm' && scanned && selBatch && reason && (
            <div className="card" style={{ borderColor: 'rgba(248,81,73,0.4)' }}>
              <div style={{ padding: '20px 24px', background: 'rgba(248,81,73,0.06)', borderBottom: '1px solid var(--border2)', borderRadius: '12px 12px 0 0' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--red)', marginBottom: 4 }}>
                  {reason.icon} Confirm Write-Off
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>Review before removing stock permanently</div>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  {[
                    ['Product',       scanned.name],
                    ['Batch',         selBatch.batchNumber],
                    ['Reason',        `${reason.icon} ${reason.label}`],
                    ['Quantity',      `${qty} ${scanned.unit || 'units'}`],
                    ['Location',      selBatch.location || '—'],
                    ['Expiry',        selBatch.expiryDate ? format(new Date(selBatch.expiryDate), 'dd MMM yyyy') : '—'],
                    ['Cost Price',    selBatch.costPrice ? `R ${parseFloat(selBatch.costPrice).toFixed(2)} / unit` : '—'],
                    ['Total Loss',    selBatch.costPrice ? `R ${(parseInt(qty) * parseFloat(selBatch.costPrice)).toFixed(2)}` : '—'],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {note && (
                  <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--text2)' }}>
                    📝 {note}
                  </div>
                )}
                <div className="alert alert-danger" style={{ marginBottom: 20 }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  This will permanently remove <strong>{qty} unit{parseInt(qty) > 1 ? 's' : ''}</strong> from batch <strong className="mono">{selBatch.batchNumber}</strong>. This action cannot be undone.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary btn-lg" onClick={() => setStep('reason')} style={{ flex: 1, justifyContent: 'center' }}>
                    Back
                  </button>
                  <button className="btn btn-lg" onClick={handleConfirm}
                    style={{ flex: 2, justifyContent: 'center', background: 'var(--red)', color: '#fff', fontWeight: 700 }}>
                    Confirm Write-Off
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ color: 'var(--red)', marginBottom: 12 }}><CheckCircle size={56} /></div>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Write-Off Recorded</h2>
              <p style={{ color: 'var(--text2)', marginTop: 8 }}>Stock removed from inventory and logged.</p>
            </div>
          )}
        </>
      )}

      {/* ── HISTORY TAB ───────────────────────────────────────────────── */}
      {tab === 'history' && (
        <>
          {/* Summary */}
          <div className="grid-3" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-label">Write-Offs This Month</div>
              <div className="stat-value" style={{ color: 'var(--red)' }}>
                {writeoffs.filter(w => w.date?.startsWith(thisMonth)).length}
              </div>
              <div className="stat-sub">incidents recorded</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Loss This Month</div>
              <div className="stat-value" style={{ color: 'var(--red)', fontSize: 22 }}>
                R{lossThisMonth.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="stat-sub">at cost price</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Loss (All Time)</div>
              <div className="stat-value" style={{ fontSize: 22 }}>
                R{totalLossAllTime.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="stat-sub">{writeoffs.length} total write-offs</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search product, batch, reason…" />
          </div>

          {filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No write-offs recorded</h3>
              <p style={{ fontSize: 13 }}>Write-offs will appear here when stock is damaged, expired, or lost.</p>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>Batch</th>
                      <th>Qty</th>
                      <th>Reason</th>
                      <th>Loss (R)</th>
                      <th>Note</th>
                      <th>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map(w => {
                      const prod    = products.find(p => p.id === w.productId);
                      const reason  = WRITEOFF_REASONS.find(r => r.id === w.reason);
                      const user    = [];
                      return (
                        <tr key={w.id}>
                          <td style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                            {w.date ? format(new Date(w.date), 'dd/MM/yy HH:mm') : '—'}
                          </td>
                          <td style={{ fontSize: 12, fontWeight: 500 }}>{prod?.name?.slice(0, 28) || w.productId}</td>
                          <td className="mono" style={{ fontSize: 11 }}>{w.batchNumber}</td>
                          <td style={{ fontWeight: 700, color: 'var(--red)' }}>-{w.qty}</td>
                          <td>
                            <span style={{ fontSize: 12 }}>{reason?.icon} {w.reasonLabel}</span>
                          </td>
                          <td style={{ color: 'var(--red)', fontWeight: 600, fontSize: 12 }}>
                            {w.totalLoss ? `R ${w.totalLoss.toFixed(2)}` : '—'}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {w.note || '—'}
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--text3)' }}>{w.userId?.slice(0, 4)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const thisMonth = new Date().toISOString().slice(0, 7);
