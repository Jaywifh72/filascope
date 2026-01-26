import { UseFormReturn } from 'react-hook-form';
import { Pencil, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WizardFormValues } from '../AddFilamentWizard';

interface FilamentWizardStep5Props {
  form: UseFormReturn<WizardFormValues>;
  onGoToStep: (step: number) => void;
}

export function FilamentWizardStep5({ form, onGoToStep }: FilamentWizardStep5Props) {
  const values = form.getValues();

  const formatPrice = (price?: number) => {
    if (!price && price !== 0) return '—';
    return `$${price.toFixed(2)}`;
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

        {/* Pricing */}
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Pricing</CardTitle>
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
          <CardContent className="px-4 pb-4 pt-0">
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">MSRP</dt>
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
              onClick={() => onGoToStep(4)}
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
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
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
