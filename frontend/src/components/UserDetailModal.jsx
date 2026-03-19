// src/components/UserDetailModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Download, BarChart3, PieChart, Award, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const UserDetailModal = ({ isOpen, onClose, data, userId }) => {
  const contentRef = useRef(null);
  const [aiNote, setAiNote] = useState('');
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) {
      setAiNote('');
      setAiLoading(true);
      return;
    }

    setAiNote('');
    setAiLoading(true);

    const loadAINote = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/performance/user/${userId}/ai-note`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setAiNote(res.data.aiNote || "Super (AI) Admin has reviewed this performance.");
      } catch (err) {
        console.error(err);
        setAiNote("Super (AI) Admin is currently reviewing this performance. Insights will appear shortly.");
      } finally {
        setAiLoading(false);
      }
    };

    loadAINote();
  }, [isOpen, userId]);

  if (!isOpen || !data) return null;

  const exportToPDF = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current, { scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 190, 277);
    pdf.save(`${data.user.name.replace(/\s+/g, '_')}_Performance_Report.pdf`);
  };

  const priorityChartData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      label: 'Completed Tasks',
      data: [
        data.taskStatsByPriority?.Low?.completed || 0,
        data.taskStatsByPriority?.Medium?.completed || 0,
        data.taskStatsByPriority?.High?.completed || 0,
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
    }],
  };

  const contributionChartData = {
    labels: ['Tasks', 'Goals'],
    datasets: [{
      data: [data.taskPoints || 0, data.goalPoints || 0],
      backgroundColor: ['#3B82F6', '#10B981'],
    }],
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />

      {/* Centered, scrollable modal */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="
          fixed z-[9999]
          top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[95vw] max-w-5xl
          max-h-[90vh]
          bg-white dark:bg-gray-900
          rounded-2xl shadow-2xl overflow-hidden
          border border-gray-200 dark:border-gray-700
          flex flex-col
        "
      >
        {/* Sticky Header */}
        <div className="
          sticky top-0 z-20
          bg-white dark:bg-gray-900
          border-b border-gray-200 dark:border-gray-700
          px-5 py-4 md:px-8 md:py-5
          flex justify-between items-center
        ">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {data.user.name} — Performance Overview
            </h2>
            <p className="text-blue-600 dark:text-blue-400 mt-1 text-sm md:text-base">
              Level • {data.user.level}
            </p>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={exportToPDF}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="text-3xl md:text-4xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800"
        >
          {/* Total Score */}
          <div className="text-center mb-10 md:mb-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-8 md:p-12 rounded-3xl shadow-inner">
            <div className="text-6xl md:text-8xl lg:text-9xl font-black text-blue-600 dark:text-blue-400">
              {data.totalScore}
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold mt-4 text-gray-900 dark:text-white">
              TOTAL PERFORMANCE SCORE
            </p>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mt-3">
              This score directly influences monthly bonus eligibility
            </p>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 mb-10 md:mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
              <h3 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-3">
                <PieChart className="text-green-600 w-6 h-6" />
                Task vs Goal Contribution
              </h3>
              <div className="h-64 md:h-80">
                <Pie data={contributionChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
              <h3 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-3">
                <BarChart3 className="text-blue-600 w-6 h-6" />
                Completed Tasks by Priority
              </h3>
              <div className="h-64 md:h-80">
                <Bar data={priorityChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          {/* Priority Table */}
          <div className="mb-10 md:mb-12">
            <h3 className="text-xl md:text-2xl font-bold mb-6">Task Priority Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm md:text-base border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="p-4 text-left font-semibold">Priority</th>
                    <th className="p-4 text-center font-semibold">Total</th>
                    <th className="p-4 text-center font-semibold">Completed</th>
                    <th className="p-4 text-center font-semibold">Checklist Bonus (sum)</th>
                  </tr>
                </thead>
                <tbody>
                  {['Low', 'Medium', 'High'].map(p => {
                    const s = data.taskStatsByPriority?.[p] || { count: 0, completed: 0, checklistBonusTotal: 0 };
                    return (
                      <tr key={p} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="p-4 font-medium">{p}</td>
                        <td className="p-4 text-center">{s.count}</td>
                        <td className="p-4 text-center">{s.completed}</td>
                        <td className="p-4 text-center font-medium text-green-600">{s.checklistBonusTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Super (AI) Admin Note */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 md:p-8 mb-10 md:mb-12">
            <div className="flex items-center gap-4 mb-6">
              <Award className="w-8 h-8 md:w-9 md:h-9 text-amber-600" />
              <h3 className="text-xl md:text-2xl font-bold text-amber-800 dark:text-amber-200">
                Super (AI) Admin Note
              </h3>
            </div>

            {aiLoading ? (
              <div className="flex items-center gap-4 text-amber-700 dark:text-amber-300 text-base md:text-lg">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p>Super (AI) Admin is analyzing this performance...</p>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none text-base md:text-lg leading-relaxed text-amber-900 dark:text-amber-100">
                {aiNote}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p>All scores are calculated using a fixed, transparent formula.</p>
            <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Sticky Mobile Export Button */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-5 py-4 md:hidden z-10">
          <button
            onClick={exportToPDF}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            Export PDF
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default UserDetailModal;