import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRegion } from '@/contexts/RegionContext';
import { CURRENCY_LIST } from '@/config/currencies';
import { CurrencyCode } from '@/types/regional';
import { cn } from '@/lib/utils';

export function CurrencySelector() {
  const { currency, setCurrency, currencyConfig, isLoading } = useRegion();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="w-auto h-9 px-2.5 flex items-center text-gray-500">
        <span className="text-sm">...</span>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 h-9 px-2.5 rounded-md",
            "bg-transparent border border-border/50 hover:border-border",
            "text-gray-400 hover:text-white",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          )}
        >
          <span className="font-semibold text-sm">{currencyConfig.symbol}</span>
          <span className="text-muted-foreground text-xs">{currency}</span>
          <ChevronDown className={cn(
            "h-3 w-3 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-popover border-border max-h-80 overflow-y-auto z-50"
      >
        {CURRENCY_LIST.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => {
              setCurrency(curr.code as CurrencyCode);
              setIsOpen(false);
            }}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              currency === curr.code && "bg-accent/50"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium w-6">{curr.symbol}</span>
              <span className="text-sm">{curr.code}</span>
              <span className="text-muted-foreground text-xs">- {curr.name}</span>
            </div>

            {currency === curr.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
