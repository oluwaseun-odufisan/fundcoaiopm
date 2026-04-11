//Reports.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { FileText, Search, X, Send, CheckCircle2, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';

const ST = { submitted: { c: '#d97706', bg: '#fffbeb' }, approved: { c: '#059669', bg: '#ecfdf5' }, rejected: { c: '#dc2626', bg: '#fef2f2' } };

const Reports = () => {
  const [reports, setReports] = useState([]); const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null); const [stats, setStats] = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try { const p = {}; if (filter) p.status = filter; if (search) p.search = search;
      const [r, s] = await Promise.all([api.get('/reports', { params: p }), api.get('/reports/stats')]);
      setReports(r.data.reports || []); setStats(s.data.stats || {}); } catch { toast.error('Failed'); } finally { setLoading(false); }
  }, [filter, search]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const review = async (id, action, feedback = '') => {
    try { await api.post(`/reports/${id}/review`, { action, feedback }); toast.success(`Report ${action}`); fetchAll(); setViewing(null); }
    catch(e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const addNote = async (id, content) => {
    try { await api.post(`/reports/${id}/note`, { content }); toast.success('Note added'); fetchAll(); setViewing(null); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>Reports</h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--c-text-2)' }}>Review and manage submitted reports</p></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ l: 'Pending', v: stats.submitted||0, c: '#d97706' }, { l: 'Approved', v: stats.approved||0, c: '#059669' }, { l: 'Rejected', v: stats.rejected||0, c: '#dc2626' }, { l: 'Total', v: stats.total||0, c: 'var(--c-accent)' }].map(s => (
          <div key={s.l} className="card p-4"><p className="stat-value text-[20px]" style={{ color: s.c }}>{s.v}</p><p className="text-[11px] font-medium mt-1" style={{ color: 'var(--c-text-3)' }}>{s.l}</p></div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-text-3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports…" className="input-base" style={{ paddingLeft: 38 }} /></div>
        <div className="flex gap-1.5">{['', 'submitted', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="px-3 py-2 rounded-lg text-[12px] font-semibold capitalize"
            style={filter === f ? { background: 'var(--c-accent)', color: 'white' } : { background: 'var(--c-surface)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>{f || 'All'}</button>
        ))}</div>
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-7 h-7 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} /></div>
      : reports.length === 0 ? <div className="card text-center py-20"><FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--c-text-3)' }} /><p className="text-[15px] font-semibold" style={{ color: 'var(--c-text-1)' }}>No reports found</p></div>
      : <div className="card overflow-hidden">{reports.map((r, i) => {
          const st = ST[r.status] || ST.submitted; const userName = r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Unknown';
          return (
            <div key={r._id} onClick={() => setViewing(r)} className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer table-row" style={{ borderBottom: '1px solid var(--c-border-subtle)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--c-text-0)' }}>{r.title}</p>
                  <span className="badge capitalize" style={{ background: st.bg, color: st.c }}>{r.status}</span>
                  {r.aiGenerated && <span className="badge" style={{ background: '#eff6ff', color: '#2563eb' }}>AI</span>}
                </div>
                <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--c-text-3)' }}><span>{userName}</span><span className="capitalize">{r.reportType}</span>
                  {r.submittedAt && <span>{format(new Date(r.submittedAt), 'MMM d, yyyy')}</span>}</div>
              </div>
              {r.status === 'submitted' && <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => review(r._id, 'approved')} className="btn-ghost p-1.5" style={{ color: '#059669', background: '#ecfdf5' }}><ThumbsUp className="w-4 h-4" /></button>
                <button onClick={() => review(r._id, 'rejected')} className="btn-ghost p-1.5" style={{ color: '#dc2626', background: '#fef2f2' }}><ThumbsDown className="w-4 h-4" /></button>
              </div>}
            </div>
          );
        })}</div>}

      <AnimatePresence>{viewing && <ReportView report={viewing} onClose={() => setViewing(null)} onReview={review} onAddNote={addNote} />}</AnimatePresence>
    </div>
  );
};

const ReportView = ({ report, onClose, onReview, onAddNote }) => {
  const [note, setNote] = useState(''); const [fb, setFb] = useState('');
  const userName = report.user ? `${report.user.firstName} ${report.user.lastName}` : 'Unknown';
  return (<>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-3xl max-h-[88vh] rounded-2xl flex flex-col overflow-hidden"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-xl)' }}>
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="min-w-0"><h3 className="text-[16px] font-bold truncate" style={{ color: 'var(--c-text-0)' }}>{report.title}</h3>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--c-text-3)' }}>By {userName} · {report.reportType}</p></div>
        <button onClick={onClose} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="prose prose-sm max-w-none" style={{ color: 'var(--c-text-0)' }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content}</ReactMarkdown></div>
        {report.feedback && <div className="p-4 rounded-xl" style={{ background: 'var(--c-warning-bg)', border: '1px solid #fbbf24' }}>
          <p className="text-[13px] font-semibold mb-1" style={{ color: '#92400e' }}>Admin Feedback</p><p className="text-[13px]" style={{ color: 'var(--c-text-1)' }}>{report.feedback}</p></div>}
        {report.adminNotes?.length > 0 && <div><p className="section-title mb-2">Admin Notes</p>{report.adminNotes.map((n, i) => (
          <div key={i} className="p-3 rounded-xl mb-2" style={{ background: 'var(--c-surface-raised)' }}><p className="text-[12px] font-semibold" style={{ color: 'var(--c-accent)' }}>{n.user?.firstName} {n.user?.lastName}</p><p className="text-[13px] mt-1">{n.content}</p></div>
        ))}</div>}
        <div><p className="section-title mb-2">Add Note</p><div className="flex gap-2"><input value={note} onChange={e => setNote(e.target.value)} className="input-base" placeholder="Write a note…" />
          <button onClick={() => { if (note.trim()) { onAddNote(report._id, note.trim()); setNote(''); } }} className="btn-primary flex-shrink-0 px-4"><Send className="w-4 h-4" /></button></div></div>
        {report.status === 'submitted' && <div className="space-y-3 pt-2">
          <textarea value={fb} onChange={e => setFb(e.target.value)} rows={2} placeholder="Optional feedback…" className="input-base" style={{ resize: 'vertical' }} />
          <div className="flex gap-3">
            <button onClick={() => onReview(report._id, 'approved', fb)} className="flex-1 btn-primary" style={{ background: '#059669' }}><CheckCircle2 className="w-4 h-4" /> Approve</button>
            <button onClick={() => onReview(report._id, 'rejected', fb)} className="flex-1 btn-danger"><X className="w-4 h-4" /> Reject</button>
          </div>
        </div>}
      </div>
    </motion.div>
  </>);
};

export default Reports;
