// components/TaskItem.jsx — UPDATED: displays admin comments, assignedBy info, review notification
import React, { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, MoreVertical, Check, Trash2, MessageSquare, Shield } from 'lucide-react';
import axios from 'axios';
import { format, isToday, isPast } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/tasks`
  : 'http://localhost:4000/api/tasks';

const PRIORITY_CONFIG = {
  urgent: { bg: '#fef2f2', text: '#dc2626', border: '#dc2626', dot: '#dc2626' },
  high:   { bg: '#fff7ed', text: '#ea580c', border: '#ea580c', dot: '#ea580c' },
  medium: { bg: '#fefce8', text: '#ca8a04', border: '#ca8a04', dot: '#ca8a04' },
  low:    { bg: '#f0f9ff', text: '#0369a1', border: '#e2e8f0', dot: '#94a3b8' },
};

const getPriority = (p) => PRIORITY_CONFIG[p?.toLowerCase()] || PRIORITY_CONFIG.low;

const SUBMISSION_LABELS = {
  submitted: { label: 'Submitted', bg: '#fff7ed', text: '#c2410c' },
  approved:  { label: 'Approved',  bg: '#f0fdf4', text: '#15803d' },
  rejected:  { label: 'Rejected',  bg: '#fef2f2', text: '#dc2626' },
};

const TaskItem = ({ task, onRefresh, showCompleteCheckbox = true, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isCompleted, setIsCompleted] = useState(
    [true, 1, 'yes'].includes(
      typeof task.completed === 'string' ? task.completed.toLowerCase() : task.completed
    )
  );
  const [showHover, setShowHover] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    setIsCompleted(
      [true, 1, 'yes'].includes(
        typeof task.completed === 'string' ? task.completed.toLowerCase() : task.completed
      )
    );
  }, [task.completed]);

  const pConfig = getPriority(task.priority);
  const progress = task.checklist?.length
    ? Math.round((task.checklist.filter((i) => i.completed).length / task.checklist.length) * 100)
    : isCompleted ? 100 : 0;
  const subLabel = SUBMISSION_LABELS[task.submissionStatus];
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isCompleted;
  const hasAdminComments = task.adminComments?.length > 0;
  const assignedByName = task.assignedBy
    ? `${task.assignedBy.firstName || ''} ${task.assignedBy.lastName || ''}`.trim()
    : null;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token found');
    return { Authorization: `Bearer ${token}` };
  };

  const handleComplete = async (e) => {
    e.stopPropagation();
    const newVal = !isCompleted;
    if (newVal && (!task.checklist || task.checklist.length === 0)) {
      setShowErrorModal(true);
      return;
    }
    try {
      const payload = newVal
        ? (task.checklist?.length ? { checklist: task.checklist.map((i) => ({ ...i, completed: true })) } : { completed: 'Yes' })
        : (task.checklist?.length ? { checklist: task.checklist.map((i) => ({ ...i, completed: false })) } : { completed: 'No' });
      await axios.put(`${API_BASE}/${task._id}/gp`, payload, { headers: getAuthHeaders() });
      setIsCompleted(newVal);
      onRefresh?.();
    } catch (err) {
      if (err.response?.status === 401) onLogout?.();
    }
  };

  const handleAction = async (action, e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (action === 'delete') {
      try {
        await axios.delete(`${API_BASE}/${task._id}/gp`, { headers: getAuthHeaders() });
        onRefresh?.();
      } catch (err) { if (err.response?.status === 401) onLogout?.(); }
    }
    if (action === 'submit') {
      if (!task.checklist || task.checklist.length === 0) { setShowErrorModal(true); return; }
      try {
        await axios.post(`${API_BASE}/${task._id}/submit`, {}, { headers: getAuthHeaders() });
        onRefresh?.();
      } catch (err) { if (err.response?.status === 401) onLogout?.(); }
    }
  };

  return (
    <div
      className="relative rounded-xl border overflow-hidden transition-all hover:shadow-md cursor-pointer"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        borderLeftWidth: '3px',
        borderLeftColor: isCompleted ? '#16a34a' : pConfig.border,
      }}
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {showCompleteCheckbox && (
            <button onClick={handleComplete} className="mt-0.5 flex-shrink-0 transition-colors">
              <CheckCircle2 className={`w-5 h-5 transition-colors ${isCompleted ? 'fill-green-500 text-green-500' : 'text-[var(--text-muted)] hover:text-green-500'}`} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-sm font-semibold leading-snug truncate ${isCompleted ? 'line-through' : ''}`}
                style={{ color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                {task.title}
              </h3>
              <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowMenu((p) => !p)} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute top-7 right-0 w-48 rounded-xl shadow-xl py-1 z-50 border"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {isCompleted && task.submissionStatus === 'not_submitted' && (
                      <button onClick={(e) => handleAction('submit', e)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm" style={{ color: '#c2410c' }}>
                        <Check className="w-4 h-4" /> Submit for Approval
                      </button>
                    )}
                    <button onClick={(e) => handleAction('delete', e)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600">
                      <Trash2 className="w-4 h-4" /> Delete Task
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md"
                style={{ backgroundColor: pConfig.bg, color: pConfig.text }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: pConfig.dot }} />
                {task.priority || 'Low'}
              </span>
              {subLabel && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: subLabel.bg, color: subLabel.text }}>{subLabel.label}</span>
              )}
              {isOverdue && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-50 text-red-600">Overdue</span>
              )}
              {/* NEW: Admin assigned badge */}
              {task.createdByAdmin && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>
                  <Shield className="w-3 h-3" /> Admin Assigned
                </span>
              )}
              {/* NEW: Admin comments indicator */}
              {hasAdminComments && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: 'rgba(147,51,234,0.08)', color: '#7c3aed' }}>
                  <MessageSquare className="w-3 h-3" /> {task.adminComments.length} note{task.adminComments.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* NEW: Assigned by info */}
            {assignedByName && (
              <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Shield className="w-3 h-3" /> Assigned by {assignedByName}
              </p>
            )}

            {task.description && (
              <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {task.checklist?.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Progress</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#16a34a' : 'var(--brand-primary)' }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-500 font-semibold' : ''}`}
            style={{ color: isOverdue ? '#dc2626' : 'var(--text-muted)' }}>
            <CalendarDays className="w-3.5 h-3.5" />
            {task.dueDate ? isToday(new Date(task.dueDate)) ? 'Due Today' : format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No due date'}
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-3.5 h-3.5" />
            {task.createdAt ? format(new Date(task.createdAt), 'MMM dd') : '—'}
          </div>
        </div>
      </div>

      {/* Hover detail with admin comments section */}
      {showHover && (task.description || task.checklist?.length > 0 || hasAdminComments) && (
        <div className="absolute inset-0 rounded-xl p-4 overflow-y-auto z-20 border shadow-xl"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          onMouseLeave={() => setShowHover(false)}>
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-bold text-sm pr-4 line-clamp-2" style={{ color: 'var(--text-primary)' }}>{task.title}</h4>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md flex-shrink-0"
              style={{ backgroundColor: pConfig.bg, color: pConfig.text }}>{task.priority}</span>
          </div>
          {task.description && (
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Description</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{task.description}</p>
            </div>
          )}
          {task.checklist?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Checklist ({task.checklist.filter((i) => i.completed).length}/{task.checklist.length})
              </p>
              <ul className="space-y-1.5">
                {task.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.completed ? 'text-green-500 fill-green-500' : 'text-[var(--text-muted)]'}`} />
                    <span className={`text-sm ${item.completed ? 'line-through' : ''}`}
                      style={{ color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* NEW: Admin Comments section in hover */}
          {hasAdminComments && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1"
                style={{ color: '#7c3aed' }}>
                <Shield className="w-3 h-3" /> Admin Notes
              </p>
              <div className="space-y-2">
                {task.adminComments.map((c, idx) => (
                  <div key={idx} className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(147,51,234,0.05)', border: '1px solid rgba(147,51,234,0.15)' }}>
                    <p className="text-xs font-bold" style={{ color: '#7c3aed' }}>
                      {c.user?.firstName || 'Admin'} {c.user?.lastName || ''}
                      {c.user?.role && c.user.role !== 'standard' && (
                        <span className="ml-1 text-[10px] font-normal opacity-70">({c.user.role})</span>
                      )}
                    </p>
                    <p className="text-sm mt-0.5 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{c.content}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      {c.createdAt ? format(new Date(c.createdAt), 'MMM dd, yyyy h:mm a') : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
            <span>Created {task.createdAt ? format(new Date(task.createdAt), 'MMM dd, yyyy') : '—'}</span>
            <span>Due {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'None'}</span>
          </div>
        </div>
      )}

      {/* Checklist error modal */}
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[1200] p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }} onClick={() => setShowErrorModal(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl">⚠️</div>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Checklist Required</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Please add a checklist first.<br />A checklist is required as it shows the process breakdown of how the task will be achieved.
              </p>
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => setShowErrorModal(false)}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
