import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { NewFilamentsTable } from './NewFilamentsTable';
import { PriceChangesTable } from './PriceChangesTable';
import type { SyncItem } from '@/hooks/useCatalogSync';

interface Props {
  items: SyncItem[];
  selectedItems: Set<string>;
  onToggleItem: (id: string) => void;
  onToggleAll: (importableIds: string[]) => void;
  onPreview: (item: SyncItem) => void;
}

export function SyncResultsTabs({ items, selectedItems, onToggleItem, onToggleAll, onPreview }: Props) {
  const newItems = items.filter(i => i.status === 'new');
  const changedItems = items.filter(i => i.status === 'price_changed');
  const matchedItems = items.filter(i => i.status === 'matched');
  const skippedItems = items.filter(i => i.status === 'skipped');
  const errorItems = items.filter(i => i.status === 'error');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Sync Results — {items.length} items</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="new">
          <div className="px-6 pb-2">
            <TabsList>
              <TabsTrigger value="new">
                New <Badge variant="secondary" className="ml-1.5 bg-green-500/10 text-green-500 text-xs">{newItems.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="price_changed">
                Price Changes <Badge variant="secondary" className="ml-1.5 bg-amber-500/10 text-amber-500 text-xs">{changedItems.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="matched">
                Matched <Badge variant="secondary" className="ml-1.5 text-xs">{matchedItems.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="skipped">
                Skipped <Badge variant="secondary" className="ml-1.5 text-xs">{skippedItems.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="errors">
                Errors <Badge variant="secondary" className="ml-1.5 bg-red-500/10 text-red-500 text-xs">{errorItems.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="new" className="mt-0">
            <NewFilamentsTable
              items={newItems}
              selectedItems={selectedItems}
              onToggleItem={onToggleItem}
              onToggleAll={onToggleAll}
              onPreview={onPreview}
            />
          </TabsContent>

          <TabsContent value="price_changed" className="mt-0">
            <PriceChangesTable items={changedItems} onPreview={onPreview} />
          </TabsContent>

          <TabsContent value="matched" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchedItems.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No matched items</TableCell></TableRow>
                ) : matchedItems.map(item => (
                  <TableRow key={item.id} className="opacity-70">
                    <TableCell>{item.display_name ?? '—'}</TableCell>
                    <TableCell>{item.material_type ?? '—'}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      {item.color_hex && <div className="w-3 h-3 rounded-full border border-border shrink-0" style={{ backgroundColor: item.color_hex }} />}
                      {item.color_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.variant_sku ?? '—'}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">✅ Current</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="skipped" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Title</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skippedItems.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No skipped items</TableCell></TableRow>
                ) : skippedItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.display_name ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">Skipped by admin</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="errors" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Title</TableHead>
                  <TableHead>Error Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorItems.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No errors</TableCell></TableRow>
                ) : errorItems.map(item => (
                  <TableRow key={item.id} className="bg-red-500/5">
                    <TableCell>{item.display_name ?? '—'}</TableCell>
                    <TableCell className="text-sm text-red-400">{item.error_message ?? 'Unknown error'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
