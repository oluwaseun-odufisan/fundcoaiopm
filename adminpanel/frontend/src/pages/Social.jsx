import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Megaphone, MessageSquare, Search, Send, Trash2 } from 'lucide-react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, FilterChip, LoadingScreen, PageHeader, Panel, SearchInput } from '../components/ui.jsx';

const Social = () => {
  const { hasRole } = useAuth();
  const canPostOrgWide = hasRole('executive', 'admin');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [feedScope, setFeedScope] = useState('all');
  const [announcement, setAnnouncement] = useState('');
  const [scope, setScope] = useState(canPostOrgWide ? 'all' : 'team');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!canPostOrgWide) setScope('team');
  }, [canPostOrgWide]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50, scope: feedScope };
      if (search) params.search = search;
      if (filter) params.filter = filter;
      const { data } = await api.get('/social', { params });
      setPosts(data.posts || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [feedScope, filter, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createAnnouncement = async () => {
    if (!announcement.trim()) return toast.error('Content required');
    setPosting(true);
    try {
      await api.post('/social/announcement', { content: announcement.trim(), scope });
      toast.success('Announcement posted');
      setAnnouncement('');
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post announcement');
    } finally {
      setPosting(false);
    }
  };

  const deletePost = async (id) => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/social/${id}`);
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    }
  };

  const deleteComment = async (postId, commentId) => {
    try {
      await api.delete(`/social/${postId}/comments/${commentId}`);
      toast.success('Comment removed');
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove comment');
    }
  };

  const viewScopeLabel = useMemo(
    () => (feedScope === 'team' ? 'Only posts from your team are visible.' : 'Showing organization-wide activity.'),
    [feedScope],
  );

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Social Feed"
        title="Social Feed"
        description="Moderate activity, review team updates, and publish announcements without leaving the admin workspace."
      />

      <Panel title="Create announcement" subtitle="Broadcast updates to your team or the full organization">
        <div className="space-y-4">
          <textarea
            className="input-base min-h-28"
            value={announcement}
            onChange={(event) => setAnnouncement(event.target.value)}
            placeholder="Write an announcement..."
          />
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {(canPostOrgWide ? ['all', 'team'] : ['team']).map((item) => (
                <FilterChip key={item} active={scope === item} onClick={() => setScope(item)}>
                  {item === 'all' ? 'Everyone' : 'My Team'}
                </FilterChip>
              ))}
            </div>
            <button className="btn-primary" onClick={createAnnouncement} disabled={posting || !announcement.trim()}>
              {posting ? 'Posting...' : <><Send className="h-4 w-4" />Post</>}
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="Feed filters" subtitle={viewScopeLabel}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search posts..." icon={Search} />
          </div>
          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'View All' },
                { value: 'team', label: 'My Team' },
              ].map((item) => (
                <FilterChip key={item.value} active={feedScope === item.value} onClick={() => setFeedScope(item.value)}>
                  {item.label}
                </FilterChip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: '', label: 'All Content' },
                { value: 'announcements', label: 'Announcements' },
                { value: 'media', label: 'Media' },
              ].map((item) => (
                <FilterChip key={item.label} active={filter === item.value} onClick={() => setFilter(item.value)}>
                  {item.label}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {loading ? (
        <LoadingScreen height="18rem" />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No posts found"
          description={feedScope === 'team' ? 'Your team has not posted anything yet.' : 'Announcements and social activity will appear here.'}
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post._id} className="card p-5">
              {post.isAnnouncement ? (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold" style={{ background: 'var(--c-accent-muted)', color: 'var(--c-accent)' }}>
                  <Megaphone className="h-3.5 w-3.5" />
                  {post.announcementScope === 'team' ? 'Team Announcement' : 'Organization Announcement'}
                </div>
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold" style={{ color: 'var(--c-text-0)' }}>
                    {post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Unknown'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--c-text-3)' }}>
                    {format(new Date(post.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <button className="btn-danger" onClick={() => deletePost(post._id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {post.content ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7" style={{ color: 'var(--c-text-1)' }}>{post.content}</p> : null}
              {post.fileUrl && post.contentType === 'image' ? <img src={post.fileUrl} alt="" className="mt-4 max-h-72 w-full rounded-[1.35rem] object-cover" /> : null}
              {post.fileUrl && post.contentType === 'video' ? <video src={post.fileUrl} controls className="mt-4 max-h-72 w-full rounded-[1.35rem] bg-black" /> : null}
              {post.comments?.length ? (
                <div className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: 'var(--c-border-subtle)' }}>
                  {post.comments.slice(0, 5).map((comment) => (
                    <div key={comment._id} className="flex items-start justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--c-border)' }}>
                      <div className="text-sm">
                        <span className="font-bold" style={{ color: 'var(--c-text-0)' }}>
                          {comment.user?.firstName} {comment.user?.lastName}
                        </span>
                        <span style={{ color: 'var(--c-text-2)' }}> {comment.content}</span>
                      </div>
                      <button className="btn-danger" onClick={() => deleteComment(post._id, comment._id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Social;
