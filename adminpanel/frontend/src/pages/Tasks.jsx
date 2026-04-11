import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ListTodo, Plus, Search, Filter, CheckCircle2, Clock, AlertTriangle,
  X, Send, Eye, Trash2, Edit2, MessageSquare, ChevronDown, Loader2, Users,
} from 'lucide-react';

const PRIORITY_C = { High: '#dc2626', Medium: '#d97706', Low: '#2563eb' };
const STATUS_C = { approved: '#16a34a', submitted: '#d97706', rejected: '#dc2626', not_submitted: '#94a3b8' };

const Tasks = () => {
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewTask, setViewTask] = useState(null);
  const [stats, setStats] = useState({});

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      const [t, s, u] = await Promise.all([
        api.get('/tasks', { params }),
        api.get('/tasks/stats'),
        api.get('/team/available-users'),
      ]);
      setTasks(t.data.tasks || []);
      setStats(s.data.stats || {});
      setUsers(u.data.users || []);
    } catch (err) { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleReview = async (taskId, action) => {
    try {
      await api.post(`/tasks/${taskId}/review`, { action });
      toast.success(`Task ${action}`);
      fetchTasks();
      setViewTask(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Review failed'); }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}`); toast.success('Deleted'); fetchTasks(); setViewTask(null); }
    catch { toast.error('Delete failed'); }
  };

  const FILTERS = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'completed', label: 'Completed', count: stats.completed },
    { key: 'submitted', label: 'Submitted', count: stats.submitted },
    { key: 'overdue', label: 'Overdue', count: stats.overdue },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ListTodo className="w-6 h-6" style={{ color: 'var(--brand-accent)' }} /> Tasks
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Manage and review team tasks</p>
        </div>
        {hasRole('team-lead', 'admin') && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
            style={{ backgroundColor: 'var(--brand-accent)' }}>
            <Plus className="w-4 h-4" /> Assign Task
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…"
            className="flex-1 bg-transparent text-sm focus:outline-none" style={{ color: 'var(--text-primary)' }} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={filter === f.key ? { backgroundColor: 'var(--brand-accent)', color: '#fff' } : { color: 'var(--text-secondary)' }}>
              {f.label} {f.count != null && <span className="ml-1 opacity-70">({f.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-accent)' }} /></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <ListTodo className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, i) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
            const ownerName = task.owner ? `${task.owner.firstName || ''} ${task.owner.lastName || ''}`.trim() : 'Unassigned';
            return (
              <motion.div key={task._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .02 }}
                onClick={() => setViewTask(task)}
                className="rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderLeftWidth: 3, borderLeftColor: PRIORITY_C[task.priority] || '#94a3b8' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-bold truncate ${task.completed ? 'line-through' : ''}`}
                        style={{ color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{task.title}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: `${PRIORITY_C[task.priority]}15`, color: PRIORITY_C[task.priority] }}>{task.priority}</span>
                      {task.submissionStatus !== 'not_submitted' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize"
                          style={{ backgroundColor: `${STATUS_C[task.submissionStatus]}15`, color: STATUS_C[task.submissionStatus] }}>
                          {task.submissionStatus}
                        </span>
                      )}
                      {isOverdue && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-50 text-red-600">Overdue</span>}
                      {task.createdByAdmin && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand-accent)' }}>Admin Assigned</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ownerName}</span>
                      {task.dueDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>}
                      {task.checklist?.length > 0 && (
                        <span>{task.checklist.filter(c => c.completed).length}/{task.checklist.length} checklist</span>
                      )}
                    </div>
                  </div>
                  {task.submissionStatus === 'submitted' && (
                    <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleReview(task._id, 'approved')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#16a34a' }}>Approve</button>
                      <button onClick={() => handleReview(task._id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Reject</button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal isOpen={showCreate} onClose={() => setShowCreate(false)} users={users} onCreated={fetchTasks} />

      {/* View Task Modal */}
      <TaskDetailModal task={viewTask} onClose={() => setViewTask(null)} onReview={handleReview}
        onDelete={handleDelete} onRefresh={fetchTasks} canEdit={hasRole('team-lead', 'admin')} />
    </div>
  );
};

// ── Create Task Modal ─────────────────────────────────────────────────────────
const CreateTaskModal = ({ isOpen, onClose, users, onCreated }) => {
  const [form, setForm] = useState({ title: '', description: '', priority: 'Low', dueDate: '', ownerId: '', checklist: [] });
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.ownerId) return toast.error('Title and assignee required');
    setSaving(true);
    try {
      await api.post('/tasks', { ...form, checklist: form.checklist.filter(i => i.text.trim()) });
      toast.success('Task created and assigned!');
      onCreated();
      onClose();
      setForm({ title: '', description: '', priority: 'Low', dueDate: '', ownerId: '', checklist: [] });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setForm(f => ({ ...f, checklist: [...f.checklist, { text: newItem.trim(), completed: false }] }));
    setNewItem('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <motion.div initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl border w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>Assign New Task</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Assign To *</label>
            <select value={form.ownerId} onChange={e => setForm(f => ({ ...f, ownerId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
              <option value="">Select a user…</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Priority</label>
              <div className="flex gap-2">
                {['Low', 'Medium', 'High'].map(p => (
                  <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className="flex-1 py-2 rounded-lg text-xs font-bold border-2"
                    style={form.priority === p ? { borderColor: PRIORITY_C[p], backgroundColor: PRIORITY_C[p], color: '#fff' } : { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          {/* Checklist */}
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Checklist ({form.checklist.length})</label>
            {form.checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{item.text}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, checklist: f.checklist.filter((_, idx) => idx !== i) }))} style={{ color: '#dc2626' }}><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())}
                placeholder="Add checklist item…" className="flex-1 px-3 py-2.5 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
              <button type="button" onClick={addItem} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: 'var(--brand-accent)' }}>Add</button>
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--brand-accent)' }}>
            {saving ? 'Creating…' : 'Create & Assign Task'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// ── Task Detail Modal ─────────────────────────────────────────────────────────
const TaskDetailModal = ({ task, onClose, onReview, onDelete, onRefresh, canEdit }) => {
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  if (!task) return null;

  const ownerName = task.owner ? `${task.owner.firstName || ''} ${task.owner.lastName || ''}`.trim() : 'N/A';
  const progress = task.checklist?.length ? Math.round((task.checklist.filter(c => c.completed).length / task.checklist.length) * 100) : (task.completed ? 100 : 0);

  const addComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api.post(`/tasks/${task._id}/comment`, { content: comment.trim() });
      toast.success('Comment added');
      setComment('');
      onRefresh();
      onClose();
    } catch { toast.error('Failed to add comment'); }
    finally { setPosting(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <motion.div initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Task Details</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>{task.title}</h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${PRIORITY_C[task.priority]}15`, color: PRIORITY_C[task.priority] }}>{task.priority}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold capitalize" style={{ backgroundColor: `${STATUS_C[task.submissionStatus]}15`, color: STATUS_C[task.submissionStatus] }}>{task.submissionStatus?.replace('_', ' ')}</span>
              {task.completed && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-green-50 text-green-600">Completed</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span style={{ color: 'var(--text-muted)' }}>Assigned to</span><p className="font-bold" style={{ color: 'var(--text-primary)' }}>{ownerName}</p></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Due</span><p className="font-bold" style={{ color: 'var(--text-primary)' }}>{task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'None'}</p></div>
          </div>
          {task.description && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{task.description}</p>}

          {/* Checklist */}
          {task.checklist?.length > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: 'var(--text-muted)' }}>Checklist ({task.checklist.filter(c => c.completed).length}/{task.checklist.length})</span>
                <span className="font-bold" style={{ color: 'var(--brand-accent)' }}>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'var(--bg-hover)' }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#16a34a' : 'var(--brand-accent)' }} />
              </div>
              <div className="space-y-1.5">
                {task.checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`w-4 h-4 ${item.completed ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className={item.completed ? 'line-through text-gray-400' : ''} style={{ color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin comments */}
          {(task.adminComments?.length > 0) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Admin Comments</p>
              {task.adminComments.map((c, i) => (
                <div key={i} className="p-3 rounded-xl mb-2" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <p className="text-xs font-bold" style={{ color: 'var(--brand-accent)' }}>{c.user?.firstName} {c.user?.lastName}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{c.content}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Add Comment</p>
            <div className="flex gap-2">
              <input value={comment} onChange={e => setComment(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border text-sm" placeholder="Write a comment…"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
              <button onClick={addComment} disabled={posting || !comment.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ backgroundColor: 'var(--brand-accent)' }}>
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {task.submissionStatus === 'submitted' && (
              <>
                <button onClick={() => onReview(task._id, 'approved')} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#16a34a' }}>Approve</button>
                <button onClick={() => onReview(task._id, 'rejected')} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Reject</button>
              </>
            )}
            {canEdit && <button onClick={() => onDelete(task._id)} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ color: '#dc2626', backgroundColor: 'rgba(220,38,38,.08)' }}><Trash2 className="w-4 h-4" /></button>}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Tasks;
