import { useState, useEffect, useCallback } from 'react'
import { Plus, Target, Edit2, Trash2, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  Modal, Confirm, Empty, Pagination, SearchInput, Select, Spinner,
  Field, Avatar, StatusBadge, TableSkel, ProgressBar
} from '../components/common'
import { goalService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const LIMIT = 25

export default function GoalsPage() {
  const { isTeamLead } = useAuth()
  const [goals, setGoals]   = useState([])
  const [report, setReport] = useState(null)
  const [ld, setLd]         = useState(true)
  const [page, setPage]     = useState(1)
  const [total, setTotal]   = useState(0)
  const [search, setSearch] = useState('')
  const [tf, setTf]         = useState('')
  const [gStatus, setGStatus] = useState('')
  const [cOpen, setCOpen]   = useState(false)
  const [edit, setEdit]     = useState(null)
  const [del, setDel]       = useState(null)
  const [reviewG, setReviewG] = useState(null) // { goal, action:'approve'|'reject' }
  const [commentsG, setCommentsG] = useState(null)
  const [actLd, setActLd]   = useState(false)

  const fetch = useCallback(async () => {
    setLd(true)
    try {
      const p = { page, limit:LIMIT }
      if (search)  p.search = search
      if (tf)      p.timeframe = tf
      const { data } = await goalService.getAll(p)
      setGoals(data.goals||[])
      setTotal(data.pagination?.total||0)
    } catch { toast.error('Failed to load goals') }
    finally { setLd(false) }
  }, [page, search, tf])

  const fetchReport = useCallback(async () => {
    try { const { data } = await goalService.getReport(); setReport(data.report) } catch {}
  }, [])

  useEffect(() => { fetch() }, [fetch])
  useEffect(() => { fetchReport() }, [])

  const doReview = async (goal, action, comment='') => {
    setActLd(true)
    try {
      if (action==='approve') await goalService.approve(goal._id, { comment })
      else                    await goalService.reject(goal._id, { comment })
      toast.success(action==='approve' ? 'Goal approved' : 'Goal rejected')
      setReviewG(null)
      fetch(); fetchReport()
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setActLd(false) }
  }

  const doDel = async () => {
    setActLd(true)
    try {
      await goalService.delete(del._id)
      toast.success('Goal deleted')
      setDel(null); fetch(); fetchReport()
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setActLd(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Goal Management</h1>
          <p className="page-sub">Create, track and review goals across your organisation</p>
        </div>
        <button onClick={()=>setCOpen(true)} className="btn btn-primary"><Plus size={14}/> New Goal</button>
      </div>

      {/* Stats */}
      {report && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:8 }}>
          {[
            { l:'Total',      v:report.total,      c:'var(--text-primary)' },
            { l:'Completed',  v:report.completed,  c:'var(--success)' },
            { l:'In Progress',v:report.inProgress, c:'var(--warning)' },
            { l:'Overdue',    v:report.overdue,    c:'var(--danger)' },
          ].map(s=>(
            <div key={s.l} className="card" style={{ padding:'12px 16px' }}>
              <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{s.v??0}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="filter-row">
        <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1)}} placeholder="Search goals…" style={{ flex:1, minWidth:200 }}/>
        <Select value={tf} onChange={v=>{setTf(v);setPage(1)}} placeholder="Timeframe"
          options={[
            {value:'daily',label:'Daily'},{value:'weekly',label:'Weekly'},
            {value:'monthly',label:'Monthly'},{value:'quarterly',label:'Quarterly'},{value:'custom',label:'Custom'},
          ]} style={{ width:140 }}/>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow:'hidden' }}>
        {ld ? <TableSkel rows={8} cols={6}/> : (
          <>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Goal</th><th>Owner</th><th>Timeframe</th>
                  <th>Progress</th><th>Deadline</th><th style={{ width:120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {goals.length===0
                  ? <tr><td colSpan={6}><Empty icon={Target} title="No goals found"/></td></tr>
                  : goals.map(g=>(
                      <tr key={g._id}>
                        <td>
                          <div style={{ fontWeight:500, fontSize:13, color:'var(--text-primary)' }}>{g.title}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>
                            {g.subGoals?.length||0} sub-goals
                          </div>
                        </td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                            <Avatar name={`${g.owner?.firstName} ${g.owner?.lastName}`} size="sm"/>
                            <div>
                              <div style={{ fontSize:13, fontWeight:500 }}>{g.owner?.firstName} {g.owner?.lastName}</div>
                              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{g.owner?.unitSector}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-blue" style={{ textTransform:'capitalize' }}>{g.timeframe}</span></td>
                        <td>
                          <div style={{ width:120, display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ flex:1 }}><ProgressBar value={g.progress||0}/></div>
                            <span style={{ fontSize:11, color:'var(--text-muted)', width:30 }}>{g.progress||0}%</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize:12, color:'var(--text-secondary)' }}>
                            {g.endDate ? format(new Date(g.endDate),'MMM d, yyyy') : '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:4 }}>
                            <button onClick={()=>setCommentsG(g)} className="btn btn-ghost btn-sm btn-icon" title="Comments">
                              <MessageSquare size={13}/>
                            </button>
                            {isTeamLead && g.status!=='approved' && (
                              <>
                                <button onClick={()=>setReviewG({goal:g,action:'approve'})} className="btn btn-ghost btn-sm btn-icon"
                                  title="Approve" style={{ color:'var(--success)' }}>
                                  <ThumbsUp size={13}/>
                                </button>
                                <button onClick={()=>setReviewG({goal:g,action:'reject'})} className="btn btn-ghost btn-sm btn-icon"
                                  title="Reject" style={{ color:'var(--danger)' }}>
                                  <ThumbsDown size={13}/>
                                </button>
                              </>
                            )}
                            <button onClick={()=>setEdit(g)} className="btn btn-ghost btn-sm btn-icon"><Edit2 size={13}/></button>
                            <button onClick={()=>setDel(g)} className="btn btn-ghost btn-sm btn-icon" style={{ color:'var(--danger)' }}><Trash2 size={13}/></button>
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
            <Pagination page={page} total={total} limit={LIMIT} onPage={setPage}/>
          </>
        )}
      </div>

      {/* Modals */}
      <GoalModal open={cOpen} onClose={()=>setCOpen(false)} onSuccess={()=>{fetch();fetchReport();setCOpen(false)}}/>
      {edit && <GoalModal open goal={edit} onClose={()=>setEdit(null)} onSuccess={()=>{fetch();fetchReport();setEdit(null)}}/>}
      {reviewG && (
        <GoalReviewModal
          goal={reviewG.goal} action={reviewG.action}
          onClose={()=>setReviewG(null)}
          onSubmit={(comment)=>doReview(reviewG.goal, reviewG.action, comment)}
          loading={actLd}
        />
      )}
      {commentsG && <GoalCommentsModal goal={commentsG} onClose={()=>setCommentsG(null)}/>}
      <Confirm open={!!del} onClose={()=>setDel(null)} onConfirm={doDel}
        title="Delete Goal" message={`Delete "${del?.title}"?`} label="Delete" danger loading={actLd}/>
    </div>
  )
}

function GoalReviewModal({ goal, action, onClose, onSubmit, loading }) {
  const [comment, setComment] = useState('')
  const isApprove = action==='approve'
  return (
    <Modal open onClose={onClose} title={isApprove?'Approve Goal':'Reject Goal'}
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className={`btn btn-sm ${isApprove?'btn-primary':'btn-danger'}`}
          onClick={()=>onSubmit(comment)} disabled={loading}>
          {loading?<Spinner size={13}/>:isApprove?<><ThumbsUp size={12}/> Approve</>:<><ThumbsDown size={12}/> Reject</>}
        </button>
      </>}>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ padding:'8px 10px', borderRadius:'var(--radius)', background:'var(--bg-subtle)', border:'1px solid var(--border)' }}>
          <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>{goal.title}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
            {goal.owner?.firstName} {goal.owner?.lastName} · {goal.progress||0}% complete
          </div>
        </div>
        <Field label={isApprove?'Comment (optional)':'Reason for rejection'}>
          <textarea className="inp" style={{ height:72 }}
            value={comment} onChange={e=>setComment(e.target.value)}
            placeholder={isApprove?'Leave feedback for the user…':'Explain why this goal is being rejected…'}/>
        </Field>
      </div>
    </Modal>
  )
}

function GoalCommentsModal({ goal, onClose }) {
  const [text, setText]   = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      await goalService.addComment(goal._id, { text })
      toast.success('Comment added — visible to user')
      setText('')
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title={`Goal Comments — ${goal.title}`} size="lg">
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ padding:'8px 10px', borderRadius:'var(--radius)', background:'var(--bg-subtle)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <StatusBadge status={goal.timeframe}/>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>{goal.progress||0}% complete</span>
          </div>
          {goal.subGoals?.length>0 && (
            <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4 }}>
              <div className="section-title">Sub-Goals</div>
              {goal.subGoals.map((s,i)=>(
                <div key={i} style={{ display:'flex', gap:7, fontSize:12, color:s.completed?'var(--text-muted)':'var(--text-primary)',
                  textDecoration:s.completed?'line-through':'none', alignItems:'center' }}>
                  <span style={{ color:s.completed?'var(--success)':'var(--text-muted)' }}>
                    {s.completed?'✓':'○'}
                  </span>
                  {s.title}
                </div>
              ))}
            </div>
          )}
        </div>
        <Field label="Leave a comment (visible to user)">
          <div style={{ display:'flex', gap:8 }}>
            <input className="inp" style={{ flex:1 }}
              placeholder="Write feedback, guidance or notes…"
              value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&submit()}/>
            <button onClick={submit} disabled={saving||!text.trim()} className="btn btn-primary btn-sm">
              {saving?<Spinner size={13}/>:'Send'}
            </button>
          </div>
        </Field>
      </div>
    </Modal>
  )
}

