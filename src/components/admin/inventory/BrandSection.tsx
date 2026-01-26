import { useState } from 'react';
import { ChevronDown, RefreshCw, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RegionCode } from '@/types/regional';
import { RegionalCoverageBadges } from './RegionalCoverageBadges';

interface BrandSectionProps {
  brandName: string;
  brandSlug: string;
  productCount: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onSyncBrand?: (brandSlug: string) => void;
  isSyncing?: boolean;
  // Regional props
  regionalCoverage?: RegionCode[];
  onSyncBrandAllRegions?: (brandSlug: string) => void;
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
  onSyncBrandAllRegions,
}: BrandSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

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
            
            <div className="flex items-center gap-2">
              {/* Sync All Regions Button */}
              {onSyncBrandAllRegions && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSyncBrandAllRegions(brandSlug);
                      }}
                      disabled={isSyncing}
                      className="gap-1 text-muted-foreground hover:text-foreground"
                      aria-label={`Sync all regions for ${brandName}`}
                    >
                      <Globe className="w-4 h-4" />
                      <span className="hidden lg:inline">All Regions</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Sync all regional stores for {brandName}
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Sync Brand Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSyncBrand?.(brandSlug);
                    }}
                    disabled={isSyncing}
                    className="gap-2"
                    aria-label={`Sync all ${brandName} products`}
                  >
                    <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
                    <span className="hidden sm:inline">Sync Brand</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSyncing ? 'Syncing...' : `Refresh prices for all ${productCount} products`}
                </TooltipContent>
              </Tooltip>
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
