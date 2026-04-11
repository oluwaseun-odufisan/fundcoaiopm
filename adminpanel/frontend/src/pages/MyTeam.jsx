import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { UsersRound, Plus, X, Search, UserPlus, Trash2, Save } from 'lucide-react';

const MyTeam = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState({ members: [], name: 'My Team' });
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const [t, u] = await Promise.all([api.get('/team'), api.get('/team/available-users')]);
      setTeam(t.data.team || { members: [], name: 'My Team' });
      setAllUsers(u.data.users || []);
    } catch { toast.error('Failed to load team'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const removeMember = async (userId) => {
    try {
      const { data } = await api.delete(`/team/member/${userId}`);
      setTeam(data.team);
      toast.success('Member removed');
    } catch { toast.error('Failed to remove'); }
  };

  const addMember = async (userId) => {
    try {
      const { data } = await api.post('/team/member', { userId });
      setTeam(data.team);
      toast.success('Member added');
    } catch { toast.error('Failed to add'); }
  };

  const memberIds = new Set((team.members || []).map(m => m._id || m));
  const available = allUsers.filter(u => !memberIds.has(u._id) && u._id !== user?.id)
    .filter(u => !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  if (user?.role === 'admin') {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>My Team</h1>
        <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <UsersRound className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Super Admin Access</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            As Super Admin, you have access to all users across the organization. No team configuration needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <UsersRound className="w-6 h-6" style={{ color: 'var(--brand-accent)' }} /> My Team
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Configure your team members. All data across the admin panel filters to these users.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
          style={{ backgroundColor: 'var(--brand-accent)' }}>
          <UserPlus className="w-4 h-4" /> Add Members
        </button>
      </div>

      {/* Current members */}
      <div className="rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Team Members ({(team.members || []).length})
          </p>
        </div>
        {(team.members || []).length === 0 ? (
          <div className="text-center py-12">
            <UsersRound className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No team members yet. Add members to filter your dashboard.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ divideColor: 'var(--border-color)' }}>
            {(team.members || []).map((member, i) => (
              <motion.div key={member._id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: 'var(--brand-accent)' }}>
                    {(member.firstName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.email} · {member.position || member.role}</p>
                  </div>
                </div>
                <button onClick={() => removeMember(member._id)}
                  className="p-2 rounded-lg transition-colors" style={{ color: '#dc2626' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,.08)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add members modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAdd(false)} />
          <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl border shadow-2xl"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Add Team Members</h2>
              <button onClick={() => setShowAdd(false)} style={{ color: 'var(--text-muted)' }}><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
                  className="flex-1 bg-transparent text-sm focus:outline-none" style={{ color: 'var(--text-primary)' }} />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y" style={{ divideColor: 'var(--border-color)' }}>
              {available.length === 0 && <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No available users</p>}
              {available.map(u => (
                <div key={u._id} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-hover)] transition-colors">
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                  </div>
                  <button onClick={() => addMember(u._id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90"
                    style={{ backgroundColor: 'var(--brand-accent)' }}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default MyTeam;
 