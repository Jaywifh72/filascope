import { UseFormReturn } from 'react-hook-form';
import { DollarSign, Info } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import { CURRENCIES } from '@/config/currencies';
import type { WizardFormValues } from '../AddFilamentWizard';

interface FilamentWizardStep4PricingProps {
  form: UseFormReturn<WizardFormValues>;
}

interface RegionalMsrpItem {
  region_code: string;
  currency_code: string;
  msrp: number | null;
}

interface RegionalUrlItem {
  region_code: string;
  store_url: string;
  store_name: string;
  currency_code: string;
  is_primary: boolean;
  is_verified: boolean;
}

export function FilamentWizardStep4Pricing({ form }: FilamentWizardStep4PricingProps) {
  const msrp = form.watch('msrp');
  const currentPrice = form.watch('variant_price');
  const detectedRegion = form.watch('detected_region') as RegionCode | undefined;
  const regionalUrls = (form.watch('regional_urls') || []) as RegionalUrlItem[];
  const regionalMsrps = (form.watch('regional_msrps') || []) as RegionalMsrpItem[];
  const syncAfterCreate = form.watch('sync_after_create');

  const priceDiff =
    msrp && currentPrice
      ? (((msrp - currentPrice) / msrp) * 100).toFixed(0)
      : null;

  // Get all configured regions (primary + additional)
  const configuredRegions: RegionCode[] = [
    ...(detectedRegion ? [detectedRegion] : []),
    ...regionalUrls.map((u) => u.region_code as RegionCode),
  ];

  const handleRegionalMsrpChange = (regionCode: RegionCode, value: number | null) => {
    const currencyCode = REGIONS[regionCode]?.defaultCurrency || 'USD';
    const existing = regionalMsrps.findIndex((r) => r.region_code === regionCode);
    
    if (existing >= 0) {
      const updated = [...regionalMsrps];
      updated[existing] = { region_code: regionCode, currency_code: currencyCode, msrp: value };
      form.setValue('regional_msrps', updated, { shouldDirty: true });
    } else {
      form.setValue(
        'regional_msrps',
        [...regionalMsrps, { region_code: regionCode, currency_code: currencyCode, msrp: value }],
        { shouldDirty: true }
      );
    }
  };

  const getRegionalMsrp = (regionCode: RegionCode): number | null => {
    const found = regionalMsrps.find((r) => r.region_code === regionCode);
    return found?.msrp ?? null;
  };

  const getCurrencySymbol = (currencyCode: CurrencyCode): string => {
    return CURRENCIES[currencyCode]?.symbol || '$';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Pricing</h3>
        <p className="text-sm text-muted-foreground">
          Enter the base pricing and optional regional overrides.
        </p>
      </div>

      {/* Base Pricing */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="msrp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base MSRP (USD) *</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="24.99"
                    className="pl-10"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Manufacturer's suggested retail price in USD
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="variant_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Price</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="19.99"
                      className="pl-10"
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="variant_compare_at_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compare At Price</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="29.99"
                      className="pl-10"
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {priceDiff && Number(priceDiff) > 0 && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">
              <span className="font-medium">{priceDiff}% savings</span> compared to MSRP
            </p>
          </div>
        )}
      </div>

      {/* Regional MSRP Overrides */}
      {configuredRegions.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Regional MSRP Overrides</Label>
            <Info className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Set region-specific MSRPs in local currencies. Leave blank to use the base MSRP.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[140px]">Region</TableHead>
                  <TableHead className="w-[100px]">Currency</TableHead>
                  <TableHead>Regional MSRP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configuredRegions.map((regionCode) => {
                  const region = REGIONS[regionCode];
                  const currencyCode = region?.defaultCurrency || 'USD';
                  const currencySymbol = getCurrencySymbol(currencyCode as CurrencyCode);
                  const isPrimary = regionCode === detectedRegion;
                  const regionalMsrp = getRegionalMsrp(regionCode);

                  return (
                    <TableRow key={regionCode}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{region?.flag}</span>
                          <span className="text-sm">{regionCode}</span>
                          {isPrimary && (
                            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{currencyCode}</span>
                      </TableCell>
                      <TableCell>
                        {isPrimary ? (
                          <span className="text-sm text-muted-foreground">Uses base MSRP</span>
                        ) : (
                          <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              {currencySymbol}
                            </span>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder="—"
                              className="h-8 pl-8"
                              value={regionalMsrp ?? ''}
                              onChange={(e) =>
                                handleRegionalMsrpChange(
                                  regionCode,
                                  e.target.value ? parseFloat(e.target.value) : null
                                )
                              }
                            />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Sync After Create */}
      {configuredRegions.length > 0 && (
        <div className="flex items-center gap-3 pt-2">
          <Checkbox
            id="sync-after-create"
            checked={syncAfterCreate}
            onCheckedChange={(checked) =>
              form.setValue('sync_after_create', checked as boolean, { shouldDirty: true })
            }
          />
          <Label htmlFor="sync-after-create" className="text-sm cursor-pointer">
            Sync prices from all configured stores after creation
          </Label>
        </div>
      )}
    </div>
  );
}
