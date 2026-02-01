import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, ExternalLink, AlertCircle, Loader2, AlertTriangle, Search, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLivePriceFetch, LivePriceFetchResult, StockStatus } from '@/hooks/useLivePriceFetch';
import { useRegion } from '@/contexts/RegionContext';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// Helper to get stock display configuration based on status
interface StockDisplayConfig {
  icon: LucideIcon;
  colorClass: string;
  badgeClass: string;
  label: string | null;
  canBuy: boolean;
}

function getStockDisplay(result: LivePriceFetchResult): StockDisplayConfig {
  const status = result.stockStatus || (result.available === false ? 'out_of_stock' : 'in_stock');
  
  switch (status) {
    case 'out_of_stock':
      return { 
        icon: XCircle, 
        colorClass: 'text-red-400', 
        badgeClass: 'bg-red-500/20 text-red-300',
        label: 'OUT OF STOCK', 
        canBuy: false 
      };
    case 'low_stock':
      return { 
        icon: AlertTriangle, 
        colorClass: 'text-amber-400', 
        badgeClass: 'bg-amber-500/20 text-amber-300',
        label: 'LOW STOCK', 
        canBuy: true 
      };
    case 'preorder':
      return { 
        icon: Clock, 
        colorClass: 'text-blue-400', 
        badgeClass: 'bg-blue-500/20 text-blue-300',
        label: 'PRE-ORDER', 
        canBuy: true 
      };
    default:
      return { 
        icon: Check, 
        colorClass: 'text-emerald-400', 
        badgeClass: 'bg-emerald-500/20 text-emerald-300',
        label: null, 
        canBuy: true 
      };
  }
}

interface LivePriceCheckButtonProps {
  productUrl: string;
  fallbackUrl?: string | null;
  affiliateUrl?: string | null;
  storeName: string;
  productName?: string; // For search fallback
  onPriceFetched?: (result: LivePriceFetchResult) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}
