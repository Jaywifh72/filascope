import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { Breadcrumbs, BreadcrumbSchema } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { Layers, RotateCcw, Clipboard, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLayerPreviewState } from '@/components/hueforge/useLayerPreviewState';
import { LayerSlotSelector } from '@/components/hueforge/layer-preview/LayerSlotSelector';
import { LayerStackVisualization } from '@/components/hueforge/layer-preview/LayerStackVisualization';
import { LayerMetricsTable } from '@/components/hueforge/layer-preview/LayerMetricsTable';
import { LayerPreviewPresets } from '@/components/hueforge/layer-preview/LayerPreviewPresets';
import { LayerPreviewTips } from '@/components/hueforge/layer-preview/LayerPreviewTips';
import type { TDFilament } from '@/components/hueforge/SubstituteFilamentPicker';
import { HueForgeToolsNav } from '@/components/hueforge/HueForgeToolsNav';

export default function HueForgeLayerPreview() {
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['hueforge-td-database'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select(
          'id, product_title, vendor, material, color_family, color_hex, transmission_distance, variant_price, net_weight_g, product_handle, featured_image'
        )
        .not('transmission_distance', 'is', null)
        .order('transmission_distance', { ascending: true });
      if (error) throw error;
      return data as TDFilament[];
    },
  });

  const { state, dispatch } = useLayerPreviewState(true);
  const [copied, setCopied] = useState(false);

  const copyLayerConfig = useCallback(() => {
    if (!filaments) return;
    const parts = state.layers
      .map((l, i) => {
        if (!l.filamentId) return null;
        const f = filaments.find((fi) => fi.id === l.filamentId);
        if (!f) return null;
        const label = i === 0 ? 'Base' : i === state.layers.length - 1 ? 'Top' : `Mid`;
        return `${label}(${l.layerCount}x): ${f.vendor} ${f.product_title} TD ${f.transmission_distance?.toFixed(2) ?? '?'}`;
      })
      .filter(Boolean);
    if (!parts.length) return;
    const text = `HueForge Layer Setup: ${parts.join(' | ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [state.layers, filaments]);

  const hasFilaments = state.layers.some((l) => l.filamentId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <DocumentHead
        title="HueForge Layer Stacking Preview — Visualize Filament Layers"
        description="Experiment with HueForge layer stacking before you print. Select filaments, set layer counts, and preview how TD values affect light transmission and color blending."
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://filascope.com' },
          { name: 'HueForge TD Database', url: 'https://filascope.com/hueforge-td-database' },
          { name: 'Layer Preview', url: 'https://filascope.com/hueforge-layer-preview' },
        ]}
      />
      <Breadcrumbs
        items={[
          { name: 'HueForge TD Database', url: '/hueforge-td-database' },
          { name: 'Layer Preview', url: '/hueforge-layer-preview' },
        ]}
        className="max-w-7xl mx-auto px-4 pt-6 pb-1"
      />
      <HueForgeToolsNav />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <section className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-sm">
            <Layers className="w-3 h-3 mr-1 text-primary" />
            Layer Preview Tool
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-primary bg-clip-text text-transparent">
            HueForge Layer Stacking Preview
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Visualize how filament layers stack and blend based on TD values. Experiment with layer counts before you print.
          </p>
        </section>

        {isLoading ? (
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
            <div className="md:col-span-3">
              <Skeleton className="h-80" />
            </div>
          </div>
        ) : filaments && filaments.length > 0 ? (
          <div className="grid md:grid-cols-5 gap-8">
            {/* Left: Slots + Presets + Tips */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center justify-between gap-2">
                <LayerPreviewPresets filaments={filaments} dispatch={dispatch} />
                <div className="flex items-center gap-1 shrink-0">
                  {hasFilaments && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyLayerConfig}
                      className="text-xs gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy Config'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: 'CLEAR' })}
                    className="shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
                  </Button>
                </div>
              </div>
              <LayerSlotSelector layers={state.layers} filaments={filaments} dispatch={dispatch} />
              <LayerPreviewTips />
            </div>

            {/* Right: Visualization + Metrics */}
            <div className="md:col-span-3 space-y-8">
              <div className="rounded-xl border border-border/50 bg-card/30 p-6">
                <LayerStackVisualization layers={state.layers} filaments={filaments} />
              </div>
              <LayerMetricsTable layers={state.layers} filaments={filaments} />
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No filaments with TD data found.</p>
        )}
      </div>
    </div>
  );
}
