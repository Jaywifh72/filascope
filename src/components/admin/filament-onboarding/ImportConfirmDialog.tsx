import { useState } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface OnboardingItem {
  id: string;
  job_id: string;
  extracted_data: Record<string, unknown>;
  admin_override_data: Record<string, unknown> | null;
  display_name: string | null;
  material_type: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: OnboardingItem[];
  brandName: string;
  brandSlug: string;
  onComplete: () => void;
}

export function ImportConfirmDialog({ open, onOpenChange, items, brandName, brandSlug, onComplete }: Props) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const merged = { ...item.extracted_data, ...item.admin_override_data } as Record<string, any>;

      try {
        // Insert into filaments table
        const { data: filament, error } = await supabase
          .from('filaments')
          .insert({
            vendor: merged.vendor ?? brandName,
            brand_id: merged.brand_id,
            material: merged.material ?? item.material_type,
            product_title: merged.product_title ?? item.display_name,
            display_name: merged.display_name ?? item.display_name,
            color_family: merged.color_family,
            color_hex: merged.color_hex,
            featured_image: merged.featured_image,
            variant_image: merged.variant_image,
            nozzle_temp_min_c: merged.nozzle_temp_min_c,
            nozzle_temp_max_c: merged.nozzle_temp_max_c,
            bed_temp_min_c: merged.bed_temp_min_c,
            bed_temp_max_c: merged.bed_temp_max_c,
            diameter_nominal_mm: merged.diameter_nominal_mm ?? 1.75,
            net_weight_g: merged.net_weight_g,
            product_url: merged.product_url,
            product_url_us: merged.product_url_us,
            product_url_eu: merged.product_url_eu,
            product_url_uk: merged.product_url_uk,
            product_url_ca: merged.product_url_ca,
            product_url_au: merged.product_url_au,
            variant_price: merged.price_usd,
            price_eur: merged.price_eur,
            price_gbp: merged.price_gbp,
            price_cad: merged.price_cad,
            price_aud: merged.price_aud,
            product_handle: merged.product_handle,
            variant_sku: merged.variant_sku,
            finish_type: merged.finish_type,
            spool_material: merged.spool_material,
            pack_quantity: merged.pack_quantity ?? 1,
            print_speed_max_mms: merged.print_speed_max_mms,
            high_speed_capable: merged.high_speed_capable,
            drying_temp_c: merged.drying_temp_c,
            drying_time_hours: merged.drying_time_hours,
            variant_available: merged.variant_available ?? true,
            available_regions: merged.available_regions,
            auto_created: true,
          })
          .select('id')
          .single();

        if (error) throw error;

        // Update onboarding item
        await supabase
          .from('filament_onboarding_items')
          .update({
            status: 'inserted',
            inserted_filament_id: filament?.id,
          })
          .eq('id', item.id);

        inserted++;
      } catch {
        errors++;
      }

      setProgress(Math.round(((i + 1) / items.length) * 100));
    }

    // Update job counts
    if (items.length > 0) {
      await supabase
        .from('filament_onboarding_jobs')
        .update({ inserted_count: inserted })
        .eq('id', items[0].job_id);
    }

    setImporting(false);
    onOpenChange(false);

    if (errors > 0) {
      toast({
        title: `Imported ${inserted} filaments`,
        description: `${errors} failed. Check the table for details.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: `Successfully added ${inserted} new filaments for ${brandName}`,
        description: brandSlug ? `View at /brands/${brandSlug}` : undefined,
      });
    }

    onComplete();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Import {items.length} Filaments</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to create {items.length} new filament records for {brandName}.
            This will add them to the public filament database. Continue?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {importing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Inserting filament {Math.round((progress / 100) * items.length)} of {items.length}...
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={importing}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleImport} disabled={importing}>
            {importing ? 'Importing...' : `Import ${items.length} Filaments`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
