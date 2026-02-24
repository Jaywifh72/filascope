import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';
import type { ProductGroup, ProductTypeConfig } from '../types';
import { formatCurrency } from '../constants';
import { StatusSummary, ColorSwatches } from './helpers';

interface PricingProductRowProps {
  group: ProductGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  config: ProductTypeConfig;
}

export function PricingProductRow({ group, isExpanded, onToggleExpand, config }: PricingProductRowProps) {
  const Icon = config.icon;

  return (
    <TableRow
      className="bg-muted/30 hover:bg-muted/50 cursor-pointer border-b-0"
      onClick={onToggleExpand}
    >
      <TableCell className="w-8 px-2">
        {isExpanded
          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </TableCell>
      <TableCell className="w-10">
        {/* No checkbox on parent */}
      </TableCell>
      <TableCell className="min-w-[220px]">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-foreground truncate max-w-[300px] flex items-center gap-1">
            {group.cleanName}
            {group.hasAnomalyFlag && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </TooltipTrigger>
                <TooltipContent>Price anomaly detected — requires review. Some regional prices may be from wrong products.</TooltipContent>
              </Tooltip>
            )}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{group.brand}</span>
            {group.productSubtype && <span className="text-[10px] text-muted-foreground font-mono">· {group.productSubtype}</span>}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-1">
            <Icon className="w-2.5 h-2.5" />
            {config.hasColorSwatches && group.colorCount > 0
              ? `${group.colorCount} colors`
              : `${group.variantCount} variant${group.variantCount !== 1 ? 's' : ''}`}
          </Badge>
          {config.hasColorSwatches && group.colorHexes.length > 0 && (
            <ColorSwatches hexes={group.colorHexes} max={6} />
          )}
        </div>
      </TableCell>
      <TableCell className="text-right font-mono text-xs">
        {group.hasPriceRange
          ? <span>${group.minPrice?.toFixed(2)} – ${group.maxPrice?.toFixed(2)}</span>
          : formatCurrency(group.minPrice, '$')
        }
      </TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell>
        <StatusSummary group={group} />
      </TableCell>
      <TableCell colSpan={1}>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
          {group.stores.length} store{group.stores.length !== 1 ? 's' : ''}
        </Badge>
      </TableCell>
      <TableCell colSpan={2}></TableCell>
    </TableRow>
  );
}
