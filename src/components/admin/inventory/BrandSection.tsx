import { useState, useMemo } from 'react';
import { ChevronDown, RefreshCw, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RegionCode } from '@/types/regional';
import { RegionalCoverageBadges } from './RegionalCoverageBadges';
import { RegionSyncSelector } from './RegionSyncSelector';

interface BrandSectionProps {
  brandName: string;
  brandSlug: string;
  productCount: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onSyncBrand?: (brandSlug: string, regions?: RegionCode[] | null) => void;
  isSyncing?: boolean;
  // Regional props
  regionalCoverage?: RegionCode[];
  productCountByRegion?: Map<RegionCode, number>;
}

export function BrandSection({
  brandName,
  brandSlug,
  productCount,
  children,
  defaultExpanded = false,
  onSyncBrand,
  isSyncing = false,
  regionalCoverage = [],
  productCountByRegion,
}: BrandSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  const handleSync = (regions: RegionCode[] | null) => {
    onSyncBrand?.(brandSlug, regions);
  };

  // Build productCountByRegion from coverage if not provided
  const regionCounts = useMemo(() => {
    if (productCountByRegion) return productCountByRegion;
    const counts = new Map<RegionCode, number>();
    regionalCoverage.forEach(region => {
      counts.set(region, productCount);
    });
    return counts;
  }, [productCountByRegion, regionalCoverage, productCount]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border border-border rounded-lg bg-card">
      <CollapsibleTrigger asChild>
        <div className="flex flex-col p-4 cursor-pointer hover:bg-muted/50 transition-colors">
          {/* Main Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{brandName}</span>
                <Badge variant="secondary" className="text-xs">
                  {productCount} {productCount === 1 ? 'product' : 'products'}
                </Badge>
              </div>
            </div>
            
            <div 
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sync Brand with Region Selector */}
              {onSyncBrand && (
                <RegionSyncSelector
                  availableRegions={regionalCoverage.length > 0 ? regionalCoverage : undefined}
                  onSync={handleSync}
                  isLoading={isSyncing}
                  productCountByRegion={regionCounts}
                  label="Sync Brand"
                  variant="outline"
                  size="sm"
                  disabled={isSyncing}
                />
              )}
            </div>
          </div>
          
          {/* Regional Coverage Row */}
          {regionalCoverage.length > 0 && (
            <div className="flex items-center gap-2 mt-2 ml-8">
              <span className="text-xs text-muted-foreground">Coverage:</span>
              <RegionalCoverageBadges
                availableRegions={regionalCoverage}
                compact={false}
                showLabels={true}
              />
            </div>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
