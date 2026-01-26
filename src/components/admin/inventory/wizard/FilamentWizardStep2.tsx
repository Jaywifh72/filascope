import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
} from '@/components/ui/form';
import { MATERIAL_OPTIONS } from '@/lib/brandAutoDetection';
import type { WizardFormValues } from '../AddFilamentWizard';

interface FilamentWizardStep2Props {
  form: UseFormReturn<WizardFormValues>;
}

export function FilamentWizardStep2({ form }: FilamentWizardStep2Props) {
  const colorHex = form.watch('color_hex');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <p className="text-sm text-muted-foreground">
          Enter the filament details like name, material, and color.
        </p>
      </div>

      <FormField
        control={form.control}
        name="product_title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Display Name *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., Hyper PLA - Matte Black" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="material"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MATERIAL_OPTIONS.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="diameter"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Diameter</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1.75" id="diameter-175" />
                    <Label htmlFor="diameter-175" className="cursor-pointer">
                      1.75mm
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2.85" id="diameter-285" />
                    <Label htmlFor="diameter-285" className="cursor-pointer">
                      2.85mm
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="net_weight_g"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Weight (grams)</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  type="number"
                  min={0}
                  step={1}
                  placeholder="1000"
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  g
                </span>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="color_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Matte Black" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color_hex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color (Hex)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input {...field} placeholder="#000000" maxLength={7} />
                </FormControl>
                {colorHex && /^#[0-9A-Fa-f]{6}$/.test(colorHex) && (
                  <div
                    className="w-10 h-10 rounded-md border border-border shrink-0"
                    style={{ backgroundColor: colorHex }}
                  />
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
