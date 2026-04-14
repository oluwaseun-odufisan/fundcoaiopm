import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Clock, Users, Video, XCircle } from 'lucide-react';
import api from '../utils/api.js';
import { EmptyState, FilterChip, LoadingScreen, PageHeader, Panel } from '../components/ui.jsx';

const statusColors = { waiting: { c: '#d97706', bg: '#fffbeb' }, active: { c: '#059669', bg: '#ecfdf5' }, ended: { c: '#6b7494', bg: '#f7f8fb' } };

const Meetings = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      const { data } = await api.get('/meetings', { params });
      setRooms(data.rooms || []);
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [filter]);

  const endRoom = async (roomId) => {
    if (!confirm('End this meeting?')) return;
    try {
      await api.post(`/meetings/${roomId}/end`);
      toast.success('Meeting ended');
      fetchRooms();
    } catch {
      toast.error('Failed');
    }
  };

  return (
    <div className="page-shell">
      <PageHeader title="Meetings" />
      <Panel>
        <div className="flex flex-wrap gap-2">
          {['', 'active', 'waiting', 'ended'].map((item) => <FilterChip key={item || 'all'} active={filter === item} onClick={() => setFilter(item)}>{item || 'All'}</FilterChip>)}
        </div>
      </Panel>
      {loading ? <LoadingScreen height="18rem" /> : rooms.length === 0 ? <EmptyState icon={Video} title="No meetings found" description="Live rooms and historical sessions will appear here." /> : (
        <Panel title="Meeting feed" subtitle={`${rooms.length} rooms visible`}>
          <div className="space-y-3">
            {rooms.map((room) => {
              const sc = statusColors[room.status] || statusColors.ended;
              const hostName = room.host ? `${room.host.firstName} ${room.host.lastName}` : 'Unknown';
              const activeCount = room.participants?.filter((participant) => participant.isActive).length || 0;
              return (
                <div key={room._id} className="card p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="badge capitalize" style={{ background: sc.bg, color: sc.c }}>{room.status}</span>
                        <span className="badge capitalize" style={{ background: 'var(--c-surface-raised)', color: 'var(--c-text-2)' }}>{room.type}</span>
                      </div>
                      <h3 className="text-lg font-bold" style={{ color: 'var(--c-text-0)' }}>{room.name}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--c-text-3)' }}>
                        <span>Host: {hostName}</span>
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{activeCount} active</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{format(new Date(room.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    {room.status !== 'ended' ? <button className="btn-danger" onClick={() => endRoom(room.roomId)}><XCircle className="h-4 w-4" /> End</button> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
};

export default Meetings;
