import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, CheckCircle, Plus, Trash2, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Default electricity rates by region ($/kWh equivalent in local currency)
const REGIONAL_ELECTRICITY_DEFAULTS: Record<string, string> = {
  US: '0.12',
  CA: '0.13',
  UK: '0.28',
  EU: '0.25',
  AU: '0.30',
  JP: '27',   // ¥27/kWh
  CN: '0.54',
};

// Default wear costs by region (local currency per hour)
const REGIONAL_WEAR_DEFAULTS: Record<string, string> = {
  US: '0.50',
  CA: '0.65',
  UK: '0.40',
  EU: '0.45',
  AU: '0.70',
  JP: '70',
  CN: '3.50',
};

interface ExtraMaterial {
  id: string;
  name: string;
  grams: string;
  pricePerKg: string;
}

interface PrintCostCalculatorProps {
  filamentPrice: number;
  filamentName: string;
  usageGrams?: number;
  /** Currency symbol to use (e.g., "C$", "€", "£"). Defaults to "$" */
  currencySymbol?: string;
  /** Currency code for display (e.g., "CAD", "EUR") */
  currencyCode?: string;
  /** User's region code for electricity rate defaults */
  regionCode?: string;
  /** Whether the price is a converted estimate */
  isConverted?: boolean;
  /** Spool weight in grams */
  spoolWeight?: number;
}