function GoalModal({ open, goal, onClose, onSuccess }) {
  const isEdit = !!goal
  const [f, setF] = useState({
    title:     goal?.title     ||'',
    type:      goal?.type      ||'personal',
    timeframe: goal?.timeframe ||'weekly',
    startDate: goal?.startDate ? goal.startDate.split('T')[0] : '',
    endDate:   goal?.endDate   ? goal.endDate.split('T')[0]   : '',
    ownerEmail:goal?.owner?.email||'',
  })
  const [ld, setLd] = useState(false)
  const set = k => e => setF(p=>({...p,[k]:e.target.value}))

  const submit = async () => {
    if (!f.title||!f.startDate||!f.endDate) return toast.error('Fill required fields')
    if (!isEdit&&!f.ownerEmail) return toast.error('Owner email required')
    setLd(true)
    try {
      if (isEdit) await goalService.update(goal._id, f)
      else        await goalService.create(f)
      toast.success(isEdit?'Goal updated':'Goal created')
      onSuccess()
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setLd(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit?'Edit Goal':'Create Goal'}
      footer={<><button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={ld}>
          {ld?<Spinner size={13}/>:isEdit?'Save Changes':'Create Goal'}
        </button></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
        <Field label="Goal Title" required>
          <input className="inp" value={f.title} onChange={set('title')} placeholder="Goal title"/>
        </Field>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Type">
            <select className="inp" value={f.type} onChange={set('type')}>
              <option value="personal">Personal</option><option value="task">Task-based</option>
            </select>
          </Field>
          <Field label="Timeframe">
            <select className="inp" value={f.timeframe} onChange={set('timeframe')}>
              <option value="daily">Daily</option><option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="custom">Custom</option>
            </select>
          </Field>
          <Field label="Start Date" required><input type="date" className="inp" value={f.startDate} onChange={set('startDate')}/></Field>
          <Field label="End Date" required><input type="date" className="inp" value={f.endDate} onChange={set('endDate')}/></Field>
        </div>
        {!isEdit && (
          <Field label="Assign To (Email)" required>
            <input type="email" className="inp" value={f.ownerEmail} onChange={set('ownerEmail')} placeholder="user@company.com"/>
          </Field>
        )}
      </div>
    </Modal>
  )
}