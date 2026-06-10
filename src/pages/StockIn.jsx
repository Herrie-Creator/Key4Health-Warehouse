import React, { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ScannerInput, Modal } from '../components/UI.jsx';
import { ScanLine, Plus, CheckCircle, Package } from 'lucide-react';
import { LOCATIONS, CATEGORIES } from '../data/seed.js';

export default function StockIn() {
  const { products, stockIn, addProduct, findByBarcode, toast } = useApp();
  const { currentUser } = useAuth();

  const [scanned, setScanned]         = useState(null);
  const [form, setForm]               = useState({});
  const [newProductModal, setNewProductModal] = useState(false);
  const [newProductBarcode, setNewProductBarcode] = useState('');
  const [step, setStep]               = useState('scan'); // scan | detail | done

  const handleScan = (barcode) => {
    const prod = findByBarcode(barcode);
    if (prod) {
      setScanned(prod);
      setForm({
        productId: prod.id,
        batchNumber: '',
        qty: '',
        expiryDate: '',
        location: '',
        poNumber: '',
        costPrice: '',
        receivedDate: new Date().toISOString().split('T')[0],
        deliveryNote: '',
        note: '',
      });
      setStep('detail');
    } else {
      toast(`Barcode "${barcode}" not found. Add as new product?`, 'warning');
      setNewProductBarcode(barcode);
      setNewProductModal(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.qty || !form.expiryDate || !form.batchNumber) {
      toast('Please fill in all required fields', 'error');
      return;
    }
    stockIn(form, currentUser.id);
    setStep('done');
    setScanned(null);
    setTimeout(() => setStep('scan'), 2000);
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page-header">
        <h1 className="page-title">Stock In</h1>
        <p className="page-sub">Scan a product barcode to receive stock into the warehouse</p>
      </div>

      {step === 'scan' && (
        <>
          <div className="card" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'var(--green-bg)', borderRadius: 8, padding: 8 }}>
                <ScanLine size={20} color="var(--green)" />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Barcode Scanner</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Supports Code 128, EAN-13, EAN-8, QR, and all common formats</div>
              </div>
            </div>
            <ScannerInput onScan={handleScan} placeholder="Scan barcode or type and press Enter…" />
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text2)' }}>
              💡 Focus the field and scan with your barcode gun, or type a barcode manually
            </div>
          </div>

          {/* Quick product list */}
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 600, fontSize: 14 }}>Quick Select — tap to receive</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border2)' }}>
              {products.map(p => (
                <button key={p.id} onClick={() => { setScanned(p); setForm({ productId: p.id, qty: '', batchNumber: '', expiryDate: '', location: '', poNumber: '', costPrice: '', receivedDate: new Date().toISOString().split('T')[0], deliveryNote: '', note: '' }); setStep('detail'); }}
                  style={{ background: 'var(--surface)', padding: '14px 16px', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.target.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.target.style.background = 'var(--surface)'}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, fontFamily: 'monospace' }}>{p.barcode}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {step === 'detail' && scanned && (
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ fontWeight: 600 }}>Receiving: <span style={{ color: 'var(--green)' }}>{scanned.name}</span></div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>SKU: {scanned.sku} · Barcode: {scanned.barcode}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setStep('scan'); setScanned(null); }}>Cancel</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="card-body">
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Batch / Lot Number *</label>
                  <input className="form-input mono" value={form.batchNumber || ''} onChange={e => f('batchNumber', e.target.value)} placeholder="e.g. LOT-2024-001" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity Received *</label>
                  <input className="form-input" type="number" min="1" value={form.qty || ''} onChange={e => f('qty', e.target.value)} placeholder="0" required />
                </div>
              </div>
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input className="form-input" type="date" value={form.expiryDate || ''} onChange={e => f('expiryDate', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Received Date</label>
                  <input className="form-input" type="date" value={form.receivedDate || ''} onChange={e => f('receivedDate', e.target.value)} />
                </div>
              </div>
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Warehouse Location</label>
                  <select className="form-select" value={form.location || ''} onChange={e => f('location', e.target.value)}>
                    <option value="">Select location…</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cost Price (ZAR)</label>
                  <input className="form-input" type="number" step="0.01" min="0" value={form.costPrice || ''} onChange={e => f('costPrice', e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">PO / Purchase Order No.</label>
                  <input className="form-input mono" value={form.poNumber || ''} onChange={e => f('poNumber', e.target.value)} placeholder="PO-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Note No.</label>
                  <input className="form-input mono" value={form.deliveryNote || ''} onChange={e => f('deliveryNote', e.target.value)} placeholder="DN-001" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" value={form.note || ''} onChange={e => f('note', e.target.value)} placeholder="Optional notes…" />
              </div>
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center' }}>
                Confirm Stock In
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ color: 'var(--green)', marginBottom: 12 }}><CheckCircle size={56} /></div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Stock Received!</h2>
          <p style={{ color: 'var(--text2)', marginTop: 8 }}>Returning to scanner…</p>
        </div>
      )}

      {newProductModal && (
        <NewProductModal
          barcode={newProductBarcode}
          onSave={(p) => { setNewProductModal(false); setScanned(p); setForm({ productId: p.id, qty: '', batchNumber: '', expiryDate: '', location: '', poNumber: '', costPrice: '', receivedDate: new Date().toISOString().split('T')[0], deliveryNote: '', note: '' }); setStep('detail'); }}
          onClose={() => setNewProductModal(false)}
        />
      )}
    </div>
  );
}

function NewProductModal({ barcode, onSave, onClose }) {
  const { addProduct } = useApp();
  const [form, setForm] = useState({ barcode, name: '', sku: '', category: 'Food & Beverage', unit: 'Box', supplier: '', minStock: 50, notes: '' });
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.name || !form.sku) { return; }
    const prod = addProduct(form);
    onSave(prod);
  };

  return (
    <Modal title="New Product" onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>Save & Continue</button>
      </>
    }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Barcode</label>
          <input className="form-input mono" value={form.barcode} onChange={e => f('barcode', e.target.value)} />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Product name" required />
          </div>
          <div className="form-group">
            <label className="form-label">SKU *</label>
            <input className="form-input mono" value={form.sku} onChange={e => f('sku', e.target.value)} placeholder="SKU-001" required />
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={e => f('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <input className="form-input" value={form.unit} onChange={e => f('unit', e.target.value)} placeholder="Box, Case, etc." />
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <input className="form-input" value={form.supplier} onChange={e => f('supplier', e.target.value)} placeholder="Supplier name" />
          </div>
          <div className="form-group">
            <label className="form-label">Min. Stock Level</label>
            <input className="form-input" type="number" min="0" value={form.minStock} onChange={e => f('minStock', parseInt(e.target.value))} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
