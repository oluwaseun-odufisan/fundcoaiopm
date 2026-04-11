//Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { motion } from 'framer-motion';
import { Users, ListTodo, CheckCircle2, AlertTriangle, Clock, Target, FileText, TrendingUp, Send, ArrowUpRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Stat = ({ label, value, icon: Icon, accent, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }}
    className="card p-5 flex items-start justify-between">
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--c-text-3)' }}>{label}</p>
      <p className="stat-value" style={{ color: accent }}>{value}</p>
    </div>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}12` }}>
      <Icon className="w-5 h-5" style={{ color: accent }} />
    </div>
  </motion.div>
);

const QuickLink = ({ label, to, count, accent }) => {
  const nav = useNavigate();
  return (
    <button onClick={() => nav(to)}
      className="card card-hover p-4 flex items-center justify-between w-full text-left group">
      <div>
        <p className="text-[13px] font-semibold" style={{ color: 'var(--c-text-0)' }}>{label}</p>
        {count != null && <p className="text-[24px] font-extrabold mt-1" style={{ color: accent }}>{count}</p>}
      </div>
      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--c-text-3)' }} />
    </button>
  );
};

const COLORS = ['#059669', '#d97706', '#dc2626', '#2563eb'];

const Dashboard = () => {
  const { user } = useAuth();
  const [a, setA] = useState({});
  const [ts, setTs] = useState({});
  const [gs, setGs] = useState({});
  const [rs, setRs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/performance/analytics'), api.get('/tasks/stats'), api.get('/goals/stats'), api.get('/reports/stats')])
      .then(([a, t, g, r]) => { setA(a.data.analytics || {}); setTs(t.data.stats || {}); setGs(g.data.stats || {}); setRs(r.data.stats || {}); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="w-8 h-8 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  const pieData = [
    { name: 'Completed', value: ts.completed || 0 },
    { name: 'Pending', value: ts.pending || 0 },
    { name: 'Overdue', value: ts.overdue || 0 },
    { name: 'In Review', value: ts.submitted || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName}
        </motion.h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--c-text-2)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Team Members" value={a.totalUsers || 0} icon={Users} accent="#2563eb" delay={0} />
        <Stat label="Total Tasks" value={a.totalTasks || 0} icon={ListTodo} accent="#7c3aed" delay={0.05} />
        <Stat label="Completed" value={a.completedTasks || 0} icon={CheckCircle2} accent="#059669" delay={0.1} />
        <Stat label="Overdue" value={a.overdueTasks || 0} icon={AlertTriangle} accent="#dc2626" delay={0.15} />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pie chart */}
        <div className="card p-6 lg:col-span-1">
          <p className="section-title mb-4">Task Distribution</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}
                  style={{ fontSize: 11, fontWeight: 600, fill: 'var(--c-text-2)' }}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-[13px]" style={{ color: 'var(--c-text-3)' }}>No task data yet</p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-6 lg:col-span-2">
          <p className="section-title mb-4">Quick Overview</p>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink label="Pending Review" to="/tasks" count={a.pendingApproval || 0} accent="#d97706" />
            <QuickLink label="Report Submissions" to="/reports" count={rs.submitted || 0} accent="#7c3aed" />
            <QuickLink label="Active Goals" to="/goals" count={gs.active || 0} accent="#2563eb" />
            <QuickLink label="Completion Rate" to="/performance" count={`${a.completionRate || 0}%`} accent="#059669" />
          </div>
        </div>
      </div>

      {/* Goals + Reports summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <p className="section-title mb-4">Goals Summary</p>
          <div className="grid grid-cols-3 gap-3">
            {[{ l: 'Total', v: gs.total || 0, c: 'var(--c-accent)' }, { l: 'Active', v: gs.active || 0, c: '#d97706' }, { l: 'Complete', v: gs.completed || 0, c: '#059669' }].map(s => (
              <div key={s.l} className="text-center p-4 rounded-xl" style={{ background: 'var(--c-surface-raised)' }}>
                <p className="stat-value text-[22px]" style={{ color: s.c }}>{s.v}</p>
                <p className="text-[11px] font-medium mt-1" style={{ color: 'var(--c-text-3)' }}>{s.l}</p>
              </div>
            ))}
          </div>
          {gs.avgProgress != null && (
            <div className="mt-4">
              <div className="flex justify-between text-[12px] mb-1.5">
                <span style={{ color: 'var(--c-text-3)' }}>Average progress</span>
                <span className="font-semibold" style={{ color: 'var(--c-accent)' }}>{gs.avgProgress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--c-surface-sunken)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${gs.avgProgress}%`, background: 'var(--c-accent)' }} />
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <p className="section-title mb-4">Reports</p>
          <div className="grid grid-cols-3 gap-3">
            {[{ l: 'Pending', v: rs.submitted || 0, c: '#d97706' }, { l: 'Approved', v: rs.approved || 0, c: '#059669' }, { l: 'Rejected', v: rs.rejected || 0, c: '#dc2626' }].map(s => (
              <div key={s.l} className="text-center p-4 rounded-xl" style={{ background: 'var(--c-surface-raised)' }}>
                <p className="stat-value text-[22px]" style={{ color: s.c }}>{s.v}</p>
                <p className="text-[11px] font-medium mt-1" style={{ color: 'var(--c-text-3)' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
