import { useCurrency, CURRENCIES, CurrencyCode } from '@/hooks/useCurrency';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const currentCurrency = CURRENCIES[currency];

  return (
    <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
      <SelectTrigger className="w-auto h-9 px-2.5 gap-1 bg-transparent border-border/50 hover:border-border text-gray-400 hover:text-white transition-colors duration-200">
        <span className="font-medium text-sm">{currentCurrency.symbol}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border min-w-[120px]">
        {Object.values(CURRENCIES).map((curr) => (
          <SelectItem 
            key={curr.code} 
            value={curr.code}
            className="text-foreground hover:bg-accent focus:bg-accent"
          >
            <span className="font-medium">{curr.symbol}</span>
            <span className="ml-2 text-muted-foreground text-xs">{curr.code}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
