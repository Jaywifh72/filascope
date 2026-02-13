import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Printer, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  XCircle, 
  Thermometer,
  ChevronDown,
  ChevronRight,
  Wrench,
  Flame,
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { CompatibilityResult, checkPrinterFilamentCompatibility } from '@/lib/printerCompatibility';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface SelectedPrinter {
  id: string;
  model_name: string;
  brand_id?: string;
  max_nozzle_temp_c?: number | null;
  bed_max_temp_c?: number | null;
}

interface CompatibilityTabContentProps {
  filament: Filament;
  selectedPrinter: SelectedPrinter | null;
  compatibility: CompatibilityResult | null;
  printerLoading: boolean;
}

// Compatibility Status Component
type CompatibilityStatus = 'compatible' | 'adjustments' | 'not_recommended';

function getCompatibilityStatus(compatibility: CompatibilityResult | null): CompatibilityStatus {
  if (!compatibility) return 'not_recommended';
  if (!compatibility.is_supported) return 'not_recommended';
  if (compatibility.ease_rating === 'Easy' && compatibility.limitations.length === 0) return 'compatible';
  return 'adjustments';
}

const STATUS_CONFIG: Record<CompatibilityStatus, { icon: React.ReactNode; label: string; className: string; bgClass: string }> = {
  compatible: {
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Fully Compatible',
    className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/20',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
  },
  adjustments: {
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Compatible with adjustments',
    className: 'text-amber-400 border-amber-500/30 bg-amber-500/20',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
  },
  not_recommended: {
    icon: <XCircle className="w-4 h-4" />,
    label: 'Not Recommended',
    className: 'text-red-400 border-red-500/30 bg-red-500/20',
    bgClass: 'bg-red-500/10 border-red-500/20',
  },
};