type ButtonState = 'idle' | 'loading' | 'success' | 'error' | 'not_found';
export function LivePriceCheckButton({
  productUrl,
  fallbackUrl,
  affiliateUrl,
  storeName,
  productName,
  onPriceFetched,
  className,
  size = 'md'
}: LivePriceCheckButtonProps) {
  const {
    formatPrice,
    region
  } = useRegion();
  const {
    fetchLivePrice,
    isLoading,
    lastResult,
    error,
    reset
  } = useLivePriceFetch();
  const [buttonState, setButtonState] = useState<ButtonState>('idle');
  const [showResult, setShowResult] = useState(false);

  // Reset all state when region changes to prevent stale currency values
  useEffect(() => {
    reset();
    setButtonState('idle');
    setShowResult(false);
  }, [region, reset]);

  // Reset after showing success/error
  useEffect(() => {
    if (buttonState === 'success' || buttonState === 'error') {
      const timer = setTimeout(() => {
        setShowResult(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [buttonState]);
  const handleClick = async () => {
    if (buttonState === 'loading') return;

    // If we already have a result, go to store
    if (showResult && lastResult && affiliateUrl) {
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setButtonState('loading');
    setShowResult(false);
    const result = await fetchLivePrice(productUrl, fallbackUrl);
    if (result) {
      // Check if the result indicates a 404 error
      if (result.urlStatus === 'not_found') {
        setButtonState('not_found');
        onPriceFetched?.(result);
      } else {
        setButtonState('success');
        onPriceFetched?.(result);
      }
    } else {
      setButtonState('error');
    }
  };
  const handleGoToStore = () => {
    if (affiliateUrl) {
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };
  const sizeClasses = {
    sm: 'min-h-9 text-sm px-3 py-2',
    md: 'min-h-11 text-base px-4 py-2.5',
    lg: 'min-h-14 text-lg px-6 py-3'
  };

  // Show the fetched price result
  if (showResult && lastResult) {
    const discount = lastResult.compareAtPrice && lastResult.price ? Math.round((1 - lastResult.price / lastResult.compareAtPrice) * 100) : null;
    const stockDisplay = getStockDisplay(lastResult);
    const StatusIcon = stockDisplay.icon;
    const isOutOfStock = !stockDisplay.canBuy;
    
    // Determine background/border colors based on stock status
    const containerColorClass = isOutOfStock 
      ? "bg-red-500/10 border border-red-500/30"
      : lastResult.stockStatus === 'low_stock'
        ? "bg-amber-500/10 border border-amber-500/30"
        : lastResult.stockStatus === 'preorder'
          ? "bg-blue-500/10 border border-blue-500/30"
          : "bg-emerald-500/10 border border-emerald-500/30";
    
    return <div className={cn("space-y-2 animate-in fade-in duration-200", className)}>
        {/* Currency mismatch warning */}
        {lastResult.currencyMismatch && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{lastResult.errorMessage || `Price in ${lastResult.originalCurrency} - regional price unavailable`}</span>
          </div>
        )}
        
        {/* Live Price Display - changes color based on stock status */}
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg animate-in slide-in-from-top-2 duration-300",
          containerColorClass
        )}>
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("w-4 h-4", stockDisplay.colorClass)} />
            <span className={cn(
              "text-sm",
              isOutOfStock ? stockDisplay.colorClass : "text-muted-foreground"
            )}>
              {isOutOfStock 
                ? 'Sold Out' 
                : lastResult.stockStatus === 'preorder'
                  ? 'Pre-order:'
                  : lastResult.isConverted 
                    ? 'Estimated price:' 
                    : 'Live price:'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lastResult.compareAtPrice && discount && discount > 0 && <span className="text-xs text-muted-foreground line-through">
                {lastResult.isConverted ? '~' : ''}{formatPrice(lastResult.compareAtPrice)}
              </span>}
            <span className={cn(
              "text-lg font-bold",
              stockDisplay.colorClass
            )}>
              {lastResult.isConverted ? '~' : ''}{formatPrice(lastResult.price || 0)}
            </span>
            {stockDisplay.label ? (
              <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", stockDisplay.badgeClass)}>
                {stockDisplay.label}
              </span>
            ) : (
              discount && discount > 0 && <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                  {discount}% OFF
                </span>
            )}
          </div>
        </div>

        {/* Converted price info */}
        {lastResult.isConverted && lastResult.originalPrice && <p className="text-xs text-muted-foreground text-center">
            Original: {lastResult.originalCurrency} {lastResult.originalPrice.toFixed(2)}
            {lastResult.currencyMismatch && ' (regional store unavailable)'}
          </p>}

        {/* Go to Store Button - disabled when out of stock */}
        {isOutOfStock ? (
          <Button 
            variant="outline" 
            onClick={handleGoToStore} 
            disabled={!affiliateUrl} 
            className={cn("w-full", sizeClasses[size])}
          >
            <span className="flex items-center justify-center gap-2 flex-wrap text-center">
              <span>View at {storeName}</span>
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
            </span>
          </Button>
        ) : (
          <Button onClick={handleGoToStore} disabled={!affiliateUrl} className={cn("w-full font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.4)] transition-all duration-200", sizeClasses[size])}>
            <span className="flex items-center justify-center gap-2 flex-wrap text-center">
              <span>Buy Now at {storeName}</span>
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
            </span>
          </Button>
        )}

        {/* Refresh option */}
        <button onClick={() => {
        reset();
        setButtonState('idle');
        setShowResult(false);
      }} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3 h-3 inline mr-1" />
          Check again
        </button>
      </div>;
  }

  // Show 404/not found state - product page has moved
  if (buttonState === 'not_found') {
    // Extract store domain for search
    let storeDomain = '';
    try {
      storeDomain = new URL(productUrl).hostname.replace('www.', '');
    } catch {
      storeDomain = storeName.toLowerCase().replace(/\s+/g, '') + '.com';
    }

    // Create search URL - different stores have different search patterns
    const searchQuery = productName || storeName;
    const searchUrl = `https://${storeDomain}/search?q=${encodeURIComponent(searchQuery)}`;
    return <div className={cn("space-y-3", className)}>
        {/* 404 Error Display */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-sm font-medium text-amber-400">
              Product page has moved
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This store may have updated their website. 
            {productName && <> Try searching for "<span className="font-medium text-foreground/80">{productName}</span>".</>}
          </p>
        </div>
        
        {/* Search on Store Button */}
        <Button variant="outline" onClick={() => window.open(searchUrl, '_blank', 'noopener,noreferrer')} className={cn("w-full", sizeClasses[size])}>
          <Search className="w-4 h-4 mr-2" />
          Search on {storeName}
          <ExternalLink className="w-3.5 h-3.5 ml-2 opacity-70" />
        </Button>
        
        {/* Try Again Option */}
        <button onClick={() => {
        reset();
        setButtonState('idle');
      }} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3 h-3 inline mr-1" />
          Try again
        </button>
      </div>;
  }

  // Show error state with retry
  if (buttonState === 'error') {
    return <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-400">
            {error || 'Unable to fetch live price'}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
          reset();
          setButtonState('idle');
        }} className={cn("flex-1", sizeClasses[size])}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="secondary" onClick={handleGoToStore} disabled={!affiliateUrl} className={cn("flex-1", sizeClasses[size])}>
            View at Store
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>;
  }

  // Default/loading state
  return <Button onClick={handleClick} disabled={isLoading || !productUrl} variant="outline" className={cn("w-full font-bold relative overflow-hidden", sizeClasses[size], isLoading && "cursor-wait", className)}>
      {isLoading ? <span className="flex items-center animate-in fade-in duration-150">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Fetching live price...
        </span> : <span className="flex items-center">
          <RefreshCw className="w-4 h-4 mr-2" />
          Check Current Price
        </span>}
    </Button>;
}