import { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { isValidHexColor, normalizeColorHex, cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ColorPickerCanvas } from '../ColorPickerCanvas';
import { HueForgeFilamentMatch } from './HueForgeFilamentMatch';
import type { ColorFinderFilament } from '@/hooks/useColorFinderFilaments';

export interface LayerData {
  hex: string;
  label: string;
}

interface HueForgeLayerRowProps {
  layer: LayerData;
  index: number;
  totalLayers: number;
  matches: Array<ColorFinderFilament & { matchPercent: number }>;
  onHexChange: (hex: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function HueForgeLayerRow({
  layer,
  index,
  totalLayers,
  matches,
  onHexChange,
  onRemove,
  canRemove,
}: HueForgeLayerRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hexInput, setHexInput] = useState(layer.hex);

  // Sync external hex changes
  useEffect(() => {
    setHexInput(layer.hex);
  }, [layer.hex]);

  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    const normalized = value.startsWith('#') ? value : `#${value}`;
    if (isValidHexColor(normalized)) {
      onHexChange(normalized.toUpperCase());
    }
  };

  const handlePickerChange = useCallback((hex: string) => {
    onHexChange(hex.toUpperCase());
    setHexInput(hex.toUpperCase());
  }, [onHexChange]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Layer Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4">
        {/* Layer number badge */}
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold text-foreground shrink-0">
          {index + 1}
        </div>

        {/* Color swatch — click to open picker */}
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className="w-10 h-10 rounded-lg border-2 border-border shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0"
          style={{ backgroundColor: isValidHexColor(layer.hex) ? layer.hex : '#808080' }}
          aria-label={`Pick color for layer ${index + 1}`}
        />

        {/* Hex input */}
        <Input
          value={hexInput}
          onChange={(e) => handleHexInputChange(e.target.value)}
          className="h-9 text-sm font-mono w-24 sm:w-28"
          maxLength={7}
          placeholder="#FFFFFF"
        />

        {/* Layer label */}
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {layer.label}
        </span>

        {/* Toggle picker button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPickerOpen(!pickerOpen)}
          className="ml-auto text-xs text-muted-foreground"
        >
          {pickerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span className="ml-1 hidden sm:inline">{pickerOpen ? 'Close' : 'Pick Color'}</span>
        </Button>

        {/* Remove button */}
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            aria-label={`Remove layer ${index + 1}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Inline Color Picker */}
      {pickerOpen && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <div className="max-w-[300px]">
            <ColorPickerCanvas
              selectedHex={isValidHexColor(layer.hex) ? layer.hex : '#808080'}
              onColorChange={handlePickerChange}
            />
          </div>
        </div>
      )}

      {/* Filament Matches */}
      {isValidHexColor(layer.hex) && matches.length > 0 && (
        <div className="border-t border-border/50 bg-muted/30 px-3 sm:px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            Best filament matches
          </p>
          <div className="space-y-1.5">
            {matches.map((match) => (
              <HueForgeFilamentMatch key={match.id} filament={match} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
