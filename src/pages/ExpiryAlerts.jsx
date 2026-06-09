import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { ExpiryBadge } from '../components/UI.jsx';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ExpiryAlerts() {
  const { products, batches, expiringBatches, getExpiryStatus } = useApp();
  const [filter, setFilter] = useState('all');

  const expired  = expiringBatches.filter(b => b.status === 'expired');
  const critical = expiringBatches.filter(b => b.status === 'critical');
  const warning  = expiringBatches.filter(b => b.status === 'warning');

  const shown = filter === 'all' ? expiringBatches
    : filter === 'expired'  ? expired
    : filter === 'critical' ? critical
    : warning;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Expiry Alerts</h1>
        <p className="page-sub">Monitor batch expiry dates · FEFO ensures oldest stock ships first</p>
      </div>

      {/* Summary cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderColor: expired.length > 0 ? 'rgba(248,81,73,0.3)' : 'var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <XCircle size={18} color="var(--red)" />
            <span className="stat-label" style={{ color: 'var(--red)' }}>Expired</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{expired.length}</div>
          <div className="stat-sub">Must be quarantined immediately</div>
        </div>
        <div className="stat-card" style={{ borderColor: critical.length > 0 ? 'rgba(210,153,34,0.3)' : 'var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={18} color="var(--amber)" />
            <span className="stat-label" style={{ color: 'var(--amber)' }}>Critical</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{critical.length}</div>
          <div className="stat-sub">Expiring within 14 days</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Clock size={18} color="var(--text2)" />
            <span className="stat-label">Warning</span>
          </div>
          <div className="stat-value">{warning.length}</div>
          <div className="stat-sub">Expiring within 30 days</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        <button className={`tab ${filter === 'all' ? 'active' : ''}`}      onClick={() => setFilter('all')}>All Alerts ({expiringBatches.length})</button>
        <button className={`tab ${filter === 'expired' ? 'active' : ''}`}  onClick={() => setFilter('expired')}>Expired ({expired.length})</button>
        <button className={`tab ${filter === 'critical' ? 'active' : ''}`} onClick={() => setFilter('critical')}>Critical ({critical.length})</button>
        <button className={`tab ${filter === 'warning' ? 'active' : ''}`}  onClick={() => setFilter('warning')}>Warning ({warning.length})</button>
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <CheckCircle size={48} color="var(--green)" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>
            {filter === 'all' ? '✅ All clear!' : `No ${filter} batches`}
          </h3>
          <p style={{ fontSize: 13 }}>
            {filter === 'all' ? 'No products are expired or expiring soon.' : `No batches in this category.`}
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Product</th>
                  <th>Batch</th>
                  <th>Qty</th>
                  <th>Location</th>
                  <th>Expiry Date</th>
                  <th>Action Required</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(batch => {
                  const prod = products.find(p => p.id === batch.productId);
                  return (
                    <tr key={batch.id}>
                      <td><ExpiryBadge expiryDate={batch.expiryDate} /></td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{prod?.name || batch.productId}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>SKU: {prod?.sku}</div>
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>{batch.batchNumber}</td>
                      <td style={{ fontWeight: 600 }}>{batch.qty} {prod?.unit}</td>
                      <td><span className="badge badge-gray mono">{batch.location || '—'}</span></td>
                      <td style={{ fontSize: 13 }}>{batch.expiryDate ? format(new Date(batch.expiryDate), 'dd MMM yyyy') : '—'}</td>
                      <td style={{ fontSize: 12 }}>
                        {batch.status === 'expired' && <span style={{ color: 'var(--red)', fontWeight: 600 }}>⛔ Quarantine & remove</span>}
                        {batch.status === 'critical' && <span style={{ color: 'var(--amber)', fontWeight: 600 }}>⚡ Dispatch immediately</span>}
                        {batch.status === 'warning'  && <span style={{ color: 'var(--text2)' }}>📋 Schedule for dispatch</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="alert alert-info" style={{ marginTop: 20 }}>
        <AlertTriangle size={14} />
        <div>
          <strong>FEFO Policy:</strong> The system automatically applies First Expiry, First Out when dispatching stock.
          The soonest-expiring batch is always selected first during Stock Out. Regularly review this page to ensure
          expired stock is removed from the warehouse.
        </div>
      </div>
    </div>
  );
}
