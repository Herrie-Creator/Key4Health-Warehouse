import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';
import { Avatar } from './UI.jsx';
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  Truck, Users, BarChart2, AlertTriangle, LogOut, Menu, X, Settings,
} from 'lucide-react';

const NAV_MANAGER = [
  { id: 'dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'stock-in',   label: 'Stock In',     icon: ArrowDownToLine },
  { id: 'stock-out',  label: 'Stock Out',    icon: ArrowUpFromLine },
  { id: 'inventory',  label: 'Inventory',    icon: Package },
  { id: 'expiry',     label: 'Expiry Alerts',icon: AlertTriangle,  alert: true },
  { id: 'deliveries', label: 'Deliveries',   icon: Truck },
  { id: 'reports',    label: 'Reports',      icon: BarChart2 },
  { id: 'users',      label: 'User Management', icon: Users },
];

const NAV_WAREHOUSE = [
  { id: 'dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'stock-in',   label: 'Stock In',     icon: ArrowDownToLine },
  { id: 'stock-out',  label: 'Stock Out',    icon: ArrowUpFromLine },
  { id: 'inventory',  label: 'Inventory',    icon: Package },
  { id: 'expiry',     label: 'Expiry Alerts',icon: AlertTriangle,  alert: true },
  { id: 'deliveries', label: 'Deliveries',   icon: Truck },
];

export default function AppLayout({ page, setPage }) {
  const { currentUser, logout, isManager } = useAuth();
  const { expiredCount, criticalCount } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = isManager ? NAV_MANAGER : NAV_WAREHOUSE;
  const alertCount = expiredCount + criticalCount;

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    return (
      <button
        className={`nav-item ${page === item.id ? 'active' : ''}`}
        onClick={() => { setPage(item.id); setMobileOpen(false); }}
      >
        <Icon size={15} />
        {item.label}
        {item.alert && alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
      </button>
    );
  };

  const SidebarContent = () => (
    <>
      <div className="sidebar-logo">
        <h1>Key4Health</h1>
        <p>WMS · v1.0</p>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Navigation</div>
        {nav.map(item => <NavItem key={item.id} item={item} />)}
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
          <button className="btn btn-ghost btn-icon" onClick={logout} title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="layout">
      {/* Desktop sidebar */}
      <nav className="sidebar" style={{ display: 'flex' }}>
        <SidebarContent />
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ background: 'rgba(0,0,0,0.6)', flex: 1 }} onClick={() => setMobileOpen(false)} />
          <nav style={{ width: 220, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <SidebarContent />
          </nav>
        </div>
      )}

      {/* Main */}
      <div className="main-content">
        <div className="topbar">
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost btn-icon" onClick={() => setMobileOpen(!mobileOpen)}
              style={{ display: 'none' }}
              id="mobile-menu-btn">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {nav.find(n => n.id === page)?.label || 'Dashboard'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alertCount > 0 && (
              <button className="btn btn-sm" onClick={() => setPage('expiry')}
                style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(248,81,73,0.3)', gap: 6 }}>
                <AlertTriangle size={13} />
                {alertCount} expiry alert{alertCount > 1 ? 's' : ''}
              </button>
            )}
            <div className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--text2)' }}>
              <Avatar user={currentUser} size={26} />
              <span>{currentUser.name.split(' ')[0]}</span>
            </div>
          </div>
        </div>
        <div className="page-content" id="page-content">
          {/* Page rendered by parent */}
        </div>
      </div>

      <style>{`
        @media(max-width:768px) {
          #mobile-menu-btn { display: flex !important; }
          .sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
