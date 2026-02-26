import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Play, ExternalLink, Loader2 } from 'lucide-react';
import type { StoreRow, TestResult, SyncResult, ProductGroup } from '../types';
import { formatCurrency } from '../constants';
import { getLinkStatusBadge, getTestResultBadge, getSyncMethodBadge, PriceChangeIndicator, SyncChangeIndicator } from './helpers';
import { formatDistanceToNow } from 'date-fns';

interface PricingStoreRowProps {
  store: StoreRow;
  group: ProductGroup;
  testResult: TestResult | undefined;
  syncResult: SyncResult | undefined;
  isSelected: boolean;
  onToggleSelect: () => void;
  isBusy: boolean;
  isLast: boolean;
  onTestUrl: (storeKey: string, url: string, showToast?: boolean, region?: string) => Promise<TestResult>;
  onSyncPrice: (store: StoreRow, showToast?: boolean) => Promise<SyncResult>;
}

export function PricingStoreRow({
  store, group, testResult, syncResult, isSelected, onToggleSelect,
  isBusy, isLast, onTestUrl, onSyncPrice,
}: PricingStoreRowProps) {
  const displayPrice = syncResult?.status === 'success' || syncResult?.status === 'unchanged'
    ? syncResult.newPrice ?? store.price
    : store.price;

  return (
    <TableRow
      className={`${isLast ? '' : 'border-b-0'} hover:bg-muted/20 transition-colors duration-500 ${
        syncResult?.status === 'success' ? 'bg-emerald-500/10' :
        syncResult?.status === 'failed' ? 'bg-red-500/10' :
        syncResult?.status === 'unchanged' ? 'bg-yellow-500/5' : ''
      }`}
    >
      <TableCell className="w-8 px-2">
        <span className="text-muted-foreground/40 text-xs pl-1">└</span>
      </TableCell>
      <TableCell className="w-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`Select ${store.storeName}`}
        />
      </TableCell>
      <TableCell className="min-w-[220px]">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs flex items-center gap-1.5 cursor-default">
              <span>{store.regionFlag}</span>
              <span className="font-medium">{group.brand} {store.region}</span>
              {store.isDerived && (
                <span className="text-[9px] text-muted-foreground italic" title="URL derived from US store">🔗</span>
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {store.productUrl ? (() => { try { return new URL(store.productUrl).hostname; } catch { return store.productUrl; } })() : 'No URL'}
            {store.isDerived && <p className="text-[10px] text-muted-foreground mt-0.5">Derived from US URL — not stored in database</p>}
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell></TableCell>
      <TableCell className="text-right font-mono text-xs">
        <span className={`flex items-center justify-end gap-1 ${
          syncResult?.status === 'success' && syncResult.percentChange
            ? syncResult.percentChange > 0 ? 'text-red-400' : 'text-emerald-400'
            : ''
        }`}>
          {formatCurrency(displayPrice, store.currencySymbol)}
          {syncResult?.source && (syncResult.status === 'success' || syncResult.status === 'unchanged') && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 leading-tight ${
                  syncResult.source === 'firecrawl' ? 'border-purple-400 text-purple-400' 
                  : syncResult.source === 'html' ? 'border-green-400 text-green-400' 
                  : syncResult.source === 'bambulab-jsonld' ? 'border-amber-400 text-amber-400'
                  : 'border-emerald-400 text-emerald-400'
                }`}>
                  {syncResult.source === 'firecrawl' ? '🔥' : syncResult.source === 'html' ? '🌐' : syncResult.source === 'bambulab-jsonld' ? '🏭' : '🛒'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {syncResult.source === 'firecrawl' ? 'Firecrawl' : syncResult.source === 'html' ? 'Direct Fetch' : syncResult.source === 'bambulab-jsonld' ? 'Bambu Lab JSON-LD' : 'Shopify JSON'}
                {syncResult.location ? ` · ${syncResult.location}` : ''}
              </TooltipContent>
            </Tooltip>
          )}
          {syncResult?.currencyMismatch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight border-yellow-400 text-yellow-400">⚠️</Badge>
              </TooltipTrigger>
              <TooltipContent>Currency mismatch: got {syncResult.detectedCurrency}, expected {syncResult.requestedCurrency}</TooltipContent>
            </Tooltip>
          )}
        </span>
      </TableCell>
      <TableCell className="text-right font-mono text-xs">
        {store.compareAtPrice != null && store.compareAtPrice > (displayPrice ?? 0)
          ? <span className="text-muted-foreground line-through">{formatCurrency(store.compareAtPrice, store.currencySymbol)}</span>
          : '—'}
      </TableCell>
      <TableCell>
        {syncResult ? (
          <SyncChangeIndicator syncResult={syncResult} currencySymbol={store.currencySymbol} currency={store.currency} />
        ) : (
          <PriceChangeIndicator change={store.priceChange} />
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{store.currency}</TableCell>
      <TableCell>
        {syncResult?.status === 'success' || syncResult?.status === 'unchanged'
          ? <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">🟢 Active</Badge>
          : syncResult?.status === 'failed'
          ? <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">🔴 Failed</Badge>
          : syncResult?.status === 'unavailable'
          ? <Badge className="bg-muted/60 text-muted-foreground border-muted text-[10px]">⊘ N/A</Badge>
          : getLinkStatusBadge(store.linkStatus)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 flex-wrap">
          {testResult ? getTestResultBadge(testResult) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">⚪ Not Tested</Badge>
          )}
          {(syncResult?.status === 'success' || syncResult?.status === 'unchanged') && syncResult?.source && (
            getSyncMethodBadge(syncResult.source)
          )}
          {syncResult?.status === 'unavailable' && (
            <Badge className="bg-muted/60 text-muted-foreground border-muted text-[10px]">⊘ Unavailable</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
        {syncResult?.status === 'success' || syncResult?.status === 'unchanged'
          ? 'just now'
          : store.lastScrapedAt
            ? formatDistanceToNow(new Date(store.lastScrapedAt), { addSuffix: true })
            : '—'}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {store.productUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon" variant="ghost" className="h-7 w-7"
                  disabled={syncResult?.status === 'syncing' || store.linkStatus === 'broken' || isBusy}
                  onClick={() => onSyncPrice(store)}
                >
                  {syncResult?.status === 'syncing'
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className={`w-3.5 h-3.5 ${syncResult?.status === 'success' ? 'text-emerald-400' : syncResult?.status === 'failed' ? 'text-red-400' : ''}`} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {store.linkStatus === 'broken' ? 'Cannot sync — broken link' : `Sync price (updates ${store.allProductIds.length} variants)`}
              </TooltipContent>
            </Tooltip>
          )}
          {store.productUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon" variant="ghost" className="h-7 w-7"
                  disabled={testResult?.status === 'testing' || isBusy}
                  onClick={() => onTestUrl(store.storeKey, store.productUrl!, true, store.region)}
                >
                  {testResult?.status === 'testing'
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Play className="w-3.5 h-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Test link</TooltipContent>
            </Tooltip>
          )}
          {store.productUrl ? (
            <a href={store.productUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
