import React, { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { Toasts, Avatar } from './components/UI.jsx';
import Login from './pages/Login.jsx';
import { LogoSidebar, LogoIcon } from './components/Logo.jsx';
import Dashboard from './pages/Dashboard.jsx';
import StockIn from './pages/StockIn.jsx';
import StockOut from './pages/StockOut.jsx';
import Inventory from './pages/Inventory.jsx';
import ExpiryAlerts from './pages/ExpiryAlerts.jsx';
import Deliveries from './pages/Deliveries.jsx';
import Reports from './pages/Reports.jsx';
import UserManagement from './pages/UserManagement.jsx';
import WriteOff from './pages/WriteOff.jsx';
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  Truck, Users, BarChart2, AlertTriangle, LogOut, Menu, X, Trash2,
} from 'lucide-react';

// ── Navigation config ─────────────────────────────────────────────────────
const NAV_MANAGER = [
  { id: 'dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'stock-in',   label: 'Stock In',        icon: ArrowDownToLine },
  { id: 'stock-out',  label: 'Stock Out',       icon: ArrowUpFromLine },
  { id: 'inventory',  label: 'Inventory',       icon: Package },
  { id: 'expiry',     label: 'Expiry Alerts',   icon: AlertTriangle, alert: true },
  { id: 'deliveries', label: 'Deliveries',      icon: Truck },
  { id: 'reports',    label: 'Reports',         icon: BarChart2 },
  { id: 'write-off',  label: 'Write-Off / Damage', icon: Trash2 },
  { id: 'users',      label: 'User Management', icon: Users },
];
const NAV_WAREHOUSE = [
  { id: 'dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'stock-in',   label: 'Stock In',      icon: ArrowDownToLine },
  { id: 'stock-out',  label: 'Stock Out',     icon: ArrowUpFromLine },
  { id: 'inventory',  label: 'Inventory',     icon: Package },
  { id: 'expiry',     label: 'Expiry Alerts', icon: AlertTriangle, alert: true },
  { id: 'deliveries', label: 'Deliveries',    icon: Truck },
  { id: 'write-off',  label: 'Write-Off / Damage', icon: Trash2 },
];

const PAGE_LABELS = {
  dashboard: 'Dashboard', 'stock-in': 'Stock In', 'stock-out': 'Stock Out',
  inventory: 'Inventory', expiry: 'Expiry Alerts', deliveries: 'Deliveries',
  reports: 'Reports', 'write-off': 'Write-Off / Damage', users: 'User Management',
};

// ── Sidebar ───────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, mobileOpen, setMobileOpen }) {
  const { currentUser, logout, isManager } = useAuth();
  const { expiredCount, criticalCount } = useApp();
  const alertCount = expiredCount + criticalCount;
  const nav = isManager ? NAV_MANAGER : NAV_WAREHOUSE;

  const Inner = () => (
    <>
      <div className="sidebar-logo" style={{ padding: '14px 12px' }}>
        <LogoSidebar width={168} />
        <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 4, letterSpacing: '0.5px', textAlign: 'center' }}>WMS · v1.0</div>
      </div>

      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-section-label">Navigation</div>
        {nav.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => { setPage(item.id); setMobileOpen(false); }}
            >
              <Icon size={15} />
              {item.label}
              {item.alert && alertCount > 0 && (
                <span className="nav-badge">{alertCount}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="user-chip">
          <Avatar user={currentUser} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.name.split(' ')[0]}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'capitalize' }}>
              {currentUser.role}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={logout} title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="sidebar">
        <Inner />
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 55, display: 'flex' }}>
          <div
            style={{ flex: 1, background: 'rgba(0,0,0,0.65)' }}
            onClick={() => setMobileOpen(false)}
          />
          <nav style={{
            width: 240, background: 'var(--surface)',
            borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 12px 0' }}>
              <button
                onClick={() => setMobileOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}
              >
                <X size={18} />
              </button>
            </div>
            <Inner />
          </nav>
        </div>
      )}
    </>
  );
}

// ── Top bar ───────────────────────────────────────────────────────────────
function Topbar({ page, setPage, setMobileOpen }) {
  const { currentUser } = useAuth();
  const { expiredCount, criticalCount } = useApp();
  const alertCount = expiredCount + criticalCount;

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          className="btn btn-ghost btn-icon mob-only"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={18} />
        </button>
        <span style={{ fontWeight: 600, fontSize: 15 }}>
          {PAGE_LABELS[page] || 'Dashboard'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {alertCount > 0 && (
          <button
            onClick={() => setPage('expiry')}
            className="btn btn-sm"
            style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(248,81,73,0.3)', gap: 5 }}
          >
            <AlertTriangle size={12} />
            {alertCount} alert{alertCount > 1 ? 's' : ''}
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text2)' }}>
          <Avatar user={currentUser} size={26} />
          <span className="desk-only">{currentUser.name.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  );
}

// ── Access guard ──────────────────────────────────────────────────────────
function Restricted() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text2)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>Access Restricted</h2>
      <p style={{ fontSize: 14 }}>This section is only available to Managers.</p>
    </div>
  );
}

// ── Main shell ────────────────────────────────────────────────────────────
function AppShell() {
  const { currentUser, isManager } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser) return <Login />;

  const renderPage = () => {
    switch (page) {
      case 'dashboard':  return <Dashboard setPage={setPage} />;
      case 'stock-in':   return <StockIn />;
      case 'stock-out':  return <StockOut />;
      case 'inventory':  return <Inventory />;
      case 'expiry':     return <ExpiryAlerts />;
      case 'deliveries': return <Deliveries />;
      case 'reports':    return isManager ? <Reports /> : <Restricted />;
      case 'write-off':  return <WriteOff />;
      case 'users':      return isManager ? <UserManagement /> : <Restricted />;
      default:           return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <>
      <div className="layout">
        <Sidebar
          page={page}
          setPage={setPage}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <div className="main-content">
          <Topbar page={page} setPage={setPage} setMobileOpen={setMobileOpen} />
          <div className="page-content">
            {renderPage()}
          </div>
        </div>
      </div>

      <Toasts />

      <style>{`
        .mob-only { display: none !important; }
        @media(max-width: 768px) {
          .sidebar { display: none !important; }
          .mob-only { display: flex !important; }
          .desk-only { display: none !important; }
        }
      `}</style>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </AppProvider>
  );
}
