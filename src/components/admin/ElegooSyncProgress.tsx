import { CheckCircle2, XCircle, AlertCircle, Package, RefreshCw, Check, X, TrendingDown, Globe, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProductFields {
  tds: boolean;
  image: boolean;
  price: boolean;
  salePrice: boolean;
  url: boolean;
  msrp: boolean;
}

interface SyncProgress {
  currentRegion: string;
  completedRegions: string[];
  totalRegions: number;
}

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
    filtered?: number;
  };
  products: {
    title: string;
    action: 'created' | 'updated' | 'skipped' | 'error';
    reason?: string;
    fields?: ProductFields;
    currentPrice?: number;
    msrp?: number;
  }[];
  regionsSynced?: string[];
}

interface ElegooSyncProgressProps {
  result: ElegooSyncResult | null;
  isLoading: boolean;
  error: string | null;
  progress?: SyncProgress | null;
}

// Region display labels
const REGION_LABELS: Record<string, string> = {
  'US': '🇺🇸 United States',
  'AU': '🇦🇺 Australia',
  'CA': '🇨🇦 Canada',
  'EU': '🇪🇺 Europe',
  'UK': '🇬🇧 United Kingdom',
  'JP': '🇯🇵 Japan',
};

function FieldIndicator({ available }: { available: boolean }) {
  return available ? (
    <Check className="w-4 h-4 text-green-500" />
  ) : (
    <X className="w-4 h-4 text-destructive" />
  );
}

function PriceDisplay({ currentPrice, msrp }: { currentPrice?: number; msrp?: number }) {
  const price = typeof currentPrice === 'number' ? currentPrice : Number(currentPrice);
  const msrpNum = typeof msrp === 'number' ? msrp : Number(msrp);
  
  if (!currentPrice || isNaN(price)) {
    return <span className="text-muted-foreground">-</span>;
  }

  const isOnSale = msrp && !isNaN(msrpNum) && price < msrpNum;
  const discount = msrp && !isNaN(msrpNum) ? Math.round((1 - price / msrpNum) * 100) : 0;

  return (
    <div className="flex items-center gap-1">
      <span className={isOnSale ? 'text-green-600 font-semibold' : ''}>
        ${price.toFixed(2)}
      </span>
      {isOnSale && (
        <TrendingDown className="w-3 h-3 text-green-600" />
      )}
      {isOnSale && discount > 0 && (
        <span className="text-xs text-green-600">-{discount}%</span>
      )}
    </div>
  );
}

function MsrpDisplay({ currentPrice, msrp }: { currentPrice?: number; msrp?: number }) {
  const price = typeof currentPrice === 'number' ? currentPrice : Number(currentPrice);
  const msrpNum = typeof msrp === 'number' ? msrp : Number(msrp);
  
  if (!msrp || isNaN(msrpNum)) {
    return <span className="text-muted-foreground">-</span>;
  }

  const isOnSale = currentPrice && !isNaN(price) && price < msrpNum;

  return (
    <span className={isOnSale ? 'line-through text-muted-foreground' : ''}>
      ${msrpNum.toFixed(2)}
    </span>
  );
}

function ActionBadge({ action }: { action: 'created' | 'updated' | 'skipped' | 'error' }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    created: { variant: 'default', label: 'Created' },
    updated: { variant: 'secondary', label: 'Updated' },
    skipped: { variant: 'outline', label: 'Skipped' },
    error: { variant: 'destructive', label: 'Error' },
  };
  
  const { variant, label } = variants[action];
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}

function RegionProgressBar({ progress }: { progress: SyncProgress }) {
  const { currentRegion, completedRegions, totalRegions } = progress;
  const completedCount = completedRegions.length;
  const progressPercent = totalRegions > 0 ? Math.round((completedCount / totalRegions) * 100) : 0;
  
  // All regions in order
  const allRegions = ['US', 'AU', 'CA', 'EU', 'UK'];
  
  return (
    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="font-medium">Syncing Elegoo Catalogs</span>
        </div>
        <Badge variant="outline">
          {completedCount} / {totalRegions} regions
        </Badge>
      </div>
      
      {/* Overall Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Overall Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
      
      {/* Region Steps */}
      <div className="flex flex-wrap gap-2">
        {allRegions.slice(0, totalRegions).map((region) => {
          const isCompleted = completedRegions.includes(region);
          const isCurrent = currentRegion === region;
          
          return (
            <div
              key={region}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all
                ${isCompleted 
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
                  : isCurrent 
                    ? 'bg-primary/20 text-primary animate-pulse' 
                    : 'bg-muted text-muted-foreground'
                }
              `}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
              <span>{region}</span>
            </div>
          );
        })}
      </div>
      
      {/* Current Region Status */}
      <div className="text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Syncing {REGION_LABELS[currentRegion] || currentRegion}...
        </span>
      </div>
    </div>
  );
}

export function ElegooSyncProgress({ result, isLoading, error, progress }: ElegooSyncProgressProps) {
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

  // Show region progress if multi-region sync is in progress
  if (isLoading && progress) {
    return <RegionProgressBar progress={progress} />;
  }

  // Show simple loading for single region
  if (isLoading) {
    return (
      <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
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

  const { summary, products, dryRun, regionsSynced } = result;
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
        <div className="flex items-center gap-2">
          {regionsSynced && regionsSynced.length > 0 && (
            <div className="flex gap-1">
              {regionsSynced.map(region => (
                <Badge key={region} variant="secondary" className="text-xs">
                  {region}
                </Badge>
              ))}
            </div>
          )}
          {dryRun && (
            <Badge variant="outline" className="text-amber-500 border-amber-500">
              Dry Run
            </Badge>
          )}
        </div>
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

      {/* Products Table */}
      {products.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Products ({products.length})</h4>
          <ScrollArea className="h-[300px] rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Product</TableHead>
                  <TableHead className="w-[70px]">Action</TableHead>
                  <TableHead className="w-[40px] text-center">TDS</TableHead>
                  <TableHead className="w-[40px] text-center">Img</TableHead>
                  <TableHead className="w-[40px] text-center">URL</TableHead>
                  <TableHead className="w-[100px]">Price</TableHead>
                  <TableHead className="w-[70px]">MSRP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => {
                  const fields = product.fields || {
                    tds: false,
                    image: false,
                    price: false,
                    salePrice: false,
                    url: false,
                    msrp: false,
                  };
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
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
                          <span className="truncate max-w-[200px]" title={product.title}>
                            {product.title}
                          </span>
                        </div>
                        {product.reason && (
                          <span className="text-xs text-muted-foreground block mt-1">
                            {product.reason}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ActionBadge action={product.action} />
                      </TableCell>
                      <TableCell className="text-center">
                        <FieldIndicator available={fields.tds} />
                      </TableCell>
                      <TableCell className="text-center">
                        <FieldIndicator available={fields.image} />
                      </TableCell>
                      <TableCell className="text-center">
                        <FieldIndicator available={fields.url} />
                      </TableCell>
                      <TableCell>
                        <PriceDisplay currentPrice={product.currentPrice} msrp={product.msrp} />
                      </TableCell>
                      <TableCell>
                        <MsrpDisplay currentPrice={product.currentPrice} msrp={product.msrp} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
