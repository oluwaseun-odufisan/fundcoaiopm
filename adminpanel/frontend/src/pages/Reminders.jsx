//Reminders.jsx
import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Bell, Plus, Trash2, X, Clock, Users } from 'lucide-react';

const STATUS_C = { pending: { c: '#d97706', bg: '#fffbeb' }, sent: { c: '#059669', bg: '#ecfdf5' }, snoozed: { c: '#2563eb', bg: '#eff6ff' }, dismissed: { c: '#6b7494', bg: '#f7f8fb' } };

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, u] = await Promise.all([api.get('/reminders'), api.get('/team/available-users')]);
      setReminders(r.data.reminders || []);
      setUsers(u.data.users || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id) => {
    try { await api.delete(`/reminders/${id}`); toast.success('Deleted'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const handleCreate = async (form) => {
    try { await api.post('/reminders', form); toast.success('Reminder created!'); setShowCreate(false); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>Reminders</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--c-text-2)' }}>Manage team reminders and notifications</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" /> Create Reminder</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : reminders.length === 0 ? (
        <div className="card text-center py-20">
          <Bell className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--c-text-3)' }} />
          <p className="text-[15px] font-semibold" style={{ color: 'var(--c-text-1)' }}>No active reminders</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {reminders.map((r, i) => {
            const userName = r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Unknown';
            const sc = STATUS_C[r.status] || STATUS_C.pending;
            return (
              <motion.div key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="flex items-center justify-between gap-4 px-6 py-4 table-row"
                style={{ borderBottom: '1px solid var(--c-border-subtle)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--c-text-0)' }}>{r.message}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: 'var(--c-text-3)' }}>
                    <span className="badge capitalize" style={{ background: sc.bg, color: sc.c }}>{r.status}</span>
                    <span className="badge capitalize" style={{ background: 'var(--c-surface-raised)', color: 'var(--c-text-2)' }}>{r.type?.replace(/_/g, ' ')}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{userName}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(r.remindAt), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(r._id)} className="btn-ghost p-2 flex-shrink-0" style={{ color: 'var(--c-danger)' }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl p-6"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-xl)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--c-text-0)' }}>New Reminder</h2>
                <button onClick={() => setShowCreate(false)} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
              </div>
              <ReminderForm users={users} onSubmit={handleCreate} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReminderForm = ({ users, onSubmit }) => {
  const [f, setF] = useState({ userId: '', type: 'custom', message: '', remindAt: '' });
  return (
    <div className="space-y-4">
      <div><label className="label">For User</label>
        <select value={f.userId} onChange={e => setF(p => ({ ...p, userId: e.target.value }))} className="input-base">
          <option value="">Select user…</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
        </select></div>
      <div><label className="label">Type</label>
        <select value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value }))} className="input-base">
          {['task_due', 'meeting', 'goal_deadline', 'custom'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select></div>
      <div><label className="label">Message</label>
        <input value={f.message} onChange={e => setF(p => ({ ...p, message: e.target.value }))} className="input-base" placeholder="Reminder message" /></div>
      <div><label className="label">Remind At</label>
        <input type="datetime-local" value={f.remindAt} onChange={e => setF(p => ({ ...p, remindAt: e.target.value }))} className="input-base" /></div>
      <button onClick={() => { if (!f.userId || !f.message || !f.remindAt) return toast.error('Fill all fields'); onSubmit(f); }}
        className="btn-primary w-full" style={{ height: 44 }}>Create Reminder</button>
    </div>
  );
};

export default Reminders;
