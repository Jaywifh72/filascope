import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import type { PrinterWizardFormValues } from '../AddPrinterWizard';

interface PrinterWizardStep4Props {
  form: UseFormReturn<PrinterWizardFormValues>;
}

export function PrinterWizardStep4({ form }: PrinterWizardStep4Props) {
  const msrp = form.watch('msrp');
  const currentPrice = form.watch('current_price');

  // Calculate discount percentage
  const discountPercent =
    msrp && currentPrice && currentPrice < msrp
      ? Math.round(((msrp - currentPrice) / msrp) * 100)
      : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Pricing</h3>
        <p className="text-sm text-muted-foreground">
          Enter the printer's pricing information. All prices in USD.
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
    </div>
  );
}
