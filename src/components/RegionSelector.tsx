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
import { useRegion } from '@/contexts/RegionContext';
import { REGION_LIST } from '@/config/regions';
import { cn } from '@/lib/utils';

export function RegionSelector() {
  const { region, setRegion, regionConfig, currencyConfig, isLoading } = useRegion();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 h-9 text-gray-500">
        <Globe className="w-4 h-4 animate-pulse" />
        <span className="text-sm">...</span>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 h-9 px-2.5 rounded-md",
            "bg-transparent border border-border/50 hover:border-border",
            "text-gray-400 hover:text-white",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          )}
          aria-label={`Select region, current: ${regionConfig.name}`}
        >
          <span className="text-base" aria-hidden="true">
            {regionConfig.flag}
          </span>
          <span className="hidden sm:inline text-sm font-medium">
            {regionConfig.name}
          </span>
          <ChevronDown className={cn(
            "w-3 h-3 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="bg-popover border-border min-w-[200px] z-50"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
          Select Your Region
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        
        {REGION_LIST.map((regionOption) => (
          <DropdownMenuItem
            key={regionOption.code}
            onClick={() => {
              setRegion(regionOption.code);
              setIsOpen(false);
            }}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              region === regionOption.code && "bg-accent/50"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-base" aria-hidden="true">
                {regionOption.flag}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {regionOption.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {regionOption.defaultCurrency}
                </span>
              </div>
            </div>

            {region === regionOption.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator className="bg-border" />
        <div className="px-2 py-2">
          <p className="text-xs text-muted-foreground">
            Prices and store links will update to match your region
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
