import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, DollarSign, Settings, Beaker, X } from 'lucide-react';
import { FilamentUsageCalculator } from './FilamentUsageCalculator';
import { PrintCostCalculator } from './PrintCostCalculator';
import { PrintSettingsOptimizer } from './PrintSettingsOptimizer';
import { MaterialComparisonTool } from './MaterialComparisonTool';
import { getMaterialRecommendedSettings } from './materialHelpers';
import type { FilamentUsageOutput, MaterialRecommendedSettings } from './types';

interface CalculatorTabsProps {
  filament: {
    id: string;
    name: string;
    material: string;
    price: number;
    density?: number;
    spoolWeight?: number;
    nozzleTempMin?: number;
    nozzleTempMax?: number;
    bedTempMin?: number;
    bedTempMax?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  /** Currency symbol for the user's region (e.g., "C$", "€") */
  currencySymbol?: string;
  /** Currency code (e.g., "CAD", "EUR") */
  currencyCode?: string;
  /** User's region code for regional defaults */
  regionCode?: string;
  /** Whether the price is a converted estimate */
  isConverted?: boolean;
}

type TabId = 'usage' | 'cost' | 'settings' | 'compare';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'usage', label: 'Usage', icon: <Calculator className="h-4 w-4" /> },
  { id: 'cost', label: 'Cost', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  { id: 'compare', label: 'Compare', icon: <Beaker className="h-4 w-4" /> },
];

export const CalculatorTabs: React.FC<CalculatorTabsProps> = ({
  filament,
  isOpen,
  onClose,
  currencySymbol = '$',
  currencyCode = 'USD',
  regionCode = 'US',
  isConverted = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('usage');
  const [usageResult, setUsageResult] = useState<FilamentUsageOutput | null>(null);

  // Handle escape key to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Get recommended settings from filament data or defaults
  const recommendedSettings: MaterialRecommendedSettings = {
    nozzleTemp: [filament.nozzleTempMin || 200, filament.nozzleTempMax || 220],
    bedTemp: [filament.bedTempMin || 50, filament.bedTempMax || 70],
    ...getMaterialRecommendedSettings(filament.material),
  };

  // Override with filament-specific temps if available
  if (filament.nozzleTempMin && filament.nozzleTempMax) {
    recommendedSettings.nozzleTemp = [filament.nozzleTempMin, filament.nozzleTempMax];
  }
  if (filament.bedTempMin && filament.bedTempMax) {
    recommendedSettings.bedTemp = [filament.bedTempMin, filament.bedTempMax];
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calculator-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-muted/30 border-b border-border">
          <h2 id="calculator-title" className="flex items-center gap-3 text-xl font-bold text-foreground">
            <Calculator className="h-6 w-6 text-primary" />
            Print Calculator
          </h2>
          <button 
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 bg-muted/50 hover:bg-muted border-none rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close calculator"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-6 bg-muted/20 border-b border-border" role="tablist" aria-label="Calculator tools">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-5 py-4 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          role="tabpanel"
          id={`panel-${activeTab}`}
        >
          {activeTab === 'usage' && (
            <FilamentUsageCalculator
              filamentDensity={filament.density || 1.24}
              spoolWeight={filament.spoolWeight || 1000}
              currentPrice={filament.price}
              filamentName={filament.name}
              filamentMaterial={filament.material}
              onCalculate={setUsageResult}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
              isConverted={isConverted}
            />
          )}

          {activeTab === 'cost' && (
            <PrintCostCalculator
              filamentPrice={filament.price}
              filamentName={filament.name}
              usageGrams={usageResult?.totalGrams}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
              regionCode={regionCode}
              isConverted={isConverted}
              spoolWeight={filament.spoolWeight || 1000}
            />
          )}

          {activeTab === 'settings' && (
            <PrintSettingsOptimizer
              material={{
                type: filament.material,
                name: filament.name,
                recommendedSettings
              }}
            />
          )}

          {activeTab === 'compare' && (
            <MaterialComparisonTool
              currentMaterial={filament.material}
              currentMaterialName={filament.name}
            />
          )}
        </div>
      </div>
    </div>
  );
};
