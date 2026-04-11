//Goals.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Search, X, Send, Users, Calendar, Edit2, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';

const Goals = () => {
  const { hasRole } = useAuth();
  const [goals, setGoals] = useState([]); const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [formGoal, setFormGoal] = useState(null); // null=closed, {}=create, {_id:..}=edit
  const [viewGoal, setViewGoal] = useState(null); const [stats, setStats] = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [g, s, u] = await Promise.all([api.get('/goals', { params: { search } }), api.get('/goals/stats'), api.get('/team/available-users')]);
      setGoals(g.data.goals || []); setStats(s.data.stats || {}); setUsers(u.data.users || []);
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  }, [search]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pct = g => { if (!g.subGoals?.length) return 0; return Math.round((g.subGoals.filter(s => s.completed).length / g.subGoals.length) * 100); };

  const handleSave = async (data, isEdit, goalId) => {
    try {
      if (isEdit && goalId) {
        await api.put(`/goals/${goalId}`, data);
        toast.success('Goal updated!');
      } else {
        await api.post('/goals', data);
        toast.success('Goal created!');
      }
      fetchAll(); setFormGoal(null); setViewGoal(null);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try { await api.delete(`/goals/${id}`); toast.success('Deleted'); fetchAll(); setViewGoal(null); }
    catch { toast.error('Failed'); }
  };

  const addComment = async (id, content) => {
    try { await api.post(`/goals/${id}/comment`, { content }); toast.success('Comment added'); fetchAll(); setViewGoal(null); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div><h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>Goals</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--c-text-2)' }}>Track team and organizational goals</p></div>
        {hasRole('team-lead', 'admin') && <button onClick={() => setFormGoal({})} className="btn-primary"><Plus className="w-4 h-4" /> Create Goal</button>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ l: 'Total', v: stats.total || 0, c: 'var(--c-accent)' }, { l: 'Active', v: stats.active || 0, c: '#d97706' }, { l: 'Completed', v: stats.completed || 0, c: '#059669' }, { l: 'Avg Progress', v: `${stats.avgProgress || 0}%`, c: '#7c3aed' }].map(s => (
          <div key={s.l} className="card p-4"><p className="stat-value text-[20px]" style={{ color: s.c }}>{s.v}</p><p className="text-[11px] font-medium mt-1" style={{ color: 'var(--c-text-3)' }}>{s.l}</p></div>
        ))}
      </div>

      <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-text-3)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search goals…" className="input-base" style={{ paddingLeft: 38 }} /></div>

      {loading ? <div className="flex justify-center py-20"><div className="w-7 h-7 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} /></div>
      : goals.length === 0 ? <div className="card text-center py-20"><Target className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--c-text-3)' }} /><p className="text-[15px] font-semibold" style={{ color: 'var(--c-text-1)' }}>No goals found</p></div>
      : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g, i) => {
            const p = pct(g); const owner = g.owner ? `${g.owner.firstName} ${g.owner.lastName}` : 'Unassigned';
            return (
              <motion.div key={g._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .03 }}
                className="card card-hover p-5 cursor-pointer group" onClick={() => setViewGoal(g)}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-[14px] font-bold truncate" style={{ color: 'var(--c-text-0)' }}>{g.title}</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-[14px] font-extrabold flex-shrink-0" style={{ color: p === 100 ? '#059669' : 'var(--c-accent)' }}>{p}%</span>
                    {hasRole('team-lead', 'admin') && (
                      <button onClick={e => { e.stopPropagation(); setFormGoal(g); }}
                        className="btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--c-accent)' }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] mb-3" style={{ color: 'var(--c-text-3)' }}>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{owner}</span>
                  <span className="badge" style={{ background: 'var(--c-surface-raised)', color: 'var(--c-text-2)' }}>{g.timeframe}</span>
                </div>
                <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--c-surface-sunken)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: p === 100 ? '#059669' : 'var(--c-accent)' }} />
                </div>
                <p className="text-[11px] mt-2" style={{ color: 'var(--c-text-3)' }}>{g.subGoals?.filter(s => s.completed).length || 0}/{g.subGoals?.length || 0} sub-goals</p>
              </motion.div>
            );
          })}
        </div>}

      {/* Create / Edit modal */}
      <AnimatePresence>{formGoal !== null && (
        <GoalFormModal goal={formGoal._id ? formGoal : null} users={users}
          onClose={() => setFormGoal(null)} onSave={handleSave} />
      )}</AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>{viewGoal && (
        <GoalDetail goal={viewGoal} onClose={() => setViewGoal(null)} onComment={addComment}
          onEdit={g => { setViewGoal(null); setFormGoal(g); }} onDelete={handleDelete}
          canEdit={hasRole('team-lead', 'admin')} />
      )}</AnimatePresence>
    </div>
  );
};

