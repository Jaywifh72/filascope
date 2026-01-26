import { UseFormReturn } from 'react-hook-form';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RegionCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import { CURRENCIES } from '@/config/currencies';
import type { PrinterWizardFormValues } from '../AddPrinterWizard';

interface PrinterWizardStep7ReviewProps {
  form: UseFormReturn<PrinterWizardFormValues>;
  onGoToStep: (step: number) => void;
}

const ALL_REGIONS: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU'];

export function PrinterWizardStep7Review({ form, onGoToStep }: PrinterWizardStep7ReviewProps) {
  const values = form.getValues();
  const detectedRegion = values.detected_region as RegionCode | undefined;
  const regionalUrls = values.regional_urls || [];
  const regionalMsrps = values.regional_msrps || [];

  const formatPrice = (price?: number, currencyCode = 'USD') => {
    if (!price && price !== 0) return '—';
    const currency = CURRENCIES[currencyCode as keyof typeof CURRENCIES];
    return `${currency?.symbol || '$'}${price.toFixed(2)}`;
  };

  const formatBuildVolume = () => {
    const { build_volume_x, build_volume_y, build_volume_z } = values;
    if (build_volume_x && build_volume_y && build_volume_z) {
      return `${build_volume_x} × ${build_volume_y} × ${build_volume_z} mm`;
    }
    return '—';
  };

  // Calculate configured regions
  const configuredRegions = new Set<string>();
  if (detectedRegion) configuredRegions.add(detectedRegion);
  regionalUrls.forEach((u: any) => {
    if (u.store_url) configuredRegions.add(u.region_code);
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Review & Create</h3>
        <p className="text-sm text-muted-foreground">
          Review the printer details before creating.
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
              <div>
                <dt className="text-muted-foreground">URL</dt>
                <dd className="truncate font-mono text-xs">
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
              {detectedRegion && (
                <div>
                  <dt className="text-muted-foreground">Detected Region</dt>
                  <dd className="flex items-center gap-1">
                    {REGIONS[detectedRegion]?.flag} {REGIONS[detectedRegion]?.name}
                  </dd>
                </div>
              )}
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
                <dd className="font-medium">{values.model_name || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd>{values.printer_type || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Build Volume</dt>
                <dd>{formatBuildVolume()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Max Speed</dt>
                <dd>
                  {values.max_print_speed
                    ? `${values.max_print_speed} mm/s`
                    : '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Features & Connectivity */}
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Features & Connectivity</CardTitle>
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
            <div>
              <dt className="text-sm text-muted-foreground mb-1">Connectivity</dt>
              <dd className="flex flex-wrap gap-1">
                {values.connectivity?.length > 0 ? (
                  values.connectivity.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs">
                      {c}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground mb-1">Features</dt>
              <dd className="flex flex-wrap gap-1">
                {values.features?.length > 0 ? (
                  values.features.map((f) => (
                    <Badge key={f} variant="secondary" className="text-xs">
                      {f}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground mb-1">Filament Compatibility</dt>
              <dd className="flex flex-wrap gap-1">
                {values.filament_compatibility?.length > 0 ? (
                  values.filament_compatibility.map((f) => (
                    <Badge key={f} variant="outline" className="text-xs">
                      {f}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </dd>
            </div>
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
              onClick={() => onGoToStep(4)}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            {/* Coverage badges */}
            <div className="flex flex-wrap gap-2">
              {ALL_REGIONS.map((regionCode) => {
                const isConfigured = configuredRegions.has(regionCode);
                const region = REGIONS[regionCode];
                return (
                  <div
                    key={regionCode}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      isConfigured
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span>{region?.flag}</span>
                    {isConfigured ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* URL list */}
            <div className="space-y-1 text-sm">
              {detectedRegion && (
                <div className="flex items-center gap-2">
                  <span>{REGIONS[detectedRegion]?.flag}</span>
                  <span className="font-mono text-xs truncate flex-1">
                    {values.product_url}
                  </span>
                  <Badge variant="outline" className="text-xs">Primary</Badge>
                </div>
              )}
              {regionalUrls.filter((u: any) => u.store_url).map((urlData: any) => {
                const region = REGIONS[urlData.region_code as RegionCode];
                return (
                  <div key={urlData.region_code} className="flex items-center gap-2">
                    <span>{region?.flag}</span>
                    <span className="font-mono text-xs truncate flex-1">
                      {urlData.store_url}
                    </span>
                    {urlData.is_verified && (
                      <Check className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>
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
              onClick={() => onGoToStep(5)}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">MSRP</dt>
                <dd className="font-medium">{formatPrice(values.msrp)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Current Price</dt>
                <dd>{formatPrice(values.current_price)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Compare At</dt>
                <dd>{formatPrice(values.compare_at_price)}</dd>
              </div>
            </dl>

            {/* Regional prices */}
            {regionalMsrps.length > 0 && (
              <div className="pt-2 border-t border-border space-y-1">
                <p className="text-xs text-muted-foreground">Regional MSRPs:</p>
                {regionalMsrps.filter((p: any) => p.msrp != null).map((price: any) => {
                  const region = REGIONS[price.region_code as RegionCode];
                  return (
                    <div key={price.region_code} className="flex items-center gap-2 text-sm">
                      <span>{region?.flag}</span>
                      <span>{formatPrice(price.msrp, price.currency_code)}</span>
                      <span className="text-xs text-muted-foreground">{price.currency_code}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {values.sync_after_create && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Check className="w-3 h-3 text-green-500" />
                <span>Will sync prices after creation</span>
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
              onClick={() => onGoToStep(6)}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="flex gap-4">
              {values.image_url && (
                <div className="w-16 h-16 rounded-md border border-border overflow-hidden shrink-0 bg-muted">
                  <img
                    src={values.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <dl className="grid gap-2 text-sm flex-1">
                {values.description && (
                  <div>
                    <dt className="text-muted-foreground">Description</dt>
                    <dd className="line-clamp-2">{values.description}</dd>
                  </div>
                )}
                {values.specifications &&
                  Object.keys(values.specifications).length > 0 && (
                    <div>
                      <dt className="text-muted-foreground">Specifications</dt>
                      <dd className="text-xs text-muted-foreground">
                        {Object.keys(values.specifications).length} items
                      </dd>
                    </div>
                  )}
                {values.admin_notes && (
                  <div>
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
