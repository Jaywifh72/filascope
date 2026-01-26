import { UseFormReturn } from 'react-hook-form';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PrinterWizardFormValues } from '../AddPrinterWizard';

interface PrinterWizardStep6Props {
  form: UseFormReturn<PrinterWizardFormValues>;
  onGoToStep: (step: number) => void;
}

export function PrinterWizardStep6({ form, onGoToStep }: PrinterWizardStep6Props) {
  const values = form.getValues();

  const formatPrice = (price?: number) => {
    if (!price && price !== 0) return '—';
    return `$${price.toFixed(2)}`;
  };

  const formatBuildVolume = () => {
    const { build_volume_x, build_volume_y, build_volume_z } = values;
    if (build_volume_x && build_volume_y && build_volume_z) {
      return `${build_volume_x} × ${build_volume_y} × ${build_volume_z} mm`;
    }
    return '—';
  };

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
          <CardContent className="px-4 pb-4 pt-0">
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
