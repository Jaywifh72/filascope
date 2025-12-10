import { useCurrency, CURRENCIES, CurrencyCode } from '@/hooks/useCurrency';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
      <SelectTrigger className="w-[100px] h-9 bg-background border-border text-foreground">
        <Globe className="h-4 w-4 mr-1.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border">
        {Object.values(CURRENCIES).map((curr) => (
          <SelectItem 
            key={curr.code} 
            value={curr.code}
            className="text-foreground hover:bg-accent focus:bg-accent"
          >
            <span className="font-medium">{curr.symbol}</span>
            <span className="ml-1 text-muted-foreground">{curr.code}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
