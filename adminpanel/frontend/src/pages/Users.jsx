import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Users as UsersIcon, Plus, Search, X, Edit2, Lock, Trash2, Shield, Loader2 } from 'lucide-react';

const ROLE_C = { standard: '#64748b', 'team-lead': '#2563eb', executive: '#7c3aed', admin: '#dc2626' };

const Users = () => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await api.get('/users', { params: { search } }); setUsers(data.users || []); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [search]);

  if (!hasRole('admin')) return (
    <div className="text-center py-20">
      <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Super Admin Only</p>
      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>User management requires Super Admin access.</p>
    </div>
  );

  const handleCreate = async (form) => {
    try { await api.post('/users', form); toast.success('User created!'); fetch(); setShowCreate(false); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleUpdate = async (id, form) => {
    try { await api.put(`/users/${id}`, form); toast.success('Updated!'); fetch(); setEditUser(null); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try { await api.delete(`/users/${id}`); toast.success('Deactivated'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const handleResetPw = async (id) => {
    const pw = prompt('Enter new password (min 8 chars):');
    if (!pw || pw.length < 8) return toast.error('Password must be 8+ chars');
    try { await api.put(`/users/${id}/reset-password`, { newPassword: pw }); toast.success('Password reset'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <UsersIcon className="w-6 h-6" style={{ color: 'var(--brand-accent)' }} /> User Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Create, edit, and manage all users</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-accent)' }}>
          <Plus className="w-4 h-4" /> Create User
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
          className="flex-1 bg-transparent text-sm focus:outline-none" style={{ color: 'var(--text-primary)' }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-accent)' }} /></div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}>
                <th className="text-left px-4 py-3 font-bold text-xs uppercase" style={{ color: 'var(--text-muted)' }}>User</th>
                <th className="text-left px-4 py-3 font-bold text-xs uppercase hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Position</th>
                <th className="text-left px-4 py-3 font-bold text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Role</th>
                <th className="text-left px-4 py-3 font-bold text-xs uppercase hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="text-right px-4 py-3 font-bold text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b hover:bg-[var(--bg-hover)] transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: ROLE_C[u.role] || '#64748b' }}>
                        {(u.firstName || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>{u.position || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold capitalize" style={{ backgroundColor: `${ROLE_C[u.role]}15`, color: ROLE_C[u.role] }}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-bold ${u.isActive ? 'text-green-600' : 'text-red-500'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditUser(u)} className="p-1.5 rounded-lg" style={{ color: 'var(--brand-accent)' }}><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleResetPw(u._id)} className="p-1.5 rounded-lg" style={{ color: '#d97706' }}><Lock className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeactivate(u._id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      {(showCreate || editUser) && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowCreate(false); setEditUser(null); }} />
          <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <UserForm user={editUser} onSubmit={editUser ? (f) => handleUpdate(editUser._id, f) : handleCreate}
              onCancel={() => { setShowCreate(false); setEditUser(null); }} />
          </motion.div>
        </>
      )}
    </div>
  );
};

const UserForm = ({ user, onSubmit, onCancel }) => {
  const [f, setF] = useState({
    firstName: user?.firstName || '', lastName: user?.lastName || '', otherName: user?.otherName || '',
    position: user?.position || '', unitSector: user?.unitSector || '', email: user?.email || '',
    role: user?.role || 'standard', password: '', isActive: user?.isActive ?? true,
  });
  const isEdit = !!user;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>{isEdit ? 'Edit User' : 'Create User'}</h2>
        <button onClick={onCancel} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
      </div>
      {['firstName', 'lastName', 'otherName', 'position', 'unitSector', 'email'].map(field => (
        <input key={field} value={f[field]} onChange={e => setF(p => ({ ...p, [field]: e.target.value }))}
          placeholder={field.replace(/([A-Z])/g, ' $1').trim()} className="w-full px-3 py-2.5 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
      ))}
      {!isEdit && (
        <input type="password" value={f.password} onChange={e => setF(p => ({ ...p, password: e.target.value }))}
          placeholder="Password (min 8 chars)" className="w-full px-3 py-2.5 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
      )}
      <select value={f.role} onChange={e => setF(p => ({ ...p, role: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
        {['standard', 'team-lead', 'executive', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-primary)' }}>
          <input type="checkbox" checked={f.isActive} onChange={e => setF(p => ({ ...p, isActive: e.target.checked }))} style={{ accentColor: 'var(--brand-accent)' }} />
          Active account
        </label>
      )}
      <button onClick={() => onSubmit(f)} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-accent)' }}>
        {isEdit ? 'Save Changes' : 'Create User'}
      </button>
    </div>
  );
};

export default Users;
