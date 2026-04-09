import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, Target, Users, TrendingUp, BookOpen,
  MessageSquare, Bell, FileText, Shield, LogOut, ChevronLeft, ChevronRight,
  Moon, Sun, Menu, X, Video, Settings, ShieldCheck, Briefcase, UserCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Avatar } from '../common'

const NAV = [
  { to:'/',            icon:LayoutDashboard, label:'Dashboard'      },
  { to:'/tasks',       icon:CheckSquare,     label:'Tasks'          },
  { to:'/goals',       icon:Target,          label:'Goals'          },
  { to:'/reports',     icon:FileText,        label:'Reports'        },
  { to:'/performance', icon:TrendingUp,      label:'Performance'    },
  { to:'/projects',    icon:Briefcase,       label:'Projects'       },
  { to:'/my-team',     icon:UserCheck,       label:'My Team'        },
  { to:'/users',       icon:Users,           label:'Users'          },
  { to:'/learning',    icon:BookOpen,        label:'Training'       },
  { to:'/posts',       icon:MessageSquare,   label:'Social'         },
  { to:'/reminders',   icon:Bell,            label:'Reminders'      },
  { to:'/rooms',       icon:Video,           label:'Rooms'          },
  { to:'/admins',      icon:Shield,          label:'Admin Accounts', superOnly:true },
  { to:'/settings',    icon:Settings,        label:'Settings'       },
]

const PAGE_LABELS = {
  tasks:'Tasks', goals:'Goals', reports:'Reports', performance:'Performance',
  users:'Users', learning:'Training', posts:'Social', reminders:'Reminders',
  rooms:'Rooms', admins:'Admin Accounts', settings:'Settings',
  projects:'Projects', 'my-team':'My Team',
}

