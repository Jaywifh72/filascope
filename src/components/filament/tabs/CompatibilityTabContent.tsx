import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, CheckCircle, AlertTriangle, Info, AlertCircle, XCircle } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

import { CompatibilityResult } from '@/lib/printerCompatibility';

interface SelectedPrinter {
  id: string;
  model_name: string;
  brand_id?: string;
  max_nozzle_temp_c?: number | null;
  min_bed_temp_c?: number | null;
  max_bed_temp_c?: number | null;
}

interface CompatibilityTabContentProps {
  filament: Filament;
  selectedPrinter: SelectedPrinter | null;
  compatibility: CompatibilityResult | null;
  printerLoading: boolean;
}

// Simple compatibility badge component
function CompatibilityBadge({ isSupported, easeRating }: { isSupported: boolean; easeRating: string }) {
  if (!isSupported) {
    return (
      <Badge className="bg-destructive/20 text-destructive border-destructive/30">
        <XCircle className="w-3 h-3 mr-1" /> Limited
      </Badge>
    );
  }
  if (easeRating === 'Easy') {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
        <CheckCircle className="w-3 h-3 mr-1" /> Compatible
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
      <AlertCircle className="w-3 h-3 mr-1" /> Usable
    </Badge>
  );
}

export function CompatibilityTabContent({
  filament,
  selectedPrinter,
  compatibility,
  printerLoading,
}: CompatibilityTabContentProps) {
  return (
    <div className="space-y-6">
      {/* Current Printer Compatibility */}
      {selectedPrinter && compatibility && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Printer className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedPrinter.model_name}</h3>
                  <p className="text-sm text-muted-foreground">Your selected printer</p>
                </div>
              </div>
              <CompatibilityBadge 
                isSupported={compatibility.is_supported} 
                easeRating={compatibility.ease_rating} 
              />
            </div>
            
            {compatibility.limitations.length > 0 && (
              <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <h4 className="text-sm font-medium text-amber-400 mb-2">Limitations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {compatibility.limitations.map((limit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      {limit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {compatibility.recommendations.warnings.length > 0 && (
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="text-sm font-medium text-primary mb-2">Recommendations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Nozzle: {compatibility.recommendations.nozzle.material} ({compatibility.recommendations.nozzle.size.join(', ')})
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Temperature: {compatibility.recommendations.slicer.nozzle_temp_range}
                  </li>
                  {compatibility.recommendations.slicer.notes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prompt to select printer if none selected */}
      {!printerLoading && !selectedPrinter && (
        <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-dashed border-2 border-border animate-fade-in hover:border-primary/30 transition-colors">
          <CardContent className="p-8 text-center">
            <div className="p-4 bg-primary/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Printer className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Select Your Printer for Compatibility Check</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Get personalized temperature ranges, nozzle recommendations, and build plate suggestions specifically for this filament
            </p>
            <Button size="lg" asChild className="hover:scale-105 transition-transform">
              <Link to="/">
                <Printer className="w-4 h-4 mr-2" />
                Select Your Printer
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* General Compatibility Info */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Material Compatibility Overview</h3>
          
          <div className="grid gap-4">
            {/* Temperature Requirements */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Temperature Requirements
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nozzle Temp:</span>
                  <span className="ml-2 font-medium">
                    {filament.nozzle_temp_min_c && filament.nozzle_temp_max_c 
                      ? `${filament.nozzle_temp_min_c}-${filament.nozzle_temp_max_c}°C`
                      : 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Bed Temp:</span>
                  <span className="ml-2 font-medium">
                    {filament.bed_temp_min_c && filament.bed_temp_max_c 
                      ? `${filament.bed_temp_min_c}-${filament.bed_temp_max_c}°C`
                      : 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Printer Type Compatibility */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Generally Compatible With
              </h4>
              <div className="flex flex-wrap gap-2">
                {['Enclosed Printers', 'Bed Slingers', 'CoreXY', 'Delta'].map((type) => (
                  <span 
                    key={type}
                    className="px-3 py-1 text-sm bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Special Requirements */}
            {(filament.is_nozzle_abrasive || filament.moisture_sensitivity_level === 'High') && (
              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <h4 className="font-medium mb-3 flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  Special Requirements
                </h4>
                <ul className="text-sm space-y-2">
                  {filament.is_nozzle_abrasive && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      <span>Requires hardened steel nozzle (abrasive material)</span>
                    </li>
                  )}
                  {filament.moisture_sensitivity_level === 'High' && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      <span>Requires dry storage and possibly active drying before printing</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
