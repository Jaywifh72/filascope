import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { PrinterWizardFormValues } from '../AddPrinterWizard';

const CONNECTIVITY_OPTIONS = [
  { id: 'WiFi', label: 'WiFi' },
  { id: 'Ethernet', label: 'Ethernet' },
  { id: 'USB', label: 'USB' },
  { id: 'SD Card', label: 'SD Card' },
  { id: 'Bluetooth', label: 'Bluetooth' },
  { id: 'LAN', label: 'LAN' },
];

const FEATURE_OPTIONS = [
  { id: 'Auto Bed Leveling', label: 'Auto Bed Leveling' },
  { id: 'Enclosure', label: 'Enclosure' },
  { id: 'Multi-Color', label: 'Multi-Color / Multi-Material' },
  { id: 'Direct Drive', label: 'Direct Drive Extruder' },
  { id: 'Heated Bed', label: 'Heated Bed' },
  { id: 'Touchscreen', label: 'Touchscreen' },
  { id: 'Camera', label: 'Built-in Camera' },
  { id: 'Filament Sensor', label: 'Filament Runout Sensor' },
  { id: 'Power Recovery', label: 'Power Recovery' },
  { id: 'Silent Mode', label: 'Silent Stepper Drivers' },
];

const FILAMENT_OPTIONS = [
  'PLA',
  'PLA+',
  'ABS',
  'PETG',
  'TPU',
  'ASA',
  'Nylon',
  'PC',
  'PVA',
  'HIPS',
  'CF-PLA',
  'CF-PETG',
  'CF-Nylon',
];

interface PrinterWizardStep3Props {
  form: UseFormReturn<PrinterWizardFormValues>;
}

export function PrinterWizardStep3({ form }: PrinterWizardStep3Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Features & Connectivity</h3>
        <p className="text-sm text-muted-foreground">
          Select the printer's connectivity options and features.
        </p>
      </div>

      <FormField
        control={form.control}
        name="connectivity"
        render={() => (
          <FormItem>
            <FormLabel>Connectivity Options</FormLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
              {CONNECTIVITY_OPTIONS.map((option) => (
                <FormField
                  key={option.id}
                  control={form.control}
                  name="connectivity"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(option.id)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, option.id]);
                            } else {
                              field.onChange(
                                current.filter((v: string) => v !== option.id)
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <Label className="cursor-pointer font-normal">
                        {option.label}
                      </Label>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="features"
        render={() => (
          <FormItem>
            <FormLabel>Features</FormLabel>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {FEATURE_OPTIONS.map((option) => (
                <FormField
                  key={option.id}
                  control={form.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(option.id)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, option.id]);
                            } else {
                              field.onChange(
                                current.filter((v: string) => v !== option.id)
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <Label className="cursor-pointer font-normal">
                        {option.label}
                      </Label>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="filament_compatibility"
        render={() => (
          <FormItem>
            <FormLabel>Filament Compatibility</FormLabel>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
              {FILAMENT_OPTIONS.map((filament) => (
                <FormField
                  key={filament}
                  control={form.control}
                  name="filament_compatibility"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(filament)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, filament]);
                            } else {
                              field.onChange(
                                current.filter((v: string) => v !== filament)
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <Label className="cursor-pointer font-normal text-sm">
                        {filament}
                      </Label>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
