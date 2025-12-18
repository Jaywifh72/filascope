import React from 'react';
import { 
  ShieldCheck, 
  BadgeCheck, 
  Users, 
  Award, 
  Trophy,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrustIndicators, PurchaseStats } from './types';

interface TrustBadge {
  id: string;
  icon: React.ReactNode;
  text: string;
  color: 'cyan' | 'green' | 'gold' | 'purple' | 'blue';
}

interface TrustBadgesProps {
  trustIndicators: TrustIndicators;
  purchaseStats: PurchaseStats;
  layout?: 'horizontal' | 'vertical' | 'compact';
  showPurchaseCount?: boolean;
  className?: string;
}

const colorClasses = {
  cyan: {
    bg: 'bg-primary/[0.08]',
    border: 'border-primary/20',
    icon: 'text-primary'
  },
  green: {
    bg: 'bg-emerald-500/[0.08]',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-400'
  },
  gold: {
    bg: 'bg-amber-500/[0.08]',
    border: 'border-amber-500/20',
    icon: 'text-amber-500'
  },
  purple: {
    bg: 'bg-purple-500/[0.08]',
    border: 'border-purple-500/20',
    icon: 'text-purple-400'
  },
  blue: {
    bg: 'bg-blue-500/[0.08]',
    border: 'border-blue-500/20',
    icon: 'text-blue-400'
  }
};

export const TrustBadges: React.FC<TrustBadgesProps> = ({
  trustIndicators,
  purchaseStats,
  layout = 'horizontal',
  showPurchaseCount = true,
  className
}) => {
  const badges: TrustBadge[] = [];

  // Purchase count badge
  if (showPurchaseCount && purchaseStats.boughtThisMonth > 50) {
    badges.push({
      id: 'buyers',
      icon: <Users size={14} />,
      text: `${purchaseStats.boughtThisMonth.toLocaleString()} bought this month`,
      color: 'cyan'
    });
  }

  // Verified reviews badge
  if (trustIndicators.verifiedReviews) {
    badges.push({
      id: 'verified',
      icon: <BadgeCheck size={14} />,
      text: 'Verified reviews',
      color: 'green'
    });
  }

  // Bestseller badge
  if (trustIndicators.bestSeller) {
    badges.push({
      id: 'bestseller',
      icon: <Trophy size={14} />,
      text: trustIndicators.bestSellerRank 
        ? `#${trustIndicators.bestSellerRank} Bestseller`
        : 'Bestseller',
      color: 'gold'
    });
  }

  // Top rated badge
  if (trustIndicators.topRated) {
    badges.push({
      id: 'toprated',
      icon: <Award size={14} />,
      text: 'Top Rated',
      color: 'purple'
    });
  }

  // Editor's pick badge
  if (trustIndicators.editorsPick) {
    badges.push({
      id: 'editors',
      icon: <Award size={14} />,
      text: "Editor's Pick",
      color: 'blue'
    });
  }

  // Price match guarantee
  if (trustIndicators.priceMatchGuarantee) {
    badges.push({
      id: 'pricematch',
      icon: <ShieldCheck size={14} />,
      text: 'Price Match Guarantee',
      color: 'green'
    });
  }

  // Repeat buyers indicator
  if (purchaseStats.repeatBuyers > 30) {
    badges.push({
      id: 'repeat',
      icon: <RefreshCw size={14} />,
      text: `${purchaseStats.repeatBuyers}% buy again`,
      color: 'cyan'
    });
  }

  if (badges.length === 0) return null;

  const maxBadges = layout === 'compact' ? 2 : 4;
  const displayBadges = badges.slice(0, maxBadges);

  return (
    <div 
      className={cn(
        'flex flex-wrap gap-2.5',
        layout === 'vertical' && 'flex-col items-start',
        layout === 'compact' && 'gap-2',
        className
      )}
      role="list" 
      aria-label="Trust indicators"
    >
      {displayBadges.map(badge => {
        const colors = colorClasses[badge.color];
        return (
          <div 
            key={badge.id}
            className={cn(
              'flex items-center gap-1.5 border rounded-md',
              layout === 'compact' ? 'py-1 px-2' : 'py-1.5 px-2.5',
              colors.bg,
              colors.border
            )}
            role="listitem"
          >
            <span className={colors.icon}>{badge.icon}</span>
            <span className={cn(
              'font-semibold text-muted-foreground',
              layout === 'compact' ? 'text-[11px]' : 'text-[12px]'
            )}>
              {badge.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};
