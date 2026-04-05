import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Search, X, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ColorPickerCanvas } from './ColorPickerCanvas';
import { PopularColors } from './PopularColors';
import { isValidHexColor, normalizeColorHex } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ColorSearchProps {
  /** Trigger button appearance */
  variant?: 'icon' | 'text';
  /** CSS className for customization */
  className?: string;
}

/**
 * ColorSearch - Quick color picker for finding filaments by color
 *
 * Integrates into the main search experience, allowing users to quickly:
 * 1. Pick a color from visual picker or presets
 * 2. Enter a hex code manually
 * 3. Navigate to ColorFinder page with the selected color
 *
 * Emphasizes HueForge TD optimization as FilaScope's differentiator.
 */
export function ColorSearch({ variant = 'icon', className }: ColorSearchProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHex, setSelectedHex] = useState('#DC2626'); // Default red
  const [hexInput, setHexInput] = useState('#DC2626');

  const isValidHex = isValidHexColor(hexInput);
  const canSearch = isValidHexColor(selectedHex);

  const handleColorChange = (hex: string) => {
    setSelectedHex(hex);
    setHexInput(hex);
  };

  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    const normalized = value.startsWith('#') ? value : `#${value}`;
    if (isValidHexColor(normalized)) {
      setSelectedHex(normalized.toUpperCase());
    }
  };

  const handleSearch = () => {
    if (canSearch) {
      const cleanHex = selectedHex.replace('#', '');
      setIsOpen(false);
      navigate(`/colors?hex=${cleanHex}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSearch) {
      handleSearch();
    }
  };

  const popularColors = useMemo(() => [
    { name: 'Red', hex: '#DC2626' },
    { name: 'Orange', hex: '#EA580C' },
    { name: 'Yellow', hex: '#EAB308' },
    { name: 'Green', hex: '#16A34A' },
    { name: 'Blue', hex: '#2563EB' },
    { name: 'Purple', hex: '#9333EA' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Black', hex: '#1A1A1A' },
    { name: 'Gray', hex: '#6B7280' },
  ], []);

  if (variant === 'icon') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative hover:bg-primary/10 hover:text-primary transition-colors",
              className
            )}
            title="Search by color"
          >
            <Palette className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Find by Color</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Color Preview */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
                style={{ backgroundColor: selectedHex }}
              />
              <div className="flex-1 space-y-1">
                <div className="text-xs text-muted-foreground font-mono">
                  {selectedHex.toUpperCase()}
                </div>
                <Input
                  value={hexInput}
                  onChange={(e) => handleHexInputChange(e.target.value)}
                  placeholder="#FF5733"
                  className="h-7 text-xs font-mono"
                  maxLength={7}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>

            {/* Color Picker */}
            <ColorPickerCanvas
              selectedHex={selectedHex}
              onColorChange={handleColorChange}
            />

            {/* Popular Colors - Quick Access */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Popular Colors</p>
              <div className="flex flex-wrap gap-1.5">
                {popularColors.map((color) => {
                  const isSelected = selectedHex.toUpperCase() === color.hex.toUpperCase();
                  return (
                    <button
                      key={color.name}
                      onClick={() => handleColorChange(color.hex)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/50"
                          : "border-border/60 bg-card/50 text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
                      )}
                      title={color.name}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-border/40"
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* HueForge TD Badge */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
              <Lightbulb className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-tight">
                Color search optimized for <span className="text-cyan-600 font-medium">HueForge</span> — results show TD values for perfect lithophane prints.
              </p>
            </div>

            {/* Search Button */}
            <Button
              className="w-full"
              onClick={handleSearch}
              disabled={!canSearch}
            >
              <Search className="w-4 h-4 mr-2" />
              Find Matching Filaments
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Text variant
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 text-xs",
            className
          )}
        >
          <Palette className="w-3.5 h-3.5" />
          Search by Color
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Find by Color</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Color Preview */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
              style={{ backgroundColor: selectedHex }}
            />
            <div className="flex-1 space-y-1">
              <div className="text-xs text-muted-foreground font-mono">
                {selectedHex.toUpperCase()}
              </div>
              <Input
                value={hexInput}
                onChange={(e) => handleHexInputChange(e.target.value)}
                placeholder="#FF5733"
                className="h-7 text-xs font-mono"
                maxLength={7}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>

          {/* Color Picker */}
          <ColorPickerCanvas
            selectedHex={selectedHex}
            onColorChange={handleColorChange}
          />

          {/* Popular Colors */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Popular Colors</p>
            <div className="flex flex-wrap gap-1.5">
              {popularColors.map((color) => {
                const isSelected = selectedHex.toUpperCase() === color.hex.toUpperCase();
                return (
                  <button
                    key={color.name}
                    onClick={() => handleColorChange(color.hex)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/50"
                        : "border-border/60 bg-card/50 text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
                    )}
                    title={color.name}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-border/40"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* HueForge TD Badge */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <Lightbulb className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-tight">
              Color search optimized for <span className="text-cyan-600 font-medium">HueForge</span> — results show TD values for perfect lithophane prints.
            </p>
          </div>

          {/* Search Button */}
          <Button
            className="w-full"
            onClick={handleSearch}
            disabled={!canSearch}
          >
            <Search className="w-4 h-4 mr-2" />
            Find Matching Filaments
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
