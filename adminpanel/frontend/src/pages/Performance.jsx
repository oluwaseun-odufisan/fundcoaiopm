// Performance page
import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { TrendingUp, Gift, Loader2, Trophy, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const Performance = () => {
  const [data, setData] = useState({ top3: [], rest: [], allUsers: [] });
  const [loading, setLoading] = useState(true);
  const [bonusModal, setBonusModal] = useState(null);

  useEffect(() => {
    api.get('/performance/leaderboard')
      .then(({ data: d }) => { setData({ top3: d.leaderboard?.top3 || [], rest: d.leaderboard?.rest || [], allUsers: d.allUsers || [] }); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const awardBonus = async (userId, amount, reason) => {
    try {
      await api.post('/performance/award', { userId, bonusAmount: amount, reason });
      toast.success('Bonus awarded!');
      setBonusModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-accent)' }} /></div>;

  const RANK_E = ['🥇', '🥈', '🥉'];
  const RANK_C = ['#f59e0b', '#94a3b8', '#b45309'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp className="w-6 h-6" style={{ color: 'var(--brand-accent)' }} /> Performance
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Leaderboard and bonus management</p>
      </div>

      {/* Top 3 */}
      {data.top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.top3.map((p, i) => (
            <motion.div key={p._id} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * .08 }}
              className="rounded-2xl border p-5 text-center" style={{ backgroundColor: `${RANK_C[i]}10`, borderColor: `${RANK_C[i]}40` }}>
              <div className="text-3xl mb-2">{RANK_E[i]}</div>
              <p className="font-black" style={{ color: 'var(--text-primary)' }}>{p.fullName}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.level}</p>
              <p className="text-3xl font-black mt-2" style={{ color: RANK_C[i] }}>{p.totalScore}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>points · {p.completionRate}% done</p>
              <button onClick={() => setBonusModal(p)}
                className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#f59e0b' }}>
                <Gift className="w-3 h-3 inline mr-1" /> Bonus
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Full table */}
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>#</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>User</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>Level</th>
              <th className="text-right px-4 py-3 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Score</th>
              <th className="text-right px-4 py-3 text-xs font-bold uppercase hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Done%</th>
              <th className="text-right px-4 py-3 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.allUsers.map((u, i) => (
              <tr key={u._id} className="border-b hover:bg-[var(--bg-hover)]" style={{ borderColor: 'var(--border-color)' }}>
                <td className="px-4 py-3 font-bold" style={{ color: 'var(--text-muted)' }}>{u.rank}</td>
                <td className="px-4 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>{u.fullName}</td>
                <td className="px-4 py-3 hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>{u.level}</td>
                <td className="px-4 py-3 text-right font-black" style={{ color: 'var(--brand-accent)' }}>{u.totalScore}</td>
                <td className="px-4 py-3 text-right hidden md:table-cell" style={{ color: '#16a34a' }}>{u.completionRate}%</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setBonusModal(u)} className="text-xs px-2.5 py-1 rounded-lg font-bold" style={{ color: '#f59e0b', backgroundColor: 'rgba(245,158,11,.1)' }}>
                    <Gift className="w-3 h-3 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bonus modal */}
      {bonusModal && <BonusModal user={bonusModal} onClose={() => setBonusModal(null)} onAward={awardBonus} />}
    </div>
  );
};

const BonusModal = ({ user, onClose, onAward }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl border p-6"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <h2 className="font-black mb-1" style={{ color: 'var(--text-primary)' }}>Award Bonus</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>To {user.fullName}</p>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Points amount"
          className="w-full px-3 py-2.5 rounded-xl border text-sm mb-3" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for bonus…" rows={3}
          className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none mb-4" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={() => { if (!amount || amount <= 0) return toast.error('Enter valid amount'); onAward(user._id, Number(amount), reason); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#f59e0b' }}>Award</button>
        </div>
      </motion.div>
    </>
  );
};

export default Performance;
