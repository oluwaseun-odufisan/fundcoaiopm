// src/pages/AdminReports.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Eye, Trash2, Search, CheckCircle, XCircle, BarChart2, RefreshCw, User, Calendar, Zap } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import io from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const USER_API_URL = import.meta.env.VITE_USER_API_URL || 'http://localhost:4001';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // empty = All Submitted + Reviewed
  const [viewingReport, setViewingReport] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, submitted: 0, reviewed: 0, aiGenerated: 0 });

  // Real-time socket
  useEffect(() => {
    const socket = io(USER_API_URL, { auth: { token: localStorage.getItem('adminToken') } });
    socket.on('newReport', (report) => {
      if (['submitted', 'reviewed'].includes(report.status)) {
        setReports(prev => [report, ...prev]);
        toast.success('New report received!');
      }
    });
    socket.on('reportReviewed', (data) => {
      setReports(prev => prev.map(r => r._id === data.reportId ? { ...r, status: 'reviewed', feedback: data.feedback } : r));
    });
    return () => socket.disconnect();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const [reportsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/reports`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/admin/reports/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setReports(reportsRes.data.reports || []);
      setFilteredReports(reportsRes.data.reports || []);
      setStats(statsRes.data.stats || { total: 0, submitted: 0, reviewed: 0, aiGenerated: 0 });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  // Filter logic
  useEffect(() => {
    let filtered = reports;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(q) || r.user?.name?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(r => r.status === statusFilter);
    } else {
      filtered = filtered.filter(r => ['submitted', 'reviewed'].includes(r.status)); // Default
    }
    setFilteredReports(filtered);
  }, [reports, searchQuery, statusFilter]);

  const handleReview = async (id) => {
    if (!feedback.trim()) return toast.error('Please add feedback');
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_BASE_URL}/api/admin/reports/${id}/review`, { feedback }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Feedback saved!');
      setViewingReport(null);
      setFeedback('');
      fetchReports();
    } catch (err) {
      toast.error('Failed to save feedback');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report permanently?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_BASE_URL}/api/admin/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Report deleted');
      fetchReports();
    } catch (err) {
      toast.error('Failed to delete report');
    }
  };

  return (
    <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl w-full min-h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-teal-600">Submitted Reports</h2>
        <button onClick={fetchReports} disabled={isLoading} className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-2xl hover:bg-teal-700">
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-teal-50 p-6 rounded-3xl">
          <p className="text-teal-600 text-sm">Submitted</p>
          <p className="text-4xl font-bold text-teal-700">{stats.submitted}</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl">
          <p className="text-emerald-600 text-sm">Reviewed</p>
          <p className="text-4xl font-bold text-emerald-700">{stats.reviewed}</p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 p-4 rounded-3xl border border-teal-200 focus:border-teal-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-4 rounded-3xl border border-teal-200 focus:border-teal-500 outline-none"
        >
          <option value="">All (Submitted + Reviewed)</option>
          <option value="submitted">Submitted Only</option>
          <option value="reviewed">Reviewed Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-teal-50">
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report._id} className="border-b hover:bg-teal-50">
                <td className="p-4 font-medium">{report.title}</td>
                <td className="p-4">{report.user?.name} ({report.user?.email})</td>
                <td className="p-4 capitalize">{report.reportType}</td>
                <td className="p-4">{new Date(report.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${report.status === 'reviewed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {report.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 flex justify-center gap-3">
                  <button onClick={() => setViewingReport(report)} className="p-2 hover:bg-teal-100 rounded-xl">
                    <Eye className="w-5 h-5 text-teal-600" />
                  </button>
                  <button onClick={() => handleDelete(report._id)} className="p-2 hover:bg-red-100 rounded-xl">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {viewingReport && (
          <motion.div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000]">
            <motion.div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-auto rounded-3xl p-8">
              <h3 className="text-2xl font-bold mb-2">{viewingReport.title}</h3>
              <p className="text-teal-600 mb-6">By {viewingReport.user?.name} • {viewingReport.reportType}</p>
              <div className="prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewingReport.content}</ReactMarkdown>
              </div>
              {viewingReport.feedback && (
                <div className="mt-8 p-6 bg-amber-50 rounded-2xl">
                  <p className="font-semibold text-amber-700 mb-2">Admin Feedback</p>
                  <p className="text-gray-700">{viewingReport.feedback}</p>
                </div>
              )}
              {viewingReport.status !== 'reviewed' && (
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add your feedback here..."
                  className="w-full h-32 p-4 mt-8 border border-teal-200 rounded-3xl"
                />
              )}
              <div className="flex gap-4 mt-8">
                {viewingReport.status !== 'reviewed' && (
                  <button onClick={() => handleReview(viewingReport._id)} className="flex-1 py-4 bg-teal-600 text-white rounded-2xl">
                    Save Feedback & Mark Reviewed
                  </button>
                )}
                <button onClick={() => setViewingReport(null)} className="flex-1 py-4 bg-gray-200 rounded-2xl">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminReports;