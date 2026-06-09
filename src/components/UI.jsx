import React, { useEffect, useRef } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext.jsx';

// ── Toast container ────────────────────────────────────────────────────────
export function Toasts() {
  const { toasts } = useApp();
  const icons = { success: <CheckCircle size={15} />, error: <AlertCircle size={15} />, warning: <AlertTriangle size={15} />, info: <Info size={15} /> };
  const colors = { success: 'var(--green)', error: 'var(--red)', warning: 'var(--amber)', info: 'var(--blue)' };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast" style={{ borderLeftColor: colors[t.type], borderLeftWidth: 3 }}>
          <span style={{ color: colors[t.type] }}>{icons[t.type]}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ── Modal wrapper ──────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, footer, size = '' }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${size}`}>
        <div className="modal-header">
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Confirm dialog ─────────────────────────────────────────────────────────
export function ConfirmModal({ title, message, onConfirm, onClose, danger = false }) {
  return (
    <Modal title={title} onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>
          Confirm
        </button>
      </>
    }>
      <p style={{ color: 'var(--text2)', fontSize: 14 }}>{message}</p>
    </Modal>
  );
}

// ── Scanner input ──────────────────────────────────────────────────────────
export function ScannerInput({ onScan, placeholder = 'Scan barcode or type SKU…', autoFocus = true }) {
  const ref = useRef();
  const bufferRef = useRef('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    // Hardware scanners typically end with Enter
    if (e.key === 'Enter') {
      const val = ref.current.value.trim();
      if (val) { onScan(val); ref.current.value = ''; }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={ref}
        className="scanner-field scanner-pulse"
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck={false}
      />
      <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text3)' }}>
        Press Enter
      </div>
    </div>
  );
}

// ── Expiry badge ───────────────────────────────────────────────────────────
export function ExpiryBadge({ expiryDate }) {
  const { getExpiryStatus } = useApp();
  const { label, cls } = getExpiryStatus(expiryDate);
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ── Role badge ─────────────────────────────────────────────────────────────
export function RoleBadge({ role }) {
  return role === 'manager'
    ? <span className="badge badge-blue">Manager</span>
    : <span className="badge badge-green">Warehouse</span>;
}

// ── Empty state ────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

// ── Search bar ─────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <input
      className="form-input"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ maxWidth: 320 }}
    />
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────
export function Avatar({ user, size = 32 }) {
  return (
    <div className="user-avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: user.color || '#388bfd' }}>
      {user.avatar || user.name?.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Stock level bar ────────────────────────────────────────────────────────
export function StockBar({ qty, min }) {
  const pct = Math.min((qty / (min * 2)) * 100, 100);
  const color = qty <= 0 ? 'var(--red)' : qty <= min ? 'var(--amber)' : 'var(--green)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>{qty}</span>
    </div>
  );
}
