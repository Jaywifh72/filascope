import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Search, Play, Zap, RefreshCw, Download, ChevronsUpDown, Bot, RotateCcw, Link2, Loader2 } from 'lucide-react';
import type { ProductType, StoreRow, DiagnosisResult, PricingStats } from '../types';
import { PRODUCT_TYPE_CONFIGS } from '../types';
import { BRAND_REGIONAL_CONFIGS } from '../constants';

interface PricingToolbarProps {
  productType: ProductType;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  vendorFilter: string;
  onVendorFilterChange: (value: string) => void;
  vendors: string[];
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  filteredCount: number;
  // Selection
  allVisibleSelected: boolean;
  selectedCount: number;
  onToggleSelectAll: () => void;
  // Expand/collapse
  onExpandAll: () => void;
  onCollapseAll: () => void;
  // Bulk actions
  isBusy: boolean;
  bulkTesting: boolean;
  bulkSyncing: boolean;
  onTestSelected: () => void;
  onTestAllStale: () => void;
  onSyncSelected: () => void;
  onSyncStale: () => void;
  // Diagnosis
  totalFailureCount: number;
  diagnosisResult: DiagnosisResult | null;
  isDiagnosing: boolean;
  onDiagnose: () => void;
  onShowDiagnosis: () => void;
  // Export
  onExportPricing: () => void;
  onExportChanges: () => void;
  // Clear inactive
  isClearingInactiveCache: boolean;
  onClearInactiveCache: () => void;
  // Populate URLs
  isPopulatingUrls: boolean;
  onPopulateUrls: () => void;
  canPopulateUrls: boolean;
  // Cancel
  onCancel: () => void;
  // Progress
  bulkProgress: { done: number; total: number; variants?: number } | null;
  bulkSyncProgress: { done: number; total: number; variants?: number } | null;
  // Stats
  stats: PricingStats;
}

