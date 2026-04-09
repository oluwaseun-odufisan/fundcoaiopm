import { useState, useEffect, useCallback } from 'react'
import {
  Plus, ThumbsUp, ThumbsDown, Edit2, RefreshCw, Trash2,
  MoreVertical, MessageSquare, CheckSquare, Users, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  Modal, Confirm, Empty, Pagination, SearchInput, Select,
  Spinner, Field, Avatar, StatusBadge, TableSkel, ChecklistEditor
} from '../components/common'
import { taskService, userService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const LIMIT = 25

export default function TasksPage() {
  const { isSuperAdmin, admin } = useAuth()
  const [tab, setTab]     = useState('all')
  const [tasks, setTasks] = useState([])
  const [pending, setPending] = useState([])
  const [report, setReport]   = useState(null)
  const [ld, setLd]       = useState(true)
  const [page, setPage]   = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch]   = useState('')
  const [priority, setPriority] = useState('')
  const [status, setStatus]   = useState('')
  const [sub, setSub]         = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTask, setEditTask]     = useState(null)
  const [reviewTask, setReviewTask] = useState(null)
  const [commentsTask, setCommentsTask] = useState(null)
  const [delConfirm, setDelConfirm] = useState(null)
  const [actLd, setActLd] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLd(true)
    try {
      const p = { page, limit:LIMIT }
      if (search)   p.search = search
      if (priority) p.priority = priority
      if (status)   p.status = status
      if (sub)      p.submissionStatus = sub
      const { data } = await taskService.getAll(p)
      setTasks(data.tasks||[])
      setTotal(data.pagination?.total||0)
    } catch { toast.error('Failed to load tasks') }
    finally { setLd(false) }
  }, [page, search, priority, status, sub])

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useEffect(() => {
    taskService.getPending().then(({data})=>setPending(data.tasks||[])).catch(()=>{})
    taskService.getReport().then(({data})=>setReport(data.report)).catch(()=>{})
  }, [])

  const doReview = async (id, action, reason='') => {
    setActLd(true)
    try {
      await taskService.review(id, { action, rejectionReason:reason })
      toast.success(action==='approve'?'Task approved':'Task rejected')
      setReviewTask(null)
      taskService.getPending().then(({data})=>setPending(data.tasks||[])).catch(()=>{})
      taskService.getReport().then(({data})=>setReport(data.report)).catch(()=>{})
      fetchTasks()
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setActLd(false) }
  }

  const doDel = async () => {
    setActLd(true)
    try {
      await taskService.delete(delConfirm._id)
      toast.success('Task deleted')
      setDelConfirm(null); fetchTasks()
      taskService.getReport().then(({data})=>setReport(data.report)).catch(()=>{})
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setActLd(false) }
  }

  const refreshAll = () => {
    fetchTasks()
    taskService.getPending().then(({data})=>setPending(data.tasks||[])).catch(()=>{})
    taskService.getReport().then(({data})=>setReport(data.report)).catch(()=>{})
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Management</h1>
          <p className="page-sub">Create, assign and review tasks across your team</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setCreateOpen(true)} className="btn btn-primary">
            <Plus size={14}/> New Task
          </button>
        </div>
      </div>

      {/* Stats row */}
      {report && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:8 }}>
          {[
            { l:'Total',     v:report.total,     c:'var(--text-primary)' },
            { l:'Completed', v:report.completed, c:'var(--success)' },
            { l:'Overdue',   v:report.overdue,   c:'var(--danger)' },
            { l:'Submitted', v:report.submitted, c:'var(--warning)' },
            { l:'Approved',  v:report.approved,  c:'var(--brand)' },
          ].map(s=>(
            <div key={s.l} className="card" style={{ padding:'12px 16px' }}>
              <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{s.v??0}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar">
        {[
          { k:'all', l:'All Tasks' },
          { k:'approvals', l:`Pending Approvals${pending.length>0?` (${pending.length})`:''}`},
        ].map(t=>(
          <div key={t.k} className={`tab-item${tab===t.k?' active':''}`} onClick={()=>setTab(t.k)}>{t.l}</div>
        ))}
      </div>

      {tab==='all' && (
        <>
          {/* Filters */}
          <div className="filter-row">
            <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1)}} placeholder="Search tasks…" style={{ flex:1, minWidth:200 }}/>
            <Select value={priority} onChange={v=>{setPriority(v);setPage(1)}} placeholder="Priority"
              options={[{value:'High',label:'High'},{value:'Medium',label:'Medium'},{value:'Low',label:'Low'}]}
              style={{ width:130 }}/>
            <Select value={status} onChange={v=>{setStatus(v);setPage(1)}} placeholder="Status"
              options={[{value:'completed',label:'Completed'},{value:'incomplete',label:'Incomplete'}]}
              style={{ width:130 }}/>
            <Select value={sub} onChange={v=>{setSub(v);setPage(1)}} placeholder="Submission"
              options={[
                {value:'submitted',label:'Submitted'},
                {value:'approved',label:'Approved'},
                {value:'rejected',label:'Rejected'},
                {value:'not_submitted',label:'Not Submitted'},
              ]} style={{ width:150 }}/>
          </div>

          {/* Table */}
          <div className="card" style={{ overflow:'hidden' }}>
            {ld ? <TableSkel rows={8} cols={7}/> : (
              <>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Task</th><th>Assigned To</th><th>Priority</th>
                      <th>Due Date</th><th>Checklist</th><th>Status</th>
                      <th style={{ width:80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length===0
                      ? <tr><td colSpan={7}><Empty title="No tasks found" body="Try adjusting your filters"/></td></tr>
                      : tasks.map(t=>(
                          <TaskRow key={t._id} task={t} isSuperAdmin={isSuperAdmin}
                            onEdit={()=>setEditTask(t)}
                            onReview={()=>setReviewTask(t)}
                            onComments={()=>setCommentsTask(t)}
                            onDelete={()=>setDelConfirm(t)}
                            onQuickApprove={()=>doReview(t._id,'approve')}
                          />
                        ))
                    }
                  </tbody>
                </table>
                <Pagination page={page} total={total} limit={LIMIT} onPage={setPage}/>
              </>
            )}
          </div>
        </>
      )}

      {tab==='approvals' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {pending.length===0
            ? <div className="card"><Empty icon={ThumbsUp} title="All caught up!" body="No tasks pending review"/></div>
            : pending.map(t=>(
                <div key={t._id} className="card" style={{ padding:14 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <span style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>{t.title}</span>
                        <StatusBadge status={t.priority}/>
                        <StatusBadge status={t.submissionStatus}/>
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>
                        <Avatar name={`${t.owner?.firstName} ${t.owner?.lastName}`} size="xs"/>
                        &nbsp;{t.owner?.firstName} {t.owner?.lastName}
                        {t.owner?.unitSector && ` · ${t.owner.unitSector}`}
                        {t.dueDate && ` · Due ${format(new Date(t.dueDate),'MMM d')}`}
                      </div>
                      {/* Checklist preview */}
                      {t.checklist?.length>0 && (
                        <div style={{ marginTop:6 }}>
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>
                            Checklist: {t.checklist.filter(i=>i.completed).length}/{t.checklist.length} done
                          </div>
                          <div className="prog-track" style={{ width:200 }}>
                            <div className="prog-fill" style={{ width:`${Math.round(t.checklist.filter(i=>i.completed).length/t.checklist.length*100)}%` }}/>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button onClick={()=>setCommentsTask(t)} className="btn btn-secondary btn-sm">
                        <MessageSquare size={13}/> Comment
                      </button>
                      <button onClick={()=>doReview(t._id,'approve')} disabled={actLd} className="btn btn-primary btn-sm">
                        <ThumbsUp size={13}/> Approve
                      </button>
                      <button onClick={()=>setReviewTask({...t,_rej:true})} disabled={actLd} className="btn btn-danger btn-sm">
                        <ThumbsDown size={13}/> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {/* Modals */}
      <TaskFormModal open={createOpen} onClose={()=>setCreateOpen(false)} onSuccess={()=>{refreshAll();setCreateOpen(false)}}/>
      {editTask && <TaskFormModal open task={editTask} onClose={()=>setEditTask(null)} onSuccess={()=>{refreshAll();setEditTask(null)}}/>}
      {reviewTask && <ReviewModal task={reviewTask} onClose={()=>setReviewTask(null)} onAction={doReview} loading={actLd}/>}
      {commentsTask && <CommentsModal task={commentsTask} onClose={()=>setCommentsTask(null)} onComment={(id,text)=>taskService.addComment(id,{text}).then(()=>{toast.success('Comment added');setCommentsTask(null)}).catch(()=>toast.error('Failed'))}/>}
      <Confirm open={!!delConfirm} onClose={()=>setDelConfirm(null)} onConfirm={doDel}
        title="Delete Task" message={`Delete "${delConfirm?.title}"? This action cannot be undone.`}
        label="Delete" danger loading={actLd}/>
    </div>
  )
}

function TaskRow({ task:t, isSuperAdmin, onEdit, onReview, onComments, onDelete, onQuickApprove }) {
  const [open, setOpen] = useState(false)
  const checkPct = t.checklist?.length
    ? Math.round(t.checklist.filter(i=>i.completed).length/t.checklist.length*100) : null

  return (
    <tr>
      <td>
        <div style={{ fontWeight:500, fontSize:13, color:'var(--text-primary)', maxWidth:240 }}>
          {t.title}
        </div>
        {t.description && (
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:1, maxWidth:240,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {t.description}
          </div>
        )}
      </td>
      <td>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <Avatar name={`${t.owner?.firstName} ${t.owner?.lastName}`} size="sm"/>
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>
              {t.owner?.firstName} {t.owner?.lastName}
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{t.owner?.unitSector}</div>
          </div>
        </div>
      </td>
      <td><StatusBadge status={t.priority}/></td>
      <td>
        <span style={{ fontSize:12, color:'var(--text-secondary)' }}>
          {t.dueDate ? format(new Date(t.dueDate),'MMM d, yyyy') : '—'}
        </span>
      </td>
      <td>
        {checkPct!=null ? (
          <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:80 }}>
            <div style={{ flex:1 }}><div className="prog-track"><div className="prog-fill" style={{ width:`${checkPct}%` }}/></div></div>
            <span style={{ fontSize:11, color:'var(--text-muted)', width:30 }}>{checkPct}%</span>
          </div>
        ) : <span style={{ fontSize:12, color:'var(--text-muted)' }}>—</span>}
      </td>
      <td>
        <div style={{ display:'flex', gap:4 }}>
          <span className={`badge ${t.completed?'badge-green':'badge-gray'}`}>{t.completed?'Done':'Open'}</span>
          <StatusBadge status={t.submissionStatus}/>
        </div>
      </td>
      <td>
        <div style={{ position:'relative', display:'flex', gap:4, justifyContent:'flex-end' }}>
          <button onClick={onComments} className="btn btn-ghost btn-sm btn-icon" title="Comments">
            <MessageSquare size={13}/>
          </button>
          <button onClick={()=>setOpen(o=>!o)} className="btn btn-ghost btn-sm btn-icon">
            <MoreVertical size={13}/>
          </button>
          {open && (
            <div className="dropdown" style={{ right:0, top:32 }} onMouseLeave={()=>setOpen(false)}>
              {t.submissionStatus==='submitted' && (
                <>
                  <button className="dd-item" onClick={()=>{setOpen(false);onQuickApprove()}}><ThumbsUp size={13}/> Approve</button>
                  <button className="dd-item" onClick={()=>{setOpen(false);onReview()}}><ThumbsDown size={13}/> Reject</button>
                  <div className="dd-sep"/>
                </>
              )}
              <button className="dd-item" onClick={()=>{setOpen(false);onEdit()}}><Edit2 size={13}/> Edit</button>
              {isSuperAdmin && <button className="dd-item danger" onClick={()=>{setOpen(false);onDelete()}}><Trash2 size={13}/> Delete</button>}
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

function ReviewModal({ task, onClose, onAction, loading }) {
  const [reason, setReason] = useState('')
  return (
    <Modal open onClose={onClose} title="Reject Task"
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger btn-sm" onClick={()=>onAction(task._id,'reject',reason)} disabled={loading}>
          {loading?<Spinner size={13}/>:<><ThumbsDown size={12}/> Reject</>}
        </button>
      </>}>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ padding:'8px 10px', borderRadius:'var(--radius)', background:'var(--bg-subtle)',
          border:'1px solid var(--border)', fontSize:13 }}>
          <strong>{task.title}</strong>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
            {task.owner?.firstName} {task.owner?.lastName}
          </div>
        </div>
        <Field label="Rejection reason">
          <textarea className="inp" style={{ height:72 }}
            value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explain why…"/>
        </Field>
      </div>
    </Modal>
  )
}

function CommentsModal({ task, onClose, onComment }) {
  const [comments, setComments] = useState([])
  const [ld, setLd] = useState(true)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    taskService.getComments(task._id).then(({data})=>setComments(data.comments||[])).catch(()=>{}).finally(()=>setLd(false))
  }, [task._id])

  const submit = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      await taskService.addComment(task._id, { text })
      toast.success('Comment added')
      setText('')
      taskService.getComments(task._id).then(({data})=>setComments(data.comments||[])).catch(()=>{})
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title={`Comments — ${task.title}`} size="lg">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {/* Checklist view */}
        {task.checklist?.length>0 && (
          <div>
            <div className="section-title">Checklist</div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {task.checklist.map((item,i)=>(
                <div key={i} className="checklist-item">
                  <input type="checkbox" checked={item.completed} readOnly/>
                  <span style={{ fontSize:13, textDecoration:item.completed?'line-through':'none',
                    color:item.completed?'var(--text-muted)':'var(--text-primary)' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Comments */}
        <div>
          <div className="section-title">Admin Comments</div>
          {ld ? <Spinner size={16}/> : comments.length===0
            ? <div style={{ fontSize:13, color:'var(--text-muted)', padding:'8px 0' }}>No comments yet</div>
            : <div className="divide-y">
                {comments.map((c,i)=>(
                  <div key={i} className="comment-block">
                    <Avatar name={c.adminName||'Admin'} size="sm"/>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3 }}>
                        <span style={{ fontSize:12.5, fontWeight:600, color:'var(--text-primary)' }}>{c.adminName||'Admin'}</span>
                        <span style={{ fontSize:11, color:'var(--text-muted)' }}>{c.createdAt?format(new Date(c.createdAt),'MMM d, h:mm a'):''}</span>
                      </div>
                      <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
          }
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <input className="inp" style={{ flex:1 }} placeholder="Write a comment visible to the user…"
              value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&submit()}/>
            <button onClick={submit} disabled={saving||!text.trim()} className="btn btn-primary btn-sm">
              {saving?<Spinner size={13}/>:'Send'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function TaskFormModal({ open, task, onClose, onSuccess }) {
  const isEdit = !!task
  const [users, setUsers] = useState([])
  const [f, setF] = useState({
    title:      task?.title      ||'',
    description:task?.description||'',
    priority:   task?.priority   ||'Medium',
    dueDate:    task?.dueDate    ? task.dueDate.split('T')[0] : '',
    checklist:  task?.checklist  ||[],
    ownerIds: [],
  })
  const [ld, setLd] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userDropOpen, setUserDropOpen] = useState(false)
  const set = k => e => setF(p=>({...p,[k]:e.target.value}))

  useEffect(() => {
    userService.getAll({ limit:200 }).then(({data})=>setUsers(data.users||[])).catch(()=>{})
  }, [])

  const toggleUser = (uid) => {
    setF(p=>({...p, ownerIds: p.ownerIds.includes(uid) ? p.ownerIds.filter(x=>x!==uid) : [...p.ownerIds,uid]}))
  }

  const filteredUsers = users.filter(u=>`${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase()))

  const submit = async () => {
    if (!f.title.trim()) return toast.error('Title required')
    if (!isEdit && f.ownerIds.length===0) return toast.error('Select at least one assignee')
    if (!isEdit && f.checklist.length===0) return toast.error('Add at least one checklist item')
    setLd(true)
    try {
      if (isEdit) {
        await taskService.update(task._id, { title:f.title, description:f.description, priority:f.priority, dueDate:f.dueDate, checklist:f.checklist })
        toast.success('Task updated')
      } else {
        // Bulk create for multiple users
        if (f.ownerIds.length>1) {
          await taskService.bulkCreate({ ...f, ownerIds:f.ownerIds })
          toast.success(`Task assigned to ${f.ownerIds.length} users`)
        } else {
          const user = users.find(u=>u._id===f.ownerIds[0])
          await taskService.create({ ...f, ownerEmail:user?.email })
          toast.success('Task created')
        }
      }
      onSuccess()
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setLd(false) }
  }

  const selectedUsers = users.filter(u=>f.ownerIds.includes(u._id))

  return (
    <Modal open={open} onClose={onClose} title={isEdit?'Edit Task':'Create Task'} size="lg"
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={ld}>
          {ld?<Spinner size={13}/>:isEdit?'Save Changes':'Create Task'}
        </button>
      </>}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Field label="Task Title" required>
          <input className="inp" value={f.title} onChange={set('title')} placeholder="What needs to be done?"/>
        </Field>
        <Field label="Description">
          <textarea className="inp" style={{ height:64 }} value={f.description} onChange={set('description')} placeholder="Optional details"/>
        </Field>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Priority">
            <select className="inp" value={f.priority} onChange={set('priority')}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </Field>
          <Field label="Due Date">
            <input type="date" className="inp" value={f.dueDate} onChange={set('dueDate')}/>
          </Field>
        </div>

        {/* Checklist */}
        <Field label="Checklist (required)" required={!isEdit}>
          <ChecklistEditor items={f.checklist} onChange={items=>setF(p=>({...p,checklist:items}))}/>
        </Field>

        {/* Assignees — multi-select for new tasks */}
        {!isEdit && (
          <Field label="Assign To" required hint="Select one or more team members">
            {/* Selected users chips */}
            {selectedUsers.length>0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
                {selectedUsers.map(u=>(
                  <span key={u._id} style={{ display:'inline-flex', alignItems:'center', gap:4,
                    background:'var(--bg-selected)', color:'var(--brand)',
                    borderRadius:'var(--radius)', padding:'2px 8px', fontSize:12, fontWeight:500 }}>
                    {u.firstName} {u.lastName}
                    <button onClick={()=>toggleUser(u._id)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--brand)',display:'flex',alignItems:'center',padding:0 }}><X size={11}/></button>
                  </span>
                ))}
              </div>
            )}
            {/* User dropdown */}
            <div style={{ position:'relative' }}>
              <div className="inp" style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
                onClick={()=>setUserDropOpen(o=>!o)}>
                <Users size={13} style={{ color:'var(--text-muted)' }}/>
                <span style={{ color:'var(--text-muted)', fontSize:13 }}>
                  {f.ownerIds.length>0 ? `${f.ownerIds.length} selected` : 'Select team members…'}
                </span>
                <ChevronDown size={12} style={{ color:'var(--text-muted)', marginLeft:'auto' }}/>
              </div>
              {userDropOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0,
                  background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)',
                  boxShadow:'var(--shadow-lg)', zIndex:200, maxHeight:220, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                  <div style={{ padding:8, borderBottom:'1px solid var(--border)' }}>
                    <SearchInput value={userSearch} onChange={setUserSearch} placeholder="Search users…"/>
                  </div>
                  <div style={{ overflowY:'auto', flex:1 }}>
                    {filteredUsers.map(u=>(
                      <div key={u._id} onClick={()=>toggleUser(u._id)}
                        style={{ display:'flex', alignItems:'center', gap:9, padding:'6px 10px', cursor:'pointer',
                          background:f.ownerIds.includes(u._id)?'var(--bg-selected)':'transparent',
                          transition:'background 0.08s' }}
                        onMouseEnter={e=>{if(!f.ownerIds.includes(u._id))e.currentTarget.style.background='var(--bg-hover)'}}
                        onMouseLeave={e=>{if(!f.ownerIds.includes(u._id))e.currentTarget.style.background='transparent'}}>
                        <Avatar name={`${u.firstName} ${u.lastName}`} size="sm"/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{u.firstName} {u.lastName}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.unitSector||u.email}</div>
                        </div>
                        {f.ownerIds.includes(u._id) && <CheckSquare size={14} style={{ color:'var(--brand)', flexShrink:0 }}/>}
                      </div>
                    ))}
                    {filteredUsers.length===0 && <div style={{ padding:12, fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>No users found</div>}
                  </div>
                  <div style={{ padding:'8px 10px', borderTop:'1px solid var(--border)', background:'var(--bg-subtle)' }}>
                    <button onClick={()=>setUserDropOpen(false)} className="btn btn-primary btn-sm" style={{ width:'100%' }}>
                      Done ({f.ownerIds.length} selected)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Field>
        )}
      </div>
    </Modal>
  )
}

function X({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg> }