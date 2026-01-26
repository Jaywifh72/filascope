import { useState, useMemo } from 'react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ExternalLink, Copy, Pencil, RefreshCw, Check, AlertTriangle, Clock, Minus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { InlineEditableCell } from './InlineEditableCell';
import { EditProductModal, FilamentProduct, PrinterProduct } from './EditProductModal';
import { useUpdateFilament, useUpdatePrinter } from '@/hooks/useProductMutations';

export type ProductType = 'filament' | 'printer';

export interface ProductRow {
  id: string;
  displayName: string;
  productTitle?: string; // Original title for filaments
  modelName?: string; // Original name for printers
  material?: string | null;
  productUrl?: string | null;
  msrp?: number | null;
  currentPrice?: number | null;
  lastSyncedAt?: string | null;
  syncStatus?: string | null;
  syncError?: string | null;
  // Extended fields for edit modal
  diameter?: string | null;
  weightGrams?: number | null;
  colorName?: string | null;
  imageUrl?: string | null;
  syncEnabled?: boolean;
  adminNotes?: string | null;
  buildVolume?: string | null;
  maxPrintSpeed?: number | null;
}

interface ProductTableProps {
  products: ProductRow[];
  type: ProductType;
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
  onSync,
  syncingIds = [],
}: ProductTableProps) {
  const [sortField, setSortField] = useState<SortField>('displayName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingProduct, setEditingProduct] = useState<FilamentProduct | PrinterProduct | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const updateFilament = useUpdateFilament();
  const updatePrinter = useUpdatePrinter();

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

  const handleEditProduct = (product: ProductRow) => {
    if (type === 'filament') {
      const filamentProduct: FilamentProduct = {
        id: product.id,
        display_name: product.displayName,
        product_title: product.productTitle || product.displayName,
        product_url: product.productUrl || null,
        msrp: product.msrp || null,
        variant_price: product.currentPrice || null,
        material: product.material || null,
        diameter: product.diameter || null,
        weight_grams: product.weightGrams || null,
        color_name: product.colorName || null,
        image_url: product.imageUrl || null,
        sync_enabled: product.syncEnabled,
        admin_notes: product.adminNotes || null,
      };
      setEditingProduct(filamentProduct);
    } else {
      const printerProduct: PrinterProduct = {
        id: product.id,
        display_name: product.displayName,
        model_name: product.modelName || product.displayName,
        official_product_url: product.productUrl || null,
        msrp_usd: product.msrp || null,
        current_price_usd_store: product.currentPrice || null,
        image_url: product.imageUrl || null,
        build_volume: product.buildVolume || null,
        max_print_speed_mm_s: product.maxPrintSpeed || null,
        sync_enabled: product.syncEnabled,
        admin_notes: product.adminNotes || null,
      };
      setEditingProduct(printerProduct);
    }
    setIsEditModalOpen(true);
  };

  const handleInlineNameSave = async (id: string, value: string) => {
    if (!value.trim()) {
      throw new Error('Display name cannot be empty');
    }
    if (type === 'filament') {
      await updateFilament.mutateAsync({ id, display_name: value.trim() });
    } else {
      await updatePrinter.mutateAsync({ id, display_name: value.trim() });
    }
  };

  const handleInlineMsrpSave = async (id: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    if (numValue !== null && (isNaN(numValue) || numValue < 0)) {
      throw new Error('MSRP must be a positive number');
    }
    if (type === 'filament') {
      await updateFilament.mutateAsync({ id, msrp: numValue });
    } else {
      await updatePrinter.mutateAsync({ id, msrp_usd: numValue });
    }
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
    <>
      <div 
        className="relative w-full overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0"
        role="region"
        aria-label={`${type === 'filament' ? 'Filaments' : 'Printers'} inventory table`}
        tabIndex={0}
      >
        <Table className="min-w-[900px]">
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
              const isSaving = updateFilament.isPending || updatePrinter.isPending;

              return (
                <TableRow 
                  key={product.id}
                  className={cn(hasError && 'bg-destructive/5')}
                >
                  <TableCell className="font-medium max-w-[250px]">
                    <InlineEditableCell
                      value={product.displayName}
                      onSave={(value) => handleInlineNameSave(product.id, value)}
                      validate={(value) => !value.trim() ? 'Name cannot be empty' : null}
                      disabled={isSaving}
                    />
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <InlineEditableCell
                            value={product.msrp}
                            onSave={(value) => handleInlineMsrpSave(product.id, value)}
                            type="price"
                            formatDisplay={(v) => formatPrice(v as number | null)}
                            disabled={isSaving}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        Manufacturer's Suggested Retail Price
                      </TooltipContent>
                    </Tooltip>
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          {priceDiff !== null ? (
                            <span
                              className={cn(
                                'font-mono text-sm cursor-help',
                                priceDiff < 0 && 'text-green-600',
                                priceDiff > 0 && 'text-destructive'
                              )}
                            >
                              {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {priceDiff !== null
                          ? priceDiff < 0
                            ? `${Math.abs(priceDiff).toFixed(1)}% below MSRP`
                            : priceDiff > 0
                            ? `${priceDiff.toFixed(1)}% above MSRP`
                            : 'At MSRP'
                          : 'Price difference unavailable'}
                      </TooltipContent>
                    </Tooltip>
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
                    <div className="flex items-center justify-end gap-1" role="group" aria-label="Product actions">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditProduct(product)}
                            aria-label={`Edit ${product.displayName}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit product details</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onSync?.(product.id)}
                            disabled={isSyncing}
                            aria-label={isSyncing ? 'Syncing price...' : `Sync price for ${product.displayName}`}
                          >
                            <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isSyncing ? 'Syncing...' : 'Refresh price from source'}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <EditProductModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        product={editingProduct}
        type={type}
      />
    </>
  );
}
