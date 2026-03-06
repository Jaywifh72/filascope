import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, AlertTriangle, Info, BarChart3, Package, Link2, ChevronDown, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PostImportResults {
  price_history_initialized: number;
  urls_validated: number;
  urls_broken: string[];
  td_status: 'queued' | 'not_available' | 'brand_has_td';
  avg_data_quality: number;
  quality_warnings: string[];
  completed_at: string;
}

interface Props {
  results: PostImportResults;
  jobId?: string;
  brandId?: string;
  onResultsUpdated?: (results: PostImportResults) => void;
}

export function PostImportSummaryCard({ results, jobId, brandId, onResultsUpdated }: Props) {
  const [urlsOpen, setUrlsOpen] = useState(false);
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [rerunning, setRerunning] = useState(false);

  const qualityColor = results.avg_data_quality >= 80
    ? 'text-green-500' : results.avg_data_quality >= 50
      ? 'text-amber-500' : 'text-red-500';

  const tdLabel = results.td_status === 'queued'
    ? 'Queued for discovery'
    : results.td_status === 'brand_has_td'
      ? 'Brand has existing TD data'
      : 'Not available for this brand';

  const hasErrors = results.urls_broken.length > 0 || results.quality_warnings.length > 0;

  const handleRerun = async () => {
    if (!jobId || !brandId) return;
    setRerunning(true);
    try {
      // Get filament IDs from onboarding items for this job
      const { data: jobItems } = await supabase
        .from('filament_onboarding_items')
        .select('inserted_filament_id')
        .eq('job_id', jobId)
        .not('inserted_filament_id', 'is', null);

      const filamentIds = (jobItems ?? [])
        .map(i => i.inserted_filament_id)
        .filter(Boolean) as string[];

      if (filamentIds.length === 0) {
        toast({ title: 'No inserted filaments found for this job', variant: 'destructive' });
        setRerunning(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('post-import-filament-setup', {
        body: { filament_ids: filamentIds, brand_id: brandId, job_id: jobId },
      });

      if (error) throw error;

      toast({ title: 'Post-import setup re-run complete' });
      if (data?.results && onResultsUpdated) {
        onResultsUpdated(data.results);
      }
    } catch (e: any) {
      toast({ title: 'Re-run failed', description: e.message, variant: 'destructive' });
    } finally {
      setRerunning(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-2.5">
        {/* Price tracking */}
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-green-500 shrink-0" />
          <span className="text-sm">
            Price Tracking: <span className="font-medium">{results.price_history_initialized}</span> price point{results.price_history_initialized !== 1 ? 's' : ''} initialized
          </span>
        </div>

        {/* URL Health */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {results.urls_broken.length > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            ) : (
              <Link2 className="h-4 w-4 text-green-500 shrink-0" />
            )}
            <span className="text-sm">
              URL Health: <span className="font-medium">{results.urls_validated}</span> validated
              {results.urls_broken.length > 0 && (
                <span className="text-amber-500 font-medium">, {results.urls_broken.length} broken</span>
              )}
            </span>
          </div>

          {results.urls_broken.length > 0 && (
            <Collapsible open={urlsOpen} onOpenChange={setUrlsOpen}>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-6">
                <ChevronDown className={cn('h-3 w-3 transition-transform', urlsOpen && 'rotate-180')} />
                Show broken URLs
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-6 mt-1 space-y-0.5">
                {results.urls_broken.map((url, i) => (
                  <p key={i} className="text-xs text-muted-foreground truncate max-w-md" title={url}>{url}</p>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* TD Status */}
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-sm">TD Status: <span className="font-medium">{tdLabel}</span></span>
        </div>

        {/* Data Quality */}
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm">
            Data Quality: <span className={cn('font-bold', qualityColor)}>{results.avg_data_quality}%</span> average
          </span>
        </div>

        {/* Quality Warnings */}
        {results.quality_warnings.length > 0 && (
          <Collapsible open={warningsOpen} onOpenChange={setWarningsOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 ml-6">
              <ChevronDown className={cn('h-3 w-3 transition-transform', warningsOpen && 'rotate-180')} />
              Warnings ({results.quality_warnings.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-6 mt-1 space-y-0.5 max-h-40 overflow-auto">
              {results.quality_warnings.map((w, i) => (
                <p key={i} className="text-xs text-muted-foreground">{w}</p>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Footer: timestamp + re-run button */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          {results.completed_at && (
            <p className="text-xs text-muted-foreground">
              Completed {format(new Date(results.completed_at), 'MMM d, yyyy HH:mm')}
            </p>
          )}
          {hasErrors && jobId && brandId && (
            <Button variant="outline" size="sm" onClick={handleRerun} disabled={rerunning} className="gap-1.5">
              {rerunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Re-run Setup
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
