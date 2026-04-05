import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareToastProps {
  show: boolean;
  message?: string;
  duration?: number;
  onHide?: () => void;
}

export function ShareToast({
  show,
  message = 'Link copied!',
  duration = 2000,
  onHide
}: ShareToastProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onHide?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onHide]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-2 px-4 py-3',
        'bg-emerald-500 text-white rounded-lg shadow-lg',
        'animate-in slide-in-from-bottom-2 fade-in duration-300',
        'transition-all duration-300'
      )}
      role="status"
      aria-live="polite"
    >
      <Check className="w-5 h-5" />
      <span className="font-medium">{message}</span>
    </div>
  );
}
