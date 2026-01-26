import { Globe } from 'lucide-react';
import { RegionCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminRegionSelectorProps {
  value: RegionCode;
  onChange: (region: RegionCode) => void;
  showFlags?: boolean;
  size?: 'sm' | 'default';
  label?: string;
}

const ADMIN_REGIONS: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN'];

export function AdminRegionSelector({
  value,
  onChange,
  showFlags = true,
  size = 'default',
  label,
}: AdminRegionSelectorProps) {
  const currentRegion = REGIONS[value];

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">{label}</span>
      )}
      <Select value={value} onValueChange={(v) => onChange(v as RegionCode)}>
        <SelectTrigger 
          className={size === 'sm' ? 'h-8 w-[140px] text-sm' : 'w-[180px]'}
          aria-label="Select region"
        >
          <SelectValue>
            <span className="flex items-center gap-2">
              {showFlags && <span>{currentRegion?.flag}</span>}
              <span>{currentRegion?.name || value}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ADMIN_REGIONS.map((regionCode) => {
            const region = REGIONS[regionCode];
            if (!region) return null;
            return (
              <SelectItem key={regionCode} value={regionCode}>
                <span className="flex items-center gap-2">
                  {showFlags && <span>{region.flag}</span>}
                  <span>{region.name}</span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

interface AdminCurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  size?: 'sm' | 'default';
  label?: string;
}

const ADMIN_CURRENCIES = ['USD', 'CAD', 'GBP', 'EUR', 'AUD', 'JPY', 'CNY'];

export function AdminCurrencySelector({
  value,
  onChange,
  size = 'default',
  label,
}: AdminCurrencySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">{label}</span>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          className={size === 'sm' ? 'h-8 w-[90px] text-sm' : 'w-[100px]'}
          aria-label="Select currency"
        >
          <SelectValue>{value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ADMIN_CURRENCIES.map((currency) => (
            <SelectItem key={currency} value={currency}>
              {currency}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
