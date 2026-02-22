import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import type { ProductType, ProductGroup, StoreRow, TestResult, SyncResult, ProductTypeConfig } from '../types';
import { PRODUCT_TYPE_CONFIGS } from '../types';
import { PricingProductRow } from './PricingProductRow';
import { PricingStoreRow } from './PricingStoreRow';

interface PricingTableProps {
  productType: ProductType;
  filtered: ProductGroup[];
  testResults: Map<string, TestResult>;
  syncResults: Map<string, SyncResult>;
  isBusy: boolean;
  onTestUrl: (storeKey: string, url: string, showToast?: boolean, region?: string) => Promise<TestResult>;
  onSyncPrice: (store: StoreRow, showToast?: boolean) => Promise<SyncResult>;
  // Selection state (managed externally)
  expandedProducts: Set<string>;
  onToggleExpand: (id: string) => void;
  selectedStoreKeys: Set<string>;
  onToggleSelectStore: (key: string) => void;
  allVisibleSelected: boolean;
  onToggleSelectAll: () => void;
}

export function PricingTable({
  productType,
  filtered,
  testResults,
  syncResults,
  isBusy,
  onTestUrl,
  onSyncPrice,
  expandedProducts,
  onToggleExpand,
  selectedStoreKeys,
  onToggleSelectStore,
  allVisibleSelected,
  onToggleSelectAll,
}: PricingTableProps) {
  const config = PRODUCT_TYPE_CONFIGS[productType];

  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-10">
                  <Checkbox checked={allVisibleSelected} onCheckedChange={onToggleSelectAll} aria-label="Select all" />
                </TableHead>
                <TableHead className="min-w-[220px]">Product / Store</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Compare</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Test Result</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 200).map(group => {
                const isExpanded = expandedProducts.has(group.productLineId);

                return (
                  <ProductGroupRows
                    key={group.productLineId}
                    group={group}
                    isExpanded={isExpanded}
                    onToggleExpand={() => onToggleExpand(group.productLineId)}
                    config={config}
                    selectedStoreKeys={selectedStoreKeys}
                    onToggleSelectStore={onToggleSelectStore}
                    testResults={testResults}
                    syncResults={syncResults}
                    isBusy={isBusy}
                    onTestUrl={onTestUrl}
                    onSyncPrice={onSyncPrice}
                  />
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                    No pricing data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 200 && (
          <p className="text-xs text-muted-foreground text-center py-3">
            Showing 200 of {filtered.length} products. Use filters to narrow down.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Internal component: renders parent + children rows
function ProductGroupRows({
  group, isExpanded, onToggleExpand, config,
  selectedStoreKeys, onToggleSelectStore, testResults, syncResults, isBusy, onTestUrl, onSyncPrice,
}: {
  group: ProductGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  config: ProductTypeConfig;
  selectedStoreKeys: Set<string>;
  onToggleSelectStore: (key: string) => void;
  testResults: Map<string, TestResult>;
  syncResults: Map<string, SyncResult>;
  isBusy: boolean;
  onTestUrl: (storeKey: string, url: string, showToast?: boolean, region?: string) => Promise<TestResult>;
  onSyncPrice: (store: StoreRow, showToast?: boolean) => Promise<SyncResult>;
}) {
  return (
    <>
      <PricingProductRow
        group={group}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        config={config}
      />
      {isExpanded && group.stores.map((store, idx) => (
        <PricingStoreRow
          key={store.storeKey}
          store={store}
          group={group}
          testResult={testResults.get(store.storeKey)}
          syncResult={syncResults.get(store.storeKey)}
          isSelected={selectedStoreKeys.has(store.storeKey)}
          onToggleSelect={() => onToggleSelectStore(store.storeKey)}
          isBusy={isBusy}
          isLast={idx === group.stores.length - 1}
          onTestUrl={onTestUrl}
          onSyncPrice={onSyncPrice}
        />
      ))}
    </>
  );
}
