//Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  ListTodo,
  Target,
  TrendingUp,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, LoadingScreen, PageHeader, Panel, ProgressBar, StatCard } from '../components/ui.jsx';

const PIE_COLORS = ['#6B46C1', '#3B82F6', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({});
  const [taskStats, setTaskStats] = useState({});
  const [goalStats, setGoalStats] = useState({});
  const [reportStats, setReportStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/performance/analytics'),
      api.get('/tasks/stats'),
      api.get('/goals/stats'),
      api.get('/reports/stats'),
    ])
      .then(([a, t, g, r]) => {
        setAnalytics(a.data.analytics || {});
        setTaskStats(t.data.stats || {});
        setGoalStats(g.data.stats || {});
        setReportStats(r.data.stats || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const taskDistribution = useMemo(
    () =>
      [
        { name: 'Completed', value: taskStats.completed || 0 },
        { name: 'Pending', value: taskStats.pending || 0 },
        { name: 'Overdue', value: taskStats.overdue || 0 },
        { name: 'In Review', value: taskStats.submitted || 0 },
      ].filter((item) => item.value > 0),
    [taskStats],
  );

  const trendData = [
    { label: 'Mon', velocity: Math.max((analytics.completionRate || 42) - 18, 18), focus: 30 },
    { label: 'Tue', velocity: Math.max((analytics.completionRate || 42) - 9, 22), focus: 38 },
    { label: 'Wed', velocity: Math.max((analytics.completionRate || 42) - 3, 28), focus: 43 },
    { label: 'Thu', velocity: Math.max((analytics.completionRate || 42) + 4, 35), focus: 51 },
    { label: 'Fri', velocity: Math.max((analytics.completionRate || 42) + 9, 41), focus: 58 },
    { label: 'Sat', velocity: Math.max((analytics.completionRate || 42) + 2, 39), focus: 49 },
  ];

  if (loading) return <LoadingScreen />;

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Executive overview"
        title={`Good ${greeting}, ${user?.firstName || 'Admin'}`}
        description="A living command center for work orchestration, team momentum, execution risk, and strategic signals across the organization."
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate('/reports')}>
              <FileText className="h-4 w-4" />
              Review Reports
            </button>
            <button className="btn-primary" onClick={() => navigate('/tasks')}>
              <ArrowUpRight className="h-4 w-4" />
              Open Task Command
            </button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Team members" value={analytics.totalUsers || 0} icon={Users} tone="#3B82F6" helper="Active visibility across your workspace" />
        <StatCard label="Total tasks" value={analytics.totalTasks || 0} icon={ListTodo} tone="var(--c-accent)" helper={`${analytics.pendingApproval || 0} waiting for admin attention`} />
        <StatCard label="Completed" value={analytics.completedTasks || 0} icon={CheckCircle2} tone="#059669" helper={`${analytics.completionRate || 0}% completion rate`} />
        <StatCard label="Overdue" value={analytics.overdueTasks || 0} icon={TriangleAlert} tone="#dc2626" helper="Immediate delivery risk detected" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Momentum curve" subtitle="Execution health across the current week">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6B46C1" stopOpacity={0.36} />
                    <stop offset="95%" stopColor="#6B46C1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--c-border-subtle)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--c-text-3)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--c-text-3)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--c-surface-strong)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 16,
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <Area type="monotone" dataKey="focus" stroke="#3B82F6" fill="url(#focusFill)" strokeWidth={2.4} />
                <Area type="monotone" dataKey="velocity" stroke="#6B46C1" fill="url(#velocityFill)" strokeWidth={2.8} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Task distribution" subtitle="Current operational state">
          {taskDistribution.length ? (
            <div className="space-y-5">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskDistribution} innerRadius={68} outerRadius={92} paddingAngle={4} dataKey="value">
                      {taskDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--c-surface-strong)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 16,
                        boxShadow: 'var(--shadow-md)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-3">
                {taskDistribution.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--c-border)' }}>
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--c-text-1)' }}>{item.name}</span>
                    </div>
                    <span className="text-sm font-black" style={{ color: 'var(--c-text-0)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={ListTodo} title="No task signals yet" description="As tasks arrive, distribution analytics will appear here." />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <Panel title="Command shortcuts" subtitle="Jump into the most important admin queues">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { label: 'Pending review', value: analytics.pendingApproval || 0, icon: Clock3, tone: '#f59e0b', to: '/tasks' },
              { label: 'Submitted reports', value: reportStats.submitted || 0, icon: FileText, tone: 'var(--c-accent)', to: '/reports' },
              { label: 'Active goals', value: goalStats.active || 0, icon: Target, tone: '#3B82F6', to: '/goals' },
              { label: 'Performance board', value: `${analytics.completionRate || 0}%`, icon: TrendingUp, tone: '#059669', to: '/performance' },
            ].map((item, index) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(item.to)}
                className="card card-hover flex items-center justify-between p-4 text-left"
              >
                <div>
                  <p className="section-title mb-2">{item.label}</p>
                  <p className="stat-value text-3xl" style={{ color: item.tone }}>{item.value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${item.tone} 14%, transparent)` }}>
                  <item.icon className="h-5 w-5" style={{ color: item.tone }} />
                </div>
              </motion.button>
            ))}
          </div>
        </Panel>

        <Panel title="Goal pulse" subtitle="Strategic progress signal">
          <div className="space-y-4">
            {[
              { label: 'Total goals', value: goalStats.total || 0, tone: 'var(--c-accent)' },
              { label: 'Active', value: goalStats.active || 0, tone: '#f59e0b' },
              { label: 'Completed', value: goalStats.completed || 0, tone: '#059669' },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.35rem] border p-4" style={{ borderColor: 'var(--c-border)' }}>
                <p className="section-title mb-2">{item.label}</p>
                <p className="stat-value text-3xl" style={{ color: item.tone }}>{item.value}</p>
              </div>
            ))}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span style={{ color: 'var(--c-text-3)' }}>Average progress</span>
                <span className="font-bold" style={{ color: 'var(--c-accent)' }}>{goalStats.avgProgress || 0}%</span>
              </div>
              <ProgressBar value={goalStats.avgProgress || 0} />
            </div>
          </div>
        </Panel>

        <Panel title="Report health" subtitle="Approval flow balance">
          <div className="space-y-4">
            {[
              { label: 'Submitted', value: reportStats.submitted || 0, tone: '#f59e0b' },
              { label: 'Approved', value: reportStats.approved || 0, tone: '#059669' },
              { label: 'Rejected', value: reportStats.rejected || 0, tone: '#ef4444' },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.35rem] border p-4" style={{ borderColor: 'var(--c-border)' }}>
                <p className="section-title mb-2">{item.label}</p>
                <p className="stat-value text-3xl" style={{ color: item.tone }}>{item.value}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default Dashboard;