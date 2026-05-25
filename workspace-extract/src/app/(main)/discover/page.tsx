'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Search, Globe, Lock, Users, BadgeCheck, Loader2, BookOpen, UserPlus, LogIn, ChevronRight, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserStore } from '@/stores/user-store';
import { t } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

const TABS = ['posts', 'topics', 'groups', 'users'];

export default function DiscoverPage() {
  const router = useRouter();
  const { profile } = useUserStore();
  const [activeTab, setActiveTab] = useState('posts');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ posts: [], topics: [], groups: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState<string|null>(null);

  const search = useCallback(async (type?: string) => {
    const tab = type || activeTab;
    if (!query.trim() && tab !== 'groups' && tab !== 'topics') { setResults({ posts: [], topics: [], groups: [], users: [] }); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/discover?type=${tab}&q=${encodeURIComponent(query.toLowerCase())}`);
      if (r.ok) {
        const d = await r.json();
        const items = Array.isArray(d) ? d : (d[tab] || []);
        setResults(prev => ({ ...prev, [tab]: items }));
      }
    } catch {} finally { setLoading(false); }
  }, [query, activeTab]);

  useEffect(() => { if (activeTab === 'groups' || activeTab === 'topics' || query.trim()) search(); }, [activeTab, search]);

  // Handle URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) { setQuery(q); }
  }, []);

  async function followUser(userId: string) {
    try { await fetch('/api/follow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) }); search('users'); } catch {}
  }

  async function joinGroup(groupId: string) {
    setJoinLoading(groupId);
    try {
      const r = await fetch(`/api/groups/${groupId}/join`, { method: 'POST' });
      if (r.ok) {
        toast.success('Joined group!');
        search('groups');
      } else {
        const d = await r.json();
        toast.error(d.error || 'Failed to join group');
      }
    } catch {
      toast.error('Failed to join group');
    } finally {
      setJoinLoading(null);
    }
  }

  function renderContent(text: string) {
    return text.split(/(#\w+|@\w+)/g).map((part, i) => {
      if (part.startsWith('#')) return <span key={i} className="text-blue-400 cursor-pointer" onClick={() => { setQuery(part); setActiveTab('posts'); }}>{part}</span>;
      if (part.startsWith('@')) return <span key={i} className="text-purple-400 cursor-pointer" onClick={() => { const username = part.slice(1); fetch(`/api/user/check-username?username=${encodeURIComponent(username)}`).then(r => r.ok ? r.json() : null).then(data => { if (data?.userId) router.push(`/profile/${data.userId}`); }); }}>{part}</span>;
      return part;
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Search */}
      <GlassCard className="p-4">
        <div className="flex gap-2">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} /><Input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder={t('discover.searchPlaceholder')} className="bg-accent border-border text-foreground pl-10 placeholder:text-muted-foreground/50" /></div>
          <Button onClick={() => search()} className="gradient-blue">{t('common.search')}</Button>
        </div>
      </GlassCard>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-accent border border-border w-full flex">
          {TABS.map(tab => <TabsTrigger key={tab} value={tab} className="text-muted-foreground data-[state=active]:text-blue-400 data-[state=active]:bg-blue-600/20 text-xs flex-1">{t(`discover.${tab}`)}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="posts" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div> :
          (Array.isArray(results.posts) ? results.posts : []).map((p: any) => (
            <GlassCard key={p.id} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-blue-600/30 text-blue-300 text-xs">{p.user?.name?.[0] || '?'}</AvatarFallback></Avatar>
                <div><p className="text-sm font-medium text-foreground">{p.user?.name || 'User'} {p.user?.verified && <BadgeCheck size={12} className="text-blue-400 inline" />}</p><p className="text-[10px] text-muted-foreground">@{p.user?.username || ''}</p></div>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{renderContent(p.content)}</p>
            </GlassCard>
          ))}
        </TabsContent>

        <TabsContent value="topics" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div> :
          (Array.isArray(results.topics) ? results.topics : []).map((topic: any) => (
            <GlassCard
              key={topic.id}
              className="p-4 cursor-pointer hover:border-blue-500/20 transition-colors group"
              onClick={() => router.push(`/shared-topic/${topic.id}?from=discover`)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/15 flex items-center justify-center shrink-0 group-hover:bg-blue-600/25 transition-colors">
                  <BookOpen size={16} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground group-hover:text-blue-300 transition-colors truncate">{topic.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {topic.isSharedCollection ? <Globe size={14} className="text-green-400" /> : <Lock size={14} className="text-muted-foreground/50" />}
                      <ChevronRight size={16} className="text-muted-foreground/30 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground/70">{topic.entryCount || 0} entries</span>
                    {topic.phase && <span className="text-[10px] bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded-full">{topic.phase}</span>}
                    {topic.sharedAt && (
                      <span className="text-[10px] text-muted-foreground/50">Shared {new Date(topic.sharedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  {/* Owner info — same style as feed */}
                  {topic.author && (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarFallback className="bg-blue-600/30 text-blue-300 text-[8px]">{topic.author.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-muted-foreground">
                        by <span className="text-foreground font-medium">{topic.author.name}</span>
                      </span>
                      {topic.author.verified && <BadgeCheck size={10} className="text-blue-400" />}
                      <span className="text-[10px] text-muted-foreground/50">@{topic.author.username}</span>
                    </div>
                  )}
                  {/* View Collection CTA — like feed */}
                  <div className="mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-300 font-medium group-hover:text-blue-200 transition-colors">
                      <Sparkles size={8} className="text-amber-400/60 group-hover:text-amber-400 transition-colors" />
                      View Shared Collection
                      <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
          {!loading && (Array.isArray(results.topics) ? results.topics : []).length === 0 && (
            <GlassCard className="p-8 text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No shared topics found</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Try searching for a topic name</p>
            </GlassCard>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div> :
          (Array.isArray(results.groups) ? results.groups : []).map((g: any) => (
            <GlassCard key={g.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center"><Users size={18} className="text-emerald-400" /></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{g.name}</p>
                    <p className="text-[10px] text-muted-foreground">{g.memberCount || g._count?.members || 0} members{g.isPublic ? ' · Public' : ' · Private'}</p>
                  </div>
                </div>
                {g.isPublic && (
                  <Button
                    onClick={() => joinGroup(g.id)}
                    size="sm"
                    variant="ghost"
                    disabled={joinLoading === g.id}
                    className="text-emerald-400 text-xs"
                  >
                    {joinLoading === g.id ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} className="mr-1" />}
                    Join
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </TabsContent>

        <TabsContent value="users" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div> :
          (Array.isArray(results.users) ? results.users : []).map((u: any) => (
            <GlassCard key={u.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/profile/${u.id}`)}>
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-600/30 text-blue-300 text-sm">{u.name?.[0] || u.username?.[0] || '?'}</AvatarFallback></Avatar>
                <div><p className="text-sm font-medium text-foreground">{u.name || u.username} {u.verified && <BadgeCheck size={12} className="text-blue-400 inline" />}</p><p className="text-[10px] text-muted-foreground">@{u.username}</p></div>
              </div>
              {u.id !== profile?.userId && (
                <Button onClick={() => followUser(u.id)} size="sm" variant="ghost" className={`text-xs ${u.isFollowing ? 'text-muted-foreground' : u.followRequestStatus === 'pending' ? 'text-amber-400' : 'text-blue-400'}`}>
                  {u.isFollowing ? 'Following' : u.followRequestStatus === 'pending' ? 'Requested' : u.isPublic === false ? 'Request' : 'Follow'}
                </Button>
              )}
            </GlassCard>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
