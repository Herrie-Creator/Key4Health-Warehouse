import React, { useState } from 'react';
import { useApp, WRITEOFF_REASONS } from '../contexts/AppContext.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Download, FileText, Printer, TrendingDown, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { format, subDays, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

// ── Brand colours ────────────────────────────────────────────────────────
const NAVY   = '#2b3a5c';
const RUST   = '#b85c38';
const PIE_COLORS = ['#f85149','#d29922','#388bfd','#3fb950','#a371f7','#fd8c73','#56d364','#79c0ff','#8b949e','#b85c38'];

// ── Logo SVG (embedded in exports) ───────────────────────────────────────
const LOGO_SVG = `<svg width="240" height="86" viewBox="0 0 560 200" xmlns="http://www.w3.org/2000/svg">
  <rect width="560" height="200" rx="10" fill="#2b3a5c"/>
  <ellipse cx="218" cy="95" rx="44" ry="54" fill="#b85c38"/>
  <text x="218" y="114" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="62" fill="#fff" letter-spacing="-2">4</text>
  <text x="30" y="118" font-family="'Trebuchet MS',Arial,sans-serif" font-weight="700" font-size="62" fill="#fff" letter-spacing="4">KEY</text>
  <text x="272" y="118" font-family="'Trebuchet MS',Arial,sans-serif" font-weight="700" font-size="62" fill="#fff" letter-spacing="4">HEALTH</text>
  <line x1="30" y1="136" x2="530" y2="136" stroke="#c8d0dc" stroke-width="0.8" opacity="0.4"/>
  <text x="280" y="162" text-anchor="middle" font-family="'Trebuchet MS',Arial,sans-serif" font-weight="400" font-size="20" fill="#c8d0dc" letter-spacing="5">SALES &amp; DISTRIBUTION</text>
</svg>`;

// ── Full branded HTML report builder ─────────────────────────────────────
function buildSection(title, columns, rows, summaryCards = []) {
  const cards = summaryCards.map(s =>
    `<div class="sum-item"><span class="sum-label">${s.label}</span><span class="sum-value" style="color:${s.color||'#2b3a5c'}">${s.value}</span></div>`
  ).join('');
  const ths = columns.map(c => `<th>${c}</th>`).join('');
  const trs = rows.map(r =>
    `<tr>${r.map((c,i) => `<td style="text-align:${i===0?'left':'center'}">${c??'—'}</td>`).join('')}</tr>`
  ).join('');
  return `
    <div class="section">
      <h2>${title}</h2>
      ${cards ? `<div class="summary">${cards}</div>` : ''}
      <table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>
    </div>`;
}

