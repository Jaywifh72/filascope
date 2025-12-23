import { CheckCircle2, XCircle, AlertCircle, Package, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ElegooSyncResult {
  success: boolean;
  dryRun: boolean;
  jobId: string | null;
  summary: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    total: number;
  };
  products: {
    title: string;
    action: 'created' | 'updated' | 'skipped' | 'error';
    reason?: string;
  }[];
}

interface ElegooSyncProgressProps {
  result: ElegooSyncResult | null;
  isLoading: boolean;
  error: string | null;
}

export function ElegooSyncProgress({ result, isLoading, error }: ElegooSyncProgressProps) {
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="w-5 h-5" />
          <span className="font-medium">Sync Failed</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span className="font-medium">Syncing Elegoo catalog...</span>
        </div>
        <Progress value={undefined} className="h-2" />
        <p className="text-sm text-muted-foreground">
          Fetching products from Impact.com API...
        </p>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { summary, products, dryRun } = result;
  const successRate = summary.total > 0 
    ? Math.round(((summary.created + summary.updated) / summary.total) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="font-medium">
            {dryRun ? 'Preview Complete' : 'Sync Complete'}
          </span>
        </div>
        {dryRun && (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Dry Run
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-primary">{summary.total}</div>
          <div className="text-xs text-muted-foreground">Total Found</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-green-500">{summary.created}</div>
          <div className="text-xs text-muted-foreground">Created</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-blue-500">{summary.updated}</div>
          <div className="text-xs text-muted-foreground">Updated</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-muted-foreground">{summary.skipped}</div>
          <div className="text-xs text-muted-foreground">Skipped</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-destructive">{summary.errors}</div>
          <div className="text-xs text-muted-foreground">Errors</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Success Rate</span>
          <span>{successRate}%</span>
        </div>
        <Progress value={successRate} className="h-2" />
      </div>

      {/* Products List */}
      {products.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Products ({products.length})</h4>
          <ScrollArea className="h-[200px] rounded-lg border">
            <div className="p-2 space-y-1">
              {products.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {product.action === 'created' && (
                      <Package className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                    {product.action === 'updated' && (
                      <RefreshCw className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    )}
                    {product.action === 'skipped' && (
                      <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    {product.action === 'error' && (
                      <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    )}
                    <span className="truncate">{product.title}</span>
                  </div>
                  {product.reason && (
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {product.reason}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
