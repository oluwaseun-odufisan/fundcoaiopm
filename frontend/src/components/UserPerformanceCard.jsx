// components/UserPerformanceCard.jsx
import React from 'react';
import { Star, Target, Award } from 'lucide-react';
import { motion } from 'framer-motion';

// Safe full name helper (works with new user model + legacy fallback)
const getFullName = (user) => {
    if (!user) return 'Unknown User';
    if (user.fullName) return user.fullName.trim();
    if (user.firstName || user.lastName) {
        return `${user.firstName || ''} ${user.lastName || ''} ${user.otherName || ''}`.trim();
    }
    return user.name?.trim() || 'Unknown User';
};

// Safe avatar initial helper
const getInitial = (user) => {
    const name = user?.firstName || user?.name || 'U';
    return name.charAt(0).toUpperCase();
};

const UserPerformanceCard = ({ performance, user, compact = false, onAwardBonus }) => {
    const { totalScore = 0, completionRate = 0, level = 'Novice' } = performance || {};

    // Safe name and initial
    const fullName = getFullName(user);
    const initial = getInitial(user);

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={`bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-blue-100 dark:border-gray-700 ${compact ? 'p-6' : ''}`}
        >
            <div className="flex items-center gap-4">
                {/* Safe avatar initial */}
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black">
                    {initial}
                </div>
                <div>
                    {/* Safe full name display */}
                    <h3 className="text-2xl font-bold">{fullName}</h3>
                    <p className="text-blue-600 text-sm">{level}</p>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-5xl font-black text-blue-600">{totalScore}</div>
                    <div className="text-xs uppercase tracking-widest text-gray-500">Total Score</div>
                </div>
                <div className="text-center">
                    <div className="text-5xl font-black text-green-600">{completionRate}%</div>
                    <div className="text-xs uppercase tracking-widest text-gray-500">Completion</div>
                </div>
                <div className="text-center">
                    <div className="text-5xl font-black text-purple-600">★</div>
                    <div className="text-xs uppercase tracking-widest text-gray-500">Level</div>
                </div>
            </div>

            {!compact && onAwardBonus && (
                <button
                    onClick={() => onAwardBonus(user)}
                    className="mt-8 w-full bg-gradient-to-r from-amber-500 to-orange-500 py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-3 hover:scale-105 transition-all"
                >
                    <Award className="w-5 h-5" /> Award Bonus
                </button>
            )}
        </motion.div>
    );
};

export default UserPerformanceCard;