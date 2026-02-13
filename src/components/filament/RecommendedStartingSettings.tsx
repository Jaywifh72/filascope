import React, { useState, useCallback, useMemo } from 'react';
import { Database } from '@/integrations/supabase/types';
import { Sparkles, Copy, ChevronDown, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrinterSelection } from '@/hooks/usePrinterSelection';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface RecommendedStartingSettingsProps {
  filament: Filament;
}

interface SettingItem {
  label: string;
  value: string;
  rawValue: string; // for copy
}

const STORAGE_KEY = 'recommended-settings-collapsed';

export function RecommendedStartingSettings({ filament }: RecommendedStartingSettingsProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  });
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const { selectedPrinter } = usePrinterSelection();

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  // Calculate recommended settings
  const settings = useMemo<SettingItem[]>(() => {
    const items: SettingItem[] = [];

    // Nozzle temp: midpoint of range, or printer-aware if available
    const nozMin = filament.nozzle_temp_min_c;
    const nozMax = filament.nozzle_temp_max_c;
    if (nozMin && nozMax) {
      let recommended = Math.round((nozMin + nozMax) / 2);
      // If printer is selected, clamp to printer max
      if (selectedPrinter?.max_nozzle_temp_c && recommended > selectedPrinter.max_nozzle_temp_c) {
        recommended = selectedPrinter.max_nozzle_temp_c;
      }
      items.push({ label: 'Nozzle Temp', value: `${recommended}°C`, rawValue: `${recommended}°C` });
    }

    // Bed temp: midpoint of range
    const bedMin = filament.bed_temp_min_c;
    const bedMax = filament.bed_temp_max_c;
    if (bedMin != null && bedMax != null) {
      let recommended = Math.round((bedMin + bedMax) / 2);
      const printerBedMax = (selectedPrinter as any)?.bed_max_temp_c;
      if (printerBedMax && recommended > printerBedMax) {
        recommended = printerBedMax;
      }
      items.push({ label: 'Bed Temp', value: `${recommended}°C`, rawValue: `${recommended}°C` });
    }

    // Part cooling: midpoint of fan speed range as percentage
    const fanMin = filament.fan_min_percent;
    const fanMax = filament.fan_max_percent;
    if (fanMin != null && fanMax != null) {
      const recommended = Math.round((fanMin + fanMax) / 2);
      items.push({ label: 'Part Cooling', value: `${recommended}%`, rawValue: `${recommended}%` });
    }

    // Print speed: 70% of max as safe starting point
    const maxSpeed = filament.print_speed_max_mms;
    if (maxSpeed) {
      let recommended = Math.round(maxSpeed * 0.7);
      if (selectedPrinter?.max_print_speed_mms && recommended > Math.round(selectedPrinter.max_print_speed_mms * 0.7)) {
        recommended = Math.round(selectedPrinter.max_print_speed_mms * 0.7);
      }
      items.push({ label: 'Print Speed', value: `${recommended} mm/s`, rawValue: `${recommended} mm/s` });
    }

    return items;
  }, [filament, selectedPrinter]);

  const productName = filament.display_name || filament.product_title || 'this filament';

  const copyAllSettings = useCallback(() => {
    const text = `Recommended settings for ${productName}: ${settings.map(s => `${s.label}: ${s.rawValue}`).join(' | ')}`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Settings copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  }, [settings, productName]);

  const copySingle = useCallback((value: string, idx: number) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  }, []);

  // Don't render if no settings available
  if (settings.length === 0) return null;

  // Printer context
  const printerName = selectedPrinter
    ? (typeof selectedPrinter.brand === 'object' && selectedPrinter.brand !== null && 'brand' in selectedPrinter.brand
        ? `${(selectedPrinter.brand as { brand: string }).brand} ${selectedPrinter.model_name}`
        : selectedPrinter.model_name)
    : null;

  return (
    <div className="bg-gray-800/30 border border-teal-500/10 rounded-xl overflow-hidden">
      {/* Header — clickable to toggle */}
      <button
        onClick={toggleCollapsed}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-sm font-semibold text-gray-200 block">
              Recommended Starting Settings
            </span>
            {printerName ? (
              <span className="text-xs text-teal-400 block truncate">
                Optimized for your {printerName}
              </span>
            ) : (
              <span className="text-xs text-gray-500 block">
                Based on material defaults
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded hover:bg-gray-700/50 transition-colors"
                >
                  <Info className="w-3.5 h-3.5 text-gray-500" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[260px] text-xs">
                Starting values are based on the middle of the manufacturer's recommended range, adjusted for your printer's capabilities and common community preferences.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-500 transition-transform duration-200",
              !isCollapsed && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Collapsible body */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isCollapsed ? "max-h-0" : "max-h-[300px]"
        )}
      >
        <div className="px-4 pb-4 space-y-3">
          {/* Settings grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {settings.map((setting, idx) => (
              <div
                key={setting.label}
                className="bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700/30"
              >
                <div className="text-xs text-gray-500 mb-1">{setting.label}</div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-lg font-semibold text-gray-100">{setting.value}</span>
                  <button
                    onClick={() => copySingle(setting.rawValue, idx)}
                    className="p-0.5 rounded hover:bg-gray-700/50 transition-colors"
                    aria-label={`Copy ${setting.label} value`}
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-3 h-3 text-teal-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-600 hover:text-teal-400 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Fine-tune hint */}
          <p className="text-xs text-gray-400 italic">
            Fine-tune based on your results. Lower nozzle temp for better detail, higher for better adhesion.
          </p>

          {/* Copy All */}
          <div className="flex justify-end">
            <button
              onClick={copyAllSettings}
              className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors"
            >
              <Copy className="w-3 h-3" />
              Copy All Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}