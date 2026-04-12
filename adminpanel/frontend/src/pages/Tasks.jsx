//Tasks.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Edit2,
  LayoutGrid,
  ListTodo,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, FilterChip, LoadingScreen, Modal, PageHeader, Panel, ProgressBar, SearchInput, StatCard } from '../components/ui.jsx';

const PRI = { High: { c: '#dc2626', bg: '#fef2f2' }, Medium: { c: '#d97706', bg: '#fffbeb' }, Low: { c: '#6b7494', bg: '#f7f8fb' } };
const SUB = { approved: { c: '#059669', bg: '#ecfdf5' }, submitted: { c: '#d97706', bg: '#fffbeb' }, rejected: { c: '#dc2626', bg: '#fef2f2' }, not_submitted: { c: '#6b7494', bg: '#f7f8fb' } };

const Tasks = () => {
  const { hasRole } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [formTask, setFormTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [display, setDisplay] = useState('list');

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
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleReview = async (id, action) => {
    try {
      await api.post(`/tasks/${id}/review`, { action });
      toast.success(`Task ${action}`);
      fetchTasks();
      setViewTask(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Deleted');
      fetchTasks();
      setViewTask(null);
    } catch {
      toast.error('Failed');
    }
  };

  const handleSave = async (payload, isEdit, taskId) => {
    try {
      if (isEdit && taskId) {
        await api.put(`/tasks/${taskId}`, payload);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task assigned!');
      }
      fetchTasks();
      setFormTask(null);
      setViewTask(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const filters = useMemo(
    () => [
      { key: 'all', label: 'All', count: stats.total || 0 },
      { key: 'pending', label: 'Pending', count: stats.pending || 0 },
      { key: 'completed', label: 'Done', count: stats.completed || 0 },
      { key: 'submitted', label: 'In Review', count: stats.submitted || 0 },
      { key: 'overdue', label: 'Overdue', count: stats.overdue || 0 },
    ],
    [stats],
  );

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Task command"
        title="Tasks"
        description="Review execution, coach quality, approve submissions, and rebalance ownership with fast admin controls."
        actions={
          <>
            <button className="btn-secondary" onClick={() => setDisplay((prev) => (prev === 'list' ? 'grid' : 'list'))}>
              <LayoutGrid className="h-4 w-4" />
              {display === 'list' ? 'Grid view' : 'List view'}
            </button>
            {hasRole('team-lead', 'admin') ? (
              <button className="btn-primary" onClick={() => setFormTask({})}>
                <Plus className="h-4 w-4" />
                Assign Task
              </button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total', value: stats.total || 0, tone: 'var(--c-accent)' },
          { label: 'Completed', value: stats.completed || 0, tone: '#059669' },
          { label: 'Pending', value: stats.pending || 0, tone: '#d97706' },
          { label: 'In review', value: stats.submitted || 0, tone: '#3B82F6' },
          { label: 'Overdue', value: stats.overdue || 0, tone: '#dc2626' },
        ].map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} icon={ListTodo} tone={item.tone} />
        ))}
      </div>

      <Panel>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks, assignees, notes..." icon={Search} />
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <FilterChip key={item.key} active={filter === item.key} onClick={() => setFilter(item.key)}>
                {item.label} - {item.count}
              </FilterChip>
            ))}
          </div>
        </div>
      </Panel>

      {loading ? (
        <LoadingScreen height="18rem" />
      ) : tasks.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tasks found" description="Adjust the search or filters, or assign a new task to get work flowing." />
      ) : display === 'list' ? (
        <Panel title="Execution queue" subtitle={`${tasks.length} tasks visible`}>
          <div className="space-y-3">
            {tasks.map((task, index) => {
              const overdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
              const pri = PRI[task.priority] || PRI.Low;
              const sub = SUB[task.submissionStatus] || SUB.not_submitted;
              const owner = task.owner ? `${task.owner.firstName || ''} ${task.owner.lastName || ''}`.trim() : 'Unassigned';
              const progress = task.checklist?.length ? Math.round((task.checklist.filter((c) => c.completed).length / task.checklist.length) * 100) : task.completed ? 100 : 0;

              return (
                <motion.div key={task._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} className="card card-hover cursor-pointer p-4" onClick={() => setViewTask(task)}>
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="badge" style={{ background: pri.bg, color: pri.c }}>{task.priority}</span>
                        {task.submissionStatus !== 'not_submitted' ? <span className="badge capitalize" style={{ background: sub.bg, color: sub.c }}>{task.submissionStatus.replace('_', ' ')}</span> : null}
                        {overdue ? <span className="badge" style={{ background: '#fef2f2', color: '#dc2626' }}>Overdue</span> : null}
                      </div>
                      <h3 className={`text-base font-bold ${task.completed ? 'line-through' : ''}`} style={{ color: task.completed ? 'var(--c-text-3)' : 'var(--c-text-0)' }}>{task.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--c-text-3)' }}>
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {owner}</span>
                        {task.dueDate ? <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span> : null}
                        {task.adminComments?.length ? <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {task.adminComments.length}</span> : null}
                      </div>
                    </div>
                    <div className="w-full xl:w-64">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span style={{ color: 'var(--c-text-3)' }}>Progress</span>
                        <span className="font-bold" style={{ color: progress === 100 ? '#059669' : 'var(--c-accent)' }}>{progress}%</span>
                      </div>
                      <ProgressBar value={progress} tone={progress === 100 ? '#059669' : 'var(--c-accent)'} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {tasks.map((task, index) => {
            const overdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
            const pri = PRI[task.priority] || PRI.Low;
            const progress = task.checklist?.length ? Math.round((task.checklist.filter((c) => c.completed).length / task.checklist.length) * 100) : task.completed ? 100 : 0;
            return (
              <motion.button key={task._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} onClick={() => setViewTask(task)} className="card card-hover flex flex-col gap-4 p-5 text-left">
                <div className="flex items-center justify-between">
                  <span className="badge" style={{ background: pri.bg, color: pri.c }}>{task.priority}</span>
                  {overdue ? <span className="badge" style={{ background: '#fef2f2', color: '#dc2626' }}>Overdue</span> : null}
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--c-text-0)' }}>{task.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm" style={{ color: 'var(--c-text-3)' }}>{task.description || 'No description provided yet.'}</p>
                </div>
                <div className="mt-auto">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--c-text-3)' }}>Progress</span>
                    <span className="font-bold" style={{ color: 'var(--c-accent)' }}>{progress}%</span>
                  </div>
                  <ProgressBar value={progress} />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <TaskFormModal open={formTask !== null} task={formTask?._id ? formTask : null} users={users} onClose={() => setFormTask(null)} onSave={handleSave} />
      <TaskDetailModal task={viewTask} open={!!viewTask} canEdit={hasRole('team-lead', 'admin')} onClose={() => setViewTask(null)} onReview={handleReview} onDelete={handleDelete} onEdit={(task) => { setViewTask(null); setFormTask(task); }} onRefresh={fetchTasks} />
    </div>
  );
};

const TaskFormModal = ({ open, task, users, onClose, onSave }) => {
  const isEdit = !!task;
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', dueDate: '', ownerId: '', checklist: [] });
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || 'Medium',
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      ownerId: task?.owner?._id || task?.owner || '',
      checklist: task?.checklist?.map((item) => ({ text: item.text, completed: item.completed })) || [],
    });
  }, [task, open]);

  const addItem = () => {
    if (!newItem.trim()) return;
    setForm((prev) => ({ ...prev, checklist: [...prev.checklist, { text: newItem.trim(), completed: false }] }));
    setNewItem('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title required');
    if (!isEdit && !form.ownerId) return toast.error('Select assignee');
    setSaving(true);
    await onSave({ title: form.title.trim(), description: form.description, priority: form.priority, dueDate: form.dueDate || undefined, ownerId: form.ownerId || undefined, checklist: form.checklist.filter((item) => item.text.trim()) }, isEdit, task?._id);
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Task' : 'Assign New Task'} subtitle="Preserve assignment logic, but deliver it through a sharper operational flow." width="max-w-2xl">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">{isEdit ? 'Reassign To' : 'Assign To *'}</label>
            <select className="input-base" value={form.ownerId} onChange={(e) => setForm((prev) => ({ ...prev, ownerId: e.target.value }))}>
              <option value="">{isEdit ? 'Keep current owner' : 'Select user...'}</option>
              {users.map((user) => <option key={user._id} value={user._id}>{user.firstName} {user.lastName} ({user.email})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {['Low', 'Medium', 'High'].map((priority) => (
                <button key={priority} type="button" className="rounded-2xl border px-3 py-3 text-sm font-bold" style={form.priority === priority ? { background: PRI[priority].c, color: 'white', borderColor: PRI[priority].c } : { borderColor: 'var(--c-border)', color: 'var(--c-text-2)' }} onClick={() => setForm((prev) => ({ ...prev, priority }))}>
                  {priority}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="label">Title *</label>
          <input className="input-base" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Task title" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input-base min-h-28" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Context, outcome, constraints..." />
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input-base" value={form.dueDate} onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
        </div>
        <div>
          <label className="label">Checklist ({form.checklist.length})</label>
          <div className="space-y-2">
            {form.checklist.map((item, index) => (
              <div key={index} className="flex items-center gap-3 rounded-2xl border px-3 py-3" style={{ borderColor: 'var(--c-border)' }}>
                <input type="checkbox" checked={item.completed} onChange={() => setForm((prev) => ({ ...prev, checklist: prev.checklist.map((entry, entryIndex) => entryIndex === index ? { ...entry, completed: !entry.completed } : entry) }))} />
                <input className="w-full bg-transparent text-sm outline-none" value={item.text} onChange={(e) => setForm((prev) => ({ ...prev, checklist: prev.checklist.map((entry, entryIndex) => entryIndex === index ? { ...entry, text: e.target.value } : entry) }))} />
                <button type="button" className="btn-ghost h-9 w-9 rounded-xl p-0" onClick={() => setForm((prev) => ({ ...prev, checklist: prev.checklist.filter((_, entryIndex) => entryIndex !== index) }))}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input className="input-base" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add checklist item..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }} />
              <button type="button" className="btn-secondary" onClick={addItem}>Add</button>
            </div>
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create & Assign'}</button>
      </form>
    </Modal>
  );
};

const TaskDetailModal = ({ open, task, onClose, onReview, onDelete, onEdit, onRefresh, canEdit }) => {
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  if (!task) return null;

  const owner = task.owner ? `${task.owner.firstName || ''} ${task.owner.lastName || ''}`.trim() : 'N/A';
  const pri = PRI[task.priority] || PRI.Low;
  const progress = task.checklist?.length ? Math.round((task.checklist.filter((entry) => entry.completed).length / task.checklist.length) * 100) : task.completed ? 100 : 0;

  const addComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api.post(`/tasks/${task._id}/comment`, { content: comment.trim() });
      toast.success('Comment added');
      setComment('');
      onRefresh();
      onClose();
    } catch {
      toast.error('Failed');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Task Details" subtitle={task.title} width="max-w-3xl">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <span className="badge" style={{ background: pri.bg, color: pri.c }}>{task.priority}</span>
          {task.submissionStatus !== 'not_submitted' ? <span className="badge capitalize" style={{ background: SUB[task.submissionStatus]?.bg, color: SUB[task.submissionStatus]?.c }}>{task.submissionStatus.replace('_', ' ')}</span> : null}
          {task.completed ? <span className="badge" style={{ background: '#ecfdf5', color: '#059669' }}>Completed</span> : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.35rem] border p-4" style={{ borderColor: 'var(--c-border)' }}>
            <p className="section-title mb-2">Assigned to</p>
            <p className="text-base font-bold" style={{ color: 'var(--c-text-0)' }}>{owner}</p>
          </div>
          <div className="rounded-[1.35rem] border p-4" style={{ borderColor: 'var(--c-border)' }}>
            <p className="section-title mb-2">Due date</p>
            <p className="text-base font-bold" style={{ color: 'var(--c-text-0)' }}>{task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'None'}</p>
          </div>
        </div>
        {task.description ? <div className="rounded-[1.35rem] border p-4 text-sm leading-7" style={{ borderColor: 'var(--c-border)' }}>{task.description}</div> : null}
        {task.checklist?.length ? (
          <div>
            <div className="mb-2 flex items-center justify-between"><p className="section-title">Checklist</p><span className="text-sm font-bold" style={{ color: 'var(--c-accent)' }}>{progress}%</span></div>
            <ProgressBar value={progress} tone={progress === 100 ? '#059669' : 'var(--c-accent)'} />
            <div className="mt-4 space-y-2">
              {task.checklist.map((item, index) => <div key={index} className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--c-border)' }}><CheckCircle2 className="h-4 w-4" style={{ color: item.completed ? '#059669' : 'var(--c-text-3)' }} /><span className={item.completed ? 'line-through' : ''} style={{ color: item.completed ? 'var(--c-text-3)' : 'var(--c-text-0)' }}>{item.text}</span></div>)}
            </div>
          </div>
        ) : null}
        <div>
          <p className="section-title mb-3">Add comment</p>
          <div className="flex gap-2"><input className="input-base" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a note..." /><button className="btn-primary" onClick={addComment} disabled={posting || !comment.trim()}>{posting ? '...' : 'Send'}</button></div>
        </div>
        <div className="flex flex-wrap gap-3">
          {canEdit ? <button className="btn-secondary" onClick={() => onEdit(task)}><Edit2 className="h-4 w-4" /> Edit Task</button> : null}
          {task.submissionStatus === 'submitted' ? <><button className="btn-primary" onClick={() => onReview(task._id, 'approved')} style={{ background: '#059669' }}>Approve</button><button className="btn-danger" onClick={() => onReview(task._id, 'rejected')}>Reject</button></> : null}
          {canEdit ? <button className="btn-danger" onClick={() => onDelete(task._id)}><Trash2 className="h-4 w-4" /> Delete</button> : null}
        </div>
      </div>
    </Modal>
  );
};

export default Tasks;