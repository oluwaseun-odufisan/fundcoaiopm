// src/pages/PerformanceDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Trophy, Users, Gift, RefreshCw, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import LeaderboardTable from '../components/LeaderboardTable';
import UserPerformanceCard from '../components/UserPerformanceCard';
import BonusAwardModal from '../components/BonusAwardModal';
import UserDetailModal from '../components/UserDetailModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PerformanceDashboard = () => {
  const { user, onLogout } = useOutletContext();
  const [leaderboardData, setLeaderboardData] = useState({ top3: [], rest: [] });
  const [myPerformance, setMyPerformance] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [selectedBonusUser, setSelectedBonusUser] = useState(null);
  const [selectedDetailUserId, setSelectedDetailUserId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPointsCalculation, setShowPointsCalculation] = useState(true);

  const isAdmin = user?.role === 'admin';

  // Safe full name helper
  const getFullName = (u) => {
    if (!u) return 'Unknown User';
    if (u.fullName) return u.fullName.trim();
    if (u.firstName || u.lastName) {
      return `${u.firstName || ''} ${u.lastName || ''} ${u.otherName || ''}`.trim();
    }
    return u.name?.trim() || 'Unknown User';
  };

  const fetchData = async () => {
    setLoading(true);
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

  const fetchUserDetails = async (userId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/performance/user/${userId}/details`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setDetailData(res.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Failed to load user details:', err);
      alert('Could not load detailed statistics');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetails = (userObj) => {
    if (!userObj?._id) return;
    setSelectedDetailUserId(userObj._id);
    fetchUserDetails(userObj._id);
  };

  const handleAwardBonus = (targetUser) => {
    setSelectedBonusUser(targetUser);
    setShowBonusModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Performance Board
            </h1>
            <p className="text-lg md:text-xl text-blue-700 dark:text-blue-400 mt-2 font-medium">
              Monthly Bonus System • 100% Transparent Scoring
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow hover:shadow-lg transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
            {isAdmin && (
              <button
                onClick={() => handleAwardBonus(null)}
                className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Gift className="w-6 h-6" />
                Award Bonus
              </button>
            )}
          </div>
        </div>

        {/* Points Calculation Section with Toggle */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-200 dark:border-blue-900 rounded-3xl p-6 mb-10 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Info className="w-7 h-7 text-blue-600 flex-shrink-0" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                How Points Are Calculated (100% Transparent)
              </h3>
            </div>
            <button
              onClick={() => setShowPointsCalculation(!showPointsCalculation)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-blue-700 dark:text-blue-300 font-medium transition-colors"
            >
              {showPointsCalculation ? (
                <>
                  <ChevronUp className="w-5 h-5" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  Show Details
                </>
              )}
            </button>
          </div>
          <AnimatePresence>
            {showPointsCalculation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3 text-gray-700 dark:text-gray-300 text-sm md:text-base">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Task Points</strong> = Priority Weight (Low: 10, Medium: 25, High: 50) + Approval Bonus (+30 if approved) + Checklist Bonus (0–20 based on % completed)
                    </li>
                    <li>
                      <strong>Goal Points</strong> = Percentage of sub-goals completed × 100 (max 100 per goal)
                    </li>
                    <li>
                      <strong>Total Score</strong> = Sum of all Task Points + all Goal Points
                    </li>
                  </ul>
                  <p className="text-red-600 dark:text-red-400 font-medium pt-2">
                    This exact formula determines who receives a bonus at the end of each month.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {leaderboardData.top3.map((player, idx) => {
            const colors = ['amber-400', 'slate-300', 'amber-600'];
            const sizes = ['scale-110', 'scale-105', 'scale-100'];
            const displayName = getFullName(player);
            return (
              <motion.div
                key={player._id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.15 }}
                onClick={() => handleOpenDetails(player)}
                className={`cursor-pointer bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-${colors[idx]} ${sizes[idx]} hover:shadow-2xl transition-all`}
              >
                <div className="text-center">
                  <div className={`text-8xl mb-4`}>{['🥇', '🥈', '🥉'][idx]}</div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{displayName}</h3>
                  <p className="text-blue-600 dark:text-blue-400 mt-1">{player.level}</p>
                  <div className="mt-6 text-7xl font-black text-amber-500">{player.totalScore}</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">points</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* My Performance Card */}
        <div onClick={() => handleOpenDetails({ _id: user.id, ...user })} className="cursor-pointer mb-12">
          <UserPerformanceCard
            performance={myPerformance}
            user={{ ...user, fullName: getFullName(user) }} // ← Safe fullName passed
          />
        </div>

        {/* Leaderboard Table */}
        <LeaderboardTable
          top3={leaderboardData.top3}
          rest={leaderboardData.rest}
          onAwardBonus={isAdmin ? handleAwardBonus : null}
          onUserClick={handleOpenDetails}
        />

        {/* All Users Grid */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <Users className="w-9 h-9 text-blue-600" />
            All Participants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allUsers.map((u) => {
              const displayUser = { ...u, fullName: getFullName(u) };
              return (
                <div key={u._id} onClick={() => handleOpenDetails(u)} className="cursor-pointer">
                  <UserPerformanceCard
                    performance={u}
                    user={displayUser}           // ← Safe fullName passed
                    compact
                    onAwardBonus={isAdmin ? handleAwardBonus : null}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <BonusAwardModal
        isOpen={showBonusModal}
        onClose={() => setShowBonusModal(false)}
        targetUser={selectedBonusUser}
      />
      <UserDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        data={detailData}
        userId={selectedDetailUserId}
      />
    </div>
  );
};

export default PerformanceDashboard;