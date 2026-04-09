import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Pin, EyeOff, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Modal, Empty, Pagination, SearchInput, Spinner, Field, StatusBadge, TableSkel } from '../components/common'
import { postService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const LIMIT = 25

export default function PostsPage() {
  const { isExecutive } = useAuth()
  const [posts, setPosts]   = useState([])
  const [ld, setLd]         = useState(true)
  const [page, setPage]     = useState(1)
  const [total, setTotal]   = useState(0)
  const [search, setSearch] = useState('')
  const [annOpen, setAnnOpen] = useState(false)
  const [actLd, setActLd]   = useState(false)

  const fetch = useCallback(async () => {
    setLd(true)
    try {
      const { data } = await postService.getAll({ page, limit:LIMIT, search })
      setPosts(data.posts||[]); setTotal(data.pagination?.total||0)
    } catch { toast.error('Failed') } finally { setLd(false) }
  }, [page, search])

  useEffect(() => { fetch() }, [fetch])

  const doHide = async (p) => {
    try { await postService.hide(p._id, { hidden:!p.hidden }); toast.success(p.hidden?'Post restored':'Post hidden'); fetch() }
    catch(err) { toast.error(err.response?.data?.message||'Failed') }
  }
  const doPin = async (p) => {
    try { await postService.pin(p._id); toast.success(p.isPinned?'Unpinned':'Pinned'); fetch() }
    catch(err) { toast.error(err.response?.data?.message||'Failed') }
  }
  const doDel = async (p) => {
    if (!confirm(`Delete this post?`)) return
    try { await postService.delete(p._id); toast.success('Post deleted'); fetch() }
    catch(err) { toast.error(err.response?.data?.message||'Failed') }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div className="page-header">
        <div><h1 className="page-title">Social Feed</h1><p className="page-sub">Moderate posts and publish announcements</p></div>
        {isExecutive && <button onClick={()=>setAnnOpen(true)} className="btn btn-primary"><Plus size={14}/> Announcement</button>}
      </div>
      <div style={{ maxWidth:320 }}>
        <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1)}} placeholder="Search posts…"/>
      </div>
      <div className="card" style={{ overflow:'hidden' }}>
        {ld ? <TableSkel rows={8} cols={5}/> : (
          <>
            <table className="tbl">
              <thead><tr><th>Post</th><th>Author</th><th>Date</th><th>Status</th><th style={{ width:110 }}></th></tr></thead>
              <tbody>
                {posts.length===0
                  ? <tr><td colSpan={5}><Empty icon={MessageSquare} title="No posts found"/></td></tr>
                  : posts.map(p=>(
                      <tr key={p._id}>
                        <td><div style={{ fontSize:13, maxWidth:320, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.content||p.text}</div></td>
                        <td><span style={{ fontSize:12, color:'var(--text-secondary)' }}>{p.user?.firstName} {p.user?.lastName}</span></td>
                        <td><span style={{ fontSize:12, color:'var(--text-muted)' }}>{p.createdAt?format(new Date(p.createdAt),'MMM d, yyyy'):'—'}</span></td>
                        <td><div style={{ display:'flex', gap:4 }}>{p.isPinned&&<span className="badge badge-blue">Pinned</span>}{p.hidden&&<span className="badge badge-red">Hidden</span>}</div></td>
                        <td><div style={{ display:'flex', gap:3 }}>
                          <button onClick={()=>doPin(p)} className="btn btn-ghost btn-sm btn-icon" title="Pin"><Pin size={13}/></button>
                          <button onClick={()=>doHide(p)} className="btn btn-ghost btn-sm btn-icon" title="Hide/Show"><EyeOff size={13}/></button>
                          <button onClick={()=>doDel(p)} className="btn btn-ghost btn-sm btn-icon" style={{ color:'var(--danger)' }} title="Delete"><Trash2 size={13}/></button>
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
      {annOpen && <AnnouncementModal onClose={()=>setAnnOpen(false)} onSuccess={()=>{fetch();setAnnOpen(false)}}/>}
    </div>
  )
}

function AnnouncementModal({ onClose, onSuccess }) {
  const [f, setF] = useState({ content:'', isPinned:true })
  const [ld, setLd] = useState(false)
  const submit = async () => {
    if (!f.content.trim()) return toast.error('Content required')
    setLd(true)
    try { await postService.announce(f); toast.success('Announcement published'); onSuccess() }
    catch(err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setLd(false) }
  }
  return (
    <Modal open onClose={onClose} title="New Announcement"
      footer={<><button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={ld}>
          {ld?<Spinner size={13}/>:'Publish'}
        </button></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Field label="Message">
          <textarea className="inp" style={{ height:100 }} value={f.content} onChange={e=>setF(p=>({...p,content:e.target.value}))} placeholder="Write your announcement…"/>
        </Field>
        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer', color:'var(--text-secondary)' }}>
          <input type="checkbox" checked={f.isPinned} onChange={e=>setF(p=>({...p,isPinned:e.target.checked}))} style={{ accentColor:'var(--brand)' }}/>
          Pin to top of feed
        </label>
      </div>
    </Modal>
  )
}