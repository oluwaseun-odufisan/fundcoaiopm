import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Video, Loader2, Users, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_C = { waiting: '#d97706', active: '#16a34a', ended: '#64748b' };

const Meetings = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      const { data } = await api.get('/meetings', { params });
      setRooms(data.rooms || []);
    } catch { toast.error('Failed to load meetings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter]);

  const endRoom = async (roomId) => {
    if (!confirm('End this meeting?')) return;
    try { await api.post(`/meetings/${roomId}/end`); toast.success('Meeting ended'); fetch(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Video className="w-6 h-6" style={{ color: 'var(--brand-accent)' }} /> Meetings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>View and manage team meetings</p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        {['', 'active', 'waiting', 'ended'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize"
            style={filter === f ? { backgroundColor: 'var(--brand-accent)', color: '#fff' } : { color: 'var(--text-secondary)' }}>
            {f || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-accent)' }} /></div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <Video className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>No meetings found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map((room, i) => {
            const sc = STATUS_C[room.status] || '#64748b';
            const hostName = room.host ? `${room.host.firstName} ${room.host.lastName}` : 'Unknown';
            const activeCount = room.participants?.filter(p => p.isActive).length || 0;
            return (
              <motion.div key={room._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .02 }}
                className="rounded-xl border p-4 flex items-center justify-between gap-3"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{room.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize" style={{ backgroundColor: `${sc}15`, color: sc }}>{room.status}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>{room.type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>Host: {hostName}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{activeCount} active</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(room.createdAt), 'MMM dd, h:mm a')}</span>
                    <span className="font-mono text-[10px]">{room.roomId}</span>
                  </div>
                </div>
                {room.status !== 'ended' && (
                  <button onClick={() => endRoom(room.roomId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ color: '#dc2626', backgroundColor: 'rgba(220,38,38,.08)' }}>
                    <XCircle className="w-3.5 h-3.5" /> End
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Meetings;
