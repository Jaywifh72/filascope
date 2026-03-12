import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye } from 'lucide-react';
import type { SyncItem } from '@/hooks/useCatalogSync';

interface Props {
  items: SyncItem[];
  selectedItems: Set<string>;
  onToggleItem: (id: string) => void;
  onToggleAll: (importableIds: string[]) => void;
  onPreview: (item: SyncItem) => void;
}

function formatPrice(val: number | null, symbol = '$') {
  if (val == null) return '—';
  return `${symbol}${val.toFixed(2)}`;
}

export function computeQualityScore(d: Record<string, any>): number {
  let score = 0;
  if (d.display_name) score += 15;
  if (d.color_hex && d.color_hex !== '#808080') score += 15;
  if (d.color_family && d.color_family !== 'Unknown') score += 10;
  if (d.material || d.material_type) score += 10;
  if ((d.price_usd && d.price_usd > 0) || (d.price_eur && d.price_eur > 0) ||
      (d.price_cad && d.price_cad > 0) || (d.price_gbp && d.price_gbp > 0) ||
      (d.price_aud && d.price_aud > 0)) score += 15;
  if (d.featured_image || d.image_url) score += 10;
  if (d.nozzle_temp_min_c && d.nozzle_temp_max_c) score += 10;
  if (d.variant_sku) score += 5;
  if (d.product_url || d.product_url_us || d.product_url_eu || d.product_url_uk ||
      d.product_url_ca || d.product_url_au) score += 5;
  if (d.net_weight_g) score += 5;
  return score;
}

function QualityBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500/10 text-green-500 border-green-500/30'
    : score >= 50 ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
    : 'bg-red-500/10 text-red-500 border-red-500/30';
  return (
    <span className={`inline-flex items-center justify-center w-10 h-6 text-xs font-bold rounded-full border ${color}`}>
      {score}
    </span>
  );
}

export function NewFilamentsTable({ items, selectedItems, onToggleItem, onToggleAll, onPreview }: Props) {
  const importableIds = items.filter(i => !i.inserted_filament_id).map(i => i.id);
  const allSelected = importableIds.length > 0 && importableIds.every(id => selectedItems.has(id));

  return (
    <TooltipProvider>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox checked={allSelected} onCheckedChange={() => onToggleAll(importableIds)} />
          </TableHead>
          <TableHead className="w-12">Image</TableHead>
          <TH tip="Color name with hex swatch from curated brand-specific mapping">Color</TH>
          <TH tip="Material type detected from product title (e.g., PLA+, PETG, ABS)">Material</TH>
          <TH tip="Material + Color combined display name for the filament">Display Name</TH>
          <TH tip="US store price in USD" className="text-right">US $</TH>
          <TH tip="European store price in EUR" className="text-right">EU €</TH>
          <TH tip="Canadian store price in CAD" className="text-right">CA $</TH>
          <TH tip="Australian store price in AUD" className="text-right">AU $</TH>
          <TH tip="UK store price in GBP" className="text-right">UK £</TH>
          <TH tip="Store SKU identifier for this variant">SKU</TH>
          <TH tip="Surface finish type (Standard, Silk, Matte, etc.)">Finish</TH>
          <TH tip="Data completeness score (0-100). Green ≥80, Amber ≥50, Red &lt;50" className="text-center">Quality</TH>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={14} className="text-center text-muted-foreground py-8">No new filaments found</TableCell>
          </TableRow>
        ) : items.map(item => {
          const merged = { ...item.extracted_data, ...item.admin_override_data } as Record<string, any>;
          const score = computeQualityScore({ ...merged, ...item });
          const isImportable = !item.inserted_filament_id;

          return (
            <TableRow key={item.id} className={item.inserted_filament_id ? 'opacity-60' : ''}>
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
              <TableCell>
                <div className="flex items-center gap-2">
                  {item.color_hex && (
                    <div className="w-4 h-4 rounded-full border border-border shrink-0" style={{ backgroundColor: item.color_hex }} />
                  )}
                  <span className="font-medium">{item.color_name ?? '—'}</span>
                </div>
              </TableCell>
              <TableCell>{item.material_type ?? '—'}</TableCell>
              <TableCell className="max-w-[200px] truncate">{item.display_name ?? '—'}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPrice(item.price_usd)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPrice(item.price_eur, '€')}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPrice(item.price_cad)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPrice(item.price_aud)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPrice(item.price_gbp, '£')}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{item.variant_sku ?? '—'}</TableCell>
              <TableCell className="text-xs">{item.finish_type ?? '—'}</TableCell>
              <TableCell className="text-center"><QualityBadge score={score} /></TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onPreview(item)}>
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
    </TooltipProvider>
  );
}

/** Table header with tooltip */
function TH({ children, tip, className }: { children: React.ReactNode; tip: string; className?: string }) {
  return (
    <TableHead className={className}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help border-b border-dotted border-muted-foreground/40">{children}</span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs max-w-xs">{tip}</p>
        </TooltipContent>
      </Tooltip>
    </TableHead>
  );
}
