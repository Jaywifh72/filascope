import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface OnboardingItem {
  id: string;
  status: string;
  display_name: string | null;
  color_name: string | null;
  material_type: string | null;
  image_url: string | null;
  price_usd: number | null;
  price_eur: number | null;
  price_cad: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  variant_sku: string | null;
  is_duplicate: boolean | null;
  inserted_filament_id: string | null;
  error_message: string | null;
  [key: string]: unknown;
}

interface Props {
  items: OnboardingItem[];
  selectedItems: Set<string>;
  onToggleItem: (id: string) => void;
  onToggleAll: () => void;
  onPreview: (item: OnboardingItem) => void;
}

function formatPrice(val: number | null) {
  if (val == null) return '—';
  return `$${val.toFixed(2)}`;
}

function StatusBadge({ item }: { item: OnboardingItem }) {
  if (item.inserted_filament_id) return <Badge className="bg-blue-500/10 text-blue-500">Inserted</Badge>;
  if (item.status === 'error') return <Badge variant="destructive">Error</Badge>;
  if (item.is_duplicate) return <Badge className="bg-yellow-500/10 text-yellow-500">Duplicate</Badge>;
  if (item.status === 'skipped') return <Badge variant="secondary">Skipped</Badge>;
  return <Badge className="bg-green-500/10 text-green-500">New</Badge>;
}

export function ExtractionResultsTable({ items, selectedItems, onToggleItem, onToggleAll, onPreview }: Props) {
  const importable = items.filter(i => !i.is_duplicate && i.status !== 'error' && !i.inserted_filament_id);
  const allSelected = importable.length > 0 && importable.every(i => selectedItems.has(i.id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
          </TableHead>
          <TableHead className="w-12">Image</TableHead>
          <TableHead>Color</TableHead>
          <TableHead>Material</TableHead>
          <TableHead>Display Name</TableHead>
          <TableHead className="text-right">US $</TableHead>
          <TableHead className="text-right">EU €</TableHead>
          <TableHead className="text-right">CA $</TableHead>
          <TableHead className="text-right">AU $</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
              No items to display
            </TableCell>
          </TableRow>
        )}
        {items.map(item => {
          const isImportable = !item.is_duplicate && item.status !== 'error' && !item.inserted_filament_id;
          return (
            <TableRow
              key={item.id}
              className={cn(
                item.is_duplicate && 'bg-yellow-500/5',
                item.status === 'error' && 'bg-red-500/5',
                item.inserted_filament_id && 'opacity-60'
              )}
            >
              <TableCell>
                <Checkbox
                  checked={selectedItems.has(item.id)}
                  onCheckedChange={() => onToggleItem(item.id)}
                  disabled={!isImportable}
                />
              </TableCell>
              <TableCell>
                {item.image_url ? (
                  <img src={item.image_url} className="w-10 h-10 rounded object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell className="font-medium">{item.color_name ?? '—'}</TableCell>
              <TableCell>{item.material_type ?? '—'}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {item.inserted_filament_id ? (
                  <a
                    href={`/filaments/${item.inserted_filament_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    {item.display_name ?? '—'}
                    <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                  </a>
                ) : (
                  item.display_name ?? '—'
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatPrice(item.price_usd)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPrice(item.price_eur)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPrice(item.price_cad)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPrice(item.price_aud)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{item.variant_sku ?? '—'}</TableCell>
              <TableCell>
                {item.is_duplicate ? (
                  <Tooltip>
                    <TooltipTrigger><StatusBadge item={item} /></TooltipTrigger>
                    <TooltipContent>Already exists in filaments table</TooltipContent>
                  </Tooltip>
                ) : (
                  <StatusBadge item={item} />
                )}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onPreview(item as any)}>
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
