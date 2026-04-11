import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ListTodo, Plus, Search, X, Send, CheckCircle2, Clock,
  AlertTriangle, Users, Trash2, MessageSquare, Shield, Edit2,
} from 'lucide-react';

const PRI = { High: { c: '#dc2626', bg: '#fef2f2' }, Medium: { c: '#d97706', bg: '#fffbeb' }, Low: { c: '#6b7494', bg: '#f7f8fb' } };
const SUB = { approved: { c: '#059669', bg: '#ecfdf5' }, submitted: { c: '#d97706', bg: '#fffbeb' }, rejected: { c: '#dc2626', bg: '#fef2f2' }, not_submitted: { c: '#6b7494', bg: '#f7f8fb' } };

const Tasks = () => {
  const { hasRole } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [formTask, setFormTask] = useState(null);   // null=closed, {}=create, {_id:..}=edit
  const [viewTask, setViewTask] = useState(null);
  const [stats, setStats] = useState({});

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const p = { limit: 200 }; if (filter !== 'all') p.status = filter; if (search) p.search = search;
      const [t, s, u] = await Promise.all([api.get('/tasks', { params: p }), api.get('/tasks/stats'), api.get('/team/available-users')]);
      setTasks(t.data.tasks || []); setStats(s.data.stats || {}); setUsers(u.data.users || []);
    } catch { toast.error('Failed to load tasks'); } finally { setLoading(false); }
  }, [filter, search]);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleReview = async (id, action) => {
    try { await api.post(`/tasks/${id}/review`, { action }); toast.success(`Task ${action}`); fetchTasks(); setViewTask(null); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };
  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${id}`); toast.success('Deleted'); fetchTasks(); setViewTask(null); } catch { toast.error('Failed'); }
  };
  const handleSave = async (payload, isEdit, taskId) => {
    try {
      if (isEdit && taskId) { await api.put(`/tasks/${taskId}`, payload); toast.success('Task updated'); }
      else { await api.post('/tasks', payload); toast.success('Task assigned!'); }
      fetchTasks(); setFormTask(null); setViewTask(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const FILTERS = [
    { key: 'all', label: 'All', n: stats.total }, { key: 'pending', label: 'Pending', n: stats.pending },
    { key: 'completed', label: 'Done', n: stats.completed }, { key: 'submitted', label: 'In Review', n: stats.submitted },
    { key: 'overdue', label: 'Overdue', n: stats.overdue },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div><h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>Tasks</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--c-text-2)' }}>Manage and review team tasks</p></div>
        {hasRole('team-lead', 'admin') && (
          <button onClick={() => setFormTask({})} className="btn-primary"><Plus className="w-4 h-4" /> Assign Task</button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[{ l:'Total',v:stats.total||0,c:'var(--c-accent)' },{ l:'Completed',v:stats.completed||0,c:'#059669' },{ l:'Pending',v:stats.pending||0,c:'#d97706' },{ l:'In Review',v:stats.submitted||0,c:'#7c3aed' },{ l:'Overdue',v:stats.overdue||0,c:'#dc2626' }].map(s=>(
          <div key={s.l} className="card p-4"><p className="stat-value text-[20px]" style={{color:s.c}}>{s.v}</p><p className="text-[11px] font-medium mt-1" style={{color:'var(--c-text-3)'}}>{s.l}</p></div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'var(--c-text-3)'}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks…" className="input-base" style={{paddingLeft:38}}/></div>
        <div className="flex gap-1.5">{FILTERS.map(f=>(<button key={f.key} onClick={()=>setFilter(f.key)} className="px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors" style={filter===f.key?{background:'var(--c-accent)',color:'white'}:{background:'var(--c-surface)',color:'var(--c-text-2)',border:'1px solid var(--c-border)'}}>{f.label}{f.n!=null&&<span className="ml-1 opacity-70">·{f.n}</span>}</button>))}</div>
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-7 h-7 rounded-full border-[3px] border-t-transparent animate-spin" style={{borderColor:'var(--c-accent)',borderTopColor:'transparent'}}/></div>
      : tasks.length===0 ? <div className="card text-center py-20"><ListTodo className="w-12 h-12 mx-auto mb-4" style={{color:'var(--c-text-3)'}}/><p className="text-[15px] font-semibold" style={{color:'var(--c-text-1)'}}>No tasks found</p></div>
      : <div className="card overflow-hidden">{tasks.map((task,i)=>{
          const overdue=task.dueDate&&new Date(task.dueDate)<new Date()&&!task.completed;
          const pri=PRI[task.priority]||PRI.Low; const sub=SUB[task.submissionStatus]||SUB.not_submitted;
          const owner=task.owner?`${task.owner.firstName||''} ${task.owner.lastName||''}`.trim():'Unassigned';
          const progress=task.checklist?.length?Math.round((task.checklist.filter(c=>c.completed).length/task.checklist.length)*100):task.completed?100:0;
          return (
            <motion.div key={task._id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*.02}}
              onClick={()=>setViewTask(task)} className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors table-row" style={{borderBottom:'1px solid var(--c-border-subtle)'}}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:task.completed?'#059669':overdue?'#dc2626':'var(--c-border)'}}/>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-semibold ${task.completed?'line-through':''}`} style={{color:task.completed?'var(--c-text-3)':'var(--c-text-0)'}}>{task.title}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px]" style={{color:'var(--c-text-3)'}}>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3"/>{owner}</span>
                  {task.dueDate&&<span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{format(new Date(task.dueDate),'MMM d')}</span>}
                  {task.adminComments?.length>0&&<span className="flex items-center gap-1"><MessageSquare className="w-3 h-3"/>{task.adminComments.length}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="badge" style={{background:pri.bg,color:pri.c}}>{task.priority}</span>
                {task.submissionStatus!=='not_submitted'&&<span className="badge capitalize" style={{background:sub.bg,color:sub.c}}>{task.submissionStatus.replace('_',' ')}</span>}
                {overdue&&<span className="badge" style={{background:'#fef2f2',color:'#dc2626'}}>Overdue</span>}
              </div>
              <div className="w-12 text-right flex-shrink-0"><span className="text-[12px] font-bold" style={{color:progress===100?'#059669':'var(--c-text-2)'}}>{progress}%</span></div>
              <div className="flex gap-1.5 flex-shrink-0" onClick={e=>e.stopPropagation()}>
                {hasRole('team-lead','admin')&&<button onClick={()=>setFormTask(task)} className="btn-ghost p-1.5" title="Edit" style={{color:'var(--c-accent)'}}><Edit2 className="w-4 h-4"/></button>}
                {task.submissionStatus==='submitted'&&<><button onClick={()=>handleReview(task._id,'approved')} className="btn-ghost p-1.5" style={{color:'#059669',background:'#ecfdf5'}}><CheckCircle2 className="w-4 h-4"/></button>
                  <button onClick={()=>handleReview(task._id,'rejected')} className="btn-ghost p-1.5" style={{color:'#dc2626',background:'#fef2f2'}}><X className="w-4 h-4"/></button></>}
              </div>
            </motion.div>);
        })}</div>}

      {/* Create / Edit modal — same form component handles both */}
      <AnimatePresence>{formTask!==null&&<TaskFormModal task={formTask._id?formTask:null} users={users} onClose={()=>setFormTask(null)} onSave={handleSave}/>}</AnimatePresence>
      {/* Detail modal */}
      <AnimatePresence>{viewTask&&<TaskDetail task={viewTask} onClose={()=>setViewTask(null)} onReview={handleReview} onDelete={handleDelete} onEdit={t=>{setViewTask(null);setFormTask(t);}} onRefresh={fetchTasks} canEdit={hasRole('team-lead','admin')}/>}</AnimatePresence>
    </div>
  );
};

