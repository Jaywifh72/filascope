import { useMemo } from "react";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { MATERIAL_INFO, MATERIAL_CATEGORIES, MaterialInfo } from "@/lib/materialHierarchy";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertTriangle, XCircle, Flame, Thermometer, Box, Zap, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface MaterialCompatibility {
  material: string;
  info: MaterialInfo;
  status: 'recommended' | 'possible' | 'not-recommended';
  reasons: string[];
}

// Material printing requirements (typical values)
const MATERIAL_SPECS: Record<string, { 
  minNozzle: number; 
  minBed: number; 
  needsEnclosure: boolean; 
  isAbrasive: boolean;
  needsDirectDrive: boolean;
}> = {
  // PLA Family
  'PLA': { minNozzle: 190, minBed: 50, needsEnclosure: false, isAbrasive: false, needsDirectDrive: false },
  'PLA+': { minNozzle: 200, minBed: 55, needsEnclosure: false, isAbrasive: false, needsDirectDrive: false },
  'PLA-CF': { minNozzle: 210, minBed: 55, needsEnclosure: false, isAbrasive: true, needsDirectDrive: false },
  'PLA-Wood': { minNozzle: 200, minBed: 50, needsEnclosure: false, isAbrasive: true, needsDirectDrive: false },
  'PLA-Silk': { minNozzle: 200, minBed: 55, needsEnclosure: false, isAbrasive: false, needsDirectDrive: false },
  'PLA-Glow': { minNozzle: 200, minBed: 55, needsEnclosure: false, isAbrasive: true, needsDirectDrive: false },
  'HTPLA': { minNozzle: 210, minBed: 60, needsEnclosure: false, isAbrasive: false, needsDirectDrive: false },
  'LW-PLA': { minNozzle: 230, minBed: 55, needsEnclosure: false, isAbrasive: false, needsDirectDrive: false },
  
  // PETG Family
  'PETG': { minNozzle: 230, minBed: 70, needsEnclosure: false, isAbrasive: false, needsDirectDrive: false },
  'PETG-CF': { minNozzle: 240, minBed: 75, needsEnclosure: false, isAbrasive: true, needsDirectDrive: false },
  'Pro PETG': { minNozzle: 235, minBed: 75, needsEnclosure: false, isAbrasive: false, needsDirectDrive: false },
  
  // ABS Family
  'ABS': { minNozzle: 240, minBed: 100, needsEnclosure: true, isAbrasive: false, needsDirectDrive: false },
  'ABS+': { minNozzle: 240, minBed: 100, needsEnclosure: true, isAbrasive: false, needsDirectDrive: false },
  'ABS-CF': { minNozzle: 250, minBed: 100, needsEnclosure: true, isAbrasive: true, needsDirectDrive: false },
  
  // ASA Family
  'ASA': { minNozzle: 240, minBed: 95, needsEnclosure: true, isAbrasive: false, needsDirectDrive: false },
  'ASA+': { minNozzle: 245, minBed: 95, needsEnclosure: true, isAbrasive: false, needsDirectDrive: false },
  'ASA-CF': { minNozzle: 250, minBed: 100, needsEnclosure: true, isAbrasive: true, needsDirectDrive: false },
  
  // Flexible
  'TPU': { minNozzle: 220, minBed: 50, needsEnclosure: false, isAbrasive: false, needsDirectDrive: true },
  'TPE': { minNozzle: 210, minBed: 40, needsEnclosure: false, isAbrasive: false, needsDirectDrive: true },
  'PEBA': { minNozzle: 230, minBed: 60, needsEnclosure: false, isAbrasive: false, needsDirectDrive: true },
  
  // Nylon Family
  'Nylon': { minNozzle: 250, minBed: 80, needsEnclosure: true, isAbrasive: false, needsDirectDrive: false },
  'Nylon-CF': { minNozzle: 260, minBed: 85, needsEnclosure: true, isAbrasive: true, needsDirectDrive: false },
  'Nylon-GF': { minNozzle: 260, minBed: 85, needsEnclosure: true, isAbrasive: true, needsDirectDrive: false },
  
  // Polycarbonate
  'PC': { minNozzle: 270, minBed: 110, needsEnclosure: true, isAbrasive: false, needsDirectDrive: false },
  'PC-CF': { minNozzle: 280, minBed: 115, needsEnclosure: true, isAbrasive: true, needsDirectDrive: false },
  'PC-ABS': { minNozzle: 260, minBed: 105, needsEnclosure: true, isAbrasive: false, needsDirectDrive: false },
  
  // High Performance
  'PEEK': { minNozzle: 380, minBed: 130, needsEnclosure: true, isAbrasive: false, needsDirectDrive: false },
  'PEI': { minNozzle: 360, minBed: 140, needsEnclosure: true, isAbrasive: false, needsDirectDrive: false },
  'PPS': { minNozzle: 320, minBed: 120, needsEnclosure: true, isAbrasive: false, needsDirectDrive: false },
  
  // Copolyester
  'CPE': { minNozzle: 235, minBed: 75, needsEnclosure: false, isAbrasive: false, needsDirectDrive: false },
  'CPE+': { minNozzle: 250, minBed: 80, needsEnclosure: true, isAbrasive: false, needsDirectDrive: false },
  
  // Polypropylene
  'PP': { minNozzle: 230, minBed: 85, needsEnclosure: false, isAbrasive: false, needsDirectDrive: false },
  
  // Support Materials
  'PVA': { minNozzle: 190, minBed: 50, needsEnclosure: false, isAbrasive: false, needsDirectDrive: false },
  'HIPS': { minNozzle: 230, minBed: 100, needsEnclosure: true, isAbrasive: false, needsDirectDrive: false },
};

