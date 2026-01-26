import { RegionCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface RegionalFiltersProps {
  hasRegionalUrl: RegionCode | 'any' | null;
  onHasRegionalUrlChange: (value: RegionCode | 'any' | null) => void;
  missingRegionalUrls: boolean;
  onMissingRegionalUrlsChange: (value: boolean) => void;
  compact?: boolean;
}

const FILTER_REGIONS: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN'];

export function RegionalFilters({
  hasRegionalUrl,
  onHasRegionalUrlChange,
  missingRegionalUrls,
  onMissingRegionalUrlsChange,
  compact = false,
}: RegionalFiltersProps) {
  return (
    <div className={compact ? 'flex items-center gap-3' : 'flex flex-col sm:flex-row gap-4'}>
      {/* Has URL in Region Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Regional:</span>
        <Select
          value={hasRegionalUrl || 'all'}
          onValueChange={(v) => onHasRegionalUrlChange(v === 'all' ? null : v as RegionCode | 'any')}
        >
          <SelectTrigger className={compact ? 'h-8 w-[130px] text-sm' : 'w-[150px]'}>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="any">Has Any URL</SelectItem>
            {FILTER_REGIONS.map((regionCode) => {
              const region = REGIONS[regionCode];
              return (
                <SelectItem key={regionCode} value={regionCode}>
                  <span className="flex items-center gap-2">
                    <span>{region?.flag}</span>
                    <span>Has {regionCode} URL</span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Missing URLs Checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="missing-urls"
          checked={missingRegionalUrls}
          onCheckedChange={(checked) => onMissingRegionalUrlsChange(checked === true)}
        />
        <Label 
          htmlFor="missing-urls" 
          className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap"
        >
          Missing URLs
        </Label>
      </div>
    </div>
  );
}
