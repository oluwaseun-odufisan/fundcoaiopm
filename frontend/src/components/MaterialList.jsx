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
          <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" /> {level}
          </h2>
          <div className="space-y-4">
            {levelCourses.map((course, index) => (
              <motion.div
                key={course._id}
                className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-xl hover:border-blue-300 transition-all duration-300"
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
                  <h3 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
                    {course.required && <Lock className="w-4 h-4 text-red-500" />}
                    {course.title}
                  </h3>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                      course.level === 'beginner' ? 'bg-green-100 text-green-800' :
                      course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      <Star className="w-4 h-4" />
                      {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {course.assetco}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-500 gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {course.modules.length} modules
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart className="w-4 h-4" /> Est. {Math.ceil(course.modules.length * 2)} hours
                    </span>
                  </div>
                  <div className="bg-blue-50 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-blue-600 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${getCourseProgress(course._id)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-600 font-medium">{getCourseProgress(course._id)}% complete</span>
                    {getCourseProgress(course._id) === 100 ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); /* onViewCert(course); */ }}
                        className="flex items-center text-green-600 hover:text-green-800 transition-colors"
                      >
                        <Award className="w-4 h-4 mr-1" /> View Certificate
                      </button>
                    ) : (
                      <span className="flex items-center text-blue-600">
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
          className="text-center py-16 text-gray-500 bg-white rounded-xl shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Search className="w-16 h-16 mx-auto mb-4 text-blue-300" />
          <p className="text-lg font-medium mb-2">No modules match your search or filters</p>
          <p>Try different keywords or clear filters.</p>
        </motion.div>
      )}
    </div>
  );
};

export default MaterialList;