function CompatibilityStatusBadge({ status }: { status: CompatibilityStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge className={cn("gap-1.5", config.className)}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

// Temperature Card Component
interface TempCardProps {
  label: string;
  icon: React.ReactNode;
  printerValue: number | null | undefined;
  filamentMin: number | null | undefined;
  filamentMax: number | null | undefined;
  gradientFrom: string;
  gradientTo: string;
  isCompatible: boolean;
}

function TempCard({ label, icon, printerValue, filamentMin, filamentMax, gradientFrom, gradientTo, isCompatible }: TempCardProps) {
  const filamentRange = filamentMin && filamentMax ? `${filamentMin}-${filamentMax}°C` : 'N/A';
  const printerMax = printerValue ? `Up to ${printerValue}°C` : 'Unknown';

  // Calculate gauge positions
  const showGauge = printerValue && filamentMin && filamentMax;
  let leftPct = 0, rightPct = 0, isNarrow = false;
  if (showGauge) {
    leftPct = Math.max(0, Math.min(100, (filamentMin / printerValue) * 100));
    rightPct = Math.max(0, Math.min(100, (filamentMax / printerValue) * 100));
    isNarrow = (rightPct - leftPct) < 12; // labels would overlap
  }

  const fillColor = isCompatible ? 'bg-green-500/70' : 'bg-amber-500/70';
  
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border p-4",
      "bg-gradient-to-br",
      gradientFrom,
      gradientTo,
      isCompatible ? "border-gray-700" : "border-amber-500/50"
    )}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-medium text-white">{label}</span>
        {!isCompatible && (
          <AlertTriangle className="w-4 h-4 text-amber-400 ml-auto" />
        )}
      </div>
      <div className="space-y-1">
        <div className="text-xs text-gray-400">Filament requires</div>
        <div className="text-lg font-bold text-white">{filamentRange}</div>
      </div>
      <div className="mt-2 pt-2 border-t border-white/10">
        <div className="text-xs text-gray-400">Your printer</div>
        <div className={cn("text-sm font-medium", isCompatible ? "text-emerald-400" : "text-amber-400")}>
          {printerMax}
        </div>
      </div>

      {/* Temperature overlap gauge */}
      {showGauge && (
        <div className="mt-3">
          <div className="relative w-full h-3 bg-gray-700/50 rounded-full">
            {/* Headroom fill (from filament max to printer max) */}
            {rightPct < 100 && (
              <div
                className="absolute top-0 h-full bg-gray-500/20 rounded-r-full"
                style={{ left: `${rightPct}%`, width: `${100 - rightPct}%` }}
              />
            )}
            {/* Filament required range */}
            <div
              className={cn("absolute top-0 h-full rounded-full", fillColor)}
              style={{ left: `${leftPct}%`, width: `${Math.max(rightPct - leftPct, 1)}%` }}
            />
            {/* Left tick */}
            <div
              className="absolute w-px h-4 bg-gray-400/60 -top-0.5"
              style={{ left: `${leftPct}%` }}
            />
            {/* Right tick */}
            <div
              className="absolute w-px h-4 bg-gray-400/60 -top-0.5"
              style={{ left: `${rightPct}%` }}
            />
          </div>
          {/* Labels */}
          <div className="relative h-3 mt-0.5">
            {isNarrow ? (
              <span
                className="absolute text-[10px] text-gray-400 -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${(leftPct + rightPct) / 2}%` }}
              >
                {filamentMin}-{filamentMax}°C
              </span>
            ) : (
              <>
                <span
                  className="absolute text-[10px] text-gray-400 -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${leftPct}%` }}
                >
                  {filamentMin}°C
                </span>
                <span
                  className="absolute text-[10px] text-gray-400 -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${rightPct}%` }}
                >
                  {filamentMax}°C
                </span>
              </>
            )}
            <span className="absolute right-0 text-[10px] text-gray-500">
              {printerValue}°C
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Nozzle Type Card
function NozzleTypeCard({ isAbrasive, recommendedNozzle }: { isAbrasive: boolean; recommendedNozzle: string | null }) {
  const nozzleType = isAbrasive ? 'Hardened Steel' : recommendedNozzle || 'Standard Brass';
  
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/80",
      isAbrasive ? "border-amber-500/50" : "border-gray-700"
    )}>
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-white">Nozzle Type</span>
        {isAbrasive && (
          <AlertTriangle className="w-4 h-4 text-amber-400 ml-auto" />
        )}
      </div>
      <div className="space-y-1">
        <div className="text-xs text-gray-400">Recommended</div>
        <div className="text-lg font-bold text-white">{nozzleType}</div>
      </div>
      {isAbrasive && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="text-xs text-amber-400">
            ⚠️ Abrasive material - brass nozzles will wear quickly
          </div>
        </div>
      )}
    </div>
  );
}

