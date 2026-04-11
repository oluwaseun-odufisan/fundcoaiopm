import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Trash2, Search, Loader2, Megaphone, Eye } from 'lucide-react';
import { format } from 'date-fns';

const Social = () => {
  const { user, hasRole } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [scope, setScope] = useState('all');
  const [posting, setPosting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (search) params.search = search;
      if (filter) params.filter = filter;
      const { data } = await api.get('/social', { params });
      setPosts(data.posts || []);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  }, [search, filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const createAnnouncement = async () => {
    if (!announcement.trim()) return toast.error('Content required');
    setPosting(true);
    try {
      await api.post('/social/announcement', { content: announcement.trim(), scope });
      toast.success('Announcement posted!');
      setAnnouncement('');
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPosting(false); }
  };

  const deletePost = async (id) => {
    if (!confirm('Delete this post?')) return;
    try { await api.delete(`/social/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const deleteComment = async (postId, commentId) => {
    try { await api.delete(`/social/${postId}/comments/${commentId}`); toast.success('Comment removed'); fetch(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <MessageSquare className="w-6 h-6" style={{ color: 'var(--brand-accent)' }} /> Social Feed
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Moderate posts and create announcements</p>
      </div>

      {/* Announcement composer */}
      {hasRole('executive', 'admin', 'team-lead') && (
        <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-4 h-4" style={{ color: 'var(--brand-accent)' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Create Announcement</p>
          </div>
          <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} rows={3} placeholder="Write an announcement…"
            className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none mb-3"
            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Scope:</span>
              {(hasRole('executive', 'admin') ? ['all', 'team'] : ['team']).map(s => (
                <button key={s} onClick={() => setScope(s)}
                  className="text-xs px-3 py-1 rounded-lg font-bold capitalize"
                  style={scope === s ? { backgroundColor: 'var(--brand-accent)', color: '#fff' } : { backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={createAnnouncement} disabled={posting || !announcement.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40"
              style={{ backgroundColor: 'var(--brand-accent)' }}>
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
            </button>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…"
            className="flex-1 bg-transparent text-sm focus:outline-none" style={{ color: 'var(--text-primary)' }} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          {['', 'announcements', 'media'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize"
              style={filter === f ? { backgroundColor: 'var(--brand-accent)', color: '#fff' } : { color: 'var(--text-secondary)' }}>
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-accent)' }} /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>No posts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => {
            const authorName = post.user ? `${post.user.firstName || ''} ${post.user.lastName || ''}`.trim() : 'Unknown';
            return (
              <motion.div key={post._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .02 }}
                className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: 'var(--brand-accent)' }}>
                      {(post.user?.firstName || 'U').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{authorName}</p>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>{format(new Date(post.createdAt), 'MMM dd, yyyy h:mm a')}</span>
                        {post.isAnnouncement && <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px]">Announcement</span>}
                        {post.views > 0 && <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{post.views}</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deletePost(post._id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,.08)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {post.content && <p className="text-sm mb-2 whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{post.content}</p>}
                {post.fileUrl && post.contentType === 'image' && (
                  <img src={post.fileUrl} alt="" className="rounded-lg max-h-48 object-cover mb-2" />
                )}
                {/* Comments */}
                {post.comments?.length > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{post.comments.length} comments</p>
                    {post.comments.slice(0, 3).map(c => (
                      <div key={c._id} className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{c.user?.firstName} {c.user?.lastName}: </span>
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.content}</span>
                        </div>
                        <button onClick={() => deleteComment(post._id, c._id)} className="flex-shrink-0" style={{ color: '#dc2626' }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Social;
