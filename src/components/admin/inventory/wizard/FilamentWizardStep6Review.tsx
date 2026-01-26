import { UseFormReturn } from 'react-hook-form';
import { Pencil, Image as ImageIcon, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import { CURRENCIES } from '@/config/currencies';
import type { WizardFormValues } from '../AddFilamentWizard';

interface FilamentWizardStep6ReviewProps {
  form: UseFormReturn<WizardFormValues>;
  onGoToStep: (step: number) => void;
}

const DISPLAY_REGIONS: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU'];

export function FilamentWizardStep6Review({ form, onGoToStep }: FilamentWizardStep6ReviewProps) {
  const values = form.getValues();
  const detectedRegion = values.detected_region as RegionCode | undefined;
  const regionalUrls = values.regional_urls || [];
  const regionalMsrps = values.regional_msrps || [];

  const formatPrice = (price?: number, currencyCode: CurrencyCode = 'USD') => {
    if (!price && price !== 0) return '—';
    const currency = CURRENCIES[currencyCode];
    const symbol = currency?.symbol || '$';
    return `${symbol}${price.toFixed(currency?.decimalPlaces ?? 2)}`;
  };

  // Gather all configured regions
  const configuredRegions: RegionCode[] = [
    ...(detectedRegion ? [detectedRegion] : []),
    ...regionalUrls.map((u) => u.region_code as RegionCode),
  ];
  const configuredSet = new Set(configuredRegions);

  const getRegionalMsrp = (regionCode: RegionCode) => {
    const found = regionalMsrps.find((r) => r.region_code === regionCode);
    return found?.msrp;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Review & Create</h3>
        <p className="text-sm text-muted-foreground">
          Review the filament details before creating.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Source Information */}
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Source Information</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onGoToStep(1)}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="col-span-2">
                <dt className="text-muted-foreground">URL</dt>
                <dd className="truncate font-mono text-xs flex items-center gap-2">
                  {detectedRegion && (
                    <span>{REGIONS[detectedRegion]?.flag}</span>
                  )}
                  {values.product_url || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Brand</dt>
                <dd>{values.vendor || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source Type</dt>
                <dd className="capitalize">{values.source_type}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Basic Information</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onGoToStep(2)}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="col-span-2">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{values.product_title || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Material</dt>
                <dd>{values.material || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Diameter</dt>
                <dd>{values.diameter}mm</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Weight</dt>
                <dd>{values.net_weight_g}g</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="text-muted-foreground">Color</dt>
                <dd className="flex items-center gap-2">
                  {values.color_hex && /^#[0-9A-Fa-f]{6}$/.test(values.color_hex) && (
                    <div
                      className="w-4 h-4 rounded border border-border"
                      style={{ backgroundColor: values.color_hex }}
                    />
                  )}
                  {values.color_name || '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Regional URLs */}
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Regional URLs</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onGoToStep(3)}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            {/* Coverage badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Coverage:</span>
              {DISPLAY_REGIONS.map((regionCode) => {
                const isConfigured = configuredSet.has(regionCode);
                return (
                  <div
                    key={regionCode}
                    className="flex items-center gap-1 text-sm"
                  >
                    <span>{REGIONS[regionCode]?.flag}</span>
                    {isConfigured ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <X className="w-3 h-3 text-muted-foreground/50" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* URL list */}
            {configuredRegions.length > 0 ? (
              <div className="space-y-1.5">
                {/* Primary URL */}
                {detectedRegion && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>{REGIONS[detectedRegion]?.flag}</span>
                    <span className="text-muted-foreground">{detectedRegion}:</span>
                    <span className="font-mono text-xs truncate flex-1">
                      {new URL(values.product_url).hostname}...
                    </span>
                    <span className="text-xs text-primary">(Primary)</span>
                  </div>
                )}
                {/* Additional URLs */}
                {regionalUrls.map((url) => (
                  <div key={url.region_code} className="flex items-center gap-2 text-sm">
                    <span>{REGIONS[url.region_code as RegionCode]?.flag}</span>
                    <span className="text-muted-foreground">{url.region_code}:</span>
                    <span className="font-mono text-xs truncate flex-1">
                      {url.store_url ? new URL(url.store_url).hostname + '...' : '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No regional URLs configured</p>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Pricing</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onGoToStep(4)}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Base MSRP</dt>
                <dd className="font-medium">{formatPrice(values.msrp)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Current Price</dt>
                <dd>{formatPrice(values.variant_price)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Compare At</dt>
                <dd>{formatPrice(values.variant_compare_at_price)}</dd>
              </div>
            </dl>

            {/* Regional MSRP */}
            {regionalMsrps.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Regional MSRP:</p>
                <div className="flex flex-wrap gap-3">
                  {regionalMsrps.map((rm) => {
                    const region = REGIONS[rm.region_code as RegionCode];
                    const currencyCode = rm.currency_code as CurrencyCode;
                    return (
                      <div key={rm.region_code} className="flex items-center gap-1.5 text-sm">
                        <span>{region?.flag}</span>
                        <span>{formatPrice(rm.msrp || undefined, currencyCode)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sync indicator */}
            {values.sync_after_create && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Check className="w-3 h-3 text-green-500" />
                Will sync prices after creation
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Additional Details</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onGoToStep(5)}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="flex gap-4">
              {values.featured_image && (
                <div className="w-16 h-16 rounded-md border border-border overflow-hidden shrink-0 bg-muted">
                  <img
                    src={values.featured_image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <dl className="grid grid-cols-2 gap-2 text-sm flex-1">
                <div>
                  <dt className="text-muted-foreground">Nozzle Temp</dt>
                  <dd>
                    {values.nozzle_temp_min_c && values.nozzle_temp_max_c
                      ? `${values.nozzle_temp_min_c}–${values.nozzle_temp_max_c}°C`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Bed Temp</dt>
                  <dd>
                    {values.bed_temp_min_c && values.bed_temp_max_c
                      ? `${values.bed_temp_min_c}–${values.bed_temp_max_c}°C`
                      : '—'}
                  </dd>
                </div>
                {values.admin_notes && (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd className="text-xs text-muted-foreground line-clamp-2">
                      {values.admin_notes}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
