// src/components/UserDetailModal.jsx
import React, { useRef } from 'react';
import { X, Download, BarChart3, PieChart, Award } from 'lucide-react';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const UserDetailModal = ({ isOpen, onClose, data, userId }) => {
  const contentRef = useRef(null);

  if (!isOpen || !data) return null;

  const exportToPDF = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`${data.user.name.replace(/\s+/g, '_')}_Performance_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // ── Charts ──
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
      borderWidth: 1,
    }],
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        <div ref={contentRef} className="p-6 md:p-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 sticky top-0 bg-white dark:bg-gray-900 z-10 pb-4 border-b">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                {data.user.name} — Performance Breakdown
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Level: <span className="font-bold text-purple-600">{data.user.level}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                <Download size={20} />
                Export PDF
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Total Score Highlight */}
          <div className="text-center mb-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-10 rounded-3xl shadow-inner">
            <div className="text-7xl md:text-9xl font-black text-blue-600 dark:text-blue-400">
              {data.totalScore}
            </div>
            <p className="text-2xl md:text-3xl font-bold mt-4 text-gray-900 dark:text-white">
              TOTAL PERFORMANCE SCORE
            </p>
           
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
            {/* Contribution Pie */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <PieChart className="text-green-600" />
                Task vs Goal Contribution
              </h3>
              <div className="h-80">
                <Pie
                  data={contributionChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                    },
                  }}
                />
              </div>
            </div>

            {/* Priority Bar */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <BarChart3 className="text-blue-600" />
                Completed Tasks by Priority
              </h3>
              <div className="h-80">
                <Bar
                  data={priorityChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Aggregated Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Tasks', value: data.taskStatsByPriority?.Low?.count + data.taskStatsByPriority?.Medium?.count + data.taskStatsByPriority?.High?.count || 0, color: 'blue' },
              { label: 'Completed Tasks', value: data.taskStatsByPriority?.Low?.completed + data.taskStatsByPriority?.Medium?.completed + data.taskStatsByPriority?.High?.completed || 0, color: 'green' },
              { label: 'Total Goals', value: data.totalGoals || 0, color: 'purple' },
              { label: 'Completed Goals', value: data.completedGoals || 0, color: 'emerald' },
            ].map((stat, i) => (
              <div key={i} className={`bg-${stat.color}-50 dark:bg-gray-800 p-6 rounded-2xl text-center border border-${stat.color}-200 dark:border-gray-700 shadow-sm`}>
                <p className="text-5xl font-black text-${stat.color}-600 dark:text-${stat.color}-400">{stat.value}</p>
                <p className="text-lg font-medium mt-2 text-gray-700 dark:text-gray-300">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Priority Breakdown Table */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">Task Priority Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="p-4 font-semibold">Priority</th>
                    <th className="p-4 font-semibold text-center">Total</th>
                    <th className="p-4 font-semibold text-center">Completed</th>
                    <th className="p-4 font-semibold text-center">Checklist Bonus (sum)</th>
                  </tr>
                </thead>
                <tbody>
                  {['Low', 'Medium', 'High'].map(p => {
                    const s = data.taskStatsByPriority?.[p] || { count: 0, completed: 0, checklistBonusTotal: 0 };
                    return (
                      <tr key={p} className="border-b dark:border-gray-700">
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

          {/* Bonus History (visible only to self or admin) */}
          {data.bonusHistory?.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Award className="text-amber-600" />
                Bonus Award History
              </h3>
              <div className="space-y-4">
                {data.bonusHistory.map((entry, i) => (
                  <div key={i} className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-2xl border border-amber-200 dark:border-amber-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-lg">{entry.details}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-amber-600">+{entry.details.match(/\d+/)?.[0] || '?'} pts</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default UserDetailModal;