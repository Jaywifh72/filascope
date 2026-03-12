import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Search, GitCompare, CheckCircle2 } from 'lucide-react';
import type { SyncJob } from '@/hooks/useCatalogSync';

interface Props {
  brandName: string;
  scanJob: SyncJob | null;
}

function getStage(job: SyncJob | null): { label: string; detail: string; progress: number; icon: React.ReactNode } {
  if (!job || job.status === 'syncing') {
    // Job is in progress — show estimated progress
    if (job?.filament_products_found != null && job.filament_products_found > 0) {
      return {
        label: 'Extracting filaments',
        detail: `Found ${job.filament_products_found} filament products...`,
        progress: 60,
        icon: <GitCompare className="w-4 h-4 text-blue-500" />,
      };
    }
    if (job?.total_store_products != null && job.total_store_products > 0) {
      return {
        label: 'Classifying products',
        detail: `${job.total_store_products} products fetched, classifying...`,
        progress: 40,
        icon: <Search className="w-4 h-4 text-blue-500" />,
      };
    }
    return {
      label: 'Discovering products',
      detail: 'Fetching product catalog from store...',
      progress: 15,
      icon: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
    };
  }

  if (job.status === 'completed') {
    return {
      label: 'Scan complete',
      detail: `${job.filament_products_found ?? 0} products → ${(job.new_count ?? 0) + (job.changed_count ?? 0) + (job.matched_count ?? 0)} filaments`,
      progress: 100,
      icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    };
  }

  return {
    label: 'Processing',
    detail: 'Working...',
    progress: 50,
    icon: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
  };
}

export function ScanProgressCard({ brandName, scanJob }: Props) {
  const stage = getStage(scanJob);

  return (
    <TooltipProvider>
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            {stage.icon}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{stage.label}</span>
                <span className="text-xs text-muted-foreground">{stage.progress}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{stage.detail}</p>
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Progress value={stage.progress} className="h-2" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">
                Products are fetched one at a time with delays to respect store rate limits.
                This typically takes 15-60 seconds depending on the catalog size.
              </p>
            </TooltipContent>
          </Tooltip>

          <p className="text-xs text-muted-foreground">
            Scanning <span className="font-medium text-foreground">{brandName}</span> store...
          </p>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
