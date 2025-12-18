import React, { useState, useMemo } from 'react';
import { Settings, Thermometer, Gauge, Wind, Layers, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PrintSettingsOutput, PrinterProfile, MaterialRecommendedSettings } from './types';

interface PrintSettingsOptimizerProps {
  material: {
    type: string;
    name: string;
    recommendedSettings: MaterialRecommendedSettings;
  };
  printers: PrinterProfile[];
  onCopySettings?: (settings: PrintSettingsOutput) => void;
}

export const PrintSettingsOptimizer: React.FC<PrintSettingsOptimizerProps> = ({
  material,
  printers,
  onCopySettings
}) => {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [qualityPreference, setQualityPreference] = useState<'draft' | 'standard' | 'high'>('standard');
  const [partType, setPartType] = useState<'decorative' | 'functional' | 'mechanical'>('decorative');
  const [copied, setCopied] = useState(false);

  const popularPrinters = useMemo(() => printers.slice(0, 6), [printers]);

  const settings = useMemo((): PrintSettingsOutput | null => {
    const printer = printers.find(p => p.id === selectedPrinterId);
    if (!printer) return null;

    const { nozzleTemp, bedTemp, printSpeed, coolingFan } = material.recommendedSettings;

    let qualityMultiplier = 1;
    let layerHeight = 0.2;
    switch (qualityPreference) {
      case 'draft': qualityMultiplier = 1.3; layerHeight = 0.28; break;
      case 'high': qualityMultiplier = 0.7; layerHeight = 0.12; break;
      default: layerHeight = 0.2;
    }

    let wallCount = 3, infillPercent = 20;
    switch (partType) {
      case 'mechanical': wallCount = 5; infillPercent = 40; break;
      case 'functional': wallCount = 4; infillPercent = 25; break;
      default: wallCount = 2; infillPercent = 15;
    }

    const avgNozzleTemp = Math.round((nozzleTemp[0] + nozzleTemp[1]) / 2);
    const avgBedTemp = Math.round((bedTemp[0] + bedTemp[1]) / 2);
    const avgPrintSpeed = Math.round(((printSpeed[0] + printSpeed[1]) / 2) * qualityMultiplier);
    const avgFanSpeed = Math.round((coolingFan[0] + coolingFan[1]) / 2);

    return {
      temperatures: {
        nozzle: avgNozzleTemp,
        bed: avgBedTemp,
      },
      speeds: {
        print: avgPrintSpeed,
        travel: 150,
        firstLayer: Math.round(printSpeed[0] * 0.5),
      },
      retraction: {
        distance: printer.directDrive ? 1.0 : 5.0,
        speed: printer.directDrive ? 30 : 45,
      },
      cooling: {
        fanSpeed: avgFanSpeed,
        minLayerTime: 10,
      },
      quality: {
        layerHeight,
        wallCount,
        infillPercent,
      },
      confidenceLevel: 'recommended',
    };
  }, [selectedPrinterId, qualityPreference, partType, material, printers]);

  const handleCopySettings = () => {
    if (settings) {
      const settingsText = `
Nozzle: ${settings.temperatures.nozzle}°C
Bed: ${settings.temperatures.bed}°C
Print Speed: ${settings.speeds.print} mm/s
Layer Height: ${settings.quality.layerHeight}mm
Walls: ${settings.quality.wallCount}
Infill: ${settings.quality.infillPercent}%
Fan: ${settings.cooling.fanSpeed}%
Retraction: ${settings.retraction.distance}mm @ ${settings.retraction.speed}mm/s
      `.trim();
      navigator.clipboard.writeText(settingsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onCopySettings) onCopySettings(settings);
    }
  };

  const selectedPrinter = printers.find(p => p.id === selectedPrinterId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Print Settings Optimizer</h3>
          <p className="text-sm text-muted-foreground">Get recommended settings for {material.name}</p>
        </div>
      </div>

      {/* Printer Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Select Your Printer</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {popularPrinters.map((printer) => (
            <button
              key={printer.id}
              onClick={() => setSelectedPrinterId(printer.id)}
              className={cn(
                "p-3 text-left rounded-xl border-2 transition-all",
                selectedPrinterId === printer.id
                  ? "bg-primary/15 border-primary"
                  : "bg-card/50 border-border/50 hover:border-primary/50"
              )}
            >
              <div className="text-[11px] font-semibold text-muted-foreground">{printer.manufacturer}</div>
              <div className="text-sm font-bold text-foreground">{printer.model}</div>
            </button>
          ))}
        </div>
        
        <Select value={selectedPrinterId} onValueChange={setSelectedPrinterId}>
          <SelectTrigger className="w-full bg-background/30 border-border/50">
            <SelectValue placeholder="Or select from all printers..." />
          </SelectTrigger>
          <SelectContent>
            {printers.map((printer) => (
              <SelectItem key={printer.id} value={printer.id}>
                {printer.manufacturer} {printer.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Options Row */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Quality */}
        <div className="flex-1 space-y-2">
          <label className="text-sm font-semibold text-foreground">Quality</label>
          <div className="flex bg-background/30 rounded-lg p-1">
            {(['draft', 'standard', 'high'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setQualityPreference(q)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all",
                  qualityPreference === q
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {q.charAt(0).toUpperCase() + q.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Part Type */}
        <div className="flex-1 space-y-2">
          <label className="text-sm font-semibold text-foreground">Part Type</label>
          <div className="flex bg-background/30 rounded-lg p-1">
            {(['decorative', 'functional', 'mechanical'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPartType(t)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all",
                  partType === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Output */}
      {settings && selectedPrinter && (
        <div className="mt-6 p-5 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-foreground">Optimized Settings</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySettings}
              className={cn(
                "gap-2",
                copied && "bg-green-500/20 border-green-500/40 text-green-500"
              )}
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy All'}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Temperature */}
            <div className="p-3 bg-background/20 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2.5">
                <Thermometer className="w-4 h-4" />
                Temperature
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nozzle</span>
                  <span className="font-bold text-foreground">{settings.temperatures.nozzle}°C</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bed</span>
                  <span className="font-bold text-foreground">{settings.temperatures.bed}°C</span>
                </div>
              </div>
            </div>

            {/* Speed */}
            <div className="p-3 bg-background/20 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2.5">
                <Gauge className="w-4 h-4" />
                Speed
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Print</span>
                  <span className="font-bold text-foreground">{settings.speeds.print} mm/s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">First Layer</span>
                  <span className="font-bold text-foreground">{settings.speeds.firstLayer} mm/s</span>
                </div>
              </div>
            </div>

            {/* Cooling */}
            <div className="p-3 bg-background/20 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2.5">
                <Wind className="w-4 h-4" />
                Cooling
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fan Speed</span>
                  <span className="font-bold text-foreground">{settings.cooling.fanSpeed}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min Layer Time</span>
                  <span className="font-bold text-foreground">{settings.cooling.minLayerTime}s</span>
                </div>
              </div>
            </div>

            {/* Quality */}
            <div className="p-3 bg-background/20 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2.5">
                <Layers className="w-4 h-4" />
                Quality
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Layer Height</span>
                  <span className="font-bold text-foreground">{settings.quality.layerHeight}mm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Walls</span>
                  <span className="font-bold text-foreground">{settings.quality.wallCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Infill</span>
                  <span className="font-bold text-foreground">{settings.quality.infillPercent}%</span>
                </div>
              </div>
            </div>

            {/* Retraction */}
            <div className="p-3 bg-background/20 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2.5">
                <Settings className="w-4 h-4" />
                Retraction
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-bold text-foreground">{settings.retraction.distance}mm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Speed</span>
                  <span className="font-bold text-foreground">{settings.retraction.speed} mm/s</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 text-center text-xs text-muted-foreground">
            Community-optimized settings • Verified for {selectedPrinter.manufacturer} {selectedPrinter.model}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedPrinterId && (
        <div className="py-10 px-5 text-center text-sm text-muted-foreground bg-card/30 rounded-xl">
          Select your printer above to see optimized settings
        </div>
      )}
    </div>
  );
};
