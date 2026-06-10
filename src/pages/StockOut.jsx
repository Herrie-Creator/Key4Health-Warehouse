import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ScannerInput, ExpiryBadge } from '../components/UI.jsx';
import { ScanLine, CheckCircle, AlertTriangle, AlertOctagon, ArrowRight, Info } from 'lucide-react';
import { format } from 'date-fns';

export default function StockOut() {
  const { products, batches, vehicles, stockOut, findByBarcode,
          getProductStock, getExpiryStatus, checkFEFO, toast } = useApp();
  const { currentUser } = useAuth();

  const [scanned,    setScanned]    = useState(null);
  const [form,       setForm]       = useState({});
  const [step,       setStep]       = useState('scan');      // scan | fefo-warn | detail | done
  const [fefoWarn,   setFefoWarn]   = useState(null);        // FEFO warning data
  const [fefoAck,    setFefoAck]    = useState(false);       // manager acknowledged

  const handleScan = (barcode) => {
    const prod = findByBarcode(barcode);
    if (!prod) { toast(`Barcode not found: ${barcode}`, 'error'); return; }

    const qty = getProductStock(prod.id);
    if (qty <= 0) { toast(`No stock available for ${prod.name}`, 'error'); return; }

    const fefo = checkFEFO(prod.id);
    setScanned(prod);
    setForm({ productId: prod.id, qty: '', reference: '', note: '', vehicleId: '', deliveryNote: '', customer: '' });

    // Check FEFO warnings
    if (fefo) {
      if (fefo.hasExpired) {
        // Expired stock in warehouse — hard warning
        setFefoWarn({ type: 'expired', fefo });
        setStep('fefo-warn');
        return;
      }
      if (fefo.nextStatus.status === 'critical') {
        // Next batch expiring within 14 days — soft warning
        setFefoWarn({ type: 'critical', fefo });
        setStep('fefo-warn');
        return;
      }
    }

    setFefoWarn(null);
    setStep('detail');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const avail = getProductStock(scanned.id);
    if (parseInt(form.qty) > avail) { toast(`Only ${avail} units available`, 'error'); return; }
    if (!form.qty || parseInt(form.qty) < 1) { toast('Enter a valid quantity', 'error'); return; }
    stockOut(form, currentUser.id);
    setStep('done');
    setTimeout(() => { setStep('scan'); setScanned(null); setFefoWarn(null); setFefoAck(false); }, 2200);
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const productBatches = scanned
    ? batches.filter(b => b.productId === scanned.id && b.qty > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    : [];

  const cancel = () => { setStep('scan'); setScanned(null); setFefoWarn(null); setFefoAck(false); };

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1 className="page-title">Stock Out</h1>
        <p className="page-sub">Scan to dispatch · FEFO enforced · Expired stock flagged automatically</p>
      </div>

      {/* ── STEP: SCAN ──────────────────────────────────────────────────── */}
      {step === 'scan' && (
        <>
          <div className="card" style={{ padding: 28, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'var(--amber-bg)', borderRadius: 8, padding: 8 }}>
                <ScanLine size={20} color="var(--amber)" />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Scan to Dispatch</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>FEFO auto-selected · Expired batches blocked with manager alert</div>
              </div>
            </div>
            <ScannerInput onScan={handleScan} placeholder="Scan product barcode or type and press Enter…" />
          </div>

          {/* Quick product grid */}
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 600, fontSize: 14 }}>Available Stock — tap to dispatch</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border2)' }}>
              {products.map(p => {
                const qty          = getProductStock(p.id);
                const prodBatches  = batches.filter(b => b.productId === p.id && b.qty > 0)
                  .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
                const nextExpiry   = prodBatches[0];
                const expStatus    = nextExpiry ? getExpiryStatus(nextExpiry.expiryDate) : null;
                const hasExpired   = prodBatches.some(b => getExpiryStatus(b.expiryDate).status === 'expired');

                return (
                  <button key={p.id}
                    disabled={qty <= 0}
                    onClick={() => handleScan(p.barcode)}
                    style={{
                      background: hasExpired ? 'rgba(248,81,73,0.06)' : 'var(--surface)',
                      padding: '14px 16px', border: 'none',
                      cursor: qty <= 0 ? 'not-allowed' : 'pointer',
                      textAlign: 'left', opacity: qty <= 0 ? 0.4 : 1,
                      borderLeft: hasExpired ? '3px solid var(--red)' : '3px solid transparent',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', flex: 1, paddingRight: 8 }}>
                        {p.name.length > 28 ? p.name.slice(0, 28) + '…' : p.name}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: qty <= 0 ? 'var(--red)' : qty <= p.minStock ? 'var(--amber)' : 'var(--green)', flexShrink: 0 }}>{qty}</span>
                    </div>
                    <div style={{ marginTop: 5, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {hasExpired && <span className="badge badge-red" style={{ fontSize: 9 }}>⚠️ Expired batch</span>}
                      {!hasExpired && expStatus && expStatus.status !== 'ok' && (
                        <span className={`badge ${expStatus.cls}`} style={{ fontSize: 9 }}>{expStatus.label}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── STEP: FEFO WARNING ──────────────────────────────────────────── */}
      {step === 'fefo-warn' && fefoWarn && scanned && (
        <FEFOWarning
          product={scanned}
          warn={fefoWarn}
          getExpiryStatus={getExpiryStatus}
          onProceed={() => setStep('detail')}
          onCancel={cancel}
          currentUser={currentUser}
        />
      )}

      {/* ── STEP: DETAIL FORM ───────────────────────────────────────────── */}
      {step === 'detail' && scanned && (
        <div className="card">
          {/* Product header */}
          <div className="card-header">
            <div>
              <div style={{ fontWeight: 600 }}>
                Dispatching: <span style={{ color: 'var(--amber)' }}>{scanned.name}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                Available: <strong>{getProductStock(scanned.id)} units</strong>
                {fefoWarn && fefoWarn.type === 'critical' && (
                  <span style={{ marginLeft: 10, color: 'var(--amber)', fontWeight: 600 }}>
                    ⚡ Critical expiry — acknowledged
                  </span>
                )}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={cancel}>Cancel</button>
          </div>

          {/* FEFO batch order strip */}
          {productBatches.length > 0 && (
            <div style={{ padding: '10px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border2)' }}>
              <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                FEFO Dispatch Order
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {productBatches.map((b, i) => {
                  const ex = getExpiryStatus(b.expiryDate);
                  return (
                    <div key={b.id} style={{
                      background: i === 0 ? 'rgba(63,185,80,0.1)' : 'var(--surface)',
                      border: `1px solid ${i === 0 ? 'rgba(63,185,80,0.3)' : 'var(--border)'}`,
                      borderRadius: 6, padding: '5px 10px', fontSize: 11,
                    }}>
                      <span style={{ color: 'var(--text3)', marginRight: 3 }}>#{i + 1}</span>
                      <span className="mono">{b.batchNumber}</span>
                      <span style={{ margin: '0 4px', color: 'var(--text3)' }}>·</span>
                      <strong>{b.qty}</strong>
                      <span style={{ margin: '0 4px', color: 'var(--text3)' }}>·</span>
                      <span className={ex.status === 'expired' ? 'text-red' : ex.status === 'critical' ? 'text-amber' : 'text-muted'}
                        style={{ fontSize: 11 }}>{ex.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="card-body">
              <div className="grid-2" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Quantity to Dispatch *</label>
                  <input className="form-input" type="number" min="1" max={getProductStock(scanned.id)}
                    value={form.qty || ''} onChange={e => f('qty', e.target.value)}
                    placeholder="0" required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Sales Order / Reference</label>
                  <input className="form-input mono" value={form.reference || ''}
                    onChange={e => f('reference', e.target.value)} placeholder="SO-001" />
                </div>
              </div>
              <div className="grid-2" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Customer / Destination</label>
                  <input className="form-input" value={form.customer || ''}
                    onChange={e => f('customer', e.target.value)} placeholder="e.g. Woolworths Rosebank" />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Note No.</label>
                  <input className="form-input mono" value={form.deliveryNote || ''}
                    onChange={e => f('deliveryNote', e.target.value)} placeholder="DN-001" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Assign to Vehicle / Driver</label>
                <select className="form-select" value={form.vehicleId || ''} onChange={e => f('vehicleId', e.target.value)}>
                  <option value="">— No vehicle / walk-in —</option>
                  {vehicles.filter(v => v.active).map(v => (
                    <option key={v.id} value={v.id}>{v.registration} · {v.make} {v.model} · {v.driver}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" value={form.note || ''}
                  onChange={e => f('note', e.target.value)} placeholder="Optional notes…" />
              </div>
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-lg w-full"
                style={{ justifyContent: 'center', background: 'var(--amber)', color: '#000', fontWeight: 700 }}>
                Confirm Dispatch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── STEP: DONE ──────────────────────────────────────────────────── */}
      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ color: 'var(--amber)', marginBottom: 12 }}><CheckCircle size={56} /></div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Stock Dispatched!</h2>
          <p style={{ color: 'var(--text2)', marginTop: 8 }}>Returning to scanner…</p>
        </div>
      )}
    </div>
  );
}

// ── FEFO Warning modal-style screen ───────────────────────────────────────
function FEFOWarning({ product, warn, getExpiryStatus, onProceed, onCancel, currentUser }) {
  const isExpired  = warn.type === 'expired';
  const isCritical = warn.type === 'critical';
  const isManager  = currentUser?.role === 'manager';
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="card" style={{ borderColor: isExpired ? 'rgba(248,81,73,0.5)' : 'rgba(210,153,34,0.5)' }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14,
        background: isExpired ? 'rgba(248,81,73,0.08)' : 'rgba(210,153,34,0.08)',
        borderBottom: '1px solid var(--border2)', borderRadius: '12px 12px 0 0',
      }}>
        <div style={{
          background: isExpired ? 'var(--red-bg)' : 'var(--amber-bg)',
          borderRadius: 10, padding: 10,
        }}>
          {isExpired
            ? <AlertOctagon size={24} color="var(--red)" />
            : <AlertTriangle size={24} color="var(--amber)" />}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: isExpired ? 'var(--red)' : 'var(--amber)' }}>
            {isExpired ? '⛔ Expired Stock Detected' : '⚡ Critical Expiry Warning'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{product.name}</div>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {/* Expired batch list */}
        {isExpired && (
          <>
            <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--text)' }}>
              <strong style={{ color: 'var(--red)' }}>{warn.fefo.expiredBatches.length} expired batch{warn.fefo.expiredBatches.length > 1 ? 'es' : ''}</strong> are currently in the warehouse.
              These <strong>must be written off or quarantined</strong> before dispatching good stock.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {warn.fefo.expiredBatches.map(b => {
                const ex = getExpiryStatus(b.expiryDate);
                return (
                  <div key={b.id} style={{
                    background: 'var(--red-bg)', border: '1px solid rgba(248,81,73,0.25)',
                    borderRadius: 8, padding: '12px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }} className="mono">{b.batchNumber}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                        {b.qty} units · Location: {b.location || '—'} · Expiry: {format(new Date(b.expiryDate), 'dd MMM yyyy')}
                      </div>
                    </div>
                    <span className="badge badge-red">{ex.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Good batches that SHOULD go out */}
            {warn.fefo.allBatches.filter(b => getExpiryStatus(b.expiryDate).status !== 'expired').length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Valid stock available after expired batches are cleared:
                </div>
                {warn.fefo.allBatches
                  .filter(b => getExpiryStatus(b.expiryDate).status !== 'expired')
                  .map(b => {
                    const ex = getExpiryStatus(b.expiryDate);
                    return (
                      <div key={b.id} style={{
                        background: 'var(--green-bg)', border: '1px solid rgba(63,185,80,0.2)',
                        borderRadius: 8, padding: '10px 14px', marginBottom: 6,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span className="mono" style={{ fontSize: 12 }}>{b.batchNumber} · {b.qty} units</span>
                        <span className="badge badge-green">{ex.label}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}

        {/* Critical warning */}
        {isCritical && (
          <>
            <div style={{ marginBottom: 16, fontSize: 14 }}>
              The next batch to be dispatched (<strong className="mono">{warn.fefo.nextBatch.batchNumber}</strong>) is
              expiring <strong style={{ color: 'var(--amber)' }}>in {warn.fefo.nextStatus.days} day{warn.fefo.nextStatus.days !== 1 ? 's' : ''}</strong>.
              FEFO will dispatch this batch first to prevent warehouse expiry.
            </div>

            <div style={{
              background: 'var(--amber-bg)', border: '1px solid rgba(210,153,34,0.25)',
              borderRadius: 8, padding: '12px 16px', marginBottom: 20,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{warn.fefo.nextBatch.batchNumber}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {warn.fefo.nextBatch.qty} units · Expiry: {format(new Date(warn.fefo.nextBatch.expiryDate), 'dd MMM yyyy')}
                </div>
              </div>
              <span className="badge badge-amber">{warn.fefo.nextStatus.days}d left</span>
            </div>

            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              <Info size={14} style={{ flexShrink: 0 }} />
              Prioritise dispatching this product to high-volume customers. Consider promotional pricing or contact sales team.
            </div>
          </>
        )}

        {/* Manager acknowledgement for expired */}
        {isExpired && (
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '14px 16px', marginBottom: 20,
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                style={{ marginTop: 2, accentColor: 'var(--red)', width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--text)' }}>
                I ({currentUser?.name}) acknowledge that expired batches are present and confirm I will
                write them off before or after this dispatch. Dispatching good stock only.
              </span>
            </label>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-lg" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>
            Cancel — go back
          </button>
          {isCritical && (
            <button className="btn btn-lg" onClick={onProceed}
              style={{ flex: 2, justifyContent: 'center', background: 'var(--amber)', color: '#000', fontWeight: 700 }}>
              Acknowledged — Proceed with Dispatch
            </button>
          )}
          {isExpired && (
            <button className="btn btn-lg" onClick={onProceed}
              disabled={!confirmed}
              style={{ flex: 2, justifyContent: 'center', background: confirmed ? 'var(--amber)' : 'var(--surface2)', color: confirmed ? '#000' : 'var(--text3)', fontWeight: 700, cursor: confirmed ? 'pointer' : 'not-allowed' }}>
              Proceed — Dispatch Good Stock Only
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
