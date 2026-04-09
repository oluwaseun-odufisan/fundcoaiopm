import { useState } from 'react'
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/common'

const ROLES = ['team-lead', 'executive', 'super-admin']

export default function LoginPage() {
  const { login } = useAuth()
  const [tab, setTab]   = useState('login')
  const [show, setShow] = useState(false)
  const [ld, setLd]     = useState(false)
  const [err, setErr]   = useState('')
  const [f, setF]       = useState({ email:'', password:'', firstName:'', lastName:'', role:'team-lead', adminCode:'' })
  const set = k => e => setF(p=>({...p, [k]:e.target.value}))

  const submit = async e => {
    e.preventDefault()
    setErr(''); setLd(true)
    try {
      if (tab === 'login') {
        const { data } = await authService.login({ email:f.email, password:f.password })
        login(data.admin, data.token)
        toast.success('Welcome back!')
      } else {
        const { data } = await authService.register(f)
        login(data.admin, data.token)
        toast.success('Account created!')
      }
    } catch(err) {
      setErr(err.response?.data?.message || 'Authentication failed')
    } finally { setLd(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg-app)', padding:16 }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
          <div style={{ width:36, height:36, borderRadius:'var(--radius-md)', background:'var(--brand)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ShieldCheck size={18} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', lineHeight:1 }}>FundCoAI</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Admin Portal</div>
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding:24 }}>
          {/* Tabs */}
          <div className="tab-bar" style={{ marginBottom:20, marginLeft:-8, marginRight:-8, borderRadius:0 }}>
            {[['login','Sign In'],['register','Register']].map(([k,l])=>(
              <div key={k} className={`tab-item${tab===k?' active':''}`} onClick={()=>{setTab(k);setErr('')}}>{l}</div>
            ))}
          </div>

          <div style={{ marginBottom:8 }}>
            <h1 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:2 }}>
              {tab==='login'?'Sign in to your account':'Create admin account'}
            </h1>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>
              {tab==='login'?'Enter your credentials to continue':'Fill in your details to get started'}
            </p>
          </div>

          {err && (
            <div style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'9px 12px',
              borderRadius:'var(--radius)', background:'var(--danger-light)', border:'1px solid var(--danger)',
              marginBottom:14 }}>
              <AlertCircle size={14} style={{ color:'var(--danger)', flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:12.5, color:'var(--danger)' }}>{err}</span>
            </div>
          )}

          <form onSubmit={submit}>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {tab==='register' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label className="field-label">First Name</label>
                    <input className="inp" value={f.firstName} onChange={set('firstName')} required placeholder="John"/>
                  </div>
                  <div>
                    <label className="field-label">Last Name</label>
                    <input className="inp" value={f.lastName} onChange={set('lastName')} required placeholder="Doe"/>
                  </div>
                </div>
              )}

              <div>
                <label className="field-label">Email Address</label>
                <input type="email" className="inp" value={f.email} onChange={set('email')} required placeholder="admin@company.com"/>
              </div>

              <div>
                <label className="field-label">Password</label>
                <div style={{ position:'relative' }}>
                  <input type={show?'text':'password'} className="inp" style={{ paddingRight:36 }}
                    value={f.password} onChange={set('password')} required placeholder="••••••••"/>
                  <button type="button" onClick={()=>setShow(s=>!s)}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
                    {show?<EyeOff size={15}/>:<Eye size={15}/>}
                  </button>
                </div>
              </div>

              {tab==='register' && (
                <>
                  <div>
                    <label className="field-label">Role</label>
                    <select className="inp" value={f.role} onChange={set('role')}>
                      {ROLES.map(r=><option key={r} value={r}>{r.replace('-',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Admin Code</label>
                    <input className="inp" value={f.adminCode} onChange={set('adminCode')} placeholder="Setup key"/>
                    <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                      Note: Super Admin accounts are ideally created by an existing Super Admin via the Admin Accounts page.
                    </p>
                  </div>
                </>
              )}

              <button type="submit" disabled={ld} className="btn btn-primary" style={{ height:38, marginTop:4 }}>
                {ld ? <Spinner size={15}/> : tab==='login'?'Sign In':'Create Account'}
              </button>
            </div>
          </form>
        </div>

        <p style={{ textAlign:'center', fontSize:12, color:'var(--text-muted)', marginTop:16 }}>
          FundCoAI Admin Panel &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}