export const PrintCostCalculator: React.FC<PrintCostCalculatorProps> = ({
  filamentPrice,
  filamentName,
  usageGrams,
  currencySymbol = '$',
  currencyCode = 'USD',
  regionCode = 'US',
  isConverted = false,
  spoolWeight = 1000,
}) => {
  const [filamentGrams, setFilamentGrams] = useState(usageGrams?.toString() || '100');
  const [printTimeHours, setPrintTimeHours] = useState('4');
  const [electricityRate, setElectricityRate] = useState(REGIONAL_ELECTRICITY_DEFAULTS[regionCode] || '0.12');
  const [printerWattage, setPrinterWattage] = useState('200');
  const [includeWear, setIncludeWear] = useState(false);
  const [wearCostPerHour, setWearCostPerHour] = useState(REGIONAL_WEAR_DEFAULTS[regionCode] || '0.50');
  const [copies, setCopies] = useState(1);
  const [extraMaterials, setExtraMaterials] = useState<ExtraMaterial[]>([]);

  useEffect(() => {
    if (usageGrams) setFilamentGrams(usageGrams.toString());
  }, [usageGrams]);

  // Update defaults when region changes
  useEffect(() => {
    setElectricityRate(REGIONAL_ELECTRICITY_DEFAULTS[regionCode] || '0.12');
    setWearCostPerHour(REGIONAL_WEAR_DEFAULTS[regionCode] || '0.50');
  }, [regionCode]);

  const addExtraMaterial = () => {
    setExtraMaterials(prev => [...prev, {
      id: crypto.randomUUID(),
      name: `Color ${prev.length + 2}`,
      grams: '20',
      pricePerKg: filamentPrice.toFixed(2),
    }]);
  };

  const removeExtraMaterial = (id: string) => {
    setExtraMaterials(prev => prev.filter(m => m.id !== id));
  };

  const updateExtraMaterial = (id: string, field: keyof ExtraMaterial, value: string) => {
    setExtraMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const costs = useMemo(() => {
    const grams = parseFloat(filamentGrams) || 0;
    const hours = parseFloat(printTimeHours) || 0;
    const elecRate = parseFloat(electricityRate) || 0;
    const watts = parseFloat(printerWattage) || 0;
    const wearRate = includeWear ? (parseFloat(wearCostPerHour) || 0) : 0;

    // Primary material cost
    const primaryMaterialCost = (grams / 1000) * filamentPrice;

    // Extra materials cost
    const extraMaterialCosts = extraMaterials.map(m => {
      const g = parseFloat(m.grams) || 0;
      const p = parseFloat(m.pricePerKg) || 0;
      return { name: m.name, cost: (g / 1000) * p, grams: g };
    });
    const totalExtraCost = extraMaterialCosts.reduce((sum, m) => sum + m.cost, 0);
    const totalExtraGrams = extraMaterialCosts.reduce((sum, m) => sum + m.grams, 0);

    const totalMaterialCost = primaryMaterialCost + totalExtraCost;
    const totalGrams = grams + totalExtraGrams;

    const electricityCost = (watts / 1000) * hours * elecRate;
    const wearCost = hours * wearRate;
    const totalCostPerPrint = totalMaterialCost + electricityCost + wearCost;
    const totalCostAllCopies = totalCostPerPrint * copies;
    const costPerGram = totalGrams > 0 ? totalCostPerPrint / totalGrams : 0;

    const estimatedRetailValue = totalCostPerPrint * 5;
    const savings = estimatedRetailValue - totalCostPerPrint;
    const savingsPercent = estimatedRetailValue > 0 ? (savings / estimatedRetailValue) * 100 : 0;

    // Calculate percentages for breakdown bar
    const total = totalMaterialCost + electricityCost + wearCost;
    const materialPercent = total > 0 ? (totalMaterialCost / total) * 100 : 0;
    const electricityPercent = total > 0 ? (electricityCost / total) * 100 : 0;
    const wearPercent = total > 0 ? (wearCost / total) * 100 : 0;

    // Batch/spool calculation
    const printsPerSpool = grams > 0 ? Math.floor(spoolWeight / grams) : 0;
    const spoolsNeeded = grams > 0 ? Math.ceil((grams * copies) / spoolWeight) : 0;

    return {
      primaryMaterial: primaryMaterialCost,
      extraMaterialCosts,
      totalMaterial: totalMaterialCost,
      electricity: electricityCost,
      wear: wearCost,
      totalPerPrint: totalCostPerPrint,
      totalAllCopies: totalCostAllCopies,
      costPerGram,
      estimatedRetailValue,
      savings,
      savingsPercent,
      materialPercent,
      electricityPercent,
      wearPercent,
      printsPerSpool,
      spoolsNeeded,
      totalGrams,
    };
  }, [filamentGrams, printTimeHours, electricityRate, printerWattage, includeWear, wearCostPerHour, copies, filamentPrice, extraMaterials, spoolWeight]);

  // Use non-decimal formatting for JPY/KRW style currencies
  const isNonDecimalCurrency = regionCode === 'JP' || regionCode === 'CN';
  const prefix = isConverted ? '~' : '';
  const formatAmount = (amount: number, decimals = 2) => {
    if (isNonDecimalCurrency) return `${prefix}${currencySymbol}${Math.round(amount)}`;
    return `${prefix}${currencySymbol}${amount.toFixed(decimals)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-green-500/10">
          <DollarSign className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Print Cost Calculator</h3>
          <p className="text-sm text-muted-foreground">
            Estimate the true cost of your print
            {isConverted && (
              <span className="ml-1 text-xs text-muted-foreground/70">
                (prices converted to {currencyCode})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Primary Filament Used */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Filament Used</label>
          <div className="relative">
            <Input
              type="number"
              value={filamentGrams}
              onChange={(e) => setFilamentGrams(e.target.value)}
              min="1"
              className="pr-14 bg-background/30 border-border/50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              grams
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatAmount(filamentPrice)}/kg {currencyCode} for {filamentName}
          </p>
        </div>

        {/* Print Time */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Print Time</label>
          <div className="relative">
            <Input
              type="number"
              value={printTimeHours}
              onChange={(e) => setPrintTimeHours(e.target.value)}
              min="0.1"
              step="0.5"
              className="pr-14 bg-background/30 border-border/50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              hours
            </span>
          </div>
        </div>

        {/* Electricity Rate */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Electricity Rate</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {currencySymbol}
            </span>
            <Input
              type="number"
              value={electricityRate}
              onChange={(e) => setElectricityRate(e.target.value)}
              min="0.01"
              step="0.01"
              className="pl-7 pr-12 bg-background/30 border-border/50"
              style={{ paddingLeft: `${Math.max(28, currencySymbol.length * 10 + 16)}px` }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              /kWh
            </span>
          </div>
        </div>

        {/* Printer Wattage */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Printer Wattage</label>
          <div className="relative">
            <Input
              type="number"
              value={printerWattage}
              onChange={(e) => setPrinterWattage(e.target.value)}
              min="50"
              step="10"
              className="pr-14 bg-background/30 border-border/50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              watts
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Filament Section */}
      {extraMaterials.length > 0 && (
        <div className="space-y-3 p-4 bg-primary/5 border border-primary/15 rounded-xl">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            Additional Colors/Materials
          </h4>
          {extraMaterials.map((mat) => (
            <div key={mat.id} className="flex items-center gap-2">
              <Input
                value={mat.name}
                onChange={(e) => updateExtraMaterial(mat.id, 'name', e.target.value)}
                className="max-w-[120px] bg-background/50 border-border/50 text-sm"
                placeholder="Name"
              />
              <div className="relative flex-1">
                <Input
                  type="number"
                  value={mat.grams}
                  onChange={(e) => updateExtraMaterial(mat.id, 'grams', e.target.value)}
                  min="1"
                  className="pr-10 bg-background/50 border-border/50 text-sm"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
              </div>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencySymbol}</span>
                <Input
                  type="number"
                  value={mat.pricePerKg}
                  onChange={(e) => updateExtraMaterial(mat.id, 'pricePerKg', e.target.value)}
                  min="0"
                  step="0.01"
                  className="pl-7 pr-10 bg-background/50 border-border/50 text-sm"
                  style={{ paddingLeft: `${Math.max(24, currencySymbol.length * 8 + 14)}px` }}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/kg</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeExtraMaterial(mat.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={addExtraMaterial}
        className="gap-2 w-full"
      >
        <Plus className="w-4 h-4" />
        Add Color / Material
      </Button>

      {/* Wear Section */}
      <div className="p-4 bg-violet-500/5 border border-violet-500/15 rounded-xl">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer">
            <Switch
              checked={includeWear}
              onCheckedChange={setIncludeWear}
            />
            Include printer wear & maintenance
          </label>
        </div>
        
        {includeWear && (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-semibold text-foreground">Wear Cost per Hour</label>
            <div className="relative max-w-[140px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {currencySymbol}
              </span>
              <Input
                type="number"
                value={wearCostPerHour}
                onChange={(e) => setWearCostPerHour(e.target.value)}
                min="0"
                step="0.1"
                className="pl-7 pr-12 bg-background/30 border-border/50"
                style={{ paddingLeft: `${Math.max(28, currencySymbol.length * 10 + 16)}px` }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                /hour
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Copies Section */}
      <div className="pt-5 border-t border-border/30 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">Number of Copies</label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCopies(Math.max(1, copies - 1))}
              className="flex items-center justify-center w-9 h-9 bg-card/50 border border-border/50 rounded-lg text-xl font-semibold text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
            >
              −
            </button>
            <span className="min-w-[40px] text-lg font-bold text-foreground text-center">
              {copies}
            </span>
            <button
              onClick={() => setCopies(copies + 1)}
              className="flex items-center justify-center w-9 h-9 bg-card/50 border border-border/50 rounded-lg text-xl font-semibold text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Spools needed for batch */}
        {copies > 1 && costs.printsPerSpool > 0 && (
          <div className="p-3 bg-muted/20 rounded-lg text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{costs.printsPerSpool}</span> prints per spool
            {' × '}
            <span className="font-medium text-foreground">{copies}</span> copies
            {' = '}
            <span className="font-bold text-primary">{costs.spoolsNeeded} {costs.spoolsNeeded === 1 ? 'spool' : 'spools'}</span> needed
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="p-5 bg-card/50 border border-border/50 rounded-xl space-y-4">
        <h4 className="text-base font-bold text-foreground">Cost Breakdown</h4>

        {/* Cost Rows */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              Material{extraMaterials.length > 0 ? ` (${filamentName})` : ''}
            </span>
            <span className="text-[15px] font-semibold text-foreground">
              {formatAmount(costs.primaryMaterial)}
            </span>
          </div>

          {/* Extra material costs */}
          {costs.extraMaterialCosts.map((m, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                {m.name} ({m.grams}g)
              </span>
              <span className="text-[15px] font-semibold text-foreground">
                {formatAmount(m.cost)}
              </span>
            </div>
          ))}

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Electricity
            </span>
            <span className="text-[15px] font-semibold text-foreground">
              {formatAmount(costs.electricity)}
            </span>
          </div>

          {includeWear && (
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                Wear
              </span>
              <span className="text-[15px] font-semibold text-foreground">
                {formatAmount(costs.wear)}
              </span>
            </div>
          )}

          {/* Total per Print */}
          <div className="flex justify-between items-center pt-3 mt-1 border-t border-border/50">
            <span className="text-[15px] font-semibold text-foreground">Total per Print</span>
            <span className="text-xl font-extrabold text-green-500">
              {formatAmount(costs.totalPerPrint)}
              <span className="text-xs font-normal text-muted-foreground ml-1">{currencyCode}</span>
            </span>
          </div>

          {/* Total for Copies */}
          {copies > 1 && (
            <div className="flex justify-between items-center pt-3 border-t border-dashed border-border/50">
              <span className="text-[15px] font-semibold text-foreground">
                Total for {copies} Copies
              </span>
              <span className="text-xl font-extrabold text-green-500">
                {formatAmount(costs.totalAllCopies)}
                <span className="text-xs font-normal text-muted-foreground ml-1">{currencyCode}</span>
              </span>
            </div>
          )}
        </div>

        {/* Breakdown Bar */}
        <div className="flex h-2 mt-4 bg-muted/30 rounded overflow-hidden">
          <div
            className="bg-primary transition-all"
            style={{ width: `${costs.materialPercent}%` }}
          />
          <div
            className="bg-amber-500 transition-all"
            style={{ width: `${costs.electricityPercent}%` }}
          />
          {includeWear && (
            <div
              className="bg-violet-500 transition-all"
              style={{ width: `${costs.wearPercent}%` }}
            />
          )}
        </div>

        {/* Savings Box */}
        <div className="flex gap-4 mt-5 p-4 bg-green-500/8 border border-green-500/20 rounded-xl">
          <div className="text-green-500">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-muted-foreground">
              Estimated Savings vs Buying
            </div>
            <div className="text-lg font-bold text-green-500 mt-0.5">
              Save ~{formatAmount(costs.savings)} ({Math.round(costs.savingsPercent)}%)
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Compared to estimated retail value of {formatAmount(costs.estimatedRetailValue)}
            </div>
          </div>
        </div>

        {/* Cost per Gram */}
        <div className="flex justify-between mt-4 p-3 bg-card/30 rounded-lg">
          <span className="text-[13px] text-muted-foreground">Cost per gram</span>
          <span className="text-sm font-bold text-foreground">
            {formatAmount(costs.costPerGram, 3)}/g
          </span>
        </div>
      </div>
    </div>
  );
};
