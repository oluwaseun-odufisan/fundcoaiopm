//Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

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
      if (data.success) { toast.success('Welcome back'); navigate('/', { replace: true }); }
      else toast.error(data.message || 'Login failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--c-surface-sunken)' }}>
      <Toaster position="top-center" />
      {/* Left panel */}
      <div className="hidden lg:flex w-[480px] flex-col justify-between p-12" style={{ background: '#0a0f1e' }}>
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ background: '#2563eb' }}>F</div>
            <span className="text-white font-bold text-xl tracking-tight">FundCo</span>
          </div>
          <h1 className="text-white text-[32px] font-extrabold leading-tight tracking-tight mb-4">
            Admin<br />Control Center
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: '#6b7494' }}>
            Manage teams, review tasks, track performance, and oversee operations from one unified dashboard.
          </p>
        </div>
        <p className="text-[12px]" style={{ color: '#3b4261' }}>FundCo Capital Managers © 2025</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black" style={{ background: '#2563eb' }}>F</div>
            <span className="font-bold text-lg" style={{ color: 'var(--c-text-0)' }}>FundCo Admin</span>
          </div>

          <h2 className="text-[24px] font-extrabold tracking-tight mb-1" style={{ color: 'var(--c-text-0)' }}>Sign in</h2>
          <p className="text-[14px] mb-8" style={{ color: 'var(--c-text-2)' }}>Enter your admin credentials to continue</p>

          <form onSubmit={handle} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-text-3)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@fundco.ng" className="input-base" style={{ paddingLeft: 40 }} />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-text-3)' }} />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="input-base" style={{ paddingLeft: 40, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-3)' }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full" style={{ height: 46 }}>
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[12px] mt-8" style={{ color: 'var(--c-text-3)' }}>
            Team Lead · Executive · Super Admin access only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
