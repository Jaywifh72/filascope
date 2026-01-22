import React, { useState, useMemo } from 'react';
import { 
  Palette, Layers, Package, Cpu, ExternalLink, TrendingUp, TrendingDown, 
  CheckCircle2, XCircle, ChevronDown, Thermometer, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AccessoryCompatibilityBadge } from '@/components/AccessoryCompatibilityBadge';
import { AccessoryPriceChart } from '@/components/AccessoryPriceChart';
import { AccessoriesEmptyState } from '@/components/ui/empty-state';
import {
  checkHotendPrinterCompatibility,
  checkBuildPlatePrinterCompatibility,
  checkAmsPrinterCompatibility,
} from '@/lib/accessoryCompatibility';

interface MaterialsTabContentProps {
  printer: any;
  accessories: any[];
}

// Material categories with their materials
const MATERIAL_CATEGORIES = {
  Standard: ['PLA', 'PETG', 'PLA+', 'PLA-CF', 'Silk PLA', 'Matte PLA'],
  Engineering: ['ABS', 'ASA', 'Nylon', 'PA', 'PC', 'PA-CF', 'PA-GF', 'PC-CF', 'PAHT-CF'],
  Flexible: ['TPU', 'TPE', 'Flex', 'TPU 95A'],
  Specialty: ['PEEK', 'PPS', 'PEI', 'PEKK', 'Wood', 'Metal', 'Carbon Fiber'],
  Support: ['PVA', 'HIPS', 'BVOH'],
};

// Multi-material systems
const ALL_SYSTEMS = [
  { name: 'Bambu Lab AMS', key: 'ams', url: '/accessories?type=ams_mmu&brand=bambu' },
  { name: 'Bambu Lab AMS Lite', key: 'ams lite', url: '/accessories?type=ams_mmu&brand=bambu' },
  { name: 'Prusa MMU2S', key: 'mmu2s', url: '/accessories?type=ams_mmu&brand=prusa' },
  { name: 'Prusa MMU3', key: 'mmu3', url: '/accessories?type=ams_mmu&brand=prusa' },
  { name: 'E3D ToolChanger', key: 'toolchanger', url: null },
  { name: 'Mosaic Palette', key: 'palette', url: null },
  { name: 'ERCF (Enraged Rabbit)', key: 'ercf', url: null },
  { name: '3DChameleon', key: '3dchameleon', url: null },
];

// Parse materials string into categorized list
function parseMaterials(materialsStr: string | null | undefined): Map<string, string[]> {
  const result = new Map<string, string[]>();
  if (!materialsStr) return result;

  const materials = materialsStr.split(/[,;|]/).map(m => m.trim()).filter(Boolean);
  
  for (const [category, categoryMaterials] of Object.entries(MATERIAL_CATEGORIES)) {
    const matched = materials.filter(m => 
      categoryMaterials.some(cm => 
        m.toLowerCase().includes(cm.toLowerCase()) || 
        cm.toLowerCase().includes(m.toLowerCase())
      )
    );
    if (matched.length > 0) {
      result.set(category, matched);
    }
  }

  // Add any unmatched materials to "Other"
  const allMatched = Array.from(result.values()).flat();
  const unmatched = materials.filter(m => 
    !allMatched.some(am => am.toLowerCase() === m.toLowerCase())
  );
  if (unmatched.length > 0) {
    result.set('Other', unmatched);
  }

  return result;
}

// Get color for material category
function getCategoryColor(category: string): string {
  switch (category) {
    case 'Standard': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'Engineering': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'Flexible': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'Specialty': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'Support': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default: return 'bg-muted text-muted-foreground border-border/50';
  }
}

