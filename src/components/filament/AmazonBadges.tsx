import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, Truck, Tag, Clock, Package, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AmazonDetailProps {
  rating?: number | null;
  review_count?: number | null;
  is_prime_eligible?: boolean | null;
  coupon_text?: string | null;
  coupon_percent?: number | null;
  coupon_amount_cents?: number | null;
  deal_type?: string | null;
  deal_end_at?: string | null;
  subscribe_save_percent?: number | null;
  stock_status?: string;
  is_addon_item?: boolean;
  buy_box_seller?: string | null;
  is_sold_by_brand?: boolean | null;
}

interface AmazonBadgesProps {
  details: AmazonDetailProps | null | undefined;
  /** 'inline' for compact row badges, 'stacked' for column layout */
  layout?: 'inline' | 'stacked';
  className?: string;
}

/**
 * Compact Amazon badges showing Prime, coupons, deals, ratings, etc.
 * Use on BestPricesSection, PricingTab rows, and FilamentCard.
 */
export function AmazonBadges({ details, layout = 'inline', className }: AmazonBadgesProps) {
  if (!details) return null;

  const badges: React.ReactNode[] = [];

  // Prime badge
  if (details.is_prime_eligible) {
    badges.push(
      <Tooltip key="prime" delayDuration={200}>
        <TooltipTrigger asChild>
          <Badge className="bg-[#FF9900]/15 text-[#FF9900] border-[#FF9900]/30 text-[10px] gap-0.5 px-1.5 py-0">
            <Truck className="w-3 h-3" />
            Prime
          </Badge>
        </TooltipTrigger>
        <TooltipContent>Amazon Prime eligible — free fast shipping</TooltipContent>
      </Tooltip>
    );
  }

  // Coupon badge
  const couponLabel = details.coupon_percent
    ? `${details.coupon_percent}% off coupon`
    : details.coupon_amount_cents
    ? `$${(details.coupon_amount_cents / 100).toFixed(2)} coupon`
    : details.coupon_text;

  if (couponLabel) {
    badges.push(
      <Tooltip key="coupon" delayDuration={200}>
        <TooltipTrigger asChild>
          <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] gap-0.5 px-1.5 py-0">
            <Tag className="w-3 h-3" />
            Coupon
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{couponLabel}</TooltipContent>
      </Tooltip>
    );
  }

  // Deal badge
  if (details.deal_type) {
    const dealLabel = details.deal_type === 'LIGHTNING_DEAL'
      ? 'Lightning Deal'
      : details.deal_type === 'BEST_DEAL'
      ? 'Best Deal'
      : 'Deal';

    badges.push(
      <Tooltip key="deal" delayDuration={200}>
        <TooltipTrigger asChild>
          <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px] gap-0.5 px-1.5 py-0">
            <Clock className="w-3 h-3" />
            {dealLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {dealLabel}
          {details.deal_end_at && (
            <> — ends {new Date(details.deal_end_at).toLocaleDateString()}</>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Subscribe & Save
  if (details.subscribe_save_percent && details.subscribe_save_percent > 0) {
    badges.push(
      <Tooltip key="sns" delayDuration={200}>
        <TooltipTrigger asChild>
          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] gap-0.5 px-1.5 py-0">
            <Package className="w-3 h-3" />
            S&S {details.subscribe_save_percent}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          Subscribe & Save: {details.subscribe_save_percent}% off with regular delivery
        </TooltipContent>
      </Tooltip>
    );
  }

  // Rating badge (compact)
  if (details.rating && details.review_count) {
    badges.push(
      <Tooltip key="rating" delayDuration={200}>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400">
            <Star className="w-3 h-3 fill-amber-400" />
            {details.rating.toFixed(1)}
            <span className="text-muted-foreground">
              ({details.review_count >= 1000
                ? `${(details.review_count / 1000).toFixed(1)}k`
                : details.review_count})
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {details.rating.toFixed(1)} stars from {details.review_count.toLocaleString()} reviews on Amazon
        </TooltipContent>
      </Tooltip>
    );
  }

  // Stock warning
  if (details.stock_status && details.stock_status !== 'IN_STOCK') {
    const stockLabel = details.stock_status === 'LOW_STOCK'
      ? 'Low Stock'
      : details.stock_status === 'OUT_OF_STOCK'
      ? 'Out of Stock'
      : details.stock_status;

    badges.push(
      <Badge
        key="stock"
        className={cn(
          'text-[10px] gap-0.5 px-1.5 py-0',
          details.stock_status === 'OUT_OF_STOCK'
            ? 'bg-destructive/15 text-destructive border-destructive/30'
            : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
        )}
      >
        <AlertTriangle className="w-3 h-3" />
        {stockLabel}
      </Badge>
    );
  }

  // Third-party seller warning
  if (details.is_sold_by_brand === false && details.buy_box_seller) {
    badges.push(
      <Tooltip key="seller" delayDuration={200}>
        <TooltipTrigger asChild>
          <span className="text-[10px] text-muted-foreground">
            via {details.buy_box_seller}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Sold by {details.buy_box_seller}, not the brand directly
        </TooltipContent>
      </Tooltip>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div
      className={cn(
        layout === 'inline'
          ? 'flex items-center gap-1 flex-wrap'
          : 'flex flex-col gap-1',
        className
      )}
    >
      {badges}
    </div>
  );
}

/**
 * Compact single-line Amazon info for FilamentCard price rows.
 * Shows just the most important badge (Prime > Coupon > Deal).
 */
export function AmazonBadgeCompact({ details }: { details: AmazonDetailProps | null | undefined }) {
  if (!details) return null;

  if (details.is_prime_eligible) {
    return (
      <span className="text-[10px] text-[#FF9900] font-medium">Prime</span>
    );
  }

  if (details.coupon_percent || details.coupon_amount_cents) {
    const label = details.coupon_percent
      ? `${details.coupon_percent}% off`
      : `$${((details.coupon_amount_cents || 0) / 100).toFixed(0)} off`;
    return (
      <span className="text-[10px] text-green-400 font-medium">{label}</span>
    );
  }

  if (details.deal_type) {
    return (
      <span className="text-[10px] text-red-400 font-medium">Deal</span>
    );
  }

  return null;
}
