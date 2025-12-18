import React from 'react';
import { Database } from '@/integrations/supabase/types';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface PrintSettingsContentProps {
  filament: Filament;
}

export function PrintSettingsContent({ filament }: PrintSettingsContentProps) {
  const settings = [
    {
      icon: '🌡️',
      label: 'Nozzle Temperature',
      value: filament.nozzle_temp_min_c && filament.nozzle_temp_max_c 
        ? `${filament.nozzle_temp_min_c} - ${filament.nozzle_temp_max_c}°C`
        : null,
      recommended: filament.nozzle_temp_sweetspot_c ? `${filament.nozzle_temp_sweetspot_c}°C` : null,
    },
    {
      icon: '🛏️',
      label: 'Bed Temperature',
      value: filament.bed_temp_min_c && filament.bed_temp_max_c 
        ? `${filament.bed_temp_min_c} - ${filament.bed_temp_max_c}°C`
        : null,
      recommended: filament.bed_temp_min_c && filament.bed_temp_max_c 
        ? `${Math.round((filament.bed_temp_min_c + filament.bed_temp_max_c) / 2)}°C`
        : null,
    },
    {
      icon: '💨',
      label: 'Print Speed',
      value: filament.print_speed_max_mms ? `Up to ${filament.print_speed_max_mms} mm/s` : null,
      recommended: filament.high_speed_capable ? 'High-speed capable' : null,
    },
    {
      icon: '🌀',
      label: 'Cooling Fan',
      value: filament.fan_min_percent !== null && filament.fan_max_percent !== null
        ? `${filament.fan_min_percent}% - ${filament.fan_max_percent}%`
        : null,
      recommended: filament.fan_max_percent !== null ? `Max: ${filament.fan_max_percent}%` : null,
    },
  ].filter(s => s.value);

  // Material-specific tips
  const tips = getSettingsTips(filament.material, filament);

  return (
    <div>
      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
        {settings.map((setting, idx) => (
          <div key={idx} className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <div className="text-2xl mb-2">{setting.icon}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {setting.label}
            </div>
            <div className="text-lg font-bold text-foreground mb-1">
              {setting.value}
            </div>
            {setting.recommended && (
              <div className="text-sm font-medium text-slate-400">
                Recommended: {setting.recommended}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pro Tips Section */}
      {tips.length > 0 && (
        <div className="mt-5 p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl">
          <div className="text-sm font-bold text-amber-400 mb-3">Pro Tips</div>
          <div className="flex flex-col gap-2">
            {tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-sm font-medium text-slate-200 leading-relaxed">
                <span className="flex-shrink-0">💡</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {settings.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">
          No print settings data available for this filament.
        </p>
      )}
    </div>
  );
}

function getSettingsTips(material: string | null, filament: Filament): string[] {
  const tips: string[] = [];
  
  if (!material) return tips;
  
  const mat = material.toUpperCase();
  
  if (mat.includes('PLA')) {
    tips.push('PLA prints best with good cooling - use 100% fan after the first layer.');
    tips.push('No heated enclosure needed - PLA prefers ambient temperatures.');
  } else if (mat.includes('PETG')) {
    tips.push('Reduce cooling to 50-70% for better layer adhesion.');
    tips.push('PETG sticks to PEI - consider using glue stick as release agent.');
  } else if (mat.includes('ABS') || mat.includes('ASA')) {
    tips.push('Use an enclosure to prevent warping and improve layer adhesion.');
    tips.push('Minimal to no cooling for best results with ABS/ASA.');
  } else if (mat.includes('TPU') || mat.includes('TPE')) {
    tips.push('Reduce print speed to 20-30mm/s for flexible materials.');
    tips.push('Disable retraction or use minimal settings to prevent jamming.');
  } else if (mat.includes('NYLON') || mat.includes('PA')) {
    tips.push('Dry filament before printing - nylon absorbs moisture quickly.');
    tips.push('Use an enclosure and adhesive like Magigoo or glue stick.');
  }
  
  if (filament.is_nozzle_abrasive) {
    tips.push('Use a hardened steel or ruby nozzle - brass will wear quickly.');
  }
  
  if (filament.moisture_sensitivity_level === 'High' || filament.moisture_sensitivity_level === 'Very High') {
    tips.push('Store in a dry box with desiccant when not in use.');
  }
  
  return tips.slice(0, 4); // Max 4 tips
}
