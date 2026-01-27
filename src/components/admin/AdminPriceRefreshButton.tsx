import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { RefreshCw, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminPriceRefresh } from '@/hooks/useAdminPriceRefresh';
import { cn } from '@/lib/utils';

interface AdminPriceRefreshButtonProps {
  productUrl: string;
  filamentId: string;
  netWeightGrams?: number | null;
  onRefreshComplete?: (success: boolean, newPrice?: number) => void;
  className?: string;
}

type VisualState = 'idle' | 'refreshing' | 'success' | 'error';

export function AdminPriceRefreshButton({
  productUrl,
  filamentId,
  netWeightGrams,
  onRefreshComplete,
  className,
}: AdminPriceRefreshButtonProps) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { refreshPrice, isRefreshing, lastRefreshError } = useAdminPriceRefresh(
    productUrl,
    filamentId,
    netWeightGrams ?? null
  );
  const [visualState, setVisualState] = useState<VisualState>('idle');

  // Only render for authenticated admin users
  if (authLoading || !user || !isAdmin) {
    return null;
  }

  const handleClick = async () => {
    if (isRefreshing) return;
    
    setVisualState('refreshing');
    
    const result = await refreshPrice();
    
    if (result.success) {
      setVisualState('success');
      toast.success(`Price updated to $${result.newPrice?.toFixed(2)}`);
      onRefreshComplete?.(true, result.newPrice);
      
      // Reset to idle after brief success display
      setTimeout(() => setVisualState('idle'), 1500);
    } else {
      setVisualState('error');
      toast.error(result.error || 'Failed to refresh price');
      onRefreshComplete?.(false);
      
      // Reset to idle after error display
      setTimeout(() => setVisualState('idle'), 2000);
    }
  };

  const getIcon = () => {
    switch (visualState) {
      case 'refreshing':
        return <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
      case 'success':
        return <Check className="w-3.5 h-3.5 text-green-500" />;
      case 'error':
        return <X className="w-3.5 h-3.5 text-destructive" />;
      default:
        return <RefreshCw className="w-3.5 h-3.5" />;
    }
  };

  const getTooltipContent = () => {
    if (visualState === 'error' && lastRefreshError) {
      return lastRefreshError;
    }
    if (visualState === 'success') {
      return 'Price updated!';
    }
    if (visualState === 'refreshing') {
      return 'Refreshing price...';
    }
    return 'Refresh price from store';
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6 text-muted-foreground hover:text-foreground',
              visualState === 'success' && 'text-green-500 hover:text-green-500',
              visualState === 'error' && 'text-destructive hover:text-destructive',
              className
            )}
            onClick={handleClick}
            disabled={isRefreshing}
            aria-label="Refresh price from store"
          >
            {getIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
