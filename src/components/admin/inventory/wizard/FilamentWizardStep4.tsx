import { UseFormReturn } from 'react-hook-form';
import { Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import type { WizardFormValues } from '../AddFilamentWizard';

interface FilamentWizardStep4Props {
  form: UseFormReturn<WizardFormValues>;
}

export function FilamentWizardStep4({ form }: FilamentWizardStep4Props) {
  const imageUrl = form.watch('featured_image');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Additional Details</h3>
        <p className="text-sm text-muted-foreground">
          Add image, temperature settings, and notes.
        </p>
      </div>

      <FormField
        control={form.control}
        name="featured_image"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Image URL</FormLabel>
            <div className="flex gap-4">
              <div className="flex-1">
                <FormControl>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      placeholder="https://..."
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </div>
              {imageUrl && (
                <div className="w-20 h-20 rounded-md border border-border overflow-hidden shrink-0 bg-muted">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-3">Print Temperature Range</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nozzle_temp_min_c"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        min={150}
                        max={500}
                        placeholder="190"
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        °C
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nozzle_temp_max_c"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        min={150}
                        max={500}
                        placeholder="220"
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        °C
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3">Bed Temperature Range</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bed_temp_min_c"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        max={150}
                        placeholder="50"
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        °C
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bed_temp_max_c"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        max={150}
                        placeholder="60"
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        °C
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      <FormField
        control={form.control}
        name="admin_notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Admin Notes</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Internal notes about this filament..."
                className="min-h-[100px]"
              />
            </FormControl>
            <FormDescription>
              For internal use only. Not visible to users.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
