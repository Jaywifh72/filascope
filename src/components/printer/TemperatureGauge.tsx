import React from 'react';
import { cn } from '@/lib/utils';
import { Thermometer, Check } from 'lucide-react';

interface TemperatureGaugeProps {
  maxNozzleTemp: number | null | undefined;
  maxBedTemp: number | null | undefined;
  compact?: boolean;
}

// Material compatibility thresholds (nozzle temp)
const MATERIAL_THRESHOLDS = [
  { temp: 300, materials: 'ABS, ASA, Nylon', position: 'high' },
  { temp: 260, materials: 'PETG, TPU', position: 'mid' },
  { temp: 220, materials: 'PLA, PLA+', position: 'low' },
];

interface ThermometerBarProps {
  value: number;
  maxScale: number;
  label: string;
  type: 'nozzle' | 'bed';
}

function ThermometerBar({ value, maxScale, label, type }: ThermometerBarProps) {
  const percentage = Math.min((value / maxScale) * 100, 100);
  
  // Temperature scale marks
  const marks = type === 'nozzle' 
    ? [0, 100, 200, 300, 350]
    : [0, 50, 100, 150];

  return (
    <div className="flex flex-col items-center flex-1">
      {/* Label */}
      <div className="text-xs text-gray-400 mb-3 text-center font-medium tracking-wide uppercase">{label}</div>

      {/* Thermometer container — centered alignment */}
      <div className="flex items-end gap-1.5">
        {/* Scale marks */}
        <div className="flex flex-col justify-between h-32 sm:h-40 items-end">
          {marks.slice().reverse().map((mark) => (
            <span key={mark} className="text-[9px] text-gray-500 leading-none tabular-nums">
              {mark}°
            </span>
          ))}
        </div>

        {/* Thermometer body — tube + bulb aligned on center axis */}
        <div className="flex flex-col items-center">
          {/* Glass tube */}
          <div className="w-7 sm:w-8 h-32 sm:h-40 bg-muted/40 rounded-t-full border border-border/40 overflow-hidden relative">
            {/* Fill with gradient */}
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 rounded-t-full transition-all duration-700 ease-out",
                type === 'nozzle'
                  ? "bg-gradient-to-t from-orange-600 via-red-500 to-red-400"
                  : "bg-gradient-to-t from-blue-500 via-cyan-400 to-teal-400"
              )}
              style={{ height: `${percentage}%` }}
            />

            {/* Glass reflection */}
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/10 to-transparent" />
          </div>

          {/* Thermometer bulb — centered below tube */}
          <div className={cn(
            "w-11 sm:w-12 h-11 sm:h-12 rounded-full -mt-1.5 flex items-center justify-center border border-border/40 shadow-lg",
            type === 'nozzle'
              ? "bg-gradient-to-br from-red-500 to-orange-600 shadow-red-500/20"
              : "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20"
          )}>
            <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Value display */}
      <div className="mt-3 text-center">
        <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">{value}°C</div>
        <div className="text-[10px] sm:text-xs text-gray-500">Maximum</div>
      </div>
    </div>
  );
}

export function TemperatureGauge({ maxNozzleTemp, maxBedTemp, compact = false }: TemperatureGaugeProps) {
  if (!maxNozzleTemp && !maxBedTemp) {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4 border border-dashed border-gray-800 rounded-lg min-h-[200px]">
        <Thermometer size={32} className="text-gray-600 mb-2" />
        <span className="text-sm text-gray-500 font-mono">Temperature data not available</span>
        <span className="text-xs text-gray-600 mt-1">This spec hasn't been added yet</span>
      </div>
    );
  }

  // Determine which materials are compatible based on nozzle temp
  const compatibleMaterials = maxNozzleTemp 
    ? MATERIAL_THRESHOLDS.filter(m => maxNozzleTemp >= m.temp)
    : [];

  return (
    <div className={cn(
      "bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden",
      compact ? "p-4" : "p-5 sm:p-6"
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <Thermometer className="h-5 w-5 text-primary" />
        </div>
        <span className="text-sm font-medium text-gray-400">Temperature Range</span>
      </div>

      {/* Thermometers side by side */}
      <div className="flex justify-center gap-8 sm:gap-12 mb-4">
        {maxNozzleTemp && (
          <ThermometerBar
            value={maxNozzleTemp}
            maxScale={350}
            label="Nozzle"
            type="nozzle"
          />
        )}
        {maxBedTemp && (
          <ThermometerBar
            value={maxBedTemp}
            maxScale={150}
            label="Bed"
            type="bed"
          />
        )}
      </div>

      {/* Material Compatibility */}
      {compatibleMaterials.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/30">
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2 text-center">Compatible with:</div>
          <div className="flex flex-wrap justify-center gap-2">
            {compatibleMaterials.map((mat, idx) => (
              <div 
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                <Check className="h-3 w-3" />
                <span>{mat.materials}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
