import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Download, TrendingUp, TrendingDown, Package, Truck } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

export default function Reports() {
  const { products, batches, transactions, vehicles, getProductStock } = useApp();
  const [tab, setTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30');

  const days = parseInt(dateRange);
  const from = subDays(new Date(), days);
  const filtered = transactions.filter(t => new Date(t.date) >= from);

  // Daily movement chart data
  const dailyData = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = format(d, 'yyyy-MM-dd');
    const ins  = filtered.filter(t => t.type === 'IN'  && t.date?.startsWith(key)).reduce((s, t) => s + t.qty, 0);
    const outs = filtered.filter(t => t.type === 'OUT' && t.date?.startsWith(key)).reduce((s, t) => s + t.qty, 0);
    if (ins > 0 || outs > 0) dailyData.push({ date: format(d, 'd MMM'), in: ins, out: outs });
  }

  // Product movement
  const productMovement = products.map(p => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
    in:  filtered.filter(t => t.type === 'IN'  && t.productId === p.id).reduce((s, t) => s + t.qty, 0),
    out: filtered.filter(t => t.type === 'OUT' && t.productId === p.id).reduce((s, t) => s + t.qty, 0),
    stock: getProductStock(p.id),
  })).filter(p => p.in > 0 || p.out > 0).sort((a, b) => (b.in + b.out) - (a.in + a.out));

  const totalIn  = filtered.filter(t => t.type === 'IN').reduce((s, t) => s + t.qty, 0);
  const totalOut = filtered.filter(t => t.type === 'OUT').reduce((s, t) => s + t.qty, 0);
  const totalValue = batches.reduce((s, b) => s + (b.qty * (b.costPrice || 0)), 0);

  const exportCSV = () => {
    const rows = [
      ['Date', 'Type', 'Product', 'Batch', 'Qty', 'Reference', 'Customer', 'Vehicle', 'Delivery Note', 'Note'],
      ...filtered.map(t => {
        const prod = products.find(p => p.id === t.productId);
        const veh  = vehicles.find(v => v.id === t.vehicleId);
        return [
          t.date ? format(new Date(t.date), 'dd/MM/yyyy HH:mm') : '',
          t.type, prod?.name || t.productId, t.batchId, t.qty,
          t.reference || '', t.customer || '',
          veh ? veh.registration : '',
          t.deliveryNote || '', t.note || '',
        ];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `k4h-transactions-${format(new Date(), 'yyyyMMdd')}.csv`; a.click();
  };

  const exportInventoryCSV = () => {
    const rows = [
      ['Product', 'SKU', 'Barcode', 'Category', 'Supplier', 'Total Stock', 'Min Stock', 'Batch Count'],
      ...products.map(p => [
        p.name, p.sku, p.barcode, p.category, p.supplier || '',
        getProductStock(p.id), p.minStock,
        batches.filter(b => b.productId === p.id && b.qty > 0).length,
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `k4h-inventory-${format(new Date(), 'yyyyMMdd')}.csv`; a.click();
  };

  const tooltipStyle = { background: '#1c2333', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 };

  return (
    <div>
      <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">Stock movement, inventory value, and export tools</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={exportCSV}><Download size={14} /> Export Transactions</button>
          <button className="btn btn-secondary" onClick={exportInventoryCSV}><Download size={14} /> Export Inventory</button>
        </div>
      </div>

      {/* Date range selector */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Period:</span>
        {['7','30','60','90'].map(d => (
          <button key={d} onClick={() => setDateRange(d)}
            className={`btn btn-sm ${dateRange === d ? 'btn-primary' : 'btn-secondary'}`}>
            {d} days
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Units Received</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{totalIn.toLocaleString()}</div>
          <div className="stat-sub">last {days} days</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Units Dispatched</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{totalOut.toLocaleString()}</div>
          <div className="stat-sub">last {days} days</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Current Stock Value</div>
          <div className="stat-value" style={{ color: 'var(--blue)', fontSize: 22 }}>R{totalValue.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div className="stat-sub">at cost price</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{filtered.length}</div>
          <div className="stat-sub">last {days} days</div>
        </div>
      </div>

      {/* Charts */}
      {dailyData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 14 }}>Daily Stock Movement</span>
          </div>
          <div style={{ padding: 20, height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="in"  name="Stock In"  fill="var(--green)" radius={[3,3,0,0]} />
                <Bar dataKey="out" name="Stock Out" fill="var(--amber)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {productMovement.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 14 }}>Top Product Movement</span>
          </div>
          <div style={{ padding: 20, height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productMovement.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 11 }} width={130} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="in"  name="Received" fill="var(--green)" radius={[0,3,3,0]} />
                <Bar dataKey="out" name="Dispatched" fill="var(--amber)" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Transaction log */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontWeight: 600, fontSize: 14 }}>Transaction Log ({filtered.length})</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Reference</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>D/N</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(t => {
                const prod = products.find(p => p.id === t.productId);
                const veh  = vehicles.find(v => v.id === t.vehicleId);
                return (
                  <tr key={t.id}>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{t.date ? format(new Date(t.date), 'dd/MM/yy HH:mm') : '—'}</td>
                    <td>
                      {t.type === 'IN'
                        ? <span className="badge badge-green">IN</span>
                        : <span className="badge badge-amber">OUT</span>}
                    </td>
                    <td style={{ fontSize: 12 }}>{prod?.name?.slice(0, 28) || t.productId}</td>
                    <td style={{ fontWeight: 600 }}>{t.qty}</td>
                    <td className="mono" style={{ fontSize: 11, color: 'var(--text2)' }}>{t.reference || '—'}</td>
                    <td style={{ fontSize: 12 }}>{t.customer || '—'}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{veh?.registration || '—'}</td>
                    <td className="mono" style={{ fontSize: 11, color: 'var(--text2)' }}>{t.deliveryNote || '—'}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text2)' }}>No transactions in this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 50 && (
          <div style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text2)', borderTop: '1px solid var(--border2)' }}>
            Showing 50 of {filtered.length} transactions. Export CSV to see all.
          </div>
        )}
      </div>
    </div>
  );
}
