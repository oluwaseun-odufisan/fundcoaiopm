//Meetings.jsx
import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Video, Users, Clock, XCircle } from 'lucide-react';

const STATUS_C = { waiting: { c: '#d97706', bg: '#fffbeb' }, active: { c: '#059669', bg: '#ecfdf5' }, ended: { c: '#6b7494', bg: '#f7f8fb' } };

const Meetings = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = {}; if (filter) params.status = filter;
      const { data } = await api.get('/meetings', { params });
      setRooms(data.rooms || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, [filter]);

  const endRoom = async (roomId) => {
    if (!confirm('End this meeting?')) return;
    try { await api.post(`/meetings/${roomId}/end`); toast.success('Meeting ended'); fetchRooms(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>Meetings</h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--c-text-2)' }}>View and manage team meetings</p>
      </div>

      <div className="flex gap-1.5">
        {['', 'active', 'waiting', 'ended'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-2 rounded-lg text-[12px] font-semibold capitalize transition-colors"
            style={filter === f
              ? { background: 'var(--c-accent)', color: 'white' }
              : { background: 'var(--c-surface)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>
            {f || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : rooms.length === 0 ? (
        <div className="card text-center py-20">
          <Video className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--c-text-3)' }} />
          <p className="text-[15px] font-semibold" style={{ color: 'var(--c-text-1)' }}>No meetings found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {rooms.map((room, i) => {
            const sc = STATUS_C[room.status] || STATUS_C.ended;
            const hostName = room.host ? `${room.host.firstName} ${room.host.lastName}` : 'Unknown';
            const activeCount = room.participants?.filter(p => p.isActive).length || 0;

            return (
              <motion.div key={room._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="flex items-center justify-between gap-4 px-6 py-4 table-row"
                style={{ borderBottom: '1px solid var(--c-border-subtle)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--c-text-0)' }}>{room.name}</p>
                    <span className="badge capitalize" style={{ background: sc.bg, color: sc.c }}>{room.status}</span>
                    <span className="badge capitalize" style={{ background: 'var(--c-surface-raised)', color: 'var(--c-text-2)' }}>{room.type}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--c-text-3)' }}>
                    <span>Host: {hostName}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{activeCount} active</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(room.createdAt), 'MMM d, h:mm a')}</span>
                    <code className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--c-surface-raised)', fontFamily: 'var(--font-mono)' }}>{room.roomId}</code>
                  </div>
                </div>
                {room.status !== 'ended' && (
                  <button onClick={() => endRoom(room.roomId)} className="btn-ghost flex-shrink-0" style={{ color: 'var(--c-danger)' }}>
                    <XCircle className="w-4 h-4" /> End
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
