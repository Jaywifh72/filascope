import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Copy, Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/formatPrice';
import type { ProductType, ProductGroup, SyncResult, StoreRow } from '../types';
import { PRODUCT_TYPE_CONFIGS } from '../types';

interface SyncLogPanelProps {
  productType: ProductType;
  syncResults: Map<string, SyncResult>;
  productGroups: ProductGroup[];
  visible: boolean;
}

function generateVerboseLog(
  productType: ProductType,
  syncResults: Map<string, SyncResult>,
  productGroups: ProductGroup[],
): string {
  const config = PRODUCT_TYPE_CONFIGS[productType];
  const timestamp = new Date().toISOString();

  // Build a storeKey -> { store, group } lookup
  const storeMap = new Map<string, { store: StoreRow; group: ProductGroup }>();
  for (const g of productGroups) {
    for (const s of g.stores) {
      storeMap.set(s.storeKey, { store: s, group: g });
    }
  }

  // Categorise results
  const failures: string[] = [];
  const changes: string[] = [];
  const unchanged: string[] = [];
  const discontinued: string[] = [];
  const notInRegion: string[] = [];
  let updatedCount = 0, unchangedCount = 0, failedCount = 0, unavailableCount = 0, notInRegionCount = 0, discontinuedCount = 0;

  syncResults.forEach((result, storeKey) => {
    if (result.status === 'syncing') return;
    const entry = storeMap.get(storeKey);
    const label = entry ? `${entry.group.cleanName} — ${entry.store.region}` : storeKey;
    const url = entry?.store.productUrl;

    if (result.status === 'discontinued') {
      discontinuedCount++;
      discontinued.push(`[SKIPPED] ${label}${result.error ? ` — ${result.error}` : ' — discontinued'}`);
    } else if (result.status === 'not_in_region') {
      notInRegionCount++;
      notInRegion.push(`[N/A] ${label}${result.error ? ` — ${result.error}` : ''}`);
    } else if (result.status === 'failed') {
      failedCount++;
      let block = `[FAILED] ${label}`;
      if (url) block += `\n  URL: ${url}`;
      if (result.error) block += `\n  Error: ${result.error}`;
      failures.push(block);
    } else if (result.status === 'unavailable') {
      unavailableCount++;
      let block = `[UNAVAILABLE] ${label}`;
      if (result.error) block += `\n  Reason: ${result.error}`;
      failures.push(block);
    } else if (result.status === 'success') {
      updatedCount++;
      const sym = entry?.store.currencySymbol || '$';
      const oldP = result.oldPrice != null ? `${sym}${result.oldPrice.toFixed(2)}` : '?';
      const newP = result.newPrice != null ? `${sym}${result.newPrice.toFixed(2)}` : '?';
      const pct = result.percentChange != null ? ` (${result.percentChange > 0 ? '+' : ''}${result.percentChange.toFixed(1)}%)` : '';
      changes.push(`[UPDATED] ${label}: ${oldP} -> ${newP}${pct}`);
    } else if (result.status === 'unchanged') {
      unchangedCount++;
      const sym = entry?.store.currencySymbol || '$';
      const price = result.newPrice ?? entry?.store.price;
      const priceStr = price != null ? `${sym}${price.toFixed(2)}` : 'N/A';
      unchanged.push(`[OK] ${label}: ${priceStr}`);
    }
  });

  const total = updatedCount + unchangedCount + failedCount + unavailableCount;

  const lines: string[] = [];
  lines.push(`=== PRICING DATA SYNC LOG ===`);
  lines.push(`Timestamp: ${timestamp}`);
  lines.push(`Product Type: ${config.pluralLabel}`);
  lines.push(`Summary: ${total} synced — ${updatedCount} updated, ${unchangedCount} unchanged, ${failedCount} failed${unavailableCount > 0 ? `, ${unavailableCount} unavailable` : ''}${notInRegionCount > 0 ? `, ${notInRegionCount} not in region` : ''}${discontinuedCount > 0 ? `, ${discontinuedCount} discontinued` : ''}`);

  if (failures.length > 0) {
    lines.push('');
    lines.push('--- FAILURES ---');
    lines.push('');
    failures.forEach(f => lines.push(f));
  }

  if (discontinued.length > 0) {
    lines.push('');
    lines.push('--- DISCONTINUED ---');
    lines.push('');
    discontinued.forEach(d => lines.push(d));
  }

  if (notInRegion.length > 0) {
    lines.push('');
    lines.push('--- NOT IN REGION ---');
    lines.push('');
    notInRegion.forEach(n => lines.push(n));
  }

  if (changes.length > 0) {
    lines.push('');
    lines.push('--- PRICE CHANGES ---');
    lines.push('');
    changes.forEach(c => lines.push(c));
  }

  if (unchanged.length > 0) {
    lines.push('');
    lines.push('--- UNCHANGED ---');
    lines.push('');
    unchanged.forEach(u => lines.push(u));
  }

  return lines.join('\n');
}

export function SyncLogPanel({ productType, syncResults, productGroups, visible }: SyncLogPanelProps) {
  const [copied, setCopied] = useState(false);

  // Count completed (non-syncing) entries
  const entryCount = useMemo(() => {
    let count = 0;
    syncResults.forEach(r => { if (r.status !== 'syncing') count++; });
    return count;
  }, [syncResults]);

  const hasFailures = useMemo(() => {
    let found = false;
    syncResults.forEach(r => { if (r.status === 'failed' || r.status === 'unavailable') found = true; });
    return found;
  }, [syncResults]);

  const [isOpen, setIsOpen] = useState(false);

  // Auto-open when failures exist
  useEffect(() => {
    if (visible && hasFailures) setIsOpen(true);
  }, [visible, hasFailures]);

  const logText = useMemo(() => {
    if (!visible || entryCount === 0) return '';
    return generateVerboseLog(productType, syncResults, productGroups);
  }, [visible, entryCount, productType, syncResults, productGroups]);

  if (!visible || entryCount === 0) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(logText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Sync Log ({entryCount} entries)
                {hasFailures && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-medium">
                    has failures
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                >
                  {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? 'Copied' : 'Copy Log'}
                </Button>
                <ChevronDown className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-180'
                )} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4">
            <pre className="font-mono text-xs bg-muted/50 text-foreground p-4 rounded-md overflow-auto max-h-[600px] whitespace-pre-wrap border border-border/30">
              {logText}
            </pre>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
