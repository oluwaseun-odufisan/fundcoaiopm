import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Loader2, Users, Award, TrendingUp, X } from 'lucide-react';

const LVL_C = { beginner: '#16a34a', intermediate: '#d97706', expert: '#7c3aed' };

const Training = () => {
  const { hasRole } = useAuth();
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [c, p, s] = await Promise.all([
          api.get('/learning/courses'), api.get('/learning/progress'), api.get('/learning/stats'),
        ]);
        setCourses(c.data.courses || []);
        setProgress(p.data.progress || []);
        setStats(s.data.stats || {});
      } catch { toast.error('Failed to load training data'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleCreateCourse = async (form) => {
    try {
      await api.post('/learning/courses', form);
      toast.success('Course created!');
      setShowCreate(false);
      const { data } = await api.get('/learning/courses');
      setCourses(data.courses || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-accent)' }} /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BookOpen className="w-6 h-6" style={{ color: 'var(--brand-accent)' }} /> Training
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Manage courses and track progress</p>
        </div>
        {hasRole('admin') && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: 'var(--brand-accent)' }}>
            <Plus className="w-4 h-4" /> Create Course
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { l: 'Total Courses', v: stats.totalCourses || 0, c: 'var(--brand-accent)', icon: BookOpen },
          { l: 'Enrollments', v: stats.enrolled || 0, c: '#3b82f6', icon: Users },
          { l: 'Completed', v: stats.completed || 0, c: '#16a34a', icon: Award },
          { l: 'Certified', v: stats.certified || 0, c: '#7c3aed', icon: Award },
          { l: 'Avg Progress', v: `${stats.avgProgress || 0}%`, c: '#d97706', icon: TrendingUp },
        ].map(s => (
          <div key={s.l} className="rounded-xl border p-3 flex items-center gap-2.5"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <s.icon className="w-5 h-5 flex-shrink-0" style={{ color: s.c }} />
            <div>
              <p className="text-lg font-black leading-none" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[10px] uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.l}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Courses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course, i) => {
          const lc = LVL_C[course.level] || '#64748b';
          const enrolledCount = progress.filter(p => String(p.courseId?._id || p.courseId) === String(course._id)).length;
          const completedCount = progress.filter(p => String(p.courseId?._id || p.courseId) === String(course._id) && p.progress === 100).length;
          return (
            <motion.div key={course._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .03 }}
              className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize" style={{ backgroundColor: `${lc}15`, color: lc }}>{course.level}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>{course.assetco}</span>
                {course.required && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-50 text-red-600">Required</span>}
              </div>
              <h3 className="font-bold text-sm mb-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>{course.title}</h3>
              <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>{course.description}</p>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>{course.modules?.length || 0} modules</span>
                <span>{enrolledCount} enrolled</span>
                <span className="text-green-600">{completedCount} completed</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* User Progress Table */}
      {progress.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>User Progress ({progress.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>User</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Course</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Progress</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Exam</th>
                  <th className="text-center px-4 py-3 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Cert</th>
                </tr>
              </thead>
              <tbody>
                {progress.slice(0, 50).map(p => (
                  <tr key={p._id} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {p.userId?.firstName} {p.userId?.lastName}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>{p.courseId?.title || '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="font-bold" style={{ color: p.progress === 100 ? '#16a34a' : 'var(--brand-accent)' }}>{p.progress}%</span>
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ color: 'var(--text-secondary)' }}>{p.bestExamScore || '—'}%</td>
                    <td className="px-4 py-2.5 text-center">{p.certificationEarned ? '🏅' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCreate(false)} />
          <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>Create Course</h2>
              <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
            </div>
            <CourseForm onSubmit={handleCreateCourse} />
          </motion.div>
        </>
      )}
    </div>
  );
};

const CourseForm = ({ onSubmit }) => {
  const [f, setF] = useState({ title: '', description: '', level: 'beginner', assetco: 'General', required: false, passingScore: 70, tags: '' });
  return (
    <div className="space-y-4">
      <input value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} placeholder="Course title *"
        className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
      <textarea value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Description"
        className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
      <div className="grid grid-cols-2 gap-3">
        <select value={f.level} onChange={e => setF(p => ({ ...p, level: e.target.value }))}
          className="px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
          {['beginner', 'intermediate', 'expert'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <input value={f.assetco} onChange={e => setF(p => ({ ...p, assetco: e.target.value }))} placeholder="Department"
          className="px-3 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-primary)' }}>
          <input type="checkbox" checked={f.required} onChange={e => setF(p => ({ ...p, required: e.target.checked }))} style={{ accentColor: 'var(--brand-accent)' }} />
          Required course
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Pass:</span>
          <input type="number" value={f.passingScore} onChange={e => setF(p => ({ ...p, passingScore: Number(e.target.value) }))}
            className="w-16 px-2 py-1 rounded-lg border text-sm" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>%</span>
        </div>
      </div>
      <button onClick={() => { if (!f.title) return toast.error('Title required'); onSubmit({ ...f, tags: f.tags.split(',').map(t => t.trim()).filter(Boolean) }); }}
        className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-accent)' }}>Create Course</button>
    </div>
  );
};

export default Training;
