// src/components/UserDetailModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Download, BarChart3, PieChart, Award, Loader2, TrendingUp, CheckCircle2, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getFullName = (user) => {
  if (!user) return 'Unknown User';
  if (user.fullName) return user.fullName.trim();
  if (user.firstName || user.lastName)
    return `${user.firstName || ''} ${user.lastName || ''} ${user.otherName || ''}`.trim();
  return user.name?.trim() || 'Unknown User';
};

// Stat pill component
const StatPill = ({ label, value, color, bg }) => (
  <div className="rounded-xl p-4" style={{ backgroundColor: bg || 'var(--bg-subtle)' }}>
    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
    <p className="text-2xl font-black" style={{ color: color || 'var(--brand-primary)' }}>{value}</p>
  </div>
);

const UserDetailModal = ({ isOpen, onClose, data, userId }) => {
  const contentRef  = useRef(null);
  const [aiNote,    setAiNote]    = useState('');
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) { setAiNote(''); setAiLoading(true); return; }
    setAiNote(''); setAiLoading(true);
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/performance/user/${userId}/ai-note`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setAiNote(res.data.aiNote || 'Super (AI) Admin has reviewed this performance.');
      } catch {
        setAiNote('Super (AI) Admin is currently reviewing this performance. Insights will appear shortly.');
      } finally {
        setAiLoading(false);
      }
    };
    load();
  }, [isOpen, userId]);

  if (!isOpen || !data) return null;

  const fullName = getFullName(data.user);

  const exportToPDF = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current, { scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 190, 277);
    pdf.save(`${fullName.replace(/\s+/g, '_')}_Performance_Report.pdf`);
  };

  // Chart data
  const isDark = document.documentElement.classList.contains('dark');
  const chartTextColor = isDark ? '#9ca3af' : '#6b7280';

  const priorityChartData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      label: 'Completed Tasks',
      data: [
        data.taskStatsByPriority?.Low?.completed    || 0,
        data.taskStatsByPriority?.Medium?.completed || 0,
        data.taskStatsByPriority?.High?.completed   || 0,
      ],
      backgroundColor: ['#16a34a', '#f59e0b', '#dc2626'],
      borderRadius: 6,
      borderWidth: 0,
    }],
  };

  const contributionChartData = {
    labels: ['Task Points', 'Goal Points'],
    datasets: [{
      data: [data.taskPoints || 0, data.goalPoints || 0],
      backgroundColor: ['var(--brand-primary, #312783)', '#36a9e1'],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: chartTextColor, font: { size: 12 } } },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: { ticks: { color: chartTextColor }, grid: { display: false } },
      y: { ticks: { color: chartTextColor }, grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' } },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-[95vw] max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border overflow-hidden flex flex-col"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>

            {/* Sticky header */}
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-black flex-shrink-0"
                  style={{ backgroundColor: 'var(--brand-primary)' }}>
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="font-black text-base truncate" style={{ color: 'var(--text-primary)' }}>
                    {fullName}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Level · {data.user?.level} · Performance Overview
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={exportToPDF}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Download className="w-3.5 h-3.5" /> Export PDF
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

              {/* Hero score */}
              <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6"
                style={{ backgroundColor: 'var(--brand-primary)' }}>
                <div className="text-center sm:text-left">
                  <p className="text-sm font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Total Performance Score
                  </p>
                  <p className="text-6xl font-black text-white leading-none">{data.totalScore}</p>
                  <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    This score directly influences monthly bonus eligibility
                  </p>
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full sm:w-auto">
                  {[
                    { label: 'Task Points',  value: data.taskPoints  || 0, color: '#fff' },
                    { label: 'Goal Points',  value: data.goalPoints  || 0, color: '#fff' },
                    { label: 'Completion',   value: `${data.completionRate || 0}%`, color: '#fff' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center"
                      style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                      <p className="text-xl font-black text-white">{s.value}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatPill label="Total Score"  value={data.totalScore || 0}           color="var(--brand-primary)" bg="var(--brand-light)" />
                <StatPill label="Task Points"  value={data.taskPoints || 0}           color="#36a9e1"              bg="rgba(54,169,225,.08)" />
                <StatPill label="Goal Points"  value={data.goalPoints || 0}           color="#16a34a"              bg="rgba(22,163,74,.08)" />
                <StatPill label="Completion"   value={`${data.completionRate || 0}%`} color="#d97706"              bg="rgba(217,119,6,.08)" />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-5"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                    <PieChart className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                    Task vs Goal Contribution
                  </h3>
                  <div style={{ height: 200 }}>
                    <Pie data={contributionChartData} options={chartOptions} />
                  </div>
                </div>
                <div className="rounded-xl border p-5"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                    <BarChart3 className="w-4 h-4" style={{ color: '#36a9e1' }} />
                    Completed Tasks by Priority
                  </h3>
                  <div style={{ height: 200 }}>
                    <Bar data={priorityChartData} options={barOptions} />
                  </div>
                </div>
              </div>

              {/* Priority breakdown table */}
              <div className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Task Priority Breakdown</h3>
                </div>
                <div className="divide-y" style={{ divideColor: 'var(--border-color)' }}>
                  {/* Header */}
                  <div className="grid grid-cols-4 px-5 py-2 text-xs font-bold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>
                    <span>Priority</span>
                    <span className="text-center">Total</span>
                    <span className="text-center">Completed</span>
                    <span className="text-center">Bonus Pts</span>
                  </div>
                  {['Low', 'Medium', 'High'].map(p => {
                    const s   = data.taskStatsByPriority?.[p] || { count: 0, completed: 0, checklistBonusTotal: 0 };
                    const pct = s.count ? Math.round((s.completed / s.count) * 100) : 0;
                    const PCOL = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' };
                    return (
                      <div key={p} className="grid grid-cols-4 px-5 py-3 items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PCOL[p] }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p}</span>
                        </div>
                        <span className="text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.count}</span>
                        <div className="text-center">
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.completed}</span>
                          <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
                        </div>
                        <span className="text-center text-sm font-bold" style={{ color: '#16a34a' }}>
                          +{s.checklistBonusTotal || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Note */}
              <div className="rounded-xl border p-5"
                style={{ backgroundColor: 'rgba(245,158,11,.04)', borderColor: 'rgba(245,158,11,.3)' }}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(245,158,11,.12)' }}>
                    <Award className="w-4 h-4" style={{ color: '#f59e0b' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: '#b45309' }}>Super (AI) Admin Note</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI-generated performance insight</p>
                  </div>
                </div>
                {aiLoading ? (
                  <div className="flex items-center gap-3 text-sm" style={{ color: '#b45309' }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing performance…
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{aiNote}</p>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Scores are calculated using a fixed, transparent formula · Last updated: {new Date().toLocaleString()}
                </p>
              </div>
            </div>

            {/* Mobile export */}
            <div className="sm:hidden border-t px-6 py-4 flex-shrink-0"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
              <button onClick={exportToPDF}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--brand-primary)' }}>
                <Download className="w-4 h-4" /> Export PDF
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserDetailModal;