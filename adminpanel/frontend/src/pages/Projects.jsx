//Projects.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  FolderKanban, Plus, Search, X, Trash2, Edit2, Users, Calendar,
  CheckCircle2, Clock, ArrowRight, ListTodo, BarChart2, ChevronLeft, AlertTriangle,
} from 'lucide-react';

const STATUS_MAP = {
  planning:  { label: 'Planning',  color: '#2563eb', bg: '#eff6ff' },
  active:    { label: 'Active',    color: '#059669', bg: '#ecfdf5' },
  'on-hold': { label: 'On Hold',  color: '#d97706', bg: '#fffbeb' },
  completed: { label: 'Completed', color: '#7c3aed', bg: '#f5f3ff' },
  archived:  { label: 'Archived',  color: '#6b7494', bg: '#f7f8fb' },
};

const PRI_MAP = { High: { c: '#dc2626', bg: '#fef2f2' }, Medium: { c: '#d97706', bg: '#fffbeb' }, Low: { c: '#6b7494', bg: '#f7f8fb' } };

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [viewProject, setViewProject] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, u] = await Promise.all([
        api.get('/projects', { params: { search, ...(statusFilter && { status: statusFilter }) } }),
        api.get('/team/available-users'),
      ]);
      setProjects(p.data.projects || []);
      setUsers(u.data.users || []);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveProject = async (form) => {
    try {
      if (editProject) { await api.put(`/projects/${editProject._id}`, form); toast.success('Updated'); }
      else { await api.post('/projects', form); toast.success('Project created'); }
      setShowForm(false); setEditProject(null); fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteProject = async (id) => {
    if (!confirm('Delete this project and all associated data?')) return;
    try { await api.delete(`/projects/${id}`); toast.success('Deleted'); fetchAll(); if (viewProject?._id === id) setViewProject(null); }
    catch { toast.error('Failed'); }
  };

  const openEdit = (p) => { setEditProject(p); setShowForm(true); };

  // ── Project Detail View ─────────────────────
  if (viewProject) {
    return <ProjectDashboard project={viewProject} users={users} onBack={() => { setViewProject(null); fetchAll(); }} onRefresh={fetchAll} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>Projects</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--c-text-2)' }}>Manage projects and track team progress</p>
        </div>
        <button onClick={() => { setEditProject(null); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-text-3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…"
            className="input-base" style={{ paddingLeft: 38 }} />
        </div>
        <div className="flex gap-1.5">
          {['', 'planning', 'active', 'on-hold', 'completed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors ${statusFilter === s ? '' : ''}`}
              style={statusFilter === s
                ? { background: 'var(--c-accent)', color: 'white' }
                : { background: 'var(--c-surface)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>
              {s ? STATUS_MAP[s]?.label : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-20 px-6">
          <FolderKanban className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--c-text-3)' }} />
          <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--c-text-1)' }}>No projects found</p>
          <p className="text-[13px] mb-5" style={{ color: 'var(--c-text-3)' }}>Create your first project to get started</p>
          <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> Create Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p, i) => {
            const st = STATUS_MAP[p.status] || STATUS_MAP.planning;
            const tasksCount = p.tasks?.length || 0;
            const completedCount = p.tasks?.filter(t => t.completed).length || 0;
            const pct = tasksCount > 0 ? Math.round((completedCount / tasksCount) * 100) : 0;

            return (
              <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card card-hover p-5 cursor-pointer group"
                onClick={() => setViewProject(p)}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      {p.priority && <span className="badge" style={{ background: PRI_MAP[p.priority]?.bg, color: PRI_MAP[p.priority]?.c }}>{p.priority}</span>}
                    </div>
                    <h3 className="text-[15px] font-bold truncate" style={{ color: 'var(--c-text-0)' }}>{p.name}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(p)} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteProject(p._id)} className="btn-ghost p-1.5" style={{ color: 'var(--c-danger)' }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                {p.description && (
                  <p className="text-[13px] line-clamp-2 mb-3" style={{ color: 'var(--c-text-2)' }}>{p.description}</p>
                )}

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span style={{ color: 'var(--c-text-3)' }}>{completedCount}/{tasksCount} tasks complete</span>
                    <span className="font-semibold" style={{ color: pct === 100 ? '#059669' : 'var(--c-accent)' }}>{pct}%</span>
                  </div>
                  <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--c-surface-sunken)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: pct === 100 ? '#059669' : 'var(--c-accent)' }} />
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-[12px]" style={{ color: 'var(--c-text-3)' }}>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{p.members?.length || 0}</span>
                  <span className="flex items-center gap-1"><ListTodo className="w-3.5 h-3.5" />{tasksCount}</span>
                  {p.endDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(p.endDate), 'MMM d')}</span>}
                </div>

                {/* Member avatars */}
                {p.members?.length > 0 && (
                  <div className="flex -space-x-2 mt-3">
                    {p.members.slice(0, 5).map((m, j) => (
                      <div key={m._id || j} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: 'var(--c-ink-muted)', border: '2px solid var(--c-surface)' }}>
                        {(m.firstName || 'U')[0]}
                      </div>
                    ))}
                    {p.members.length > 5 && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
                        style={{ background: 'var(--c-surface-raised)', border: '2px solid var(--c-surface)', color: 'var(--c-text-3)' }}>
                        +{p.members.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      <AnimatePresence>
        {showForm && (
          <ProjectFormModal project={editProject} users={users}
            onSave={saveProject} onClose={() => { setShowForm(false); setEditProject(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   PROJECT DASHBOARD — Detailed view with task management
   ══════════════════════════════════════════════════════════════════ */
const ProjectDashboard = ({ project: initialProject, users, onBack, onRefresh }) => {
  const [project, setProject] = useState(initialProject);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${project._id}`);
      setProject(data.project);
      setTasks(data.project.tasks || []);
    } catch { toast.error('Failed to load project'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProject(); }, []);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const pct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const overdue = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
  const st = STATUS_MAP[project.status] || STATUS_MAP.planning;

  const createTaskForProject = async (taskForm) => {
    try {
      // Create task via admin endpoint
      const { data: taskData } = await api.post('/tasks', taskForm);
      // Add task to project
      const currentTaskIds = tasks.map(t => t._id);
      currentTaskIds.push(taskData.task._id);
      await api.put(`/projects/${project._id}`, { tasks: currentTaskIds });
      toast.success('Task created and added to project');
      fetchProject();
      setShowAddTask(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create task'); }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="btn-ghost gap-1.5 text-[13px]" style={{ color: 'var(--c-accent)' }}>
          <ChevronLeft className="w-4 h-4" /> Projects
        </button>
        <span style={{ color: 'var(--c-text-3)' }}>/</span>
        <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--c-text-1)' }}>{project.name}</span>
      </div>

      {/* Project header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
              {project.priority && <span className="badge" style={{ background: PRI_MAP[project.priority]?.bg, color: PRI_MAP[project.priority]?.c }}>{project.priority}</span>}
            </div>
            <h1 className="text-[22px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>{project.name}</h1>
            {project.description && <p className="text-[14px] mt-2 max-w-xl" style={{ color: 'var(--c-text-2)' }}>{project.description}</p>}
          </div>
          <button onClick={() => setShowAddTask(true)} className="btn-primary flex-shrink-0">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Total Tasks', value: totalTasks, icon: ListTodo, color: 'var(--c-accent)' },
            { label: 'Completed', value: completedCount, icon: CheckCircle2, color: '#059669' },
            { label: 'Overdue', value: overdue, icon: AlertTriangle, color: '#dc2626' },
            { label: 'Members', value: project.members?.length || 0, icon: Users, color: '#7c3aed' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl" style={{ background: 'var(--c-surface-raised)' }}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-3)' }}>{s.label}</span>
              </div>
              <p className="text-[24px] font-extrabold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Overall progress */}
        <div className="mt-6">
          <div className="flex justify-between text-[12px] mb-2">
            <span className="font-semibold" style={{ color: 'var(--c-text-2)' }}>Overall Project Completion</span>
            <span className="font-bold" style={{ color: pct === 100 ? '#059669' : 'var(--c-accent)' }}>{pct}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--c-surface-sunken)' }}>
            <motion.div className="h-full rounded-full" initial={{ width: 0 }}
              animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ background: pct === 100 ? '#059669' : 'var(--c-accent)' }} />
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <p className="text-[15px] font-bold" style={{ color: 'var(--c-text-0)' }}>Project Tasks</p>
          <p className="text-[12px]" style={{ color: 'var(--c-text-3)' }}>{completedCount} of {totalTasks} complete</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <ListTodo className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--c-text-3)' }} />
            <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--c-text-1)' }}>No tasks yet</p>
            <p className="text-[13px] mb-4" style={{ color: 'var(--c-text-3)' }}>Add tasks to track project progress</p>
            <button onClick={() => setShowAddTask(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Task</button>
          </div>
        ) : (
          <div>
            {tasks.map((task, i) => {
              const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
              const pri = PRI_MAP[task.priority] || PRI_MAP.Low;
              const progress = task.checklist?.length
                ? Math.round((task.checklist.filter(c => c.completed).length / task.checklist.length) * 100)
                : task.completed ? 100 : 0;
              const ownerName = task.owner
                ? (typeof task.owner === 'object' ? `${task.owner.firstName || ''} ${task.owner.lastName || ''}`.trim() : 'Assigned')
                : 'Unassigned';

              return (
                <div key={task._id || i}
                  className="flex items-center gap-4 px-6 py-4 transition-colors table-row"
                  style={{ borderBottom: '1px solid var(--c-border-subtle)' }}>
                  {/* Status dot */}
                  <div className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: task.completed ? '#059669' : isOverdue ? '#dc2626' : 'var(--c-border)' }} />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold ${task.completed ? 'line-through' : ''}`}
                      style={{ color: task.completed ? 'var(--c-text-3)' : 'var(--c-text-0)' }}>{task.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: 'var(--c-text-3)' }}>
                      <span>{ownerName}</span>
                      {task.dueDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(task.dueDate), 'MMM d')}</span>}
                      {task.checklist?.length > 0 && <span>{task.checklist.filter(c => c.completed).length}/{task.checklist.length}</span>}
                    </div>
                  </div>
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="badge" style={{ background: pri.bg, color: pri.c }}>{task.priority}</span>
                    {isOverdue && <span className="badge" style={{ background: '#fef2f2', color: '#dc2626' }}>Overdue</span>}
                  </div>
                  {/* Progress */}
                  <div className="w-16 flex-shrink-0 text-right">
                    <span className="text-[12px] font-bold" style={{ color: progress === 100 ? '#059669' : 'var(--c-text-2)' }}>{progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Members section */}
      {project.members?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
            <p className="text-[15px] font-bold" style={{ color: 'var(--c-text-0)' }}>Team Members ({project.members.length})</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {project.members.map((m, i) => {
              const memberTasks = tasks.filter(t => {
                const ownerId = typeof t.owner === 'object' ? t.owner?._id : t.owner;
                return String(ownerId) === String(m._id);
              });
              const memberCompleted = memberTasks.filter(t => t.completed).length;
              const memberPct = memberTasks.length > 0 ? Math.round((memberCompleted / memberTasks.length) * 100) : 0;

              return (
                <div key={m._id || i} className="flex items-center gap-3 px-6 py-4"
                  style={{ borderBottom: '1px solid var(--c-border-subtle)', borderRight: '1px solid var(--c-border-subtle)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                    style={{ background: 'var(--c-accent)' }}>
                    {(m.firstName || 'U')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--c-text-0)' }}>{m.firstName} {m.lastName}</p>
                    <p className="text-[11px]" style={{ color: 'var(--c-text-3)' }}>{memberCompleted}/{memberTasks.length} tasks · {memberPct}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddTask && (
          <AddProjectTaskModal users={project.members || users}
            onSave={createTaskForProject} onClose={() => setShowAddTask(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Add Task to Project Modal ─────────────────────────────── */
const AddProjectTaskModal = ({ users, onSave, onClose }) => {
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', dueDate: '', ownerId: '', checklist: [] });
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);

  const addItem = () => { if (newItem.trim()) { setForm(f => ({ ...f, checklist: [...f.checklist, { text: newItem.trim(), completed: false }] })); setNewItem(''); } };

  const handle = async () => {
    if (!form.title.trim()) return toast.error('Task title required');
    if (!form.ownerId) return toast.error('Select an assignee');
    setSaving(true);
    await onSave({ ...form, checklist: form.checklist.filter(c => c.text.trim()) });
    setSaving(false);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--c-text-0)' }}>Add Task to Project</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="label">Assign To</label>
            <select value={form.ownerId} onChange={e => setForm(f => ({ ...f, ownerId: e.target.value }))} className="input-base">
              <option value="">Select team member…</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
            </select>
          </div>
          <div><label className="label">Task Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-base" placeholder="What needs to be done?" />
          </div>
          <div><label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-base" rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Priority</label>
              <div className="flex gap-2">
                {['Low', 'Medium', 'High'].map(p => (
                  <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className="flex-1 py-2 rounded-lg text-[12px] font-bold transition-all"
                    style={form.priority === p
                      ? { background: PRI_MAP[p].c, color: 'white' }
                      : { background: 'var(--c-surface-raised)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div><label className="label">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="input-base" />
            </div>
          </div>
          <div>
            <label className="label">Checklist ({form.checklist.length})</label>
            {form.checklist.map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1.5" style={{ background: 'var(--c-surface-raised)' }}>
                <span className="flex-1 text-[13px]" style={{ color: 'var(--c-text-0)' }}>{c.text}</span>
                <button onClick={() => setForm(f => ({ ...f, checklist: f.checklist.filter((_, idx) => idx !== i) }))} style={{ color: 'var(--c-danger)' }}><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={newItem} onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                placeholder="Add checklist item…" className="input-base" />
              <button onClick={addItem} className="btn-secondary flex-shrink-0">Add</button>
            </div>
          </div>
          <button onClick={handle} disabled={saving} className="btn-primary w-full" style={{ height: 44 }}>
            {saving ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </motion.div>
    </>
  );
};

/* ── Project Form Modal ────────────────────────────────────── */
const ProjectFormModal = ({ project, users, onSave, onClose }) => {
  const [f, setF] = useState({
    name: project?.name || '', description: project?.description || '',
    status: project?.status || 'planning', priority: project?.priority || 'Medium',
    startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate: project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    members: project?.members?.map(m => m._id || m) || [],
  });

  const toggle = (id) => setF(p => ({ ...p, members: p.members.includes(id) ? p.members.filter(m => m !== id) : [...p.members, id] }));

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--c-text-0)' }}>{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="label">Project Name</label>
            <input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} className="input-base" placeholder="Project name" />
          </div>
          <div><label className="label">Description</label>
            <textarea value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} className="input-base" rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Status</label>
              <select value={f.status} onChange={e => setF(p => ({ ...p, status: e.target.value }))} className="input-base">
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div><label className="label">Priority</label>
              <select value={f.priority} onChange={e => setF(p => ({ ...p, priority: e.target.value }))} className="input-base">
                {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start Date</label><input type="date" value={f.startDate} onChange={e => setF(p => ({ ...p, startDate: e.target.value }))} className="input-base" /></div>
            <div><label className="label">End Date</label><input type="date" value={f.endDate} onChange={e => setF(p => ({ ...p, endDate: e.target.value }))} className="input-base" /></div>
          </div>
          <div>
            <label className="label">Members ({f.members.length} selected)</label>
            <div className="max-h-48 overflow-y-auto rounded-lg" style={{ border: '1px solid var(--c-border)' }}>
              {users.map(u => (
                <label key={u._id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--c-border-subtle)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--c-surface-raised)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <input type="checkbox" checked={f.members.includes(u._id)} onChange={() => toggle(u._id)}
                    style={{ accentColor: 'var(--c-accent)', width: 16, height: 16 }} />
                  <span className="text-[13px] font-medium" style={{ color: 'var(--c-text-0)' }}>{u.firstName} {u.lastName}</span>
                  <span className="text-[11px] ml-auto" style={{ color: 'var(--c-text-3)' }}>{u.position || u.role}</span>
                </label>
              ))}
            </div>
          </div>
          <button onClick={() => { if (!f.name.trim()) return toast.error('Name required'); onSave(f); }} className="btn-primary w-full" style={{ height: 44 }}>
            {project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default Projects;
