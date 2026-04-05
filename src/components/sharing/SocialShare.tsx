import { useState } from 'react';
import { Twitter, MessageCircle, Copy, Share2, ExternalLink, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  generateTwitterShare,
  generateMastodonShareForInstance,
  generateRedditShare,
  copyToClipboard,
  getCleanUrl,
  generateEmbedCode,
  POPULAR_MASTODON_INSTANCES,
  type FilamentForSharing,
} from '@/utils/sharing';
import { toast } from 'sonner';
import { ShareToast } from './ShareToast';

interface SocialShareProps {
  filament: FilamentForSharing;
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showEmbed?: boolean;
}

export function SocialShare({ filament, className, variant = 'horizontal', showEmbed = false }: SocialShareProps) {
  const [showMastodonDialog, setShowMastodonDialog] = useState(false);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState('mastodon.social');
  const [customInstance, setCustomInstance] = useState('');
  const [embedSize, setEmbedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const url = getCleanUrl();

  const handleTwitterShare = () => {
    const shareUrl = generateTwitterShare(filament, url);
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
  };

  const handleMastodonShare = () => {
    setShowMastodonDialog(true);
  };

  const handleMastodonShareConfirm = () => {
    const instance = customInstance || selectedInstance;
    const shareUrl = generateMastodonShareForInstance(filament, url, instance);
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
    setShowMastodonDialog(false);
    toast.success('Opening Mastodon share...');
  };

  const handleRedditShare = () => {
    const shareUrl = generateRedditShare(filament, url);
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setToastMessage('Link copied to clipboard!');
      setShowToast(true);
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyEmbed = async (embedCode: string) => {
    const success = await copyToClipboard(embedCode);
    if (success) {
      setToastMessage('Embed code copied!');
      setShowToast(true);
      setShowEmbedDialog(false);
    } else {
      toast.error('Failed to copy embed code');
    }
  };

  const currentEmbedCode = generateEmbedCode(filament.id, embedSize);

  const isHorizontal = variant === 'horizontal';

  return (
    <>
      <div className={className}>
        {/* Section Header */}
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Share this Filament
        </h3>

        {/* Share Buttons */}
        <div className={isHorizontal ? 'flex gap-2' : 'space-y-2'}>
          {/* Twitter/X */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTwitterShare}
            className={isHorizontal ? 'flex-1' : 'w-full justify-start'}
          >
            <Twitter className="w-4 h-4 mr-2" />
            Twitter
          </Button>

          {/* Mastodon */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleMastodonShare}
            className={isHorizontal ? 'flex-1' : 'w-full justify-start'}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Mastodon
          </Button>

          {/* Reddit */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedditShare}
            className={isHorizontal ? 'flex-1' : 'w-full justify-start'}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Reddit
          </Button>

          {/* Copy Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className={isHorizontal ? 'flex-1' : 'w-full justify-start'}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>

        {/* Direct Link Display */}
        <div className="mt-3 space-y-2">
          <div className="relative">
            <Input
              value={url}
              readOnly
              className="text-xs pr-16 bg-muted/50"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyLink}
              className="absolute right-1 top-1 h-7 px-2 text-xs"
            >
              <Copy className="w-3.5 h-3.5 mr-1" />
              Copy
            </Button>
          </div>

          {/* Embed Code Generator */}
          {showEmbed && (
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmbedDialog(true)}
                className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
              >
                <Code className="w-3.5 h-3.5 mr-2" />
                Or embed this filament
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mastodon Instance Selection Dialog */}
      <Dialog open={showMastodonDialog} onOpenChange={setShowMastodonDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share to Mastodon</DialogTitle>
            <DialogDescription>
              Select your Mastodon instance to share
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Popular Instances</Label>
              <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_MASTODON_INSTANCES.map((instance) => (
                    <SelectItem key={instance} value={instance}>
                      {instance}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-instance">Or enter custom instance</Label>
              <Input
                id="custom-instance"
                placeholder="e.g., mastodon.example.com"
                value={customInstance}
                onChange={(e) => setCustomInstance(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowMastodonDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMastodonShareConfirm}>
              Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embed Code Dialog */}
      <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Embed this Filament</DialogTitle>
            <DialogDescription>
              Copy the embed code to add this filament to your blog or website
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={embedSize} onValueChange={(value) => setEmbedSize(value as 'small' | 'medium' | 'large')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (300×250)</SelectItem>
                  <SelectItem value="medium">Medium (400×300)</SelectItem>
                  <SelectItem value="large">Large (500×400)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="embed-code">Embed Code</Label>
              <div className="relative">
                <textarea
                  id="embed-code"
                  readOnly
                  value={currentEmbedCode}
                  className="w-full h-32 p-3 text-xs font-mono rounded-md border bg-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyEmbed(currentEmbedCode)}
                  className="absolute right-2 top-2"
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground">
                Preview: This will display a filament card with brand, material, color, TD value, and a link to FilaScope.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowEmbedDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      <ShareToast
        show={showToast}
        message={toastMessage}
        duration={2000}
        onHide={() => setShowToast(false)}
      />
    </>
  );
}
