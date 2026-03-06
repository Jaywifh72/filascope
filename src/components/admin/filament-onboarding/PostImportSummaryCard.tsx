import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, AlertTriangle, Info, BarChart3, Package, Link2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
}

export function PostImportSummaryCard({ results }: Props) {
  const [urlsOpen, setUrlsOpen] = useState(false);
  const [warningsOpen, setWarningsOpen] = useState(false);

  const qualityColor = results.avg_data_quality >= 80
    ? 'text-green-500' : results.avg_data_quality >= 50
      ? 'text-amber-500' : 'text-red-500';

  const tdLabel = results.td_status === 'queued'
    ? 'Queued for discovery'
    : results.td_status === 'brand_has_td'
      ? 'Brand has existing TD data'
      : 'Not available for this brand';

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

        {/* Timestamp */}
        {results.completed_at && (
          <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
            Completed {format(new Date(results.completed_at), 'MMM d, yyyy HH:mm')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
