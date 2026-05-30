'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Share2, MessageCircle, Copy, Check, ExternalLink, Users, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

// ── Share Data Type ──
export interface ShareData {
  type: 'post' | 'content_update' | 'fitness_update' | 'learning_update';
  id: string;
  preview: string;
  userName?: string;
  username?: string;
  extra?: Record<string, any>;
}

interface ShareToChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: ShareData | null;
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    name: string;
    avatarUrl?: string;
  };
  lastMessage: string;
  lastMessageAt: string;
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
  isPublic: boolean;
}

export default function ShareToChatDialog({ isOpen, onClose, shareData }: ShareToChatDialogProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [activeSection, setActiveSection] = useState<'actions' | 'chats' | 'groups'>('actions');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog closes
  const handleClose = () => {
    setError(null);
    setActiveSection('actions');
    onClose();
  };

  const getShareUrl = (data: ShareData): string => {
    if (typeof window === 'undefined') return '';
    try {
      const origin = window.location.origin;
      switch (data.type) {
        case 'post':
          return `${origin}/feed?post=${data.id}`;
        case 'learning_update':
          return `${origin}/shared-topic/${data.id}?from=share`;
        case 'content_update':
          return `${origin}/discover?q=%23content`;
        case 'fitness_update':
          return `${origin}/discover?q=%23fitness`;
        default:
          return `${origin}/shared-topic/${data.id}?from=share`;
      }
    } catch {
      return '';
    }
  };

  // Safe defaults when shareData is null/undefined
  const safeShareData = shareData || { type: 'post' as const, id: '', preview: '' };
  const shareUrl = getShareUrl(safeShareData);
  const shareMessage = `Shared: ${safeShareData.preview || 'Item'}\n\n${shareUrl}`;

  // Fetch conversations when user clicks "Share to Chat"
  useEffect(() => {
    if (activeSection === 'chats' && conversations.length === 0) {
      setLoadingTargets(true);
      setError(null);
      fetch('/api/messages')
        .then(r => {
          if (!r.ok) throw new Error('Failed to load chats');
          return r.json();
        })
        .then(data => {
          const convs = Array.isArray(data?.conversations) ? data.conversations : [];
          setConversations(convs);
        })
        .catch((err) => {
          setError(err?.message || 'Could not load your chats. Please try again.');
        })
        .finally(() => setLoadingTargets(false));
    }
  }, [activeSection]);

  // Fetch groups when user clicks "Share to Group"
  useEffect(() => {
    if (activeSection === 'groups' && groups.length === 0) {
      setLoadingTargets(true);
      setError(null);
      fetch('/api/groups')
        .then(r => {
          if (!r.ok) throw new Error('Failed to load groups');
          return r.json();
        })
        .then(data => {
          const grps = Array.isArray(data?.groups) ? data.groups : [];
          setGroups(grps);
        })
        .catch((err) => {
          setError(err?.message || 'Could not load your groups. Please try again.');
        })
        .finally(() => setLoadingTargets(false));
    }
  }, [activeSection]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }

  async function shareToDM(receiverId: string) {
    setSharing(true);
    setError(null);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId,
          content: shareMessage,
        }),
      });
      if (res.ok) {
        toast.success('Shared to chat!');
        handleClose();
      } else {
        const d = await res.json().catch(() => ({}));
        const errMsg = d.error || 'Failed to share to chat';
        setError(errMsg);
        toast.error(errMsg);
      }
    } catch {
      const errMsg = 'Network error. Please check your connection and try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSharing(false);
    }
  }

  async function shareToGroupChat(groupId: string) {
    setSharing(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: shareMessage }),
      });
      if (res.ok) {
        toast.success('Shared to group!');
        handleClose();
      } else {
        const d = await res.json().catch(() => ({}));
        const errMsg = d.error || 'Failed to share to group';
        setError(errMsg);
        toast.error(errMsg);
      }
    } catch {
      const errMsg = 'Network error. Please check your connection and try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSharing(false);
    }
  }

  const typeLabel = {
    post: 'Post',
    content_update: 'Content Update',
    fitness_update: 'Fitness Update',
    learning_update: 'Learning Topic',
  }[safeShareData.type] || 'Item';

  // Filter conversations by search query
  const filteredConversations = chatQuery.trim()
    ? conversations.filter(c =>
        c.otherUser.name?.toLowerCase().includes(chatQuery.toLowerCase()) ||
        c.otherUser.username?.toLowerCase().includes(chatQuery.toLowerCase())
      )
    : conversations;

  const filteredGroups = chatQuery.trim()
    ? groups.filter(g => g.name?.toLowerCase().includes(chatQuery.toLowerCase()))
    : groups;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { handleClose(); } }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 size={18} />
            Share {typeLabel}
          </DialogTitle>
        </DialogHeader>

        {!shareData ? (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">No item selected to share</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="bg-destructive/10 rounded-lg p-4 text-center">
              <p className="text-sm text-destructive font-medium">Something went wrong</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setError(null); setActiveSection('actions'); }}
            >
              Try Again
            </Button>
          </div>
        ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-accent/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">
              {safeShareData.userName ? `by ${safeShareData.userName}` : ''}
            </p>
            <p className="text-sm text-foreground line-clamp-3">
              {safeShareData.preview}
            </p>
          </div>

          {/* Share URL - properly contained, copy button always visible */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 bg-accent/30 rounded-md px-3 py-2 text-xs text-muted-foreground border border-border/50 min-w-0">
              <p className="truncate">{shareUrl || 'Generating link...'}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={copyLink}
              className="shrink-0 min-w-[36px]"
              disabled={!shareUrl}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>

          {/* External Share Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 min-w-[120px] text-xs"
              onClick={() => {
                window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(safeShareData.preview?.slice(0, 100) || 'Check this out')}`, '_blank');
              }}
              disabled={!shareUrl}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-1.5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
              Reddit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 min-w-[120px] text-xs"
              onClick={() => {
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(safeShareData.preview?.slice(0, 100) || 'Check this out')}`, '_blank');
              }}
              disabled={!shareUrl}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-1.5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X (Twitter)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 min-w-[120px] text-xs"
              onClick={() => {
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent((safeShareData.preview?.slice(0, 100) || 'Check this out') + ' ' + shareUrl)}`, '_blank');
              }}
              disabled={!shareUrl}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-1.5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </Button>
          </div>

          {activeSection === 'actions' && (
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => setActiveSection('chats')}
                className="w-full"
              >
                <MessageCircle size={16} className="mr-2" />
                Share to Chat
              </Button>

              <Button
                onClick={() => setActiveSection('groups')}
                variant="outline"
                className="w-full"
              >
                <Users size={16} className="mr-2" />
                Share to Group
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  window.open(shareUrl, '_blank');
                }}
                className="w-full"
              >
                <ExternalLink size={16} className="mr-2" />
                Open in New Tab
              </Button>
            </div>
          )}

          {activeSection === 'chats' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setActiveSection('actions')} className="text-xs shrink-0">
                  ← Back
                </Button>
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                  <Input
                    value={chatQuery}
                    onChange={e => setChatQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="bg-accent border-border text-foreground text-xs h-8 pl-8"
                  />
                </div>
              </div>

              {loadingTargets ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No conversations found</p>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {filteredConversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => shareToDM(conv.otherUser.id)}
                      disabled={sharing}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-blue-600/30 text-blue-300 text-xs">
                          {conv.otherUser.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{conv.otherUser.name || conv.otherUser.username}</p>
                        <p className="text-[10px] text-muted-foreground truncate">@{conv.otherUser.username}</p>
                      </div>
                      {sharing && <Loader2 size={14} className="animate-spin text-blue-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'groups' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setActiveSection('actions')} className="text-xs shrink-0">
                  ← Back
                </Button>
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                  <Input
                    value={chatQuery}
                    onChange={e => setChatQuery(e.target.value)}
                    placeholder="Search groups..."
                    className="bg-accent border-border text-foreground text-xs h-8 pl-8"
                  />
                </div>
              </div>

              {loadingTargets ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                </div>
              ) : filteredGroups.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No groups found. Join a group first!</p>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {filteredGroups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => shareToGroupChat(group.id)}
                      disabled={sharing}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0">
                        <Users size={14} className="text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{group.name}</p>
                        <p className="text-[10px] text-muted-foreground">{group.memberCount} members{group.isPublic ? ' · Public' : ' · Private'}</p>
                      </div>
                      {sharing && <Loader2 size={14} className="animate-spin text-blue-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
