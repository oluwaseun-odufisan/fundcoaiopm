import { useState, useEffect, useCallback } from 'react'
import { Users, Search, Check, CheckSquare, Square, Eye, RefreshCw, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  Modal, Empty, SearchInput, Avatar, StatusBadge, Spinner, Select, TableSkel
} from '../components/common'
import { userService, taskService, goalService, reportService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const STORAGE_KEY = 'admin_selected_team_members'

export default function MyTeamPage() {
  const { admin } = useAuth()
  const [allUsers, setAllUsers] = useState([])
  const [selectedIds, setSelectedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]') } catch { return [] }
  })
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks')
  const [activities, setActivities] = useState([])
  const [ld, setLd] = useState(false)
  const [search, setSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')

  useEffect(() => {
    userService.getAll({ limit:200 }).then(({data})=>setAllUsers(data.users||[])).catch(()=>{})
  }, [])

  const selectedUsers = allUsers.filter(u=>selectedIds.includes(u._id))

  const saveSelection = (ids) => {
    setSelectedIds(ids)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    setSelectorOpen(false)
    toast.success(`${ids.length} team member${ids.length!==1?'s':''} selected`)
  }

  const loadActivities = useCallback(async () => {
    if (selectedIds.length===0) { setActivities([]); return }
    setLd(true)
    try {
      if (activeTab==='tasks') {
        const { data } = await taskService.getAll({ limit:50, ownerIds:selectedIds.join(',') })
        setActivities(data.tasks||[])
      } else if (activeTab==='goals') {
        const { data } = await goalService.getAll({ limit:50, ownerIds:selectedIds.join(',') })
        setActivities(data.goals||[])
      } else if (activeTab==='reports') {
        const { data } = await reportService.getAll({ limit:50, ownerIds:selectedIds.join(',') })
        setActivities(data.reports||[])
      }
    } catch { toast.error('Failed to load') }
    finally { setLd(false) }
  }, [selectedIds, activeTab])

  useEffect(() => { loadActivities() }, [loadActivities])

  const filteredActivity = activities.filter(a=>{
    const name = a.title||a.content||''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Team</h1>
          <p className="page-sub">Select and monitor your team members' activities</p>
        </div>
        <button onClick={()=>setSelectorOpen(true)} className="btn btn-primary">
          <Users size={14}/> Manage Team Selection
        </button>
      </div>

      {/* Selected members chips */}
      {selectedUsers.length===0 ? (
        <div className="card" style={{ padding:32, textAlign:'center' }}>
          <Users size={32} style={{ color:'var(--text-muted)', margin:'0 auto 12px' }}/>
          <div style={{ fontSize:14, fontWeight:500, color:'var(--text-secondary)', marginBottom:4 }}>No team members selected</div>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>
            Select the team members you manage to view their tasks, goals, and reports in one place.
          </p>
          <button onClick={()=>setSelectorOpen(true)} className="btn btn-primary">
            <Users size={14}/> Select Team Members
          </button>
        </div>
      ) : (
        <>
          {/* Member avatars row */}
          <div className="card" style={{ padding:14 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:500, color:'var(--text-secondary)' }}>
                {selectedUsers.length} member{selectedUsers.length!==1?'s':''} selected
              </span>
              <button onClick={()=>setSelectorOpen(true)} className="btn btn-secondary btn-sm">
                <RefreshCw size={12}/> Change
              </button>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {selectedUsers.map(u=>(
                <div key={u._id} style={{ display:'flex', alignItems:'center', gap:7,
                  background:'var(--bg-subtle)', borderRadius:'var(--radius)', padding:'5px 10px',
                  border:'1px solid var(--border)' }}>
                  <Avatar name={`${u.firstName} ${u.lastName}`} size="sm"/>
                  <div>
                    <div style={{ fontSize:12.5, fontWeight:500, color:'var(--text-primary)' }}>{u.firstName} {u.lastName}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.unitSector||u.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity tabs */}
          <div className="tab-bar">
            {[
              { k:'tasks',   l:'Tasks' },
              { k:'goals',   l:'Goals' },
              { k:'reports', l:'Reports' },
            ].map(t=>(
              <div key={t.k} className={`tab-item${activeTab===t.k?' active':''}`} onClick={()=>setActiveTab(t.k)}>{t.l}</div>
            ))}
          </div>

          <div className="filter-row">
            <SearchInput value={search} onChange={setSearch} placeholder={`Search ${activeTab}…`} style={{ flex:1, maxWidth:320 }}/>
            <button onClick={loadActivities} className="btn btn-secondary btn-sm"><RefreshCw size={13}/> Refresh</button>
          </div>

          {/* Activity content */}
          {ld ? <div className="card"><TableSkel rows={6} cols={4}/></div> : (
            <div className="card" style={{ overflow:'hidden' }}>
              {filteredActivity.length===0
                ? <Empty title={`No ${activeTab} found`} body="Try adjusting filters or selecting different members"/>
                : <table className="tbl">
                    <thead>
                      <tr>
                        {activeTab==='tasks' && <><th>Task</th><th>Member</th><th>Priority</th><th>Status</th><th>Due</th></>}
                        {activeTab==='goals' && <><th>Goal</th><th>Member</th><th>Progress</th><th>Timeframe</th><th>Due</th></>}
                        {activeTab==='reports' && <><th>Report</th><th>Author</th><th>Type</th><th>Status</th><th>Date</th></>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActivity.map(item=>(
                        <TeamActivityRow key={item._id} item={item} type={activeTab}/>
                      ))}
                    </tbody>
                  </table>
              }
            </div>
          )}
        </>
      )}

      {/* Member selector modal */}
      <MemberSelectorModal
        open={selectorOpen}
        onClose={()=>setSelectorOpen(false)}
        allUsers={allUsers}
        currentIds={selectedIds}
        onSave={saveSelection}
      />
    </div>
  )
}

function TeamActivityRow({ item, type }) {
  if (type==='tasks') return (
    <tr>
      <td>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{item.title}</div>
        {item.checklist?.length>0 && (
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>
            {item.checklist.filter(i=>i.completed).length}/{item.checklist.length} checklist
          </div>
        )}
      </td>
      <td>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Avatar name={`${item.owner?.firstName} ${item.owner?.lastName}`} size="xs"/>
          <span style={{ fontSize:12.5 }}>{item.owner?.firstName} {item.owner?.lastName}</span>
        </div>
      </td>
      <td><StatusBadge status={item.priority}/></td>
      <td><StatusBadge status={item.submissionStatus}/></td>
      <td><span style={{ fontSize:12, color:'var(--text-muted)' }}>{item.dueDate?format(new Date(item.dueDate),'MMM d, yyyy'):'—'}</span></td>
    </tr>
  )
  if (type==='goals') return (
    <tr>
      <td><span style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{item.title}</span></td>
      <td>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Avatar name={`${item.owner?.firstName} ${item.owner?.lastName}`} size="xs"/>
          <span style={{ fontSize:12.5 }}>{item.owner?.firstName} {item.owner?.lastName}</span>
        </div>
      </td>
      <td>
        <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:80 }}>
          <div className="prog-track" style={{ width:60 }}>
            <div className="prog-fill" style={{ width:`${item.progress||0}%` }}/>
          </div>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>{item.progress||0}%</span>
        </div>
      </td>
      <td><span className="badge badge-blue" style={{ textTransform:'capitalize' }}>{item.timeframe}</span></td>
      <td><span style={{ fontSize:12, color:'var(--text-muted)' }}>{item.endDate?format(new Date(item.endDate),'MMM d, yyyy'):'—'}</span></td>
    </tr>
  )
  if (type==='reports') return (
    <tr>
      <td><span style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{item.title}</span></td>
      <td>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Avatar name={`${item.user?.firstName} ${item.user?.lastName}`} size="xs"/>
          <span style={{ fontSize:12.5 }}>{item.user?.firstName} {item.user?.lastName}</span>
        </div>
      </td>
      <td><span className="badge badge-blue" style={{ textTransform:'capitalize' }}>{item.reportType}</span></td>
      <td><StatusBadge status={item.status}/></td>
      <td><span style={{ fontSize:12, color:'var(--text-muted)' }}>{item.createdAt?format(new Date(item.createdAt),'MMM d, yyyy'):'—'}</span></td>
    </tr>
  )
  return null
}

function MemberSelectorModal({ open, onClose, allUsers, currentIds, onSave }) {
  const [selected, setSelected] = useState(new Set(currentIds))
  const [search, setSearch] = useState('')

  useEffect(() => { setSelected(new Set(currentIds)) }, [currentIds, open])

  const toggle = id => setSelected(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n })
  const selectAll = () => setSelected(new Set(filtered.map(u=>u._id)))
  const clearAll  = () => setSelected(new Set())

  const filtered = allUsers.filter(u=>
    `${u.firstName} ${u.lastName} ${u.email} ${u.unitSector||''}`.toLowerCase().includes(search.toLowerCase())
  )

  // group by sector
  const bySector = filtered.reduce((acc,u)=>{ const s=u.unitSector||'Other'; if(!acc[s]) acc[s]=[]; acc[s].push(u); return acc },{})

  return (
    <Modal open={open} onClose={onClose} title="Select Team Members" size="lg"
      footer={<>
        <div style={{ marginRight:'auto', fontSize:12, color:'var(--text-muted)' }}>
          {selected.size} of {allUsers.length} selected
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={()=>onSave([...selected])}>
          <Check size={13}/> Confirm Selection
        </button>
      </>}>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {/* Search & bulk */}
        <div style={{ display:'flex', gap:8 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search users…" style={{ flex:1 }}/>
          <button onClick={selectAll} className="btn btn-secondary btn-sm">Select all</button>
          <button onClick={clearAll} className="btn btn-secondary btn-sm">Clear</button>
        </div>

        {/* List grouped by sector */}
        <div style={{ maxHeight:380, overflowY:'auto', border:'1px solid var(--border)', borderRadius:'var(--radius-md)' }}>
          {Object.entries(bySector).map(([sector, users])=>(
            <div key={sector}>
              <div style={{ padding:'6px 12px', background:'var(--bg-subtle)', borderBottom:'1px solid var(--border)',
                fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                {sector} ({users.length})
              </div>
              {users.map(u=>{
                const sel = selected.has(u._id)
                return (
                  <div key={u._id} onClick={()=>toggle(u._id)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', cursor:'pointer',
                      background:sel?'var(--bg-selected)':'transparent', borderBottom:'1px solid var(--border)',
                      transition:'background 0.08s' }}
                    onMouseEnter={e=>{if(!sel)e.currentTarget.style.background='var(--bg-hover)'}}
                    onMouseLeave={e=>{if(!sel)e.currentTarget.style.background='transparent'}}>
                    <div style={{ width:16, height:16, borderRadius:'var(--radius)', border:`1px solid ${sel?'var(--brand)':'var(--border)'}`,
                      background:sel?'var(--brand)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {sel && <Check size={10} color="#fff"/>}
                    </div>
                    <Avatar name={`${u.firstName} ${u.lastName}`} size="sm"/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{u.firstName} {u.lastName}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.email} · {u.role}</div>
                    </div>
                    {sel && <span style={{ fontSize:11, color:'var(--brand)', fontWeight:600 }}>Selected</span>}
                  </div>
                )
              })}
            </div>
          ))}
          {filtered.length===0 && <div style={{ padding:24, textAlign:'center', fontSize:13, color:'var(--text-muted)' }}>No users found</div>}
        </div>
      </div>
    </Modal>
  )
}