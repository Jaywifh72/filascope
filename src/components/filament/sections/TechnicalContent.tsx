import React from 'react';
import { Droplets, ThermometerSun, Clock, Award, Ruler } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface TechnicalContentProps {
  filament: Filament;
  type: 'moisture' | 'mechanical';
}

export function TechnicalContent({ filament, type }: TechnicalContentProps) {
  if (type === 'moisture') {
    return <MoistureCareContent filament={filament} />;
  }
  return <MechanicalPropertiesContent filament={filament} />;
}

function MoistureCareContent({ filament }: { filament: Filament }) {
  const hasData = filament.moisture_care || filament.drying_temp_c || filament.drying_time_hours || filament.moisture_sensitivity_level;
  
  if (!hasData) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No storage and care information available for this filament.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 max-[600px]:grid-cols-1">
        {filament.moisture_sensitivity_level && (
          <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Droplets className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Moisture Sensitivity</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {filament.moisture_sensitivity_level}
            </div>
          </div>
        )}
        
        {filament.drying_temp_c && (
          <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <ThermometerSun className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Drying Temp</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {filament.drying_temp_c}°C
            </div>
          </div>
        )}
        
        {filament.drying_time_hours && (
          <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Drying Time</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {filament.drying_time_hours} hours
            </div>
          </div>
        )}
      </div>

      {/* Storage Instructions */}
      {filament.moisture_care && (
        <div className="p-4 bg-muted/30 rounded-xl">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-primary" />
            Storage Instructions
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {filament.moisture_care}
          </p>
        </div>
      )}

      {/* Nozzle Care */}
      {filament.nozzle_care && (
        <div className="p-4 bg-muted/30 rounded-xl">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <span>🔧</span>
            Nozzle Care Tips
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {filament.nozzle_care}
          </p>
        </div>
      )}
    </div>
  );
}

function MechanicalPropertiesContent({ filament }: { filament: Filament }) {
  const properties = [
    { 
      label: 'Tensile Strength (XY)', 
      value: filament.tensile_strength_xy_mpa ? `${filament.tensile_strength_xy_mpa} MPa` : null,
      highlight: true
    },
    { 
      label: 'Tensile Modulus (XY)', 
      value: filament.tensile_modulus_xy_mpa ? `${filament.tensile_modulus_xy_mpa} MPa` : null 
    },
    { 
      label: 'Flexural Strength', 
      value: filament.flexural_strength_mpa ? `${filament.flexural_strength_mpa} MPa` : null 
    },
    { 
      label: 'Elongation at Break', 
      value: filament.elongation_break_xy_percent ? `${filament.elongation_break_xy_percent}%` : null 
    },
    { 
      label: 'Shore Hardness (D)', 
      value: filament.shore_hardness_d ? `${filament.shore_hardness_d}D` : null 
    },
    { 
      label: 'Density', 
      value: filament.density_g_cm3 ? `${filament.density_g_cm3} g/cm³` : null 
    },
    { 
      label: 'Glass Transition (Tg)', 
      value: filament.tg_c ? `${filament.tg_c}°C` : null,
      highlight: true 
    },
    { 
      label: 'Melt Temperature', 
      value: filament.melt_temp_c ? `${filament.melt_temp_c}°C` : null 
    },
  ].filter(p => p.value);

  if (properties.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No technical specifications available for this filament.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
        {properties.map((prop, idx) => (
          <div 
            key={idx}
            className={`p-4 rounded-xl border ${
              prop.highlight 
                ? 'bg-primary/5 border-primary/20' 
                : 'bg-white/[0.02] border-white/[0.06]'
            }`}
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {prop.label}
            </div>
            <div className={`text-lg font-bold ${prop.highlight ? 'text-primary' : 'text-foreground'}`}>
              {prop.value}
            </div>
          </div>
        ))}
      </div>
      
      {/* Data Source Note */}
      {filament.tds_url && (
        <div className="text-xs text-muted-foreground pt-2 border-t border-white/[0.06]">
          Data sourced from manufacturer's Technical Data Sheet.{' '}
          <a 
            href={filament.tds_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View TDS →
          </a>
        </div>
      )}
    </div>
  );
}