/* ── GOAL FORM MODAL (Create + Edit) ──────────────────────────────────────── */
const GoalFormModal = ({ goal, users, onClose, onSave }) => {
  const isEdit = !!goal;
  const [f, setF] = useState({
    title: goal?.title || '',
    ownerId: goal?.owner?._id || goal?.owner || '',
    timeframe: goal?.timeframe || 'weekly',
    type: goal?.type || 'personal',
    startDate: goal?.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : '',
    endDate: goal?.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
    subGoals: goal?.subGoals?.map(s => ({ title: s.title, completed: s.completed })) || [],
  });
  const [sub, setSub] = useState(''); const [saving, setSaving] = useState(false);

  const addSub = () => { if (sub.trim()) { setF(p => ({ ...p, subGoals: [...p.subGoals, { title: sub.trim(), completed: false }] })); setSub(''); } };
  const toggleSub = (idx) => { setF(p => ({ ...p, subGoals: p.subGoals.map((s, i) => i === idx ? { ...s, completed: !s.completed } : s) })); };

  const handle = async () => {
    if (!f.title) return toast.error('Title required');
    if (!isEdit && !f.ownerId) return toast.error('Select assignee');
    if (!f.subGoals.length) return toast.error('Add at least one sub-goal');
    setSaving(true);
    const payload = {
      title: f.title, type: f.type, timeframe: f.timeframe, subGoals: f.subGoals,
      startDate: f.startDate || new Date().toISOString(),
      endDate: f.endDate || new Date(Date.now() + 7 * 864e5).toISOString(),
    };
    if (f.ownerId) payload.ownerId = f.ownerId;
    await onSave(payload, isEdit, goal?._id);
    setSaving(false);
  };

  return (<>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
      className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl p-6"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-xl)' }}>
      <div className="flex justify-between mb-4">
        <h2 className="text-[16px] font-bold" style={{ color: 'var(--c-text-0)' }}>{isEdit ? 'Edit Goal' : 'Create Goal'}</h2>
        <button onClick={onClose} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        <div><label className="label">{isEdit ? 'Reassign To' : 'Assign To *'}</label>
          <select value={f.ownerId} onChange={e => setF(p => ({ ...p, ownerId: e.target.value }))} className="input-base">
            <option value="">{isEdit ? 'Keep current owner' : 'Select user…'}</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
          </select></div>
        <div><label className="label">Title *</label>
          <input value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} className="input-base" placeholder="Goal title" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Timeframe</label>
            <select value={f.timeframe} onChange={e => setF(p => ({ ...p, timeframe: e.target.value }))} className="input-base">
              {['daily', 'weekly', 'monthly', 'quarterly'].map(t => <option key={t} value={t}>{t}</option>)}
            </select></div>
          <div><label className="label">Type</label>
            <select value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value }))} className="input-base">
              <option value="personal">Personal</option><option value="task">Task</option>
            </select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Start Date</label><input type="date" value={f.startDate} onChange={e => setF(p => ({ ...p, startDate: e.target.value }))} className="input-base" /></div>
          <div><label className="label">End Date</label><input type="date" value={f.endDate} onChange={e => setF(p => ({ ...p, endDate: e.target.value }))} className="input-base" /></div>
        </div>
        {/* Sub-goals — editable text + toggle completion */}
        <div><label className="label">Sub-Goals ({f.subGoals.length})</label>
          {f.subGoals.map((s, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1.5" style={{ background: 'var(--c-surface-raised)' }}>
              <input type="checkbox" checked={s.completed} onChange={() => toggleSub(i)}
                style={{ accentColor: 'var(--c-accent)', width: 16, height: 16 }} />
              <input value={s.title} onChange={e => {
                const u = [...f.subGoals]; u[i] = { ...u[i], title: e.target.value }; setF(p => ({ ...p, subGoals: u }));
              }} className="flex-1 text-[13px] bg-transparent focus:outline-none"
                style={{ color: s.completed ? 'var(--c-text-3)' : 'var(--c-text-0)', textDecoration: s.completed ? 'line-through' : 'none' }} />
              <button onClick={() => setF(p => ({ ...p, subGoals: p.subGoals.filter((_, j) => j !== i) }))}
                style={{ color: 'var(--c-danger)' }}><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <input value={sub} onChange={e => setSub(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSub(); } }}
              className="input-base" placeholder="Add sub-goal…" />
            <button type="button" onClick={addSub} className="btn-secondary flex-shrink-0">Add</button>
          </div>
        </div>
        <button onClick={handle} disabled={saving} className="btn-primary w-full" style={{ height: 44 }}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Goal'}
        </button>
      </div>
    </motion.div>
  </>);
};

