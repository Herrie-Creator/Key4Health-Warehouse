import React from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ExpiryBadge, StockBar } from '../components/UI.jsx';
import { Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Truck } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Dashboard({ setPage }) {
  const { products, batches, transactions, vehicles, getProductStock, expiringBatches, lowStockProducts, expiredCount, criticalCount } = useApp();
  const { currentUser } = useAuth();

  const totalProducts   = products.length;
  const totalSKUs       = products.length;
  const today           = new Date().toISOString().split('T')[0];
  const todayTx         = transactions.filter(t => t.date?.startsWith(today));
  const todayIn         = todayTx.filter(t => t.type === 'IN').reduce((s, t) => s + t.qty, 0);
  const todayOut        = todayTx.filter(t => t.type === 'OUT').reduce((s, t) => s + t.qty, 0);
  const recentTx        = transactions.slice(0, 8);
  const activeVehicles  = vehicles.filter(v => v.active).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Header */}
      <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">{greeting}, {currentUser.name.split(' ')[0]} 👋</h1>
          <p className="page-sub">{format(new Date(), 'EEEE, d MMMM yyyy')} · Here's your warehouse overview</p>
        </div>
      </div>

      {/* Alerts */}
      {(expiredCount > 0 || criticalCount > 0 || lowStockProducts.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {expiredCount > 0 && (
            <div className="alert alert-danger" style={{ cursor: 'pointer' }} onClick={() => setPage('expiry')}>
              <AlertTriangle size={15} />
              <strong>{expiredCount} batch{expiredCount > 1 ? 'es' : ''} expired</strong> — these must be quarantined immediately. Click to review.
            </div>
          )}
          {criticalCount > 0 && (
            <div className="alert alert-warning" style={{ cursor: 'pointer' }} onClick={() => setPage('expiry')}>
              <AlertTriangle size={15} />
              <strong>{criticalCount} batch{criticalCount > 1 ? 'es' : ''} expiring within 14 days</strong> — prioritise for dispatch. Click to review.
            </div>
          )}
          {lowStockProducts.length > 0 && (
            <div className="alert alert-warning" style={{ cursor: 'pointer' }} onClick={() => setPage('inventory')}>
              <Package size={15} />
              <strong>{lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} below minimum stock level</strong> — reorder required.
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total SKUs</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{totalSKUs}</div>
          <div className="stat-sub">{products.length} products catalogued</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today: Received</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{todayIn}</div>
          <div className="stat-sub">units booked in today</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today: Dispatched</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{todayOut}</div>
          <div className="stat-sub">units booked out today</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expiry Alerts</div>
          <div className="stat-value" style={{ color: expiredCount > 0 ? 'var(--red)' : criticalCount > 0 ? 'var(--amber)' : 'var(--green)' }}>
            {expiredCount + criticalCount}
          </div>
          <div className="stat-sub">{expiredCount} expired · {criticalCount} critical</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent transactions */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 14 }}>Recent Activity</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('inventory')}>View all</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text2)', padding: 32 }}>No transactions yet</td></tr>
                )}
                {recentTx.map(tx => {
                  const prod = useApp ? null : null;
                  return (
                    <TxRow key={tx.id} tx={tx} />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 600, fontSize: 14 }}>Stock Levels</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage('inventory')}>Manage</button>
            </div>
            <div style={{ padding: '8px 0' }}>
              {products.slice(0, 6).map(p => {
                const qty = batches.filter(b => b.productId === p.id).reduce((s, b) => s + b.qty, 0);
                return (
                  <div key={p.id} style={{ padding: '8px 20px', borderBottom: '1px solid var(--border2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{p.name.length > 35 ? p.name.slice(0, 35) + '…' : p.name}</span>
                      {qty <= p.minStock && <span className="badge badge-amber" style={{ fontSize: 10 }}>Low</span>}
                    </div>
                    <StockBar qty={qty} min={p.minStock} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expiring soon */}
          {expiringBatches.slice(0, 4).length > 0 && (
            <div className="card">
              <div className="card-header">
                <span style={{ fontWeight: 600, fontSize: 14 }}>⚠️ Expiring Soon</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage('expiry')}>All alerts</button>
              </div>
              <div style={{ padding: '8px 0' }}>
                {expiringBatches.slice(0, 4).map(b => {
                  const prod = { name: 'Unknown' };
                  return <ExpiryRow key={b.id} batch={b} />;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TxRow({ tx }) {
  const { products } = useApp();
  const prod = products.find(p => p.id === tx.productId);
  return (
    <tr>
      <td>
        {tx.type === 'IN'
          ? <span className="badge badge-green"><TrendingDown size={10} /> IN</span>
          : <span className="badge badge-amber"><TrendingUp size={10} /> OUT</span>}
      </td>
      <td style={{ fontSize: 12 }}>{prod?.name?.slice(0, 28) || tx.productId}…</td>
      <td style={{ fontWeight: 600 }}>{tx.qty}</td>
      <td style={{ fontSize: 11, color: 'var(--text2)' }}>
        {tx.date ? format(new Date(tx.date), 'dd/MM HH:mm') : '–'}
      </td>
    </tr>
  );
}

function ExpiryRow({ batch }) {
  const { products } = useApp();
  const prod = products.find(p => p.id === batch.productId);
  return (
    <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 500 }}>{prod?.name?.slice(0, 30) || batch.productId}</div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Batch: {batch.batchNumber} · Qty: {batch.qty}</div>
      </div>
      <ExpiryBadge expiryDate={batch.expiryDate} />
    </div>
  );
}
