import { useState } from 'react'
import { Save, Key } from 'lucide-react'
import toast from 'react-hot-toast'
import { Field, Spinner } from '../components/common'
import { authService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function SettingsPage() {
  const { admin, login } = useAuth()
  const { dark, toggle } = useTheme()
  const [profile, setProfile] = useState({ firstName:admin?.firstName||'', lastName:admin?.lastName||'', email:admin?.email||'' })
  const [pw, setPw] = useState({ current:'', newPw:'', confirm:'' })
  const [ld, setLd] = useState(false)

  const saveProfile = async () => {
    setLd(true)
    try {
      const { data } = await authService.updateProfile(profile)
      login(data.admin, localStorage.getItem('adminToken'))
      toast.success('Profile updated')
    } catch(err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setLd(false) }
  }

  const changePw = async () => {
    if (!pw.current||!pw.newPw) return toast.error('Fill all fields')
    if (pw.newPw !== pw.confirm) return toast.error('Passwords do not match')
    setLd(true)
    try {
      await authService.changePassword({ currentPassword:pw.current, newPassword:pw.newPw })
      toast.success('Password changed'); setPw({ current:'', newPw:'', confirm:'' })
    } catch(err) { toast.error(err.response?.data?.message||'Failed') }
    finally { setLd(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:560 }}>
      <div><h1 className="page-title">Settings</h1><p className="page-sub">Manage your account and preferences</p></div>

      <div className="card" style={{ padding:20 }}>
        <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text-primary)', marginBottom:14 }}>Profile</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="First Name"><input className="inp" value={profile.firstName} onChange={e=>setProfile(p=>({...p,firstName:e.target.value}))}/></Field>
            <Field label="Last Name"><input className="inp" value={profile.lastName} onChange={e=>setProfile(p=>({...p,lastName:e.target.value}))}/></Field>
          </div>
          <Field label="Email"><input type="email" className="inp" value={profile.email} onChange={e=>setProfile(p=>({...p,email:e.target.value}))}/></Field>
          <button onClick={saveProfile} disabled={ld} className="btn btn-primary btn-sm" style={{ alignSelf:'flex-start' }}>
            {ld?<Spinner size={13}/>:<><Save size={12}/> Save Profile</>}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding:20 }}>
        <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text-primary)', marginBottom:14 }}>Change Password</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Field label="Current Password"><input type="password" className="inp" value={pw.current} onChange={e=>setPw(p=>({...p,current:e.target.value}))}/></Field>
          <Field label="New Password"><input type="password" className="inp" value={pw.newPw} onChange={e=>setPw(p=>({...p,newPw:e.target.value}))}/></Field>
          <Field label="Confirm Password"><input type="password" className="inp" value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))}/></Field>
          <button onClick={changePw} disabled={ld} className="btn btn-primary btn-sm" style={{ alignSelf:'flex-start' }}>
            {ld?<Spinner size={13}/>:<><Key size={12}/> Change Password</>}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding:20 }}>
        <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text-primary)', marginBottom:14 }}>Appearance</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:13, color:'var(--text-primary)', marginBottom:2 }}>Dark Mode</div>
            <div style={{ fontSize:11.5, color:'var(--text-muted)' }}>{dark?'Currently dark':'Currently light'}</div>
          </div>
          <button onClick={toggle} className="btn btn-secondary btn-sm">{dark?'Switch to Light':'Switch to Dark'}</button>
        </div>
      </div>
    </div>
  )
}