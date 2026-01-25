import { useState } from 'react';
import { DollarSign, ExternalLink, ShoppingCart, AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useRegion } from '@/contexts/RegionContext';
import { PriceConfidence, usePriceFreshness } from '@/hooks/usePriceFreshness';
import { PriceVerificationDialog, usePriceVerification } from './PriceVerificationDialog';
import { AdminPriceRefreshButton } from '@/components/admin/AdminPriceRefreshButton';
import { cn } from '@/lib/utils';

export interface HonestPriceDisplayProps {
  price: number | null;
  confidence: PriceConfidence | null | undefined;
  lastVerifiedAt: string | Date | null | undefined;
  storeName: string;
  storeUrl: string | null;
  isConverted?: boolean;
  currency?: string;
  conversionTooltip?: string | null;
  onBuyClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showCTA?: boolean;
  showPerKg?: boolean;
  className?: string;
  // Admin refresh props
  filamentId?: string;
  productUrl?: string;
  onAdminRefresh?: () => void;
}

interface DisplayMode {
  mode: 'exact' | 'approximate' | 'estimated' | 'unavailable';
  label: string;
  pricePrefix: string;
  helperText: string;
  ctaText: string;
  ctaVariant: 'primary' | 'outline' | 'secondary';
  showPrice: boolean;
  showWarning: boolean;
}

function getDisplayMode(confidence: PriceConfidence, storeName: string): DisplayMode {
  switch (confidence) {
    case 'high':
      return {
        mode: 'exact',
        label: 'Current price',
        pricePrefix: '',
        helperText: 'Verified today',
        ctaText: 'Buy Now',
        ctaVariant: 'primary',
        showPrice: true,
        showWarning: false,
      };
    case 'medium':
      return {
        mode: 'approximate',
        label: 'Recent price',
        pricePrefix: '~',
        helperText: 'Last checked this week',
        ctaText: 'Buy Now',
        ctaVariant: 'primary',
        showPrice: true,
        showWarning: false,
      };
    case 'low':
      return {
        mode: 'estimated',
        label: 'Estimated price',
        pricePrefix: '~',
        helperText: 'May have changed - verify at store',
        ctaText: 'Check Current Price',
        ctaVariant: 'outline',
        showPrice: true,
        showWarning: true,
      };
    case 'stale':
    case 'unknown':
    default:
      return {
        mode: 'unavailable',
        label: 'Price varies',
        pricePrefix: '',
        helperText: `Check ${storeName} for current pricing`,
        ctaText: `View at ${storeName}`,
        ctaVariant: 'secondary',
        showPrice: false,
        showWarning: false,
      };
  }
}

const confidenceConfig: Record<PriceConfidence, {
  colorClass: string;
  icon: typeof CheckCircle2;
}> = {
  high: { colorClass: 'text-green-500', icon: CheckCircle2 },
  medium: { colorClass: 'text-blue-500', icon: Clock },
  low: { colorClass: 'text-amber-500', icon: AlertTriangle },
  stale: { colorClass: 'text-red-500', icon: AlertTriangle },
  unknown: { colorClass: 'text-muted-foreground', icon: DollarSign },
};