export function CompatibilityTabContent({
  filament,
  selectedPrinter,
  compatibility,
  printerLoading,
}: CompatibilityTabContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [comparePrinterId, setComparePrinterId] = useState<string>('');

  // Define printer type for comparison
  interface ComparisonPrinter {
    id: string;
    printer_id: string;
    model_name: string;
    max_nozzle_temp_c: number | null;
    bed_max_temp_c: number | null;
    brand: { brand: string } | null;
  }

  // Fetch popular printers for comparison
  const { data: popularPrinters } = useQuery({
    queryKey: ['popular-printers-compatibility'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printers')
        .select('id, printer_id, model_name, max_nozzle_temp_c, bed_max_temp_c, brand:printer_brands(brand)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as ComparisonPrinter[];
    },
  });

  // Calculate compatibility for comparison printer
  const comparisonPrinter = useMemo(() => {
    if (!comparePrinterId || !popularPrinters) return null;
    return popularPrinters.find(p => p.id === comparePrinterId);
  }, [comparePrinterId, popularPrinters]);

  const comparisonCompatibility = useMemo(() => {
    if (!comparisonPrinter || !filament) return null;
    return checkPrinterFilamentCompatibility(comparisonPrinter as any, filament);
  }, [comparisonPrinter, filament]);

  // Current display printer (user's selected or comparison)
  const displayPrinter = comparePrinterId ? comparisonPrinter : selectedPrinter;
  const displayCompatibility = comparePrinterId ? comparisonCompatibility : compatibility;

  const status = getCompatibilityStatus(displayCompatibility);
  const statusConfig = STATUS_CONFIG[status];

  // Check temperature compatibility - handle both naming conventions
  const printerMaxNozzle = displayPrinter?.max_nozzle_temp_c;
  const printerMaxBed = (displayPrinter as any)?.bed_max_temp_c ?? (displayPrinter as any)?.max_bed_temp_c;
  
  const nozzleTempOk = printerMaxNozzle 
    ? (filament.nozzle_temp_max_c || 0) <= printerMaxNozzle 
    : true;
  const bedTempOk = printerMaxBed 
    ? (filament.bed_temp_max_c || 0) <= printerMaxBed 
    : true;

  // Build printer compatibility table data
  const printerCompatibilityData = useMemo(() => {
    if (!popularPrinters || !filament) return [];
    
    return popularPrinters.slice(0, 10).map(printer => {
      const compat = checkPrinterFilamentCompatibility(printer as any, filament);
      return {
      id: printer.id,
      name: printer.model_name,
      brand: printer.brand?.brand || 'Unknown',
      nozzleTemp: printer.max_nozzle_temp_c,
      bedTemp: printer.bed_max_temp_c,
      status: getCompatibilityStatus(compat),
    };
    });
  }, [popularPrinters, filament]);

  return (
    <div className="space-y-6">
      {/* Printer Selection / Change Printer */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Printer className="w-4 h-4 text-primary" />
              <span>Check compatibility with:</span>
            </div>
            <Select 
              value={comparePrinterId || "__current__"} 
              onValueChange={(val) => setComparePrinterId(val === "__current__" ? "" : val)}
            >
              <SelectTrigger className="w-full sm:w-[280px] bg-gray-800/50 border-gray-700">
                <SelectValue placeholder={selectedPrinter?.model_name || "Select a printer..."} />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 z-50">
                {selectedPrinter && (
                  <SelectItem value="__current__">
                    {selectedPrinter.model_name} (Your printer)
                  </SelectItem>
                )}
                {popularPrinters?.map(printer => (
                  <SelectItem key={printer.id} value={printer.id}>
                    {printer.brand?.brand} {printer.model_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {comparePrinterId && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setComparePrinterId('')}
                className="text-gray-400 hover:text-white"
              >
                Reset to my printer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Printer Compatibility */}
      {displayPrinter && (
        <Card className={cn("border overflow-hidden", statusConfig.bgClass)}>
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Printer className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{displayPrinter.model_name}</h3>
                  <p className="text-sm text-gray-400">Printer compatibility</p>
                </div>
              </div>
              <CompatibilityStatusBadge status={status} />
            </div>
            
            {/* Temperature & Nozzle Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <TempCard
                label="Nozzle Temperature"
                icon={<Flame className="w-5 h-5 text-orange-400" />}
                printerValue={displayPrinter.max_nozzle_temp_c}
                filamentMin={filament.nozzle_temp_min_c}
                filamentMax={filament.nozzle_temp_max_c}
                gradientFrom="from-orange-950/50"
                gradientTo="to-red-950/30"
                isCompatible={nozzleTempOk}
              />
              <TempCard
                label="Bed Temperature"
                icon={<Thermometer className="w-5 h-5 text-blue-400" />}
                printerValue={printerMaxBed}
                filamentMin={filament.bed_temp_min_c}
                filamentMax={filament.bed_temp_max_c}
                gradientFrom="from-blue-950/50"
                gradientTo="to-cyan-950/30"
                isCompatible={bedTempOk}
              />
              <NozzleTypeCard 
                isAbrasive={filament.is_nozzle_abrasive || false}
                recommendedNozzle={filament.recommended_nozzle_type}
              />
            </div>

            {/* Limitations */}
            {displayCompatibility?.limitations && displayCompatibility.limitations.length > 0 && (
              <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Adjustments Needed
                </h4>
                <ul className="text-sm text-gray-300 space-y-1.5">
                  {displayCompatibility.limitations.map((limit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      {limit}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {displayCompatibility?.recommendations && (
              <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <h4 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Printing Recommendations
                </h4>
                <ul className="text-sm text-gray-300 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    Nozzle: {displayCompatibility.recommendations.nozzle.material} ({displayCompatibility.recommendations.nozzle.size.join(', ')})
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    Temperature: {displayCompatibility.recommendations.slicer.nozzle_temp_range}
                  </li>
                  {displayCompatibility.recommendations.slicer.notes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
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
      {!printerLoading && !selectedPrinter && !comparePrinterId && (
        <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-dashed border-2 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="p-4 bg-primary/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Printer className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Select Your Printer</h3>
            <p className="text-gray-400 mb-4 max-w-md mx-auto">
              Get personalized temperature ranges and recommendations for this filament
            </p>
            <Button size="lg" asChild>
              <Link to="/">
                <Printer className="w-4 h-4 mr-2" />
                Choose a Printer
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Expandable Full Compatibility Table */}
      {printerCompatibilityData.length > 0 && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <Card className="bg-card/50 border-border overflow-hidden">
            <CollapsibleTrigger asChild>
              <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/30 transition-colors">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  View Full Compatibility
                </h3>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-sm">{printerCompatibilityData.length} printers</span>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 transition-transform" />
                  ) : (
                    <ChevronRight className="w-5 h-5 transition-transform" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t border-gray-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Printer</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Nozzle Temp</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Bed Temp</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {printerCompatibilityData.map((printer) => (
                        <tr 
                          key={printer.id} 
                          className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                          onClick={() => setComparePrinterId(printer.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{printer.name}</div>
                            <div className="text-xs text-gray-500">{printer.brand}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {printer.nozzleTemp ? `${printer.nozzleTemp}°C` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {printer.bedTemp ? `${printer.bedTemp}°C` : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <CompatibilityStatusBadge status={printer.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* General Compatibility Info */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Material Compatibility Overview</h3>
          
          <div className="grid gap-4">
            {/* Temperature Requirements */}
            <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
              <h4 className="font-medium mb-3 flex items-center gap-2 text-white">
                <Thermometer className="w-4 h-4 text-primary" />
                Temperature Requirements
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Nozzle Temp:</span>
                  <span className="ml-2 font-medium text-white">
                    {filament.nozzle_temp_min_c && filament.nozzle_temp_max_c 
                      ? `${filament.nozzle_temp_min_c}-${filament.nozzle_temp_max_c}°C`
                      : 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Bed Temp:</span>
                  <span className="ml-2 font-medium text-white">
                    {filament.bed_temp_min_c && filament.bed_temp_max_c 
                      ? `${filament.bed_temp_min_c}-${filament.bed_temp_max_c}°C`
                      : 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Printer Type Compatibility */}
            <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
              <h4 className="font-medium mb-3 flex items-center gap-2 text-white">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Generally Compatible With
              </h4>
              <div className="flex flex-wrap gap-2">
                {['Enclosed Printers', 'Bed Slingers', 'CoreXY', 'Delta'].map((type) => (
                  <span 
                    key={type}
                    className="px-3 py-1.5 text-sm bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Special Requirements */}
            {(filament.is_nozzle_abrasive || filament.moisture_sensitivity_level === 'High') && (
              <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <h4 className="font-medium mb-3 flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  Special Requirements
                </h4>
                <ul className="text-sm space-y-2 text-gray-300">
                  {filament.is_nozzle_abrasive && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      Requires hardened steel nozzle (abrasive material)
                    </li>
                  )}
                  {filament.moisture_sensitivity_level === 'High' && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      Requires dry storage and possibly active drying before printing
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
