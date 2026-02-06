// frontend/src/pages/Training.jsx (assuming it's a page, renamed from Learning.jsx for clarity)
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MaterialList from '../components/MaterialList';
import MaterialViewer from '../components/MaterialViewer';
import TrainingProgress from '../components/TrainingProgress';
import AIChat from '../components/AIChat';
import { Toaster, toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown } from 'lucide-react';
import debounce from 'lodash/debounce'; // Install lodash if not present: npm i lodash
const Training = () => {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevels, setSelectedLevels] = useState([]); // Array for multi-select
  const [selectedAssetcos, setSelectedAssetcos] = useState([]); // Array for multi-select
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showAssetcoDropdown, setShowAssetcoDropdown] = useState(false);
  const levels = ['beginner', 'intermediate', 'expert'];
  const assetcos = ['General', 'EML', 'GroSolar', 'Agronomie', 'SSM']; // From your seed data
  useEffect(() => {
    fetchProgress();
  }, []);
  const fetchCourses = useCallback(debounce(async (filters) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to access learning materials');
        return;
      }
      const params = new URLSearchParams();
      if (filters.level) params.append('level', filters.level);
      if (filters.assetco) params.append('assetco', filters.assetco);
      if (filters.search) params.append('search', filters.search);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/learning/courses?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data.courses || []);
    } catch (err) {
      toast.error('Failed to load courses. Please try again.');
      console.error('Fetch courses error:', err);
    } finally {
      setLoading(false);
    }
  }, 300), []); // Debounce search/filter by 300ms
  useEffect(() => {
    fetchCourses({
      level: selectedLevels.join(','),
      assetco: selectedAssetcos.join(','),
      search: searchTerm,
    });
  }, [selectedLevels, selectedAssetcos, searchTerm]);
  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/learning/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProgress(res.data.progress || []);
    } catch (err) {
      toast.error('Failed to load progress.');
      console.error('Fetch progress error:', err);
    }
  };
  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
  };
  const handleModuleComplete = async (courseId, moduleId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/learning/progress`, { courseId, moduleId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProgress(); // Refresh progress
      toast.success('Module completed! Progress updated.');
    } catch (err) {
      toast.error('Failed to update progress.');
      console.error('Update progress error:', err);
    }
  };
  const handleBack = () => {
    setSelectedCourse(null);
  };
  const toggleLevel = (level) => {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };
  const toggleAssetco = (assetco) => {
    setSelectedAssetcos(prev =>
      prev.includes(assetco) ? prev.filter(a => a !== assetco) : [...prev, assetco]
    );
  };
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <Toaster position="top-right" />
      <motion.h1
        className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Learning Management System
      </motion.h1>
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search trainings, modules, or assetcos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowLevelDropdown(!showLevelDropdown)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          >
            <Filter className="w-5 h-5" /> Levels <ChevronDown className="w-4 h-4" />
          </button>
          {showLevelDropdown && (
            <motion.div
              className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {levels.map(l => (
                <label key={l} className="flex items-center px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/50">
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(l)}
                    onChange={() => toggleLevel(l)}
                    className="mr-2 accent-blue-600 dark:accent-blue-400"
                  />
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </label>
              ))}
            </motion.div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowAssetcoDropdown(!showAssetcoDropdown)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          >
            <Filter className="w-5 h-5" /> Assetcos <ChevronDown className="w-4 h-4" />
          </button>
          {showAssetcoDropdown && (
            <motion.div
              className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {assetcos.map(a => (
                <label key={a} className="flex items-center px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/50">
                  <input
                    type="checkbox"
                    checked={selectedAssetcos.includes(a)}
                    onChange={() => toggleAssetco(a)}
                    className="mr-2 accent-blue-600 dark:accent-blue-400"
                  />
                  {a}
                </label>
              ))}
            </motion.div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : selectedCourse ? (
            <MaterialViewer
              course={selectedCourse}
              onCompleteModule={handleModuleComplete}
              onBack={handleBack}
              progress={progress.find(pr => pr.courseId === selectedCourse._id)?.progress || 0}
            />
          ) : (
            <MaterialList
              courses={courses}
              progress={progress}
              onSelect={handleCourseSelect}
            />
          )}
        </div>
        <div className="space-y-8">
          <TrainingProgress progress={progress} courses={courses} />
          <AIChat />
        </div>
      </div>
    </div>
  );
};
export default Training;