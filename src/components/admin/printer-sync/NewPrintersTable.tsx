import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Check, X } from 'lucide-react';
import type { PrinterSyncItem } from '@/types/printer-sync';
import { computePrinterQualityScore } from '@/lib/printer-sync-core';

interface Props {
  items: PrinterSyncItem[];
  selectedItems: Set<string>;
  onToggleItem: (id: string) => void;
  onToggleAll: (importableIds: string[]) => void;
  onPreview: (item: PrinterSyncItem) => void;
}

function formatPrice(val: number | null, symbol = '$') {
  if (val == null) return '—';
  return `${symbol}${val.toFixed(2)}`;
}

/** Show the best available price with the correct currency symbol */
function formatBestPrice(item: PrinterSyncItem): string {
  if (item.price_usd != null && item.price_usd > 0) return `$${item.price_usd.toFixed(2)}`;
  if (item.price_cad != null && item.price_cad > 0) return `C$${item.price_cad.toFixed(2)}`;
  if (item.price_eur != null && item.price_eur > 0) return `€${item.price_eur.toFixed(2)}`;
  if (item.price_gbp != null && item.price_gbp > 0) return `£${item.price_gbp.toFixed(2)}`;
  if (item.price_aud != null && item.price_aud > 0) return `A$${item.price_aud.toFixed(2)}`;
  return '—';
}

function formatBuildVolume(x: number | null, y: number | null, z: number | null): string {
  if (x == null || y == null || z == null) return '—';
  return `${x}×${y}×${z}`;
}

function BoolBadge({ value, label }: { value: boolean | null; label?: string }) {
  if (value == null) return <span className="text-muted-foreground/50">—</span>;
  return value ? (
    <Badge variant="secondary" className="text-[10px] gap-0.5 bg-green-500/10 text-green-500 border-green-500/30">
      <Check className="w-2.5 h-2.5" /> {label || 'Yes'}
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-[10px] gap-0.5 bg-muted text-muted-foreground">
      <X className="w-2.5 h-2.5" /> {label || 'No'}
    </Badge>
  );
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

export function NewPrintersTable({ items, selectedItems, onToggleItem, onToggleAll, onPreview }: Props) {
  const importableIds = items.filter(i => !i.inserted_printer_id).map(i => i.id);
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
            <TH tip="Printer model name">Model Name</TH>
            <TH tip="Printing technology (FDM, SLA, DLP, MSLA)">Tech</TH>
            <TH tip="Build volume in mm (X×Y×Z)">Build Volume</TH>
            <TH tip="Maximum print speed in mm/s">Speed</TH>
            <TH tip="Maximum nozzle temperature in °C">Nozzle</TH>
            <TH tip="Maximum bed temperature in °C">Bed</TH>
            <TH tip="Whether the printer has an enclosure">Encl.</TH>
            <TH tip="Whether the printer has WiFi connectivity">WiFi</TH>
            <TH tip="Multi-material / multi-color support">Multi</TH>
            <TH tip="Best available price (may be USD, CAD, EUR depending on source store)" className="text-right">Price</TH>
            <TH tip="Data completeness score (0-100)" className="text-center">Quality</TH>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={14} className="text-center text-muted-foreground py-8">No new printers found</TableCell>
            </TableRow>
          ) : items.map(item => {
            const merged = { ...item.extracted_data, ...item.admin_override_data } as Record<string, any>;
            const score = computePrinterQualityScore({ ...merged, ...item });
            const isImportable = !item.inserted_printer_id;

            return (
              <TableRow key={item.id} className={item.inserted_printer_id ? 'opacity-60' : ''}>
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
                <TableCell className="max-w-[200px] font-medium">
                  <span className="truncate block">{item.model_name ?? item.display_name ?? '—'}</span>
                  {item.discontinued && (
                    <Badge variant="secondary" className="text-[9px] mt-0.5 bg-red-500/10 text-red-400 border-red-500/30">
                      Discontinued
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {item.printer_technology ? (
                    <Badge variant="outline" className="text-[10px]">{item.printer_technology}</Badge>
                  ) : '—'}
                </TableCell>
                <TableCell className="tabular-nums text-xs whitespace-nowrap">
                  {formatBuildVolume(item.build_volume_x_mm, item.build_volume_y_mm, item.build_volume_z_mm)}
                </TableCell>
                <TableCell className="tabular-nums text-xs">
                  {item.max_print_speed_mms ? `${item.max_print_speed_mms}` : '—'}
                </TableCell>
                <TableCell className="tabular-nums text-xs">
                  {item.max_nozzle_temp_c ? `${item.max_nozzle_temp_c}°` : '—'}
                </TableCell>
                <TableCell className="tabular-nums text-xs">
                  {item.bed_max_temp_c ? `${item.bed_max_temp_c}°` : '—'}
                </TableCell>
                <TableCell><BoolBadge value={item.has_enclosure} /></TableCell>
                <TableCell><BoolBadge value={item.has_wifi} /></TableCell>
                <TableCell>
                  {item.multi_material_supported != null ? (
                    <BoolBadge
                      value={item.multi_material_supported}
                      label={item.multi_material_max_spools ? `${item.multi_material_max_spools}` : undefined}
                    />
                  ) : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatBestPrice(item)}</TableCell>
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
