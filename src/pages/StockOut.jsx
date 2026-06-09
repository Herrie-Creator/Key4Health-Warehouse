import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ScannerInput, ExpiryBadge } from '../components/UI.jsx';
import { ScanLine, CheckCircle, Truck, AlertTriangle } from 'lucide-react';

export default function StockOut() {
  const { products, batches, vehicles, stockOut, findByBarcode, getProductStock, getExpiryStatus, toast } = useApp();
  const { currentUser } = useAuth();

  const [scanned, setScanned] = useState(null);
  const [form, setForm]       = useState({});
  const [step, setStep]       = useState('scan');

  const handleScan = (barcode) => {
    const prod = findByBarcode(barcode);
    if (prod) {
      const qty = getProductStock(prod.id);
      if (qty <= 0) {
        toast(`No stock available for ${prod.name}`, 'error');
        return;
      }
      setScanned(prod);
      setForm({ productId: prod.id, qty: '', reference: '', note: '', vehicleId: '', deliveryNote: '', customer: '' });
      setStep('detail');
    } else {
      toast(`Barcode not found: ${barcode}`, 'error');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const avail = getProductStock(scanned.id);
    if (parseInt(form.qty) > avail) {
      toast(`Only ${avail} units available`, 'error');
      return;
    }
    if (!form.qty || parseInt(form.qty) < 1) {
      toast('Enter a valid quantity', 'error');
      return;
    }
    stockOut(form, currentUser.id);
    setStep('done');
    setTimeout(() => { setStep('scan'); setScanned(null); }, 2000);
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Get FEFO batches for selected product
  const productBatches = scanned
    ? batches.filter(b => b.productId === scanned.id && b.qty > 0).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    : [];

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page-header">
        <h1 className="page-title">Stock Out</h1>
        <p className="page-sub">Scan to dispatch stock · FEFO (First Expiry, First Out) applied automatically</p>
      </div>

      {step === 'scan' && (
        <>
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'var(--amber-bg)', borderRadius: 8, padding: 8 }}>
                <ScanLine size={20} color="var(--amber)" />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Scan to Dispatch</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>FEFO automatically selects the soonest-expiring batch first</div>
              </div>
            </div>
            <ScannerInput onScan={handleScan} placeholder="Scan product barcode or type and press Enter…" />
          </div>

          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 600, fontSize: 14 }}>Available Stock — tap to dispatch</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border2)' }}>
              {products.map(p => {
                const qty = getProductStock(p.id);
                const prodBatches = batches.filter(b => b.productId === p.id && b.qty > 0).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
                const nextExpiry = prodBatches[0];
                const expStatus = nextExpiry ? getExpiryStatus(nextExpiry.expiryDate) : null;
                return (
                  <button key={p.id}
                    disabled={qty <= 0}
                    onClick={() => { setScanned(p); setForm({ productId: p.id, qty: '', reference: '', note: '', vehicleId: '', deliveryNote: '', customer: '' }); setStep('detail'); }}
                    style={{ background: qty <= 0 ? 'var(--surface2)' : 'var(--surface)', padding: '14px 16px', border: 'none', cursor: qty <= 0 ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: qty <= 0 ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{p.name.length > 28 ? p.name.slice(0, 28) + '…' : p.name}</div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: qty <= 0 ? 'var(--red)' : qty <= p.minStock ? 'var(--amber)' : 'var(--green)', marginLeft: 8 }}>{qty}</span>
                    </div>
                    {nextExpiry && expStatus?.status !== 'ok' && (
                      <div style={{ marginTop: 4 }}>
                        <span className={`badge ${expStatus.cls}`} style={{ fontSize: 10 }}>{expStatus.label}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {step === 'detail' && scanned && (
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ fontWeight: 600 }}>Dispatching: <span style={{ color: 'var(--amber)' }}>{scanned.name}</span></div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                Available: <strong>{getProductStock(scanned.id)} units</strong> · FEFO batch order applied
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setStep('scan'); setScanned(null); }}>Cancel</button>
          </div>

          {/* FEFO batch preview */}
          {productBatches.length > 0 && (
            <div style={{ padding: '12px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border2)' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>FEFO Dispatch Order</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {productBatches.map((b, i) => {
                  const ex = getExpiryStatus(b.expiryDate);
                  return (
                    <div key={b.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>
                      <span style={{ color: 'var(--text3)' }}>#{i + 1} </span>
                      <span className="mono">{b.batchNumber}</span>
                      <span style={{ margin: '0 4px', color: 'var(--text3)' }}>·</span>
                      <span style={{ fontWeight: 600 }}>{b.qty} units</span>
                      <span style={{ margin: '0 4px', color: 'var(--text3)' }}>·</span>
                      <span className={ex.cls.includes('critical') ? 'expiry-critical' : ex.cls.includes('warning') ? 'expiry-warning' : 'expiry-ok'} style={{ fontSize: 11 }}>{ex.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="card-body">
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Quantity to Dispatch *</label>
                  <input className="form-input" type="number" min="1" max={getProductStock(scanned.id)} value={form.qty || ''} onChange={e => f('qty', e.target.value)} placeholder="0" required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Sales Order / Reference</label>
                  <input className="form-input mono" value={form.reference || ''} onChange={e => f('reference', e.target.value)} placeholder="SO-001" />
                </div>
              </div>
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Customer / Destination</label>
                  <input className="form-input" value={form.customer || ''} onChange={e => f('customer', e.target.value)} placeholder="e.g. Woolworths Rosebank" />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Note No.</label>
                  <input className="form-input mono" value={form.deliveryNote || ''} onChange={e => f('deliveryNote', e.target.value)} placeholder="DN-001" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Assign to Vehicle / Driver</label>
                <select className="form-select" value={form.vehicleId || ''} onChange={e => f('vehicleId', e.target.value)}>
                  <option value="">— No vehicle / walk-in —</option>
                  {vehicles.filter(v => v.active).map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration} · {v.make} {v.model} · {v.driver}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" value={form.note || ''} onChange={e => f('note', e.target.value)} placeholder="Optional notes…" />
              </div>
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-lg w-full" style={{ justifyContent: 'center', background: 'var(--amber)', color: '#000', fontWeight: 700 }}>
                Confirm Dispatch
              </button>
            </div>
          </form>
        </div>
      )}

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
