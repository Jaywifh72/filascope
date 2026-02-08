import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Box, Layers, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FilamentUsageOutput } from './types';
import { SpoolUsageVisual } from './SpoolUsageVisual';
import { CalculatorShareModal } from './CalculatorShareModal';
import { GcodeParser } from './GcodeParser';

interface FilamentUsageCalculatorProps {
  filamentDensity: number; // g/cm³
  spoolWeight: number; // grams
  currentPrice: number; // price per kg
  filamentName?: string;
  filamentMaterial?: string;
  buyMoreUrl?: string;
  onCalculate?: (result: FilamentUsageOutput) => void;
  /** Currency symbol for display (e.g., "C$", "€") */
  currencySymbol?: string;
  /** Currency code (e.g., "CAD", "EUR") */
  currencyCode?: string;
  /** Whether the price is a converted estimate */
  isConverted?: boolean;
}

export const FilamentUsageCalculator: React.FC<FilamentUsageCalculatorProps> = ({
  filamentDensity = 1.24,
  spoolWeight = 1000,
  currentPrice = 25,
  filamentName = 'Filament',
  filamentMaterial = 'PLA',
  buyMoreUrl,
  onCalculate,
  currencySymbol = '$',
  currencyCode = 'USD',
  isConverted = false,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [method, setMethod] = useState<'dimensions' | 'weight' | 'gcode'>('dimensions');
  const [length, setLength] = useState('100');
  const [width, setWidth] = useState('100');
  const [height, setHeight] = useState('50');
  const [unit, setUnit] = useState<'mm' | 'cm' | 'inches'>('mm');
  const [slicerWeight, setSlicerWeight] = useState('');
  const [infill, setInfill] = useState(20);
  const [wallCount, setWallCount] = useState(3);
  const [layerHeight, setLayerHeight] = useState('0.2');
  const [supportEnabled, setSupportEnabled] = useState(false);
  const [supportDensity, setSupportDensity] = useState(15);
  const [gcodeParseTime, setGcodeParseTime] = useState<string | null>(null);

  const result = useMemo<FilamentUsageOutput | null>(() => {
    // Weight-based calculation (from slicer or gcode)
    if ((method === 'weight' || method === 'gcode') && slicerWeight) {
      const weight = parseFloat(slicerWeight);
      if (isNaN(weight) || weight <= 0) return null;

      const wasteEstimate = weight * 0.05;
      const totalWithWaste = weight + wasteEstimate;
      const filamentDiameterCm = 0.175 / 2; // 1.75mm diameter
      const crossSectionArea = Math.PI * Math.pow(filamentDiameterCm, 2);
      const volumeCm3 = weight / filamentDensity;
      const lengthCm = volumeCm3 / crossSectionArea;
      const lengthMeters = lengthCm / 100;

      return {
        totalGrams: Math.round(weight * 10) / 10,
        totalMeters: Math.round(lengthMeters * 10) / 10,
        spoolsNeeded: Math.ceil(totalWithWaste / spoolWeight),
        spoolPercentUsed: Math.round((totalWithWaste / spoolWeight) * 100 * 10) / 10,
        wasteEstimate: Math.round(wasteEstimate * 10) / 10,
        confidenceLevel: method === 'gcode' ? 'high' : 'high',
        breakdown: {
          walls: Math.round(weight * 0.3 * 10) / 10,
          infill: Math.round(weight * 0.4 * 10) / 10,
          topBottom: Math.round(weight * 0.2 * 10) / 10,
          support: 0,
          brim: Math.round(weight * 0.1 * 10) / 10
        }
      };
    }

    // Dimensions-based calculation
    if (method === 'dimensions') {
      let l = parseFloat(length);
      let w = parseFloat(width);
      let h = parseFloat(height);

      if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) return null;

      // Convert to mm
      if (unit === 'cm') {
        l *= 10;
        w *= 10;
        h *= 10;
      } else if (unit === 'inches') {
        l *= 25.4;
        w *= 25.4;
        h *= 25.4;
      }

      const nozzleWidth = 0.4;
      const layerH = parseFloat(layerHeight);
      const outerVolume = l * w * h;

      // Calculate shell volume
      const wallThickness = wallCount * nozzleWidth;
      const topBottomThickness = layerH * 4;
      const innerL = Math.max(0, l - 2 * wallThickness);
      const innerW = Math.max(0, w - 2 * wallThickness);
      const innerH = Math.max(0, h - 2 * topBottomThickness);
      const innerVolume = innerL * innerW * innerH;

      const shellVolume = outerVolume - innerVolume;
      const infillVolume = innerVolume * (infill / 100);
      const supportVolume = supportEnabled ? outerVolume * (supportDensity / 100) * 0.5 : 0;
      const brimVolume = l * w * layerH * 5; // 5mm brim

      const totalVolumeMm3 = shellVolume + infillVolume + supportVolume + brimVolume;
      const totalVolumeCm3 = totalVolumeMm3 / 1000;
      const totalGrams = totalVolumeCm3 * filamentDensity;

      // Calculate length
      const filamentDiameterCm = 0.175 / 2;
      const crossSectionArea = Math.PI * Math.pow(filamentDiameterCm, 2);
      const lengthCm = totalVolumeCm3 / crossSectionArea;
      const lengthMeters = lengthCm / 100;

      const wasteEstimate = totalGrams * 0.1;
      const totalWithWaste = totalGrams + wasteEstimate;

      // Breakdown calculations
      const wallGrams = (shellVolume * 0.6) / 1000 * filamentDensity;
      const topBottomGrams = (shellVolume * 0.4) / 1000 * filamentDensity;
      const infillGrams = infillVolume / 1000 * filamentDensity;
      const supportGrams = supportVolume / 1000 * filamentDensity;
      const brimGrams = brimVolume / 1000 * filamentDensity;

      return {
        totalGrams: Math.round(totalGrams * 10) / 10,
        totalMeters: Math.round(lengthMeters * 10) / 10,
        spoolsNeeded: Math.ceil(totalWithWaste / spoolWeight),
        spoolPercentUsed: Math.round((totalWithWaste / spoolWeight) * 100 * 10) / 10,
        wasteEstimate: Math.round(wasteEstimate * 10) / 10,
        confidenceLevel: 'medium',
        breakdown: {
          walls: Math.round(wallGrams * 10) / 10,
          infill: Math.round(infillGrams * 10) / 10,
          topBottom: Math.round(topBottomGrams * 10) / 10,
          support: Math.round(supportGrams * 10) / 10,
          brim: Math.round(brimGrams * 10) / 10
        }
      };
    }

    return null;
  }, [method, length, width, height, unit, slicerWeight, infill, wallCount, layerHeight, supportEnabled, supportDensity, filamentDensity, spoolWeight]);

  useEffect(() => {
    if (result && onCalculate) {
      onCalculate(result);
    }
  }, [result, onCalculate]);

  const prefix = isConverted ? '~' : '';
  const materialCost = result ? (result.totalGrams / 1000) * currentPrice : 0;

  return (
    <div className="bg-gradient-to-br from-primary/5 via-card to-primary/10 border border-primary/20 rounded-xl p-5">
      {/* Header */}
      <div className="mb-5">
        <h3 className="flex items-center gap-2.5 text-lg font-bold text-foreground mb-1">
          <Calculator className="w-5 h-5 text-primary" />
          Filament Usage Calculator
        </h3>
        <p className="text-sm text-muted-foreground">
          Estimate how much filament you'll need for your print
        </p>
      </div>

      {/* Method Toggle */}
      <div className="flex gap-2 p-1 bg-muted/30 rounded-lg mb-5">
        <button
          onClick={() => setMethod('dimensions')}
          className={cn(
            "flex items-center gap-2 flex-1 px-3 py-2.5 rounded-md text-sm font-semibold transition-all",
            method === 'dimensions'
              ? "bg-primary/15 border border-primary/40 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Box className="w-4 h-4" />
          Dimensions
        </button>
        <button
          onClick={() => setMethod('weight')}
          className={cn(
            "flex items-center gap-2 flex-1 px-3 py-2.5 rounded-md text-sm font-semibold transition-all",
            method === 'weight'
              ? "bg-primary/15 border border-primary/40 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Layers className="w-4 h-4" />
          From Slicer
        </button>
        <button
          onClick={() => setMethod('gcode')}
          className={cn(
            "flex items-center gap-2 flex-1 px-3 py-2.5 rounded-md text-sm font-semibold transition-all",
            method === 'gcode'
              ? "bg-primary/15 border border-primary/40 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Calculator className="w-4 h-4" />
          .gcode
        </button>
      </div>

      {/* Dimensions Input */}
      {method === 'dimensions' && (
        <div className="mb-5 pb-5 border-b border-border/50">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">
            Part Dimensions (bounding box)
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Length</Label>
              <Input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                min="1"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Width</Label>
              <Input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                min="1"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Height</Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min="1"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Unit</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as typeof unit)}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm">mm</SelectItem>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="inches">inches</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Enter bounding box dimensions. For complex shapes, results are approximate.
          </p>
        </div>
      )}

      {/* Slicer Weight Input */}
      {method === 'weight' && (
        <div className="mb-5 pb-5 border-b border-border/50">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">
            Estimated Weight from Slicer
          </Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={slicerWeight}
              onChange={(e) => setSlicerWeight(e.target.value)}
              min="1"
              placeholder="Enter weight"
              className="bg-background/50 max-w-[200px]"
            />
            <span className="text-sm text-muted-foreground font-medium">grams</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-success" />
            Most accurate method. Find this in your slicer's print summary.
          </p>
        </div>
      )}

      {/* Gcode File Upload */}
      {method === 'gcode' && (
        <div className="mb-5 pb-5 border-b border-border/50">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">
            Import from .gcode File
          </Label>
          <GcodeParser
            onParsed={(result) => {
              if (result.weightGrams) {
                setSlicerWeight(result.weightGrams.toString());
              }
              if (result.printTime) {
                setGcodeParseTime(result.printTime);
              }
              if (result.layerHeight) {
                setLayerHeight(result.layerHeight.toString());
              }
            }}
          />
          {gcodeParseTime && (
            <p className="text-xs text-muted-foreground mt-2">
              Estimated print time from gcode: <span className="font-medium text-foreground">{gcodeParseTime}</span>
            </p>
          )}
        </div>
      )}

      {/* Print Settings (for dimensions mode) */}
      {method === 'dimensions' && (
        <div className="mb-5 pb-5 border-b border-border/50">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">
            Print Settings
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Infill */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-muted-foreground">Infill</Label>
                <span className="text-xs font-bold text-primary">{infill}%</span>
              </div>
              <Slider
                value={[infill]}
                onValueChange={([v]) => setInfill(v)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Wall Count */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Walls</Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWallCount(Math.max(1, wallCount - 1))}
                  className="w-8 h-8 rounded-md bg-muted/50 hover:bg-muted text-foreground font-bold transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-foreground">{wallCount}</span>
                <button
                  onClick={() => setWallCount(Math.min(10, wallCount + 1))}
                  className="w-8 h-8 rounded-md bg-muted/50 hover:bg-muted text-foreground font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Layer Height */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Layer Height</Label>
              <Select value={layerHeight} onValueChange={setLayerHeight}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">0.1mm (Fine)</SelectItem>
                  <SelectItem value="0.16">0.16mm (Quality)</SelectItem>
                  <SelectItem value="0.2">0.2mm (Standard)</SelectItem>
                  <SelectItem value="0.28">0.28mm (Draft)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Supports Toggle */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Supports</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={supportEnabled}
                  onCheckedChange={setSupportEnabled}
                />
                <span className="text-sm text-foreground">
                  {supportEnabled ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>

          {/* Support Density */}
          {supportEnabled && (
            <div className="mt-4 max-w-xs">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs text-muted-foreground">Support Density</Label>
                <span className="text-xs font-bold text-primary">{supportDensity}%</span>
              </div>
              <Slider
                value={[supportDensity]}
                onValueChange={([v]) => setSupportDensity(v)}
                min={5}
                max={50}
                step={5}
              />
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Estimated Usage</h4>
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold",
              result.confidenceLevel === 'high'
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            )}>
              {result.confidenceLevel === 'high' ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              {result.confidenceLevel} confidence
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-extrabold text-foreground">{result.totalGrams}g</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                Filament Needed
              </div>
            </div>
            <div className="bg-muted/30 border border-border/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-extrabold text-foreground">{result.totalMeters}m</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                Length
              </div>
            </div>
            <div className="bg-muted/30 border border-border/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-extrabold text-foreground">{result.spoolsNeeded}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                {result.spoolsNeeded === 1 ? 'Spool' : 'Spools'} Needed
              </div>
            </div>
            <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-extrabold text-success">
                {prefix}{currencySymbol}{materialCost.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                Material Cost
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {result.totalGrams}g × {prefix}{currencySymbol}{(currentPrice / 1000).toFixed(4)}/g
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-muted/20 rounded-lg p-4">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Usage Breakdown
            </h5>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Walls</span>
                <span className="font-semibold text-foreground">{result.breakdown.walls}g</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Infill</span>
                <span className="font-semibold text-foreground">{result.breakdown.infill}g</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Top/Bottom</span>
                <span className="font-semibold text-foreground">{result.breakdown.topBottom}g</span>
              </div>
              {result.breakdown.support > 0 && (
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Support</span>
                  <span className="font-semibold text-foreground">{result.breakdown.support}g</span>
                </div>
              )}
            </div>
          </div>

          {/* Recommendation */}
          <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg text-sm",
            result.spoolPercentUsed < 80
              ? "bg-success/10 border border-success/20"
              : "bg-warning/10 border border-warning/20"
          )}>
            {result.spoolPercentUsed < 80 ? (
              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            )}
            <p className="text-foreground">
              {result.spoolPercentUsed < 80 ? (
                <>One spool ({spoolWeight}g) will be enough with <span className="font-semibold">{Math.round(100 - result.spoolPercentUsed)}%</span> leftover.</>
              ) : (
                <>You'll need <span className="font-semibold">{result.spoolsNeeded} spools</span> for this print.</>
              )}
            </p>
          </div>

          {/* Spool Usage Visualization */}
          <SpoolUsageVisual
            spoolWeight={spoolWeight}
            usagePerPrint={result.totalGrams}
            filamentName={filamentName}
            filamentPrice={currentPrice}
            buyMoreUrl={buyMoreUrl}
            onShare={() => setShowShareModal(true)}
            currencySymbol={currencySymbol}
            currencyCode={currencyCode}
            isConverted={isConverted}
          />
        </div>
      )}

      {/* Share Modal */}
      {result && (
        <CalculatorShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          calculationData={{
            filamentName,
            filamentMaterial,
            usageGrams: result.totalGrams,
            totalCost: materialCost,
            printsPerSpool: Math.floor(spoolWeight / result.totalGrams),
            costPerPrint: materialCost,
            currencySymbol,
            currencyCode,
            isConverted,
            spoolWeight,
          }}
        />
      )}
    </div>
  );
};

export default FilamentUsageCalculator;
