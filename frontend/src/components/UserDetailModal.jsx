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

  // CRITICAL FIX: Reset AI note every time a new user is opened
  useEffect(() => {
    if (!isOpen || !userId) {
      setAiNote('');
      setAiLoading(true);
      return;
    }

    // Reset immediately when user changes
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
  }, [isOpen, userId]);   // ← userId is the key trigger

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[99999] p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-y-auto shadow-2xl"
      >
        <div ref={contentRef} className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 border-b pb-6">
            <div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white">{data.user.name}</h2>
              <p className="text-blue-600 dark:text-blue-400">Level • {data.user.level}</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={exportToPDF} 
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-medium"
              >
                <Download className="w-5 h-5" /> Export PDF
              </button>
              <button 
                onClick={onClose} 
                className="text-4xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>

          {/* Total Score */}
          <div className="text-center mb-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-12 rounded-3xl">
            <div className="text-8xl font-black text-blue-600 dark:text-blue-400">{data.totalScore}</div>
            <p className="text-3xl font-bold mt-4 text-gray-900 dark:text-white">TOTAL PERFORMANCE SCORE</p>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                <PieChart className="text-green-600" /> Task vs Goal Contribution
              </h3>
              <div className="h-80"><Pie data={contributionChartData} /></div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                <BarChart3 className="text-blue-600" /> Completed Tasks by Priority
              </h3>
              <div className="h-80"><Bar data={priorityChartData} /></div>
            </div>
          </div>

          {/* Priority Table */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">Task Priority Breakdown</h3>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-4 text-left">Priority</th>
                  <th className="p-4 text-center">Total Tasks</th>
                  <th className="p-4 text-center">Completed</th>
                  <th className="p-4 text-center">Checklist Bonus (sum)</th>
                </tr>
              </thead>
              <tbody>
                {['Low', 'Medium', 'High'].map(p => {
                  const s = data.taskStatsByPriority?.[p] || { count: 0, completed: 0, checklistBonusTotal: 0 };
                  return (
                    <tr key={p} className="border-b">
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

          {/* SUPER (AI) ADMIN SECTION — now correctly resets per user */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800 rounded-3xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <Award className="w-9 h-9 text-amber-600" />
              <h3 className="text-2xl font-bold text-amber-800 dark:text-amber-200">Super (AI) Admin Note</h3>
            </div>

            {aiLoading ? (
              <div className="flex items-center gap-4 text-amber-700 dark:text-amber-300">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p>Super (AI) Admin is analyzing this performance...</p>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed text-amber-900 dark:text-amber-100">
                {aiNote}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserDetailModal;