import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Bell, Plus, Trash2, Search, Loader2, X, Clock } from 'lucide-react';
import { format } from 'date-fns';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const [r, u] = await Promise.all([api.get('/reminders'), api.get('/team/available-users')]);
      setReminders(r.data.reminders || []);
      setUsers(u.data.users || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = async (id) => {
    try { await api.delete(`/reminders/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const handleCreate = async (form) => {
    try {
      await api.post('/reminders', form);
      toast.success('Reminder created!'); setShowCreate(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const STATUS_C = { pending: '#d97706', sent: '#16a34a', snoozed: '#3b82f6', dismissed: '#64748b' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Bell className="w-6 h-6" style={{ color: 'var(--brand-accent)' }} /> Reminders
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Manage team reminders</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-accent)' }}>
          <Plus className="w-4 h-4" /> Create Reminder
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-accent)' }} /></div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <Bell className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>No active reminders</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r, i) => {
            const userName = r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Unknown';
            const sc = STATUS_C[r.status] || '#64748b';
            return (
              <motion.div key={r._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .02 }}
                className="rounded-xl border p-4 flex items-center justify-between gap-3"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{r.message}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize" style={{ backgroundColor: `${sc}15`, color: sc }}>{r.status}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>{r.type?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{userName}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(r.remindAt), 'MMM dd, yyyy h:mm a')}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(r._id)} className="p-2 rounded-lg flex-shrink-0" style={{ color: '#dc2626' }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCreate(false)} />
          <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>New Reminder</h2>
              <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
            </div>
            <ReminderForm users={users} onSubmit={handleCreate} />
          </motion.div>
        </>
      )}
    </div>
  );
};

const ReminderForm = ({ users, onSubmit }) => {
  const [f, setF] = useState({ userId: '', type: 'custom', message: '', remindAt: '' });
  return (
    <div className="space-y-4">
      <select value={f.userId} onChange={e => setF(p => ({ ...p, userId: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
        <option value="">Select user…</option>
        {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
      </select>
      <select value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
        {['task_due', 'meeting', 'goal_deadline', 'custom'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
      </select>
      <input value={f.message} onChange={e => setF(p => ({ ...p, message: e.target.value }))} placeholder="Reminder message *"
        className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
      <input type="datetime-local" value={f.remindAt} onChange={e => setF(p => ({ ...p, remindAt: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
      <button onClick={() => {
        if (!f.userId || !f.message || !f.remindAt) return toast.error('Fill all fields');
        onSubmit(f);
      }} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-accent)' }}>Create Reminder</button>
    </div>
  );
};

export default Reminders;
