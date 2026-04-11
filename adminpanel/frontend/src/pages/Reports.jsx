import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import {
  FileText, Search, Eye, CheckCircle2, X, Send, Loader2,
  ThumbsUp, ThumbsDown, MessageSquare, Download,
} from 'lucide-react';

const STATUS_C = { submitted: { bg: 'rgba(217,119,6,.1)', c: '#d97706' }, approved: { bg: 'rgba(22,163,74,.1)', c: '#16a34a' }, rejected: { bg: 'rgba(220,38,38,.1)', c: '#dc2626' } };

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [stats, setStats] = useState({});

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const [r, s] = await Promise.all([api.get('/reports', { params }), api.get('/reports/stats')]);
      setReports(r.data.reports || []);
      setStats(s.data.stats || {});
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const review = async (id, action, feedback = '') => {
    try {
      await api.post(`/reports/${id}/review`, { action, feedback });
      toast.success(`Report ${action}`);
      fetch();
      setViewing(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <FileText className="w-6 h-6" style={{ color: 'var(--brand-accent)' }} /> Reports
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Review and manage submitted reports</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l: 'Pending Review', v: stats.submitted || 0, c: '#d97706' },
          { l: 'Approved', v: stats.approved || 0, c: '#16a34a' },
          { l: 'Rejected', v: stats.rejected || 0, c: '#dc2626' },
          { l: 'Total', v: stats.total || 0, c: 'var(--brand-accent)' },
        ].map(s => (
          <div key={s.l} className="rounded-xl border p-3 text-center" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <p className="text-xl font-black" style={{ color: s.c }}>{s.v}</p>
            <p className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports…"
            className="flex-1 bg-transparent text-sm focus:outline-none" style={{ color: 'var(--text-primary)' }} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          {['', 'submitted', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold" style={filter === f ? { backgroundColor: 'var(--brand-accent)', color: '#fff' } : { color: 'var(--text-secondary)' }}>
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-accent)' }} /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>No reports found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r, i) => {
            const st = STATUS_C[r.status] || STATUS_C.submitted;
            const userName = r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Unknown';
            return (
              <motion.div key={r._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .02 }}
                onClick={() => setViewing(r)}
                className="rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize" style={{ backgroundColor: st.bg, color: st.c }}>{r.status}</span>
                      {r.aiGenerated && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(59,130,246,.1)', color: '#3b82f6' }}>AI</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{userName}</span>
                      <span className="capitalize">{r.reportType}</span>
                      <span>{r.submittedAt ? format(new Date(r.submittedAt), 'MMM dd, yyyy') : ''}</span>
                    </div>
                  </div>
                  {r.status === 'submitted' && (
                    <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => review(r._id, 'approved')} className="p-2 rounded-lg" style={{ color: '#16a34a', backgroundColor: 'rgba(22,163,74,.08)' }}><ThumbsUp className="w-4 h-4" /></button>
                      <button onClick={() => review(r._id, 'rejected')} className="p-2 rounded-lg" style={{ color: '#dc2626', backgroundColor: 'rgba(220,38,38,.08)' }}><ThumbsDown className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* View modal */}
      <ReportViewModal report={viewing} onClose={() => setViewing(null)} onReview={review} onRefresh={fetch} />
    </div>
  );
};

const ReportViewModal = ({ report, onClose, onReview, onRefresh }) => {
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  if (!report) return null;

  const addNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await api.post(`/reports/${report._id}/note`, { content: note.trim() });
      toast.success('Note added'); setNote(''); onRefresh(); onClose();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const userName = report.user ? `${report.user.firstName} ${report.user.lastName}` : 'Unknown';

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <div className="min-w-0">
            <h3 className="font-black truncate" style={{ color: 'var(--text-primary)' }}>{report.title}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>By {userName} · {report.reportType}</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content}</ReactMarkdown>
          </div>

          {report.feedback && (
            <div className="p-4 rounded-xl border" style={{ backgroundColor: 'rgba(217,119,6,.05)', borderColor: 'rgba(217,119,6,.3)' }}>
              <p className="text-sm font-bold mb-1" style={{ color: '#b45309' }}>Admin Feedback</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{report.feedback}</p>
            </div>
          )}

          {/* Admin notes */}
          {report.adminNotes?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Notes</p>
              {report.adminNotes.map((n, i) => (
                <div key={i} className="p-3 rounded-xl mb-2" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <p className="text-xs font-bold" style={{ color: 'var(--brand-accent)' }}>{n.user?.firstName} {n.user?.lastName}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{n.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add note */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Add Note</p>
            <div className="flex gap-2">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Write a note…"
                className="flex-1 px-3 py-2.5 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
              <button onClick={addNote} disabled={saving || !note.trim()} className="px-4 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ backgroundColor: 'var(--brand-accent)' }}><Send className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Review actions */}
          {report.status === 'submitted' && (
            <div className="space-y-3 pt-2">
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={2} placeholder="Optional feedback for the user…"
                className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
              <div className="flex gap-3">
                <button onClick={() => onReview(report._id, 'approved', feedback)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#16a34a' }}>
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => onReview(report._id, 'rejected', feedback)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#dc2626' }}>
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Reports;
