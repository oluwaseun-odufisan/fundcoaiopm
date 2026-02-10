// Corrected src/pages/PerformanceBoard.jsx (fixed imports, removed <style jsx>, converted to Tailwind classes, fixed colors)
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Trophy, Star, Award, Gift, ChevronDown, ChevronUp, ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';  // Added Toaster import
import Confetti from 'react-confetti';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PerformanceBoard = () => {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [usersPerformance, setUsersPerformance] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [redemptionAmount, setRedemptionAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sortBy, setSortBy] = useState('points');
  const [sortOrder, setSortOrder] = useState('desc');

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchPerformanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/performance/users`, {
        headers: getAuthHeaders(),
      });
      setUsersPerformance(response.data.users);
      updateLeaderboard(response.data.users);
    } catch (err) {
      toast.error('Failed to fetch performance data');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const updateLeaderboard = (data) => {
    const sorted = [...data].sort((a, b) => b.points - a.points);
    setLeaderboard(sorted.slice(0, 10));
  };

  const handleRedeem = async () => {
    if (redemptionAmount <= 0 || redemptionAmount > selectedUser.points) {
      toast.error('Invalid redemption amount');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/performance/redeem`, {
        userId: selectedUser._id,
        amount: redemptionAmount,
      }, { headers: getAuthHeaders() });
      toast.success('Points redeemed! Bonus processed.');
      setShowRedemptionModal(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      fetchPerformanceData();
    } catch (err) {
      toast.error('Failed to redeem points');
    }
  };

  const sortUsers = () => {
    return [...usersPerformance].sort((a, b) => {
      let compare = sortBy === 'points' ? b.points - a.points : b.completedTasks - a.completedTasks;
      return sortOrder === 'asc' ? -compare : compare;
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-blue-600 dark:text-blue-400 text-xl font-medium">Loading Performance Board...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900 p-4 sm:p-8">
      <Toaster />
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-3">
            <Trophy className="text-yellow-500 w-8 h-8" /> Performance Board
          </h1>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-all text-sm sm:text-base font-medium shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>

        {/* Leaderboard Podium */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-3xl p-6 sm:p-8 mb-8 sm:mb-12 shadow-lg"
        >
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 text-indigo-900 dark:text-indigo-100">
            <Award className="text-yellow-500 w-6 h-6" /> Top Performers
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mb-6">
            {[1, 0, 2].map((pos, i) => {
              const performer = leaderboard[pos];
              if (!performer) return null;
              return (
                <motion.div
                  key={pos}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: i === 1 ? 1.1 : 1, opacity: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className={`text-center cursor-pointer hover:shadow-md transition-all rounded-xl p-4 ${i === 1 ? 'order-last sm:order-first' : ''} bg-white dark:bg-gray-800 shadow-sm`}
                  onClick={() => setSelectedUser(performer)}
                >
                  <div className={`w-20 h-20 sm:w-24 h-24 mx-auto rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold mb-2 shadow-md ${
                    pos === 0 ? 'bg-yellow-400 text-yellow-900' : 
                    pos === 1 ? 'bg-gray-300 text-gray-900' : 
                    'bg-orange-300 text-orange-900'
                  }`}>
                    {performer.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100">{performer.name}</h3>
                  <p className="text-blue-600 dark:text-blue-400 font-medium text-sm sm:text-base">{performer.points} pts</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{performer.level.name}</p>
                  <div className="text-3xl sm:text-4xl mt-2">
                    {['🥈', '🏆', '🥉'][pos]}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="space-y-3">
            {leaderboard.slice(3, 10).map((u, i) => (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedUser(u)}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-400">#{i + 4}</span>
                  <div className="w-8 h-8 sm:w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-medium text-sm">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-base text-gray-900 dark:text-gray-100">{u.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{u.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600 dark:text-blue-400 text-base">{u.points} pts</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{u.level.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Sorting Controls */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition text-gray-900 dark:text-gray-100"
          >
            <option value="points">Points</option>
            <option value="tasks">Completed Tasks</option>
          </select>
          <button 
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            {sortOrder === 'desc' ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>

        {/* Users Performance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sortUsers().map(u => (
            <motion.div 
              key={u._id}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100 dark:border-gray-700"
              onClick={() => setSelectedUser(u)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{u.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{u.role} • Level {u.level.name}</p>
                </div>
                <div className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
                  u.level.color === 'platinum' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300' :
                  u.level.color === 'gold' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                  u.level.color === 'silver' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                  'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300'
                }`}>
                  {u.level.name}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-400 mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{u.points}</p>
                  <p className="text-xs">Points</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{u.completedTasks}</p>
                  <p className="text-xs">Tasks Done</p>
                </div>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-gray-200 text-sm">
                  <Star className="text-yellow-500 w-4 h-4" /> Badges
                </h4>
                <div className="flex flex-wrap gap-2">
                  {u.badges.map((badge, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                      {badge}
                    </span>
                  ))}
                  {u.badges.length === 0 && <p className="text-xs text-gray-500 dark:text-gray-500">No badges yet</p>}
                </div>
              </div>
              <Pie 
                data={{
                  labels: ['Completed Tasks', 'Pending Tasks', 'Completed Goals'],
                  datasets: [{
                    data: [u.completedTasks, u.tasks.length - u.completedTasks, u.completedGoals],
                    backgroundColor: ['#10B981', '#EF4444', '#3B82F6'],
                    hoverBackgroundColor: ['#059669', '#DC2626', '#2563EB'],
                  }],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 10 } } }
                  }
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl m-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6 sm:mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-indigo-900 dark:text-indigo-100 mb-1 sm:mb-2">{selectedUser.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.role} • Level {selectedUser.level.name}</p>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Left Column: Stats and Badges */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-center shadow-sm">
                      <p className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1 sm:mb-2">{selectedUser.points}</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Total Points</p>
                    </div>
                    <div className="p-4 sm:p-6 bg-green-50 dark:bg-green-900/30 rounded-2xl text-center shadow-sm">
                      <p className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400 mb-1 sm:mb-2">{selectedUser.completedTasks}</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Tasks Completed</p>
                    </div>
                    <div className="p-4 sm:p-6 bg-purple-50 dark:bg-purple-900/30 rounded-2xl text-center shadow-sm">
                      <p className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1 sm:mb-2">{selectedUser.completedGoals}</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Goals Achieved</p>
                    </div>
                    <div className="p-4 sm:p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-2xl text-center shadow-sm">
                      <p className="text-3xl sm:text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-1 sm:mb-2">{selectedUser.badges.length}</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Badges Earned</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                      <Award className="text-yellow-500 w-5 h-5" /> Badges Collection
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {selectedUser.badges.map((badge, i) => (
                        <div key={i} className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center gap-3 shadow-sm">
                          <div className="w-8 h-8 sm:w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center flex-shrink-0">
                            <Star className="text-yellow-500 w-4 h-4 sm:w-5 h-5" />
                          </div>
                          <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{badge}</span>
                        </div>
                      ))}
                      {selectedUser.badges.length === 0 && (
                        <p className="col-span-2 text-center text-gray-500 dark:text-gray-500 py-4 text-sm">No badges earned yet. Keep working!</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Charts */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-gray-200">Task Completion by Priority</h3>
                    <Bar 
                      data={{
                        labels: ['Low', 'Medium', 'High'],
                        datasets: [{
                          label: 'Completed',
                          data: [
                            selectedUser.tasks.filter(t => t.priority === 'Low' && t.completed).length,
                            selectedUser.tasks.filter(t => t.priority === 'Medium' && t.completed).length,
                            selectedUser.tasks.filter(t => t.priority === 'High' && t.completed).length
                          ],
                          backgroundColor: ['#3B82F6', '#10B981', '#EF4444'],
                        }],
                      }}
                      options={{
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: { beginAtZero: true, precision: 0 }
                        }
                      }}
                    />
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-gray-200">Overall Progress</h3>
                    <Pie 
                      data={{
                        labels: ['Completed Tasks', 'Pending Tasks', 'Completed Goals', 'Active Goals'],
                        datasets: [{
                          data: [
                            selectedUser.completedTasks,
                            selectedUser.tasks.length - selectedUser.completedTasks,
                            selectedUser.completedGoals,
                            selectedUser.goals.length - selectedUser.completedGoals
                          ],
                          backgroundColor: ['#10B981', '#EF4444', '#3B82F6', '#F59E0B'],
                        }],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'bottom', labels: { font: { size: 12 } } }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-green-50 dark:bg-green-900/30 rounded-2xl shadow-sm">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <Gift className="text-green-600 dark:text-green-400 w-5 h-5" /> Redeem Points for Bonus
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">Available points: {selectedUser.points}</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <input
                    type="number"
                    value={redemptionAmount}
                    onChange={(e) => setRedemptionAmount(Math.max(0, Math.min(selectedUser.points, parseInt(e.target.value) || 0)))}
                    className="flex-1 p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                    placeholder="Enter amount"
                    min="1"
                    max={selectedUser.points}
                  />
                  <button 
                    onClick={() => setShowRedemptionModal(true)}
                    disabled={redemptionAmount <= 0}
                    className="px-5 sm:px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-xl hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                  >
                    Redeem
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">1 point = $0.01 bonus (admin approval required)</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redemption Modal */}
      <AnimatePresence>
        {showRedemptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowRedemptionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Confirm Redemption</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">Redeem {redemptionAmount} points for ${(redemptionAmount * 0.01).toFixed(2)} bonus?</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">This will be processed by admin and added to your next payment.</p>
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setShowRedemptionModal(false)}
                  className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRedeem}
                  className="px-5 py-2.5 bg-green-600 dark:bg-green-700 text-white rounded-xl hover:bg-green-700 dark:hover:bg-green-600 transition text-sm"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PerformanceBoard;