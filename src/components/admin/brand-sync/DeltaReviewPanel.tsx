import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Database, Sparkles, ArrowUpDown, AlertTriangle, Download, X } from 'lucide-react';
import { NewFilamentsTable } from './NewFilamentsTable';
import { PriceChangesTable } from './PriceChangesTable';
import { FilamentPreviewDialog } from './FilamentPreviewDialog';
import type { SyncItem, DeltaStats } from '@/hooks/useCatalogSync';

interface Props {
  items: SyncItem[];
  stats: DeltaStats;
  onStartImport: (itemIds: string[]) => void;
  importing: boolean;
}

export function DeltaReviewPanel({ items, stats, onStartImport, importing }: Props) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<SyncItem | null>(null);
  const [activeTab, setActiveTab] = useState('new');

  const newItems = useMemo(() => items.filter(i => i.status === 'new'), [items]);
  const changedItems = useMemo(() => items.filter(i => i.status === 'price_changed'), [items]);
  const matchedItems = useMemo(() => items.filter(i => i.status === 'matched'), [items]);
  const errorItems = useMemo(() => items.filter(i => i.status === 'error'), [items]);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (ids: string[]) => {
    setSelectedItems(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      }
      return new Set([...prev, ...ids]);
    });
  };

  const handleImport = () => {
    // Include both selected new items AND all price-changed items
    const importIds = [...selectedItems];
    // Auto-include all price_changed items
    changedItems.forEach(item => {
      if (!importIds.includes(item.id)) {
        importIds.push(item.id);
      }
    });
    onStartImport(importIds);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Database className="w-4 h-4 text-muted-foreground" />}
            label="In Database"
            value={stats.inDatabase}
            tooltip="Existing filaments from this brand already in the FilaScope database"
          />
          <StatCard
            icon={<Sparkles className="w-4 h-4 text-blue-500" />}
            label="New Available"
            value={stats.newCount}
            tooltip="Filaments found in the store that are not yet in the database"
            highlight="blue"
          />
          <StatCard
            icon={<ArrowUpDown className="w-4 h-4 text-amber-500" />}
            label="Price Changes"
            value={stats.changedCount}
            tooltip="Existing filaments where the store price has changed since last sync"
            highlight="amber"
          />
          <StatCard
            icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
            label="Errors"
            value={stats.errorCount}
            tooltip="Products that could not be processed due to extraction or classification errors"
            highlight={stats.errorCount > 0 ? 'red' : undefined}
          />
        </div>

        {/* Tabs */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-4 pt-3">
              <TabsList className="bg-transparent gap-1">
                <TabsTrigger value="new" className="gap-1.5">
                  New
                  <Badge variant="secondary" className="text-xs h-5 min-w-5 justify-center">
                    {stats.newCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="changed" className="gap-1.5">
                  Price Changes
                  <Badge variant="secondary" className="text-xs h-5 min-w-5 justify-center">
                    {stats.changedCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="matched" className="gap-1.5">
                  Matched
                  <Badge variant="secondary" className="text-xs h-5 min-w-5 justify-center">
                    {stats.matchedCount}
                  </Badge>
                </TabsTrigger>
                {stats.errorCount > 0 && (
                  <TabsTrigger value="errors" className="gap-1.5">
                    Errors
                    <Badge variant="destructive" className="text-xs h-5 min-w-5 justify-center">
                      {stats.errorCount}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <CardContent className="pt-4">
              <TabsContent value="new" className="mt-0">
                {newItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No new filaments found — the database is up to date with this brand's store.
                  </p>
                ) : (
                  <NewFilamentsTable
                    items={newItems}
                    selectedItems={selectedItems}
                    onToggleItem={toggleItem}
                    onToggleAll={toggleAll}
                    onPreview={setPreviewItem}
                  />
                )}
              </TabsContent>

              <TabsContent value="changed" className="mt-0">
                {changedItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No price changes detected.
                  </p>
                ) : (
                  <PriceChangesTable items={changedItems} onPreview={setPreviewItem} />
                )}
              </TabsContent>

              <TabsContent value="matched" className="mt-0">
                {matchedItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No matched items.
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground mb-3">
                      These {matchedItems.length} filaments are already in the database and match the store data.
                    </p>
                    <div className="grid gap-1 max-h-[400px] overflow-y-auto">
                      {matchedItems.map(item => (
                        <div key={item.id} className="flex items-center gap-2 py-1 px-2 text-sm rounded hover:bg-muted/50">
                          {item.color_hex && (
                            <div
                              className="w-3 h-3 rounded-full border border-border shrink-0"
                              style={{ backgroundColor: item.color_hex }}
                            />
                          )}
                          <span className="text-muted-foreground">{item.display_name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{item.material_type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {stats.errorCount > 0 && (
                <TabsContent value="errors" className="mt-0">
                  <div className="space-y-2">
                    {errorItems.map(item => (
                      <div key={item.id} className="flex items-start gap-2 py-2 px-3 bg-red-500/5 rounded border border-red-500/20">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{item.display_name || 'Unknown'}</p>
                          <p className="text-xs text-red-400">{item.error_message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
            </CardContent>
          </Tabs>
        </Card>

        {/* Sticky import bar */}
        {selectedItems.size > 0 && (
          <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur border-t border-border p-4 -mx-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedItems.size} filament{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
              {changedItems.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  + {changedItems.length} price updates
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
                <X className="w-3.5 h-3.5 mr-1" /> Clear
              </Button>
              <Button size="sm" onClick={handleImport} disabled={importing} className="gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Import Selected ({selectedItems.size + changedItems.length})
              </Button>
            </div>
          </div>
        )}

        {/* Preview dialog */}
        {previewItem && (
          <FilamentPreviewDialog
            item={previewItem}
            open={!!previewItem}
            onOpenChange={(open) => { if (!open) setPreviewItem(null); }}
            onSave={() => setPreviewItem(null)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

// ── Stat Card ──

function StatCard({
  icon,
  label,
  value,
  tooltip,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tooltip: string;
  highlight?: 'blue' | 'amber' | 'red';
}) {
  const highlightClass = highlight === 'blue'
    ? 'border-blue-500/30 bg-blue-500/5'
    : highlight === 'amber'
    ? 'border-amber-500/30 bg-amber-500/5'
    : highlight === 'red'
    ? 'border-red-500/30 bg-red-500/5'
    : '';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className={highlightClass}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              {icon}
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <span className="text-2xl font-bold">{value}</span>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs max-w-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
