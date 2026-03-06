import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Props {
  jobId: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  itemIds: string[];
  onComplete: () => void;
  onCancel: () => void;
}

interface ImportResult {
  success: boolean;
  imported: number;
  updated_prices: number;
  errors: number;
  post_import: {
    price_history_points: number;
    urls_validated: number;
    urls_broken: string[];
    avg_data_quality: number;
  };
}

export function ImportProgressCard({ jobId, brandId, brandName, brandSlug, itemIds, onComplete, onCancel }: Props) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('import-synced-filaments', {
        body: {
          job_id: jobId,
          item_ids: itemIds,
          brand_id: brandId,
          brand_name: brandName,
          brand_slug: brandSlug,
        },
      });

      if (fnError) throw fnError;
      setResult(data as ImportResult);
      toast({
        title: `Imported ${data.imported} filaments`,
        description: `${data.post_import?.price_history_points ?? 0} price history points created`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setError(msg);
      toast({ title: 'Import Failed', description: msg, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  // Auto-start import on mount
  useEffect(() => {
    handleImport();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-lg">
          {result ? 'Import Complete' : importing ? 'Importing...' : 'Import'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {importing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Importing {itemIds.length} filaments and running post-import setup...
              </span>
            </div>
            <Progress value={50} className="h-2" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/5 p-3">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">
                {result.imported} filament{result.imported !== 1 ? 's' : ''} imported
              </span>
              {result.updated_prices > 0 && (
                <Badge variant="secondary" className="text-xs">{result.updated_prices} prices updated</Badge>
              )}
              {result.errors > 0 && (
                <Badge variant="destructive" className="text-xs">{result.errors} failed</Badge>
              )}
            </div>

            {result.post_import && (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    {result.post_import.price_history_points} price history points created
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {result.post_import.urls_broken.length > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm">
                    {result.post_import.urls_validated} URLs validated
                    {result.post_import.urls_broken.length > 0 && (
                      <span className="text-amber-500 font-medium"> — {result.post_import.urls_broken.length} broken</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    Avg data quality: <span className="font-medium">{result.post_import.avg_data_quality}%</span>
                  </span>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2 border-t border-border/50">
              {brandSlug && (
                <a href={`/brands/${brandSlug}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  View Brand Page <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Button size="sm" onClick={onComplete}>Done</Button>
            </div>
          </div>
        )}

        {!importing && !result && !error && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleImport}>Start Import</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
