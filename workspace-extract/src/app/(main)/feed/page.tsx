'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Heart, MessageCircle, Repeat2, MoreHorizontal, Send, Trash2, Flag, Loader2, BookOpen, AlertTriangle, Bookmark, Rss, FileText, ChevronRight, Globe, Sparkles, Video, Edit3, ExternalLink, Film, PenTool, Check, Dumbbell, TrendingUp, Activity } from 'lucide-react';
import { GlassCard } from '@/components/glass-card';
import { AdCard } from '@/components/ad-banner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUserStore } from '@/stores/user-store';
import { t } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WeightChart, WorkoutChart } from '@/app/(main)/fitness/_charts';

// ── Shared Topic CTA Button ──
function SharedTopicCTA({ topicId, router }: { topicId: string; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="mt-2">
      <button
        onClick={() => router.push(`/shared-topic/${topicId}?from=feed`)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/15 border border-blue-500/20 transition-colors group"
      >
        <Globe size={14} className="text-blue-400 shrink-0" />
        <span className="text-xs text-blue-300 font-medium flex-1 text-left">
          View Shared Collection
        </span>
        <Sparkles size={10} className="text-amber-400/50 group-hover:text-amber-400 transition-colors" />
        <ChevronRight size={14} className="text-blue-400 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}

// Live status pipeline per content type (same as content page)
const LIVE_STATUS_PIPELINES: Record<string, { key: string; label: string; color: string; icon: any }[]> = {
  blog: [
    { key: 'not_started', label: 'Not Started', color: 'text-muted-foreground bg-white/5', icon: FileText },
    { key: 'written', label: 'Written', color: 'text-blue-400 bg-blue-600/20', icon: PenTool },
    { key: 'posted', label: 'Posted', color: 'text-green-400 bg-green-600/20', icon: ExternalLink },
  ],
  video: [
    { key: 'not_started', label: 'Not Started', color: 'text-muted-foreground bg-white/5', icon: Film },
    { key: 'shoot', label: 'Shoot', color: 'text-red-400 bg-red-600/20', icon: Video },
    { key: 'edit', label: 'Edit', color: 'text-amber-400 bg-amber-600/20', icon: Edit3 },
    { key: 'posted', label: 'Posted', color: 'text-green-400 bg-green-600/20', icon: ExternalLink },
  ],
  post: [
    { key: 'not_started', label: 'Not Started', color: 'text-muted-foreground bg-white/5', icon: FileText },
    { key: 'shoot', label: 'Shoot', color: 'text-red-400 bg-red-600/20', icon: Video },
    { key: 'edit', label: 'Edit', color: 'text-amber-400 bg-amber-600/20', icon: Edit3 },
    { key: 'posted', label: 'Posted', color: 'text-green-400 bg-green-600/20', icon: ExternalLink },
  ],
};

function getPipeline(contentType: string) {
  return LIVE_STATUS_PIPELINES[contentType] || LIVE_STATUS_PIPELINES.post;
}

function getPipelineStepIndex(contentType: string, liveStatus: string) {
  const pipeline = getPipeline(contentType);
  return pipeline.findIndex(s => s.key === liveStatus);
}

const contentTypeIcon = (type: string) => {
  switch (type) {
    case 'blog': return <FileText size={12} />;
    case 'video': return <Film size={12} />;
    default: return <PenTool size={12} />;
  }
};

const contentTypeLabel = (type: string) => {
  switch (type) {
    case 'blog': return 'Blog';
    case 'video': return 'Video';
    case 'post': return 'Post';
    default: return type;
  }
};

export default function FeedPage() {
  const router = useRouter();
  const { profile } = useUserStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string|null>(null);
  const [commentText, setCommentText] = useState('');
  const [openComments, setOpenComments] = useState<Record<string, any[]>>({});
  const abortRef = useRef<AbortController|null>(null);
  const initialLoadRef = useRef(false);

  // Live Status data
  const [feedWeightLogs, setFeedWeightLogs] = useState<any[]>([]);
  const [feedWorkouts, setFeedWorkouts] = useState<any[]>([]);
  const [feedContentEntries, setFeedContentEntries] = useState<any[]>([]);

  const fetchPosts = useCallback(async (showSkeleton = false) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (showSkeleton) setLoading(true);
    try {
      const r = await fetch(`/api/posts?_t=${Date.now()}`, { signal: controller.signal });
      if (r.ok && !controller.signal.aborted) {
        const data = await r.json();
        const postsArr = Array.isArray(data) ? data : data.posts || [];
        setPosts(postsArr);
        setLoading(false);
        initialLoadRef.current = true;
      }
    } catch (e: any) { if (e.name !== 'AbortError') setLoading(false); }
  }, []);

  // Fetch user's fitness & content data for Live Status tab
  const fetchLiveData = useCallback(async () => {
    try {
      const [wRes, wlRes, eRes] = await Promise.all([
        fetch('/api/fitness/workout'),
        fetch('/api/fitness/weight'),
        fetch('/api/content/entries'),
      ]);
      if (wRes.ok) { const d = await wRes.json(); setFeedWorkouts(Array.isArray(d) ? d : d.workouts || []); }
      if (wlRes.ok) { const d = await wlRes.json(); setFeedWeightLogs(Array.isArray(d) ? d : d.weightLogs || []); }
      if (eRes.ok) { const d = await eRes.json(); setFeedContentEntries(Array.isArray(d) ? d : d.entries || []); }
    } catch {}
  }, []);

  useEffect(() => { fetchPosts(true); fetchLiveData(); }, [fetchPosts, fetchLiveData]);

  // Listen for xp-updated events to refresh live data
  useEffect(() => {
    const handler = () => { fetchLiveData(); };
    window.addEventListener('xp-updated', handler);
    return () => { window.removeEventListener('xp-updated', handler); };
  }, [fetchLiveData]);

  // Visibility/focus refetch
  useEffect(() => {
    let throttle = false;
    const handler = () => { if (!throttle) { throttle = true; fetchPosts(); setTimeout(() => { throttle = false; }, 2000); } };
    document.addEventListener('visibilitychange', handler);
    window.addEventListener('focus', handler);
    return () => { document.removeEventListener('visibilitychange', handler); window.removeEventListener('focus', handler); };
  }, [fetchPosts]);

  // Hashtag grouping
  const { grouped, ungrouped } = useMemo(() => {
    const safePosts = Array.isArray(posts) ? posts : [];
    const tagCount: Record<string, number> = {};
    safePosts.forEach((p: any) => {
      try {
        const tags = Array.isArray(p.hashtags) ? p.hashtags : JSON.parse(p.hashtags || '[]');
        if (Array.isArray(tags)) tags.forEach((tg: string) => { const key = tg.toLowerCase(); tagCount[key] = (tagCount[key] || 0) + 1; });
      } catch {}
    });
    const trending = Object.entries(tagCount).filter(([, c]) => c >= 2).map(([tg]) => tg);
    const grouped: Record<string, any[]> = {};
    const ungrouped: any[] = [];
    safePosts.forEach((p: any) => {
      try {
        const tags = (Array.isArray(p.hashtags) ? p.hashtags : JSON.parse(p.hashtags || '[]')).map((tg: string) => tg.toLowerCase());
        const matched = tags.find((tg: string) => trending.includes(tg));
        if (matched) { if (!grouped[matched]) grouped[matched] = []; grouped[matched].push(p); }
        else ungrouped.push(p);
      } catch { ungrouped.push(p); }
    });
    return { grouped, ungrouped };
  }, [posts]);

  // Computed chart data for Live Status tab
  const feedWeightChartData = feedWeightLogs.slice(-30).map((w: any) => ({
    date: w.date?.slice(5) || w.date,
    weight: w.weight,
  }));

  const feedWorkoutChartArr = Object.entries(
    feedWorkouts.reduce((acc: Record<string, number>, w: any) => {
      const d = w.date?.slice(5) || w.date;
      acc[d] = (acc[d] || 0) + (w.estimatedCalories || 0);
      return acc;
    }, {})
  ).map(([date, calories]) => ({ date, calories })).slice(-14);

  async function createPost() {
    if (!newContent.trim()) return;
    setSubmitting(true);
    const hashtags = (newContent.match(/#(\w+)/g) || []).map((h: string) => h.slice(1));
    const taggedUsers: string[] = [];
    try {
      const r = await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newContent, hashtags, taggedUsers }) });
      if (r.ok) { setNewContent(''); fetchPosts(); toast.success(`+5 ${t('xp.earned')}`); window.dispatchEvent(new CustomEvent('xp-updated')); window.dispatchEvent(new CustomEvent('notification-updated')); }
    } catch {} finally { setSubmitting(false); }
  }

  async function toggleLike(postId: string, isLiked: boolean) {
    try {
      if (isLiked) {
        await fetch(`/api/posts/${postId}/like`, { method: 'DELETE' });
      } else {
        await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      }
      fetchPosts();
    } catch {}
  }

  async function toggleBookmark(postId: string, isBookmarked: boolean) {
    try {
      if (isBookmarked) {
        await fetch(`/api/posts/${postId}/bookmark`, { method: 'DELETE' });
      } else {
        await fetch(`/api/posts/${postId}/bookmark`, { method: 'POST' });
      }
      fetchPosts();
    } catch {}
  }

  async function toggleRepost(postId: string, isReposted: boolean) {
    try {
      if (isReposted) {
        await fetch(`/api/posts/${postId}/repost`, { method: 'DELETE' });
      } else {
        await fetch(`/api/posts/${postId}/repost`, { method: 'POST' });
      }
      fetchPosts();
    } catch {}
  }

  async function addComment(postId: string) {
    if (!commentText.trim()) return;
    try {
      const r = await fetch(`/api/posts/${postId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: commentText }) });
      if (r.ok) {
        const d = await r.json();
        const comment = d.comment || d;
        setOpenComments(p => ({ ...p, [postId]: [...(p[postId] || []), comment] }));
        setCommentText('');
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, stats: { ...p.stats, comments: (p.stats?.comments || p._count?.comments || 0) + 1 } } : p));
        toast.success('+3 XP');
        window.dispatchEvent(new CustomEvent('xp-updated')); window.dispatchEvent(new CustomEvent('notification-updated'));
      }
    } catch {}
  }

  async function loadComments(postId: string) {
    try {
      const r = await fetch(`/api/posts/${postId}/comments`);
      if (r.ok) {
        const d = await r.json();
        const comments = Array.isArray(d) ? d : d.comments || [];
        setOpenComments(p => ({ ...p, [postId]: comments }));
      }
    } catch {}
  }

  async function deletePost(postId: string) {
    if (!confirm('Delete this post?')) return;
    try {
      const r = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (r.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        toast.success('Post deleted');
      }
    } catch {}
  }

  const [reportOpen, setReportOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<string|null>(null);
  const [reportCategory, setReportCategory] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [activeFeedTab, setActiveFeedTab] = useState('feed');

  function openReport(postId: string) {
    setReportTargetId(postId);
    setReportCategory('');
    setReportReason('');
    setReportOpen(true);
  }

  async function submitReport() {
    if (!reportTargetId || !reportCategory || !reportReason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setReportSubmitting(true);
    try {
      const r = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'post', targetId: reportTargetId, category: reportCategory, reason: reportReason.trim() }) });
      if (r.ok) { toast.success('Report submitted'); setReportOpen(false); }
      else { const d = await r.json(); toast.error(d.error || 'Report failed'); }
    } catch { toast.error('Report failed'); }
    finally { setReportSubmitting(false); }
  }

  function renderContent(text: string) {
    return text.split(/(#\w+|@\w+)/g).map((part, i) => {
      if (part.startsWith('#')) return <span key={i} className="text-blue-400 cursor-pointer" onClick={() => router.push(`/discover?q=${encodeURIComponent(part)}`)}>{part}</span>;
      if (part.startsWith('@')) return <span key={i} className="text-purple-400 cursor-pointer" onClick={() => { const username = part.slice(1); fetch(`/api/user/check-username?username=${encodeURIComponent(username)}`).then(r => r.ok ? r.json() : null).then(data => { if (data?.userId) router.push(`/profile/${data.userId}`); }); }}>{part}</span>;
      return part;
    });
  }

  function PostCard({ post }: { post: any }) {
    const isOwnPost = post.user?.id === profile?.userId;
    const isAdmin = profile?.isAdmin || profile?.isSuperAdmin;
    const isCollection = post.content?.startsWith('📚 Shared learning topic:') || post.content?.startsWith('📚 Shared my learning collection:');
    const topicIdMatch = post.content?.match(/\[topicId:([\w-]+)\]/);
    const topicId = topicIdMatch ? topicIdMatch[1] : null;

    return (
      <GlassCard className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 border border-border shrink-0"><AvatarFallback className="bg-blue-600/30 text-blue-300 text-xs">{post.user?.name?.[0] || '?'}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-foreground">{post.user?.name || 'User'} {post.user?.verified && <span className="text-blue-400">✓</span>}</p>
              <p className="text-[10px] text-muted-foreground/70">@{post.user?.username || 'user'}</p>
              {(isOwnPost || isAdmin) && (
                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-muted-foreground/50 hover:text-foreground p-1"><MoreHorizontal size={16} /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background border-border">
                      {isOwnPost && (
                        <DropdownMenuItem className="text-red-400 focus:text-red-300 cursor-pointer" onClick={() => deletePost(post.id)}>
                          <Trash2 size={14} className="mr-2" />Delete Post
                        </DropdownMenuItem>
                      )}
                      {isAdmin && !isOwnPost && (
                        <DropdownMenuItem className="text-red-400 focus:text-red-300 cursor-pointer" onClick={() => deletePost(post.id)}>
                          <Trash2 size={14} className="mr-2" />Delete (Admin)
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            {isCollection ? (
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-3 mb-1">
                <p className="text-sm text-blue-300">{post.content.replace(/\[topicId:[\w-]+\]/, '').trim()}</p>
                {/* Shared Topic CTA - navigates to full topic viewer */}
                {topicId && <SharedTopicCTA topicId={topicId} router={router} />}
              </div>
            ) : (
              <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-2">{renderContent(post.content)}</p>
            )}
            <div className="flex items-center gap-4">
              <button onClick={() => toggleLike(post.id, post.isLiked)} className={`flex items-center gap-1 text-xs transition-colors ${post.isLiked ? 'text-rose-400' : 'text-muted-foreground/70 hover:text-rose-400'}`}><Heart size={14} fill={post.isLiked ? 'currentColor' : 'none'} />{post.stats?.likes || post._count?.likes || 0}</button>
              <button onClick={() => { setCommentPostId(post.id); loadComments(post.id); }} className="flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-cyan-400 transition-colors"><MessageCircle size={14} />{post.stats?.comments || post._count?.comments || 0}</button>
              <button onClick={() => toggleRepost(post.id, post.isReposted)} className={`flex items-center gap-1 text-xs transition-colors ${post.isReposted ? 'text-green-400' : 'text-muted-foreground/70 hover:text-green-400'}`}><Repeat2 size={14} />{post.stats?.reposts || post._count?.reposts || 0}</button>
              <button onClick={() => toggleBookmark(post.id, post.isBookmarked)} className={`flex items-center gap-1 text-xs transition-colors ${post.isBookmarked ? 'text-amber-400' : 'text-muted-foreground/70 hover:text-amber-400'}`}><Bookmark size={14} fill={post.isBookmarked ? 'currentColor' : 'none'} /></button>
              <button onClick={() => openReport(post.id)} className="text-muted-foreground/60 hover:text-amber-400 ml-auto transition-colors"><Flag size={12} /></button>
            </div>
            {/* Comments */}
            <AnimatePresence>
              {commentPostId === post.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-3 border-t border-border pt-3">
                    {(openComments[post.id] || []).map((c: any, i: number) => (
                      <div key={c.id || i} className="mb-2 flex gap-2">
                        <Avatar className="h-6 w-6 shrink-0"><AvatarFallback className="bg-blue-600/30 text-blue-300 text-[8px]">{c.user?.name?.[0] || '?'}</AvatarFallback></Avatar>
                        <div>
                          <p className="text-[10px] text-muted-foreground">@{c.user?.username || 'user'}</p>
                          <p className="text-xs text-foreground">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <Input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment(post.id)} placeholder="Write a comment..." className="bg-white/5 border-border text-foreground text-xs h-8" />
                      <Button onClick={() => addComment(post.id)} size="sm" className="gradient-blue shrink-0 h-8"><Send size={12} /></Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (loading && !initialLoadRef.current) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Tabs value={activeFeedTab} onValueChange={setActiveFeedTab}>
        <TabsList className="bg-accent border border-border w-full flex">
          <TabsTrigger value="feed" className="text-muted-foreground data-[state=active]:text-blue-400 flex-1"><Rss size={14} className="mr-1" />Feed</TabsTrigger>
          <TabsTrigger value="live" className="text-muted-foreground data-[state=active]:text-green-400 flex-1"><Activity size={14} className="mr-1" />Live</TabsTrigger>
          <TabsTrigger value="myposts" className="text-muted-foreground data-[state=active]:text-blue-400 flex-1"><FileText size={14} className="mr-1" />{t('feed.myPosts')}</TabsTrigger>
          <TabsTrigger value="bookmarks" className="text-muted-foreground data-[state=active]:text-amber-400 flex-1"><Bookmark size={14} className="mr-1" />{t('feed.bookmarks')}</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4 space-y-4">
      {/* Create Post */}
      <GlassCard variant="glassmorphism" className="p-4">
        <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder={t('feed.createPost')} className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground/60 min-h-[80px]" rows={3} />
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-muted-foreground/60">{t('feed.textOnly')}</p>
          <Button onClick={createPost} disabled={submitting} className="gradient-blue text-xs">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.submit')}</Button>
        </div>
      </GlassCard>

      {/* Trending Groups */}
      {Object.entries(grouped).map(([tag, tagPosts]) => (
        <div key={tag}>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('feed.trending')}: #{tag}</h3>
          <div className="space-y-3">{tagPosts.map((p: any) => <PostCard key={p.id} post={p} />)}</div>
        </div>
      ))}

      {/* Ungrouped Posts */}
      <div className="space-y-3">{ungrouped.map((p: any) => <PostCard key={p.id} post={p} />)}</div>

      {posts.length === 0 && !loading && (
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
        </GlassCard>
      )}
        </TabsContent>

        {/* ═══ LIVE STATUS TAB ═══ */}
        <TabsContent value="live" className="mt-4 space-y-4">
          {/* Your Fitness Dashboard */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell size={16} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-foreground">Your Fitness Dashboard</h3>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-1" />
            </div>

            {feedWeightLogs.length === 0 && feedWorkouts.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 text-center py-6">No fitness data yet. Log workouts or weight to see your trends here.</p>
            ) : (
              <div className="space-y-4">
                {/* Weight Trend */}
                <AnimatePresence>
                  {feedWeightChartData.length >= 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-xs text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-blue-400" /> Weight Trend
                      </p>
                      <WeightChart data={feedWeightChartData} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Workout Calories Trend */}
                <AnimatePresence>
                  {feedWorkoutChartArr.length >= 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <p className="text-xs text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                        <Activity size={12} className="text-red-400" /> Workout Calories Trend
                      </p>
                      <WorkoutChart data={feedWorkoutChartArr} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </GlassCard>

          {/* Your Content Live Status */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Video size={16} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-foreground">Your Content Live Status</h3>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-1" />
            </div>

            {feedContentEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 text-center py-6">No content entries yet. Create entries on the Content page to track their live status.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {feedContentEntries.map((entry: any) => {
                  const ct = entry.contentType || 'post';
                  const pipeline = getPipeline(ct);
                  const currentIdx = getPipelineStepIndex(ct, entry.liveStatus || 'not_started');

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-accent/50 rounded-xl p-3"
                    >
                      {/* Entry Header */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 ${ct === 'blog' ? 'bg-purple-600/20 text-purple-400' : ct === 'video' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>
                          {contentTypeIcon(ct)}
                          {contentTypeLabel(ct)}
                        </span>
                        <p className="text-sm font-medium text-foreground truncate">{entry.title}</p>
                      </div>

                      {/* Pipeline Steps (view-only) */}
                      <div className="flex items-center gap-0">
                        {pipeline.map((step, idx) => {
                          const isCompleted = idx < currentIdx;
                          const isCurrent = idx === currentIdx;
                          const StepIcon = step.icon;

                          return (
                            <div key={step.key} className="flex items-center flex-1 last:flex-none">
                              {/* Step Circle (view-only, no click) */}
                              <div
                                className={`
                                  relative flex items-center justify-center w-7 h-7 rounded-full shrink-0 transition-all duration-300
                                  ${isCompleted ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : ''}
                                  ${isCurrent ? `${step.color} ring-2 ring-offset-1 ring-offset-background ring-current scale-110` : ''}
                                  ${!isCompleted && !isCurrent ? 'bg-white/5 text-muted-foreground/40' : ''}
                                `}
                              >
                                {isCompleted ? (
                                  <Check size={12} strokeWidth={3} />
                                ) : isCurrent ? (
                                  <StepIcon size={12} />
                                ) : (
                                  <StepIcon size={11} />
                                )}
                                {isCurrent && (
                                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current" />
                                )}
                              </div>

                              {/* Connector Line */}
                              {idx < pipeline.length - 1 && (
                                <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500/60' : isCurrent ? 'bg-gradient-to-r from-current/40 to-transparent' : 'bg-white/5'}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Step Labels */}
                      <div className="flex items-center mt-1.5">
                        {pipeline.map((step, idx) => (
                          <div key={step.key} className={`flex-1 text-center last:flex-none ${idx === currentIdx ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                            <span className={`text-[9px] font-medium ${idx === currentIdx ? step.color.split(' ')[0] : ''}`}>{step.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Completed Badge */}
                      {currentIdx === pipeline.length - 1 && (
                        <div className="flex justify-end mt-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 font-medium flex items-center gap-1">
                            <Check size={10} /> Live
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </TabsContent>

        {/* My Posts Tab */}
        <TabsContent value="myposts" className="mt-4 space-y-4">
          {posts.filter(p => p.user?.id === profile?.userId && !p.isRepost).length === 0 ? (
            <GlassCard className="p-8 text-center"><p className="text-muted-foreground">You haven&apos;t posted anything yet</p></GlassCard>
          ) : (
            posts.filter(p => p.user?.id === profile?.userId && !p.isRepost).map((p: any) => <PostCard key={p.id} post={p} />)
          )}
        </TabsContent>

        {/* Bookmarks Tab */}
        <TabsContent value="bookmarks" className="mt-4 space-y-4">
          {posts.filter(p => p.isBookmarked).length === 0 ? (
            <GlassCard className="p-8 text-center"><p className="text-muted-foreground">{t('feed.noBookmarks')}</p></GlassCard>
          ) : (
            posts.filter(p => p.isBookmarked).map((p: any) => <PostCard key={p.id} post={p} />)
          )}
        </TabsContent>
      </Tabs>

      {/* Ad Banner — bottom of page, above footer */}
      <AdCard format="in-feed" slot="feed_top" />

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="bg-background border-border">
          <DialogHeader><DialogTitle className="text-foreground flex items-center gap-2"><AlertTriangle size={18} className="text-amber-400" />Report Post</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Violation Type</Label>
              <select value={reportCategory} onChange={e => setReportCategory(e.target.value)} className="w-full bg-accent border border-border text-foreground rounded-md px-3 py-2 text-sm">
                <option value="" className="bg-background">Select violation type</option>
                <option value="spam" className="bg-background">Spam</option>
                <option value="harassment" className="bg-background">Harassment or Bullying</option>
                <option value="inappropriate" className="bg-background">Inappropriate Content</option>
                <option value="hate_speech" className="bg-background">Hate Speech</option>
                <option value="misinformation" className="bg-background">Misinformation</option>
                <option value="violence" className="bg-background">Violence or Threats</option>
                <option value="copyright" className="bg-background">Copyright Violation</option>
                <option value="other" className="bg-background">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Reason</Label>
              <Textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Please describe the issue in detail..." className="bg-accent border-border text-foreground placeholder:text-muted-foreground/50 min-h-[100px]" rows={4} />
            </div>
            <Button onClick={submitReport} disabled={reportSubmitting || !reportCategory || !reportReason.trim()} className="gradient-blue w-full">
              {reportSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Flag size={14} className="mr-2" />}
              Submit Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
