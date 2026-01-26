import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import type { PrinterWizardFormValues } from '../AddPrinterWizard';

const PRINTER_TYPES = [
  { value: 'FDM', label: 'FDM (Fused Deposition Modeling)' },
  { value: 'SLA', label: 'Resin / SLA (Stereolithography)' },
  { value: 'MSLA', label: 'MSLA (Masked Stereolithography)' },
  { value: 'DLP', label: 'DLP (Digital Light Processing)' },
  { value: 'Multi-Material', label: 'Multi-Material' },
  { value: 'Other', label: 'Other' },
];

interface PrinterWizardStep2Props {
  form: UseFormReturn<PrinterWizardFormValues>;
}

export function PrinterWizardStep2({ form }: PrinterWizardStep2Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <p className="text-sm text-muted-foreground">
          Enter the printer's basic specifications.
        </p>
      </div>

      <FormField
        control={form.control}
        name="model_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Display Name *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., Bambu Lab X1 Carbon" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="printer_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Printer Type *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select printer type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PRINTER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-3">
        <FormLabel>Build Volume (mm)</FormLabel>
        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="build_volume_x"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type="number"
                      placeholder="X"
                      className="pr-10"
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      X
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="build_volume_y"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type="number"
                      placeholder="Y"
                      className="pr-10"
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      Y
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="build_volume_z"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type="number"
                      placeholder="Z"
                      className="pr-10"
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      Z
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormDescription>
          Enter dimensions as X × Y × Z in millimeters
        </FormDescription>
      </div>

      <FormField
        control={form.control}
        name="max_print_speed"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max Print Speed</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  type="number"
                  placeholder="e.g., 500"
                  className="pr-16"
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  mm/s
                </span>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
