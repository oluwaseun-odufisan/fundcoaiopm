import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Lock, Mail, Eye, EyeOff, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Enter email and password');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.success) { toast.success('Welcome back!'); navigate('/', { replace: true }); }
      else toast.error(data.message || 'Login failed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f172a' }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md">
        <div className="rounded-2xl border p-8" style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', borderColor: 'rgba(51, 65, 85, 0.5)', backdropFilter: 'blur(20px)' }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
              <Shield className="w-8 h-8" style={{ color: '#3b82f6' }} />
            </div>
            <h1 className="text-2xl font-black text-white">FundCo Admin</h1>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Sign in to your admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#94a3b8' }}>Email</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', borderColor: '#334155' }}>
                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#64748b' }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fundco.ng" className="flex-1 text-sm bg-transparent focus:outline-none text-white placeholder:text-slate-600" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#94a3b8' }}>Password</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', borderColor: '#334155' }}>
                <Lock className="w-4 h-4 flex-shrink-0" style={{ color: '#64748b' }} />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className="flex-1 text-sm bg-transparent focus:outline-none text-white placeholder:text-slate-600" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#3b82f6' }}>
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: '#475569' }}>
            Admin access only · Team Lead · Executive · Super Admin
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
