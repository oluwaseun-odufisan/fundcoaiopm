import { useState, useEffect, useCallback } from 'react'
import { FileText, ThumbsUp, ThumbsDown, Eye, MessageSquare, StickyNote } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  Modal, Empty, Pagination, SearchInput, Select, Spinner,
  Field, Avatar, StatusBadge, TableSkel
} from '../components/common'
import { reportService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const LIMIT = 25

export default function ReportsPage() {
  const { isTeamLead } = useAuth()
  const [tab, setTab]       = useState('all')
  const [reports, setReports] = useState([])
  const [pending, setPending] = useState([])
  const [stats, setStats]   = useState(null)
  const [ld, setLd]         = useState(true)
  const [page, setPage]     = useState(1)
  const [total, setTotal]   = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [viewR, setViewR]   = useState(null)
  const [noteR, setNoteR]   = useState(null)
  const [rejectR, setRejectR] = useState(null)
  const [actLd, setActLd]   = useState(false)

  const fetchAll = useCallback(async () => {
    setLd(true)
    try {
      const p = { page, limit:LIMIT }
      if (search) p.search=search
      if (status) p.status=status
      const { data } = await reportService.getAll(p)
      setReports(data.reports||[])
      setTotal(data.pagination?.total||0)
    } catch { toast.error('Failed') }
    finally { setLd(false) }
  }, [page, search, status])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => {
    reportService.getPending().then(({data})=>setPending(data.reports||[])).catch(()=>{})
    reportService.getStats().then(({data})=>setStats(data.stats)).catch(()=>{})
  }, [])

  const doReview = async (id, action, feedback='') => {
    setActLd(true)
    try {
      await reportService.review(id, { action, feedback })
      toast.success(action==='approve'?'Report approved':'Report rejected')
      setRejectR(null)
      fetchAll()
      reportService.getPending().then(({data})=>setPending(data.reports||[])).catch(()=>{})
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setActLd(false) }
  }

  const addNote = async (id, note) => {
    setActLd(true)
    try {
      await reportService.addNote(id, { note })
      toast.success('Note added — visible to user')
      setNoteR(null)
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setActLd(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">Review and manage submitted performance reports</p>
        </div>
      </div>

      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:8 }}>
          {[
            { l:'Total',     v:stats.total,     c:'var(--text-primary)' },
            { l:'Submitted', v:stats.submitted, c:'var(--brand)' },
            { l:'Approved',  v:stats.approved,  c:'var(--success)' },
            { l:'Rejected',  v:stats.rejected,  c:'var(--danger)' },
          ].map(s=>(
            <div key={s.l} className="card" style={{ padding:'12px 16px' }}>
              <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{s.v??0}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="tab-bar">
        {[
          { k:'all',     l:'All Reports' },
          { k:'pending', l:`Pending Review${pending.length>0?` (${pending.length})`:''}`},
        ].map(t=>(
          <div key={t.k} className={`tab-item${tab===t.k?' active':''}`} onClick={()=>setTab(t.k)}>{t.l}</div>
        ))}
      </div>

      {tab==='all' && (
        <>
          <div className="filter-row">
            <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1)}} placeholder="Search reports…" style={{ flex:1, minWidth:200 }}/>
            <Select value={status} onChange={v=>{setStatus(v);setPage(1)}} placeholder="All Status"
              options={[{value:'draft',label:'Draft'},{value:'submitted',label:'Submitted'},{value:'approved',label:'Approved'},{value:'rejected',label:'Rejected'}]}
              style={{ width:140 }}/>
          </div>
          <div className="card" style={{ overflow:'hidden' }}>
            {ld ? <TableSkel rows={8} cols={6}/> : (
              <>
                <table className="tbl">
                  <thead>
                    <tr><th>Title</th><th>Author</th><th>Type</th><th>Submitted</th><th>Status</th><th style={{ width:110 }}>Actions</th></tr>
                  </thead>
                  <tbody>
                    {reports.length===0
                      ? <tr><td colSpan={6}><Empty icon={FileText} title="No reports found"/></td></tr>
                      : reports.map(r=>(
                          <tr key={r._id}>
                            <td>
                              <div style={{ fontWeight:500, fontSize:13, color:'var(--text-primary)' }}>{r.title}</div>
                              {r.aiGenerated && <span className="badge badge-purple" style={{ marginTop:2 }}>AI</span>}
                            </td>
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                <Avatar name={`${r.user?.firstName} ${r.user?.lastName}`} size="sm"/>
                                <div>
                                  <div style={{ fontSize:13, fontWeight:500 }}>{r.user?.firstName} {r.user?.lastName}</div>
                                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.user?.unitSector}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className="badge badge-blue" style={{ textTransform:'capitalize' }}>{r.reportType}</span></td>
                            <td><span style={{ fontSize:12, color:'var(--text-secondary)' }}>{r.submittedAt?format(new Date(r.submittedAt),'MMM d, yyyy'):'—'}</span></td>
                            <td><StatusBadge status={r.status}/></td>
                            <td>
                              <div style={{ display:'flex', gap:3 }}>
                                <button onClick={()=>setViewR(r)} className="btn btn-ghost btn-sm btn-icon" title="View"><Eye size={13}/></button>
                                <button onClick={()=>setNoteR(r)} className="btn btn-ghost btn-sm btn-icon" title="Add note"><StickyNote size={13}/></button>
                                {isTeamLead && r.status==='submitted' && (
                                  <>
                                    <button onClick={()=>doReview(r._id,'approve')} disabled={actLd}
                                      className="btn btn-ghost btn-sm btn-icon" title="Approve" style={{ color:'var(--success)' }}>
                                      <ThumbsUp size={13}/>
                                    </button>
                                    <button onClick={()=>setRejectR(r)}
                                      className="btn btn-ghost btn-sm btn-icon" title="Reject" style={{ color:'var(--danger)' }}>
                                      <ThumbsDown size={13}/>
                                    </button>
                                  </>
                                )}
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
        </>
      )}

      {tab==='pending' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {pending.length===0
            ? <div className="card"><Empty icon={ThumbsUp} title="All caught up!" body="No reports awaiting review"/></div>
            : pending.map(r=>(
                <div key={r._id} className="card" style={{ padding:14 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)', marginBottom:3 }}>{r.title}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>
                        {r.user?.firstName} {r.user?.lastName} · {r.reportType}
                        {r.submittedAt && ` · ${format(new Date(r.submittedAt),'MMM d')}`}
                      </div>
                      {r.content && (
                        <p style={{ fontSize:12.5, color:'var(--text-secondary)', lineHeight:1.5,
                          overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box',
                          WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                          {r.content}
                        </p>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button onClick={()=>setViewR(r)} className="btn btn-secondary btn-sm"><Eye size={13}/> View</button>
                      <button onClick={()=>setNoteR(r)} className="btn btn-secondary btn-sm"><StickyNote size={13}/> Note</button>
                      <button onClick={()=>doReview(r._id,'approve')} disabled={actLd} className="btn btn-primary btn-sm">
                        <ThumbsUp size={13}/> Approve
                      </button>
                      <button onClick={()=>setRejectR(r)} className="btn btn-danger btn-sm">
                        <ThumbsDown size={13}/> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {/* View modal */}
      {viewR && (
        <Modal open onClose={()=>setViewR(null)} title={viewR.title} size="lg">
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <StatusBadge status={viewR.status}/>
              <span className="badge badge-blue" style={{ textTransform:'capitalize' }}>{viewR.reportType}</span>
              {viewR.aiGenerated && <span className="badge badge-purple">AI Generated</span>}
            </div>
            <div style={{ padding:14, borderRadius:'var(--radius)', background:'var(--bg-subtle)',
              border:'1px solid var(--border)', fontSize:13, lineHeight:1.75, color:'var(--text-primary)',
              whiteSpace:'pre-wrap', maxHeight:360, overflowY:'auto' }}>
              {viewR.content}
            </div>
            {viewR.adminNotes && (
              <div style={{ padding:'10px 12px', borderRadius:'var(--radius)',
                borderLeft:'3px solid var(--brand)', background:'var(--bg-subtle)' }}>
                <div className="section-title" style={{ marginBottom:4 }}>Admin Notes</div>
                <div style={{ fontSize:13, color:'var(--text-primary)' }}>{viewR.adminNotes}</div>
              </div>
            )}
            {viewR.feedback && (
              <div style={{ padding:'10px 12px', borderRadius:'var(--radius)',
                borderLeft:'3px solid var(--warning)', background:'var(--bg-subtle)' }}>
                <div className="section-title" style={{ marginBottom:4 }}>Feedback</div>
                <div style={{ fontSize:13, color:'var(--text-primary)' }}>{viewR.feedback}</div>
              </div>
            )}
            <div style={{ display:'flex', gap:6, paddingTop:4 }}>
              <button onClick={()=>{setViewR(null);setNoteR(viewR)}} className="btn btn-secondary btn-sm">
                <StickyNote size={13}/> Add Note
              </button>
              {isTeamLead && viewR.status==='submitted' && (
                <>
                  <button onClick={()=>{setViewR(null);doReview(viewR._id,'approve')}} disabled={actLd} className="btn btn-primary btn-sm">
                    <ThumbsUp size={13}/> Approve
                  </button>
                  <button onClick={()=>{setViewR(null);setRejectR(viewR)}} className="btn btn-danger btn-sm">
                    <ThumbsDown size={13}/> Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Note modal */}
      {noteR && (
        <NoteModal report={noteR} onClose={()=>setNoteR(null)}
          onSave={(note)=>addNote(noteR._id, note)} loading={actLd}/>
      )}

      {/* Reject modal */}
      {rejectR && (
        <RejectModal report={rejectR} onClose={()=>setRejectR(null)}
          onSubmit={feedback=>doReview(rejectR._id,'reject',feedback)} loading={actLd}/>
      )}
    </div>
  )
}

function NoteModal({ report, onClose, onSave, loading }) {
  const [note, setNote] = useState('')
  return (
    <Modal open onClose={onClose} title="Add Admin Note"
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={()=>onSave(note)} disabled={loading||!note.trim()}>
          {loading?<Spinner size={13}/>:<><StickyNote size={12}/> Save Note</>}
        </button>
      </>}>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ padding:'8px 10px', borderRadius:'var(--radius)', background:'var(--bg-subtle)', border:'1px solid var(--border)', fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>
          {report.title}
        </div>
        <Field label="Note (visible to user)">
          <textarea className="inp" style={{ height:90 }} value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Write notes, feedback or guidance for the user…"/>
        </Field>
      </div>
    </Modal>
  )
}

function RejectModal({ report, onClose, onSubmit, loading }) {
  const [feedback, setFeedback] = useState('')
  return (
    <Modal open onClose={onClose} title="Reject Report"
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger btn-sm" onClick={()=>onSubmit(feedback)} disabled={loading}>
          {loading?<Spinner size={13}/>:<><ThumbsDown size={12}/> Reject</>}
        </button>
      </>}>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ padding:'8px 10px', borderRadius:'var(--radius)', background:'var(--bg-subtle)', border:'1px solid var(--border)', fontSize:13, fontWeight:500 }}>
          {report.title}
        </div>
        <Field label="Feedback for user">
          <textarea className="inp" style={{ height:80 }} value={feedback} onChange={e=>setFeedback(e.target.value)}
            placeholder="Explain why this report is being rejected…"/>
        </Field>
      </div>
    </Modal>
  )
}