import React from 'react';
import { Database } from '@/integrations/supabase/types';
import { TechnicalDetailsAccordion } from '../TechnicalDetailsAccordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Package, Droplets, Shield } from 'lucide-react';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface OverviewTabContentProps {
  filament: Filament;
}

export function OverviewTabContent({ filament }: OverviewTabContentProps) {
  // Build key features list
  const features: Array<{ icon: React.ReactNode; label: string; value: string; highlight?: boolean }> = [];

  if (filament.high_speed_capable) {
    features.push({
      icon: <Zap className="w-4 h-4" />,
      label: 'High-Speed Ready',
      value: filament.print_speed_max_mms ? `Up to ${filament.print_speed_max_mms} mm/s` : 'Optimized for high-speed printing',
      highlight: true,
    });
  }

  if (filament.spool_ams_fit) {
    features.push({
      icon: <Package className="w-4 h-4" />,
      label: 'AMS Compatible',
      value: 'Fits Bambu Lab AMS',
    });
  }

  if (filament.moisture_sensitivity_level) {
    features.push({
      icon: <Droplets className="w-4 h-4" />,
      label: 'Moisture Sensitivity',
      value: filament.moisture_sensitivity_level,
    });
  }

  if (filament.is_nozzle_abrasive) {
    features.push({
      icon: <Shield className="w-4 h-4" />,
      label: 'Nozzle Requirement',
      value: 'Hardened steel required',
    });
  }

  return (
    <div className="space-y-6">
      {/* Key Features */}
      {features.length > 0 && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Key Features</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    feature.highlight 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'bg-muted/30'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${feature.highlight ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {feature.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{feature.label}</div>
                    <div className="text-xs text-muted-foreground">{feature.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Details Accordion */}
      <TechnicalDetailsAccordion filament={filament} />

      {/* Use Case Tags */}
      {filament.use_case_tags && filament.use_case_tags.length > 0 && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recommended Use Cases</h3>
            <div className="flex flex-wrap gap-2">
              {filament.use_case_tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
