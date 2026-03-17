// src/pages/PerformanceDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Trophy, Medal, Award, TrendingUp, Users, Star, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import LeaderboardTable from '../components/LeaderboardTable';
import UserPerformanceCard from '../components/UserPerformanceCard';
import BonusAwardModal from '../components/BonusAwardModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PerformanceDashboard = () => {
  const { user, onLogout } = useOutletContext();
  const [leaderboardData, setLeaderboardData] = useState({ top3: [], rest: [] });
  const [myPerformance, setMyPerformance] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [selectedUserForBonus, setSelectedUserForBonus] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [lbRes, myRes] = await Promise.all([
          axios.get(`${API_BASE}/api/performance/leaderboard`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${API_BASE}/api/performance/me`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);

        setLeaderboardData(lbRes.data.leaderboard);
        setMyPerformance(myRes.data.performance);
        setAllUsers(lbRes.data.allUsers || []);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) onLogout?.();
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [onLogout]);

  const handleAwardBonus = (targetUser) => {
    setSelectedUserForBonus(targetUser);
    setShowBonusModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-2xl font-bold text-blue-600 animate-pulse">Loading Performance Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">Performance Arena</h1>
            <p className="text-xl text-blue-600 dark:text-blue-400 mt-2">Real-time leaderboard • Weighted priorities • Fair bonuses</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => handleAwardBonus(null)}
              className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-semibold hover:scale-105 transition-all"
            >
              <Gift className="w-6 h-6" /> Award Manual Bonus
            </button>
          )}
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {leaderboardData.top3.map((player, idx) => {
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <motion.div
                key={player._id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border-4 ${idx === 0 ? 'border-amber-400 scale-110' : idx === 1 ? 'border-slate-300' : 'border-amber-600'}`}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-7xl">{medals[idx]}</div>
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-black mb-4">
                    {player.name[0]}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{player.name}</h3>
                  <p className="text-blue-600 text-sm mt-1">{player.level}</p>
                  <div className="mt-6 text-6xl font-black text-amber-500">{player.totalScore}</div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">POINTS</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* My Performance Card */}
        <UserPerformanceCard performance={myPerformance} user={user} />

        {/* Full Leaderboard Table */}
        <LeaderboardTable
          top3={leaderboardData.top3}
          rest={leaderboardData.rest}
          onAwardBonus={isAdmin ? handleAwardBonus : null}
        />

        {/* All Users Grid */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Users className="w-9 h-9 text-blue-600" /> All Users Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allUsers.map((u) => (
              <UserPerformanceCard
                key={u._id}
                performance={{
                  totalScore: u.totalScore,
                  completionRate: u.completionRate,
                  level: u.level,
                }}
                user={u}
                compact
                onAwardBonus={isAdmin ? () => handleAwardBonus(u) : null}
              />
            ))}
          </div>
        </div>
      </motion.div>

      <BonusAwardModal
        isOpen={showBonusModal}
        onClose={() => setShowBonusModal(false)}
        targetUser={selectedUserForBonus}
      />
    </div>
  );
};

export default PerformanceDashboard;