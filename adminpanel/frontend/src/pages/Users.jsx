import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Users as UsersIcon, Plus, Search, X, Edit2, Lock, Trash2, Shield } from 'lucide-react';

const ROLE_C = { standard: '#6b7494', 'team-lead': '#2563eb', executive: '#7c3aed', admin: '#dc2626' };
const Users = () => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false); const [editUser, setEditUser] = useState(null);
  const fetchUsers = async () => { setLoading(true); try { const { data } = await api.get('/users', { params: { search } }); setUsers(data.users||[]); } catch { toast.error('Failed'); } finally { setLoading(false); } };
  useEffect(() => { fetchUsers(); }, [search]);

  if (!hasRole('admin')) return <div className="card text-center py-20"><Shield className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--c-text-3)' }} /><p className="text-[15px] font-semibold" style={{ color: 'var(--c-text-1)' }}>Super Admin only</p></div>;
  const handleCreate = async (f) => { try { await api.post('/users', f); toast.success('User created!'); fetchUsers(); setShowForm(false); } catch(e) { toast.error(e.response?.data?.message||'Failed'); } };
  const handleUpdate = async (id, f) => { try { await api.put(`/users/${id}`, f); toast.success('Updated'); fetchUsers(); setEditUser(null); setShowForm(false); } catch(e) { toast.error(e.response?.data?.message||'Failed'); } };
  const handleDeactivate = async (id) => { if (!confirm('Deactivate?')) return; try { await api.delete(`/users/${id}`); toast.success('Deactivated'); fetchUsers(); } catch { toast.error('Failed'); } };
  const handleResetPw = async (id) => { const pw = prompt('New password (8+ chars):'); if (!pw||pw.length<8) return; try { await api.put(`/users/${id}/reset-password`, { newPassword: pw }); toast.success('Password reset'); } catch { toast.error('Failed'); } };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div><h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>User Management</h1><p className="text-[14px] mt-1" style={{ color: 'var(--c-text-2)' }}>Create, edit, and manage users</p></div>
        <button onClick={() => { setEditUser(null); setShowForm(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Create User</button>
      </div>
      <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-text-3)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className="input-base" style={{ paddingLeft: 38 }} /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-7 h-7 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} /></div>
      : <div className="card overflow-hidden"><table className="w-full"><thead><tr>
        <th className="table-header">User</th><th className="table-header hidden md:table-cell">Position</th><th className="table-header">Role</th><th className="table-header hidden sm:table-cell">Status</th><th className="table-header text-right">Actions</th>
      </tr></thead><tbody>{users.map(u => (
        <tr key={u._id} className="table-row">
          <td className="table-cell"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold" style={{ background: ROLE_C[u.role]||'#6b7494' }}>{(u.firstName||'U')[0]}</div><div><p className="text-[13px] font-semibold" style={{ color: 'var(--c-text-0)' }}>{u.firstName} {u.lastName}</p><p className="text-[11px]" style={{ color: 'var(--c-text-3)' }}>{u.email}</p></div></div></td>
          <td className="table-cell hidden md:table-cell" style={{ color: 'var(--c-text-2)' }}>{u.position||'—'}</td>
          <td className="table-cell"><span className="badge capitalize" style={{ background: `${ROLE_C[u.role]}12`, color: ROLE_C[u.role] }}>{u.role}</span></td>
          <td className="table-cell hidden sm:table-cell"><span className="badge" style={{ background: u.isActive?'#ecfdf5':'#fef2f2', color: u.isActive?'#059669':'#dc2626' }}>{u.isActive?'Active':'Inactive'}</span></td>
          <td className="table-cell text-right"><div className="flex justify-end gap-1">
            <button onClick={() => { setEditUser(u); setShowForm(true); }} className="btn-ghost p-1.5" style={{ color: 'var(--c-accent)' }}><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => handleResetPw(u._id)} className="btn-ghost p-1.5" style={{ color: '#d97706' }}><Lock className="w-3.5 h-3.5" /></button>
            <button onClick={() => handleDeactivate(u._id)} className="btn-ghost p-1.5" style={{ color: '#dc2626' }}><Trash2 className="w-3.5 h-3.5" /></button>
          </div></td>
        </tr>))}</tbody></table></div>}

      <AnimatePresence>{showForm && <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={() => { setShowForm(false); setEditUser(null); }} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl p-6"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-xl)' }}>
          <UserForm user={editUser} onSubmit={editUser ? f => handleUpdate(editUser._id, f) : handleCreate} onCancel={() => { setShowForm(false); setEditUser(null); }} />
        </motion.div>
      </>}</AnimatePresence>
    </div>);
};
const UserForm = ({ user, onSubmit, onCancel }) => {
  const [f, setF] = useState({ firstName: user?.firstName||'', lastName: user?.lastName||'', otherName: user?.otherName||'', position: user?.position||'', unitSector: user?.unitSector||'', email: user?.email||'', role: user?.role||'standard', password: '', isActive: user?.isActive ?? true });
  const isEdit = !!user;
  return (<div className="space-y-4">
    <div className="flex justify-between"><h2 className="text-[16px] font-bold" style={{ color: 'var(--c-text-0)' }}>{isEdit?'Edit User':'Create User'}</h2><button onClick={onCancel} className="btn-ghost p-2"><X className="w-4 h-4" /></button></div>
    {['firstName','lastName','otherName','position','unitSector','email'].map(k => (<div key={k}><label className="label">{k.replace(/([A-Z])/g,' $1').trim()}</label><input value={f[k]} onChange={e => setF(p => ({ ...p, [k]: e.target.value }))} className="input-base" placeholder={k} /></div>))}
    {!isEdit && <div><label className="label">Password</label><input type="password" value={f.password} onChange={e => setF(p => ({ ...p, password: e.target.value }))} className="input-base" placeholder="Min 8 chars" /></div>}
    <div><label className="label">Role</label><select value={f.role} onChange={e => setF(p => ({ ...p, role: e.target.value }))} className="input-base">{['standard','team-lead','executive','admin'].map(r => <option key={r} value={r}>{r}</option>)}</select></div>
    {isEdit && <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: 'var(--c-text-0)' }}><input type="checkbox" checked={f.isActive} onChange={e => setF(p => ({ ...p, isActive: e.target.checked }))} style={{ accentColor: 'var(--c-accent)' }} /> Active account</label>}
    <button onClick={() => onSubmit(f)} className="btn-primary w-full" style={{ height: 44 }}>{isEdit?'Save Changes':'Create User'}</button>
  </div>);
};
export default Users;