function Sidebar({ collapsed, onClose }) {
  const { admin, logout, isSuperAdmin } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const nav = NAV.filter(n => !n.superOnly || isSuperAdmin)

  const doLogout = () => { logout(); toast.success('Signed out'); navigate('/login'); onClose?.() }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--sidebar-bg)', overflow:'hidden' }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:collapsed?0:10,
        padding:collapsed?'0':'0 12px', height:52, justifyContent:collapsed?'center':'flex-start',
        borderBottom:'1px solid var(--sidebar-border)', flexShrink:0 }}>
        <div style={{ width:28,height:28,borderRadius:'var(--radius)',background:'var(--brand)',
          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <ShieldCheck size={16} color="#fff"/>
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight:700,fontSize:14,color:'#fff',lineHeight:1.1 }}>FundCoAI</div>
            <div style={{ fontSize:10.5,color:'var(--sidebar-text)',marginTop:1 }}>Admin Panel</div>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && admin && (
        <div style={{ padding:'8px 12px 4px' }}>
          <div style={{ background:'rgba(45,78,191,0.3)',color:'#7FA8F0',borderRadius:'var(--radius)',
            padding:'3px 8px',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em' }}>
            {admin.role?.replace('-',' ')}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, overflowY:'auto', padding:'6px 8px' }}>
        {nav.map(({ to, icon:Icon, label }) => (
          <NavLink key={to} to={to} end={to==='/'} onClick={onClose}
            className={({ isActive }) => `sidebar-link${isActive?' active':''}`}
            style={collapsed?{ justifyContent:'center', padding:'0 6px' }:{}}>
            <Icon size={16} style={{ flexShrink:0 }}/>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding:'6px 8px', borderTop:'1px solid var(--sidebar-border)', flexShrink:0 }}>
        <button onClick={toggle} className="sidebar-link" style={{ width:'100%', cursor:'pointer',
          background:'none',border:'none',fontFamily:'inherit',fontSize:13.5,
          ...(collapsed?{justifyContent:'center',padding:'0 6px'}:{}) }}>
          {dark ? <Sun size={15} style={{ flexShrink:0 }}/> : <Moon size={15} style={{ flexShrink:0 }}/>}
          {!collapsed && <span>{dark?'Light mode':'Dark mode'}</span>}
        </button>

        {!collapsed && admin && (
          <div style={{ display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:'var(--radius)',
            marginTop:4,background:'var(--sidebar-hover)' }}>
            <Avatar name={`${admin.firstName} ${admin.lastName}`} size="sm"/>
            <div style={{ minWidth:0,flex:1 }}>
              <div style={{ fontSize:12.5,fontWeight:500,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                {admin.firstName} {admin.lastName}
              </div>
              <div style={{ fontSize:11,color:'var(--sidebar-text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                {admin.email}
              </div>
            </div>
          </div>
        )}

        <button onClick={doLogout} className="sidebar-link" style={{ width:'100%',cursor:'pointer',
          background:'none',border:'none',fontFamily:'inherit',fontSize:13.5,color:'#E05252',marginTop:4,
          ...(collapsed?{justifyContent:'center',padding:'0 6px'}:{}) }}>
          <LogOut size={15} style={{ flexShrink:0 }}/>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobile, setMobile]       = useState(false)
  useEffect(() => setMobile(false), [pathname])

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg-app)' }}>
      {/* Desktop sidebar */}
      <aside style={{ width:collapsed?52:220, flexShrink:0, position:'relative',
        borderRight:'1px solid var(--border)', transition:'width .2s ease',
        display:'none' }} className="lg-show">
        <Sidebar collapsed={collapsed}/>
        <button onClick={()=>setCollapsed(c=>!c)} style={{ position:'absolute',top:60,right:-11,
          zIndex:10,width:22,height:22,borderRadius:'50%',background:'var(--bg-surface)',
          border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',
          cursor:'pointer',color:'var(--text-muted)',boxShadow:'var(--shadow-sm)' }}>
          {collapsed ? <ChevronRight size={11}/> : <ChevronLeft size={11}/>}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobile && (
        <div style={{ position:'fixed',inset:0,zIndex:300 }}>
          <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)' }} onClick={()=>setMobile(false)}/>
          <aside style={{ width:220,height:'100%',position:'relative',zIndex:10,
            borderRight:'1px solid var(--border)' }}>
            <button onClick={()=>setMobile(false)} style={{ position:'absolute',top:8,right:8,
              zIndex:20,background:'var(--sidebar-hover)',border:'none',borderRadius:'var(--radius)',
              width:26,height:26,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff' }}>
              <X size={13}/>
            </button>
            <Sidebar collapsed={false} onClose={()=>setMobile(false)}/>
          </aside>
        </div>
      )}

      {/* Main area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        {/* Topbar */}
        <header style={{ height:52, flexShrink:0, borderBottom:'1px solid var(--border)',
          background:'var(--bg-surface)', display:'flex', alignItems:'center', padding:'0 20px', gap:10 }}>
          <button onClick={()=>setMobile(true)} className="lg-hide"
            style={{ background:'transparent',border:'none',cursor:'pointer',
              color:'var(--text-secondary)',display:'flex',alignItems:'center',padding:4,borderRadius:'var(--radius)' }}>
            <Menu size={18}/>
          </button>
          <Breadcrumb labels={PAGE_LABELS}/>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', padding:20 }}>
          <Outlet/>
        </main>
      </div>
    </div>
  )
}

function Breadcrumb({ labels }) {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  return (
    <nav style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
      <span style={{ fontWeight:500, color:parts.length?'var(--text-muted)':'var(--text-primary)' }}>
        {parts.length===0?'Dashboard':'Admin'}
      </span>
      {parts.map((p,i) => (
        <span key={p} style={{ display:'flex',alignItems:'center',gap:6 }}>
          <span style={{ color:'var(--border-strong)',fontSize:14 }}>/</span>
          <span style={{ color:i===parts.length-1?'var(--text-primary)':'var(--text-muted)',
            fontWeight:i===parts.length-1?600:400 }}>
            {labels[p]||p.charAt(0).toUpperCase()+p.slice(1)}
          </span>
        </span>
      ))}
    </nav>
  )
}