export function PricingToolbar({
  productType,
  search,
  onSearchChange,
  searchPlaceholder,
  vendorFilter,
  onVendorFilterChange,
  vendors,
  statusFilter,
  onStatusFilterChange,
  filteredCount,
  allVisibleSelected,
  selectedCount,
  onToggleSelectAll,
  onExpandAll,
  onCollapseAll,
  isBusy,
  bulkTesting,
  bulkSyncing,
  onTestSelected,
  onTestAllStale,
  onSyncSelected,
  onSyncStale,
  totalFailureCount,
  diagnosisResult,
  isDiagnosing,
  onDiagnose,
  onShowDiagnosis,
  onExportPricing,
  onExportChanges,
  isClearingInactiveCache,
  onClearInactiveCache,
  isPopulatingUrls,
  onPopulateUrls,
  canPopulateUrls,
  onCancel,
  bulkProgress,
  bulkSyncProgress,
  stats,
}: PricingToolbarProps) {
  const showPopulateUrls = vendorFilter !== 'all' && vendorFilter in BRAND_REGIONAL_CONFIGS;

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={searchPlaceholder} value={search} onChange={e => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={vendorFilter} onValueChange={onVendorFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {vendors.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">🟢 Active</SelectItem>
            <SelectItem value="stale">🟡 Stale</SelectItem>
            <SelectItem value="broken">🔴 Broken</SelectItem>
            <SelectItem value="failed">🔴 Failed</SelectItem>
            <SelectItem value="alert">🟣 Price Alert</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center">{filteredCount} products</span>
      </div>

      {/* Bulk action toolbar */}
      <div className="flex items-center gap-3 flex-wrap rounded-lg border border-border/50 bg-card p-3">
        <div className="flex items-center gap-2">
          <Checkbox checked={allVisibleSelected} onCheckedChange={onToggleSelectAll} aria-label="Select all visible" />
          <span className="text-xs text-muted-foreground">
            {selectedCount > 0 ? <Badge variant="secondary" className="text-[10px]">{selectedCount} stores</Badge> : 'Select all'}
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <Button size="sm" variant="ghost" onClick={onExpandAll} className="text-xs gap-1.5">
          <ChevronsUpDown className="w-3.5 h-3.5" /> Expand All
        </Button>
        <Button size="sm" variant="ghost" onClick={onCollapseAll} className="text-xs gap-1.5">
          Collapse All
        </Button>
        <div className="h-4 w-px bg-border" />
        <Button size="sm" variant="outline" disabled={selectedCount === 0 || isBusy} onClick={onTestSelected} className="text-xs gap-1.5">
          {bulkTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          Test Selected ({selectedCount})
        </Button>
        <Button size="sm" variant="outline" disabled={isBusy} onClick={onTestAllStale} className="text-xs gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Test All Stale
        </Button>
        <div className="h-4 w-px bg-border" />
        <Button size="sm" variant="outline" disabled={selectedCount === 0 || isBusy} onClick={onSyncSelected} className="text-xs gap-1.5">
          {bulkSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Resync Selected ({selectedCount})
        </Button>
        <Button size="sm" variant="outline" disabled={isBusy} onClick={onSyncStale} className="text-xs gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Resync Stale
          {stats.stalePrices > 0 && <Badge variant="secondary" className="text-[9px] ml-1">{stats.stalePrices}</Badge>}
        </Button>
        {(totalFailureCount > 0 || diagnosisResult) && (
          <>
            <div className="h-4 w-px bg-border" />
            <Button
              size="sm"
              variant="outline"
              disabled={isDiagnosing || (totalFailureCount === 0 && !diagnosisResult)}
              onClick={totalFailureCount > 0 ? onDiagnose : onShowDiagnosis}
              className="text-xs gap-1.5"
            >
              {isDiagnosing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
              {totalFailureCount > 0 ? `🤖 Diagnose (${totalFailureCount})` : 'Last Diagnosis'}
            </Button>
          </>
        )}
        <div className="h-4 w-px bg-border" />
        <Button size="sm" variant="ghost" onClick={onExportPricing} className="text-xs gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
        <Button size="sm" variant="ghost" onClick={onExportChanges} className="text-xs gap-1.5">
          <Download className="w-3.5 h-3.5" /> Changes
        </Button>
        <div className="h-4 w-px bg-border" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="ghost" onClick={onClearInactiveCache} disabled={isClearingInactiveCache} className="text-xs gap-1.5 text-muted-foreground hover:text-destructive">
              {isClearingInactiveCache ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Clear Inactive
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear URL cache entries for deactivated stores (removes stale Failed rows)</TooltipContent>
        </Tooltip>
        {showPopulateUrls && (
          <>
            <div className="h-4 w-px bg-border" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={onPopulateUrls} disabled={isBusy || isPopulatingUrls} className="text-xs gap-1.5">
                  {isPopulatingUrls ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />} Populate URLs
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate regional store URLs for {vendorFilter} products</TooltipContent>
            </Tooltip>
          </>
        )}
        {isBusy && (
          <Button size="sm" variant="ghost" onClick={onCancel} className="text-xs text-destructive">
            Cancel
          </Button>
        )}
      </div>

      {/* Progress bars */}
      {bulkProgress && (
        <div className="space-y-1">
          <Progress value={(bulkProgress.done / bulkProgress.total) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Testing {bulkProgress.done}/{bulkProgress.total} products
            {bulkProgress.variants && <span className="text-muted-foreground/70"> (covering {bulkProgress.variants} variants)</span>}
          </p>
        </div>
      )}
      {bulkSyncProgress && (
        <div className="space-y-1">
          <Progress value={(bulkSyncProgress.done / bulkSyncProgress.total) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Syncing {bulkSyncProgress.done}/{bulkSyncProgress.total} products
            {bulkSyncProgress.variants && <span className="text-muted-foreground/70"> (covering {bulkSyncProgress.variants} variants)</span>}
          </p>
        </div>
      )}
    </>
  );
}
