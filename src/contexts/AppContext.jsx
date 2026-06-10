import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  INITIAL_USERS, INITIAL_PRODUCTS, INITIAL_STOCK_BATCHES,
  INITIAL_VEHICLES, INITIAL_TRANSACTIONS,
} from '../data/seed.js';

const AppContext = createContext(null);

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const save = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

// Write-off reason codes
export const WRITEOFF_REASONS = [
  { id: 'damaged_packaging', label: 'Damaged Packaging',    icon: '📦', color: '#d29922' },
  { id: 'damaged_product',   label: 'Damaged Product',      icon: '💔', color: '#d29922' },
  { id: 'torn_bag',          label: 'Torn / Burst Bag',     icon: '🛍️', color: '#d29922' },
  { id: 'dented_can',        label: 'Dented / Crushed Can', icon: '🥫', color: '#d29922' },
  { id: 'leaking',           label: 'Leaking / Spillage',   icon: '💧', color: '#d29922' },
  { id: 'contaminated',      label: 'Contaminated',         icon: '⚠️', color: '#f85149' },
  { id: 'expired',           label: 'Expired Stock',        icon: '📅', color: '#f85149' },
  { id: 'recall',            label: 'Product Recall',       icon: '🚨', color: '#f85149' },
  { id: 'theft_loss',        label: 'Theft / Loss',         icon: '🔍', color: '#f85149' },
  { id: 'other',             label: 'Other',                icon: '📋', color: '#8b949e' },
];