/* ── GOAL DETAIL MODAL ─────────────────────────────────────────────────────── */
const GoalDetail = ({ goal, onClose, onComment, onEdit, onDelete, canEdit }) => {
  const [comment, setComment] = useState('');
  const p = goal.subGoals?.length ? Math.round((goal.subGoals.filter(s => s.completed).length / goal.subGoals.length) * 100) : 0;
  const owner = goal.owner ? `${goal.owner.firstName || ''} ${goal.owner.lastName || ''}`.trim() : 'Unassigned';

  return (<>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
      className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl p-6"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-xl)' }}>
      <div className="flex justify-between mb-4">
        <p className="section-title">Goal Details</p>
        <div className="flex items-center gap-1">
          {canEdit && <button onClick={() => onEdit(goal)} className="btn-ghost p-2" style={{ color: 'var(--c-accent)' }}><Edit2 className="w-4 h-4" /></button>}
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <h2 className="text-[18px] font-bold" style={{ color: 'var(--c-text-0)' }}>{goal.title}</h2>
          <div className="flex items-center gap-2 mt-2 text-[12px]" style={{ color: 'var(--c-text-3)' }}>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{owner}</span>
            <span className="badge capitalize" style={{ background: 'var(--c-surface-raised)', color: 'var(--c-text-2)' }}>{goal.timeframe}</span>
            <span className="badge capitalize" style={{ background: 'var(--c-surface-raised)', color: 'var(--c-text-2)' }}>{goal.type}</span>
          </div>
          {goal.startDate && goal.endDate && (
            <p className="text-[12px] mt-1.5" style={{ color: 'var(--c-text-3)' }}>
              <Calendar className="w-3 h-3 inline mr-1" />
              {format(new Date(goal.startDate), 'MMM d')} → {format(new Date(goal.endDate), 'MMM d, yyyy')}
            </p>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-[12px] mb-1.5">
            <span style={{ color: 'var(--c-text-3)' }}>Progress</span>
            <span className="font-bold" style={{ color: p === 100 ? '#059669' : 'var(--c-accent)' }}>{p}%</span>
          </div>
          <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--c-surface-sunken)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: p === 100 ? '#059669' : 'var(--c-accent)' }} />
          </div>
        </div>

        {/* Sub-goals */}
        {goal.subGoals?.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--c-text-3)' }}>
              SUB-GOALS ({goal.subGoals.filter(s => s.completed).length}/{goal.subGoals.length})
            </p>
            <div className="space-y-1.5">
              {goal.subGoals.map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ background: 'var(--c-surface-raised)' }}>
                  {s.completed
                    ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#059669' }} />
                    : <Circle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--c-border)' }} />}
                  <span className={`text-[13px] ${s.completed ? 'line-through' : ''}`}
                    style={{ color: s.completed ? 'var(--c-text-3)' : 'var(--c-text-0)' }}>{s.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin comments */}
        {goal.adminComments?.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--c-text-3)' }}>ADMIN COMMENTS</p>
            {goal.adminComments.map((c, i) => (
              <div key={i} className="p-3 rounded-xl mb-2" style={{ background: 'var(--c-surface-raised)' }}>
                <p className="text-[12px] font-semibold" style={{ color: 'var(--c-accent)' }}>{c.user?.firstName} {c.user?.lastName}</p>
                <p className="text-[13px] mt-1" style={{ color: 'var(--c-text-0)' }}>{c.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add comment */}
        <div>
          <div className="flex gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)} className="input-base" placeholder="Add comment…" />
            <button onClick={() => { if (comment.trim()) { onComment(goal._id, comment.trim()); setComment(''); } }}
              className="btn-primary flex-shrink-0 px-4"><Send className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {canEdit && <button onClick={() => onEdit(goal)} className="btn-secondary flex-1"><Edit2 className="w-4 h-4" /> Edit Goal</button>}
          {canEdit && <button onClick={() => onDelete(goal._id)} className="btn-ghost flex-1" style={{ color: 'var(--c-danger)' }}><Trash2 className="w-4 h-4" /> Delete</button>}
        </div>
      </div>
    </motion.div>
  </>);
};

export default Goals;
