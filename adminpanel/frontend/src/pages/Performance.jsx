//Performance.jsx
import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Gift, Trophy, X } from 'lucide-react';

const RANK_E = ['🥇','🥈','🥉']; const RANK_C = ['#f59e0b','#94a3b8','#b45309'];
const Performance = () => {
  const [data, setData] = useState({ top3: [], rest: [], allUsers: [] }); const [loading, setLoading] = useState(true); const [bonusUser, setBonusUser] = useState(null);
  useEffect(() => { api.get('/performance/leaderboard').then(({ data: d }) => setData({ top3: d.leaderboard?.top3||[], rest: d.leaderboard?.rest||[], allUsers: d.allUsers||[] })).catch(()=>toast.error('Failed')).finally(()=>setLoading(false)); }, []);
  const award = async (userId, amount, reason) => { try { await api.post('/performance/award', { userId, bonusAmount: amount, reason }); toast.success('Bonus awarded!'); setBonusUser(null); } catch(e) { toast.error(e.response?.data?.message||'Failed'); } };
  if (loading) return <div className="flex justify-center py-20"><div className="w-7 h-7 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} /></div>;
  return (
    <div className="space-y-6">
      <div><h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>Performance</h1><p className="text-[14px] mt-1" style={{ color: 'var(--c-text-2)' }}>Leaderboard & bonus management</p></div>
      {data.top3.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{data.top3.map((p, i) => (
        <motion.div key={p._id} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i*.08 }}
          className="card p-6 text-center" style={{ borderColor: `${RANK_C[i]}60` }}>
          <div className="text-[32px] mb-2">{RANK_E[i]}</div>
          <p className="text-[15px] font-bold" style={{ color: 'var(--c-text-0)' }}>{p.fullName}</p>
          <p className="text-[12px]" style={{ color: 'var(--c-text-3)' }}>{p.level}</p>
          <p className="stat-value mt-3" style={{ color: RANK_C[i] }}>{p.totalScore}</p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--c-text-3)' }}>points · {p.completionRate}% done</p>
          <button onClick={() => setBonusUser(p)} className="btn-ghost mt-3 text-[12px]" style={{ color: '#f59e0b' }}><Gift className="w-3.5 h-3.5" /> Bonus</button>
        </motion.div>))}</div>}
      <div className="card overflow-hidden"><table className="w-full"><thead><tr>
        <th className="table-header">#</th><th className="table-header">User</th><th className="table-header hidden sm:table-cell">Level</th>
        <th className="table-header text-right">Score</th><th className="table-header text-right hidden md:table-cell">Done</th><th className="table-header text-right">Action</th>
      </tr></thead><tbody>{data.allUsers.map(u => (
        <tr key={u._id} className="table-row"><td className="table-cell font-bold" style={{ color: 'var(--c-text-3)' }}>{u.rank}</td>
          <td className="table-cell"><p className="font-semibold" style={{ color: 'var(--c-text-0)' }}>{u.fullName}</p></td>
          <td className="table-cell hidden sm:table-cell">{u.level}</td>
          <td className="table-cell text-right font-bold" style={{ color: 'var(--c-accent)' }}>{u.totalScore}</td>
          <td className="table-cell text-right hidden md:table-cell" style={{ color: '#059669' }}>{u.completionRate}%</td>
          <td className="table-cell text-right"><button onClick={() => setBonusUser(u)} className="btn-ghost p-1.5" style={{ color: '#f59e0b' }}><Gift className="w-4 h-4" /></button></td>
        </tr>))}</tbody></table></div>
      <AnimatePresence>{bonusUser && <BonusModal user={bonusUser} onClose={() => setBonusUser(null)} onAward={award} />}</AnimatePresence>
    </div>);
};
const BonusModal = ({ user, onClose, onAward }) => {
  const [amt, setAmt] = useState(''); const [reason, setReason] = useState('');
  return (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl p-6"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-xl)' }}>
      <h2 className="text-[16px] font-bold mb-1" style={{ color: 'var(--c-text-0)' }}>Award Bonus</h2>
      <p className="text-[13px] mb-4" style={{ color: 'var(--c-text-2)' }}>To {user.fullName}</p>
      <div className="space-y-3"><input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="Points" className="input-base" />
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason…" rows={3} className="input-base" style={{ resize: 'vertical' }} /></div>
      <div className="flex gap-3 mt-4"><button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
        <button onClick={() => { if (!amt||amt<=0) return toast.error('Enter amount'); onAward(user._id, Number(amt), reason); }} className="flex-1 btn-primary" style={{ background: '#f59e0b' }}>Award</button></div>
    </motion.div></>);
};
export default Performance;
