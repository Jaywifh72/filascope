import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { SyncItem } from '@/pages/admin/BrandCatalogSync';

interface Props {
  items: SyncItem[];
  onPreview: (item: SyncItem) => void;
}

function formatPrice(val: number | null, symbol = '$') {
  if (val == null) return '—';
  return `${symbol}${val.toFixed(2)}`;
}

export function PriceChangesTable({ items, onPreview }: Props) {
  // Flatten price diffs into rows
  type DiffRow = {
    item: SyncItem;
    field: string;
    region: string;
    oldPrice: number | null;
    newPrice: number | null;
    diff: number;
  };

  const rows: DiffRow[] = [];
  for (const item of items) {
    const diffs = item.price_diff as any;
    if (Array.isArray(diffs)) {
      for (const d of diffs) {
        const regionMap: Record<string, string> = {
          price_usd: 'US', price_eur: 'EU', price_gbp: 'UK', price_cad: 'CA', price_aud: 'AU',
        };
        rows.push({
          item,
          field: d.field,
          region: regionMap[d.field] ?? d.field,
          oldPrice: d.old,
          newPrice: d.new,
          diff: (d.new ?? 0) - (d.old ?? 0),
        });
      }
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Image</TableHead>
          <TableHead>Display Name</TableHead>
          <TableHead>Material</TableHead>
          <TableHead>Region</TableHead>
          <TableHead className="text-right">Old Price</TableHead>
          <TableHead className="text-right">New Price</TableHead>
          <TableHead className="text-right">Diff</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No price changes detected</TableCell></TableRow>
        ) : rows.map((row, i) => {
          const isDecrease = row.diff < 0;
          const isIncrease = row.diff > 0;
          return (
            <TableRow key={`${row.item.id}-${row.field}-${i}`}>
              <TableCell>
                {row.item.image_url ? (
                  <img src={row.item.image_url} className="w-10 h-10 rounded object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">{row.item.display_name ?? '—'}</TableCell>
              <TableCell>{row.item.material_type ?? '—'}</TableCell>
              <TableCell><Badge variant="outline" className="text-xs">{row.region}</Badge></TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{formatPrice(row.oldPrice)}</TableCell>
              <TableCell className="text-right tabular-nums font-medium">{formatPrice(row.newPrice)}</TableCell>
              <TableCell className={`text-right tabular-nums font-medium ${isDecrease ? 'text-green-500' : isIncrease ? 'text-red-500' : ''}`}>
                {isDecrease ? '↓' : isIncrease ? '↑' : ''} {formatPrice(Math.abs(row.diff))}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onPreview(row.item)}>
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
