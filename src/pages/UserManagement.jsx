import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Modal, RoleBadge, Avatar } from '../components/UI.jsx';
import { Plus, Edit2, UserX, Key, ShieldCheck, Shield, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useApp();
  const { currentUser } = useAuth();
  const [modal, setModal]     = useState(null);
  const [editing, setEditing] = useState(null);

  const activeUsers = users.filter(u => u.active !== false);
  const inactiveUsers = users.filter(u => u.active === false);

  return (
    <div>
      <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">Manage staff accounts, roles, and access levels</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModal('user'); }}>
          <Plus size={15} /> Add User
        </button>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <ShieldCheck size={14} />
        <div><strong>Roles:</strong> Managers can access all features, view reports, manage users, products, and vehicles. Warehouse staff can book stock in/out, view inventory, and check expiry alerts.</div>
      </div>

      {/* Active users */}
      <div className="section-title">Active Staff ({activeUsers.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {activeUsers.map(u => (
          <div key={u.id} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar user={u} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600 }}>{u.name}</span>
                  <RoleBadge role={u.role} />
                  {u.id === currentUser.id && <span className="badge badge-purple">You</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
                  @{u.username} · {u.email || 'No email set'} · Joined {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(u); setModal('user'); }}>
                  <Edit2 size={12} /> Edit
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(u); setModal('password'); }}>
                  <Key size={12} /> Password
                </button>
                {u.id !== currentUser.id && (
                  <button className="btn btn-danger btn-sm" onClick={() => { if (confirm(`Deactivate ${u.name}?`)) deleteUser(u.id); }}>
                    <UserX size={12} /> Deactivate
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inactive users */}
      {inactiveUsers.length > 0 && (
        <>
          <div className="section-title">Deactivated ({inactiveUsers.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inactiveUsers.map(u => (
              <div key={u.id} className="card" style={{ padding: '14px 20px', opacity: 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar user={u} size={36} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600 }}>{u.name}</span>
                    <span style={{ marginLeft: 8 }}><RoleBadge role={u.role} /></span>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>@{u.username}</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => updateUser(u.id, { active: true })}>
                    Reactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modal === 'user' && (
        <UserModal
          user={editing}
          onSave={(data) => {
            if (editing) updateUser(editing.id, data);
            else addUser(data);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'password' && editing && (
        <PasswordModal
          user={editing}
          onSave={(newPassword) => { updateUser(editing.id, { password: newPassword }); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function UserModal({ user, onSave, onClose }) {
  const init = user || { name: '', username: '', password: '', email: '', role: 'warehouse', avatar: '', color: '#3fb950' };
  const [form, setForm] = useState(init);
  const [showPw, setShowPw] = useState(false);
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const initials = form.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Modal title={user ? 'Edit User' : 'Add User'} onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => {
          if (!form.name || !form.username) return;
          if (!user && !form.password) return;
          onSave({ ...form, avatar: initials || form.avatar });
        }}>
          {user ? 'Save Changes' : 'Create User'}
        </button>
      </>
    }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="First Last" />
          </div>
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input className="form-input mono" value={form.username} onChange={e => f('username', e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="username" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" value={form.email || ''} onChange={e => f('email', e.target.value)} placeholder="name@key4health.co.za" />
        </div>
        {!user && (
          <div className="form-group">
            <label className="form-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showPw ? 'text' : 'password'} value={form.password || ''} onChange={e => f('password', e.target.value)} placeholder="Set a strong password" style={{ paddingRight: 42 }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-select" value={form.role} onChange={e => f('role', e.target.value)}>
            <option value="warehouse">Warehouse Staff</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Avatar Colour</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['#388bfd','#3fb950','#d29922','#f85149','#a371f7','#fd8c73','#56d364','#79c0ff'].map(c => (
              <button key={c} onClick={() => f('color', c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--text)' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PasswordModal({ user, onSave, onClose }) {
  const [pw, setPw]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow]   = useState(false);
  const { toast } = useApp();

  const handleSave = () => {
    if (!pw) { toast('Enter a new password', 'error'); return; }
    if (pw !== confirm) { toast('Passwords do not match', 'error'); return; }
    onSave(pw);
  };

  return (
    <Modal title={`Change Password — ${user.name}`} onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>Update Password</button>
      </>
    }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <div style={{ position: 'relative' }}>
            <input className="form-input" type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="New password" style={{ paddingRight: 42 }} />
            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}>
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input className="form-input" type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" />
        </div>
      </div>
    </Modal>
  );
}
