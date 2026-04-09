import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, MoreVertical, Shield, RefreshCw, Key, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  Modal, Confirm, Empty, Pagination, SearchInput, Select, Spinner,
  Field, Avatar, StatusBadge, TableSkel
} from '../components/common'
import { userService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const LIMIT = 25

export default function UsersPage() {
  const { isSuperAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [ld, setLd]       = useState(true)
  const [page, setPage]   = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('')
  const [role, setRole]   = useState('')
  const [cOpen, setCOpen] = useState(false)
  const [edit, setEdit]   = useState(null)
  const [del, setDel]     = useState(null)
  const [resetPw, setResetPw] = useState(null)
  const [logsUser, setLogsUser] = useState(null)
  const [logs, setLogs]   = useState([])
  const [actLd, setActLd] = useState(false)

  const fetch = useCallback(async () => {
    setLd(true)
    try {
      const p = { page, limit:LIMIT }
      if (search) p.search = search
      if (sector) p.sector = sector
      if (role)   p.role   = role
      const { data } = await userService.getAll(p)
      setUsers(data.users||[]); setTotal(data.pagination?.total||0)
    } catch { toast.error('Failed') }
    finally { setLd(false) }
  }, [page, search, sector, role])

  useEffect(() => { fetch() }, [fetch])

  const doToggle = async (u) => {
    try {
      await userService.toggleStatus(u._id)
      toast.success(u.isActive?'User deactivated':'User activated')
      fetch()
    } catch(err) { toast.error(err.response?.data?.message||'Failed') }
  }

  const doDel = async () => {
    setActLd(true)
    try {
      await userService.delete(del._id)
      toast.success('User deleted'); setDel(null); fetch()
    } catch(err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setActLd(false) }
  }

  const openLogs = async (u) => {
    setLogsUser(u); setLogs([])
    try {
      const { data } = await userService.getLogs(u._id)
      setLogs(data.activities||[])
    } catch {}
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-sub">Manage user accounts, roles, and activity</p>
        </div>
        <button onClick={()=>setCOpen(true)} className="btn btn-primary"><Plus size={14}/> New User</button>
      </div>

      <div className="filter-row">
        <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1)}} placeholder="Search users…" style={{ flex:1, minWidth:200 }}/>
        <Select value={role} onChange={v=>{setRole(v);setPage(1)}} placeholder="All Roles"
          options={[{value:'standard',label:'Standard'},{value:'team-lead',label:'Team Lead'},{value:'executive',label:'Executive'}]}
          style={{ width:140 }}/>
        <button onClick={()=>{setSearch('');setSector('');setRole('');setPage(1)}} className="btn btn-secondary btn-sm">Clear</button>
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        {ld ? <TableSkel rows={8} cols={6}/> : (
          <>
            <table className="tbl">
              <thead>
                <tr><th>User</th><th>Role</th><th>Sector</th><th>Status</th><th>Joined</th><th style={{ width:100 }}></th></tr>
              </thead>
              <tbody>
                {users.length===0
                  ? <tr><td colSpan={6}><Empty title="No users found"/></td></tr>
                  : users.map(u=>(
                      <tr key={u._id}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                            <Avatar name={`${u.firstName} ${u.lastName}`} size="sm"/>
                            <div>
                              <div style={{ fontWeight:500, fontSize:13 }}>{u.firstName} {u.lastName}</div>
                              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><StatusBadge status={u.role}/></td>
                        <td><span style={{ fontSize:12, color:'var(--text-secondary)' }}>{u.unitSector||'—'}</span></td>
                        <td><StatusBadge status={u.isActive?'active':'inactive'}/></td>
                        <td><span style={{ fontSize:12, color:'var(--text-muted)' }}>{u.createdAt?format(new Date(u.createdAt),'MMM d, yyyy'):'—'}</span></td>
                        <td>
                          <div style={{ display:'flex', gap:4 }}>
                            <button onClick={()=>openLogs(u)} className="btn btn-ghost btn-sm btn-icon" title="Activity"><Activity size={13}/></button>
                            <button onClick={()=>setResetPw(u)} className="btn btn-ghost btn-sm btn-icon" title="Reset password"><Key size={13}/></button>
                            <button onClick={()=>setEdit(u)} className="btn btn-ghost btn-sm btn-icon"><Edit2 size={13}/></button>
                            {isSuperAdmin && <button onClick={()=>setDel(u)} className="btn btn-ghost btn-sm btn-icon" style={{ color:'var(--danger)' }}><Trash2 size={13}/></button>}
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

      <UserModal open={cOpen} onClose={()=>setCOpen(false)} onSuccess={()=>{fetch();setCOpen(false)}}/>
      {edit && <UserModal open user={edit} onClose={()=>setEdit(null)} onSuccess={()=>{fetch();setEdit(null)}}/>}
      {resetPw && <ResetPwModal user={resetPw} onClose={()=>setResetPw(null)}/>}
      {logsUser && (
        <Modal open onClose={()=>setLogsUser(null)} title={`Activity — ${logsUser.firstName} ${logsUser.lastName}`} size="lg">
          {logs.length===0
            ? <p style={{ fontSize:13, color:'var(--text-muted)', padding:'12px 0' }}>No activity recorded</p>
            : <div className="divide-y">
                {logs.map((l,i)=>(
                  <div key={i} style={{ padding:'8px 0', display:'flex', gap:10, alignItems:'flex-start' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:'var(--text-primary)' }}>{l.action||l.description}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                        {l.createdAt?format(new Date(l.createdAt),'MMM d, yyyy · h:mm a'):'—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </Modal>
      )}
      <Confirm open={!!del} onClose={()=>setDel(null)} onConfirm={doDel}
        title="Delete User" message={`Delete ${del?.firstName} ${del?.lastName}? This cannot be undone.`}
        label="Delete" danger loading={actLd}/>
    </div>
  )
}

function UserModal({ open, user, onClose, onSuccess }) {
  const isEdit = !!user
  const [f, setF] = useState({
    firstName: user?.firstName||'', lastName:user?.lastName||'',
    email:user?.email||'', password:'', role:user?.role||'standard',
    unitSector:user?.unitSector||'', phone:user?.phone||'',
  })
  const [ld, setLd] = useState(false)
  const set = k => e => setF(p=>({...p,[k]:e.target.value}))

  const submit = async () => {
    if (!f.firstName||!f.lastName||!f.email) return toast.error('Fill required fields')
    if (!isEdit && !f.password) return toast.error('Password required')
    setLd(true)
    try {
      if (isEdit) await userService.update(user._id, f)
      else        await userService.create(f)
      toast.success(isEdit?'User updated':'User created')
      onSuccess()
    } catch(err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setLd(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit?'Edit User':'New User'} size="lg"
      footer={<><button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={ld}>
          {ld?<Spinner size={13}/>:isEdit?'Save Changes':'Create User'}
        </button></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="First Name" required><input className="inp" value={f.firstName} onChange={set('firstName')}/></Field>
          <Field label="Last Name" required><input className="inp" value={f.lastName} onChange={set('lastName')}/></Field>
        </div>
        <Field label="Email" required><input type="email" className="inp" value={f.email} onChange={set('email')}/></Field>
        {!isEdit && <Field label="Password" required><input type="password" className="inp" value={f.password} onChange={set('password')}/></Field>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Role">
            <select className="inp" value={f.role} onChange={set('role')}>
              <option value="standard">Standard</option>
              <option value="team-lead">Team Lead</option>
              <option value="executive">Executive</option>
            </select>
          </Field>
          <Field label="Sector / Department"><input className="inp" value={f.unitSector} onChange={set('unitSector')} placeholder="e.g. EML"/></Field>
        </div>
        <Field label="Phone"><input className="inp" value={f.phone} onChange={set('phone')} placeholder="+234 801 234 5678"/></Field>
      </div>
    </Modal>
  )
}

function ResetPwModal({ user, onClose }) {
  const [pw, setPw] = useState('')
  const [ld, setLd] = useState(false)
  const submit = async () => {
    if (!pw) return toast.error('Enter new password')
    setLd(true)
    try {
      await userService.resetPassword(user._id, { newPassword:pw })
      toast.success('Password reset'); onClose()
    } catch(err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setLd(false) }
  }
  return (
    <Modal open onClose={onClose} title={`Reset Password — ${user.firstName}`}
      footer={<><button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={ld}>
          {ld?<Spinner size={13}/>:<><Key size={12}/> Reset</>}
        </button></>}>
      <Field label="New Password">
        <input type="password" className="inp" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Enter new password…"/>
      </Field>
    </Modal>
  )
}