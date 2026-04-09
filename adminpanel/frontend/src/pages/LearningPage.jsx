import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Plus, Trash2, Users, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal, Empty, Spinner, Field, Avatar, TableSkel, SearchInput } from '../components/common'
import { learningService, userService } from '../services/api'

const LIMIT = 24

export default function LearningPage() {
  const [courses, setCourses] = useState([])
  const [stats, setStats]     = useState(null)
  const [ld, setLd]           = useState(true)
  const [search, setSearch]   = useState('')
  const [cOpen, setCOpen]     = useState(false)
  const [assign, setAssign]   = useState(null)

  const fetch = useCallback(async () => {
    setLd(true)
    try {
      const [cr, st] = await Promise.allSettled([learningService.getCourses({ search }), learningService.getStats()])
      if (cr.status==='fulfilled') setCourses(cr.value.data.courses||[])
      if (st.status==='fulfilled') setStats(st.value.data.stats)
    } catch {} finally { setLd(false) }
  }, [search])

  useEffect(() => { fetch() }, [fetch])

  const doDel = async (c) => {
    if (!confirm(`Delete "${c.title}"?`)) return
    try { await learningService.deleteCourse(c._id); toast.success('Course deleted'); fetch() }
    catch(err) { toast.error(err.response?.data?.message||'Failed') }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="page-header">
        <div><h1 className="page-title">Training</h1><p className="page-sub">Manage courses and track team learning progress</p></div>
        <button onClick={()=>setCOpen(true)} className="btn btn-primary"><Plus size={14}/> New Course</button>
      </div>

      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))', gap:8 }}>
          {[
            { l:'Courses',    v:stats.totalCourses??0,    c:'var(--brand)' },
            { l:'Enrollments',v:stats.totalEnrollments??0,c:'var(--info)' },
            { l:'Completed',  v:stats.completedCount??0,  c:'var(--success)' },
            { l:'Avg Score',  v:`${stats.avgScore??0}%`,  c:'var(--warning)' },
          ].map(s=>(
            <div key={s.l} className="card" style={{ padding:'12px 16px' }}>
              <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ maxWidth:280 }}><SearchInput value={search} onChange={setSearch} placeholder="Search courses…"/></div>

      {ld ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
          {Array.from({length:6}).map((_,i)=><div key={i} className="card skeleton" style={{ height:140 }}/>)}
        </div>
      ) : courses.length===0 ? (
        <div className="card"><Empty icon={BookOpen} title="No courses yet" body="Create your first course to get started"/></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
          {courses.map(c=>(
            <div key={c._id} className="card" style={{ padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{c.level}</div>
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={()=>setAssign(c)} className="btn btn-ghost btn-sm btn-icon" title="Assign"><Users size={13}/></button>
                  <button onClick={()=>doDel(c)} className="btn btn-ghost btn-sm btn-icon" style={{ color:'var(--danger)' }}><Trash2 size={13}/></button>
                </div>
              </div>
              <div style={{ fontWeight:600, fontSize:13.5, color:'var(--text-primary)', marginBottom:4 }}>{c.title}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:10, lineHeight:1.5 }}>{c.description}</div>
              <div style={{ display:'flex', gap:8, fontSize:11, color:'var(--text-muted)' }}>
                <span>{c.modules?.length||0} modules</span>
                <span>·</span>
                <span style={{ textTransform:'capitalize' }}>{c.assetco||'General'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {cOpen && <CourseModal onClose={()=>setCOpen(false)} onSuccess={()=>{fetch();setCOpen(false)}}/>}
      {assign && <AssignModal course={assign} onClose={()=>setAssign(null)}/>}
    </div>
  )
}

function CourseModal({ onClose, onSuccess }) {
  const [f, setF] = useState({ title:'', description:'', level:'beginner', assetco:'General' })
  const [ld, setLd] = useState(false)
  const set = k => e => setF(p=>({...p,[k]:e.target.value}))
  const submit = async () => {
    if (!f.title) return toast.error('Title required')
    setLd(true)
    try { await learningService.createCourse(f); toast.success('Course created'); onSuccess() }
    catch(err) { toast.error(err.response?.data?.message||'Failed') } finally { setLd(false) }
  }
  return (
    <Modal open onClose={onClose} title="New Course"
      footer={<><button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={ld}>
          {ld?<Spinner size={13}/>:'Create Course'}
        </button></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Field label="Course Title" required><input className="inp" value={f.title} onChange={set('title')} placeholder="e.g. Onboarding Fundamentals"/></Field>
        <Field label="Description"><textarea className="inp" style={{ height:64 }} value={f.description} onChange={set('description')} placeholder="What will users learn?"/></Field>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Level"><select className="inp" value={f.level} onChange={set('level')}>
            <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="expert">Expert</option>
          </select></Field>
          <Field label="Department"><input className="inp" value={f.assetco} onChange={set('assetco')} placeholder="e.g. EML"/></Field>
        </div>
      </div>
    </Modal>
  )
}

function AssignModal({ course, onClose }) {
  const [users, setUsers]   = useState([])
  const [selected, setSel]  = useState([])
  const [ld, setLd]         = useState(false)
  useEffect(() => {
    userService.getAll({ limit:200 }).then(({data})=>setUsers(data.users||[])).catch(()=>{})
  }, [])
  const toggle = id => setSel(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])
  const submit = async () => {
    if (!selected.length) return toast.error('Select at least one user')
    setLd(true)
    try { await learningService.assign({ courseId:course._id, userIds:selected }); toast.success(`Assigned to ${selected.length} users`); onClose() }
    catch(err) { toast.error(err.response?.data?.message||'Failed') } finally { setLd(false) }
  }
  return (
    <Modal open onClose={onClose} title={`Assign "${course.title}"`} size="lg"
      footer={<><button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={ld}>
          {ld?<Spinner size={13}/>:`Assign to ${selected.length} users`}
        </button></>}>
      <div style={{ border:'1px solid var(--border)', borderRadius:'var(--radius-md)', maxHeight:280, overflowY:'auto' }}>
        {users.map(u=>{
          const sel=selected.includes(u._id)
          return (
            <div key={u._id} onClick={()=>toggle(u._id)}
              style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 12px', cursor:'pointer',
                background:sel?'var(--bg-selected)':'transparent', borderBottom:'1px solid var(--border)', transition:'background 0.08s' }}>
              <Avatar name={`${u.firstName} ${u.lastName}`} size="sm"/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{u.firstName} {u.lastName}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.unitSector||u.email}</div>
              </div>
              {sel && <span style={{ fontSize:11, color:'var(--brand)', fontWeight:600 }}>Selected</span>}
            </div>
          )
        })}
      </div>
    </Modal>
  )
}