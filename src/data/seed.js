// ─── Initial seed data ───────────────────────────────────────────────────────

export const INITIAL_USERS = [
  {
    id: 'u1',
    name: 'Warren Thomas',
    username: 'warren',
    password: 'warren123',
    role: 'manager',
    email: 'warren@key4health.co.za',
    avatar: 'WT',
    color: '#388bfd',
    active: true,
    createdAt: '2026-06-09',
  },
  {
    id: 'u2',
    name: 'Divan',
    username: 'divan',
    password: 'divan123',
    role: 'warehouse',
    email: 'divan@key4health.co.za',
    avatar: 'D',
    color: '#3fb950',
    active: true,
    createdAt: '2026-06-09',
  },
];

export const INITIAL_PRODUCTS = [
  { id: 'p1', barcode: '6009874561234', name: 'Carbsmart Soup – Cream of Mushroom 68g', sku: 'CSM-001', category: 'Food & Beverage', unit: 'Box', supplier: 'Carbsmart', minStock: 50, notes: '' },
  { id: 'p2', barcode: '6009874565678', name: 'Spiced Yogi Tea 50g', sku: 'SYT-001', category: 'Tea & Infusions', unit: 'Box', supplier: 'Yogi Tea', minStock: 100, notes: '' },
  { id: 'p3', barcode: '6009874569012', name: 'Spiced Black Tea 50g', sku: 'SBT-001', category: 'Tea & Infusions', unit: 'Box', supplier: 'Yogi Tea', minStock: 100, notes: '' },
  { id: 'p4', barcode: '6009874563456', name: 'Spiced Rooibos Tea 50g', sku: 'SRT-001', category: 'Tea & Infusions', unit: 'Box', supplier: 'Yogi Tea', minStock: 80, notes: '' },
  { id: 'p5', barcode: '6009874567890', name: 'Almond Protein Bar 45g', sku: 'APB-001', category: 'Snacks', unit: 'Case (24)', supplier: 'NutriBar SA', minStock: 30, notes: '' },
  { id: 'p6', barcode: '6009874562345', name: 'Oat Milk 1L', sku: 'OMK-001', category: 'Dairy Alternatives', unit: 'Carton', supplier: 'Oatly SA', minStock: 60, notes: '' },
  { id: 'p7', barcode: '6009874566789', name: 'Coconut Water 330ml', sku: 'CWT-001', category: 'Beverages', unit: 'Case (12)', supplier: 'Coco Pure', minStock: 40, notes: '' },
];

export const today = () => new Date().toISOString().split('T')[0];
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

export const INITIAL_STOCK_BATCHES = [
  { id: 'sb1', productId: 'p1', batchNumber: 'CSM-2024-001', qty: 120, receivedDate: addDays(today(), -30), expiryDate: addDays(today(), 180), location: 'A-01', poNumber: 'PO-001', costPrice: 28.00 },
  { id: 'sb2', productId: 'p2', batchNumber: 'SYT-2024-001', qty: 200, receivedDate: addDays(today(), -15), expiryDate: addDays(today(), 25), location: 'B-02', poNumber: 'PO-002', costPrice: 32.00 },
  { id: 'sb3', productId: 'p2', batchNumber: 'SYT-2024-002', qty: 150, receivedDate: addDays(today(), -5), expiryDate: addDays(today(), 365), location: 'B-03', poNumber: 'PO-003', costPrice: 32.00 },
  { id: 'sb4', productId: 'p3', batchNumber: 'SBT-2024-001', qty: 180, receivedDate: addDays(today(), -20), expiryDate: addDays(today(), 8), location: 'B-04', poNumber: 'PO-002', costPrice: 32.00 },
  { id: 'sb5', productId: 'p4', batchNumber: 'SRT-2024-001', qty: 90, receivedDate: addDays(today(), -10), expiryDate: addDays(today(), 300), location: 'B-05', poNumber: 'PO-004', costPrice: 32.00 },
  { id: 'sb6', productId: 'p5', batchNumber: 'APB-2024-001', qty: 60, receivedDate: addDays(today(), -45), expiryDate: addDays(today(), -5), location: 'C-01', poNumber: 'PO-005', costPrice: 18.00 },
  { id: 'sb7', productId: 'p6', batchNumber: 'OMK-2024-001', qty: 144, receivedDate: addDays(today(), -7), expiryDate: addDays(today(), 60), location: 'D-01', poNumber: 'PO-006', costPrice: 22.00 },
  { id: 'sb8', productId: 'p7', batchNumber: 'CWT-2024-001', qty: 96, receivedDate: addDays(today(), -3), expiryDate: addDays(today(), 120), location: 'D-02', poNumber: 'PO-007', costPrice: 14.00 },
];

export const INITIAL_VEHICLES = [
  { id: 'v1', registration: 'GP 123-456', make: 'Toyota', model: 'Hilux', driver: 'Sipho Mokoena', active: true },
  { id: 'v2', registration: 'JHB 789-012', make: 'Ford', model: 'Transit', driver: 'Themba Dlamini', active: true },
  { id: 'v3', registration: 'GP 345-678', make: 'Isuzu', model: 'NPR', driver: 'Johan van der Berg', active: true },
];

export const INITIAL_TRANSACTIONS = [
  {
    id: 't1', type: 'IN', productId: 'p1', batchId: 'sb1', qty: 120,
    date: addDays(today(), -30), userId: 'u2', reference: 'PO-001',
    note: 'Opening stock', vehicleId: null, deliveryNote: 'DN-001',
  },
  {
    id: 't2', type: 'OUT', productId: 'p1', batchId: 'sb1', qty: 24,
    date: addDays(today(), -10), userId: 'u2', reference: 'SO-001',
    note: 'Woolworths Rosebank', vehicleId: 'v1', deliveryNote: 'DN-002',
  },
  {
    id: 't3', type: 'IN', productId: 'p2', batchId: 'sb2', qty: 200,
    date: addDays(today(), -15), userId: 'u2', reference: 'PO-002',
    note: '', vehicleId: null, deliveryNote: 'DN-003',
  },
  {
    id: 't4', type: 'OUT', productId: 'p2', batchId: 'sb2', qty: 50,
    date: addDays(today(), -5), userId: 'u2', reference: 'SO-002',
    note: 'Clicks Menlyn', vehicleId: 'v2', deliveryNote: 'DN-004',
  },
];

export const CATEGORIES = [
  'Food & Beverage', 'Tea & Infusions', 'Snacks', 'Dairy Alternatives',
  'Beverages', 'Health Supplements', 'Personal Care', 'Other',
];

export const LOCATIONS = [
  'A-01','A-02','A-03','A-04',
  'B-01','B-02','B-03','B-04','B-05',
  'C-01','C-02','C-03',
  'D-01','D-02','D-03',
  'COLD-01','COLD-02',
  'QUARANTINE',
];
