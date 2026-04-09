import { useState, useEffect, useCallback } from 'react'
import { Video, Trash2, Square, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Modal, Confirm, Empty, Pagination, SearchInput, Spinner, StatusBadge, TableSkel } from '../components/common'
import { roomService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const LIMIT = 25

export default function RoomsPage() {
  const { isSuperAdmin } = useAuth()
  const [rooms, setRooms]   = useState([])
  const [ld, setLd]         = useState(true)
  const [page, setPage]     = useState(1)
  const [total, setTotal]   = useState(0)
  const [search, setSearch] = useState('')
  const [viewR, setViewR]   = useState(null)
  const [endR, setEndR]     = useState(null)
  const [delR, setDelR]     = useState(null)
  const [actLd, setActLd]   = useState(false)

  const fetch = useCallback(async () => {
    setLd(true)
    try { const { data } = await roomService.getAll({ page, limit:LIMIT, search }); setRooms(data.rooms||[]); setTotal(data.pagination?.total||0) }
    catch { toast.error('Failed') } finally { setLd(false) }
  }, [page, search])

  useEffect(() => { fetch() }, [fetch])

  const doEnd = async () => {
    setActLd(true)
    try { await roomService.forceEnd(endR._id); toast.success('Room ended'); setEndR(null); fetch() }
    catch(err) { toast.error(err.response?.data?.message||'Failed') } finally { setActLd(false) }
  }
  const doDel = async () => {
    setActLd(true)
    try { await roomService.delete(delR._id); toast.success('Room deleted'); setDelR(null); fetch() }
    catch(err) { toast.error(err.response?.data?.message||'Failed') } finally { setActLd(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="page-header"><div><h1 className="page-title">Meeting Rooms</h1><p className="page-sub">Monitor and manage video rooms</p></div></div>
      <div style={{ maxWidth:320 }}><SearchInput value={search} onChange={v=>{setSearch(v);setPage(1)}} placeholder="Search rooms…"/></div>
      <div className="card" style={{ overflow:'hidden' }}>
        {ld ? <TableSkel rows={6} cols={5}/> : (
          <>
            <table className="tbl">
              <thead><tr><th>Room</th><th>Host</th><th>Participants</th><th>Status</th><th>Created</th><th style={{ width:90 }}></th></tr></thead>
              <tbody>
                {rooms.length===0
                  ? <tr><td colSpan={6}><Empty icon={Video} title="No rooms found"/></td></tr>
                  : rooms.map(r=>(
                      <tr key={r._id}>
                        <td><div style={{ fontWeight:500, fontSize:13 }}>{r.name}</div><div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'monospace' }}>{r.roomId}</div></td>
                        <td><span style={{ fontSize:12, color:'var(--text-secondary)' }}>{r.host?.firstName} {r.host?.lastName}</span></td>
                        <td><span style={{ fontSize:12, color:'var(--text-secondary)' }}>{r.participants?.filter(p=>p.isActive).length||0} active</span></td>
                        <td><StatusBadge status={r.status}/></td>
                        <td><span style={{ fontSize:12, color:'var(--text-muted)' }}>{r.createdAt?format(new Date(r.createdAt),'MMM d, yyyy'):'—'}</span></td>
                        <td><div style={{ display:'flex', gap:3 }}>
                          <button onClick={()=>setViewR(r)} className="btn btn-ghost btn-sm btn-icon"><Eye size={13}/></button>
                          {r.status==='active' && <button onClick={()=>setEndR(r)} className="btn btn-ghost btn-sm btn-icon" style={{ color:'var(--warning)' }}><Square size={13}/></button>}
                          {isSuperAdmin && <button onClick={()=>setDelR(r)} className="btn btn-ghost btn-sm btn-icon" style={{ color:'var(--danger)' }}><Trash2 size={13}/></button>}
                        </div></td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
            <Pagination page={page} total={total} limit={LIMIT} onPage={setPage}/>
          </>
        )}
      </div>
      {viewR && (
        <Modal open onClose={()=>setViewR(null)} title={viewR.name} size="lg">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', gap:6 }}><StatusBadge status={viewR.status}/>{viewR.isLocked&&<span className="badge badge-yellow">Locked</span>}</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Room ID: <code style={{ fontFamily:'monospace' }}>{viewR.roomId}</code></div>
            {viewR.description && <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{viewR.description}</div>}
            <div style={{ fontSize:13, fontWeight:500 }}>Participants ({viewR.participants?.length||0})</div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {(viewR.participants||[]).map((p,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:p.isActive?'var(--success)':'var(--border)', flexShrink:0 }}/>
                  <span style={{ fontSize:13, color:'var(--text-primary)' }}>{p.user?.firstName} {p.user?.lastName}</span>
                  {!p.isActive && <span className="badge badge-gray">Left</span>}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
      <Confirm open={!!endR} onClose={()=>setEndR(null)} onConfirm={doEnd} title="Force End Room" message={`Force end "${endR?.name}"?`} label="End Room" danger loading={actLd}/>
      <Confirm open={!!delR} onClose={()=>setDelR(null)} onConfirm={doDel} title="Delete Room" message={`Delete "${delR?.name}"?`} label="Delete" danger loading={actLd}/>
    </div>
  )
}