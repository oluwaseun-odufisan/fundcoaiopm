import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FolderKanban, Plus, Search, X, Loader2, Users, Calendar, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_C = { planning: '#3b82f6', active: '#16a34a', 'on-hold': '#d97706', completed: '#7c3aed', archived: '#64748b' };

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [p, u] = await Promise.all([api.get('/projects', { params: { search } }), api.get('/team/available-users')]);
      setProjects(p.data.projects || []);
      setUsers(u.data.users || []);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async (form, isEdit = false) => {
    try {
      if (isEdit && editProject) {
        await api.put(`/projects/${editProject._id}`, form);
        toast.success('Project updated!');
      } else {
        await api.post('/projects', form);
        toast.success('Project created!');
      }
      fetch(); setShowCreate(false); setEditProject(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    try { await api.delete(`/projects/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FolderKanban className="w-6 h-6" style={{ color: 'var(--brand-accent)' }} /> Projects
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Manage team projects and members</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: 'var(--brand-accent)' }}>
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…"
          className="flex-1 bg-transparent text-sm focus:outline-none" style={{ color: 'var(--text-primary)' }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-accent)' }} /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <FolderKanban className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>No projects yet</p>
          <button onClick={() => setShowCreate(true)} className="mt-3 px-5 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-accent)' }}>
            <Plus className="w-4 h-4 inline mr-1" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => {
            const sc = STATUS_C[project.status] || '#64748b';
            const memberCount = project.members?.length || 0;
            const taskCount = project.tasks?.length || 0;
            return (
              <motion.div key={project._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .03 }}
                className="rounded-xl border p-5 hover:shadow-md transition-all"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize mt-1 inline-block"
                      style={{ backgroundColor: `${sc}15`, color: sc }}>{project.status}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditProject(project); setShowCreate(true); }} className="p-1.5 rounded-lg" style={{ color: 'var(--brand-accent)' }}><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(project._id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {project.description && (
                  <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{memberCount} members</span>
                  <span>{taskCount} tasks</span>
                  {project.endDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(project.endDate), 'MMM dd')}</span>}
                </div>
                {/* Member avatars */}
                {project.members?.length > 0 && (
                  <div className="flex -space-x-2 mt-3">
                    {project.members.slice(0, 5).map((m, j) => (
                      <div key={m._id || j} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: 'var(--brand-accent)', borderColor: 'var(--bg-surface)' }}>
                        {(m.firstName || 'U').charAt(0)}
                      </div>
                    ))}
                    {project.members.length > 5 && (
                      <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                        +{project.members.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowCreate(false); setEditProject(null); }} />
          <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <ProjectForm project={editProject} users={users}
              onSubmit={(f) => handleSave(f, !!editProject)}
              onCancel={() => { setShowCreate(false); setEditProject(null); }} />
          </motion.div>
        </>
      )}
    </div>
  );
};

const ProjectForm = ({ project, users, onSubmit, onCancel }) => {
  const [f, setF] = useState({
    name: project?.name || '', description: project?.description || '',
    status: project?.status || 'planning', priority: project?.priority || 'Medium',
    startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate: project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    members: project?.members?.map(m => m._id || m) || [],
  });

  const toggleMember = (id) => {
    setF(p => ({
      ...p,
      members: p.members.includes(id) ? p.members.filter(m => m !== id) : [...p.members, id],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>{project ? 'Edit Project' : 'New Project'}</h2>
        <button onClick={onCancel} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
      </div>
      <input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="Project name *"
        className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
      <textarea value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Description"
        className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
      <div className="grid grid-cols-2 gap-3">
        <select value={f.status} onChange={e => setF(p => ({ ...p, status: e.target.value }))}
          className="px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
          {['planning', 'active', 'on-hold', 'completed', 'archived'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={f.priority} onChange={e => setF(p => ({ ...p, priority: e.target.value }))}
          className="px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
          {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="date" value={f.startDate} onChange={e => setF(p => ({ ...p, startDate: e.target.value }))}
          className="px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
        <input type="date" value={f.endDate} onChange={e => setF(p => ({ ...p, endDate: e.target.value }))}
          className="px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Members ({f.members.length})</p>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {users.map(u => (
            <label key={u._id} className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--bg-hover)] text-sm"
              style={{ color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={f.members.includes(u._id)} onChange={() => toggleMember(u._id)}
                style={{ accentColor: 'var(--brand-accent)' }} />
              {u.firstName} {u.lastName}
            </label>
          ))}
        </div>
      </div>
      <button onClick={() => { if (!f.name.trim()) return toast.error('Name required'); onSubmit(f); }}
        className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-accent)' }}>
        {project ? 'Save Changes' : 'Create Project'}
      </button>
    </div>
  );
};

export default Projects;
