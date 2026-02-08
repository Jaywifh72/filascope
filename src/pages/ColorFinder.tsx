import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Palette, Copy, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { isValidHexColor, normalizeColorHex } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ColorPickerCanvas } from '@/components/color-finder/ColorPickerCanvas';
import { PopularColors } from '@/components/color-finder/PopularColors';
import { ColorFinderResults } from '@/components/color-finder/ColorFinderResults';
import { HueForgeStackBuilder } from '@/components/color-finder/HueForgeStackBuilder';
import { useColorFinderFilaments } from '@/hooks/useColorFinderFilaments';

type Mode = 'single' | 'hueforge';

export default function ColorFinder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialHex = searchParams.get('hex') ? `#${searchParams.get('hex')}` : '#DC2626';
  const initialMode = (searchParams.get('mode') as Mode) || 'single';
  const initialMaterial = searchParams.get('material') || '';
  const initialBrand = searchParams.get('brand') || '';

  const [selectedHex, setSelectedHex] = useState(initialHex);
  const [hexInput, setHexInput] = useState(initialHex);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [materialFilter, setMaterialFilter] = useState(initialMaterial);
  const [brandFilter, setBrandFilter] = useState(initialBrand);

  const { data: filaments = [], isLoading } = useColorFinderFilaments();

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    const cleanHex = selectedHex.replace('#', '');
    if (cleanHex && cleanHex !== 'DC2626') params.hex = cleanHex;
    if (mode !== 'single') params.mode = mode;
    if (materialFilter) params.material = materialFilter;
    if (brandFilter) params.brand = brandFilter;
    setSearchParams(params, { replace: true });
  }, [selectedHex, mode, materialFilter, brandFilter, setSearchParams]);

  const handleColorChange = useCallback((hex: string) => {
    setSelectedHex(hex);
    setHexInput(hex);
  }, []);

  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    const normalized = value.startsWith('#') ? value : `#${value}`;
    if (isValidHexColor(normalized)) {
      setSelectedHex(normalized.toUpperCase());
    }
  };

  const handleCopyHex = () => {
    navigator.clipboard.writeText(selectedHex.toUpperCase());
    toast.success(`Copied ${selectedHex.toUpperCase()}`);
  };

  return (
    <>
      <Helmet>
        <title>Find by Color | FilaScope</title>
        <meta name="description" content="Find 3D printer filaments by color — pick any color or enter a hex code to discover matching filaments from 42+ brands with pricing." />
        <meta property="og:description" content="Find 3D printer filaments by color — pick any color or enter a hex code to discover matching filaments from 42+ brands with pricing." />
      </Helmet>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <Palette className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Find by Color</h1>
              <p className="text-sm text-muted-foreground">Pick a color to find matching filaments</p>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-card/60 rounded-lg p-0.5 border border-border/50 w-fit">
          <button
            onClick={() => setMode('single')}
            className={cn(
              "px-4 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5",
              mode === 'single'
                ? "bg-primary/20 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Palette className="w-3.5 h-3.5" /> Single Color
          </button>
          <button
            onClick={() => setMode('hueforge')}
            className={cn(
              "px-4 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5",
              mode === 'hueforge'
                ? "bg-amber-500/20 text-amber-400 font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="w-3.5 h-3.5" /> HueForge Stack
          </button>
        </div>

        {mode === 'single' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
            {/* Left Column: Picker */}
            <div className="space-y-6">
              {/* Color Preview */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl border-2 border-border shadow-lg"
                  style={{ backgroundColor: selectedHex }}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-bold text-foreground">
                      {selectedHex.toUpperCase()}
                    </span>
                    <button
                      onClick={handleCopyHex}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Copy hex code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Selected color</p>
                </div>
              </div>

              {/* Canvas Picker */}
              <ColorPickerCanvas
                selectedHex={selectedHex}
                onColorChange={handleColorChange}
              />

              {/* Hex Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Enter Hex Code
                </label>
                <Input
                  value={hexInput}
                  onChange={(e) => handleHexInputChange(e.target.value)}
                  placeholder="#FF5733"
                  className="font-mono h-9"
                  maxLength={7}
                />
              </div>

              {/* Popular Colors */}
              <PopularColors
                selectedHex={selectedHex}
                onSelectColor={handleColorChange}
              />
            </div>

            {/* Right Column: Results */}
            <div>
              <ColorFinderResults
                filaments={filaments}
                searchHex={selectedHex}
                isLoading={isLoading}
                materialFilter={materialFilter}
                brandFilter={brandFilter}
                onMaterialChange={setMaterialFilter}
                onBrandChange={setBrandFilter}
              />
            </div>
          </div>
        ) : (
          /* HueForge Stack Mode */
          <div className="max-w-3xl">
            <HueForgeStackBuilder filaments={filaments} />
          </div>
        )}
      </div>
    </>
  );
}
