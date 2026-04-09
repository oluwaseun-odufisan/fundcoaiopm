import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Modal, Confirm, Empty, SearchInput, Spinner, Field, Avatar, StatusBadge, TableSkel } from '../components/common'
import { adminService } from '../services/api'

export default function AdminsPage() {
  const [admins, setAdmins] = useState([])
  const [ld, setLd]         = useState(true)
  const [search, setSearch] = useState('')
  const [cOpen, setCOpen]   = useState(false)
  const [edit, setEdit]     = useState(null)
  const [del, setDel]       = useState(null)
  const [actLd, setActLd]   = useState(false)

  const fetch = useCallback(async () => {
    setLd(true)
    try { const { data } = await adminService.getAll(); setAdmins(data.admins||[]) }
    catch { toast.error('Failed') } finally { setLd(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const doToggle = async (a) => {
    try { await adminService.toggleStatus(a._id); toast.success('Status updated'); fetch() }
    catch(err) { toast.error(err.response?.data?.message||'Failed') }
  }

  const doDel = async () => {
    setActLd(true)
    try { await adminService.delete(del._id); toast.success('Admin deleted'); setDel(null); fetch() }
    catch(err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setActLd(false) }
  }

  const filtered = admins.filter(a=>`${a.firstName} ${a.lastName} ${a.email}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="page-header">
        <div><h1 className="page-title">Admin Accounts</h1><p className="page-sub">Super-admin only — manage all admin users</p></div>
        <button onClick={()=>setCOpen(true)} className="btn btn-primary"><Plus size={14}/> New Admin</button>
      </div>
      <div style={{ maxWidth:320 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search admins…"/>
      </div>
      <div className="card" style={{ overflow:'hidden' }}>
        {ld ? <TableSkel rows={5} cols={5}/> : (
          <table className="tbl">
            <thead><tr><th>Admin</th><th>Role</th><th>Status</th><th>Joined</th><th style={{ width:100 }}></th></tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={5}><Empty title="No admins found"/></td></tr>
                : filtered.map(a=>(
                    <tr key={a._id}>
                      <td><div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Avatar name={`${a.firstName} ${a.lastName}`} size="sm"/>
                        <div><div style={{ fontWeight:500, fontSize:13 }}>{a.firstName} {a.lastName}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{a.email}</div></div>
                      </div></td>
                      <td><StatusBadge status={a.role}/></td>
                      <td><StatusBadge status={a.isActive?'active':'inactive'}/></td>
                      <td><span style={{ fontSize:12, color:'var(--text-muted)' }}>{a.createdAt?format(new Date(a.createdAt),'MMM d, yyyy'):'—'}</span></td>
                      <td><div style={{ display:'flex', gap:4 }}>
                        <button onClick={()=>doToggle(a)} className="btn btn-ghost btn-sm btn-icon">
                          {a.isActive?<ToggleRight size={14} style={{ color:'var(--success)' }}/>:<ToggleLeft size={14}/>}
                        </button>
                        <button onClick={()=>setEdit(a)} className="btn btn-ghost btn-sm btn-icon"><Edit2 size={13}/></button>
                        <button onClick={()=>setDel(a)} className="btn btn-ghost btn-sm btn-icon" style={{ color:'var(--danger)' }}><Trash2 size={13}/></button>
                      </div></td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        )}
      </div>
      <AdminModal open={cOpen} onClose={()=>setCOpen(false)} onSuccess={()=>{fetch();setCOpen(false)}}/>
      {edit && <AdminModal open admin={edit} onClose={()=>setEdit(null)} onSuccess={()=>{fetch();setEdit(null)}}/>}
      <Confirm open={!!del} onClose={()=>setDel(null)} onConfirm={doDel}
        title="Delete Admin" message={`Delete ${del?.firstName} ${del?.lastName}?`} label="Delete" danger loading={actLd}/>
    </div>
  )
}

function AdminModal({ open, admin, onClose, onSuccess }) {
  const isEdit = !!admin
  const [f, setF] = useState({ firstName:admin?.firstName||'', lastName:admin?.lastName||'', email:admin?.email||'', password:'', role:admin?.role||'team-lead' })
  const [ld, setLd] = useState(false)
  const set = k => e => setF(p=>({...p,[k]:e.target.value}))
  const submit = async () => {
    if (!f.firstName||!f.email) return toast.error('Fill required fields')
    setLd(true)
    try {
      if (isEdit) await adminService.update(admin._id, f)
      else        await adminService.create(f)
      toast.success(isEdit?'Admin updated':'Admin created'); onSuccess()
    } catch(err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setLd(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title={isEdit?'Edit Admin':'New Admin'}
      footer={<><button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={ld}>
          {ld?<Spinner size={13}/>:isEdit?'Save':'Create'}
        </button></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="First Name" required><input className="inp" value={f.firstName} onChange={set('firstName')}/></Field>
          <Field label="Last Name"><input className="inp" value={f.lastName} onChange={set('lastName')}/></Field>
        </div>
        <Field label="Email" required><input type="email" className="inp" value={f.email} onChange={set('email')}/></Field>
        {!isEdit && <Field label="Password" required><input type="password" className="inp" value={f.password} onChange={set('password')}/></Field>}
        <Field label="Role">
          <select className="inp" value={f.role} onChange={set('role')}>
            <option value="team-lead">Team Lead</option>
            <option value="executive">Executive</option>
            <option value="super-admin">Super Admin</option>
          </select>
        </Field>
      </div>
    </Modal>
  )
}