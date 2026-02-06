// frontend/src/components/MaterialList.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, CheckCircle2, Star, Lock, Award, Search, BarChart } from 'lucide-react';
const MaterialList = ({ courses, progress, onSelect }) => {
  const getCourseProgress = (courseId) => {
    const courseProgress = progress.find(p => p.courseId === courseId);
    return courseProgress ? courseProgress.progress : 0;
  };
  // Group courses by level
  const groupedCourses = courses.reduce((acc, course) => {
    const lvl = course.level.charAt(0).toUpperCase() + course.level.slice(1) + ' Training';
    if (!acc[lvl]) acc[lvl] = [];
    acc[lvl].push(course);
    return acc;
  }, {});
  return (
    <div className="space-y-8">
      {Object.entries(groupedCourses).map(([level, levelCourses]) => (
        <div key={level}>
          <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500 dark:text-yellow-400" /> {level}
          </h2>
          <div className="space-y-4">
            {levelCourses.map((course, index) => (
              <motion.div
                key={course._id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6 cursor-pointer hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300"
                onClick={() => onSelect(course)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                role="button"
                tabIndex={0}
                aria-label={`Select ${course.title} training module`}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(course)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    {course.required && <Lock className="w-4 h-4 text-red-500 dark:text-red-400" />}
                    {course.title}
                  </h3>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                      course.level === 'beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      course.level === 'intermediate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                      'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                    }`}>
                      <Star className="w-4 h-4" />
                      {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {course.assetco}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-500 gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {course.modules.length} modules
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart className="w-4 h-4" /> Est. {Math.ceil(course.modules.length * 2)} hours
                    </span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-blue-600 dark:bg-blue-500 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${getCourseProgress(course._id)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{getCourseProgress(course._id)}% complete</span>
                    {getCourseProgress(course._id) === 100 ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); /* onViewCert(course); */ }}
                        className="flex items-center text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                      >
                        <Award className="w-4 h-4 mr-1" /> View Certificate
                      </button>
                    ) : (
                      <span className="flex items-center text-blue-600 dark:text-blue-400">
                        Continue Training <ChevronRight className="w-4 h-4 ml-1" />
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
      {courses.length === 0 && (
        <motion.div
          className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Search className="w-16 h-16 mx-auto mb-4 text-blue-300 dark:text-blue-500" />
          <p className="text-lg font-medium mb-2">No modules match your search or filters</p>
          <p>Try different keywords or clear filters.</p>
        </motion.div>
      )}
    </div>
  );
};
export default MaterialList;