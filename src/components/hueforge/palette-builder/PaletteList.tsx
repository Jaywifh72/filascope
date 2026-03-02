import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, Minus, Plus, X, GripVertical, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SwatchCircle } from '@/components/hueforge/SwatchCircle';
import { cn } from '@/lib/utils';
import type { PaletteEntry } from '@/hooks/usePaletteBuilder';

function getTdBadgeClasses(td: number): string {
  if (td <= 1) return 'bg-gray-800 text-gray-300';
  if (td <= 3) return 'bg-amber-900/50 text-amber-400';
  if (td <= 5) return 'bg-cyan-900/50 text-cyan-400';
  return 'bg-purple-900/50 text-purple-400';
}

interface RowProps {
  entry: PaletteEntry;
  idx: number;
  total: number;
  onRemove: (id: string) => void;
  onUpdateLayers: (id: string, count: number) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
  highlighted: boolean;
}

const PaletteRow = React.memo(function PaletteRow({ entry, idx, total, onRemove, onUpdateLayers, onReorder, highlighted }: RowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-card/60 hover:border-primary/30 transition-all group",
        highlighted && "bg-cyan-500/10 border-cyan-500/30"
      )}
    >
      {/* Reorder controls */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          onClick={() => onReorder(entry.filamentId, 'up')}
          disabled={idx === 0}
          className="p-1 sm:p-0.5 min-w-[44px] min-h-[22px] sm:min-w-0 sm:min-h-0 rounded hover:bg-muted disabled:opacity-20 transition-colors flex items-center justify-center"
          aria-label={`Move ${entry.filamentName} up`}
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <GripVertical className="w-3 h-3 text-muted-foreground/40 mx-auto hidden sm:block" aria-hidden="true" />
        <button
          onClick={() => onReorder(entry.filamentId, 'down')}
          disabled={idx === total - 1}
          className="p-1 sm:p-0.5 min-w-[44px] min-h-[22px] sm:min-w-0 sm:min-h-0 rounded hover:bg-muted disabled:opacity-20 transition-colors flex items-center justify-center"
          aria-label={`Move ${entry.filamentName} down`}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Swatch + color family */}
      <div className="flex items-center gap-1.5 shrink-0">
        <SwatchCircle
          hexColor={entry.color}
          colorFamily={entry.colorFamily}
          size="w-5 h-5"
        />
        {entry.colorFamily && (
          <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">{entry.colorFamily}</span>
        )}
      </div>

      {/* Name, brand & color family (mobile) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          {entry.slug ? (
            <a
              href={`/filament/${entry.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium truncate hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              {entry.filamentName}
              <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
            </a>
          ) : (
            <span className="text-sm font-medium truncate">{entry.filamentName}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{entry.brand}</span>
          {entry.colorFamily && (
            <span className="sm:hidden">· {entry.colorFamily}</span>
          )}
          {entry.price != null && (
            <span className="shrink-0">${entry.price.toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Material */}
      {entry.material && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 hidden sm:inline-flex">
          {entry.material}
        </Badge>
      )}

      {/* TD */}
      <span
        className={cn(
          'font-mono text-xs rounded px-1.5 py-0.5 shrink-0',
          getTdBadgeClasses(entry.tdValue)
        )}
      >
        {entry.tdValue.toFixed(2)}
      </span>

      {/* Layer controls */}
      <div className="flex flex-col items-center shrink-0">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onUpdateLayers(entry.filamentId, entry.layers - 1)}
            disabled={entry.layers <= 1}
            className="w-8 h-8 sm:w-5 sm:h-5 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
            aria-label={`Decrease layers for ${entry.filamentName}`}
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs font-mono w-4 text-center" aria-label={`${entry.layers} layers`}>{entry.layers}</span>
          <button
            onClick={() => onUpdateLayers(entry.filamentId, entry.layers + 1)}
            disabled={entry.layers >= 6}
            className="w-8 h-8 sm:w-5 sm:h-5 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
            aria-label={`Increase layers for ${entry.filamentName}`}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <span className="text-[9px] text-muted-foreground leading-none mt-0.5">layers</span>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(entry.filamentId)}
        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
        aria-label={`Remove ${entry.filamentName} from palette`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});

interface Props {
  palette: PaletteEntry[];
  onRemove: (id: string) => void;
  onUpdateLayers: (id: string, count: number) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
}

export function PaletteList({ palette, onRemove, onUpdateLayers, onReorder }: Props) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const prevOrderRef = useRef<string[]>([]);

  // Track reorder to flash highlight
  useEffect(() => {
    const currentOrder = palette.map(p => p.filamentId);
    const prevOrder = prevOrderRef.current;

    if (prevOrder.length === currentOrder.length && prevOrder.length > 0) {
      // Find which item moved
      for (let i = 0; i < currentOrder.length; i++) {
        if (currentOrder[i] !== prevOrder[i]) {
          setHighlightedId(currentOrder[i]);
          const timer = setTimeout(() => setHighlightedId(null), 500);
          prevOrderRef.current = currentOrder;
          return () => clearTimeout(timer);
        }
      }
    }

    prevOrderRef.current = currentOrder;
  }, [palette]);

  return (
    <div className="space-y-1.5" role="list" aria-label="Palette filaments">
      {palette.map((entry, idx) => (
        <PaletteRow
          key={entry.filamentId}
          entry={entry}
          idx={idx}
          total={palette.length}
          onRemove={onRemove}
          onUpdateLayers={onUpdateLayers}
          onReorder={onReorder}
          highlighted={highlightedId === entry.filamentId}
        />
      ))}
    </div>
  );
}
