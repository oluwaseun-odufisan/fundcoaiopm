import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Search, AlertTriangle } from 'lucide-react'

/* Avatar — flat color based on initials */
const AVATAR_COLORS = ['av-a','av-b','av-c','av-d','av-e','av-f']
function avatarColor(name='') {
  let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))&0xFFFF
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export function Spinner({ size=18 }) {
  return <div className="spinner" style={{ width:size, height:size }}/>
}

export function Avatar({ name='', size='md' }) {
  const cls = { xs:'av av-xs', sm:'av av-sm', md:'av av-md', lg:'av av-lg', xl:'av av-xl' }[size]||'av av-md'
  const ini = name.trim().split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase()||'?'
  return <span className={`${cls} ${avatarColor(name)}`}>{ini}</span>
}

export function Badge({ children, color='gray' }) {
  return <span className={`badge badge-${color}`}>{children}</span>
}

const STATUS_MAP = {
  active:'green', inactive:'red', approved:'green', rejected:'red',
  submitted:'cyan', draft:'gray', not_submitted:'gray', completed:'green',
  pending:'yellow', 'team-lead':'blue', executive:'purple', 'super-admin':'cyan',
  standard:'gray', Low:'green', Medium:'yellow', High:'red',
  ended:'gray', waiting:'yellow', snoozed:'orange', dismissed:'gray', sent:'green',
  beginner:'green', intermediate:'yellow', expert:'purple',
  open:'blue', 'in-progress':'yellow', done:'green',
}
const STATUS_LABEL = {
  active:'Active', inactive:'Inactive', approved:'Approved', rejected:'Rejected',
  submitted:'Submitted', draft:'Draft', not_submitted:'Not Submitted', completed:'Completed',
  pending:'Pending', 'team-lead':'Team Lead', executive:'Executive', 'super-admin':'Super Admin',
  standard:'Standard', Low:'Low', Medium:'Medium', High:'High',
  ended:'Ended', waiting:'Waiting', snoozed:'Snoozed', dismissed:'Dismissed', sent:'Sent',
  beginner:'Beginner', intermediate:'Intermediate', expert:'Expert',
  open:'Open', 'in-progress':'In Progress', done:'Done',
}
export function StatusBadge({ status }) {
  return <span className={`badge badge-${STATUS_MAP[status]||'gray'}`}>{STATUS_LABEL[status]||status||'—'}</span>
}

export function ProgressBar({ value=0, max=100, color }) {
  const pct = Math.min(100, Math.max(0, max ? (value/max)*100 : 0))
  const cls = color==='green'?'green':color==='orange'?'orange':color==='red'?'red':''
  return (
    <div className="prog-track">
      <div className={`prog-fill${cls?' '+cls:''}`} style={{ width:`${pct}%` }}/>
    </div>
  )
}

export function StatCard({ label, value, icon:Icon, color='var(--brand)', sub, trend }) {
  return (
    <div className="stat-card">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span className="section-title" style={{ marginBottom:0 }}>{label}</span>
        {Icon && <div style={{ width:28,height:28,borderRadius:'var(--radius)',background:'var(--bg-subtle)',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon size={14} style={{ color:'var(--text-muted)' }}/></div>}
      </div>
      <div style={{ fontSize:26,fontWeight:700,color,lineHeight:1 }}>{value??'—'}</div>
      {(sub||trend!=null) && (
        <div style={{ fontSize:12,color:'var(--text-muted)',display:'flex',gap:8 }}>
          {sub && <span>{sub}</span>}
          {trend!=null && <span style={{ color:trend>=0?'var(--success)':'var(--danger)',fontWeight:500 }}>{trend>=0?'+':''}{trend}%</span>}
        </div>
      )}
    </div>
  )
}

export function Modal({ open, onClose, title, children, size='md', footer }) {
  if (!open) return null
  const w = { sm:380, md:520, lg:680, xl:860 }[size]||520
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:w }}>
        <div className="modal-header">
          <span style={{ fontSize:14,fontWeight:600,color:'var(--text-primary)' }}>{title}</span>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function Confirm({ open, onClose, onConfirm, title, message, label='Confirm', danger, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>Cancel</button>
        <button className={`btn btn-sm ${danger?'btn-danger':'btn-primary'}`} onClick={onConfirm} disabled={loading}>
          {loading?<Spinner size={13}/>:label}
        </button>
      </>}>
      <div style={{ display:'flex',gap:12,alignItems:'flex-start' }}>
        {danger && <AlertTriangle size={18} style={{ color:'var(--warning)',flexShrink:0,marginTop:1 }}/>}
        <p style={{ fontSize:13,color:'var(--text-secondary)',lineHeight:1.6 }}>{message}</p>
      </div>
    </Modal>
  )
}

