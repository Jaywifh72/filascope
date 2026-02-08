import { useState, useMemo, useEffect } from 'react';
import { Plus, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isValidHexColor, normalizeColorHex } from '@/lib/utils';
import { colorDistance, getColorMatchPercent } from '@/lib/colorMatchUtils';
import { HueForgeLayerRow, type LayerData } from './hueforge/HueForgeLayerRow';
import { HueForgeStackSummary } from './hueforge/HueForgeStackSummary';
import { HueForgeEducation } from './hueforge/HueForgeEducation';
import type { ColorFinderFilament } from '@/hooks/useColorFinderFilaments';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_LAYERS: LayerData[] = [
  { hex: '#FFFFFF', label: 'White (base)' },
  { hex: '#87CEEB', label: 'Light color' },
  { hex: '#2E4057', label: 'Dark color' },
  { hex: '#000000', label: 'Black (top)' },
];

const MAX_LAYERS = 8;
const MIN_LAYERS = 2;
const MATCHES_PER_LAYER = 5;

interface HueForgeStackBuilderProps {
  filaments: ColorFinderFilament[];
}

export function HueForgeStackBuilder({ filaments }: HueForgeStackBuilderProps) {
  const [searchParams] = useSearchParams();

  // Initialize layers from URL ?stack= param or defaults
  const [layers, setLayers] = useState<LayerData[]>(() => {
    const stackParam = searchParams.get('stack');
    if (stackParam) {
      const hexes = stackParam.split(',').map(h => `#${h}`).filter(isValidHexColor);
      if (hexes.length >= MIN_LAYERS) {
        return hexes.slice(0, MAX_LAYERS).map((hex, i) => ({
          hex: hex.toUpperCase(),
          label: i === 0 ? 'Base layer' : i === hexes.length - 1 ? 'Top layer' : `Layer ${i + 1}`,
        }));
      }
    }
    return DEFAULT_LAYERS;
  });

  // Filaments with TD data are prioritized, but also include non-TD filaments
  const { tdFilaments, allWithColor } = useMemo(() => {
    const withColor = filaments.filter(f => f.color_hex);
    const withTd = withColor.filter(f => f.transmission_distance != null);
    return { tdFilaments: withTd, allWithColor: withColor };
  }, [filaments]);

  // Compute matches for each layer
  const layerMatches = useMemo(() => {
    return layers.map(layer => {
      if (!isValidHexColor(layer.hex)) return [];

      // Score all filaments: TD filaments get priority
      const scored = allWithColor.map(f => {
        const matchPercent = getColorMatchPercent(layer.hex, normalizeColorHex(f.color_hex));
        const hasTd = f.transmission_distance != null;
        // Sort score: prioritize TD availability, then match quality
        const sortScore = (hasTd ? 100000 : 0) + matchPercent;
        return { ...f, matchPercent, sortScore };
      });

      // Sort by TD priority first, then match quality
      scored.sort((a, b) => b.sortScore - a.sortScore);

      return scored.slice(0, MATCHES_PER_LAYER);
    });
  }, [layers, allWithColor]);

  // Layer management
  const addLayer = () => {
    if (layers.length >= MAX_LAYERS) return;
    setLayers(prev => [
      ...prev.slice(0, -1),
      { hex: '#808080', label: `Layer ${prev.length}` },
      prev[prev.length - 1], // Keep the last layer (black/top) at the end
    ]);
  };

  const removeLayer = (index: number) => {
    if (layers.length <= MIN_LAYERS) return;
    setLayers(prev => prev.filter((_, i) => i !== index));
  };

  const updateLayerHex = (index: number, hex: string) => {
    setLayers(prev => prev.map((l, i) => i === index ? { ...l, hex } : l));
  };

  // Build summary data with best match per layer
  const summaryLayers = useMemo(() => {
    return layers.map((layer, i) => ({
      hex: layer.hex,
      label: layer.label,
      bestMatch: layerMatches[i]?.[0] || null,
    }));
  }, [layers, layerMatches]);

  return (
    <div className="space-y-6">
      {/* Educational intro */}
      <HueForgeEducation />

      {/* Header + Add Layer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-foreground">Build Your Stack</h2>
          <span className="text-xs text-muted-foreground">
            ({layers.length} layer{layers.length !== 1 ? 's' : ''})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addLayer}
          disabled={layers.length >= MAX_LAYERS}
          className="text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Layer
        </Button>
      </div>

      {/* Layer list */}
      <div className="space-y-3">
        {layers.map((layer, idx) => (
          <HueForgeLayerRow
            key={idx}
            layer={layer}
            index={idx}
            totalLayers={layers.length}
            matches={layerMatches[idx] || []}
            onHexChange={(hex) => updateLayerHex(idx, hex)}
            onRemove={() => removeLayer(idx)}
            canRemove={layers.length > MIN_LAYERS}
          />
        ))}
      </div>

      {/* Stack Summary */}
      <HueForgeStackSummary layers={summaryLayers} />
    </div>
  );
}
