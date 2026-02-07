import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, CheckCircle, Zap, Settings2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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

interface PrintCostCalculatorProps {
  filamentPrice: number;
  filamentName: string;
  usageGrams?: number;
  /** Currency symbol to use (e.g., "C$", "€", "£"). Defaults to "$" */
  currencySymbol?: string;
  /** User's region code for electricity rate defaults */
  regionCode?: string;
}

export const PrintCostCalculator: React.FC<PrintCostCalculatorProps> = ({
  filamentPrice,
  filamentName,
  usageGrams,
  currencySymbol = '$',
  regionCode = 'US',
}) => {
  const [filamentGrams, setFilamentGrams] = useState(usageGrams?.toString() || '100');
  const [printTimeHours, setPrintTimeHours] = useState('4');
  const [electricityRate, setElectricityRate] = useState(REGIONAL_ELECTRICITY_DEFAULTS[regionCode] || '0.12');
  const [printerWattage, setPrinterWattage] = useState('200');
  const [includeWear, setIncludeWear] = useState(false);
  const [wearCostPerHour, setWearCostPerHour] = useState(REGIONAL_WEAR_DEFAULTS[regionCode] || '0.50');
  const [copies, setCopies] = useState(1);

  useEffect(() => {
    if (usageGrams) setFilamentGrams(usageGrams.toString());
  }, [usageGrams]);

  // Update defaults when region changes
  useEffect(() => {
    setElectricityRate(REGIONAL_ELECTRICITY_DEFAULTS[regionCode] || '0.12');
    setWearCostPerHour(REGIONAL_WEAR_DEFAULTS[regionCode] || '0.50');
  }, [regionCode]);

  const costs = useMemo(() => {
    const grams = parseFloat(filamentGrams) || 0;
    const hours = parseFloat(printTimeHours) || 0;
    const elecRate = parseFloat(electricityRate) || 0;
    const watts = parseFloat(printerWattage) || 0;
    const wearRate = includeWear ? (parseFloat(wearCostPerHour) || 0) : 0;

    const materialCost = (grams / 1000) * filamentPrice;
    const electricityCost = (watts / 1000) * hours * elecRate;
    const wearCost = hours * wearRate;
    const totalCostPerPrint = materialCost + electricityCost + wearCost;
    const totalCostAllCopies = totalCostPerPrint * copies;
    const costPerGram = grams > 0 ? totalCostPerPrint / grams : 0;

    const estimatedRetailValue = totalCostPerPrint * 5;
    const savings = estimatedRetailValue - totalCostPerPrint;
    const savingsPercent = estimatedRetailValue > 0 ? (savings / estimatedRetailValue) * 100 : 0;

    // Calculate percentages for breakdown bar
    const total = materialCost + electricityCost + wearCost;
    const materialPercent = total > 0 ? (materialCost / total) * 100 : 0;
    const electricityPercent = total > 0 ? (electricityCost / total) * 100 : 0;
    const wearPercent = total > 0 ? (wearCost / total) * 100 : 0;

    return {
      material: materialCost,
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
    };
  }, [filamentGrams, printTimeHours, electricityRate, printerWattage, includeWear, wearCostPerHour, copies, filamentPrice]);

  // Use non-decimal formatting for JPY/KRW style currencies
  const isNonDecimalCurrency = regionCode === 'JP' || regionCode === 'CN';
  const formatAmount = (amount: number, decimals = 2) => {
    if (isNonDecimalCurrency) return `${currencySymbol}${Math.round(amount)}`;
    return `${currencySymbol}${amount.toFixed(decimals)}`;
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
          <p className="text-sm text-muted-foreground">Estimate the true cost of your print</p>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Filament Used */}
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
            {formatAmount(filamentPrice)}/kg for {filamentName}
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
      <div className="flex items-center justify-between pt-5 border-t border-border/30">
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

      {/* Results Section */}
      <div className="p-5 bg-card/50 border border-border/50 rounded-xl space-y-4">
        <h4 className="text-base font-bold text-foreground">Cost Breakdown</h4>

        {/* Cost Rows */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              Material
            </span>
            <span className="text-[15px] font-semibold text-foreground">
              {formatAmount(costs.material)}
            </span>
          </div>

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
