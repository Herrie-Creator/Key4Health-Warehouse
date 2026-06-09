import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Modal } from '../components/UI.jsx';
import { Plus, Truck, Edit2, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';

export default function Deliveries() {
  const { products, vehicles, transactions, addVehicle, updateVehicle, deleteVehicle } = useApp();
  const { isManager } = useAuth();
  const [tab, setTab]         = useState('vehicles');
  const [modal, setModal]     = useState(null);
  const [editing, setEditing] = useState(null);
  const [selVehicle, setSelVehicle] = useState('');

  // Deliveries = OUT transactions that have a vehicleId
  const deliveries = transactions.filter(t => t.type === 'OUT' && t.vehicleId);

  const vehicleDeliveries = deliveries.filter(d => !selVehicle || d.vehicleId === selVehicle);

  const grouped = vehicleDeliveries.reduce((acc, d) => {
    const key = d.date?.split('T')[0] || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Deliveries & Fleet</h1>
          <p className="page-sub">Manage vehicles, drivers, and dispatch records</p>
        </div>
        {isManager && tab === 'vehicles' && (
          <button className="btn btn-primary" onClick={() => { setEditing(null); setModal('vehicle'); }}>
            <Plus size={15} /> Add Vehicle
          </button>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'vehicles' ? 'active' : ''}`}   onClick={() => setTab('vehicles')}>Fleet ({vehicles.length})</button>
        <button className={`tab ${tab === 'deliveries' ? 'active' : ''}`} onClick={() => setTab('deliveries')}>Dispatch Log ({deliveries.length})</button>
      </div>

      {tab === 'vehicles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {vehicles.map(v => (
            <div key={v.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ background: 'var(--blue-bg)', borderRadius: 8, padding: 8 }}>
                    <Truck size={18} color="var(--blue)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }} className="mono">{v.registration}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{v.make} {v.model}</div>
                  </div>
                </div>
                {v.active
                  ? <span className="badge badge-green">Active</span>
                  : <span className="badge badge-gray">Inactive</span>}
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontSize: 13 }}>
                <User size={13} />
                {v.driver || 'No driver assigned'}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
                {deliveries.filter(d => d.vehicleId === v.id).length} deliveries recorded
              </div>
              {isManager && (
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(v); setModal('vehicle'); }}>
                    <Edit2 size={12} /> Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Remove vehicle?')) deleteVehicle(v.id); }}>
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}
          {vehicles.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
              No vehicles registered yet.
            </div>
          )}
        </div>
      )}

      {tab === 'deliveries' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <select className="form-select" style={{ maxWidth: 300 }} value={selVehicle} onChange={e => setSelVehicle(e.target.value)}>
              <option value="">All vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registration} · {v.driver}</option>
              ))}
            </select>
          </div>

          {Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(date => (
            <div key={date} style={{ marginBottom: 20 }}>
              <div className="section-title">{date === 'unknown' ? 'Unknown date' : format(new Date(date), 'EEEE, d MMMM yyyy')}</div>
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Customer</th>
                        <th>Vehicle</th>
                        <th>Delivery Note</th>
                        <th>Reference</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grouped[date].map(d => {
                        const prod    = products.find(p => p.id === d.productId);
                        const vehicle = vehicles.find(v => v.id === d.vehicleId);
                        return (
                          <tr key={d.id}>
                            <td style={{ fontSize: 13, fontWeight: 500 }}>{prod?.name?.slice(0, 30) || d.productId}</td>
                            <td style={{ fontWeight: 700 }}>{d.qty}</td>
                            <td style={{ fontSize: 12 }}>{d.customer || '—'}</td>
                            <td style={{ fontSize: 12 }}>
                              {vehicle ? (
                                <span className="mono" style={{ fontSize: 11 }}>{vehicle.registration}</span>
                              ) : '—'}
                            </td>
                            <td className="mono" style={{ fontSize: 12, color: 'var(--text2)' }}>{d.deliveryNote || '—'}</td>
                            <td className="mono" style={{ fontSize: 12, color: 'var(--text2)' }}>{d.reference || '—'}</td>
                            <td style={{ fontSize: 12, color: 'var(--text2)' }}>{d.note || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}

          {deliveries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
              No delivery records yet. Dispatches made via Stock Out with a vehicle assigned will appear here.
            </div>
          )}
        </>
      )}

      {modal === 'vehicle' && (
        <VehicleModal
          vehicle={editing}
          onSave={(data) => {
            if (editing) updateVehicle(editing.id, data);
            else addVehicle(data);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function VehicleModal({ vehicle, onSave, onClose }) {
  const init = vehicle || { registration: '', make: '', model: '', driver: '', active: true };
  const [form, setForm] = useState(init);
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Modal title={vehicle ? 'Edit Vehicle' : 'Add Vehicle'} onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => { if (!form.registration) return; onSave(form); }}>
          {vehicle ? 'Save Changes' : 'Add Vehicle'}
        </button>
      </>
    }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Registration Plate *</label>
          <input className="form-input mono" value={form.registration} onChange={e => f('registration', e.target.value.toUpperCase())} placeholder="GP 123-456" />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Make</label>
            <input className="form-input" value={form.make} onChange={e => f('make', e.target.value)} placeholder="Toyota" />
          </div>
          <div className="form-group">
            <label className="form-label">Model</label>
            <input className="form-input" value={form.model} onChange={e => f('model', e.target.value)} placeholder="Hilux" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Driver Name</label>
          <input className="form-input" value={form.driver} onChange={e => f('driver', e.target.value)} placeholder="Driver full name" />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.active ? 'active' : 'inactive'} onChange={e => f('active', e.target.value === 'active')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
