import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { RegionCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import { CURRENCIES } from '@/config/currencies';
import type { PrinterWizardFormValues } from '../AddPrinterWizard';

interface PrinterWizardStep5PricingProps {
  form: UseFormReturn<PrinterWizardFormValues>;
}

export function PrinterWizardStep5Pricing({ form }: PrinterWizardStep5PricingProps) {
  const msrp = form.watch('msrp');
  const currentPrice = form.watch('current_price');
  const regionalUrls = form.watch('regional_urls') || [];
  const regionalMsrps = form.watch('regional_msrps') || [];
  const detectedRegion = form.watch('detected_region') as RegionCode | undefined;
  const syncAfterCreate = form.watch('sync_after_create');

  // Calculate discount percentage
  const discountPercent =
    msrp && currentPrice && currentPrice < msrp
      ? Math.round(((msrp - currentPrice) / msrp) * 100)
      : null;

  // Get configured regions (from regional URLs)
  const configuredRegions = new Set(regionalUrls.map((u: any) => u.region_code as string));
  if (detectedRegion) {
    configuredRegions.add(detectedRegion);
  }

  // Non-primary regions that need MSRP
  const regionsNeedingMsrp = Array.from(configuredRegions).filter(
    (r) => r !== 'US' && r !== detectedRegion
  ) as RegionCode[];

  const handleRegionalMsrpChange = (regionCode: RegionCode, value: number | null) => {
    const region = REGIONS[regionCode];
    const existingIndex = regionalMsrps.findIndex((p: any) => p.region_code === regionCode);
    
    if (existingIndex >= 0) {
      const updated = [...regionalMsrps];
      updated[existingIndex] = {
        ...updated[existingIndex],
        msrp: value,
      };
      form.setValue('regional_msrps', updated, { shouldDirty: true });
    } else {
      form.setValue('regional_msrps', [
        ...regionalMsrps,
        {
          region_code: regionCode,
          currency_code: region?.defaultCurrency || 'USD',
          msrp: value,
        },
      ], { shouldDirty: true });
    }
  };

  const getRegionalMsrp = (regionCode: RegionCode): number | null => {
    const found = regionalMsrps.find((p: any) => p.region_code === regionCode);
    return found?.msrp ?? null;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Pricing</h3>
        <p className="text-sm text-muted-foreground">
          Enter the printer's pricing information. Base prices in USD.
        </p>
      </div>

      <FormField
        control={form.control}
        name="msrp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>MSRP (USD) *</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : 0)
                  }
                />
              </div>
            </FormControl>
            <FormDescription>
              Manufacturer's Suggested Retail Price
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="current_price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Current Price (USD)</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </FormControl>
            <FormDescription>
              Optional - will be synced automatically if left empty
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="compare_at_price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Compare At Price (USD)</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </FormControl>
            <FormDescription>Original price before discount</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {discountPercent && discountPercent > 0 && (
        <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-500 font-medium">
            {discountPercent}% off MSRP
          </p>
        </div>
      )}

      {/* Regional MSRP Overrides */}
      {regionsNeedingMsrp.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Regional MSRP Overrides</Label>
            <p className="text-xs text-muted-foreground">
              Set local MSRPs for configured regions
            </p>
          </div>

          <div className="space-y-3">
            {regionsNeedingMsrp.map((regionCode) => {
              const region = REGIONS[regionCode];
              const currency = CURRENCIES[region?.defaultCurrency || 'USD'];
              const currentMsrp = getRegionalMsrp(regionCode);

              return (
                <div key={regionCode} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <span className="text-lg">{region?.flag}</span>
                    <span className="text-sm font-medium">{regionCode}</span>
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {currency?.symbol || '$'}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-8"
                      value={currentMsrp ?? ''}
                      onChange={(e) =>
                        handleRegionalMsrpChange(
                          regionCode,
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10">
                    {region?.defaultCurrency || 'USD'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sync after create checkbox */}
      {configuredRegions.size > 1 && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Checkbox
              id="sync-after-create"
              checked={syncAfterCreate}
              onCheckedChange={(checked) => 
                form.setValue('sync_after_create', !!checked, { shouldDirty: true })
              }
            />
            <Label htmlFor="sync-after-create" className="text-sm cursor-pointer">
              Sync prices from all configured stores after creation
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}
