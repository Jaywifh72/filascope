import { useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SectionErrorProps {
  title: string;
  description?: string;
  onRetry: () => void;
  onDismiss?: () => void;
  compact?: boolean;
  className?: string;
}

export function SectionError({
  title,
  description = 'This section failed to load. The rest of the page is working normally.',
  onRetry,
  onDismiss,
  compact = false,
  className,
}: SectionErrorProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (compact) {
    return (
      <div
        className={cn(
          'rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 animate-in fade-in slide-in-from-top-2 duration-300',
          'flex items-center gap-3',
          className
        )}
        role="alert"
      >
        <AlertTriangle className="w-[18px] h-[18px] text-amber-500 flex-shrink-0" />
        <span className="text-sm font-medium text-foreground flex-1">{title}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRetry} className="h-7 text-xs px-2.5">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Retry
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-7 w-7 p-0">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-6 animate-in fade-in slide-in-from-top-2 duration-300',
        'flex items-start gap-4',
        className
      )}
      role="alert"
    >
      <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Try Again
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
