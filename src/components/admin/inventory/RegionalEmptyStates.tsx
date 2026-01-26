import { Globe, Link, DollarSign, Check, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RegionCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';

interface RegionalEmptyStateProps {
  type: 'no-url' | 'no-price' | 'no-products' | 'all-synced' | 'no-data';
  regionCode?: RegionCode;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
  compact?: boolean;
}

export function RegionalEmptyState({
  type,
  regionCode,
  onAction,
  actionLabel,
  className,
  compact = false,
}: RegionalEmptyStateProps) {
  const region = regionCode ? REGIONS[regionCode] : null;
  const regionName = region?.name || regionCode || 'this region';
  const regionFlag = region?.flag || '🌐';

  const configs = {
    'no-url': {
      icon: Link,
      iconColor: 'text-muted-foreground',
      title: compact ? 'No URL' : `No ${regionName} URL configured`,
      description: compact 
        ? undefined 
        : 'Add a store URL to enable price syncing for this region.',
      actionLabel: actionLabel || 'Add URL',
      actionIcon: Plus,
    },
    'no-price': {
      icon: DollarSign,
      iconColor: 'text-muted-foreground',
      title: compact ? 'No price' : `No price data for ${regionName}`,
      description: compact 
        ? undefined 
        : 'Sync this region to fetch the latest pricing.',
      actionLabel: actionLabel || 'Sync Now',
      actionIcon: RefreshCw,
    },
    'no-products': {
      icon: Globe,
      iconColor: 'text-muted-foreground',
      title: compact ? 'None' : `No products available in ${regionName}`,
      description: compact 
        ? undefined 
        : 'Products in this region will appear here once URLs are configured.',
      actionLabel: actionLabel || 'Add Products',
      actionIcon: Plus,
    },
    'all-synced': {
      icon: Check,
      iconColor: 'text-green-500',
      title: compact ? '✓ Synced' : `All ${regionName} products synced! 🎉`,
      description: compact 
        ? undefined 
        : 'All regional prices are up to date.',
      actionLabel: undefined,
      actionIcon: undefined,
    },
    'no-data': {
      icon: Globe,
      iconColor: 'text-muted-foreground',
      title: compact ? '—' : 'No regional data',
      description: compact 
        ? undefined 
        : 'Configure regional URLs and pricing to get started.',
      actionLabel: actionLabel || 'Configure',
      actionIcon: Plus,
    },
  };

  const config = configs[type];
  const Icon = config.icon;
  const ActionIcon = config.actionIcon;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
        <Icon className={cn('w-3 h-3', config.iconColor)} />
        <span className="text-xs">{config.title}</span>
        {onAction && ActionIcon && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 ml-1"
            onClick={onAction}
          >
            <ActionIcon className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-8 px-4 text-center',
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{regionFlag}</span>
        <Icon className={cn('w-8 h-8', config.iconColor)} />
      </div>
      <h4 className="font-medium text-foreground mb-1">{config.title}</h4>
      {config.description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          {config.description}
        </p>
      )}
      {onAction && config.actionLabel && ActionIcon && (
        <Button variant="outline" size="sm" onClick={onAction}>
          <ActionIcon className="w-4 h-4 mr-2" />
          {config.actionLabel}
        </Button>
      )}
    </div>
  );
}

interface RegionalSuccessBannerProps {
  regionCode: RegionCode;
  syncedCount: number;
  totalCount: number;
  className?: string;
}

export function RegionalSuccessBanner({
  regionCode,
  syncedCount,
  totalCount,
  className,
}: RegionalSuccessBannerProps) {
  const region = REGIONS[regionCode];
  const isComplete = syncedCount === totalCount;

  if (!isComplete) return null;

  return (
    <div className={cn(
      'flex items-center justify-center gap-2 py-2 px-4 rounded-md',
      'bg-green-500/10 border border-green-500/30 text-green-500',
      className
    )}>
      <span className="text-lg">{region?.flag}</span>
      <Check className="w-4 h-4" />
      <span className="text-sm font-medium">
        All {totalCount} {region?.name} products synced successfully!
      </span>
    </div>
  );
}

interface NoRegionalDataMessageProps {
  message?: string;
  showAddButton?: boolean;
  onAdd?: () => void;
  className?: string;
}

export function NoRegionalDataMessage({
  message = 'No regional price data yet. Add regional URLs to products to begin tracking.',
  showAddButton = false,
  onAdd,
  className,
}: NoRegionalDataMessageProps) {
  return (
    <div className={cn(
      'text-center py-6 px-4 text-muted-foreground',
      className
    )}>
      <Globe className="w-8 h-8 mx-auto mb-3 opacity-50" />
      <p className="text-sm">{message}</p>
      {showAddButton && onAdd && (
        <Button variant="outline" size="sm" onClick={onAdd} className="mt-4">
          <Plus className="w-4 h-4 mr-2" />
          Add Regional URLs
        </Button>
      )}
    </div>
  );
}
