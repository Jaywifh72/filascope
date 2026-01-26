import { useState, useMemo } from 'react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ExternalLink, Copy, Pencil, RefreshCw, Check, AlertTriangle, Clock, Minus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

export type ProductType = 'filament' | 'printer';

export interface ProductRow {
  id: string;
  displayName: string;
  material?: string | null; // Only for filaments
  productUrl?: string | null;
  msrp?: number | null;
  currentPrice?: number | null;
  lastSyncedAt?: string | null;
  syncStatus?: string | null;
  syncError?: string | null;
}

interface ProductTableProps {
  products: ProductRow[];
  type: ProductType;
  onEdit?: (id: string) => void;
  onSync?: (id: string) => void;
  syncingIds?: string[];
}

type SortField = 'displayName' | 'material' | 'msrp' | 'currentPrice' | 'priceDiff' | 'lastSyncedAt';
type SortDirection = 'asc' | 'desc';

function getPriceDiff(msrp: number | null | undefined, currentPrice: number | null | undefined): number | null {
  if (!msrp || !currentPrice || msrp === 0) return null;
  return ((currentPrice - msrp) / msrp) * 100;
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—';
  return `$${price.toFixed(2)}`;
}

function isStalePrice(lastSyncedAt: string | null | undefined): boolean {
  if (!lastSyncedAt) return true;
  return differenceInDays(new Date(), new Date(lastSyncedAt)) > 7;
}

function getSyncStatusIcon(status: string | null | undefined, error: string | null | undefined) {
  if (!status) {
    return { icon: Minus, color: 'text-muted-foreground', label: 'Never synced' };
  }
  switch (status.toLowerCase()) {
    case 'success':
    case 'synced':
      return { icon: Check, color: 'text-green-500', label: 'Success' };
    case 'failed':
    case 'error':
      return { icon: AlertTriangle, color: 'text-destructive', label: error || 'Failed' };
    case 'pending':
    case 'running':
      return { icon: Clock, color: 'text-amber-500', label: 'Pending' };
    default:
      return { icon: Minus, color: 'text-muted-foreground', label: status };
  }
}

export function ProductTable({
  products,
  type,
  onEdit,
  onSync,
  syncingIds = [],
}: ProductTableProps) {
  const [sortField, setSortField] = useState<SortField>('displayName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortField) {
        case 'displayName':
          aVal = a.displayName.toLowerCase();
          bVal = b.displayName.toLowerCase();
          break;
        case 'material':
          aVal = (a.material || '').toLowerCase();
          bVal = (b.material || '').toLowerCase();
          break;
        case 'msrp':
          aVal = a.msrp ?? -Infinity;
          bVal = b.msrp ?? -Infinity;
          break;
        case 'currentPrice':
          aVal = a.currentPrice ?? -Infinity;
          bVal = b.currentPrice ?? -Infinity;
          break;
        case 'priceDiff':
          aVal = getPriceDiff(a.msrp, a.currentPrice) ?? -Infinity;
          bVal = getPriceDiff(b.msrp, b.currentPrice) ?? -Infinity;
          break;
        case 'lastSyncedAt':
          aVal = a.lastSyncedAt ? new Date(a.lastSyncedAt).getTime() : 0;
          bVal = b.lastSyncedAt ? new Date(b.lastSyncedAt).getTime() : 0;
          break;
      }

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [products, sortField, sortDirection]);

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {children}
        <SortIcon field={field} />
      </div>
    </TableHead>
  );

  if (products.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No products found
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="displayName">Display Name</SortableHeader>
            {type === 'filament' && (
              <SortableHeader field="material">Material</SortableHeader>
            )}
            <TableHead>Product URL</TableHead>
            <SortableHeader field="msrp">MSRP</SortableHeader>
            <SortableHeader field="currentPrice">Current Price</SortableHeader>
            <SortableHeader field="priceDiff">Price Diff</SortableHeader>
            <SortableHeader field="lastSyncedAt">Last Synced</SortableHeader>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProducts.map((product) => {
            const priceDiff = getPriceDiff(product.msrp, product.currentPrice);
            const stalePrice = isStalePrice(product.lastSyncedAt);
            const statusInfo = getSyncStatusIcon(product.syncStatus, product.syncError);
            const StatusIcon = statusInfo.icon;
            const hasError = product.syncStatus === 'failed' || product.syncStatus === 'error';
            const isSyncing = syncingIds.includes(product.id);

            return (
              <TableRow 
                key={product.id}
                className={cn(hasError && 'bg-destructive/5')}
              >
                <TableCell className="font-medium max-w-[250px] truncate">
                  {product.displayName}
                </TableCell>
                {type === 'filament' && (
                  <TableCell className="text-muted-foreground">
                    {product.material || '—'}
                  </TableCell>
                )}
                <TableCell>
                  {product.productUrl ? (
                    <div className="flex items-center gap-1">
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 max-w-[150px] truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {new URL(product.productUrl).hostname.replace('www.', '')}
                        </span>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyUrl(product.productUrl!)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatPrice(product.msrp)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-1">
                    {formatPrice(product.currentPrice)}
                    {stalePrice && product.currentPrice != null && (
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>Price is stale (&gt;7 days old)</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {priceDiff !== null ? (
                    <span
                      className={cn(
                        'font-mono text-sm',
                        priceDiff < 0 && 'text-green-600',
                        priceDiff > 0 && 'text-destructive'
                      )}
                    >
                      {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {product.lastSyncedAt ? (
                    <Tooltip>
                      <TooltipTrigger>
                        {formatDistanceToNow(new Date(product.lastSyncedAt), { addSuffix: true })}
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(new Date(product.lastSyncedAt), 'PPpp')}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger>
                      <StatusIcon className={cn('w-4 h-4', statusInfo.color)} />
                    </TooltipTrigger>
                    <TooltipContent>{statusInfo.label}</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit?.(product.id)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onSync?.(product.id)}
                      disabled={isSyncing}
                    >
                      <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