export function TableSkel({ rows=5, cols=5 }) {
  return (
    <div style={{ padding:14 }}>
      {/* header row */}
      <div style={{ display:'flex',gap:8,marginBottom:8,padding:'0 0 8px',borderBottom:'1px solid var(--border)' }}>
        {Array.from({length:cols}).map((_,j)=>(
          <div key={j} className="skeleton" style={{ flex:1,height:18,borderRadius:'var(--radius)' }}/>
        ))}
      </div>
      {/* body rows */}
      {Array.from({length:rows}).map((_,i)=>(
        <div key={i} style={{ display:'flex',gap:8,marginBottom:6,padding:'5px 0' }}>
          {Array.from({length:cols}).map((__,j)=>(
            <div key={j} className="skeleton" style={{ flex:1,height:24,borderRadius:'var(--radius)' }}/>
          ))}
        </div>
      ))}
    </div>
  )
}

export function Empty({ icon:Icon, title, body, action }) {
  return (
    <div className="empty-state">
      {Icon && <div className="empty-icon"><Icon size={18} style={{ color:'var(--text-muted)' }}/></div>}
      <span style={{ fontSize:13,fontWeight:500,color:'var(--text-secondary)' }}>{title}</span>
      {body && <span style={{ fontSize:12,color:'var(--text-muted)',maxWidth:280 }}>{body}</span>}
      {action}
    </div>
  )
}

export function Pagination({ page, total, limit, onPage }) {
  const pages = Math.ceil(total/limit)
  if (pages<=1) return null
  const pageNums = []
  for (let i=1;i<=pages;i++) {
    if(i===1||i===pages||Math.abs(i-page)<=1) pageNums.push(i)
    else if(Math.abs(i-page)===2) pageNums.push('…'+i)
  }
  // deduplicate ellipsis
  const nums = [...new Set(pageNums.map(String))]
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',borderTop:'1px solid var(--border)' }}>
      <span style={{ fontSize:12,color:'var(--text-muted)' }}>
        {Math.min((page-1)*limit+1, total)}–{Math.min(page*limit,total)} of {total}
      </span>
      <div style={{ display:'flex',gap:3 }}>
        <button onClick={()=>onPage(page-1)} disabled={page<=1} className="btn btn-secondary btn-sm btn-icon">
          <ChevronLeft size={13}/>
        </button>
        {nums.map(n => {
          if (typeof n==='string'&&n.startsWith('…')) {
            const target=Number(n.slice(1))
            return <button key={n} onClick={()=>onPage(target)} className="btn btn-ghost btn-sm" style={{ minWidth:28,padding:'0 4px',fontSize:12,color:'var(--text-muted)' }}>…</button>
          }
          return (
            <button key={n} onClick={()=>onPage(Number(n))}
              className={`btn btn-sm ${Number(n)===page?'btn-primary':'btn-secondary'}`}
              style={{ minWidth:28,padding:'0 6px',fontSize:12 }}>{n}</button>
          )
        })}
        <button onClick={()=>onPage(page+1)} disabled={page>=pages} className="btn btn-secondary btn-sm btn-icon">
          <ChevronRight size={13}/>
        </button>
      </div>
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder='Search…', style }) {
  return (
    <div style={{ position:'relative', ...style }}>
      <Search size={13} style={{ position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none' }}/>
      <input className="inp" style={{ paddingLeft:28 }} placeholder={placeholder}
        value={value} onChange={e=>onChange(e.target.value)}/>
    </div>
  )
}

export function Select({ value, onChange, options=[], placeholder, style }) {
  return (
    <select className="inp" style={style} value={value} onChange={e=>onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function Field({ label, required, error, hint, children }) {
  return (
    <div>
      {label && (
        <label className="field-label">
          {label}{required && <span style={{ color:'var(--danger)' }}> *</span>}
        </label>
      )}
      {children}
      {hint  && !error && <p style={{ fontSize:11,color:'var(--text-muted)',marginTop:3 }}>{hint}</p>}
      {error && <p style={{ fontSize:11,color:'var(--danger)',marginTop:3 }}>{error}</p>}
    </div>
  )
}

export function ChecklistEditor({ items=[], onChange, readOnly=false }) {
  const [newText, setNewText] = useState('')
  const addItem = () => {
    if (!newText.trim()) return
    onChange([...items, { text:newText.trim(), completed:false }])
    setNewText('')
  }
  const toggle = (i) => { const n=[...items]; n[i]={...n[i],completed:!n[i].completed}; onChange(n) }
  const remove = (i) => onChange(items.filter((_,idx)=>idx!==i))
  const edit   = (i,v) => { const n=[...items]; n[i]={...n[i],text:v}; onChange(n) }
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
      {items.map((item,i) => (
        <div key={i} className="checklist-item">
          <input type="checkbox" checked={item.completed} onChange={()=>toggle(i)} disabled={readOnly}/>
          <input className="inp" style={{ flex:1,height:24,border:'none',background:'transparent',padding:0,fontSize:13 }}
            value={item.text} onChange={e=>edit(i,e.target.value)} disabled={readOnly}/>
          {!readOnly && <button onClick={()=>remove(i)} style={{ color:'var(--text-muted)',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center' }}><X size={13}/></button>}
        </div>
      ))}
      {!readOnly && (
        <div style={{ display:'flex',gap:6,marginTop:4 }}>
          <input className="inp" style={{ flex:1 }} placeholder="Add checklist item…"
            value={newText} onChange={e=>setNewText(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addItem())}/>
          <button onClick={addItem} className="btn btn-secondary btn-sm">Add</button>
        </div>
      )}
    </div>
  )
}