/* ── TASK FORM MODAL (Create + Edit) ───────────────────────────────────────── */
const TaskFormModal = ({ task, users, onClose, onSave }) => {
  const isEdit = !!task;
  const [f, setF] = useState({
    title: task?.title || '', description: task?.description || '',
    priority: task?.priority || 'Medium',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    ownerId: task?.owner?._id || task?.owner || '',
    checklist: task?.checklist?.map(c => ({ text: c.text, completed: c.completed })) || [],
  });
  const [ni, setNi] = useState(''); const [saving, setSaving] = useState(false);

  const addItem = () => { if (ni.trim()) { setF(p => ({ ...p, checklist: [...p.checklist, { text: ni.trim(), completed: false }] })); setNi(''); } };
  const toggleItem = (idx) => { setF(p => ({ ...p, checklist: p.checklist.map((c, i) => i === idx ? { ...c, completed: !c.completed } : c) })); };

  const handle = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) return toast.error('Title required');
    if (!isEdit && !f.ownerId) return toast.error('Select assignee');
    setSaving(true);
    await onSave({ title: f.title.trim(), description: f.description, priority: f.priority, dueDate: f.dueDate || undefined, ownerId: f.ownerId || undefined, checklist: f.checklist.filter(c => c.text.trim()) }, isEdit, task?._id);
    setSaving(false);
  };

  return (<>
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 z-50" onClick={onClose}/>
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}
      className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl"
      style={{background:'var(--c-surface)',border:'1px solid var(--c-border)',boxShadow:'var(--shadow-xl)'}}>
      <div className="flex items-center justify-between px-6 py-4" style={{borderBottom:'1px solid var(--c-border)'}}>
        <h2 className="text-[16px] font-bold" style={{color:'var(--c-text-0)'}}>{isEdit ? 'Edit Task' : 'Assign New Task'}</h2>
        <button onClick={onClose} className="btn-ghost p-2"><X className="w-4 h-4"/></button>
      </div>
      <form onSubmit={handle} className="p-6 space-y-4">
        <div><label className="label">{isEdit ? 'Reassign To' : 'Assign To *'}</label>
          <select value={f.ownerId} onChange={e=>setF(p=>({...p,ownerId:e.target.value}))} className="input-base">
            <option value="">{isEdit?'Keep current owner':'Select user…'}</option>
            {users.map(u=><option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.email})</option>)}
          </select></div>
        <div><label className="label">Title *</label><input value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))} className="input-base" placeholder="Task title"/></div>
        <div><label className="label">Description</label><textarea value={f.description} onChange={e=>setF(p=>({...p,description:e.target.value}))} className="input-base" rows={3} style={{resize:'vertical'}}/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Priority</label><div className="flex gap-2">{['Low','Medium','High'].map(p=>(
            <button key={p} type="button" onClick={()=>setF(prev=>({...prev,priority:p}))} className="flex-1 py-2 rounded-lg text-[12px] font-bold transition-all"
              style={f.priority===p?{background:PRI[p].c,color:'white'}:{background:'var(--c-surface-raised)',color:'var(--c-text-2)',border:'1px solid var(--c-border)'}}>{p}</button>
          ))}</div></div>
          <div><label className="label">Due Date</label><input type="date" value={f.dueDate} onChange={e=>setF(p=>({...p,dueDate:e.target.value}))} className="input-base"/></div>
        </div>
        <div><label className="label">Checklist ({f.checklist.length})</label>
          {f.checklist.map((c,i)=>(<div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1.5" style={{background:'var(--c-surface-raised)'}}>
            <input type="checkbox" checked={c.completed} onChange={()=>toggleItem(i)} style={{accentColor:'var(--c-accent)',width:16,height:16}}/>
            <input value={c.text} onChange={e=>{const u=[...f.checklist];u[i]={...u[i],text:e.target.value};setF(p=>({...p,checklist:u}));}}
              className="flex-1 text-[13px] bg-transparent focus:outline-none" style={{color:c.completed?'var(--c-text-3)':'var(--c-text-0)',textDecoration:c.completed?'line-through':'none'}}/>
            <button type="button" onClick={()=>setF(p=>({...p,checklist:p.checklist.filter((_,j)=>j!==i)}))} style={{color:'var(--c-danger)'}}><X className="w-3.5 h-3.5"/></button>
          </div>))}
          <div className="flex gap-2"><input value={ni} onChange={e=>setNi(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addItem();}}} className="input-base" placeholder="Add item…"/>
            <button type="button" onClick={addItem} className="btn-secondary flex-shrink-0">Add</button></div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full" style={{height:44}}>{saving?'Saving…':isEdit?'Save Changes':'Create & Assign'}</button>
      </form>
    </motion.div>
  </>);
};

