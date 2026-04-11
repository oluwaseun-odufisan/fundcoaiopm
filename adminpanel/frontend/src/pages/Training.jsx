//Training.jsx
import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Search, X, Users, Award, TrendingUp, CheckCircle2 } from 'lucide-react';

const LVL = { beginner: { c: '#059669', bg: '#ecfdf5' }, intermediate: { c: '#d97706', bg: '#fffbeb' }, expert: { c: '#7c3aed', bg: '#f5f3ff' } };

const Training = () => {
  const { hasRole } = useAuth();
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/learning/courses'), api.get('/learning/progress'), api.get('/learning/stats')])
      .then(([c, p, s]) => { setCourses(c.data.courses || []); setProgress(p.data.progress || []); setStats(s.data.stats || {}); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (form) => {
    try {
      await api.post('/learning/courses', form);
      toast.success('Course created!');
      setShowCreate(false);
      const { data } = await api.get('/learning/courses');
      setCourses(data.courses || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const filtered = courses.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>Training</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--c-text-2)' }}>Manage courses and track team progress</p>
        </div>
        {hasRole('admin') && (
          <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" /> Create Course</button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { l: 'Courses', v: stats.totalCourses || 0, c: 'var(--c-accent)', icon: BookOpen },
          { l: 'Enrollments', v: stats.enrolled || 0, c: '#2563eb', icon: Users },
          { l: 'Completed', v: stats.completed || 0, c: '#059669', icon: CheckCircle2 },
          { l: 'Certified', v: stats.certified || 0, c: '#7c3aed', icon: Award },
          { l: 'Avg Progress', v: `${stats.avgProgress || 0}%`, c: '#d97706', icon: TrendingUp },
        ].map(s => (
          <div key={s.l} className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.c}12` }}>
              <s.icon className="w-4 h-4" style={{ color: s.c }} />
            </div>
            <div>
              <p className="stat-value text-[18px]" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--c-text-3)' }}>{s.l}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-text-3)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses…"
          className="input-base" style={{ paddingLeft: 38 }} />
      </div>

      {/* Courses grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((course, i) => {
          const lv = LVL[course.level] || LVL.beginner;
          const enrolled = progress.filter(p => String(p.courseId?._id || p.courseId) === String(course._id)).length;
          const completed = progress.filter(p => String(p.courseId?._id || p.courseId) === String(course._id) && p.progress === 100).length;

          return (
            <motion.div key={course._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card p-5">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="badge capitalize" style={{ background: lv.bg, color: lv.c }}>{course.level}</span>
                <span className="badge" style={{ background: 'var(--c-surface-raised)', color: 'var(--c-text-2)' }}>{course.assetco}</span>
                {course.required && <span className="badge" style={{ background: '#fef2f2', color: '#dc2626' }}>Required</span>}
              </div>
              <h3 className="text-[14px] font-bold line-clamp-2 mb-1" style={{ color: 'var(--c-text-0)' }}>{course.title}</h3>
              {course.description && (
                <p className="text-[12px] line-clamp-2 mb-3" style={{ color: 'var(--c-text-2)' }}>{course.description}</p>
              )}
              <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--c-text-3)' }}>
                <span>{course.modules?.length || 0} modules</span>
                <span>{enrolled} enrolled</span>
                <span style={{ color: '#059669' }}>{completed} completed</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress table */}
      {progress.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
            <p className="text-[15px] font-bold" style={{ color: 'var(--c-text-0)' }}>Learner Progress ({progress.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">User</th>
                  <th className="table-header">Course</th>
                  <th className="table-header text-right">Progress</th>
                  <th className="table-header text-right">Best Exam</th>
                  <th className="table-header text-center">Certified</th>
                </tr>
              </thead>
              <tbody>
                {progress.slice(0, 50).map(p => (
                  <tr key={p._id} className="table-row">
                    <td className="table-cell font-medium" style={{ color: 'var(--c-text-0)' }}>
                      {p.userId?.firstName} {p.userId?.lastName}
                    </td>
                    <td className="table-cell" style={{ color: 'var(--c-text-2)' }}>{p.courseId?.title || '—'}</td>
                    <td className="table-cell text-right">
                      <span className="font-bold" style={{ color: p.progress === 100 ? '#059669' : 'var(--c-accent)' }}>{p.progress}%</span>
                    </td>
                    <td className="table-cell text-right" style={{ color: 'var(--c-text-2)' }}>{p.bestExamScore || '—'}%</td>
                    <td className="table-cell text-center">{p.certificationEarned ? '🏅' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl p-6"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-xl)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--c-text-0)' }}>Create Course</h2>
                <button onClick={() => setShowCreate(false)} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
              </div>
              <CourseForm onSubmit={handleCreate} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const CourseForm = ({ onSubmit }) => {
  const [f, setF] = useState({ title: '', description: '', level: 'beginner', assetco: 'General', required: false, passingScore: 70 });
  return (
    <div className="space-y-4">
      <div><label className="label">Course Title</label>
        <input value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} className="input-base" placeholder="Course title" /></div>
      <div><label className="label">Description</label>
        <textarea value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} className="input-base" rows={3} style={{ resize: 'vertical' }} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Level</label>
          <select value={f.level} onChange={e => setF(p => ({ ...p, level: e.target.value }))} className="input-base">
            {['beginner', 'intermediate', 'expert'].map(l => <option key={l} value={l}>{l}</option>)}
          </select></div>
        <div><label className="label">Department</label>
          <input value={f.assetco} onChange={e => setF(p => ({ ...p, assetco: e.target.value }))} className="input-base" /></div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: 'var(--c-text-0)' }}>
          <input type="checkbox" checked={f.required} onChange={e => setF(p => ({ ...p, required: e.target.checked }))}
            style={{ accentColor: 'var(--c-accent)', width: 16, height: 16 }} /> Required
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[12px]" style={{ color: 'var(--c-text-3)' }}>Pass score:</span>
          <input type="number" value={f.passingScore} onChange={e => setF(p => ({ ...p, passingScore: Number(e.target.value) }))}
            className="input-base" style={{ width: 64, padding: '6px 10px' }} />
          <span className="text-[12px]" style={{ color: 'var(--c-text-3)' }}>%</span>
        </div>
      </div>
      <button onClick={() => { if (!f.title) return toast.error('Title required'); onSubmit(f); }}
        className="btn-primary w-full" style={{ height: 44 }}>Create Course</button>
    </div>
  );
};

export default Training;
