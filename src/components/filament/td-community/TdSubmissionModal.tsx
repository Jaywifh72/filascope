import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTdSubmission, useExistingSubmission } from '@/hooks/useTdSubmission';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const schema = z.object({
  submitted_td_value: z.coerce.number().min(0).max(20),
  measurement_method: z.enum(['hueforge_calibration', 'light_meter', 'visual_estimate', 'manufacturer_spec', 'other']),
  layer_height_mm: z.coerce.number().min(0.01).max(1).nullable().optional(),
  nozzle_temp_c: z.coerce.number().min(150).max(350).nullable().optional(),
  printer_model: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

const METHODS = [
  { value: 'hueforge_calibration', label: 'HueForge Calibration Print (recommended)' },
  { value: 'light_meter', label: 'Light Meter / Lux Meter' },
  { value: 'visual_estimate', label: 'Visual Estimate (compared to known filament)' },
  { value: 'manufacturer_spec', label: 'Manufacturer Specification' },
  { value: 'other', label: 'Other' },
];

const LAYER_HEIGHTS = ['0.04', '0.08', '0.12', '0.16', '0.20'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filamentId: string;
  filamentName: string;
  currentTd: number | null;
}

export function TdSubmissionModal({ open, onOpenChange, filamentId, filamentName, currentTd }: Props) {
  const { submit, isPending, uploading } = useTdSubmission();
  const { data: existing } = useExistingSubmission(filamentId);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      submitted_td_value: existing?.submitted_td_value ?? undefined,
      measurement_method: (existing?.measurement_method as any) ?? 'hueforge_calibration',
      layer_height_mm: existing?.layer_height_mm ?? null,
      nozzle_temp_c: existing?.nozzle_temp_c ?? null,
      printer_model: existing?.printer_model ?? '',
      notes: existing?.notes ?? '',
    },
  });

  const onSubmit = (values: FormValues) => {
    submit({
      filament_id: filamentId,
      submitted_td_value: values.submitted_td_value,
      measurement_method: values.measurement_method,
      layer_height_mm: values.layer_height_mm,
      nozzle_temp_c: values.nozzle_temp_c,
      printer_model: values.printer_model,
      notes: values.notes,
      photo_file: photoFile,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit TD Measurement</DialogTitle>
          <DialogDescription className="text-sm">
            for <span className="font-medium text-foreground">{filamentName}</span>
          </DialogDescription>
        </DialogHeader>

        {currentTd != null && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Current TD:</span>
            <Badge variant="outline" className="bg-purple-500/15 text-purple-300 border-purple-500/30">
              {currentTd} mm
            </Badge>
          </div>
        )}

        {existing && existing.status === 'pending' && (
          <p className="text-xs text-amber-400">You have a pending submission (TD {existing.submitted_td_value}). Submitting again will update it.</p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="submitted_td_value" render={({ field }) => (
              <FormItem>
                <FormLabel>Your Measured TD Value *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" max="20" placeholder="e.g., 2.45" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="measurement_method" render={({ field }) => (
              <FormItem>
                <FormLabel>Measurement Method *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {METHODS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="layer_height_mm" render={({ field }) => (
                <FormItem>
                  <FormLabel>Layer Height</FormLabel>
                  <Select onValueChange={(v) => field.onChange(v === 'na' ? null : parseFloat(v))} defaultValue={field.value?.toString() ?? ''}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LAYER_HEIGHTS.map(h => (
                        <SelectItem key={h} value={h}>{h}mm</SelectItem>
                      ))}
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={form.control} name="nozzle_temp_c" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nozzle Temp (°C)</FormLabel>
                  <FormControl>
                    <Input type="number" min="150" max="350" placeholder="e.g., 210" {...field} value={field.value ?? ''} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="printer_model" render={({ field }) => (
              <FormItem>
                <FormLabel>Printer Model</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Bambu Lab X1C, Prusa MK4" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )} />

            <div>
              <label className="text-sm font-medium">Photo of Calibration Print</label>
              <Input
                type="file"
                accept="image/*"
                className="mt-1"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground mt-1">Optional, max 5MB</p>
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any additional details about your measurement..." rows={3} {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )} />

            <Button type="submit" className="w-full" disabled={isPending || uploading}>
              {(isPending || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Measurement
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Submissions are reviewed before being added to the database. Consistent measurements from multiple users increase data confidence.
            </p>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
