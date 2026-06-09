import React, { useState } from 'react';
import { AppProvider } from './contexts/AppContext.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import { Toasts } from './components/UI.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import StockIn from './pages/StockIn.jsx';
import StockOut from './pages/StockOut.jsx';
import Inventory from './pages/Inventory.jsx';
import ExpiryAlerts from './pages/ExpiryAlerts.jsx';
import Deliveries from './pages/Deliveries.jsx';
import Reports from './pages/Reports.jsx';
import UserManagement from './pages/UserManagement.jsx';

function AppInner() {
  const { currentUser, isManager } = useAuth();
  const [page, setPage] = useState('dashboard');

  if (!currentUser) return <Login />;

  const renderPage = () => {
    switch (page) {
      case 'dashboard':  return <Dashboard setPage={setPage} />;
      case 'stock-in':   return <StockIn />;
      case 'stock-out':  return <StockOut />;
      case 'inventory':  return <Inventory />;
      case 'expiry':     return <ExpiryAlerts />;
      case 'deliveries': return <Deliveries />;
      case 'reports':    return isManager ? <Reports /> : <div style={{padding:40,color:'var(--text2)'}}>Access restricted to managers.</div>;
      case 'users':      return isManager ? <UserManagement /> : <div style={{padding:40,color:'var(--text2)'}}>Access restricted to managers.</div>;
      default:           return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar + topbar */}
      <AppLayout page={page} setPage={setPage} />

      {/* Page content injected into the main area via portal-like approach */}
      <style>{`
        .main-content .page-content { display: none; }
      `}</style>

      <Toasts />
    </div>
  );
}

// Re-architect: AppLayout owns the shell, page renders inside it
function AppShell() {
  const { currentUser, isManager } = useAuth();
  const [page, setPage] = useState('dashboard');

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
      case 'users':      return isManager ? <UserManagement /> : <Restricted />;
      default:           return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <div className="layout">
      {/* Sidebar nav */}
      <SidebarNav page={page} setPage={setPage} />

      {/* Main area */}
      <div className="main-content">
        <Topbar page={page} setPage={setPage} />
        <div className="page-content">
          {renderPage()}
        </div>
      </div>

      <Toasts />
    </div>
  );
}

function Restricted() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text2)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>Access Restricted</h2>
      <p style={{ fontSize: 14 }}>This section is only available to Managers.</p>
    </div>
  );
}

// ── Inline Sidebar (self-contained so AppLayout.jsx stays as reference) ──────
import { useApp } from './contexts/AppContext.jsx';
import { Avatar } from './components/UI.jsx';
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  Truck, Users, BarChart2, AlertTriangle, LogOut, Menu, X,
} from 'lucide-react';
import { useState as useStateAlias } from 'react';

const NAV_MANAGER = [
  { id: 'dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'stock-in',   label: 'Stock In',         icon: ArrowDownToLine },
  { id: 'stock-out',  label: 'Stock Out',        icon: ArrowUpFromLine },
  { id: 'inventory',  label: 'Inventory',        icon: Package },
  { id: 'expiry',     label: 'Expiry Alerts',    icon: AlertTriangle, alert: true },
  { id: 'deliveries', label: 'Deliveries',       icon: Truck },
  { id: 'reports',    label: 'Reports',          icon: BarChart2 },
  { id: 'users',      label: 'User Management',  icon: Users },
];

const NAV_WAREHOUSE = [
  { id: 'dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'stock-in',   label: 'Stock In',      icon: ArrowDownToLine },
  { id: 'stock-out',  label: 'Stock Out',     icon: ArrowUpFromLine },
  { id: 'inventory',  label: 'Inventory',     icon: Package },
  { id: 'expiry',     label: 'Expiry Alerts', icon: AlertTriangle, alert: true },
  { id: 'deliveries', label: 'Deliveries',    icon: Truck },
];

function SidebarNav({ page, setPage }) {
  const { currentUser, logout, isManager } = useAuth();
  const { expiredCount, criticalCount } = useApp();
  const [mobileOpen, setMobileOpen] = useStateAlias(false);
  const alertCount = expiredCount + criticalCount;
  const nav = isManager ? NAV_MANAGER : NAV_WAREHOUSE;

  const Content = () => (
    <>
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#2ea043,#388bfd)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={14} color="#fff" />
          </div>
          <div>
            <h1>Key4Health</h1>
            <p>WMS · v1.0</p>
          </div>
        </div>
      </div>

      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-section-label">Navigation</div>
        {nav.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => { setPage(item.id); setMobileOpen(false); }}>
              <Icon size={15} />
              {item.label}
              {item.alert && alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
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
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'capitalize' }}>{currentUser.role}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={logout} title="Sign out" style={{ flexShrink: 0 }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <nav className="sidebar" id="desktop-sidebar">
        <Content />
      </nav>

      {/* Mobile toggle button (shown via CSS) */}
      <button id="mob-toggle" onClick={() => setMobileOpen(true)}
        style={{ display: 'none', position: 'fixed', top: 12, left: 12, zIndex: 60, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--text)' }}>
        <Menu size={18} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 55, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.65)' }} onClick={() => setMobileOpen(false)} />
          <nav style={{ width: 240, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 12px 0' }}>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={18} /></button>
            </div>
            <Content />
          </nav>
        </div>
      )}

      <style>{`
        @media(max-width: 768px) {
          #desktop-sidebar { display: none !important; }
          #mob-toggle { display: flex !important; }
          .topbar-title { margin-left: 44px; }
        }
      `}</style>
    </>
  );
}

function Topbar({ page, setPage }) {
  const { expiredCount, criticalCount } = useApp();
  const { currentUser } = useAuth();
  const alertCount = expiredCount + criticalCount;
  const labels = {
    dashboard: 'Dashboard', 'stock-in': 'Stock In', 'stock-out': 'Stock Out',
    inventory: 'Inventory', expiry: 'Expiry Alerts', deliveries: 'Deliveries',
    reports: 'Reports', users: 'User Management',
  };

  return (
    <div className="topbar">
      <span className="topbar-title" style={{ fontWeight: 600, fontSize: 15 }}>{labels[page] || 'Dashboard'}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {alertCount > 0 && (
          <button onClick={() => setPage('expiry')} className="btn btn-sm"
            style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(248,81,73,0.3)', gap: 5 }}>
            <AlertTriangle size={12} />
            {alertCount} alert{alertCount > 1 ? 's' : ''}
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text2)' }}>
          <Avatar user={currentUser} size={26} />
          <span style={{ display: 'none' }} id="user-name-topbar">{currentUser.name.split(' ')[0]}</span>
        </div>
      </div>
      <style>{`@media(min-width:480px){#user-name-topbar{display:inline!important}}`}</style>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </AppProvider>
  );
}
