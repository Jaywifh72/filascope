import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, XCircle, SkipForward,
  Globe, Filter, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { PriceSyncPrinterResult, PriceSyncRegionResult } from '@/hooks/usePrinterPriceSync';

interface Props {
  results: PriceSyncPrinterResult[];
}

type FilterMode = 'all' | 'changed' | 'errors' | 'anomalies';

const REGION_ORDER = ['US', 'CA', 'EU', 'UK', 'AU', 'JP'];

const REGION_FLAGS: Record<string, string> = {
  US: '🇺🇸', CA: '🇨🇦', EU: '🇪🇺', UK: '🇬🇧', AU: '🇦🇺', JP: '🇯🇵',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', CAD: 'C$', GBP: '£', EUR: '€', AUD: 'A$', JPY: '¥',
};

function formatPrice(price: number | null, currency: string): string {
  if (price == null) return '—';
  const sym = CURRENCY_SYMBOLS[currency] || '';
  if (currency === 'JPY') return `${sym}${Math.round(price).toLocaleString()}`;
  return `${sym}${price.toFixed(2)}`;
}

function formatChangePct(pct: number | null): string {
  if (pct == null) return '';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

/** Flatten results into per-printer, per-region rows */
interface FlatRow {
  modelName: string;
  brandSlug: string;
  regionCode: string;
  region: PriceSyncRegionResult;
  skipped: boolean;
  skipReason: string | null;
  printerError: string | null;
}

function flattenResults(results: PriceSyncPrinterResult[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const r of results) {
    if (r.skipped || r.error) {
      rows.push({
        modelName: r.modelName,
        brandSlug: r.brandSlug,
        regionCode: '—',
        region: {
          oldPrice: null, newPrice: null, msrp: null, changePct: null,
          currency: 'USD', status: r.skipped ? 'skipped' : 'error',
          extractionMethod: null, confidence: null, isAnomaly: false,
          anomalyReason: null, error: r.error || r.skipReason || null,
        },
        skipped: r.skipped,
        skipReason: r.skipReason,
        printerError: r.error,
      });
      continue;
    }

    const regionCodes = REGION_ORDER.filter(rc => rc in r.regions);
    for (const rc of regionCodes) {
      rows.push({
        modelName: r.modelName,
        brandSlug: r.brandSlug,
        regionCode: rc,
        region: r.regions[rc],
        skipped: false,
        skipReason: null,
        printerError: null,
      });
    }
  }
  return rows;
}

export function PriceSyncResultsTable({ results }: Props) {
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sortByChange, setSortByChange] = useState(false);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

  const allRows = useMemo(() => flattenResults(results), [results]);

  const filteredRows = useMemo(() => {
    let rows = allRows;
    if (filter === 'changed') {
      rows = rows.filter(r => r.region.status === 'updated' || r.region.status === 'new');
    } else if (filter === 'errors') {
      rows = rows.filter(r => r.region.status === 'error' || r.region.status === 'anomaly_rejected' || r.printerError);
    } else if (filter === 'anomalies') {
      rows = rows.filter(r => r.region.isAnomaly || r.region.status === 'anomaly_rejected' || r.region.status === 'anomaly_cleared');
    }
    if (sortByChange) {
      rows = [...rows].sort((a, b) => {
        const aAbs = Math.abs(a.region.changePct ?? 0);
        const bAbs = Math.abs(b.region.changePct ?? 0);
        return bAbs - aAbs;
      });
    }
    return rows;
  }, [allRows, filter, sortByChange]);

  // Count badges
  const counts = useMemo(() => {
    const changed = allRows.filter(r => r.region.status === 'updated' || r.region.status === 'new').length;
    const errors = allRows.filter(r => r.region.status === 'error' || r.region.status === 'anomaly_rejected' || r.printerError).length;
    const anomalies = allRows.filter(r => r.region.isAnomaly || r.region.status === 'anomaly_rejected' || r.region.status === 'anomaly_cleared').length;
    return { changed, errors, anomalies };
  }, [allRows]);

  // Group by brand for collapsible display
  const brands = useMemo(() => {
    const map = new Map<string, FlatRow[]>();
    for (const row of filteredRows) {
      const key = row.brandSlug || '—';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredRows]);

  const toggleBrand = (slug: string) => {
    setExpandedBrands(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  // Auto-expand all brands on initial render
  const allExpanded = brands.length <= 5;

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <ToggleGroup type="single" value={filter} onValueChange={v => { if (v) setFilter(v as FilterMode); }}>
            <ToggleGroupItem value="all" className="gap-1.5 text-xs px-3">
              All <Badge variant="secondary" className="ml-1 text-[10px]">{allRows.length}</Badge>
            </ToggleGroupItem>
            <ToggleGroupItem value="changed" className="gap-1.5 text-xs px-3">
              Changed <Badge variant="secondary" className="ml-1 text-[10px]">{counts.changed}</Badge>
            </ToggleGroupItem>
            <ToggleGroupItem value="errors" className="gap-1.5 text-xs px-3">
              Errors <Badge variant="secondary" className="ml-1 text-[10px]">{counts.errors}</Badge>
            </ToggleGroupItem>
            <ToggleGroupItem value="anomalies" className="gap-1.5 text-xs px-3">
              Anomalies <Badge variant="secondary" className="ml-1 text-[10px]">{counts.anomalies}</Badge>
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortByChange(!sortByChange)}
            className="gap-1.5 text-xs"
          >
            <Filter className="w-3.5 h-3.5" />
            {sortByChange ? 'Sort by name' : 'Sort by change %'}
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Printer</TableHead>
                <TableHead className="w-[70px]">Region</TableHead>
                <TableHead className="text-right w-[100px]">Old Price</TableHead>
                <TableHead className="text-right w-[100px]">New Price</TableHead>
                <TableHead className="text-right w-[80px]">Change</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px]">Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map(([brandSlug, rows]) => {
                const isExpanded = allExpanded || expandedBrands.has(brandSlug);
                return (
                  <TooltipProvider key={brandSlug}>
                    {/* Brand header row */}
                    {brands.length > 1 && (
                      <TableRow
                        className="bg-muted/30 cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleBrand(brandSlug)}
                      >
                        <TableCell colSpan={7} className="py-2">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            <span className="font-semibold capitalize">{brandSlug.replace(/-/g, ' ')}</span>
                            <Badge variant="outline" className="text-[10px]">{rows.length} results</Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Data rows */}
                    {(isExpanded || brands.length === 1) && rows.map((row, idx) => (
                      <ResultRow key={`${brandSlug}-${idx}`} row={row} />
                    ))}
                  </TooltipProvider>
                );
              })}

              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No results match the current filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultRow({ row }: { row: FlatRow }) {
  const { region, regionCode } = row;

  // Skipped / printer-level error
  if (row.skipped || row.printerError) {
    return (
      <TableRow className="opacity-60">
        <TableCell className="font-medium text-sm">{row.modelName}</TableCell>
        <TableCell>—</TableCell>
        <TableCell colSpan={3} className="text-sm text-muted-foreground">
          {row.skipReason || row.printerError}
        </TableCell>
        <TableCell>
          <StatusBadge status={row.printerError ? 'error' : 'skipped'} />
        </TableCell>
        <TableCell />
      </TableRow>
    );
  }

  // Region-level row
  const changeColor = (region.changePct ?? 0) < 0
    ? 'text-green-400'
    : (region.changePct ?? 0) > 0
      ? 'text-red-400'
      : 'text-muted-foreground';

  return (
    <TableRow className={region.isAnomaly ? 'bg-yellow-950/10' : ''}>
      <TableCell className="font-medium text-sm">{row.modelName}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{REGION_FLAGS[regionCode] || ''}</span>
          <span className="text-xs font-mono">{regionCode}</span>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm">
        {formatPrice(region.oldPrice, region.currency)}
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm font-medium">
        {formatPrice(region.newPrice, region.currency)}
      </TableCell>
      <TableCell className={`text-right tabular-nums text-sm font-medium ${changeColor}`}>
        {region.changePct != null ? (
          <div className="flex items-center justify-end gap-0.5">
            {region.changePct < 0 ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : region.changePct > 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            {formatChangePct(region.changePct)}
          </div>
        ) : '—'}
      </TableCell>
      <TableCell>
        <StatusBadge status={region.status} isAnomaly={region.isAnomaly} anomalyReason={region.anomalyReason} />
      </TableCell>
      <TableCell>
        {region.extractionMethod && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-[10px] font-mono cursor-help">
                {region.extractionMethod}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Confidence: {region.confidence || 'unknown'}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

function StatusBadge({
  status,
  isAnomaly,
  anomalyReason,
}: {
  status: string;
  isAnomaly?: boolean;
  anomalyReason?: string | null;
}) {
  const config: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
    updated: { label: 'Updated', className: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
    new: { label: 'New', className: 'bg-green-600/20 text-green-400 border-green-600/30' },
    unchanged: { label: 'No Change', className: 'bg-muted text-muted-foreground' },
    error: { label: 'Error', className: 'bg-red-600/20 text-red-400 border-red-600/30', icon: <XCircle className="w-3 h-3" /> },
    not_in_region: { label: 'N/A', className: 'bg-muted text-muted-foreground' },
    geo_blocked: { label: 'Geo-blocked', className: 'bg-orange-600/20 text-orange-400 border-orange-600/30', icon: <Globe className="w-3 h-3" /> },
    anomaly_rejected: { label: 'Rejected', className: 'bg-red-600/20 text-red-400 border-red-600/30', icon: <AlertTriangle className="w-3 h-3" /> },
    anomaly_cleared: { label: 'Cleared', className: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30', icon: <AlertTriangle className="w-3 h-3" /> },
    skipped: { label: 'Skipped', className: 'bg-muted text-muted-foreground', icon: <SkipForward className="w-3 h-3" /> },
    extraction_failed: { label: 'No Price', className: 'bg-orange-600/20 text-orange-400 border-orange-600/30' },
    not_found: { label: 'Not Found', className: 'bg-muted text-muted-foreground' },
  };

  const c = config[status] || { label: status, className: 'bg-muted text-muted-foreground' };

  const badge = (
    <Badge variant="outline" className={`text-[10px] gap-1 ${c.className}`}>
      {c.icon}
      {c.label}
    </Badge>
  );

  if (isAnomaly && anomalyReason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">{anomalyReason}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
