//MyTeam.jsx
import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersRound, UserPlus, X, Search, Trash2, Check, Info, Mail, Briefcase } from 'lucide-react';

const MyTeam = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState({ members: [], name: 'My Team' });
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [t, u] = await Promise.all([api.get('/team'), api.get('/team/available-users')]);
      setTeam(t.data.team || { members: [], name: 'My Team' });
      setAllUsers(u.data.users || []);
    } catch { toast.error('Failed to load team data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const addMember = async (userId) => {
    try {
      const { data } = await api.post('/team/member', { userId });
      setTeam(data.team); toast.success('Member added to your team');
    } catch { toast.error('Failed to add member'); }
  };

  const removeMember = async (userId) => {
    try {
      const { data } = await api.delete(`/team/member/${userId}`);
      setTeam(data.team); toast.success('Member removed');
    } catch { toast.error('Failed to remove member'); }
  };

  const memberIds = new Set((team.members || []).map(m => m._id || m));
  const available = allUsers
    .filter(u => !memberIds.has(u._id) && u._id !== user?.id)
    .filter(u => !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  // Super Admin info
  if (user?.role === 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>My Team</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--c-text-2)' }}>Team configuration</p>
        </div>
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--c-accent-muted)' }}>
            <UsersRound className="w-7 h-7" style={{ color: 'var(--c-accent)' }} />
          </div>
          <h2 className="text-[18px] font-bold mb-2" style={{ color: 'var(--c-text-0)' }}>Full Organization Access</h2>
          <p className="text-[14px] max-w-md mx-auto" style={{ color: 'var(--c-text-2)' }}>
            As Super Admin, you automatically have visibility into all users, tasks, goals, and reports across the entire organization. No team filtering is applied.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>My Team</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--c-text-2)' }}>
            Select the team members you manage. All dashboard data filters to these users.
          </p>
        </div>
        <button onClick={() => setShowPicker(true)} className="btn-primary">
          <UserPlus className="w-4 h-4" /> Add Members
        </button>
      </div>

      {/* Info banner */}
      <div className="card p-4 flex items-start gap-3" style={{ background: 'var(--c-info-bg)', borderColor: 'var(--c-accent)' }}>
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--c-accent)' }} />
        <div>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--c-accent-text)' }}>How team filtering works</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--c-text-1)' }}>
            Once you add members here, every page in the admin panel (Dashboard, Tasks, Goals, Reports, Performance, etc.) will automatically show only data belonging to your selected team members. This ensures you focus on your team's work.
          </p>
        </div>
      </div>

      {/* Current members */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div>
            <p className="text-[15px] font-bold" style={{ color: 'var(--c-text-0)' }}>
              Team Members
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--c-text-3)' }}>
              {(team.members || []).length} member{(team.members || []).length !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : (team.members || []).length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--c-surface-raised)' }}>
              <UsersRound className="w-7 h-7" style={{ color: 'var(--c-text-3)' }} />
            </div>
            <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--c-text-1)' }}>No team members yet</p>
            <p className="text-[13px] mb-5" style={{ color: 'var(--c-text-3)' }}>
              Click "Add Members" above to select the users you want to manage.
            </p>
            <button onClick={() => setShowPicker(true)} className="btn-primary">
              <UserPlus className="w-4 h-4" /> Select Team Members
            </button>
          </div>
        ) : (
          <div>
            {(team.members || []).map((m, i) => (
              <motion.div key={m._id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center justify-between px-6 py-4 table-row"
                style={{ borderBottom: '1px solid var(--c-border-subtle)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-[14px]"
                    style={{ background: 'var(--c-accent)' }}>
                    {(m.firstName || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: 'var(--c-text-0)' }}>
                      {m.firstName} {m.lastName} {m.otherName || ''}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[12px] flex items-center gap-1" style={{ color: 'var(--c-text-3)' }}>
                        <Mail className="w-3 h-3" /> {m.email}
                      </span>
                      {m.position && (
                        <span className="text-[12px] flex items-center gap-1" style={{ color: 'var(--c-text-3)' }}>
                          <Briefcase className="w-3 h-3" /> {m.position}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge" style={{ background: m.isActive ? 'var(--c-success-bg)' : 'var(--c-danger-bg)', color: m.isActive ? 'var(--c-success)' : 'var(--c-danger)' }}>
                    {m.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => removeMember(m._id)} className="btn-ghost p-2" style={{ color: 'var(--c-danger)' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add Members Picker Modal ──────────────────────── */}
      <AnimatePresence>
        {showPicker && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50" onClick={() => { setShowPicker(false); setSearch(''); }} />
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.2 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-xl)' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--c-text-0)' }}>Add Team Members</h2>
                <button onClick={() => { setShowPicker(false); setSearch(''); }} className="btn-ghost p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Search */}
              <div className="px-6 py-3" style={{ borderBottom: '1px solid var(--c-border-subtle)' }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-text-3)' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email…" className="input-base" style={{ paddingLeft: 36 }} autoFocus />
                </div>
              </div>
              {/* User list */}
              <div className="max-h-[400px] overflow-y-auto">
                {available.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[13px]" style={{ color: 'var(--c-text-3)' }}>
                      {search ? 'No matching users found' : 'All users are already in your team'}
                    </p>
                  </div>
                ) : (
                  available.map(u => (
                    <div key={u._id}
                      className="flex items-center justify-between px-6 py-3 transition-colors cursor-pointer"
                      style={{ borderBottom: '1px solid var(--c-border-subtle)' }}
                      onClick={() => addMember(u._id)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--c-surface-raised)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[13px] font-bold"
                          style={{ background: 'var(--c-ink-muted)' }}>
                          {(u.firstName || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold" style={{ color: 'var(--c-text-0)' }}>
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-[12px]" style={{ color: 'var(--c-text-3)' }}>{u.email}</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--c-accent-muted)' }}>
                        <UserPlus className="w-4 h-4" style={{ color: 'var(--c-accent)' }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyTeam;
