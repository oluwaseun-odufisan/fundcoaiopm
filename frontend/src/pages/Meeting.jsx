import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { Video, Mic, Monitor, Users, Settings, Clock, Link2, Plus, X, Edit2, Trash2, AlertCircle, Loader2, Search, Copy, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Select from 'react-select';
import { Dialog, Transition } from '@headlessui/react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import io from 'socket.io-client';
import { Toaster, toast } from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001';
const SOCKET_URL = API_BASE;

const meetingSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters').max(200),
  agenda: z.string().max(500).optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  duration: z.number().int().min(1).max(1440),
  participants: z.array(z.string()).optional(),
});

const Meeting = () => {
  const [meetings, setMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [meetingSearch, setMeetingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [view, setView] = useState('list'); // 'list' or 'calendar'
  const socket = useRef(null);
  const localizer = momentLocalizer(moment);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm({
    resolver: zodResolver(meetingSchema),
  });

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
    socket.current = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('token') },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socket.current.on('connect', () => {
      console.log('Socket connected');
    });
    socket.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      toast.error('Failed to connect to real-time service. Some features may be unavailable.');
    });
    socket.current.on('newMeeting', (meeting) => {
      setMeetings((prev) => [meeting, ...prev]);
      updateCalendarEvents([meeting, ...meetings]);
      toast.success('New meeting created!');
    });
    socket.current.on('meetingUpdated', (updatedMeeting) => {
      setMeetings((prev) => prev.map((m) => m._id === updatedMeeting._id ? updatedMeeting : m));
      updateCalendarEvents(prev.map((m) => m._id === updatedMeeting._id ? updatedMeeting : m));
      toast.success('Meeting updated!');
    });
    socket.current.on('meetingDeleted', (id) => {
      setMeetings((prev) => prev.filter((m) => m._id !== id));
      updateCalendarEvents(prev.filter((m) => m._id !== id));
      toast.success('Meeting deleted!');
    });
    socket.current.on('meetingStarted', (id) => {
      setMeetings((prev) => prev.map((m) => m._id === id ? { ...m, status: 'ongoing' } : m));
      toast.info('A meeting has started!');
    });
    return () => {
      socket.current.disconnect();
    };
  }, []);

  const fetchMeetings = useCallback(async () => {
    setIsLoadingMeetings(true);
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please login to view meetings', { duration: 5000 });
          setIsLoadingMeetings(false);
          return;
        }
        const res = await axios.get(`${API_BASE}/api/meetings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedMeetings = res.data.meetings || [];
        setMeetings(fetchedMeetings);
        setFilteredMeetings(fetchedMeetings);
        updateCalendarEvents(fetchedMeetings);
        console.log('Meetings fetched successfully:', fetchedMeetings);
        setIsLoadingMeetings(false);
        return; // Success, exit loop
      } catch (err) {
        attempts++;
        console.error(`Fetch meetings attempt ${attempts} failed:`, err);
        if (attempts === maxAttempts) {
          toast.error('Failed to load meetings after 3 attempts. Please check your connection and try again.', { duration: 5000 });
          setIsLoadingMeetings(false);
        }
        await new Promise(resolve => setTimeout(resolve, 3000)); // Increased delay to 3s
      }
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please login to load users', { duration: 5000 });
          setIsLoadingUsers(false);
          return;
        }
        const res = await axios.get(`${API_BASE}/api/meetings/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedUsers = res.data.users || [];
        setUsers(fetchedUsers.map((u) => ({ value: u._id, label: u.name, email: u.email })));
        console.log('Users fetched successfully:', fetchedUsers);
        setIsLoadingUsers(false);
        return; // Success, exit loop
      } catch (err) {
        attempts++;
        console.error(`Fetch users attempt ${attempts} failed:`, err);
        if (attempts === maxAttempts) {
          toast.error('Failed to load users after 3 attempts. Please try again later.', { duration: 5000 });
          setIsLoadingUsers(false);
        }
        await new Promise(resolve => setTimeout(resolve, 3000)); // Increased delay to 3s
      }
    }
  }, []);

  const updateCalendarEvents = (meetingsList) => {
    setCalendarEvents(
      meetingsList.map((m) => ({
        title: m.topic,
        start: new Date(m.startTime),
        end: new Date(new Date(m.startTime).getTime() + m.duration * 60000),
        allDay: false,
        resource: m,
      }))
    );
  };

  const onSubmit = async (data) => {
    // Convert startTime to full ISO
    const parsedStartTime = new Date(data.startTime);
    if (parsedStartTime <= new Date()) {
      toast.error('Start time must be in the future');
      return;
    }
    data.startTime = parsedStartTime.toISOString();
    data.participants = data.participants?.map((p) => p.value) || [];
    try {
      const token = localStorage.getItem('token');
      let res;
      if (showEditModal) {
        res = await axios.put(`${API_BASE}/api/meetings/${selectedMeeting._id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        res = await axios.post(`${API_BASE}/api/meetings`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      reset();
      fetchMeetings();
      toast.success(showEditModal ? 'Meeting updated successfully!' : 'Meeting created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save meeting. Please try again.');
      console.error('Save meeting error:', err);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/meetings/${showDeleteConfirm}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteConfirm(false);
      fetchMeetings();
      toast.success('Meeting deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete meeting. Please try again.');
      console.error('Delete meeting error:', err);
    }
  };

  const openEdit = (meeting) => {
    setSelectedMeeting(meeting);
    setValue('topic', meeting.topic);
    setValue('agenda', meeting.agenda);
    setValue('startTime', format(new Date(meeting.startTime), "yyyy-MM-dd'T'HH:mm"));
    setValue('duration', meeting.duration);
    const participants = meeting.participants.map((p) => {
      if (typeof p === 'string') {
        const u = users.find(u => u.value === p);
        return { value: p, label: u ? u.label : 'Unknown', email: u ? u.email : '' };
      } else {
        return { value: p._id, label: p.name, email: p.email };
      }
    });
    setValue('participants', participants);
    setShowEditModal(true);
  };

  const joinMeeting = (url) => {
    window.open(url, '_blank');
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Join link copied!');
    }).catch(() => {
      toast.error('Failed to copy link.');
    });
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setMeetingSearch(term);
    const filtered = meetings.filter(m => m.topic.toLowerCase().includes(term) || m.status.toLowerCase().includes(term));
    setFilteredMeetings(filtered);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    const filtered = status === 'all' ? meetings : meetings.filter(m => m.status === status);
    setFilteredMeetings(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Meetings</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setView(view === 'list' ? 'calendar' : 'list')}
              className="flex-1 md:flex-initial px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
            >
              {view === 'list' ? 'Calendar View' : 'List View'}
            </button>
            <button
              onClick={() => {
                reset({
                  startTime: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"), // 1 hour in the future
                  duration: 60,
                });
                setShowCreateModal(true);
              }}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" /> New Meeting
            </button>
          </div>
        </div>
        {view === 'list' ? (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search meetings by topic or status..."
                  value={meetingSearch}
                  onChange={handleSearch}
                  className="w-full p-3 pl-10 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="ended">Ended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
              }}
            >
              {isLoadingMeetings ? (
                <div className="col-span-full flex justify-center items-center h-64">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : filteredMeetings.length === 0 ? (
                <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-2xl shadow-md">
                  <Video className="w-20 h-20 mx-auto mb-4 text-blue-300" />
                  <p className="text-xl font-medium">No meetings found. Adjust your search or create one!</p>
                </div>
              ) : (
                filteredMeetings.map((meeting) => (
                  <motion.div
                    key={meeting._id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    className="bg-white rounded-2xl p-4 md:p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <Tippy content={meeting.agenda || 'No agenda'} placement="top" arrow={true}>
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 truncate">{meeting.topic}</h3>
                    </Tippy>
                    <div className="space-y-2 text-xs md:text-sm text-gray-600 mb-4">
                      <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-blue-600 flex-shrink-0" /> {format(parseISO(meeting.startTime), 'MMM d, yyyy')}</p>
                      <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600 flex-shrink-0" /> {format(parseISO(meeting.startTime), 'h:mm a')} ({meeting.duration} min)</p>
                      <p className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-600 flex-shrink-0" /> {meeting.participants.length + 1} participants</p>
                      <p className="flex items-center gap-2 capitalize"><AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" /> Status: <span className={`font-medium ${meeting.status === 'ongoing' ? 'text-green-600' : meeting.status === 'ended' ? 'text-gray-600' : meeting.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'}`}>{meeting.status}</span></p>
                    </div>
                    <div className="flex gap-2 md:gap-3">
                      <button
                        onClick={() => joinMeeting(meeting.joinUrl)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs md:text-sm hover:bg-blue-700 transition"
                      >
                        <Link2 className="w-4 h-4" /> Join
                      </button>
                      <Tippy content="Copy Link" placement="top" arrow={true}>
                        <button onClick={() => copyLink(meeting.joinUrl)} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition">
                          <Copy className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </Tippy>
                      <button onClick={() => openEdit(meeting)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition">
                        <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button onClick={() => setShowDeleteConfirm(meeting._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition">
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {meeting.participants.map((p) => {
                        const user = typeof p === 'string' 
                          ? users.find(u => u.value === p)
                          : { value: p._id, label: p.name, email: p.email };
                        if (!user) return null;
                        return (
                          <Tippy key={typeof p === 'string' ? p : p._id} content={`${user.label} (${user.email || ''})`} placement="top" arrow={true}>
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.label)}&background=random&size=32`} alt={user.label} className="w-8 h-8 rounded-full cursor-pointer" />
                          </Tippy>
                        );
                      })}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              onSelectEvent={(event) => openEdit(event.resource)}
              views={['month', 'week', 'day', 'agenda']}
              popup
              className="text-sm"
              eventPropGetter={(event) => ({
                className: event.resource.status === 'ongoing' ? 'bg-green-200 text-green-800' : event.resource.status === 'ended' ? 'bg-gray-200 text-gray-800' : 'bg-blue-200 text-blue-800',
              })}
            />
          </div>
        )}
      </div>
      {/* Create/Edit Modal */}
      <Transition appear show={showCreateModal || showEditModal} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => { setShowCreateModal(false); setShowEditModal(false); }}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 mb-6 flex justify-between items-center">
                    {showEditModal ? 'Edit Meeting' : 'Create Meeting'}
                    <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Title>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                        Topic <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('topic')}
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Enter meeting topic"
                      />
                      {errors.topic && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.topic.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                        Agenda
                      </label>
                      <textarea
                        {...register('agenda')}
                        rows={3}
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Describe the meeting agenda (optional)"
                      />
                      {errors.agenda && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.agenda.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        {...register('startTime')}
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition"
                      />
                      {errors.startTime && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.startTime.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                        Duration (minutes) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        {...register('duration', { valueAsNumber: true })}
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="e.g., 60"
                      />
                      {errors.duration && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.duration.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                        Participants
                      </label>
                      <Select
                        isMulti
                        options={users}
                        onChange={(selected) => setValue('participants', selected ? selected.map(s => s.value) : [])}
                        className="text-sm"
                        isDisabled={isLoadingUsers}
                        placeholder={isLoadingUsers ? 'Loading users...' : 'Select participants...'}
                      />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                      <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm shadow-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {showEditModal ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      {/* Delete Confirm */}
      <Transition appear show={!!showDeleteConfirm} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowDeleteConfirm(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 mb-4">
                    Delete Meeting?
                  </Dialog.Title>
                  <p className="text-sm text-gray-600 mb-6">This action cannot be undone.</p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm text-white bg-red-600 rounded-xl hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Meeting;