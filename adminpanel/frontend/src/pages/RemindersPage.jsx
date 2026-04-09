import { useState, useEffect, useCallback } from 'react'
import { Bell, Plus, Trash2, Users, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  Modal, Confirm, Empty, Pagination, Select, Spinner, Field,
  StatusBadge, TableSkel, SearchInput
} from '../components/common'
import { reminderService, userService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const LIMIT = 25

export default function RemindersPage() {
  const { isSuperAdmin } = useAuth()
  const [reminders, setReminders] = useState([])
  const [stats, setStats]   = useState(null)
  const [ld, setLd]         = useState(true)
  const [page, setPage]     = useState(1)
  const [total, setTotal]   = useState(0)
  const [status, setStatus] = useState('')
  const [cOpen, setCOpen]   = useState(false)
  const [editR, setEditR]   = useState(null)
  const [bOpen, setBOpen]   = useState(false)
  const [del, setDel]       = useState(null)
  const [actLd, setActLd]   = useState(false)

  const fetch = useCallback(async () => {
    setLd(true)
    try {
      const p = { page, limit:LIMIT }
      if (status) p.status = status
      const { data } = await reminderService.getAll(p)
      setReminders(data.reminders||[])
      setTotal(data.pagination?.total||0)
    } catch { toast.error('Failed') }
    finally { setLd(false) }
  }, [page, status])

  useEffect(() => { fetch() }, [fetch])
  useEffect(() => {
    reminderService.getStats().then(({data})=>setStats(data.stats)).catch(()=>{})
  }, [])

  const doDel = async () => {
    setActLd(true)
    try {
      await reminderService.delete(del._id)
      toast.success('Deleted'); setDel(null); fetch()
    } catch { toast.error('Failed') }
    finally { setActLd(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="page-sub">Create and manage reminders for your team</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setBOpen(true)} className="btn btn-secondary">
            <Users size={14}/> Bulk Create
          </button>
          <button onClick={()=>setCOpen(true)} className="btn btn-primary">
            <Plus size={14}/> New Reminder
          </button>
        </div>
      </div>

      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(90px,1fr))', gap:8 }}>
          {[
            { l:'Total',     v:stats.total,     c:'var(--text-primary)' },
            { l:'Pending',   v:stats.pending,   c:'var(--warning)' },
            { l:'Sent',      v:stats.sent,      c:'var(--success)' },
            { l:'Snoozed',   v:stats.snoozed,   c:'var(--brand)' },
            { l:'Dismissed', v:stats.dismissed, c:'var(--text-muted)' },
          ].map(s=>(
            <div key={s.l} className="card" style={{ padding:'12px 16px' }}>
              <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{s.v??0}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ maxWidth:180 }}>
        <Select value={status} onChange={v=>{setStatus(v);setPage(1)}} placeholder="All Statuses"
          options={[{value:'pending',label:'Pending'},{value:'sent',label:'Sent'},{value:'snoozed',label:'Snoozed'},{value:'dismissed',label:'Dismissed'}]}/>
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        {ld ? <TableSkel rows={8} cols={5}/> : (
          <>
            <table className="tbl">
              <thead>
                <tr><th>Message</th><th>User</th><th>Type</th><th>Scheduled</th><th>Status</th><th style={{ width:80 }}></th></tr>
              </thead>
              <tbody>
                {reminders.length===0
                  ? <tr><td colSpan={6}><Empty icon={Bell} title="No reminders found"/></td></tr>
                  : reminders.map(r=>(
                      <tr key={r._id}>
                        <td>
                          <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)',
                            maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {r.message}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>
                            {r.user?.firstName} {r.user?.lastName}
                          </div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.user?.email}</div>
                        </td>
                        <td>
                          <span className="badge badge-blue" style={{ textTransform:'capitalize' }}>
                            {r.type?.replace(/_/g,' ')}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize:12, color:'var(--text-secondary)' }}>
                            {r.remindAt ? format(new Date(r.remindAt),'MMM d, yyyy · h:mm a') : '—'}
                          </span>
                        </td>
                        <td><StatusBadge status={r.status}/></td>
                        <td>
                          <div style={{ display:'flex', gap:4 }}>
                            <button onClick={()=>setEditR(r)} className="btn btn-ghost btn-sm btn-icon"><Edit2 size={13}/></button>
                            {isSuperAdmin && <button onClick={()=>setDel(r)} className="btn btn-ghost btn-sm btn-icon" style={{ color:'var(--danger)' }}><Trash2 size={13}/></button>}
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

      <ReminderModal open={cOpen} onClose={()=>setCOpen(false)} onSuccess={()=>{fetch();setCOpen(false)}}/>
      {editR && <ReminderModal open reminder={editR} onClose={()=>setEditR(null)} onSuccess={()=>{fetch();setEditR(null)}}/>}
      <BulkModal open={bOpen} onClose={()=>setBOpen(false)} onSuccess={()=>{fetch();setBOpen(false)}}/>
      <Confirm open={!!del} onClose={()=>setDel(null)} onConfirm={doDel}
        title="Delete Reminder" message="Delete this reminder?" label="Delete" danger loading={actLd}/>
    </div>
  )
}

function ReminderModal({ open, reminder, onClose, onSuccess }) {
  const isEdit = !!reminder
  const [users, setUsers] = useState([])
  const [f, setF] = useState({
    userId:    reminder?.user?._id||'',
    type:      reminder?.type||'custom',
    message:   reminder?.message||'',
    remindAt:  reminder?.remindAt ? new Date(reminder.remindAt).toISOString().slice(0,16) : '',
    deliveryChannels: reminder?.deliveryChannels||{ inApp:true, email:true, push:false },
  })
  const [ld, setLd] = useState(false)
  const set = k => e => setF(p=>({...p,[k]:e.target.value}))

  useEffect(() => {
    userService.getAll({ limit:200 }).then(({data})=>setUsers(data.users||[])).catch(()=>{})
  }, [])

  const submit = async () => {
    if (!f.userId || !f.message || !f.remindAt) return toast.error('Fill all required fields')
    setLd(true)
    try {
      if (isEdit) await reminderService.update(reminder._id, f)
      else        await reminderService.create(f)
      toast.success(isEdit?'Reminder updated':'Reminder created')
      onSuccess()
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setLd(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit?'Edit Reminder':'Create Reminder'}
      footer={<><button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={ld}>
          {ld?<Spinner size={13}/>:<><Bell size={12}/> {isEdit?'Save':'Create'}</>}
        </button></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
        <Field label="User" required>
          <select className="inp" value={f.userId} onChange={set('userId')}>
            <option value="">Select user…</option>
            {users.map(u=><option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.email})</option>)}
          </select>
        </Field>
        <Field label="Type">
          <select className="inp" value={f.type} onChange={set('type')}>
            <option value="task_due">Task Due</option>
            <option value="meeting">Meeting</option>
            <option value="goal_deadline">Goal Deadline</option>
            <option value="custom">Custom</option>
          </select>
        </Field>
        <Field label="Message" required>
          <input className="inp" value={f.message} onChange={set('message')} placeholder="Reminder message…"/>
        </Field>
        <Field label="Remind At" required>
          <input type="datetime-local" className="inp" value={f.remindAt} onChange={set('remindAt')}/>
        </Field>
        <Field label="Delivery Channels">
          <div style={{ display:'flex', gap:16, marginTop:2 }}>
            {[['inApp','In-App'],['email','Email'],['push','Push']].map(([k,l])=>(
              <label key={k} style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, cursor:'pointer', color:'var(--text-secondary)' }}>
                <input type="checkbox" checked={f.deliveryChannels[k]}
                  onChange={e=>setF(p=>({...p,deliveryChannels:{...p.deliveryChannels,[k]:e.target.checked}}))}/>
                {l}
              </label>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  )
}

function BulkModal({ open, onClose, onSuccess }) {
  const [users, setUsers]   = useState([])
  const [selected, setSelected] = useState([])
  const [f, setF]           = useState({ type:'custom', message:'', remindAt:'' })
  const [ld, setLd]         = useState(false)

  useEffect(() => {
    if (open) userService.getAll({ limit:200 }).then(({data})=>setUsers(data.users||[])).catch(()=>{})
  }, [open])

  const toggle = id => setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])

  const submit = async () => {
    if (!selected.length || !f.message || !f.remindAt) return toast.error('Fill all required fields')
    setLd(true)
    try {
      const { data } = await reminderService.bulkCreate({ ...f, userIds:selected })
      toast.success(data.message||`${selected.length} reminders created`)
      onSuccess()
    } catch (err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setLd(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Bulk Create Reminders" size="lg"
      footer={<><button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={ld}>
          {ld?<Spinner size={13}/>:<><Users size={12}/> Create for {selected.length} users</>}
        </button></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Message" required>
            <input className="inp" value={f.message} onChange={e=>setF(p=>({...p,message:e.target.value}))} placeholder="Reminder message…"/>
          </Field>
          <Field label="Remind At" required>
            <input type="datetime-local" className="inp" value={f.remindAt} onChange={e=>setF(p=>({...p,remindAt:e.target.value}))}/>
          </Field>
        </div>
        <Field label={`Select Users (${selected.length} selected)`}>
          <div style={{ border:'1px solid var(--border)', borderRadius:'var(--radius-md)', maxHeight:200, overflowY:'auto' }}>
            <div style={{ padding:'6px 8px', borderBottom:'1px solid var(--border)', display:'flex', gap:6 }}>
              <button onClick={()=>setSelected(users.map(u=>u._id))} className="btn btn-secondary btn-sm">Select All</button>
              <button onClick={()=>setSelected([])} className="btn btn-secondary btn-sm">Clear</button>
            </div>
            {users.map(u=>{
              const sel=selected.includes(u._id)
              return (
                <div key={u._id} onClick={()=>toggle(u._id)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', cursor:'pointer',
                    background:sel?'var(--bg-selected)':'transparent', borderBottom:'1px solid var(--border)', transition:'background 0.08s' }}>
                  <input type="checkbox" checked={sel} readOnly/>
                  <span style={{ fontSize:13, color:'var(--text-primary)' }}>{u.firstName} {u.lastName}</span>
                  <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:'auto' }}>{u.unitSector||u.role}</span>
                </div>
              )
            })}
          </div>
        </Field>
      </div>
    </Modal>
  )
}