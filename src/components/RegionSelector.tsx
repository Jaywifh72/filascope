import { useState } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRegion } from '@/contexts/RegionContext';
import { REGION_LIST } from '@/config/regions';
import { cn } from '@/lib/utils';

export function RegionSelector() {
  const { region, setRegion, regionConfig, currencyConfig, isLoading } = useRegion();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-3 h-9 text-muted-foreground">
        <Globe className="w-4 h-4 animate-pulse" />
        <span className="text-sm">...</span>
      </div>
    );
  }

  const currencyCode = regionConfig.defaultCurrency;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                "bg-transparent border border-transparent",
                "hover:bg-muted/50 hover:border-border/50",
                "text-sm font-medium text-muted-foreground",
                "transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isOpen && "bg-muted/50 border-border/50"
              )}
              aria-label={`Select region, current: ${regionConfig.name} (${currencyCode})`}
            >
              <span className="text-base leading-none" aria-hidden="true">
                {regionConfig.flag}
              </span>
              <span className="text-sm font-medium">
                {currencyCode}
              </span>
              <ChevronDown className={cn(
                "w-3 h-3 text-muted-foreground/70 transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        {!isOpen && (
          <TooltipContent side="bottom" className="bg-popover border-border text-sm max-w-[240px]">
            Prices shown in {currencyCode} from {regionConfig.name} retailers. Updated daily.
          </TooltipContent>
        )}
      </Tooltip>
      
      <DropdownMenuContent 
        align="end" 
        className="bg-popover border-border min-w-[220px] z-50 shadow-xl"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
          Your prices are shown in {currencyCode}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        
        {REGION_LIST.map((regionOption) => {
          const isActive = region === regionOption.code;
          return (
            <DropdownMenuItem
              key={regionOption.code}
              onClick={() => {
                setRegion(regionOption.code);
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center justify-between cursor-pointer",
                isActive && "bg-primary/10 border-l-2 border-l-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-base" aria-hidden="true">
                  {regionOption.flag}
                </span>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-sm font-medium",
                    isActive ? "text-primary" : "text-foreground"
                  )}>
                    {regionOption.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {regionOption.defaultCurrency}
                  </span>
                </div>
              </div>

              {isActive && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator className="bg-border" />
        <div className="px-2 py-2">
          <p className="text-xs text-muted-foreground">
            Prices and store links update to match your region
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
