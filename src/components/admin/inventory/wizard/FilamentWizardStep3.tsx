import { UseFormReturn } from 'react-hook-form';
import { DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import type { WizardFormValues } from '../AddFilamentWizard';

interface FilamentWizardStep3Props {
  form: UseFormReturn<WizardFormValues>;
}

export function FilamentWizardStep3({ form }: FilamentWizardStep3Props) {
  const msrp = form.watch('msrp');
  const currentPrice = form.watch('variant_price');

  const priceDiff =
    msrp && currentPrice
      ? (((msrp - currentPrice) / msrp) * 100).toFixed(0)
      : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Pricing</h3>
        <p className="text-sm text-muted-foreground">
          Enter the pricing information. All prices are in USD.
        </p>
      </div>

      <FormField
        control={form.control}
        name="msrp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>MSRP *</FormLabel>
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
              Manufacturer's suggested retail price
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

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
            <FormDescription>
              Optional manual price override (will be synced automatically)
            </FormDescription>
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
            <FormDescription>
              Original price for showing discounts (strikethrough price)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {priceDiff && Number(priceDiff) > 0 && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">
            <span className="font-medium">{priceDiff}% savings</span> compared to MSRP
          </p>
        </div>
      )}
    </div>
  );
}
