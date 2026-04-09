import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckSquare, Target, FileText, Clock, ThumbsUp, ArrowRight,
  TrendingUp, Users, AlertTriangle, Award
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { format, subDays } from 'date-fns'
import { Avatar, StatusBadge, Empty, Spinner } from '../components/common'
import { taskService, goalService, reportService, performanceService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const HOUR = new Date().getHours()
const GREET = HOUR<12?'Good morning':HOUR<17?'Good afternoon':'Good evening'

const CHART_STYLE = {
  contentStyle:{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:12 },
  tick:{ fill:'var(--text-muted)', fontSize:11 },
}

export default function DashboardPage() {
  const { admin, isExecutive } = useAuth()
  const navigate = useNavigate()
  const [taskRep, setTaskRep] = useState(null)
  const [goalRep, setGoalRep] = useState(null)
  const [repStats, setRepStats] = useState(null)
  const [overview, setOverview] = useState(null)
  const [pending, setPending]   = useState([])
  const [topPerf, setTopPerf]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.allSettled([
      taskService.getReport(),
      goalService.getReport(),
      reportService.getStats(),
      performanceService.getOverview(),
      taskService.getPending(),
      performanceService.getTopPerformers({ top:5 }),
    ]).then(([tr,gr,rs,ov,pt,tp]) => {
      if(tr.status==='fulfilled') setTaskRep(tr.value.data.report)
      if(gr.status==='fulfilled') setGoalRep(gr.value.data.report)
      if(rs.status==='fulfilled') setRepStats(rs.value.data.stats)
      if(ov.status==='fulfilled') setOverview(ov.value.data.overview)
      if(pt.status==='fulfilled') setPending(pt.value.data.tasks?.slice(0,5)||[])
      if(tp.status==='fulfilled') setTopPerf(tp.value.data.topPerformers||[])
      setLoading(false)
    })
  }, [])

  const areaData = Array.from({length:14},(_,i)=>({
    day: format(subDays(new Date(),13-i),'MMM d'),
    tasks: Math.floor(Math.random()*12)+2,
    done:  Math.floor(Math.random()*8)+1,
  }))

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300 }}>
      <Spinner size={28}/>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>
          {GREET}, {admin?.firstName}
        </h1>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>
          {format(new Date(),'EEEE, MMMM d yyyy')}
          {admin?.managedSector && ` · ${admin.managedSector}`}
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10 }}>
        {[
          { label:'Total Tasks',       value:taskRep?.total,      icon:CheckSquare, color:'var(--brand)',   sub:`${taskRep?.completionRate??0}% done` },
          { label:'Pending Approval',  value:taskRep?.submitted,  icon:Clock,       color:'var(--warning)', sub:'Awaiting review' },
          { label:'Active Goals',      value:goalRep?.total,      icon:Target,      color:'var(--success)', sub:`${goalRep?.completed??0} completed` },
          { label:'Reports Submitted', value:repStats?.submitted, icon:FileText,    color:'var(--info)',    sub:'Needs review' },
          { label:'Overdue Tasks',     value:taskRep?.overdue,    icon:AlertTriangle,color:'var(--danger)', sub:'Needs attention' },
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span className="section-title" style={{ marginBottom:0 }}>{s.label}</span>
              <div style={{ width:26,height:26,borderRadius:'var(--radius)',background:'var(--bg-subtle)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <s.icon size={13} style={{ color:s.color }}/>
              </div>
            </div>
            <div style={{ fontSize:28, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value??0}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,5fr) minmax(0,3fr)', gap:14 }}>
        {/* Task activity */}
        <div className="card" style={{ padding:'16px 16px 8px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text-primary)' }}>Task Activity</div>
              <div style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:1 }}>Created vs Completed — Last 14 days</div>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              {[['var(--brand)','Created'],['var(--success)','Completed']].map(([c,l])=>(
                <div key={l} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, color:'var(--text-muted)' }}>
                  <div style={{ width:8,height:8,borderRadius:2,background:c }}/>
                  {l}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={areaData} margin={{ top:0,right:0,left:-20,bottom:0 }}>
              <defs>
                <linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.12}/>
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity={0.12}/>
                  <stop offset="100%" stopColor="var(--success)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="day" tick={CHART_STYLE.tick} axisLine={false} tickLine={false}/>
              <YAxis tick={CHART_STYLE.tick} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={CHART_STYLE.contentStyle}/>
              <Area type="monotone" dataKey="tasks" stroke="var(--brand)"    fill="url(#gt)" strokeWidth={1.5} name="Created"/>
              <Area type="monotone" dataKey="done"  stroke="var(--success)"  fill="url(#gd)" strokeWidth={1.5} name="Completed"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pending approvals */}
        <div className="card" style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13.5, fontWeight:600, color:'var(--text-primary)' }}>Pending Approvals</span>
            <button onClick={()=>navigate('/tasks')} className="btn btn-ghost btn-sm" style={{ gap:4, color:'var(--brand)' }}>
              View all <ArrowRight size={11}/>
            </button>
          </div>
          {pending.length===0
            ? <Empty icon={ThumbsUp} title="All caught up!" body="No tasks pending review"/>
            : <div className="divide-y" style={{ flex:1 }}>
                {pending.map(t=>(
                  <div key={t._id} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 16px', cursor:'pointer' }}
                    onClick={()=>navigate('/tasks')}>
                    <Avatar name={`${t.owner?.firstName} ${t.owner?.lastName}`} size="sm"/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12.5, fontWeight:500, color:'var(--text-primary)',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.title}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                        {t.owner?.firstName} {t.owner?.lastName}
                      </div>
                    </div>
                    <StatusBadge status={t.priority}/>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {/* Top performers */}
        <div className="card">
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13.5, fontWeight:600, color:'var(--text-primary)' }}>Top Performers</span>
            <button onClick={()=>navigate('/performance')} className="btn btn-ghost btn-sm" style={{ gap:4, color:'var(--brand)' }}>
              View all <ArrowRight size={11}/>
            </button>
          </div>
          {topPerf.length===0
            ? <Empty icon={TrendingUp} title="No data yet"/>
            : <div className="divide-y">
                {topPerf.map((u,i)=>(
                  <div key={u._id} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 16px' }}>
                    <span style={{ fontSize:13, width:22, textAlign:'center', flexShrink:0, color:i<3?'var(--warning)':'var(--text-muted)' }}>
                      {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                    </span>
                    <Avatar name={`${u.firstName} ${u.lastName}`} size="sm"/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12.5, fontWeight:500, color:'var(--text-primary)',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {u.firstName} {u.lastName}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.unitSector}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:'var(--brand)' }}>{u.totalScore}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)' }}>pts</div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Quick links */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text-primary)', marginBottom:14 }}>Quick Actions</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {[
              { label:'Create a new task',           path:'/tasks',       icon:CheckSquare },
              { label:'Review pending reports',       path:'/reports',     icon:FileText    },
              { label:'View performance leaderboard', path:'/performance', icon:Award       },
              { label:'Manage team members',          path:'/my-team',     icon:Users       },
              { label:'Create a project board',       path:'/projects',    icon:Target      },
            ].map(l=>(
              <button key={l.path} onClick={()=>navigate(l.path)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
                  borderRadius:'var(--radius)', border:'none', cursor:'pointer', background:'transparent',
                  textAlign:'left', fontFamily:'inherit', width:'100%', transition:'background 0.08s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-subtle)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ width:28,height:28,borderRadius:'var(--radius)',background:'var(--bg-subtle)',
                  display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:'1px solid var(--border)' }}>
                  <l.icon size={13} style={{ color:'var(--text-secondary)' }}/>
                </div>
                <span style={{ fontSize:13, color:'var(--text-primary)' }}>{l.label}</span>
                <ArrowRight size={12} style={{ color:'var(--text-muted)', marginLeft:'auto' }}/>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Org overview */}
      {isExecutive && overview && (
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text-primary)', marginBottom:14 }}>
            Organisation Overview
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(90px,1fr))', gap:8, marginBottom:16 }}>
            {[
              { l:'Users',      v:overview.totalUsers },
              { l:'Completion', v:`${overview.completionRate}%` },
              { l:'Overdue',    v:overview.overdueTasks },
              { l:'Goal Rate',  v:`${overview.goalCompletionRate}%` },
            ].map(s=>(
              <div key={s.l} style={{ textAlign:'center', padding:'10px 8px', borderRadius:'var(--radius)', background:'var(--bg-subtle)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>{s.v}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
          {overview.bySector?.length>0 && (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={overview.bySector.slice(0,8)} margin={{ top:0,right:0,left:-10,bottom:30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="sector" tick={CHART_STYLE.tick} angle={-30} textAnchor="end" interval={0}/>
                <YAxis tick={CHART_STYLE.tick} axisLine={false}/>
                <Tooltip contentStyle={CHART_STYLE.contentStyle}/>
                <Bar dataKey="completionRate" fill="var(--brand)" radius={[3,3,0,0]} name="Completion %"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}