//Logn.jsx
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Orbit, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Enter email and password');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.success) {
        toast.success('Welcome back');
        navigate('/', { replace: true });
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--gradient-subtle)' }}>
      <Toaster position="top-center" />
      <div className="hero-orb -left-10 top-8 h-72 w-72" style={{ background: 'rgba(107, 70, 193, 0.28)' }} />
      <div className="hero-orb right-0 top-1/3 h-80 w-80" style={{ background: 'rgba(59, 130, 246, 0.22)' }} />

      <div className="relative grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
        <div className="hidden px-10 py-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-16 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl text-white shadow-2xl" style={{ background: 'var(--gradient-brand)' }}>
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: 'var(--c-text-3)' }}>Nexus</p>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--c-text-0)', fontFamily: 'var(--font-display)' }}>Admin Command</h1>
              </div>
            </div>

            <div className="max-w-xl">
              <p className="section-title mb-4">World-class admin orchestration</p>
              <h2 className="text-6xl font-black leading-[0.96] tracking-tight" style={{ color: 'var(--c-text-0)', fontFamily: 'var(--font-display)' }}>
                Manage the
                <br />
                future of work.
              </h2>
              <p className="mt-6 text-lg leading-8" style={{ color: 'var(--c-text-2)' }}>
                One control plane for execution, strategy, performance, collaboration, and organizational rhythm. Designed for leaders who need perfect clarity.
              </p>
            </div>
          </div>

          <div className="grid max-w-xl grid-cols-3 gap-4">
            {[
              { label: 'Task velocity', value: '98%', icon: Orbit },
              { label: 'Team sync', value: '24/7', icon: Sparkles },
              { label: 'Signal clarity', value: 'A+', icon: Lock },
            ].map((item) => (
              <div key={item.label} className="card p-4">
                <item.icon className="mb-3 h-5 w-5" style={{ color: 'var(--c-accent)' }} />
                <p className="stat-value text-2xl" style={{ color: 'var(--c-text-0)' }}>{item.value}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--c-text-3)' }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center px-5 py-10 lg:px-10">
          <div className="card glass w-full max-w-[480px] border p-6 lg:p-8">
            <div className="mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl text-white shadow-2xl" style={{ background: 'var(--gradient-brand)' }}>
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-black tracking-tight" style={{ color: 'var(--c-text-0)', fontFamily: 'var(--font-display)' }}>Sign in to Nexus</h3>
              <p className="mt-2 text-sm" style={{ color: 'var(--c-text-3)' }}>Secure admin access for team leads, executives, and super admins.</p>
            </div>

            <form onSubmit={handle} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--c-text-3)' }} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" placeholder="admin@company.com" style={{ paddingLeft: 42 }} />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--c-text-3)' }} />
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-base" placeholder="••••••••" style={{ paddingLeft: 42, paddingRight: 42 }} />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--c-text-3)' }} onClick={() => setShowPw((prev) => !prev)}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full text-base">
                {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Enter Workspace'}
              </button>
            </form>

            <div className="mt-8 rounded-[1.25rem] border p-4" style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface-raised)' }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--c-text-3)' }}>Access tiers</p>
              <p className="mt-2 text-sm" style={{ color: 'var(--c-text-2)' }}>Team Lead, Executive, and Super Admin credentials are supported by the current auth flow.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;