export function HonestPriceDisplay({
  price,
  confidence: providedConfidence,
  lastVerifiedAt,
  storeName,
  storeUrl,
  isConverted = false,
  currency,
  conversionTooltip,
  onBuyClick,
  size = 'lg',
  showCTA = true,
  showPerKg = true,
  className,
  filamentId,
  productUrl,
  onAdminRefresh,
}: HonestPriceDisplayProps) {
  const { formatPrice } = useRegion();
  const freshness = usePriceFreshness(
    lastVerifiedAt instanceof Date ? lastVerifiedAt.toISOString() : lastVerifiedAt
  );
  
  // Price verification dialog state
  const {
    showDialog,
    setShowDialog,
    pendingNavigation,
    handleBuyClick,
    handleContinue,
  } = usePriceVerification();
  
  const confidence = providedConfidence || freshness.confidence;
  const displayMode = getDisplayMode(confidence, storeName);
  const config = confidenceConfig[confidence];
  const Icon = config.icon;

  const sizeClasses = {
    sm: { price: 'text-lg', label: 'text-xs', helper: 'text-[10px]', button: 'h-9 text-sm' },
    md: { price: 'text-2xl', label: 'text-sm', helper: 'text-xs', button: 'h-11 text-sm' },
    lg: { price: 'text-3xl', label: 'text-sm', helper: 'text-xs', button: 'h-14 text-lg' },
  };
  const sizes = sizeClasses[size];

  const handleClick = () => {
    const shouldProceed = handleBuyClick({
      storeName,
      storeUrl: storeUrl || '',
      lastVerifiedAt,
      priceConfidence: confidence,
    });

    if (shouldProceed) {
      if (onBuyClick) {
        onBuyClick();
      } else if (storeUrl) {
        window.open(storeUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Format the time ago text
  const timeAgoText = freshness.lastVerifiedDate 
    ? `Last checked ${formatDistanceToNow(freshness.lastVerifiedDate)} ago`
    : null;

  return (
    <TooltipProvider>
      <div className={cn('space-y-3', className)}>
        {/* Price Label */}
        <div className={cn('text-muted-foreground font-medium', sizes.label)}>
          {displayMode.label}
        </div>

        {/* Price Display */}
        {displayMode.showPrice && price !== null ? (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className={cn('font-bold text-foreground', sizes.price)}>
                {displayMode.pricePrefix}
                {formatPrice(price, { showApproximate: false })}
              </span>
              {showPerKg && (
                <span className="text-muted-foreground text-sm font-medium">/kg</span>
              )}
              
              {/* Conversion tooltip */}
              {isConverted && conversionTooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{conversionTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Freshness indicator */}
            <div className={cn('flex items-center gap-1.5', config.colorClass, sizes.helper)}>
              <Icon className="h-3 w-3" />
              <span>{timeAgoText || displayMode.helperText}</span>
              
              {/* Admin Refresh Button - only shown to admins */}
              {filamentId && productUrl && (
                <AdminPriceRefreshButton
                  productUrl={productUrl}
                  filamentId={filamentId}
                  onRefreshComplete={(success) => {
                    if (success) {
                      onAdminRefresh?.();
                    }
                  }}
                  className="ml-1"
                />
              )}
            </div>

            {/* Warning for low confidence */}
            {displayMode.showWarning && (
              <p className={cn('text-amber-400/80 mt-1', sizes.helper)}>
                {displayMode.helperText}
              </p>
            )}
          </div>
        ) : (
          /* Stale/Unknown price display */
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted/50">
              <DollarSign className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <div className={cn('font-semibold text-foreground', sizes.price === 'text-3xl' ? 'text-lg' : 'text-base')}>
                Price varies
              </div>
              <div className={cn('text-muted-foreground', sizes.helper)}>
                {displayMode.helperText}
              </div>
            </div>
          </div>
        )}

        {/* CTA Button */}
        {showCTA && (storeUrl || onBuyClick) && (
          <Button
            onClick={handleClick}
            variant={displayMode.ctaVariant === 'primary' ? 'default' : displayMode.ctaVariant === 'outline' ? 'outline' : 'secondary'}
            className={cn(
              'w-full font-bold tracking-wide',
              sizes.button,
              displayMode.ctaVariant === 'primary' && [
                'bg-gradient-to-r from-primary to-primary/80',
                'hover:from-primary/90 hover:to-primary/70',
                'shadow-[0_4px_16px_rgba(0,212,212,0.25)]',
                'hover:shadow-[0_8px_24px_rgba(0,212,212,0.35)]',
                'hover:-translate-y-0.5 transition-all duration-200',
              ]
            )}
          >
            {displayMode.ctaVariant === 'primary' ? (
              <ShoppingCart className="w-5 h-5 mr-2" />
            ) : null}
            {displayMode.ctaText}
            <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
          </Button>
        )}

        {/* Trust note for stale prices */}
        {!displayMode.showPrice && (
          <p className={cn('text-muted-foreground text-center', sizes.helper)}>
            Prices change with sales and stock availability
          </p>
        )}

        {/* Price Verification Dialog */}
        {pendingNavigation && (
          <PriceVerificationDialog
            open={showDialog}
            onOpenChange={setShowDialog}
            storeName={pendingNavigation.storeName}
            storeUrl={pendingNavigation.storeUrl}
            lastVerifiedAt={pendingNavigation.lastVerifiedAt}
            priceConfidence={pendingNavigation.priceConfidence}
            onContinue={handleContinue}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Compact version for mobile bottom bar
 */
export function HonestPriceDisplayCompact({
  price,
  confidence: providedConfidence,
  lastVerifiedAt,
  storeName,
  isConverted = false,
  className,
}: Pick<HonestPriceDisplayProps, 'price' | 'confidence' | 'lastVerifiedAt' | 'storeName' | 'isConverted' | 'className'>) {
  const { formatPrice } = useRegion();
  const freshness = usePriceFreshness(
    lastVerifiedAt instanceof Date ? lastVerifiedAt.toISOString() : lastVerifiedAt
  );
  
  const confidence = providedConfidence || freshness.confidence;
  const displayMode = getDisplayMode(confidence, storeName);
  const config = confidenceConfig[confidence];
  const Icon = config.icon;

  if (!displayMode.showPrice || price === null) {
    return (
      <div className={cn('flex flex-col gap-0.5', className)}>
        <span className="text-base font-medium text-muted-foreground">Price varies</span>
        <span className="text-xs text-muted-foreground">Check at store</span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-foreground">
          {displayMode.pricePrefix}
          {formatPrice(price, { showApproximate: false })}
        </span>
        <span className="text-sm text-muted-foreground">/kg</span>
      </div>
      <span className={cn('inline-flex items-center gap-1 text-xs', config.colorClass)}>
        <Icon className="h-3 w-3" />
        <span>
          {confidence === 'high' || confidence === 'medium' 
            ? (freshness.timeAgo ? `Updated ${freshness.timeAgo}` : 'Recent')
            : 'Verify at store'}
        </span>
      </span>
    </div>
  );
}

/**
 * Get CTA button text based on price confidence
 */
export function getCtaText(confidence: PriceConfidence | null | undefined, storeName: string = 'Store'): string {
  switch (confidence) {
    case 'high':
    case 'medium':
      return 'Buy Now';
    case 'low':
      return 'Check Current Price';
    case 'stale':
    case 'unknown':
    default:
      return `View at ${storeName}`;
  }
}

/**
 * Check if CTA should use primary styling
 */
export function shouldUsePrimaryCta(confidence: PriceConfidence | null | undefined): boolean {
  return confidence === 'high' || confidence === 'medium';
}
