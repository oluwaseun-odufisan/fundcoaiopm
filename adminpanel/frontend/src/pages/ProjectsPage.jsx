import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Briefcase, Trash2, Edit2, MoreVertical, GitBranch, Users,
  CheckSquare, ChevronRight, X, ArrowRight, Check, Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  Modal, Confirm, Empty, Spinner, Field, Avatar, StatusBadge,
  ChecklistEditor, SearchInput, Select
} from '../components/common'
import { projectService, userService } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function ProjectsPage() {
  const { admin } = useAuth()
  const [projects, setProjects] = useState([])
  const [ld, setLd]             = useState(true)
  const [active, setActive]     = useState(null) // selected project
  const [cOpen, setCOpen]       = useState(false)
  const [editP, setEditP]       = useState(null)
  const [delP, setDelP]         = useState(null)
  const [actLd, setActLd]       = useState(false)
  const [mindmapOpen, setMindmapOpen] = useState(false)
  const [mindmapData, setMindmapData] = useState(null)

  const fetchProjects = useCallback(async () => {
    setLd(true)
    try {
      const { data } = await projectService.getAll()
      setProjects(data.projects||[])
    } catch { toast.error('Failed to load projects') }
    finally { setLd(false) }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const openMindmap = async (p) => {
    try {
      const { data } = await projectService.getMindmap(p._id)
      setMindmapData(data.mindmap||generateMindmap(p))
    } catch {
      setMindmapData(generateMindmap(p))
    }
    setMindmapOpen(true)
  }

  const generateMindmap = (p) => ({
    title: p.name,
    progress: p.progress||0,
    children: (p.tasks||[]).map(t=>({
      id: t._id,
      title: t.title,
      status: t.completed?'done':t.submissionStatus==='submitted'?'in-progress':'open',
      assignee: t.owner?`${t.owner.firstName} ${t.owner.lastName}`:null,
      checklist: t.checklist||[],
      checkPct: t.checklist?.length ? Math.round(t.checklist.filter(i=>i.completed).length/t.checklist.length*100) : null,
    }))
  })

  const doDel = async () => {
    setActLd(true)
    try {
      await projectService.delete(delP._id)
      toast.success('Project deleted')
      setDelP(null)
      if (active?._id===delP._id) setActive(null)
      fetchProjects()
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setActLd(false) }
  }

  const totalProgress = (p) => {
    const tasks = p.tasks||[]
    if (!tasks.length) return 0
    return Math.round(tasks.filter(t=>t.completed).length/tasks.length*100)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">Manage team projects and track progress on kanban boards</p>
        </div>
        <button onClick={()=>setCOpen(true)} className="btn btn-primary">
          <Plus size={14}/> New Project
        </button>
      </div>

      {ld ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {Array.from({length:4}).map((_,i)=>(
            <div key={i} className="card skeleton" style={{ height:160 }}/>
          ))}
        </div>
      ) : projects.length===0 ? (
        <div className="card" style={{ padding:48, textAlign:'center' }}>
          <Briefcase size={32} style={{ color:'var(--text-muted)', margin:'0 auto 12px' }}/>
          <div style={{ fontSize:14, fontWeight:500, color:'var(--text-secondary)', marginBottom:4 }}>No projects yet</div>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>
            Create your first project to start assigning tasks and tracking team progress.
          </p>
          <button onClick={()=>setCOpen(true)} className="btn btn-primary"><Plus size={14}/> Create Project</button>
        </div>
      ) : (
        <>
          {/* Project cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
            {projects.map(p=>(
              <div key={p._id} className="card"
                style={{ cursor:'pointer', transition:'border-color 0.12s',
                  borderColor:active?._id===p._id?'var(--brand)':'var(--border)' }}
                onMouseEnter={e=>{ if(active?._id!==p._id) e.currentTarget.style.borderColor='var(--border-strong)'}}
                onMouseLeave={e=>{ if(active?._id!==p._id) e.currentTarget.style.borderColor='var(--border)' }}>
                <div style={{ padding:'14px 14px 10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text-primary)', marginBottom:2 }}>{p.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                        {(p.tasks||[]).length} tasks · {p.members?.length||0} members
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={e=>{e.stopPropagation();openMindmap(p)}} className="btn btn-ghost btn-sm btn-icon" title="View mind map">
                        <GitBranch size={13}/>
                      </button>
                      <ProjectMenu p={p} onEdit={()=>setEditP(p)} onDelete={()=>setDelP(p)}/>
                    </div>
                  </div>
                  {p.description && (
                    <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:10, lineHeight:1.5 }}>{p.description}</p>
                  )}
                  {/* Progress */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>
                      <span>Progress</span>
                      <span>{totalProgress(p)}%</span>
                    </div>
                    <div className="prog-track">
                      <div className={`prog-fill${totalProgress(p)===100?' green':''}`} style={{ width:`${totalProgress(p)}%` }}/>
                    </div>
                  </div>
                  {/* Members */}
                  {p.members?.length>0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      {p.members.slice(0,5).map((m,i)=>(
                        <Avatar key={i} name={`${m.firstName||''} ${m.lastName||''}`} size="xs"/>
                      ))}
                      {p.members.length>5 && (
                        <span style={{ fontSize:11, color:'var(--text-muted)' }}>+{p.members.length-5}</span>
                      )}
                    </div>
                  )}
                </div>
                {/* Open board button */}
                <div style={{ padding:'8px 14px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
                  <button onClick={()=>setActive(active?._id===p._id?null:p)} className="btn btn-ghost btn-sm"
                    style={{ color:active?._id===p._id?'var(--brand)':'var(--text-secondary)' }}>
                    {active?._id===p._id ? 'Close Board' : 'Open Board'} <ArrowRight size={12}/>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Kanban board */}
          {active && <KanbanBoard project={active} onRefresh={fetchProjects} setProject={setActive}/>}
        </>
      )}

      {/* Modals */}
      <ProjectFormModal open={cOpen} onClose={()=>setCOpen(false)} onSuccess={()=>{fetchProjects();setCOpen(false)}}/>
      {editP && <ProjectFormModal open project={editP} onClose={()=>setEditP(null)} onSuccess={()=>{fetchProjects();setEditP(null)}}/>}
      <Confirm open={!!delP} onClose={()=>setDelP(null)} onConfirm={doDel}
        title="Delete Project" message={`Delete "${delP?.name}"? All associated tasks will be removed.`}
        label="Delete" danger loading={actLd}/>
      {mindmapOpen && mindmapData && (
        <MindmapModal data={mindmapData} onClose={()=>setMindmapOpen(false)}/>
      )}
    </div>
  )
}

function ProjectMenu({ p, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <button onClick={e=>{e.stopPropagation();setOpen(o=>!o)}} className="btn btn-ghost btn-sm btn-icon">
        <MoreVertical size={13}/>
      </button>
      {open && (
        <div className="dropdown" style={{ right:0,top:32 }} onMouseLeave={()=>setOpen(false)}>
          <button className="dd-item" onClick={()=>{setOpen(false);onEdit()}}><Edit2 size={12}/> Edit</button>
          <button className="dd-item danger" onClick={()=>{setOpen(false);onDelete()}}><Trash2 size={12}/> Delete</button>
        </div>
      )}
    </div>
  )
}

function KanbanBoard({ project, onRefresh, setProject }) {
  const [p, setP] = useState(project)
  const [addTaskCol, setAddTaskCol] = useState(null) // 'open'|'in-progress'|'done'
  const [allUsers, setAllUsers] = useState([])
  const [taskForm, setTaskForm] = useState({ title:'',description:'',priority:'Medium',checklist:[],ownerIds:[] })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    userService.getAll({ limit:200 }).then(({data})=>setAllUsers(data.users||[])).catch(()=>{})
  }, [])

  // Refresh project data
  const refresh = async () => {
    try {
      const { data } = await projectService.getById(project._id)
      setP(data.project||project)
      setProject(data.project||project)
      onRefresh()
    } catch {}
  }

  const tasks = p.tasks||[]
  const cols = {
    open:        tasks.filter(t=>!t.completed&&t.submissionStatus==='not_submitted'),
    'in-progress': tasks.filter(t=>!t.completed&&t.submissionStatus==='submitted'),
    done:        tasks.filter(t=>t.completed||t.submissionStatus==='approved'),
  }
  const colLabels = { open:'Open', 'in-progress':'In Progress', done:'Done' }
  const colColors = { open:'var(--text-muted)', 'in-progress':'var(--warning)', done:'var(--success)' }

  const submitTask = async () => {
    if (!taskForm.title.trim()) return toast.error('Title required')
    if (taskForm.ownerIds.length===0) return toast.error('Select assignee')
    setSaving(true)
    try {
      await projectService.addTask(p._id, taskForm)
      toast.success('Task added')
      setAddTaskCol(null)
      setTaskForm({ title:'',description:'',priority:'Medium',checklist:[],ownerIds:[] })
      refresh()
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setSaving(false) }
  }

  const updateTaskStatus = async (taskId, status) => {
    try {
      await projectService.updateTask(p._id, taskId, { submissionStatus:status })
      refresh()
    } catch { toast.error('Failed') }
  }

  return (
    <div className="card" style={{ padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontWeight:600, fontSize:14, color:'var(--text-primary)' }}>
          {p.name} — Kanban Board
        </div>
        <div style={{ display:'flex', gap:4 }}>
          <button onClick={()=>setAddTaskCol('open')} className="btn btn-primary btn-sm">
            <Plus size={13}/> Add Task
          </button>
        </div>
      </div>

      <div className="scroll-x" style={{ display:'flex', gap:12, paddingBottom:8 }}>
        {Object.entries(cols).map(([col, colTasks])=>(
          <div key={col} className="kanban-col">
            <div className="kanban-col-header">
              <span style={{ color:colColors[col] }}>● {colLabels[col]}</span>
              <span style={{ fontSize:11 }}>{colTasks.length}</span>
            </div>
            <div style={{ padding:6, flex:1, minHeight:80 }}>
              {colTasks.map(t=>(
                <KanbanCard key={t._id} task={t} col={col} onMove={status=>updateTaskStatus(t._id,status)}/>
              ))}
              {addTaskCol===col && (
                <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:10, margin:6 }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <input className="inp" placeholder="Task title…" value={taskForm.title}
                      onChange={e=>setTaskForm(p=>({...p,title:e.target.value}))}/>
                    <select className="inp" value={taskForm.priority}
                      onChange={e=>setTaskForm(p=>({...p,priority:e.target.value}))}>
                      <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                    </select>
                    <select className="inp" value={taskForm.ownerIds[0]||''}
                      onChange={e=>setTaskForm(p=>({...p,ownerIds:[e.target.value]}))}>
                      <option value="">Assign to…</option>
                      {allUsers.map(u=><option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
                    </select>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={submitTask} disabled={saving} className="btn btn-primary btn-sm" style={{ flex:1 }}>
                        {saving?<Spinner size={12}/>:'Add'}
                      </button>
                      <button onClick={()=>setAddTaskCol(null)} className="btn btn-secondary btn-sm">
                        <X size={12}/>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function KanbanCard({ task, col, onMove }) {
  const checkPct = task.checklist?.length
    ? Math.round(task.checklist.filter(i=>i.completed).length/task.checklist.length*100) : null
  return (
    <div className="kanban-card">
      <div style={{ fontSize:12.5, fontWeight:500, color:'var(--text-primary)', marginBottom:4 }}>{task.title}</div>
      {task.owner && (
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
          <Avatar name={`${task.owner.firstName} ${task.owner.lastName}`} size="xs"/>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>{task.owner.firstName} {task.owner.lastName}</span>
        </div>
      )}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:4 }}>
        <StatusBadge status={task.priority}/>
        {task.dueDate && <span style={{ fontSize:11, color:'var(--text-muted)' }}>Due {format(new Date(task.dueDate),'MMM d')}</span>}
      </div>
      {checkPct!=null && (
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div className="prog-track" style={{ flex:1 }}>
            <div className="prog-fill" style={{ width:`${checkPct}%` }}/>
          </div>
          <span style={{ fontSize:10, color:'var(--text-muted)' }}>{checkPct}%</span>
        </div>
      )}
    </div>
  )
}

function MindmapModal({ data, onClose }) {
  return (
    <Modal open onClose={onClose} title={`Mind Map — ${data.title}`} size="xl">
      <div style={{ overflowX:'auto', padding:'8px 0' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:0, minWidth:'max-content' }}>
          {/* Root node */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingRight:40 }}>
            <div className="mindmap-node root" style={{ marginBottom:0 }}>
              {data.title}
              <div style={{ fontSize:10, fontWeight:500, marginTop:2, opacity:0.85 }}>{data.progress||0}% complete</div>
            </div>
          </div>

          {/* Connector + children */}
          {data.children?.length>0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:12, paddingLeft:16,
              borderLeft:'2px solid var(--border)', marginLeft:0 }}>
              {data.children.map((node,i)=>(
                <div key={node.id||i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {/* Horizontal connector */}
                  <div style={{ width:24, height:2, background:'var(--border)', flexShrink:0 }}/>
                  <div className={`mindmap-node${node.status==='done'?' done':''}`}
                    style={{ minWidth:180 }}>
                    <div style={{ fontWeight:600, marginBottom:2 }}>{node.title}</div>
                    <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                      <StatusBadge status={node.status}/>
                      {node.assignee && (
                        <span style={{ fontSize:10, color:'var(--text-muted)' }}>→ {node.assignee}</span>
                      )}
                    </div>
                    {node.checkPct!=null && (
                      <div style={{ marginTop:5, display:'flex', alignItems:'center', gap:5 }}>
                        <div className="prog-track" style={{ width:80 }}>
                          <div className={`prog-fill${node.checkPct===100?' green':''}`} style={{ width:`${node.checkPct}%` }}/>
                        </div>
                        <span style={{ fontSize:10, color:'var(--text-muted)' }}>{node.checkPct}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.children?.length===0 && (
            <div style={{ fontSize:13, color:'var(--text-muted)', padding:'8px 16px' }}>No tasks yet</div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:16, marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)' }}>
          {[
            { label:'Open', class:'open', color:'var(--text-muted)' },
            { label:'In Progress', class:'in-progress', color:'var(--warning)' },
            { label:'Done', class:'done', color:'var(--success)' },
          ].map(l=>(
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:l.color }}/>
              <span style={{ fontSize:11, color:'var(--text-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

function ProjectFormModal({ open, project, onClose, onSuccess }) {
  const isEdit = !!project
  const [allUsers, setAllUsers] = useState([])
  const [f, setF] = useState({
    name:       project?.name       ||'',
    description:project?.description||'',
    memberIds:  project?.members?.map(m=>m._id)||[],
  })
  const [ld, setLd] = useState(false)
  const set = k => e => setF(p=>({...p,[k]:e.target.value}))

  useEffect(() => {
    userService.getAll({ limit:200 }).then(({data})=>setAllUsers(data.users||[])).catch(()=>{})
  }, [])

  const toggleMember = id => setF(p=>({ ...p, memberIds:p.memberIds.includes(id)?p.memberIds.filter(x=>x!==id):[...p.memberIds,id] }))

  const submit = async () => {
    if (!f.name.trim()) return toast.error('Project name required')
    setLd(true)
    try {
      if (isEdit) await projectService.update(project._id, f)
      else        await projectService.create(f)
      toast.success(isEdit?'Project updated':'Project created')
      onSuccess()
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setLd(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit?'Edit Project':'New Project'} size="lg"
      footer={<><button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={ld}>
          {ld?<Spinner size={13}/>:isEdit?'Save Changes':'Create Project'}
        </button></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Field label="Project Name" required>
          <input className="inp" value={f.name} onChange={set('name')} placeholder="e.g. Q3 Marketing Campaign"/>
        </Field>
        <Field label="Description">
          <textarea className="inp" style={{ height:64 }} value={f.description} onChange={set('description')} placeholder="Brief description…"/>
        </Field>
        <Field label="Team Members" hint="Select which users are part of this project">
          <div style={{ border:'1px solid var(--border)', borderRadius:'var(--radius-md)', maxHeight:200, overflowY:'auto' }}>
            {allUsers.map(u=>{
              const sel=f.memberIds.includes(u._id)
              return (
                <div key={u._id} onClick={()=>toggleMember(u._id)}
                  style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 12px', cursor:'pointer',
                    background:sel?'var(--bg-selected)':'transparent', borderBottom:'1px solid var(--border)', transition:'background 0.08s' }}
                  onMouseEnter={e=>{if(!sel)e.currentTarget.style.background='var(--bg-hover)'}}
                  onMouseLeave={e=>{if(!sel)e.currentTarget.style.background='transparent'}}>
                  <div style={{ width:14, height:14, border:`1px solid ${sel?'var(--brand)':'var(--border)'}`,
                    borderRadius:3, background:sel?'var(--brand)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {sel && <Check size={9} color="#fff"/>}
                  </div>
                  <Avatar name={`${u.firstName} ${u.lastName}`} size="xs"/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{u.firstName} {u.lastName}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.unitSector||u.role}</div>
                  </div>
                </div>
              )
            })}
          </div>
          {f.memberIds.length>0 && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{f.memberIds.length} member{f.memberIds.length!==1?'s':''} selected</div>}
        </Field>
      </div>
    </Modal>
  )
}