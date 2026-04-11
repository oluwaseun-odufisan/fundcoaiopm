import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { MessageSquare, Send, Trash2, Search, Megaphone, Eye, Image, X } from 'lucide-react';

const Social = () => {
  const { user, hasRole } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [scope, setScope] = useState('all');
  const [posting, setPosting] = useState(false);

  const fetchPosts = useCallback(async () => {
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

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const createAnnouncement = async () => {
    if (!announcement.trim()) return toast.error('Content required');
    setPosting(true);
    try {
      await api.post('/social/announcement', { content: announcement.trim(), scope });
      toast.success('Announcement posted!');
      setAnnouncement('');
      fetchPosts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPosting(false); }
  };

  const deletePost = async (id) => {
    if (!confirm('Delete this post?')) return;
    try { await api.delete(`/social/${id}`); toast.success('Deleted'); fetchPosts(); }
    catch { toast.error('Failed'); }
  };

  const deleteComment = async (postId, commentId) => {
    try { await api.delete(`/social/${postId}/comments/${commentId}`); toast.success('Comment removed'); fetchPosts(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--c-text-0)' }}>Social Feed</h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--c-text-2)' }}>Moderate posts and create announcements</p>
      </div>

      {/* Announcement composer */}
      {hasRole('executive', 'admin', 'team-lead') && (
        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--c-accent-muted)' }}>
              <Megaphone className="w-4 h-4" style={{ color: 'var(--c-accent)' }} />
            </div>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--c-text-0)' }}>Create Announcement</p>
          </div>
          <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} rows={3}
            placeholder="Write an announcement to your team or organization…"
            className="input-base mb-3" style={{ resize: 'vertical' }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium" style={{ color: 'var(--c-text-3)' }}>Audience:</span>
              {(hasRole('executive', 'admin') ? ['all', 'team'] : ['team']).map(s => (
                <button key={s} onClick={() => setScope(s)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-colors"
                  style={scope === s
                    ? { background: 'var(--c-accent)', color: 'white' }
                    : { background: 'var(--c-surface-raised)', color: 'var(--c-text-2)' }}>
                  {s === 'all' ? 'Everyone' : 'My Team'}
                </button>
              ))}
            </div>
            <button onClick={createAnnouncement} disabled={posting || !announcement.trim()} className="btn-primary">
              {posting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-text-3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…"
            className="input-base" style={{ paddingLeft: 38 }} />
        </div>
        <div className="flex gap-1.5">
          {['', 'announcements', 'media'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-2 rounded-lg text-[12px] font-semibold capitalize transition-colors"
              style={filter === f
                ? { background: 'var(--c-accent)', color: 'white' }
                : { background: 'var(--c-surface)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-20">
          <MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--c-text-3)' }} />
          <p className="text-[15px] font-semibold" style={{ color: 'var(--c-text-1)' }}>No posts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => {
            const authorName = post.user ? `${post.user.firstName || ''} ${post.user.lastName || ''}`.trim() : 'Unknown';
            const isAnnouncement = post.isAnnouncement;
            return (
              <motion.div key={post._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="card overflow-hidden"
                style={isAnnouncement ? { borderColor: 'var(--c-accent)', borderWidth: 2 } : {}}>

                {isAnnouncement && (
                  <div className="px-5 py-2 flex items-center gap-2" style={{ background: 'var(--c-accent-muted)', borderBottom: '1px solid var(--c-border-subtle)' }}>
                    <Megaphone className="w-3.5 h-3.5" style={{ color: 'var(--c-accent)' }} />
                    <span className="text-[11px] font-bold" style={{ color: 'var(--c-accent-text)' }}>
                      {post.announcementScope === 'team' ? 'Team Announcement' : 'Organization Announcement'}
                    </span>
                  </div>
                )}

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[13px] font-bold"
                        style={{ background: 'var(--c-accent)' }}>
                        {(post.user?.firstName || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-semibold" style={{ color: 'var(--c-text-0)' }}>{authorName}</p>
                          {post.user?.position && (
                            <span className="text-[10px]" style={{ color: 'var(--c-text-3)' }}>· {post.user.position}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--c-text-3)' }}>
                          <span>{format(new Date(post.createdAt), 'MMM d, yyyy · h:mm a')}</span>
                          {post.edited && <span>· edited</span>}
                          {post.views > 0 && <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{post.views}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => deletePost(post._id)} className="btn-ghost p-1.5" style={{ color: 'var(--c-danger)' }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  {post.content && (
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap mb-3" style={{ color: 'var(--c-text-0)' }}>{post.content}</p>
                  )}

                  {/* Media */}
                  {post.fileUrl && post.contentType === 'image' && (
                    <img src={post.fileUrl} alt="" className="rounded-xl max-h-64 object-cover mb-3 w-full" />
                  )}
                  {post.fileUrl && post.contentType === 'video' && (
                    <video src={post.fileUrl} controls className="rounded-xl max-h-64 w-full bg-black mb-3" />
                  )}

                  {/* Comments */}
                  {post.comments?.length > 0 && (
                    <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--c-border-subtle)' }}>
                      <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--c-text-3)' }}>
                        {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
                      </p>
                      <div className="space-y-2">
                        {post.comments.slice(0, 5).map(c => (
                          <div key={c._id} className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-[12px] font-semibold" style={{ color: 'var(--c-text-0)' }}>
                                {c.user?.firstName} {c.user?.lastName}:
                              </span>{' '}
                              <span className="text-[12px]" style={{ color: 'var(--c-text-2)' }}>{c.content}</span>
                            </div>
                            <button onClick={() => deleteComment(post._id, c._id)}
                              className="btn-ghost p-1 flex-shrink-0" style={{ color: 'var(--c-danger)' }}>
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Social;