// Temperature bar component
function TemperatureBar({ 
  label, 
  maxTemp, 
  icon: Icon,
  colorClass 
}: { 
  label: string; 
  maxTemp: number | null; 
  icon: React.ElementType;
  colorClass: string;
}) {
  const MAX_SCALE = 500; // Max temp for visual scale
  const temp = maxTemp || 0;
  const percentage = Math.min((temp / MAX_SCALE) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">{label}</span>
        </div>
        <span className={cn("text-base font-medium", temp > 0 ? "text-white" : "text-gray-500")}>
          {temp > 0 ? `${temp}°C` : 'N/A'}
        </span>
      </div>
      <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
        {temp > 0 && (
          <div 
            className={cn("absolute left-0 top-0 h-full rounded-full transition-all", colorClass)}
            style={{ width: `${percentage}%` }}
          />
        )}
        {/* Temperature markers */}
        <div className="absolute inset-0 flex justify-between px-1">
          {[100, 200, 300, 400].map((mark) => (
            <div 
              key={mark}
              className="w-px h-full bg-border/50"
              style={{ marginLeft: `${(mark / MAX_SCALE) * 100 - 1}%` }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span>0°C</span>
        <span>250°C</span>
        <span>500°C</span>
      </div>
    </div>
  );
}

// Section header component with consistent styling
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="section-header">
      <div className="section-header-icon">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="section-title">{title}</h3>
    </div>
  );
}

export function MaterialsTabContent({ printer, accessories }: MaterialsTabContentProps) {
  const [showIncompatible, setShowIncompatible] = useState(false);

  // Parse supported materials
  const categorizedMaterials = useMemo(
    () => parseMaterials(printer.official_supported_materials),
    [printer.official_supported_materials]
  );

  // Parse recommended materials
  const recommendedMaterials = useMemo(() => {
    if (!printer.recommended_materials) return [];
    return printer.recommended_materials.split(/[,;|]/).map((m: string) => m.trim()).filter(Boolean);
  }, [printer.recommended_materials]);

  // Check system compatibility
  const compatibleSystems = useMemo(() => {
    const systems = printer.compatible_multi_material_systems
      ? printer.compatible_multi_material_systems.toLowerCase().split(/[,;|]/).map((s: string) => s.trim())
      : [];
    return ALL_SYSTEMS.map(system => ({
      ...system,
      isCompatible: systems.some(
        (cs: string) => cs.includes(system.key.toLowerCase()) || system.key.toLowerCase().includes(cs)
      )
    }));
  }, [printer.compatible_multi_material_systems]);

  const compatibleCount = compatibleSystems.filter(s => s.isCompatible).length;
  const incompatibleSystems = compatibleSystems.filter(s => !s.isCompatible);
  const compatibleSystemsList = compatibleSystems.filter(s => s.isCompatible);

  // Filter accessories by type
  const hotends = accessories.filter((a) => a.accessory_type === 'nozzle' || a.accessory_type === 'hotend');
  const buildPlates = accessories.filter((a) => a.accessory_type === 'build_plate');
  const amsMmu = accessories.filter((a) => a.accessory_type === 'ams_mmu');

  return (
    <div className="tab-content">
      {/* Temperature Capability Visual */}
      <section className="section-card">
        <SectionHeader icon={Thermometer} title="Temperature Capability" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <TemperatureBar
            label="Max Nozzle Temperature" 
            maxTemp={printer.max_nozzle_temp_c} 
            icon={Thermometer}
            colorClass="bg-gradient-to-r from-orange-500 to-red-500"
          />
          <TemperatureBar 
            label="Max Bed Temperature" 
            maxTemp={printer.bed_max_temp_c} 
            icon={Layers}
            colorClass="bg-gradient-to-r from-blue-500 to-cyan-500"
          />
        </div>
        {printer.max_recommended_material_temp_c && (
          <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Max recommended material temperature: <strong className="text-foreground">{printer.max_recommended_material_temp_c}°C</strong>
            </span>
          </div>
        )}
      </section>

      {/* Supported Materials */}
      <section className="section-card">
        <SectionHeader icon={Palette} title="Supported Materials" />
        
        {categorizedMaterials.size > 0 ? (
          <div className="space-y-4">
            {Array.from(categorizedMaterials.entries()).map(([category, materials]) => (
              <div key={category}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-lg font-medium text-foreground">{category}</span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {materials.map((material) => (
                    <span 
                      key={material}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-full border",
                        getCategoryColor(category)
                      )}
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border/50 rounded-lg">
            No supported materials data available
          </div>
        )}

        {printer.abrasive_materials_supported && (
          <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">Abrasive materials supported</strong> — Carbon fiber, glass fiber, and metal-filled filaments
            </span>
          </div>
        )}
      </section>

      {/* Multi-Material System Compatibility */}
      <section className="section-card">
        <SectionHeader icon={Package} title="Multi-Material System Compatibility" />
        
        {/* Compatible Systems */}
        {compatibleCount > 0 ? (
          <div className="space-y-2 mb-4">
            {compatibleSystemsList.map((system) => (
              <div 
                key={system.key} 
                className="flex items-center justify-between py-3 px-4 bg-green-500/5 border border-green-500/20 rounded-lg"
              >
                {system.url ? (
                  <a href={system.url} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    {system.name}
                  </a>
                ) : (
                  <span className="text-sm font-medium text-foreground">{system.name}</span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Compatible
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground border border-dashed border-border/50 rounded-lg mb-4">
            No compatible multi-material systems detected
          </div>
        )}

        {/* Incompatible Systems (Collapsible) */}
        {incompatibleSystems.length > 0 && (
          <Collapsible open={showIncompatible} onOpenChange={setShowIncompatible}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-between py-2">
                <span>Not Compatible ({incompatibleSystems.length} systems)</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", showIncompatible && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {incompatibleSystems.map((system) => (
                <div 
                  key={system.key} 
                  className="flex items-center justify-between py-2.5 px-4 bg-muted/20 border border-border/30 rounded-lg"
                >
                  <span className="text-sm text-muted-foreground/70">{system.name}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-muted/30 text-muted-foreground/60 border border-border/40">
                    <XCircle className="w-3 h-3" />
                    Incompatible
                  </span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Native System Info */}
        {printer.native_multi_material_system && (
          <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Native Multi-Material</span>
              <span className="font-medium text-primary">Yes</span>
            </div>
            {printer.multi_material_max_spools && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Max Spools</span>
                <span className="font-medium text-foreground">{printer.multi_material_max_spools}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Material Recommendations */}
      <section className="section-card">
        <SectionHeader icon={CheckCircle2} title="Material Recommendations" />
        
        {recommendedMaterials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {recommendedMaterials.slice(0, 6).map((material: string, index: number) => (
              <Card key={index} className="bg-card/80 border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Palette className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">{material}</span>
                      <p className="text-xs text-muted-foreground">Recommended</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border/50 rounded-lg">
            No material recommendations available
          </div>
        )}

        {printer.materials_notes && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-sm text-muted-foreground">{printer.materials_notes}</p>
          </div>
        )}
      </section>

      {/* Compatible Accessories */}
      <section className="section-card">
        <SectionHeader icon={Cpu} title="Compatible Accessories" />
        
        {(!accessories || accessories.length === 0) ? (
          <AccessoriesEmptyState printerSlug={printer.model_name || printer.id} />
        ) : (
          <div className="space-y-6">
            {/* Hotends */}
            {hotends.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg font-medium text-foreground">
                    Hotends ({hotends.length})
                  </span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {hotends.slice(0, 6).map((acc) => {
                    const specs = acc.specs as any;
                    const compatibility = checkHotendPrinterCompatibility(acc, printer);
                    return (
                      <Card key={acc.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-sm line-clamp-2">{acc.name}</h5>
                            <AccessoryCompatibilityBadge compatibility={compatibility} compact />
                          </div>
                          <div className="space-y-1 text-xs">
                            {specs?.diameter_mm && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Diameter:</span>
                                <span className="font-medium">{specs.diameter_mm}mm</span>
                              </div>
                            )}
                            {specs?.max_temp_c && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Max Temp:</span>
                                <span className="font-medium">{specs.max_temp_c}°C</span>
                              </div>
                            )}
                            {acc.price && (
                              <div className="flex justify-between pt-1 border-t">
                                <span className="text-muted-foreground">Price:</span>
                                <span className="font-bold text-primary">${acc.price}</span>
                              </div>
                            )}
                          </div>
                          {acc.product_url && (
                            <a href={acc.product_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="w-full mt-2 gap-2">
                                <ExternalLink className="h-3 w-3" />
                                View
                              </Button>
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Build Plates */}
            {buildPlates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Build Plates ({buildPlates.length})
                  </span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buildPlates.slice(0, 6).map((acc) => {
                    const specs = acc.specs as any;
                    const compatibility = checkBuildPlatePrinterCompatibility(acc, printer);
                    return (
                      <Card key={acc.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-sm capitalize">{acc.name}</h5>
                            <AccessoryCompatibilityBadge compatibility={compatibility} compact />
                          </div>
                          <div className="space-y-1 text-xs">
                            {specs?.surface && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Surface:</span>
                                <span className="font-medium">{specs.surface}</span>
                              </div>
                            )}
                            {acc.price && (
                              <div className="flex justify-between pt-1 border-t">
                                <span className="text-muted-foreground">Price:</span>
                                <span className="font-bold text-primary">${acc.price}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AMS/MMU Systems */}
            {amsMmu.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Multi-Material Units ({amsMmu.length})
                  </span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {amsMmu.map((acc) => {
                    const specs = (acc.specs || {}) as any;
                    const compatibility = checkAmsPrinterCompatibility(acc, printer);
                    return (
                      <Card key={acc.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold capitalize">{acc.name || 'Unknown'}</h5>
                            <AccessoryCompatibilityBadge compatibility={compatibility} compact />
                          </div>
                          <div className="space-y-2 text-sm">
                            {specs.spool_capacity != null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Spool Capacity:</span>
                                <span className="font-medium">{specs.spool_capacity} spools</span>
                              </div>
                            )}
                            {specs.heated !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Heated:</span>
                                <span className="font-medium">{specs.heated ? 'Yes' : 'No'}</span>
                              </div>
                            )}
                            {acc.price && (
                              <div className="flex justify-between pt-2 border-t">
                                <span className="text-muted-foreground">Price:</span>
                                <span className="font-bold text-primary">${acc.price}</span>
                              </div>
                            )}
                          </div>
                          <AccessoryPriceChart accessoryId={acc.id} currentPrice={acc.price} currency={acc.currency || 'USD'} />
                          {acc.product_url && (
                            <a href={acc.product_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="w-full mt-2 gap-2">
                                <ExternalLink className="h-3 w-3" />
                                View Product
                              </Button>
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