/* ── TASK DETAIL MODAL ─────────────────────────────────────────────────────── */
const TaskDetail = ({ task, onClose, onReview, onDelete, onEdit, onRefresh, canEdit }) => {
  const [comment, setComment] = useState(''); const [posting, setPosting] = useState(false);
  const owner = task.owner ? `${task.owner.firstName||''} ${task.owner.lastName||''}`.trim() : 'N/A';
  const pri = PRI[task.priority]||PRI.Low;
  const progress = task.checklist?.length ? Math.round((task.checklist.filter(c=>c.completed).length/task.checklist.length)*100) : task.completed?100:0;

  const addComment = async () => {
    if(!comment.trim()) return; setPosting(true);
    try { await api.post(`/tasks/${task._id}/comment`,{content:comment.trim()}); toast.success('Comment added'); setComment(''); onRefresh(); onClose(); }
    catch { toast.error('Failed'); } finally { setPosting(false); }
  };

  return (<>
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 z-50" onClick={onClose}/>
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}
      className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl"
      style={{background:'var(--c-surface)',border:'1px solid var(--c-border)',boxShadow:'var(--shadow-xl)'}}>
      <div className="flex items-center justify-between px-6 py-4" style={{borderBottom:'1px solid var(--c-border)'}}>
        <p className="section-title">Task Details</p>
        <div className="flex items-center gap-1">
          {canEdit&&<button onClick={()=>onEdit(task)} className="btn-ghost p-2" title="Edit task" style={{color:'var(--c-accent)'}}><Edit2 className="w-4 h-4"/></button>}
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-4 h-4"/></button>
        </div>
      </div>
      <div className="p-6 space-y-5">
        <div><h2 className="text-[18px] font-bold" style={{color:'var(--c-text-0)'}}>{task.title}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="badge" style={{background:pri.bg,color:pri.c}}>{task.priority}</span>
            {task.submissionStatus!=='not_submitted'&&<span className="badge capitalize" style={{background:SUB[task.submissionStatus]?.bg,color:SUB[task.submissionStatus]?.c}}>{task.submissionStatus.replace('_',' ')}</span>}
            {task.completed&&<span className="badge" style={{background:'#ecfdf5',color:'#059669'}}>Completed</span>}
            {task.createdByAdmin&&<span className="badge" style={{background:'#eff6ff',color:'#2563eb'}}>Admin Assigned</span>}
          </div></div>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-[11px] font-semibold mb-1" style={{color:'var(--c-text-3)'}}>ASSIGNED TO</p><p className="text-[14px] font-semibold" style={{color:'var(--c-text-0)'}}>{owner}</p></div>
          <div><p className="text-[11px] font-semibold mb-1" style={{color:'var(--c-text-3)'}}>DUE DATE</p><p className="text-[14px] font-semibold" style={{color:'var(--c-text-0)'}}>{task.dueDate?format(new Date(task.dueDate),'MMM dd, yyyy'):'None'}</p></div>
        </div>
        {task.description&&<div><p className="text-[11px] font-semibold mb-1" style={{color:'var(--c-text-3)'}}>DESCRIPTION</p><p className="text-[14px]" style={{color:'var(--c-text-1)'}}>{task.description}</p></div>}
        {task.checklist?.length>0&&(<div>
          <div className="flex justify-between text-[11px] mb-2"><span style={{color:'var(--c-text-3)'}}>CHECKLIST</span><span className="font-bold" style={{color:'var(--c-accent)'}}>{progress}%</span></div>
          <div className="h-[6px] rounded-full overflow-hidden mb-3" style={{background:'var(--c-surface-sunken)'}}><div className="h-full rounded-full" style={{width:`${progress}%`,background:progress===100?'#059669':'var(--c-accent)'}}/></div>
          <div className="space-y-1.5">{task.checklist.map((c,i)=>(<div key={i} className="flex items-center gap-2.5 text-[13px]"><CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{color:c.completed?'#059669':'var(--c-border)'}}/><span className={c.completed?'line-through':''} style={{color:c.completed?'var(--c-text-3)':'var(--c-text-0)'}}>{c.text}</span></div>))}</div>
        </div>)}
        {task.adminComments?.length>0&&(<div><p className="text-[11px] font-semibold mb-2" style={{color:'var(--c-text-3)'}}>ADMIN NOTES</p>
          {task.adminComments.map((c,i)=>(<div key={i} className="p-3 rounded-xl mb-2" style={{background:'var(--c-surface-raised)'}}><p className="text-[12px] font-semibold" style={{color:'var(--c-accent)'}}>{c.user?.firstName} {c.user?.lastName}</p><p className="text-[13px] mt-1" style={{color:'var(--c-text-0)'}}>{c.content}</p><p className="text-[10px] mt-1" style={{color:'var(--c-text-3)'}}>{c.createdAt?format(new Date(c.createdAt),'MMM d, h:mm a'):''}</p></div>))}
        </div>)}
        <div><p className="text-[11px] font-semibold mb-2" style={{color:'var(--c-text-3)'}}>ADD COMMENT</p>
          <div className="flex gap-2"><input value={comment} onChange={e=>setComment(e.target.value)} className="input-base" placeholder="Write a note…"/>
            <button onClick={addComment} disabled={posting||!comment.trim()} className="btn-primary flex-shrink-0 px-4">{posting?'…':<Send className="w-4 h-4"/>}</button></div></div>
        <div className="flex gap-2 pt-2">
          {canEdit&&<button onClick={()=>onEdit(task)} className="btn-secondary flex-1"><Edit2 className="w-4 h-4"/> Edit Task</button>}
          {task.submissionStatus==='submitted'&&<><button onClick={()=>onReview(task._id,'approved')} className="flex-1 btn-primary" style={{background:'#059669'}}><CheckCircle2 className="w-4 h-4"/> Approve</button>
            <button onClick={()=>onReview(task._id,'rejected')} className="flex-1 btn-danger"><X className="w-4 h-4"/> Reject</button></>}
          {canEdit&&<button onClick={()=>onDelete(task._id)} className="btn-ghost" style={{color:'var(--c-danger)'}}><Trash2 className="w-4 h-4"/></button>}
        </div>
      </div>
    </motion.div>
  </>);
};

export default Tasks;
