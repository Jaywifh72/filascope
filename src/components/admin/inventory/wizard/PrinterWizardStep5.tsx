import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, Wand2, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import type { PrinterWizardFormValues } from '../AddPrinterWizard';

const COMMON_SPECS = [
  { key: 'Nozzle Size', value: '0.4mm' },
  { key: 'Layer Height', value: '0.05-0.35mm' },
  { key: 'Filament Diameter', value: '1.75mm' },
  { key: 'Extruder Type', value: 'Direct Drive' },
  { key: 'Hotend Max Temp', value: '300°C' },
  { key: 'Bed Max Temp', value: '100°C' },
  { key: 'Frame Material', value: 'Aluminum' },
  { key: 'Power Supply', value: '350W' },
];

interface PrinterWizardStep5Props {
  form: UseFormReturn<PrinterWizardFormValues>;
}

export function PrinterWizardStep5({ form }: PrinterWizardStep5Props) {
  const imageUrl = form.watch('image_url');
  const specifications = form.watch('specifications') || {};

  const [specRows, setSpecRows] = useState<Array<{ key: string; value: string }>>(
    Object.entries(specifications).map(([key, value]) => ({ key, value }))
  );

  const updateSpecifications = (rows: Array<{ key: string; value: string }>) => {
    const newSpecs: Record<string, string> = {};
    rows.forEach(({ key, value }) => {
      if (key.trim()) {
        newSpecs[key.trim()] = value;
      }
    });
    form.setValue('specifications', newSpecs);
  };

  const handleAddRow = () => {
    const newRows = [...specRows, { key: '', value: '' }];
    setSpecRows(newRows);
  };

  const handleRemoveRow = (index: number) => {
    const newRows = specRows.filter((_, i) => i !== index);
    setSpecRows(newRows);
    updateSpecifications(newRows);
  };

  const handleRowChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const newRows = [...specRows];
    newRows[index][field] = value;
    setSpecRows(newRows);
    updateSpecifications(newRows);
  };

  const handleAddCommonSpecs = () => {
    const existingKeys = new Set(specRows.map((r) => r.key.toLowerCase()));
    const newSpecs = COMMON_SPECS.filter(
      (s) => !existingKeys.has(s.key.toLowerCase())
    );
    const newRows = [...specRows, ...newSpecs];
    setSpecRows(newRows);
    updateSpecifications(newRows);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Additional Details</h3>
        <p className="text-sm text-muted-foreground">
          Add description, images, and technical specifications.
        </p>
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Brief description of the printer..."
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="image_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Image URL</FormLabel>
            <FormControl>
              <Input {...field} placeholder="https://..." />
            </FormControl>
            <FormMessage />
            {imageUrl && (
              <div className="mt-2 w-24 h-24 rounded-md border border-border overflow-hidden bg-muted">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML =
                      '<div class="w-full h-full flex items-center justify-center text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                  }}
                />
              </div>
            )}
          </FormItem>
        )}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FormLabel>Specifications</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCommonSpecs}
          >
            <Wand2 className="w-3 h-3 mr-1" />
            Add Common Specs
          </Button>
        </div>

        <div className="space-y-2">
          {specRows.map((row, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Key (e.g., Nozzle Size)"
                value={row.key}
                onChange={(e) => handleRowChange(index, 'key', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Value (e.g., 0.4mm)"
                value={row.value}
                onChange={(e) => handleRowChange(index, 'value', e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveRow(index)}
                className="shrink-0"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddRow}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Row
        </Button>
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
                placeholder="Internal notes (not shown to users)..."
                rows={2}
              />
            </FormControl>
            <FormDescription>Max 1000 characters</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
