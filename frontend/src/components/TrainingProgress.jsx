// frontend/src/components/TrainingProgress.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Target } from 'lucide-react';
const TrainingProgress = ({ progress, courses, onViewCert }) => {
  const totalProgress = progress.length > 0 ? progress.reduce((sum, p) => sum + p.progress, 0) / progress.length : 0;
  const completedCourses = progress.filter(p => p.progress === 100);
  const badges = [
    { level: 'Bronze', threshold: 25, color: 'text-amber-600 dark:text-amber-400' },
    { level: 'Silver', threshold: 50, color: 'text-gray-400 dark:text-gray-300' },
    { level: 'Gold', threshold: 75, color: 'text-yellow-500 dark:text-yellow-400' },
    { level: 'Platinum', threshold: 100, color: 'text-blue-400 dark:text-blue-300' },
  ];
  const earnedBadges = badges.filter(badge => totalProgress >= badge.threshold);
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="Training Progress Dashboard"
    >
      <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6" /> Your Development Dashboard
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center shadow-sm">
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-300">{completedCourses.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed Modules</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center shadow-sm">
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-300">{earnedBadges.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Badges Earned</p>
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5" /> Overall Advancement
        </h3>
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-full h-3 overflow-hidden mb-2 shadow-inner">
          <motion.div
            className="bg-blue-600 dark:bg-blue-500 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-sm text-blue-600 dark:text-blue-400 text-right">{totalProgress.toFixed(1)}% Career Advancement</p>
      </div>
      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
        <Award className="w-5 h-5" /> Achievement Badges
      </h3>
      <div className="flex flex-wrap gap-3 mb-6">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.level}
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm ${
              totalProgress >= badge.threshold
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.2, type: 'spring' }}
            aria-label={`${badge.level} badge ${totalProgress >= badge.threshold ? 'earned' : 'locked'}`}
          >
            <Award className={`w-4 h-4 ${badge.color}`} />
            {badge.level}
          </motion.div>
        ))}
      </div>
      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
        Module Status
      </h3>
      <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {courses.map(course => {
          const courseProgress = progress.find(pr => pr.courseId === course._id)?.progress || 0;
          return (
            <motion.div
              key={course._id}
              className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between mb-2">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 truncate">{course.title}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">{courseProgress}%</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner">
                <div className="bg-blue-600 dark:bg-blue-500 h-full rounded-full" style={{ width: `${courseProgress}%` }}></div>
              </div>
              {courseProgress === 100 && (
                <button
                  onClick={() => onViewCert(course)}
                  className="mt-2 text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 w-full justify-center"
                >
                  <Award className="w-3 h-3" /> View Certificate
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
export default TrainingProgress;