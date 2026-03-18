import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAmazonPriceSync } from '@/hooks/useAmazonPriceSync';
import { AmazonSyncBrandSelector } from './AmazonSyncBrandSelector';
import { AmazonSyncSummaryCard } from './AmazonSyncSummaryCard';
import { AmazonSyncHistoryTable } from './AmazonSyncHistoryTable';

export function AmazonPriceSyncSection() {
  const {
    phase,
    summary,
    error,
    syncing,
    syncLabel,
    startSync,
    reset,
  } = useAmazonPriceSync();

  useEffect(() => {
    if (error) {
      toast({ title: 'Amazon Sync Error', description: error, variant: 'destructive' });
    }
  }, [error]);

  return (
    <div className="space-y-4">
      {/* Brand/marketplace selector — visible when not syncing */}
      {phase === 'select' && (
        <AmazonSyncBrandSelector onSyncStart={startSync} syncing={syncing} />
      )}

      {/* Syncing progress */}
      {phase === 'syncing' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Syncing Amazon Prices</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Fetching current prices for {syncLabel} via PA-API...
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  PA-API is rate-limited to 1 request/second (10 ASINs per request).
                  This may take several minutes for large batches.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {phase === 'results' && (
        <>
          {/* Reset button */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              New Sync
            </Button>
          </div>

          {/* Summary */}
          {summary && (
            <AmazonSyncSummaryCard summary={summary} label={syncLabel} />
          )}

          {/* Error state */}
          {error && !summary && (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <p className="text-red-400 font-medium">Sync failed</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Sync History — always visible */}
      <AmazonSyncHistoryTable />
    </div>
  );
}
