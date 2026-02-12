import { useState, useCallback } from 'react';
import { Share2, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  title?: string;
  className?: string;
}

export function ShareButton({ title, className }: ShareButtonProps) {
  const [justCopied, setJustCopied] = useState(false);

  const getCleanUrl = useCallback(() => {
    const url = new URL(window.location.href);
    // Strip tracking / session params, keep only path + hash
    url.search = '';
    return url.toString();
  }, []);

  const handleShare = useCallback(async () => {
    const url = getCleanUrl();

    // Try native share on supported devices
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || document.title,
          url,
        });
        return;
      } catch {
        // User cancelled or API failed — fall through to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url);
      setJustCopied(true);
      toast.success('Link copied!', { duration: 2000 });
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [getCleanUrl, title]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleShare}
          aria-label="Share this filament"
          className={cn(
            "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg",
            "bg-transparent border border-border hover:bg-accent hover:border-border",
            "text-muted-foreground hover:text-foreground transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            className,
          )}
        >
          {justCopied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        Share this filament
      </TooltipContent>
    </Tooltip>
  );
}
