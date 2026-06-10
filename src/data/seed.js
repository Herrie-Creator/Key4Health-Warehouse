// ─── Seed data — users only, all stock/vehicle/transaction data cleared ───

export const INITIAL_USERS = [
  {
    id: 'u1',
    name: 'Warren Thomas',
    username: 'Warren',
    password: 'warren123',
    role: 'manager',
    email: 'warren@key4health.co.za',
    avatar: 'WS',
    color: '#388bfd',
    active: true,
    createdAt: '2024-01-01',
  },
  {
    id: 'u2',
    name: 'Divan',
    username: 'Divan',
    password: 'divan123',
    role: 'warehouse',
    email: 'divan@key4health.co.za',
    avatar: 'DN',
    color: '#3fb950',
    active: true,
    createdAt: '2024-01-01',
  },
];

export const INITIAL_PRODUCTS     = [];
export const INITIAL_STOCK_BATCHES = [];
export const INITIAL_VEHICLES      = [];
export const INITIAL_TRANSACTIONS  = [];

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
