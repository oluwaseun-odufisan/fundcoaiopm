// components/BonusAwardModal.jsx
import React, { useState } from 'react';
import { X, Gift } from 'lucide-react';
import axios from 'axios';

const BonusAwardModal = ({ isOpen, onClose, targetUser }) => {
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAward = async () => {
    if (!amount || amount <= 0) return;
    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/performance/award`,
        { userId: targetUser?._id || targetUser?.id, bonusAmount: amount, reason },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('Bonus awarded successfully!');
      onClose();
    } catch (err) {
      alert('Failed to award bonus');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 max-w-md w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Gift className="text-amber-500" /> Award Bonus
          </h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">User</label>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl text-lg font-medium">{targetUser?.name}</div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Bonus Amount</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full text-4xl font-black text-center border border-blue-200 rounded-2xl p-6 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full h-24 border border-blue-200 rounded-2xl p-4"
              placeholder="Outstanding Q1 performance..."
            />
          </div>
        </div>

        <button
          onClick={handleAward}
          disabled={loading}
          className="mt-8 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-6 rounded-2xl text-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
        >
          {loading ? 'Awarding...' : `Award ${amount} Points`}
        </button>
      </div>
    </div>
  );
};

export default BonusAwardModal;