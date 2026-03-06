import { useState } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertTriangle, Info, BarChart3, ExternalLink } from 'lucide-react';
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

interface PostImportResults {
  price_history_initialized: number;
  urls_validated: number;
  urls_broken: string[];
  td_status: 'queued' | 'not_available' | 'brand_has_td';
  avg_data_quality: number;
  quality_warnings: string[];
  completed_at: string;
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
  const [postImportStatus, setPostImportStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [postResults, setPostResults] = useState<PostImportResults | null>(null);
  const [importSummary, setImportSummary] = useState<{ inserted: number; errors: number } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    let inserted = 0;
    let errors = 0;
    const insertedIds: string[] = [];

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

        if (filament?.id) {
          insertedIds.push(filament.id);
        }

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
    setImportSummary({ inserted, errors });

    if (errors > 0) {
      toast({
        title: `Imported ${inserted} filaments`,
        description: `${errors} failed. Check the table for details.`,
        variant: 'destructive',
      });
    }

    // Run post-import setup if we have inserted filaments
    if (insertedIds.length > 0) {
      setPostImportStatus('running');
      try {
        const { data, error: postError } = await supabase.functions.invoke(
          'post-import-filament-setup',
          {
            body: {
              filament_ids: insertedIds,
              brand_id: items[0].extracted_data.brand_id,
              job_id: items[0].job_id,
            },
          }
        );

        if (postError) {
          setPostImportStatus('error');
        } else {
          setPostImportStatus('done');
          setPostResults(data?.results ?? null);

          const brokenCount = data?.results?.urls_broken?.length ?? 0;
          toast({
            title: `Successfully added ${inserted} new filaments for ${brandName}`,
            description: brokenCount > 0
              ? `Price tracking initialized, URLs validated. ⚠️ ${brokenCount} broken URL(s) detected.`
              : 'Price tracking initialized, URLs validated.',
          });
        }
      } catch {
        setPostImportStatus('error');
      }
    } else if (errors === 0) {
      toast({
        title: `Successfully added ${inserted} new filaments for ${brandName}`,
        description: brandSlug ? `View at /brands/${brandSlug}` : undefined,
      });
    }

    onComplete();
  };

  const handleClose = () => {
    setImportSummary(null);
    setPostImportStatus('idle');
    setPostResults(null);
    setProgress(0);
    onOpenChange(false);
  };

  const tdLabel = postResults?.td_status === 'queued'
    ? 'Queued for TD matching'
    : postResults?.td_status === 'brand_has_td'
      ? 'Brand has TD data'
      : 'TD data not available for this brand';

  const showResults = importSummary !== null;

  return (
    <AlertDialog open={open} onOpenChange={showResults ? undefined : onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {showResults ? 'Import Complete' : `Import ${items.length} Filaments`}
          </AlertDialogTitle>
          {!showResults && (
            <AlertDialogDescription>
              You are about to create {items.length} new filament records for {brandName}.
              This will add them to the public filament database. Continue?
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {/* Import progress */}
        {importing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Inserting filament {Math.round((progress / 100) * items.length)} of {items.length}...
            </p>
          </div>
        )}

        {/* Post-import running */}
        {postImportStatus === 'running' && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Running post-import setup...</span>
          </div>
        )}

        {/* Results summary */}
        {showResults && !importing && postImportStatus !== 'running' && (
          <div className="space-y-3">
            {/* Import result */}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                {importSummary.inserted} filament{importSummary.inserted !== 1 ? 's' : ''} imported
              </span>
              {importSummary.errors > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {importSummary.errors} failed
                </Badge>
              )}
            </div>

            {/* Post-import results */}
            {postResults && (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    Price history initialized for {postResults.price_history_initialized} price point{postResults.price_history_initialized !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {postResults.urls_broken.length > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  <span className="text-sm">
                    {postResults.urls_validated} URL{postResults.urls_validated !== 1 ? 's' : ''} validated
                    {postResults.urls_broken.length > 0 && (
                      <span className="text-amber-600 font-medium">
                        {' '}— {postResults.urls_broken.length} broken
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{tdLabel}</span>
                </div>

                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Avg data quality: <span className="font-medium">{postResults.avg_data_quality}%</span>
                  </span>
                </div>
              </>
            )}

            {/* Post-import error warning */}
            {postImportStatus === 'error' && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  Post-import setup encountered an error. Filaments were imported successfully.
                </span>
              </div>
            )}

            {/* Verification links */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
              {brandSlug && (
                <a href={`/brands/${brandSlug}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  View Brand Page <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <a href={`/filament-database?brand=${encodeURIComponent(brandName)}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                View in Database <ExternalLink className="h-3 w-3" />
              </a>
              <a href={`/admin/affiliates?brand=${encodeURIComponent(brandName)}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                Check Affiliate Links <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          {showResults && !importing && postImportStatus !== 'running' ? (
            <Button onClick={handleClose}>Close</Button>
          ) : (
            <>
              <AlertDialogCancel disabled={importing}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleImport} disabled={importing}>
                {importing ? 'Importing...' : `Import ${items.length} Filaments`}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