export function MaterialRecommendations() {
  const { selectedPrinter } = usePrinterSelection();
  const [isExpanded, setIsExpanded] = useState(true);

  const recommendations = useMemo(() => {
    if (!selectedPrinter) return null;

    const printerCapabilities = {
      maxNozzleTemp: selectedPrinter.max_nozzle_temp_c || 260,
      maxBedTemp: selectedPrinter.bed_max_temp_c || 100,
      hasEnclosure: selectedPrinter.has_enclosure || false,
      supportsAbrasive: selectedPrinter.abrasive_filament_support || false,
      hasDirectDrive: selectedPrinter.extruder_type?.toLowerCase().includes('direct') || false,
    };

    const results: MaterialCompatibility[] = [];

    // Check each material
    Object.entries(MATERIAL_INFO).forEach(([materialKey, info]) => {
      const specs = MATERIAL_SPECS[materialKey];
      if (!specs) return;

      const reasons: string[] = [];
      let status: 'recommended' | 'possible' | 'not-recommended' = 'recommended';

      // Check nozzle temperature
      if (specs.minNozzle > printerCapabilities.maxNozzleTemp) {
        reasons.push(`Needs ${specs.minNozzle}°C nozzle (your printer: ${printerCapabilities.maxNozzleTemp}°C)`);
        status = 'not-recommended';
      }

      // Check bed temperature
      if (specs.minBed > printerCapabilities.maxBedTemp) {
        reasons.push(`Needs ${specs.minBed}°C bed (your printer: ${printerCapabilities.maxBedTemp}°C)`);
        status = 'not-recommended';
      }

      // Check enclosure
      if (specs.needsEnclosure && !printerCapabilities.hasEnclosure) {
        if (status !== 'not-recommended') {
          reasons.push('Enclosure recommended but not available');
          status = 'possible';
        }
      }

      // Check abrasive materials
      if (specs.isAbrasive && !printerCapabilities.supportsAbrasive) {
        if (status !== 'not-recommended') {
          reasons.push('Abrasive - hardened nozzle recommended');
          status = 'possible';
        }
      }

      // Check direct drive
      if (specs.needsDirectDrive && !printerCapabilities.hasDirectDrive) {
        if (status !== 'not-recommended') {
          reasons.push('Direct drive extruder recommended');
          status = 'possible';
        }
      }

      // Add positive reasons for recommended materials
      if (status === 'recommended') {
        if (printerCapabilities.maxNozzleTemp >= specs.minNozzle + 30) {
          reasons.push('Excellent temperature headroom');
        }
        if (specs.needsEnclosure && printerCapabilities.hasEnclosure) {
          reasons.push('Enclosure available');
        }
        if (specs.isAbrasive && printerCapabilities.supportsAbrasive) {
          reasons.push('Hardened nozzle supported');
        }
      }

      results.push({
        material: materialKey,
        info,
        status,
        reasons: reasons.length > 0 ? reasons : ['Compatible with your printer'],
      });
    });

    // Sort: recommended first, then possible, then not-recommended
    return results.sort((a, b) => {
      const order = { 'recommended': 0, 'possible': 1, 'not-recommended': 2 };
      return order[a.status] - order[b.status];
    });
  }, [selectedPrinter]);

  if (!selectedPrinter) {
    return null;
  }

  const recommended = recommendations?.filter(r => r.status === 'recommended') || [];
  const possible = recommendations?.filter(r => r.status === 'possible') || [];
  const notRecommended = recommendations?.filter(r => r.status === 'not-recommended') || [];

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'recommended':
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'possible':
        return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
      default:
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    }
  };

  const MaterialBadgeWithTooltip = ({ item }: { item: MaterialCompatibility }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={`cursor-help transition-colors ${
            item.status === 'recommended' 
              ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20' 
              : item.status === 'possible'
                ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                : 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
          }`}
        >
          <StatusIcon status={item.status} />
          <span className="ml-1.5">{item.material}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-2">
          <p className="font-medium">{item.info.name}</p>
          <p className="text-xs text-muted-foreground">{item.info.description}</p>
          <div className="border-t border-border pt-2">
            <p className="text-xs font-medium mb-1">
              {item.status === 'recommended' ? 'Why it works:' : 'Considerations:'}
            </p>
            <ul className="text-xs space-y-0.5">
              {item.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-muted-foreground">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="p-4 bg-card rounded-lg border">
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Material Recommendations</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-sm">
                  Based on your {selectedPrinter.model_name}'s capabilities: 
                  {selectedPrinter.max_nozzle_temp_c && ` ${selectedPrinter.max_nozzle_temp_c}°C nozzle,`}
                  {selectedPrinter.bed_max_temp_c && ` ${selectedPrinter.bed_max_temp_c}°C bed,`}
                  {selectedPrinter.has_enclosure ? ' enclosed' : ' open frame'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {recommended.length}
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                {possible.length}
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                {notRecommended.length}
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          {/* Printer capabilities summary */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50">
              <Thermometer className="h-3 w-3 text-orange-400" />
              <span>Nozzle: {selectedPrinter.max_nozzle_temp_c || '?'}°C</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50">
              <Thermometer className="h-3 w-3 text-red-400" />
              <span>Bed: {selectedPrinter.bed_max_temp_c || '?'}°C</span>
            </div>
            {selectedPrinter.has_enclosure && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50">
                <Box className="h-3 w-3 text-blue-400" />
                <span>Enclosed</span>
              </div>
            )}
            {selectedPrinter.abrasive_filament_support && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50">
                <Zap className="h-3 w-3 text-purple-400" />
                <span>Hardened Nozzle</span>
              </div>
            )}
          </div>

          {/* Recommended materials */}
          {recommended.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                Recommended ({recommended.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {recommended.map(item => (
                  <MaterialBadgeWithTooltip key={item.material} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Possible with caveats */}
          {possible.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Possible with Caveats ({possible.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {possible.map(item => (
                  <MaterialBadgeWithTooltip key={item.material} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Not recommended */}
          {notRecommended.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1.5">
                <XCircle className="h-4 w-4" />
                Not Compatible ({notRecommended.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {notRecommended.map(item => (
                  <MaterialBadgeWithTooltip key={item.material} item={item} />
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
