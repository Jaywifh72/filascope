import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Inline error indicator for individual data points (price, score, etc.)
 * Shows a small amber icon + message with optional retry link.
 */
export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <AlertCircle className="w-3.5 h-3.5 text-amber-500/70 flex-shrink-0" />
      <span className="text-xs text-muted-foreground">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
}
