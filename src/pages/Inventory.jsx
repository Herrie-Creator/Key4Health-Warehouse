import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Modal, ExpiryBadge, SearchBar, EmptyState, StockBar } from '../components/UI.jsx';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { CATEGORIES, LOCATIONS } from '../data/seed.js';
import { format } from 'date-fns';

export default function Inventory() {
  const { products, batches, getProductStock, addProduct, updateProduct, deleteProduct, toast } = useApp();
  const { isManager } = useAuth();
  const [search, setSearch]     = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [modal, setModal]       = useState(null); // null | 'add' | 'edit'
  const [editingProd, setEditingProd] = useState(null);

  const filtered = products.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)) &&
    (!catFilter || p.category === catFilter)
  );

  const openEdit = (p) => { setEditingProd(p); setModal('edit'); };
  const openAdd  = ()  => { setEditingProd(null); setModal('add'); };

  return (
    <div>
      <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-sub">{products.length} products · {batches.length} active batches</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Product</button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, SKU, barcode…" />
        <select className="form-select" style={{ maxWidth: 200 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 && <EmptyState icon="📦" title="No products found" description="Try a different search or add a new product" />}

      {/* Product rows */}
      {filtered.map(prod => {
        const qty     = getProductStock(prod.id);
        const prodBatches = batches.filter(b => b.productId === prod.id && b.qty > 0).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        const isLow   = qty <= prod.minStock;
        const isOpen  = expandedProduct === prod.id;

        return (
          <div key={prod.id} className="card" style={{ marginBottom: 8 }}>
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              onClick={() => setExpandedProduct(isOpen ? null : prod.id)}>
              {isOpen ? <ChevronDown size={16} color="var(--text2)" /> : <ChevronRight size={16} color="var(--text2)" />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{prod.name}</span>
                  {isLow && <span className="badge badge-amber">Low stock</span>}
                  {qty === 0 && <span className="badge badge-red">Out of stock</span>}
                  <span className="badge badge-gray">{prod.category}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
                  SKU: <span className="mono">{prod.sku}</span> · Barcode: <span className="mono">{prod.barcode}</span> · Supplier: {prod.supplier || '—'}
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 120 }}>
                <StockBar qty={qty} min={prod.minStock} />
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Min: {prod.minStock} · {prodBatches.length} batch{prodBatches.length !== 1 ? 'es' : ''}</div>
              </div>
              {isManager && (
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(prod)} title="Edit"><Edit2 size={13} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { if (confirm('Delete this product?')) deleteProduct(prod.id); }} title="Delete" style={{ color: 'var(--red)' }}><Trash2 size={13} /></button>
                </div>
              )}
            </div>

            {/* Expanded batch details */}
            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border2)' }}>
                {prodBatches.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>No active batches</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Batch Number</th>
                          <th>Qty</th>
                          <th>Location</th>
                          <th>Received</th>
                          <th>Expiry</th>
                          <th>PO Number</th>
                          <th>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prodBatches.map((b, i) => (
                          <tr key={b.id}>
                            <td className="mono" style={{ fontSize: 12 }}>
                              {i === 0 && <span style={{ marginRight: 6, fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>NEXT</span>}
                              {b.batchNumber}
                            </td>
                            <td style={{ fontWeight: 600 }}>{b.qty}</td>
                            <td><span className="badge badge-gray mono">{b.location || '—'}</span></td>
                            <td style={{ fontSize: 12, color: 'var(--text2)' }}>{b.receivedDate ? format(new Date(b.receivedDate), 'dd/MM/yyyy') : '—'}</td>
                            <td><ExpiryBadge expiryDate={b.expiryDate} /></td>
                            <td className="mono" style={{ fontSize: 12, color: 'var(--text2)' }}>{b.poNumber || '—'}</td>
                            <td style={{ fontSize: 12 }}>{b.costPrice ? `R${parseFloat(b.costPrice).toFixed(2)}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {modal && (
        <ProductModal
          product={editingProd}
          onSave={(data) => {
            if (editingProd) updateProduct(editingProd.id, data);
            else addProduct(data);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onSave, onClose }) {
  const init = product || { barcode: '', name: '', sku: '', category: 'Food & Beverage', unit: 'Box', supplier: '', minStock: 50, notes: '' };
  const [form, setForm] = useState(init);
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Modal title={product ? 'Edit Product' : 'Add Product'} onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => { if (!form.name || !form.sku) return; onSave(form); }}>
          {product ? 'Save Changes' : 'Add Product'}
        </button>
      </>
    }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Barcode *</label>
          <input className="form-input mono" value={form.barcode} onChange={e => f('barcode', e.target.value)} placeholder="Scan or type barcode" />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Product name" />
          </div>
          <div className="form-group">
            <label className="form-label">SKU *</label>
            <input className="form-input mono" value={form.sku} onChange={e => f('sku', e.target.value)} placeholder="SKU-001" />
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
            <label className="form-label">Min Stock Level</label>
            <input className="form-input" type="number" min="0" value={form.minStock} onChange={e => f('minStock', parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" value={form.notes || ''} onChange={e => f('notes', e.target.value)} placeholder="Optional notes" />
        </div>
      </div>
    </Modal>
  );
}