export function AppProvider({ children }) {
  const [users,        setUsersRaw]    = useState(() => load('k4h_users',        INITIAL_USERS));
  const [products,     setProductsRaw] = useState(() => load('k4h_products',     INITIAL_PRODUCTS));
  const [batches,      setBatchesRaw]  = useState(() => load('k4h_batches',      INITIAL_STOCK_BATCHES));
  const [vehicles,     setVehiclesRaw] = useState(() => load('k4h_vehicles',     INITIAL_VEHICLES));
  const [transactions, setTransRaw]    = useState(() => load('k4h_transactions', INITIAL_TRANSACTIONS));
  const [writeoffs,    setWriteoffsRaw]= useState(() => load('k4h_writeoffs',    []));
  const [toasts,       setToasts]      = useState([]);

  useEffect(() => { save('k4h_users',        users);        }, [users]);
  useEffect(() => { save('k4h_products',     products);     }, [products]);
  useEffect(() => { save('k4h_batches',      batches);      }, [batches]);
  useEffect(() => { save('k4h_vehicles',     vehicles);     }, [vehicles]);
  useEffect(() => { save('k4h_transactions', transactions); }, [transactions]);
  useEffect(() => { save('k4h_writeoffs',    writeoffs);    }, [writeoffs]);

  const setUsers    = setUsersRaw;
  const setProducts = setProductsRaw;
  const setBatches  = setBatchesRaw;
  const setVehicles = setVehiclesRaw;
  const setTrans    = setTransRaw;
  const setWriteoffs= setWriteoffsRaw;

  // ── Toast ─────────────────────────────────────────────────────────────────
  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  // ── Expiry helpers (defined early — used by stockOut + writeOff) ──────────
  const getExpiryStatus = (expiryDate) => {
    const days = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
    if (days < 0)   return { status: 'expired', days, label: `Expired ${Math.abs(days)}d ago`, cls: 'expiry-critical badge-red' };
    if (days <= 14) return { status: 'critical', days, label: `${days}d left`, cls: 'expiry-critical badge-red' };
    if (days <= 30) return { status: 'warning',  days, label: `${days}d left`, cls: 'expiry-warning badge-amber' };
    return { status: 'ok', days, label: `${days}d left`, cls: 'expiry-ok badge-gray' };
  };

  // ── Products ──────────────────────────────────────────────────────────────
  const addProduct = (p) => {
    const prod = { ...p, id: 'p' + Date.now() };
    setProducts(prev => [...prev, prod]);
    toast('Product added: ' + p.name);
    return prod;
  };
  const updateProduct = (id, changes) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
    toast('Product updated');
  };
  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast('Product removed', 'info');
  };
  const findByBarcode = (barcode) => products.find(p => p.barcode === barcode.trim());

  // ── Batches ───────────────────────────────────────────────────────────────
  const getProductStock = (productId) =>
    batches.filter(b => b.productId === productId).reduce((s, b) => s + b.qty, 0);

  const addBatch = (b) => {
    const batch = { ...b, id: 'sb' + Date.now() };
    setBatches(prev => [...prev, batch]);
    return batch;
  };
  const deductBatch = (batchId, qty) => {
    setBatches(prev =>
      prev.map(b => b.id === batchId ? { ...b, qty: b.qty - qty } : b).filter(b => b.qty > 0)
    );
  };

  // ── Transactions ──────────────────────────────────────────────────────────
  const addTransaction = (t) => {
    const tx = { ...t, id: 'tx' + Date.now(), date: new Date().toISOString() };
    setTrans(prev => [tx, ...prev]);
    return tx;
  };

  // ── Stock IN ──────────────────────────────────────────────────────────────
  const stockIn = (data, userId) => {
    const { productId, qty, batchNumber, expiryDate, location, poNumber, costPrice, receivedDate } = data;
    const batch = addBatch({
      productId, batchNumber, qty: parseInt(qty), expiryDate, location,
      poNumber: poNumber || '', costPrice: parseFloat(costPrice) || 0,
      receivedDate: receivedDate || new Date().toISOString().split('T')[0],
    });
    addTransaction({
      type: 'IN', productId, batchId: batch.id, qty: parseInt(qty), userId,
      reference: poNumber || '', note: data.note || '',
      vehicleId: null, deliveryNote: data.deliveryNote || '',
    });
    const prod = products.find(p => p.id === productId);
    toast(`Booked IN: ${qty} × ${prod?.name || productId}`);
  };

  // ── Stock OUT (FEFO) ──────────────────────────────────────────────────────
  const stockOut = (data, userId) => {
    let remaining = parseInt(data.qty);
    const prod = products.find(p => p.id === data.productId);
    const productBatches = batches
      .filter(b => b.productId === data.productId && b.qty > 0)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    for (const batch of productBatches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.qty, remaining);
      deductBatch(batch.id, take);
      addTransaction({
        type: 'OUT', productId: data.productId, batchId: batch.id, qty: take, userId,
        reference: data.reference || '', note: data.note || '',
        vehicleId: data.vehicleId || null, deliveryNote: data.deliveryNote || '',
        customer: data.customer || '',
      });
      remaining -= take;
    }
    toast(`Booked OUT: ${data.qty} × ${prod?.name || data.productId}`);
  };

  // ── FEFO check — returns warnings before dispatch ─────────────────────────
  // Returns { hasExpired, hasOlderFirst, expiredBatches, olderBatches, nextBatch }
  const checkFEFO = (productId) => {
    const productBatches = batches
      .filter(b => b.productId === productId && b.qty > 0)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    if (productBatches.length === 0) return null;

    const expiredBatches = productBatches.filter(b => getExpiryStatus(b.expiryDate).status === 'expired');
    const nextBatch = productBatches[0];
    const nextStatus = getExpiryStatus(nextBatch.expiryDate);

    return {
      hasExpired:    expiredBatches.length > 0,
      expiredBatches,
      nextBatch,
      nextStatus,
      allBatches:    productBatches,
      batchCount:    productBatches.length,
    };
  };

  // ── Write-off ─────────────────────────────────────────────────────────────
  // Removes stock and logs a write-off record with reason
  const writeOff = (data, userId) => {
    const { productId, batchId, qty, reason, reasonLabel, note, photos } = data;
    const prod  = products.find(p => p.id === productId);
    const batch = batches.find(b => b.id === batchId);

    if (!batch) { toast('Batch not found', 'error'); return; }
    if (parseInt(qty) > batch.qty) { toast(`Only ${batch.qty} units available in this batch`, 'error'); return; }

    // Deduct from batch
    deductBatch(batchId, parseInt(qty));

    // Log write-off record
    const wo = {
      id:          'wo' + Date.now(),
      productId,
      batchId,
      batchNumber: batch.batchNumber,
      qty:         parseInt(qty),
      reason,
      reasonLabel,
      note:        note || '',
      userId,
      date:        new Date().toISOString(),
      expiryDate:  batch.expiryDate,
      location:    batch.location,
      costPrice:   batch.costPrice,
      totalLoss:   (parseFloat(batch.costPrice) || 0) * parseInt(qty),
    };
    setWriteoffs(prev => [wo, ...prev]);

    // Also log in transactions as WRITEOFF type
    addTransaction({
      type: 'WRITEOFF', productId, batchId, qty: parseInt(qty), userId,
      reference: `WO-${wo.id.slice(-6).toUpperCase()}`,
      note: `[${reasonLabel}] ${note || ''}`.trim(),
      vehicleId: null, deliveryNote: '', customer: '',
      reason, reasonLabel,
    });

    toast(`Write-off recorded: ${qty} × ${prod?.name || productId} (${reasonLabel})`, 'warning');
    return wo;
  };

  // ── Users ─────────────────────────────────────────────────────────────────
  const addUser = (u) => {
    const user = { ...u, id: 'u' + Date.now(), createdAt: new Date().toISOString().split('T')[0], active: true };
    setUsers(prev => [...prev, user]);
    toast('User created: ' + u.name);
    return user;
  };
  const updateUser = (id, changes) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...changes } : u));
    toast('User updated');
  };
  const deleteUser = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: false } : u));
    toast('User deactivated', 'info');
  };

  // ── Vehicles ──────────────────────────────────────────────────────────────
  const addVehicle = (v) => {
    const vehicle = { ...v, id: 'v' + Date.now() };
    setVehicles(prev => [...prev, vehicle]);
    toast('Vehicle added');
    return vehicle;
  };
  const updateVehicle = (id, changes) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...changes } : v));
  };
  const deleteVehicle = (id) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
    toast('Vehicle removed', 'info');
  };

  // ── Derived expiry data ───────────────────────────────────────────────────
  const expiringBatches = batches
    .filter(b => b.qty > 0)
    .map(b => ({ ...b, ...getExpiryStatus(b.expiryDate) }))
    .filter(b => b.status !== 'ok')
    .sort((a, b) => a.days - b.days);

  const expiredCount  = expiringBatches.filter(b => b.status === 'expired').length;
  const criticalCount = expiringBatches.filter(b => b.status === 'critical').length;
  const lowStockProducts = products.filter(p => getProductStock(p.id) <= p.minStock);

  // Total write-off value this month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const writeoffThisMonth = writeoffs
    .filter(w => w.date?.startsWith(thisMonth))
    .reduce((s, w) => s + (w.totalLoss || 0), 0);

  return (
    <AppContext.Provider value={{
      users, products, batches, vehicles, transactions, writeoffs, toasts,
      addProduct, updateProduct, deleteProduct, findByBarcode,
      getProductStock, addBatch, deductBatch,
      stockIn, stockOut, writeOff, checkFEFO,
      addUser, updateUser, deleteUser,
      addVehicle, updateVehicle, deleteVehicle,
      getExpiryStatus, expiringBatches, expiredCount, criticalCount,
      lowStockProducts, writeoffThisMonth, toast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
