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

  if (!shareData) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/shared-topic/${shareData.id}?from=share`
    : '';

  const shareMessage = `Shared: ${shareData.preview}\n\n${shareUrl}`;

  // Fetch conversations when user clicks "Share to Chat"
  useEffect(() => {
    if (activeSection === 'chats' && conversations.length === 0) {
      setLoadingTargets(true);
      fetch('/api/messages')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const convs = Array.isArray(data?.conversations) ? data.conversations : [];
          setConversations(convs);
        })
        .catch(() => {})
        .finally(() => setLoadingTargets(false));
    }
  }, [activeSection]);

  // Fetch groups when user clicks "Share to Group"
  useEffect(() => {
    if (activeSection === 'groups' && groups.length === 0) {
      setLoadingTargets(true);
      fetch('/api/groups')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const grps = Array.isArray(data?.groups) ? data.groups : [];
          setGroups(grps);
        })
        .catch(() => {})
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
        onClose();
        setActiveSection('actions');
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || 'Failed to share');
      }
    } catch {
      toast.error('Failed to share');
    } finally {
      setSharing(false);
    }
  }

  async function shareToGroupChat(groupId: string) {
    setSharing(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: shareMessage }),
      });
      if (res.ok) {
        toast.success('Shared to group!');
        onClose();
        setActiveSection('actions');
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || 'Failed to share to group');
      }
    } catch {
      toast.error('Failed to share to group');
    } finally {
      setSharing(false);
    }
  }

  const typeLabel = {
    post: 'Post',
    content_update: 'Content Update',
    fitness_update: 'Fitness Update',
    learning_update: 'Learning Topic',
  }[shareData.type] || 'Item';

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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setActiveSection('actions'); } }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 size={18} />
            Share {typeLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-accent/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">
              {shareData.userName ? `by ${shareData.userName}` : ''}
            </p>
            <p className="text-sm text-foreground line-clamp-3">
              {shareData.preview}
            </p>
          </div>

          {/* Share URL - fixed overflow with proper containment */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-accent/30 rounded-md px-3 py-2 text-xs text-muted-foreground border border-border/50 min-w-0">
              <p className="truncate">{shareUrl}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={copyLink}
              className="shrink-0"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
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
      </DialogContent>
    </Dialog>
  );
}
