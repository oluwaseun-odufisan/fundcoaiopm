import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { motion } from 'framer-motion';
import {
  Users, ListTodo, CheckCircle2, AlertTriangle, Clock, Target,
  FileText, TrendingUp, Send, Award,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const StatCard = ({ label, value, icon: Icon, color, bg, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="rounded-xl border p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-black leading-none" style={{ color }}>{value}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
    </div>
  </motion.div>
);

const PIE_COLORS = ['#16a34a', '#f59e0b', '#dc2626', '#3b82f6'];

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [goalStats, setGoalStats] = useState(null);
  const [reportStats, setReportStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [a, t, g, r] = await Promise.all([
          api.get('/performance/analytics'),
          api.get('/tasks/stats'),
          api.get('/goals/stats'),
          api.get('/reports/stats'),
        ]);
        setAnalytics(a.data.analytics);
        setTaskStats(t.data.stats);
        setGoalStats(g.data.stats);
        setReportStats(r.data.stats);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: 'var(--brand-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  const a = analytics || {};
  const ts = taskStats || {};
  const gs = goalStats || {};
  const rs = reportStats || {};

  const taskPieData = [
    { name: 'Completed', value: ts.completed || 0 },
    { name: 'Pending', value: ts.pending || 0 },
    { name: 'Overdue', value: ts.overdue || 0 },
    { name: 'Submitted', value: ts.submitted || 0 },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'Low', tasks: 0 }, { name: 'Medium', tasks: 0 }, { name: 'High', tasks: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
          Welcome back, {user?.firstName || 'Admin'}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Here's your organization overview for today
        </p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <StatCard label="Total Users" value={a.totalUsers || 0} icon={Users} color="#2563eb" bg="rgba(37,99,235,.1)" delay={0} />
        <StatCard label="Total Tasks" value={a.totalTasks || 0} icon={ListTodo} color="#7c3aed" bg="rgba(124,58,237,.1)" delay={.04} />
        <StatCard label="Completed" value={a.completedTasks || 0} icon={CheckCircle2} color="#16a34a" bg="rgba(22,163,74,.1)" delay={.08} />
        <StatCard label="Overdue" value={a.overdueTasks || 0} icon={AlertTriangle} color="#dc2626" bg="rgba(220,38,38,.1)" delay={.12} />
        <StatCard label="Pending Review" value={a.pendingApproval || 0} icon={Send} color="#d97706" bg="rgba(217,119,6,.1)" delay={.16} />
        <StatCard label="Total Goals" value={a.totalGoals || 0} icon={Target} color="#0891b2" bg="rgba(8,145,178,.1)" delay={.2} />
        <StatCard label="Reports Pending" value={rs.pendingReview || 0} icon={FileText} color="#9333ea" bg="rgba(147,51,234,.1)" delay={.24} />
        <StatCard label="Completion Rate" value={`${a.completionRate || 0}%`} icon={TrendingUp} color="#16a34a" bg="rgba(22,163,74,.1)" delay={.28} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task breakdown pie */}
        <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Task Status Breakdown</h3>
          {taskPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {taskPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>No task data</p>}
        </div>

        {/* Quick stats cards */}
        <div className="space-y-3">
          <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Goals Overview</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total', value: gs.total || 0, color: 'var(--brand-accent)' },
                { label: 'Active', value: gs.active || 0, color: '#d97706' },
                { label: 'Complete', value: gs.completed || 0, color: '#16a34a' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
            {gs.avgProgress !== undefined && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-muted)' }}>Avg Progress</span>
                  <span className="font-bold" style={{ color: 'var(--brand-accent)' }}>{gs.avgProgress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="h-full rounded-full" style={{ width: `${gs.avgProgress}%`, backgroundColor: 'var(--brand-accent)' }} />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Reports</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Submitted', value: rs.submitted || 0, color: '#d97706' },
                { label: 'Approved', value: rs.approved || 0, color: '#16a34a' },
                { label: 'Rejected', value: rs.rejected || 0, color: '#dc2626' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
