import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronDown, 
  Palette, 
  FileText, 
  Globe,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useEnrichmentHistory, EnrichmentHistoryEntry } from '@/hooks/useEnrichmentHistory';
import { formatDistanceToNow, format } from 'date-fns';

const SYNC_TYPE_ICONS: Record<string, React.ReactNode> = {
  'color_extraction': <Palette className="w-4 h-4" />,
  'tds_discovery': <FileText className="w-4 h-4" />,
  'regional_prices': <Globe className="w-4 h-4" />,
  'full_sync': <RefreshCw className="w-4 h-4" />,
  'products_sync': <RefreshCw className="w-4 h-4" />,
};

const SYNC_TYPE_LABELS: Record<string, string> = {
  'color_extraction': 'Color Extraction',
  'tds_discovery': 'TDS Discovery',
  'regional_prices': 'Regional Prices',
  'full_sync': 'Full Sync',
  'products_sync': 'Products Sync',
};

function HistoryEntryCard({ entry }: { entry: EnrichmentHistoryEntry }) {
  const [isOpen, setIsOpen] = useState(false);

  const statusIcon = entry.status === 'completed' ? (
    <CheckCircle2 className="w-4 h-4 text-green-500" />
  ) : entry.status === 'failed' ? (
    <XCircle className="w-4 h-4 text-destructive" />
  ) : (
    <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
  );

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds.toFixed(0)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  const totalProducts = (entry.productsCreated || 0) + (entry.productsUpdated || 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg p-3 bg-card hover:bg-accent/5 transition-colors">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted">
                {SYNC_TYPE_ICONS[entry.syncType] || <RefreshCw className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{entry.brandName}</span>
                  <Badge variant="outline" className="text-xs">
                    {SYNC_TYPE_LABELS[entry.syncType] || entry.syncType}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.startedAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <div className="flex items-center gap-1">
                  {statusIcon}
                  <span className={entry.status === 'completed' ? 'text-green-600' : entry.status === 'failed' ? 'text-destructive' : 'text-yellow-600'}>
                    {entry.status === 'completed' ? 'Completed' : entry.status === 'failed' ? 'Failed' : 'Running'}
                  </span>
                </div>
                {totalProducts > 0 && (
                  <p className="text-xs text-muted-foreground">{totalProducts} products</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{formatDuration(entry.durationSeconds)}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-3 pt-3 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Started</p>
              <p>{format(new Date(entry.startedAt), 'MMM d, yyyy h:mm a')}</p>
            </div>
            {entry.completedAt && (
              <div>
                <p className="text-muted-foreground text-xs">Completed</p>
                <p>{format(new Date(entry.completedAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-xs">Products Created</p>
              <p>{entry.productsCreated || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Products Updated</p>
              <p>{entry.productsUpdated || 0}</p>
            </div>
            {entry.priceChanges !== null && entry.priceChanges > 0 && (
              <div>
                <p className="text-muted-foreground text-xs">Price Changes</p>
                <p>{entry.priceChanges}</p>
              </div>
            )}
            {entry.productsFailed !== null && entry.productsFailed > 0 && (
              <div>
                <p className="text-muted-foreground text-xs">Failed</p>
                <p className="text-destructive">{entry.productsFailed}</p>
              </div>
            )}
            {entry.triggeredBy && (
              <div>
                <p className="text-muted-foreground text-xs">Triggered By</p>
                <p className="capitalize">{entry.triggeredBy}</p>
              </div>
            )}
          </div>
          
          {entry.errorDetails && Object.keys(entry.errorDetails).length > 0 && (
            <div className="mt-3 p-2 bg-destructive/10 rounded text-sm">
              <p className="text-destructive font-medium">Error Details:</p>
              <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                {JSON.stringify(entry.errorDetails, null, 2)}
              </pre>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function EnrichmentHistory() {
  const { entries, summary, isLoading, isFetching, refresh } = useEnrichmentHistory(50);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredEntries = filterType === 'all' 
    ? entries 
    : entries.filter(e => e.syncType === filterType);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <CardTitle>Enrichment History</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="color_extraction">Color Extraction</SelectItem>
                <SelectItem value="tds_discovery">TDS Discovery</SelectItem>
                <SelectItem value="regional_prices">Regional Prices</SelectItem>
                <SelectItem value="full_sync">Full Sync</SelectItem>
                <SelectItem value="products_sync">Products Sync</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <CardDescription>
          Recent enrichment operations • {summary.operationsToday} today • {summary.successRate.toFixed(0)}% success rate
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No enrichment operations found</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredEntries.map(entry => (
              <HistoryEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
