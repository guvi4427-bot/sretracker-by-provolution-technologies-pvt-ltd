'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

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

export default function ShareToChatDialog({ isOpen, onClose, shareData }: ShareToChatDialogProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!shareData) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/shared-topic/${shareData.id}?from=share`
    : '';

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

  async function shareToChat() {
    setSharing(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `Shared: ${shareData.preview}\n\n${shareUrl}`,
          shareType: shareData.type,
        }),
      });
      if (res.ok) {
        toast.success('Shared to chat!');
        onClose();
      } else {
        toast.error('Failed to share');
      }
    } catch {
      toast.error('Failed to share');
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
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

          {/* Share URL */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-accent/30 rounded-md px-3 py-2 text-xs text-muted-foreground truncate border border-border/50">
              {shareUrl}
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

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={shareToChat}
              disabled={sharing}
              className="w-full"
            >
              <MessageCircle size={16} className="mr-2" />
              {sharing ? 'Sharing...' : 'Share to Chat'}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
