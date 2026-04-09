import { useState, useEffect } from 'react'
import { TrendingUp, Award, Users, RefreshCw, Trophy, Star, Gift } from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar, Badge, Modal, Field, Spinner, Empty } from '../components/common'
import { performanceService, userService } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function PerformancePage() {
  const { isSuperAdmin } = useAuth()
  const [lb, setLb]       = useState({ top3:[], rest:[] })
  const [overview, setOv] = useState(null)
  const [ld, setLd]       = useState(true)
  const [bonusOpen, setBonusOpen] = useState(false)
  const [bonusUser, setBonusUser] = useState(null)

  const fetchAll = async () => {
    setLd(true)
    try {
      const [lbRes, ovRes] = await Promise.allSettled([
        performanceService.getLeaderboard(),
        performanceService.getOverview(),
      ])
      if (lbRes.status==='fulfilled') setLb(lbRes.value.data.leaderboard||{top3:[],rest:[]})
      if (ovRes.status==='fulfilled') setOv(ovRes.value.data.overview)
    } catch { toast.error('Failed to load') }
    finally { setLd(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const RANK_MEDALS = ['🥇','🥈','🥉']

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance</h1>
          <p className="page-sub">Team leaderboard, scoring, and bonus awards</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {isSuperAdmin && (
            <button onClick={()=>setBonusOpen(true)} className="btn btn-secondary">
              <Gift size={14}/> Award Bonus
            </button>
          )}
          <button onClick={fetchAll} className="btn btn-secondary"><RefreshCw size={13}/> Refresh</button>
        </div>
      </div>

      {/* Overview stats */}
      {overview && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:8 }}>
          {[
            { l:'Users',      v:overview.totalUsers,      c:'var(--brand)' },
            { l:'Completion', v:`${overview.completionRate??0}%`, c:'var(--success)' },
            { l:'Overdue',    v:overview.overdueTasks??0, c:'var(--danger)' },
            { l:'Goal Rate',  v:`${overview.goalCompletionRate??0}%`, c:'var(--warning)' },
          ].map(s=>(
            <div key={s.l} className="card" style={{ padding:'12px 16px' }}>
              <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Top 3 */}
      {lb.top3?.length>0 && (
        <div>
          <div className="section-title" style={{ marginBottom:10 }}>Top Performers</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10 }}>
            {lb.top3.map((p,i)=>(
              <div key={p._id} className="card" style={{ padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:22 }}>{RANK_MEDALS[i]}</span>
                  <Avatar name={`${p.firstName} ${p.lastName}`} size="lg"/>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>
                      {p.firstName} {p.lastName}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.level||p.unitSector}</div>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:24, fontWeight:700, color:'var(--brand)' }}>{p.totalScore}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>pts</div>
                </div>
                <div style={{ marginTop:8 }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:3 }}>
                    {p.completionRate??0}% complete
                  </div>
                  <div className="prog-track">
                    <div className="prog-fill" style={{ width:`${p.completionRate??0}%` }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full leaderboard table */}
      {ld ? (
        <div className="card" style={{ padding:32, textAlign:'center' }}>
          <Spinner size={24}/>
        </div>
      ) : (
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', gap:8 }}>
            <Trophy size={14} style={{ color:'var(--warning)' }}/>
            <span style={{ fontWeight:600, fontSize:13.5, color:'var(--text-primary)' }}>Full Leaderboard</span>
          </div>
          {[...(lb.top3||[]), ...(lb.rest||[])].length===0
            ? <Empty icon={TrendingUp} title="No performance data" body="Data will appear as users complete tasks and goals"/>
            : <table className="tbl">
                <thead>
                  <tr><th>#</th><th>User</th><th>Level</th><th>Score</th><th>Completion</th><th>Tasks</th><th>Goals</th></tr>
                </thead>
                <tbody>
                  {[...(lb.top3||[]), ...(lb.rest||[])].map((u,i)=>(
                    <tr key={u._id}>
                      <td>
                        <span style={{ fontSize:16 }}>{i<3?RANK_MEDALS[i]:`#${i+1}`}</span>
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <Avatar name={`${u.firstName} ${u.lastName}`} size="sm"/>
                          <div>
                            <div style={{ fontWeight:500, fontSize:13 }}>{u.firstName} {u.lastName}</div>
                            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.unitSector}</div>
                          </div>
                        </div>
                      </td>
                      <td><Badge color="blue">{u.level||'Beginner'}</Badge></td>
                      <td><span style={{ fontWeight:700, color:'var(--brand)' }}>{u.totalScore}</span></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:100 }}>
                          <div className="prog-track" style={{ flex:1 }}>
                            <div className="prog-fill" style={{ width:`${u.completionRate??0}%` }}/>
                          </div>
                          <span style={{ fontSize:11, color:'var(--text-muted)', width:32 }}>{u.completionRate??0}%</span>
                        </div>
                      </td>
                      <td><span style={{ fontSize:12, color:'var(--text-secondary)' }}>{u.taskPoints??0}</span></td>
                      <td><span style={{ fontSize:12, color:'var(--text-secondary)' }}>{u.goalPoints??0}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}

      {/* Bonus modal */}
      <BonusModal open={bonusOpen} onClose={()=>setBonusOpen(false)} preUser={bonusUser}/>
    </div>
  )
}

function BonusModal({ open, onClose, preUser }) {
  const [users, setUsers] = useState([])
  const [f, setF]         = useState({ userId:'', amount:'', note:'' })
  const [ld, setLd]       = useState(false)

  useEffect(() => {
    if (open) userService.getAll({ limit:200 }).then(({data})=>setUsers(data.users||[])).catch(()=>{})
  }, [open])

  const submit = async () => {
    if (!f.userId||!f.amount) return toast.error('Fill all fields')
    setLd(true)
    try {
      await performanceService.awardBonus(f)
      toast.success('Bonus awarded!')
      onClose()
    } catch(err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setLd(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Award Bonus"
      footer={<><button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={ld}>
          {ld?<Spinner size={13}/>:<><Gift size={12}/> Award</>}
        </button></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Field label="User">
          <select className="inp" value={f.userId} onChange={e=>setF(p=>({...p,userId:e.target.value}))}>
            <option value="">Select user…</option>
            {users.map(u=><option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
          </select>
        </Field>
        <Field label="Bonus Amount">
          <input type="number" className="inp" value={f.amount} onChange={e=>setF(p=>({...p,amount:e.target.value}))} placeholder="e.g. 5000"/>
        </Field>
        <Field label="Note">
          <input className="inp" value={f.note} onChange={e=>setF(p=>({...p,note:e.target.value}))} placeholder="Reason for bonus…"/>
        </Field>
      </div>
    </Modal>
  )
}