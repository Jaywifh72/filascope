import React, { useState } from 'react';
import { AlertTriangle, Flag, ExternalLink, Loader2, Wrench, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface BrokenUrlReportProps {
  entityType: 'filament' | 'printer' | 'accessory';
  entityId: string;
  urlField: string;
  currentUrl: string;
  productName?: string;
  errorType?: '404' | 'error';
  onReported?: () => void;
  onFixed?: (newUrl: string) => void;
  className?: string;
}

/**
 * Component displayed when a product URL is detected as broken (404 or similar error).
 * Allows users to report the broken URL for admin review.
 * Admins can also trigger an auto-fix attempt directly.
 */
export function BrokenUrlReport({
  entityType,
  entityId,
  urlField,
  currentUrl,
  productName,
  errorType = 'error',
  onReported,
  onFixed,
  className,
}: BrokenUrlReportProps) {
  const { isAdmin } = useAuth();
  const [isReporting, setIsReporting] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixedUrl, setFixedUrl] = useState<string | null>(null);

  // Extract store homepage from URL
  const getStoreHomepage = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch {
      return null;
    }
  };

  const handleReport = async () => {
    if (isReporting || hasReported) return;
    
    setIsReporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('report-broken-url', {
        body: {
          entityType,
          entityId,
          urlField,
          url: currentUrl,
          errorType,
        },
      });

      if (error) {
        console.error('Error reporting broken URL:', error);
        toast.error('Failed to report broken URL');
        return;
      }

      if (data?.success) {
        setHasReported(true);
        toast.success('URL reported — thank you!');
        onReported?.();
      } else {
        toast.error(data?.error || 'Failed to report URL');
      }
    } catch (err) {
      console.error('Error reporting broken URL:', err);
      toast.error('Failed to report broken URL');
    } finally {
      setIsReporting(false);
    }
  };

  const handleAutoFix = async () => {
    if (isFixing || fixedUrl) return;
    
    setIsFixing(true);
    try {
      // Get product details for the fixer
      let productTitle = productName || '';
      let vendor = '';
      
      if (entityType === 'filament') {
        const { data } = await supabase
          .from('filaments')
          .select('product_title, vendor')
          .eq('id', entityId)
          .maybeSingle();
        if (data) {
          productTitle = data.product_title;
          vendor = data.vendor || '';
        }
      }

      const { data, error } = await supabase.functions.invoke('fix-filament-url', {
        body: {
          entityId,
          entityType,
          urlField,
          productTitle,
          vendor,
          currentUrl,
        },
      });

      if (error) {
        console.error('Error fixing URL:', error);
        toast.error('Auto-fix failed');
        return;
      }

      if (data?.newUrl) {
        setFixedUrl(data.newUrl);
        toast.success('URL fixed successfully!');
        onFixed?.(data.newUrl);
      } else {
        toast.error(data?.error || 'Could not find a replacement URL');
      }
    } catch (err) {
      console.error('Error fixing URL:', err);
      toast.error('Auto-fix failed');
    } finally {
      setIsFixing(false);
    }
  };

  const storeHomepage = getStoreHomepage(currentUrl);
  const storeName = storeHomepage ? new URL(storeHomepage).hostname.replace('www.', '') : 'store';

  // If URL was fixed, show success state
  if (fixedUrl) {
    return (
      <div className={cn(
        "rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4",
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-emerald-500/10">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-emerald-400">
              URL Fixed!
            </h4>
            <p className="text-xs text-muted-foreground mt-1 break-all">
              New URL: {fixedUrl}
            </p>
            <p className="text-xs text-emerald-400/80 mt-2">
              Refresh the page to see updated pricing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg border border-amber-500/30 bg-amber-500/5 p-4",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 rounded-full bg-amber-500/10">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-amber-400">
            {errorType === '404' ? 'Product page not found' : 'Unable to load product page'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {errorType === '404' 
              ? 'The URL for this product may have changed or the product may be discontinued.'
              : 'We couldn\'t fetch the current price. The store may be temporarily unavailable.'}
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            {/* Admin Auto-Fix Button */}
            {isAdmin && (
              <Button
                variant="default"
                size="sm"
                onClick={handleAutoFix}
                disabled={isFixing}
                className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90"
              >
                {isFixing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wrench className="w-3.5 h-3.5" />
                )}
                Try Auto-Fix
              </Button>
            )}

            {/* Report Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReport}
              disabled={isReporting || hasReported}
              className={cn(
                "h-8 text-xs gap-1.5",
                hasReported && "border-emerald-500/30 text-emerald-400"
              )}
            >
              {isReporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : hasReported ? (
                <>
                  <Flag className="w-3.5 h-3.5" />
                  Reported
                </>
              ) : (
                <>
                  <Flag className="w-3.5 h-3.5" />
                  Report Broken URL
                </>
              )}
            </Button>

            {/* Go to Store Homepage */}
            {storeHomepage && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <a href={storeHomepage} target="_blank" rel="noopener noreferrer">
                  Go to {storeName}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
