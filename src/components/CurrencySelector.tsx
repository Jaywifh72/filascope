import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegion } from '@/contexts/RegionContext';
import { CURRENCY_LIST } from '@/config/currencies';
import { CurrencyCode } from '@/types/regional';
import { cn } from '@/lib/utils';

export function CurrencySelector() {
  const { currency, setCurrency, currencyConfig, isLoading } = useRegion();

  if (isLoading) {
    return (
      <div className="w-auto h-9 px-2.5 flex items-center text-gray-500">
        <span className="text-sm">...</span>
      </div>
    );
  }

  return (
    <Select 
      value={currency} 
      onValueChange={(value) => setCurrency(value as CurrencyCode)}
    >
      <SelectTrigger className="w-auto h-9 px-2.5 gap-1 bg-transparent border-border/50 hover:border-border text-gray-400 hover:text-white transition-colors duration-200">
        <span className="font-medium text-sm">{currencyConfig.symbol}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border min-w-[160px] z-50">
        {CURRENCY_LIST.map((curr) => (
          <SelectItem 
            key={curr.code} 
            value={curr.code}
            className="text-foreground hover:bg-accent focus:bg-accent"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium w-6">{curr.symbol}</span>
              <span className="text-muted-foreground text-xs">{curr.code}</span>
              <span className="text-muted-foreground text-xs hidden sm:inline">
                - {curr.name}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
