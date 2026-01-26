import { useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BrandSectionProps {
  brandName: string;
  brandSlug: string;
  productCount: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onSyncBrand?: (brandSlug: string) => void;
  isSyncing?: boolean;
}

export function BrandSection({
  brandName,
  brandSlug,
  productCount,
  children,
  defaultExpanded = false,
  onSyncBrand,
  isSyncing = false,
}: BrandSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border border-border rounded-lg bg-card">
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
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
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
