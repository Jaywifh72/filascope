import { useState, useMemo, Fragment } from 'react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ExternalLink, Copy, Pencil, RefreshCw, Check, AlertTriangle, Clock, Minus, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { InlineEditableCell } from './InlineEditableCell';
import { EditProductModal, FilamentProduct, PrinterProduct } from './EditProductModal';
import { useUpdateFilament, useUpdatePrinter } from '@/hooks/useProductMutations';
import { RegionalUrlCell } from './RegionalUrlCell';
import { RegionalPriceCell } from './RegionalPriceCell';
import { AllRegionsPriceRow } from './AllRegionsPriceRow';
import { RegionSyncSelector } from './RegionSyncSelector';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';

export type ProductType = 'filament' | 'printer';

export interface RegionalInfo {
  region: RegionCode;
  url?: string | null;
  storeName?: string | null;
  isVerified?: boolean;
  isPrimary?: boolean;
  price?: number | null;
  currency: CurrencyCode;
  msrp?: number | null;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
}

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
  // Regional data
  regionalUrls?: RegionalInfo[];
  regionalPrices?: RegionalInfo[];
  primaryRegion?: RegionCode;
  hasRegionalUrls?: boolean;
  availableRegions?: RegionCode[];
}

interface ProductTableProps {
  products: ProductRow[];
  type: ProductType;
  onSync?: (id: string, regions?: RegionCode[] | null) => void;
  syncingIds?: string[];
  // Regional props
  selectedRegion?: RegionCode;
  viewCurrency?: CurrencyCode;
  showAllRegions?: boolean;
  onEditRegionalUrl?: (productId: string, region: RegionCode) => void;
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

const DISPLAY_REGIONS: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU'];

export function ProductTable({
  products,
  type,
  onSync,
  syncingIds = [],
  selectedRegion = 'US',
  viewCurrency = 'USD',
  showAllRegions = false,
  onEditRegionalUrl,
}: ProductTableProps) {
  const [sortField, setSortField] = useState<SortField>('displayName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingProduct, setEditingProduct] = useState<FilamentProduct | PrinterProduct | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

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

  const toggleProductExpanded = (productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Helper to get regional data for a product
  const getRegionalData = (product: ProductRow, region: RegionCode): RegionalInfo | undefined => {
    // Check regionalUrls first
    const urlData = product.regionalUrls?.find((r) => r.region === region);
    const priceData = product.regionalPrices?.find((r) => r.region === region);
    
    if (urlData || priceData) {
      return {
        region,
        url: urlData?.url || null,
        storeName: urlData?.storeName,
        isVerified: urlData?.isVerified,
        isPrimary: urlData?.isPrimary,
        price: priceData?.price || null,
        currency: priceData?.currency || REGIONS[region]?.defaultCurrency || 'USD',
        msrp: priceData?.msrp,
        lastSyncAt: priceData?.lastSyncAt,
        lastSyncStatus: priceData?.lastSyncStatus,
      };
    }
    return undefined;
  };

  // Merge all regional data for a product
  const getMergedRegionalData = (product: ProductRow): RegionalInfo[] => {
    const result: RegionalInfo[] = [];
    for (const region of DISPLAY_REGIONS) {
      const data = getRegionalData(product, region);
      if (data) {
        result.push(data);
      } else {
        // Add empty entry for the region
        result.push({
          region,
          currency: REGIONS[region]?.defaultCurrency || 'USD',
        });
      }
    }
    return result;
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

  // Calculate column count for row spans
  const baseColCount = type === 'filament' ? 9 : 8;
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
        <Table className={cn('min-w-[900px]', showAllRegions && 'min-w-[1400px]')}>
          <TableHeader>
            <TableRow>
              <SortableHeader field="displayName">Display Name</SortableHeader>
              {type === 'filament' && (
                <SortableHeader field="material">Material</SortableHeader>
              )}
              
              {/* Single region mode */}
              {!showAllRegions && (
                <>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      {REGIONS[selectedRegion]?.flag} URL
                    </div>
                  </TableHead>
                  <SortableHeader field="msrp">MSRP</SortableHeader>
                  <SortableHeader field="currentPrice">
                    <div className="flex items-center gap-1">
                      {REGIONS[selectedRegion]?.flag} Price
                    </div>
                  </SortableHeader>
                  <SortableHeader field="priceDiff">Price Diff</SortableHeader>
                  <SortableHeader field="lastSyncedAt">Last Synced</SortableHeader>
                  <TableHead>Status</TableHead>
                </>
              )}
              
              {/* All regions mode */}
              {showAllRegions && (
                <>
                  {DISPLAY_REGIONS.map((region) => (
                    <TableHead key={`${region}-url`} className="text-center">
                      <div className="flex flex-col items-center">
                        <span>{REGIONS[region]?.flag}</span>
                        <span className="text-xs">{region}</span>
                      </div>
                    </TableHead>
                  ))}
                </>
              )}
              
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
              const isExpanded = expandedProducts.has(product.id);
              
              // Get regional data for current product
              const selectedRegionData = getRegionalData(product, selectedRegion);
              const allRegionalData = getMergedRegionalData(product);

              return (
                <Fragment key={product.id}>
                  <TableRow 
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
                    
                    {/* Single region mode columns */}
                    {!showAllRegions && (
                      <>
                        <TableCell>
                          <RegionalUrlCell
                            productId={product.id}
                            productType={type}
                            regionCode={selectedRegion}
                            url={selectedRegionData?.url || product.productUrl}
                            storeName={selectedRegionData?.storeName}
                            isVerified={selectedRegionData?.isVerified}
                            isPrimary={selectedRegionData?.isPrimary}
                            onEdit={onEditRegionalUrl ? () => onEditRegionalUrl(product.id, selectedRegion) : undefined}
                          />
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
                        <TableCell>
                          <RegionalPriceCell
                            productId={product.id}
                            productType={type}
                            regionCode={selectedRegion}
                            price={selectedRegionData?.price ?? product.currentPrice}
                            currency={selectedRegionData?.currency || viewCurrency}
                            msrp={selectedRegionData?.msrp ?? product.msrp}
                            lastSyncAt={selectedRegionData?.lastSyncAt || product.lastSyncedAt}
                            lastSyncStatus={selectedRegionData?.lastSyncStatus || product.syncStatus}
                            viewCurrency={viewCurrency}
                          />
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
                      </>
                    )}
                    
                    {/* All regions mode columns */}
                    {showAllRegions && (
                      <>
                        {allRegionalData.map((regionData) => (
                          <TableCell key={regionData.region} className="text-center p-2">
                            <div className="flex flex-col items-center gap-1">
                              <RegionalUrlCell
                                productId={product.id}
                                productType={type}
                                regionCode={regionData.region}
                                url={regionData.url}
                                storeName={regionData.storeName}
                                isVerified={regionData.isVerified}
                                onEdit={onEditRegionalUrl ? () => onEditRegionalUrl(product.id, regionData.region) : undefined}
                                compact
                              />
                              <RegionalPriceCell
                                productId={product.id}
                                productType={type}
                                regionCode={regionData.region}
                                price={regionData.price}
                                currency={regionData.currency}
                                lastSyncAt={regionData.lastSyncAt}
                                lastSyncStatus={regionData.lastSyncStatus}
                                compact
                              />
                            </div>
                          </TableCell>
                        ))}
                      </>
                    )}
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" role="group" aria-label="Product actions">
                        {/* Expand button for regional details */}
                        {!showAllRegions && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleProductExpanded(product.id)}
                                aria-label={isExpanded ? 'Hide regional details' : 'Show regional details'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isExpanded ? 'Hide regional details' : 'Show all regions'}
                            </TooltipContent>
                          </Tooltip>
                        )}
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
                        {/* Row Sync with Region Selector */}
                        <RegionSyncSelector
                          availableRegions={product.availableRegions}
                          onSync={(regions) => onSync?.(product.id, regions)}
                          isLoading={isSyncing}
                          lastSyncByRegion={product.regionalPrices?.reduce((acc, rp) => {
                            if (rp.lastSyncAt) {
                              acc.set(rp.region, new Date(rp.lastSyncAt));
                            }
                            return acc;
                          }, new Map<RegionCode, Date>())}
                          priceByRegion={product.regionalPrices?.reduce((acc, rp) => {
                            if (rp.price != null) {
                              acc.set(rp.region, rp.price);
                            }
                            return acc;
                          }, new Map<RegionCode, number | null>())}
                          currencyByRegion={product.regionalPrices?.reduce((acc, rp) => {
                            acc.set(rp.region, rp.currency);
                            return acc;
                          }, new Map<RegionCode, string>())}
                          variant="ghost"
                          size="icon"
                          showLabel={false}
                          disabled={isSyncing}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expandable regional row */}
                  {!showAllRegions && isExpanded && (
                    <TableRow className="bg-muted/30 hover:bg-muted/40">
                      <TableCell colSpan={baseColCount} className="p-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                          {DISPLAY_REGIONS.map((regionCode) => {
                            const regionData = allRegionalData.find((r) => r.region === regionCode);
                            const region = REGIONS[regionCode];
                            
                            return (
                              <div
                                key={regionCode}
                                className={cn(
                                  'border rounded-lg p-2 bg-background',
                                  !regionData?.url && 'border-dashed opacity-60'
                                )}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">
                                    {region?.flag} {regionCode}
                                  </span>
                                  {regionData?.url && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => onSync?.(product.id, [regionCode])}
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">URL</div>
                                  <RegionalUrlCell
                                    productId={product.id}
                                    productType={type}
                                    regionCode={regionCode}
                                    url={regionData?.url}
                                    storeName={regionData?.storeName}
                                    isVerified={regionData?.isVerified}
                                    onEdit={onEditRegionalUrl ? () => onEditRegionalUrl(product.id, regionCode) : undefined}
                                    compact
                                  />
                                </div>
                                <div className="space-y-1 mt-2">
                                  <div className="text-xs text-muted-foreground">Price</div>
                                  <RegionalPriceCell
                                    productId={product.id}
                                    productType={type}
                                    regionCode={regionCode}
                                    price={regionData?.price}
                                    currency={regionData?.currency || region?.defaultCurrency || 'USD'}
                                    lastSyncAt={regionData?.lastSyncAt}
                                    lastSyncStatus={regionData?.lastSyncStatus}
                                    compact
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
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
