import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Target, Plus, Search, X, Send, Loader2, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const Goals = () => {
  const { hasRole } = useAuth();
  const [goals, setGoals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [viewGoal, setViewGoal] = useState(null);
  const [stats, setStats] = useState({});

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filter !== 'all') params.type = filter;
      const [g, s, u] = await Promise.all([api.get('/goals', { params }), api.get('/goals/stats'), api.get('/team/available-users')]);
      setGoals(g.data.goals || []); setStats(s.data.stats || {}); setUsers(u.data.users || []);
    } catch { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  }, [search, filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const calcPct = (g) => {
    if (!g.subGoals?.length) return 0;
    return Math.round((g.subGoals.filter(s => s.completed).length / g.subGoals.length) * 100);
  };

  const handleCreate = async (data) => {
    try {
      await api.post('/goals', data);
      toast.success('Goal created!'); fetch(); setShowCreate(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const addComment = async (goalId, content) => {
    try {
      await api.post(`/goals/${goalId}/comment`, { content });
      toast.success('Comment added'); fetch(); setViewGoal(null);
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Target className="w-6 h-6" style={{ color: 'var(--brand-accent)' }} /> Goals
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Track team and org goals</p>
        </div>
        {hasRole('team-lead', 'admin') && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-accent)' }}>
            <Plus className="w-4 h-4" /> Create Goal
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l: 'Total', v: stats.total || 0, c: 'var(--brand-accent)' },
          { l: 'Active', v: stats.active || 0, c: '#d97706' },
          { l: 'Completed', v: stats.completed || 0, c: '#16a34a' },
          { l: 'Avg Progress', v: `${stats.avgProgress || 0}%`, c: '#7c3aed' },
        ].map(s => (
          <div key={s.l} className="rounded-xl border p-3 text-center" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <p className="text-xl font-black" style={{ color: s.c }}>{s.v}</p>
            <p className="text-[10px] uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search goals…"
          className="flex-1 bg-transparent text-sm focus:outline-none" style={{ color: 'var(--text-primary)' }} />
      </div>

      {/* Goals list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-accent)' }} /></div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <Target className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>No goals found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {goals.map((goal, i) => {
            const pct = calcPct(goal);
            const ownerName = goal.owner ? `${goal.owner.firstName} ${goal.owner.lastName}` : 'Unassigned';
            return (
              <motion.div key={goal._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .03 }}
                onClick={() => setViewGoal(goal)}
                className="rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{goal.title}</h3>
                  <span className="text-sm font-black flex-shrink-0" style={{ color: pct === 100 ? '#16a34a' : 'var(--brand-accent)' }}>{pct}%</span>
                </div>
                <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ownerName}</span>
                  <span className="capitalize">{goal.timeframe}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#16a34a' : 'var(--brand-accent)' }} />
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  {goal.subGoals?.filter(s => s.completed).length || 0}/{goal.subGoals?.length || 0} sub-goals
                </p>
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
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <CreateGoalForm users={users} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
          </motion.div>
        </>
      )}

      {/* View goal modal */}
      {viewGoal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setViewGoal(null)} />
          <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <GoalDetail goal={viewGoal} onClose={() => setViewGoal(null)} onComment={addComment} />
          </motion.div>
        </>
      )}
    </div>
  );
};

const CreateGoalForm = ({ users, onSubmit, onCancel }) => {
  const [f, setF] = useState({ title: '', ownerId: '', timeframe: 'weekly', type: 'personal', startDate: '', endDate: '', subGoals: [] });
  const [sub, setSub] = useState('');
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!f.title || !f.ownerId) return toast.error('Title and assignee required');
    if (!f.subGoals.length) return toast.error('Add at least one sub-goal');
    setSaving(true);
    await onSubmit({ ...f, startDate: f.startDate || new Date().toISOString(), endDate: f.endDate || new Date(Date.now() + 7 * 86400000).toISOString() });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>Create Goal</h2>
        <button onClick={onCancel} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
      </div>
      <select value={f.ownerId} onChange={e => setF(p => ({ ...p, ownerId: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
        <option value="">Assign to…</option>
        {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
      </select>
      <input value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} placeholder="Goal title"
        className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
      <div className="grid grid-cols-2 gap-3">
        <select value={f.timeframe} onChange={e => setF(p => ({ ...p, timeframe: e.target.value }))}
          className="px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
          {['daily', 'weekly', 'monthly', 'quarterly'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value }))}
          className="px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
          <option value="personal">Personal</option><option value="task">Task</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="date" value={f.startDate} onChange={e => setF(p => ({ ...p, startDate: e.target.value }))}
          className="px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
        <input type="date" value={f.endDate} onChange={e => setF(p => ({ ...p, endDate: e.target.value }))}
          className="px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Sub-Goals ({f.subGoals.length})</p>
        {f.subGoals.map((s, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <span className="flex-1 text-sm">{s.title}</span>
            <button onClick={() => setF(p => ({ ...p, subGoals: p.subGoals.filter((_, idx) => idx !== i) }))} style={{ color: '#dc2626' }}><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <div className="flex gap-2">
          <input value={sub} onChange={e => setSub(e.target.value)} placeholder="Add sub-goal…"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (sub.trim()) { setF(p => ({ ...p, subGoals: [...p.subGoals, { title: sub.trim(), completed: false }] })); setSub(''); } } }}
            className="flex-1 px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
          <button onClick={() => { if (sub.trim()) { setF(p => ({ ...p, subGoals: [...p.subGoals, { title: sub.trim(), completed: false }] })); setSub(''); } }}
            className="px-4 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-accent)' }}>Add</button>
        </div>
      </div>
      <button onClick={handle} disabled={saving} className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: 'var(--brand-accent)' }}>
        {saving ? 'Creating…' : 'Create Goal'}
      </button>
    </div>
  );
};

const GoalDetail = ({ goal, onClose, onComment }) => {
  const [comment, setComment] = useState('');
  const pct = goal.subGoals?.length ? Math.round((goal.subGoals.filter(s => s.completed).length / goal.subGoals.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>{goal.title}</h2>
        <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
      </div>
      <div className="flex justify-between text-xs mb-1"><span style={{ color: 'var(--text-muted)' }}>Progress</span><span className="font-bold" style={{ color: 'var(--brand-accent)' }}>{pct}%</span></div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#16a34a' : 'var(--brand-accent)' }} />
      </div>
      {goal.subGoals?.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <span className={`w-4 h-4 rounded-full flex-shrink-0 ${s.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={s.completed ? 'line-through text-gray-400' : ''} style={{ color: s.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{s.title}</span>
        </div>
      ))}
      {goal.adminComments?.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Comments</p>
          {goal.adminComments.map((c, i) => (
            <div key={i} className="p-2 rounded-lg mb-1" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <p className="text-xs font-bold" style={{ color: 'var(--brand-accent)' }}>{c.user?.firstName} {c.user?.lastName}</p>
              <p className="text-sm">{c.content}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add comment…"
          className="flex-1 px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
        <button onClick={() => { if (comment.trim()) { onComment(goal._id, comment.trim()); setComment(''); } }}
          className="px-4 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-accent)' }}><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

export default Goals;