function buildFullReport(sections, generatedBy) {
  const date = format(new Date(), 'dd MMMM yyyy HH:mm');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Warehouse Management Report — Key4Health</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f6fa;color:#1a1a2e;font-size:13px}
  .page{max-width:1100px;margin:0 auto;background:#fff;min-height:100vh}
  header{background:#2b3a5c;padding:28px 40px;display:flex;align-items:center;justify-content:space-between}
  .header-meta{text-align:right;color:#c8d0dc;font-size:12px;line-height:1.9}
  .header-meta strong{color:#fff;font-size:15px;display:block;margin-bottom:2px}
  .toc{background:#f8faff;border-bottom:2px solid #e2e8f0;padding:16px 40px;display:flex;gap:24px;flex-wrap:wrap}
  .toc a{color:#2b3a5c;font-size:12px;font-weight:600;text-decoration:none;padding:4px 10px;border-radius:20px;background:#e8edf7}
  .content{padding:32px 40px}
  .section{margin-bottom:48px}
  .section h2{font-size:16px;font-weight:700;color:#2b3a5c;border-left:4px solid #b85c38;padding-left:12px;margin-bottom:16px}
  .summary{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
  .sum-item{background:#f0f4ff;border:1px solid #dde4f5;border-radius:8px;padding:12px 18px;min-width:140px}
  .sum-label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#666;margin-bottom:4px}
  .sum-value{font-size:22px;font-weight:700}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px}
  th{background:#2b3a5c;color:#fff;padding:9px 12px;text-align:left;font-size:11px;letter-spacing:0.4px;text-transform:uppercase}
  td{padding:8px 12px;border-bottom:1px solid #eee}
  tr:nth-child(even) td{background:#f8f9fc}
  tr:hover td{background:#eef2ff}
  .badge-in{background:#d4f4dd;color:#1a7a35;padding:1px 7px;border-radius:12px;font-size:10px;font-weight:700}
  .badge-out{background:#fef3d4;color:#856404;padding:1px 7px;border-radius:12px;font-size:10px;font-weight:700}
  .badge-wo{background:#fde;color:#c00;padding:1px 7px;border-radius:12px;font-size:10px;font-weight:700}
  .badge-exp{background:#fde;color:#c00;padding:1px 7px;border-radius:12px;font-size:10px;font-weight:600}
  .badge-warn{background:#fff3cd;color:#856404;padding:1px 7px;border-radius:12px;font-size:10px;font-weight:600}
  .badge-ok{background:#d4f4dd;color:#1a7a35;padding:1px 7px;border-radius:12px;font-size:10px}
  .divider{border:none;border-top:2px solid #e2e8f0;margin:32px 0}
  footer{border-top:2px solid #2b3a5c;padding:16px 40px;display:flex;justify-content:space-between;font-size:11px;color:#888;background:#f8faff}
  footer strong{color:#2b3a5c}
  @media print{body{background:#fff}.page{max-width:100%}}
</style>
</head>
<body>
<div class="page">
  <header>
    <div>${LOGO_SVG}</div>
    <div class="header-meta">
      <strong>Warehouse Management Report</strong>
      Generated: ${date}<br/>
      Prepared by: ${generatedBy}<br/>
      Key4Health Sales &amp; Distribution · Confidential
    </div>
  </header>
  <nav class="toc">
    ${sections.map((s,i) => `<a href="#section-${i}">${s.title}</a>`).join('')}
  </nav>
  <div class="content">
    ${sections.map((s,i) => `<div id="section-${i}">${s.html}</div>${i < sections.length-1 ? '<hr class="divider"/>' : ''}`).join('')}
  </div>
  <footer>
    <span>© ${new Date().getFullYear()} <strong>Key4Health</strong> Sales &amp; Distribution · All rights reserved</span>
    <span>Generated ${date} · <strong>CONFIDENTIAL</strong></span>
  </footer>
</div>
</body>
</html>`;
}

function downloadFile(content, filename, type = 'text/html') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = filename; a.click();
}

const tooltipStyle = { background: '#1c2333', border: '1px solid #30363d', borderRadius: 8, fontSize: 12, color: '#e6edf3' };

// ── Main component ────────────────────────────────────────────────────────
export default function Reports() {
  const {
    products, batches, transactions, vehicles, writeoffs,
    getProductStock, getExpiryStatus, expiringBatches,
  } = useApp();
  const { currentUser } = useApp();

  const [activeTab,  setActiveTab]  = useState('overview');
  const [dateRange,  setDateRange]  = useState('30');

  const days = parseInt(dateRange);
  const from = subDays(new Date(), days);
  const stamp = format(new Date(), 'yyyyMMdd');

  // Filtered transactions
  const filtered    = transactions.filter(t => new Date(t.date) >= from);
  const txIn        = filtered.filter(t => t.type === 'IN');
  const txOut       = filtered.filter(t => t.type === 'OUT');
  const txWriteoffs = filtered.filter(t => t.type === 'WRITEOFF');

  const totalIn    = txIn.reduce((s, t) => s + t.qty, 0);
  const totalOut   = txOut.reduce((s, t) => s + t.qty, 0);
  const totalWO    = txWriteoffs.reduce((s, t) => s + t.qty, 0);
  const totalValue = batches.reduce((s, b) => s + b.qty * (parseFloat(b.costPrice) || 0), 0);
  const totalLoss  = writeoffs.reduce((s, w) => s + (w.totalLoss || 0), 0);
  const thisMonth  = new Date().toISOString().slice(0, 7);
  const lossMonth  = writeoffs.filter(w => w.date?.startsWith(thisMonth)).reduce((s, w) => s + (w.totalLoss || 0), 0);

  // ── Daily movement chart ─────────────────────────────────────────────
  const dailyData = [];
  for (let i = Math.min(days - 1, 59); i >= 0; i--) {
    const d   = subDays(new Date(), i);
    const key = format(d, 'yyyy-MM-dd');
    const ins  = filtered.filter(t => t.type === 'IN'       && t.date?.startsWith(key)).reduce((s, t) => s + t.qty, 0);
    const outs = filtered.filter(t => t.type === 'OUT'      && t.date?.startsWith(key)).reduce((s, t) => s + t.qty, 0);
    const wos  = filtered.filter(t => t.type === 'WRITEOFF' && t.date?.startsWith(key)).reduce((s, t) => s + t.qty, 0);
    if (ins > 0 || outs > 0 || wos > 0)
      dailyData.push({ date: format(d, 'd MMM'), in: ins, out: outs, writeoff: wos });
  }

  // ── Monthly write-off trend (last 6 months) ──────────────────────────
  const monthlyWO = Array.from({ length: 6 }, (_, i) => {
    const m     = subMonths(new Date(), 5 - i);
    const key   = format(m, 'yyyy-MM');
    const count = writeoffs.filter(w => w.date?.startsWith(key)).length;
    const loss  = writeoffs.filter(w => w.date?.startsWith(key)).reduce((s, w) => s + (w.totalLoss || 0), 0);
    return { month: format(m, 'MMM yy'), count, loss: parseFloat(loss.toFixed(2)) };
  });

  // ── Write-off by reason ──────────────────────────────────────────────
  const woByReason = WRITEOFF_REASONS.map(r => ({
    name:  r.label,
    icon:  r.icon,
    count: writeoffs.filter(w => w.reason === r.id).length,
    loss:  writeoffs.filter(w => w.reason === r.id).reduce((s, w) => s + (w.totalLoss || 0), 0),
  })).filter(r => r.count > 0).sort((a, b) => b.count - a.count);

  // ── Product movement ─────────────────────────────────────────────────
  const productMovement = products.map(p => ({
    name:  p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name,
    in:    filtered.filter(t => t.type === 'IN'  && t.productId === p.id).reduce((s, t) => s + t.qty, 0),
    out:   filtered.filter(t => t.type === 'OUT' && t.productId === p.id).reduce((s, t) => s + t.qty, 0),
    stock: getProductStock(p.id),
  })).filter(p => p.in > 0 || p.out > 0).sort((a, b) => (b.in + b.out) - (a.in + a.out));

  // ── Inventory valuation ──────────────────────────────────────────────
  const inventoryVal = products.map(p => {
    const prodBatches = batches.filter(b => b.productId === p.id && b.qty > 0);
    const qty   = prodBatches.reduce((s, b) => s + b.qty, 0);
    const val   = prodBatches.reduce((s, b) => s + b.qty * (parseFloat(b.costPrice) || 0), 0);
    const exRisk= prodBatches.filter(b => {
      const s = getExpiryStatus(b.expiryDate).status;
      return s === 'expired' || s === 'critical';
    }).reduce((s, b) => s + b.qty * (parseFloat(b.costPrice) || 0), 0);
    return { ...p, qty, val, exRisk, batchCount: prodBatches.length };
  }).filter(p => p.qty > 0).sort((a, b) => b.val - a.val);

  // ── FULL REPORT EXPORT ────────────────────────────────────────────────
  const exportFullReport = () => {
    const gen = 'Warren Swartz'; // would use currentUser in real impl

    // Section 1: Executive Summary
    const s1 = buildSection(
      '1. Executive Summary',
      ['Metric','Value','Period'],
      [
        ['Units Received',             totalIn.toLocaleString(),   `Last ${days} days`],
        ['Units Dispatched',           totalOut.toLocaleString(),  `Last ${days} days`],
        ['Units Written Off',          totalWO.toLocaleString(),   `Last ${days} days`],
        ['Current Stock Value (Cost)', `R ${totalValue.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})}`, 'Current'],
        ['Write-Off Loss (All Time)',  `R ${totalLoss.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})}`, 'All time'],
        ['Write-Off Loss (This Month)',`R ${lossMonth.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})}`, format(new Date(),'MMMM yyyy')],
        ['Expiry Alerts',              expiringBatches.length.toString(), 'Current'],
        ['Low Stock Products',         products.filter(p => getProductStock(p.id) <= p.minStock).length.toString(), 'Current'],
      ],
      [
        { label: 'Stock Value',      value: `R ${totalValue.toLocaleString('en-ZA',{minimumFractionDigits:0})}`, color: NAVY },
        { label: 'Units Dispatched', value: totalOut.toLocaleString(),    color: '#856404' },
        { label: 'Write-Off Loss',   value: `R ${totalLoss.toFixed(2)}`,  color: '#c00' },
        { label: 'Expiry Alerts',    value: expiringBatches.length,       color: expiringBatches.length > 0 ? '#c00' : '#1a7a35' },
      ]
    );

    // Section 2: Stock Movement
    const s2 = buildSection(
      `2. Stock Movement — Last ${days} Days`,
      ['Date','Type','Product','SKU','Qty','Reference','Customer','Vehicle','Del. Note'],
      transactions.filter(t => new Date(t.date) >= from && t.type !== 'WRITEOFF').slice(0, 200).map(t => {
        const prod = products.find(p => p.id === t.productId);
        const veh  = vehicles.find(v => v.id === t.vehicleId);
        return [
          t.date ? format(new Date(t.date), 'dd/MM/yyyy HH:mm') : '',
          t.type === 'IN'
            ? '<span class="badge-in">IN</span>'
            : '<span class="badge-out">OUT</span>',
          prod?.name || '', prod?.sku || '', t.qty,
          t.reference || '', t.customer || '',
          veh?.registration || '', t.deliveryNote || '',
        ];
      }),
      [
        { label: 'Received',   value: totalIn.toLocaleString(),  color: '#1a7a35' },
        { label: 'Dispatched', value: totalOut.toLocaleString(), color: '#856404' },
        { label: 'Transactions', value: filtered.filter(t=>t.type!=='WRITEOFF').length },
      ]
    );

    // Section 3: Write-Offs & Losses
    const s3 = buildSection(
      '3. Write-Offs & Losses',
      ['Date','Product','Batch','Qty','Reason','Loss (R)','Location','Expiry','Recorded By','Notes'],
      writeoffs.map(w => {
        const prod = products.find(p => p.id === w.productId);
        const usr  = [];
        return [
          w.date ? format(new Date(w.date), 'dd/MM/yyyy HH:mm') : '',
          prod?.name || '',
          w.batchNumber,
          `<span class="badge-wo">-${w.qty}</span>`,
          w.reasonLabel,
          w.totalLoss ? `<strong style="color:#c00">R ${w.totalLoss.toFixed(2)}</strong>` : '—',
          w.location || '—',
          w.expiryDate ? format(new Date(w.expiryDate), 'dd MMM yyyy') : '—',
          w.userId || '—',
          w.note || '—',
        ];
      }),
      [
        { label: 'Total Write-Offs',     value: writeoffs.length,           color: '#c00' },
        { label: 'Total Loss (All Time)', value: `R ${totalLoss.toFixed(2)}`, color: '#c00' },
        { label: 'Loss This Month',      value: `R ${lossMonth.toFixed(2)}`,  color: '#856404' },
      ]
    );

    // Section 4: Inventory Valuation
    const s4 = buildSection(
      '4. Inventory Valuation',
      ['Product','SKU','Category','Supplier','Stock Qty','Batches','Cost Value (R)','At-Risk Value (R)','Min Stock','Status'],
      inventoryVal.map(p => {
        const status = p.qty <= 0 ? '<span class="badge-wo">Out of Stock</span>'
          : p.qty <= p.minStock ? '<span class="badge-warn">Low Stock</span>'
          : '<span class="badge-ok">OK</span>';
        return [
          p.name, p.sku, p.category, p.supplier || '—',
          p.qty, p.batchCount,
          `R ${p.val.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})}`,
          p.exRisk > 0 ? `<strong style="color:#c00">R ${p.exRisk.toFixed(2)}</strong>` : '—',
          p.minStock, status,
        ];
      }),
      [
        { label: 'Total Products',   value: products.length },
        { label: 'Total Stock Value',value: `R ${totalValue.toLocaleString('en-ZA',{minimumFractionDigits:2})}`, color: NAVY },
        { label: 'At-Risk Value',    value: `R ${inventoryVal.reduce((s,p)=>s+p.exRisk,0).toFixed(2)}`, color: '#c00' },
      ]
    );

    // Section 5: Expiry Status
    const s5 = buildSection(
      '5. Expiry Status',
      ['Status','Product','SKU','Batch','Qty','Location','Expiry Date','Days Remaining','Action Required'],
      [...expiringBatches, ...batches.filter(b => b.qty > 0 && !expiringBatches.find(e => e.id === b.id))
        .map(b => ({...b, ...getExpiryStatus(b.expiryDate)}))
        .filter(b => b.status === 'ok').slice(0, 20)
      ].map(b => {
        const prod = products.find(p => p.id === b.productId);
        const badge = b.status === 'expired'  ? '<span class="badge-wo">EXPIRED</span>'
          : b.status === 'critical' ? '<span class="badge-exp">CRITICAL</span>'
          : b.status === 'warning'  ? '<span class="badge-warn">WARNING</span>'
          : '<span class="badge-ok">OK</span>';
        const action = b.status === 'expired'  ? '⛔ Write off immediately'
          : b.status === 'critical' ? '⚡ Dispatch urgently'
          : b.status === 'warning'  ? '📋 Schedule dispatch'
          : '✅ No action needed';
        return [badge, prod?.name || '', prod?.sku || '', b.batchNumber, b.qty,
          b.location || '—', b.expiryDate ? format(new Date(b.expiryDate), 'dd MMM yyyy') : '—',
          b.days, action];
      }),
      [
        { label: 'Expired',  value: expiringBatches.filter(b=>b.status==='expired').length,  color:'#c00' },
        { label: 'Critical', value: expiringBatches.filter(b=>b.status==='critical').length, color:'#856404' },
        { label: 'Warning',  value: expiringBatches.filter(b=>b.status==='warning').length,  color:'#856404' },
      ]
    );

    const html = buildFullReport([
      { title: '1. Summary',       html: s1 },
      { title: '2. Movements',     html: s2 },
      { title: '3. Write-Offs',    html: s3 },
      { title: '4. Valuation',     html: s4 },
      { title: '5. Expiry Status', html: s5 },
    ], gen);

    downloadFile(html, `K4H-Full-Report-${stamp}.html`);
  };

  // ── CSV exports ───────────────────────────────────────────────────────
  const exportCSV = (rows, filename) => {
    const csv = rows.map(r => r.map(v => `"${String(v??'').replace(/<[^>]+>/g,'').replace(/"/g,'""')}"`).join(',')).join('\n');
    downloadFile(csv, filename, 'text/csv');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">Unified reporting — movements, write-offs, valuation and expiry in one place</p>
        </div>
        <button className="btn btn-lg" onClick={exportFullReport}
          style={{ background: NAVY, color:'#fff', gap:8, fontWeight:600 }}>
          <Printer size={16} /> Export Full Report
        </button>
      </div>

      {/* Period selector */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
        <span style={{ fontSize:13, color:'var(--text2)' }}>Period:</span>
        {['7','30','60','90'].map(d => (
          <button key={d} onClick={() => setDateRange(d)}
            className={`btn btn-sm ${dateRange === d ? 'btn-primary' : 'btn-secondary'}`}>{d}d</button>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          ['overview',   '📊 Overview'],
          ['movements',  '📦 Stock Movements'],
          ['writeoffs',  '🗑️ Write-Offs & Losses'],
          ['valuation',  '💰 Inventory Valuation'],
          ['expiry',     '⏰ Expiry Status'],
        ].map(([id, label]) => (
          <button key={id} className={`tab ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <OverviewTab
          totalIn={totalIn} totalOut={totalOut} totalWO={totalWO}
          totalValue={totalValue} totalLoss={totalLoss} lossMonth={lossMonth}
          dailyData={dailyData} productMovement={productMovement}
          monthlyWO={monthlyWO} woByReason={woByReason}
          expiringBatches={expiringBatches} days={days}
          tooltipStyle={tooltipStyle}
        />
      )}

      {/* ── MOVEMENTS ────────────────────────────────────────────────── */}
      {activeTab === 'movements' && (
        <MovementsTab
          transactions={filtered} products={products} vehicles={vehicles}
          totalIn={totalIn} totalOut={totalOut} days={days}
          exportCSV={exportCSV} stamp={stamp} tooltipStyle={tooltipStyle}
          productMovement={productMovement}
        />
      )}

      {/* ── WRITE-OFFS ───────────────────────────────────────────────── */}
      {activeTab === 'writeoffs' && (
        <WriteoffsTab
          writeoffs={writeoffs} products={products}
          totalLoss={totalLoss} lossMonth={lossMonth}
          monthlyWO={monthlyWO} woByReason={woByReason}
          exportCSV={exportCSV} stamp={stamp} tooltipStyle={tooltipStyle}
        />
      )}

      {/* ── VALUATION ────────────────────────────────────────────────── */}
      {activeTab === 'valuation' && (
        <ValuationTab
          inventoryVal={inventoryVal} totalValue={totalValue}
          exportCSV={exportCSV} stamp={stamp} getExpiryStatus={getExpiryStatus}
        />
      )}

      {/* ── EXPIRY ───────────────────────────────────────────────────── */}
      {activeTab === 'expiry' && (
        <ExpiryTab
          batches={batches} products={products}
          expiringBatches={expiringBatches} getExpiryStatus={getExpiryStatus}
          exportCSV={exportCSV} stamp={stamp}
        />
      )}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────
function OverviewTab({ totalIn, totalOut, totalWO, totalValue, totalLoss, lossMonth, dailyData, productMovement, monthlyWO, woByReason, expiringBatches, days, tooltipStyle }) {
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:16, marginBottom:24 }}>
        {[
          { label:'Units Received',      value:totalIn.toLocaleString(),    color:'var(--green)',  sub:`last ${days}d` },
          { label:'Units Dispatched',    value:totalOut.toLocaleString(),   color:'var(--amber)',  sub:`last ${days}d` },
          { label:'Units Written Off',   value:totalWO.toLocaleString(),    color:'var(--red)',    sub:`last ${days}d` },
          { label:'Stock Value (Cost)',   value:`R${(totalValue/1000).toFixed(1)}k`, color:'var(--blue)', sub:'current on-hand' },
          { label:'Write-Off Loss',      value:`R${totalLoss.toFixed(0)}`,  color:'var(--red)',    sub:'all time' },
          { label:'Loss This Month',     value:`R${lossMonth.toFixed(0)}`,  color:'var(--amber)',  sub:format(new Date(),'MMM yyyy') },
          { label:'Expiry Alerts',       value:expiringBatches.length,      color: expiringBatches.length > 0 ? 'var(--red)' : 'var(--green)', sub:`${expiringBatches.filter(b=>b.status==='expired').length} expired` },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color:s.color, fontSize:22 }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        {dailyData.length > 0 && (
          <div className="card">
            <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Daily Movement</span></div>
            <div style={{padding:16,height:220}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                  <XAxis dataKey="date" tick={{fill:'var(--text2)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:'var(--text2)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={tooltipStyle}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="in"       name="In"       fill="#3fb950" radius={[3,3,0,0]}/>
                  <Bar dataKey="out"      name="Out"      fill="#d29922" radius={[3,3,0,0]}/>
                  <Bar dataKey="writeoff" name="Write-Off" fill="#f85149" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {monthlyWO.some(m => m.count > 0) && (
          <div className="card">
            <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Monthly Write-Off Loss (R)</span></div>
            <div style={{padding:16,height:220}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyWO}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                  <XAxis dataKey="month" tick={{fill:'var(--text2)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:'var(--text2)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`R ${v.toFixed(2)}`, 'Loss']}/>
                  <Line type="monotone" dataKey="loss" stroke="#f85149" strokeWidth={2} dot={{fill:'#f85149',r:3}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {woByReason.length > 0 && (
        <div className="card">
          <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Write-Offs by Reason</span></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
            <div style={{padding:16,height:220}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={woByReason} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {woByReason.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v,n,p)=>[`${v} incident${v!==1?'s':''}`,p.payload.name]}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:8,justifyContent:'center'}}>
              {woByReason.map((r,i) => (
                <div key={r.name} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:PIE_COLORS[i%PIE_COLORS.length],flexShrink:0}}/>
                  <span style={{fontSize:12,flex:1}}>{r.icon} {r.name}</span>
                  <span style={{fontSize:12,fontWeight:700}}>{r.count}</span>
                  <span style={{fontSize:11,color:'var(--text2)',minWidth:60,textAlign:'right'}}>R{r.loss.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Movements Tab ──────────────────────────────────────────────────────────
function MovementsTab({ transactions, products, vehicles, totalIn, totalOut, days, exportCSV, stamp, tooltipStyle, productMovement }) {
  const [type, setType] = useState('ALL');
  const shown = type === 'ALL' ? transactions.filter(t=>t.type!=='WRITEOFF')
    : transactions.filter(t => t.type === type);

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:16}}>
        <div style={{display:'flex',gap:8}}>
          {['ALL','IN','OUT'].map(t => (
            <button key={t} onClick={()=>setType(t)} className={`btn btn-sm ${type===t?'btn-primary':'btn-secondary'}`}>{t==='ALL'?'All':t==='IN'?'Stock In':'Stock Out'}</button>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(
          [['Date','Type','Product','SKU','Qty','Reference','Customer','Vehicle','D/N','Note'],
          ...shown.map(t => {
            const p=products.find(x=>x.id===t.productId); const v=vehicles.find(x=>x.id===t.vehicleId);
            return [t.date?format(new Date(t.date),'dd/MM/yyyy HH:mm'):'',t.type,p?.name||'',p?.sku||'',t.qty,t.reference||'',t.customer||'',v?.registration||'',t.deliveryNote||'',t.note||''];
          })], `K4H-Movements-${stamp}.csv`)}>
          <Download size={13}/> Export CSV
        </button>
      </div>

      {productMovement.length > 0 && (
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Top Product Movement</span></div>
          <div style={{padding:16,height:260}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productMovement.slice(0,8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" horizontal={false}/>
                <XAxis type="number" tick={{fill:'var(--text2)',fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{fill:'var(--text2)',fontSize:10}} width={130} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={tooltipStyle}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="in"  name="Received"   fill="#3fb950" radius={[0,3,3,0]}/>
                <Bar dataKey="out" name="Dispatched" fill="#d29922" radius={[0,3,3,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Transaction Log ({shown.length})</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Product</th><th>Qty</th><th>Reference</th><th>Customer</th><th>Vehicle</th><th>D/N</th></tr></thead>
            <tbody>
              {shown.slice(0,100).map(t => {
                const p=products.find(x=>x.id===t.productId); const v=vehicles.find(x=>x.id===t.vehicleId);
                return (
                  <tr key={t.id}>
                    <td style={{fontSize:11,color:'var(--text2)',whiteSpace:'nowrap'}}>{t.date?format(new Date(t.date),'dd/MM/yy HH:mm'):'—'}</td>
                    <td>{t.type==='IN'?<span className="badge badge-green">IN</span>:<span className="badge badge-amber">OUT</span>}</td>
                    <td style={{fontSize:12}}>{p?.name?.slice(0,28)||t.productId}</td>
                    <td style={{fontWeight:600}}>{t.qty}</td>
                    <td className="mono" style={{fontSize:11,color:'var(--text2)'}}>{t.reference||'—'}</td>
                    <td style={{fontSize:12}}>{t.customer||'—'}</td>
                    <td className="mono" style={{fontSize:11}}>{v?.registration||'—'}</td>
                    <td className="mono" style={{fontSize:11,color:'var(--text2)'}}>{t.deliveryNote||'—'}</td>
                  </tr>
                );
              })}
              {shown.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--text2)'}}>No transactions in this period</td></tr>}
            </tbody>
          </table>
        </div>
        {shown.length>100&&<div style={{padding:'10px 20px',fontSize:12,color:'var(--text2)',borderTop:'1px solid var(--border2)'}}>Showing 100 of {shown.length}. Export CSV for full data.</div>}
      </div>
    </div>
  );
}

// ── Write-Offs Tab ─────────────────────────────────────────────────────────
function WriteoffsTab({ writeoffs, products, totalLoss, lossMonth, monthlyWO, woByReason, exportCSV, stamp, tooltipStyle }) {
  const thisMonth = new Date().toISOString().slice(0,7);
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:16,marginBottom:24}}>
        {[
          { label:'Total Write-Offs',    value:writeoffs.length,                color:'var(--red)' },
          { label:'Loss This Month',     value:`R ${lossMonth.toFixed(2)}`,     color:'var(--red)' },
          { label:'Total Loss (Cost)',   value:`R ${totalLoss.toFixed(2)}`,     color:'var(--red)' },
          { label:'Top Reason',          value: woByReason[0] ? `${woByReason[0].icon} ${woByReason[0].name.split(' ')[0]}` : '—', color:'var(--amber)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{color:s.color,fontSize:20}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        {monthlyWO.some(m=>m.count>0) && (
          <div className="card">
            <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Monthly Write-Off Trend</span></div>
            <div style={{padding:16,height:200}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyWO}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)"/>
                  <XAxis dataKey="month" tick={{fill:'var(--text2)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:'var(--text2)',fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={tooltipStyle}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="count" name="Incidents" fill="#f85149" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {woByReason.length > 0 && (
          <div className="card">
            <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Loss by Reason</span></div>
            <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:8}}>
              {woByReason.map((r,i)=>(
                <div key={r.name} style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:16}}>{r.icon}</span>
                  <span style={{fontSize:12,flex:1}}>{r.name}</span>
                  <span className="badge badge-red">{r.count}</span>
                  <span style={{fontSize:12,fontWeight:700,color:'var(--red)',minWidth:70,textAlign:'right'}}>R{r.loss.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
        <button className="btn btn-secondary btn-sm" onClick={()=>exportCSV(
          [['Date','Product','Batch','Qty','Reason','Loss (R)','Location','Expiry','Note'],
          ...writeoffs.map(w=>{const p=products.find(x=>x.id===w.productId);return[w.date?format(new Date(w.date),'dd/MM/yyyy HH:mm'):'',p?.name||'',w.batchNumber,w.qty,w.reasonLabel,w.totalLoss?.toFixed(2)||'',w.location||'',w.expiryDate?format(new Date(w.expiryDate),'dd MMM yyyy'):'',w.note||''];})],
          `K4H-WriteOffs-${stamp}.csv`)}>
          <Download size={13}/> Export CSV
        </button>
      </div>

      <div className="card">
        <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>All Write-Offs ({writeoffs.length})</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Product</th><th>Batch</th><th>Qty</th><th>Reason</th><th>Loss (R)</th><th>Location</th><th>Expiry</th><th>Notes</th></tr></thead>
            <tbody>
              {writeoffs.length===0&&<tr><td colSpan={9} style={{textAlign:'center',padding:40,color:'var(--text2)'}}>No write-offs recorded yet.</td></tr>}
              {writeoffs.map(w=>{
                const p=products.find(x=>x.id===w.productId);
                return(
                  <tr key={w.id}>
                    <td style={{fontSize:11,color:'var(--text2)',whiteSpace:'nowrap'}}>{w.date?format(new Date(w.date),'dd/MM/yy HH:mm'):'—'}</td>
                    <td style={{fontSize:12,fontWeight:500}}>{p?.name?.slice(0,26)||w.productId}</td>
                    <td className="mono" style={{fontSize:11}}>{w.batchNumber}</td>
                    <td><span className="badge badge-red" style={{fontSize:11}}>-{w.qty}</span></td>
                    <td style={{fontSize:12}}>{w.reasonLabel}</td>
                    <td style={{color:'var(--red)',fontWeight:700,fontSize:12}}>{w.totalLoss?`R ${w.totalLoss.toFixed(2)}`:'—'}</td>
                    <td><span className="badge badge-gray mono" style={{fontSize:10}}>{w.location||'—'}</span></td>
                    <td style={{fontSize:11,color:'var(--text2)'}}>{w.expiryDate?format(new Date(w.expiryDate),'dd MMM yy'):'—'}</td>
                    <td style={{fontSize:11,color:'var(--text2)',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{w.note||'—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Valuation Tab ──────────────────────────────────────────────────────────
function ValuationTab({ inventoryVal, totalValue, exportCSV, stamp, getExpiryStatus }) {
  const atRisk = inventoryVal.reduce((s,p)=>s+p.exRisk,0);
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16,marginBottom:24}}>
        {[
          { label:'Total Stock Value', value:`R ${totalValue.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})}`, color:'var(--blue)' },
          { label:'At-Risk Value',     value:`R ${atRisk.toFixed(2)}`,  color:'var(--red)',   sub:'Expired / critical batches' },
          { label:'Healthy Value',     value:`R ${(totalValue-atRisk).toFixed(2)}`, color:'var(--green)' },
          { label:'Products in Stock', value:inventoryVal.length, color:'var(--text)' },
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{color:s.color,fontSize:20}}>{s.value}</div>
            {s.sub&&<div className="stat-sub">{s.sub}</div>}
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
        <button className="btn btn-secondary btn-sm" onClick={()=>exportCSV(
          [['Product','SKU','Category','Supplier','Stock Qty','Batches','Cost Value (R)','At-Risk Value (R)','Min Stock'],
          ...inventoryVal.map(p=>[p.name,p.sku,p.category,p.supplier||'',p.qty,p.batchCount,p.val.toFixed(2),p.exRisk.toFixed(2),p.minStock])],
          `K4H-Valuation-${stamp}.csv`)}>
          <Download size={13}/> Export CSV
        </button>
      </div>
      <div className="card">
        <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Stock Valuation by Product</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock Qty</th><th>Batches</th><th>Cost Value (R)</th><th>At-Risk Value</th><th>Min Stock</th><th>Status</th></tr></thead>
            <tbody>
              {inventoryVal.map(p=>(
                <tr key={p.id}>
                  <td style={{fontSize:12,fontWeight:500}}>{p.name}</td>
                  <td className="mono" style={{fontSize:11}}>{p.sku}</td>
                  <td style={{fontSize:11,color:'var(--text2)'}}>{p.category}</td>
                  <td style={{fontWeight:700}}>{p.qty}</td>
                  <td style={{fontSize:12}}>{p.batchCount}</td>
                  <td style={{fontWeight:700,color:'var(--blue)'}}>R {p.val.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                  <td style={{color:p.exRisk>0?'var(--red)':'var(--text3)',fontWeight:p.exRisk>0?700:400}}>
                    {p.exRisk>0?`R ${p.exRisk.toFixed(2)}`:'—'}
                  </td>
                  <td style={{fontSize:12}}>{p.minStock}</td>
                  <td>
                    {p.qty<=0?<span className="badge badge-red">Out of stock</span>
                      :p.qty<=p.minStock?<span className="badge badge-amber">Low</span>
                      :<span className="badge badge-green">OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Expiry Tab ─────────────────────────────────────────────────────────────
function ExpiryTab({ batches, products, expiringBatches, getExpiryStatus, exportCSV, stamp }) {
  const [filter, setFilter] = useState('alerts');
  const allActive = batches.filter(b=>b.qty>0).map(b=>({...b,...getExpiryStatus(b.expiryDate)}));
  const shown = filter==='alerts' ? expiringBatches
    : filter==='ok'     ? allActive.filter(b=>b.status==='ok').slice(0,50)
    : allActive;

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:16,marginBottom:20}}>
        {[
          { label:'Expired',  value:expiringBatches.filter(b=>b.status==='expired').length,  color:'var(--red)' },
          { label:'Critical', value:expiringBatches.filter(b=>b.status==='critical').length, color:'var(--amber)' },
          { label:'Warning',  value:expiringBatches.filter(b=>b.status==='warning').length,  color:'var(--amber)' },
          { label:'Healthy',  value:allActive.filter(b=>b.status==='ok').length,             color:'var(--green)' },
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{color:s.color,fontSize:24}}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:14}}>
        <div style={{display:'flex',gap:8}}>
          {[['alerts','⚠️ Alerts Only'],['ok','✅ Healthy'],['all','All Batches']].map(([id,label])=>(
            <button key={id} onClick={()=>setFilter(id)} className={`btn btn-sm ${filter===id?'btn-primary':'btn-secondary'}`}>{label}</button>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={()=>exportCSV(
          [['Status','Product','SKU','Batch','Qty','Location','Expiry Date','Days Remaining'],
          ...shown.map(b=>{const p=products.find(x=>x.id===b.productId);return[b.status.toUpperCase(),p?.name||'',p?.sku||'',b.batchNumber,b.qty,b.location||'',b.expiryDate?format(new Date(b.expiryDate),'dd/MM/yyyy'):'',b.days];})],
          `K4H-Expiry-${stamp}.csv`)}>
          <Download size={13}/> Export CSV
        </button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Status</th><th>Product</th><th>Batch</th><th>Qty</th><th>Location</th><th>Expiry Date</th><th>Days</th><th>Action</th></tr></thead>
            <tbody>
              {shown.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--text2)'}}>No batches in this category.</td></tr>}
              {shown.map(b=>{
                const p=products.find(x=>x.id===b.productId);
                const action=b.status==='expired'?'⛔ Write off':b.status==='critical'?'⚡ Dispatch now':b.status==='warning'?'📋 Schedule':'✅ OK';
                return(
                  <tr key={b.id}>
                    <td>
                      {b.status==='expired'?<span className="badge badge-red">EXPIRED</span>
                        :b.status==='critical'?<span className="badge badge-red">CRITICAL</span>
                        :b.status==='warning'?<span className="badge badge-amber">WARNING</span>
                        :<span className="badge badge-green">OK</span>}
                    </td>
                    <td style={{fontSize:12,fontWeight:500}}>{p?.name?.slice(0,28)||b.productId}</td>
                    <td className="mono" style={{fontSize:11}}>{b.batchNumber}</td>
                    <td style={{fontWeight:700}}>{b.qty}</td>
                    <td><span className="badge badge-gray mono" style={{fontSize:10}}>{b.location||'—'}</span></td>
                    <td style={{fontSize:12}}>{b.expiryDate?format(new Date(b.expiryDate),'dd MMM yyyy'):'—'}</td>
                    <td style={{fontWeight:600,color:b.status==='expired'?'var(--red)':b.status==='critical'?'var(--amber)':b.status==='warning'?'var(--amber)':'var(--green)'}}>{b.days}d</td>
                    <td style={{fontSize:12}}>{action}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
