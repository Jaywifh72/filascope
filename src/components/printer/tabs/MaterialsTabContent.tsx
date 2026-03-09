import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Palette, Layers, Package, Cpu, ExternalLink, TrendingUp, TrendingDown, 
  CheckCircle2, XCircle, ChevronDown, ChevronRight, Thermometer, AlertCircle, ArrowRight,
  BookOpen, Star
} from 'lucide-react';
import { materialNameToSlug } from '@/lib/materialSlugUtils';
import { toBrandSlug } from '@/utils/brandSlug';
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

// Infer materials based on temperature capability
function inferMaterialsFromTemp(maxNozzleTemp: number | null, maxBedTemp: number | null): Map<string, string[]> {
  const result = new Map<string, string[]>();
  if (!maxNozzleTemp) return result;

  // Standard materials (typically 180-230°C nozzle)
  if (maxNozzleTemp >= 200) {
    result.set('Standard', ['PLA', 'PLA+']);
  }

  // PETG and similar (230-260°C)
  if (maxNozzleTemp >= 240) {
    const existing = result.get('Standard') || [];
    result.set('Standard', [...existing, 'PETG']);
  }

  // Engineering materials (250-300°C)
  if (maxNozzleTemp >= 250) {
    const engineering: string[] = [];
    if (maxNozzleTemp >= 250) engineering.push('ABS', 'ASA');
    if (maxNozzleTemp >= 260) engineering.push('Nylon', 'PA');
    if (maxNozzleTemp >= 280) engineering.push('PC');
    if (engineering.length > 0) {
      result.set('Engineering', engineering);
    }
  }

  // Flexible materials (typically 220-250°C)
  if (maxNozzleTemp >= 220) {
    result.set('Flexible', ['TPU']);
  }

  return result;
}

// Get material temperature hints
function getMaterialTempHints(maxNozzleTemp: number | null): { material: string; temp: number; color: string }[] {
  if (!maxNozzleTemp) return [];
  
  const hints = [
    { material: 'PLA', temp: 200, color: 'text-green-400' },
    { material: 'PETG', temp: 240, color: 'text-green-400' },
    { material: 'TPU', temp: 230, color: 'text-purple-400' },
    { material: 'ABS', temp: 250, color: 'text-blue-400' },
    { material: 'ASA', temp: 250, color: 'text-blue-400' },
    { material: 'Nylon', temp: 260, color: 'text-blue-400' },
    { material: 'PC', temp: 280, color: 'text-orange-400' },
    { material: 'PEEK', temp: 380, color: 'text-red-400' },
  ];

  return hints.filter(h => h.temp <= maxNozzleTemp);
}

// Get color for material category
function getCategoryColor(category: string): string {
  switch (category) {
    case 'Standard': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'Engineering': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Flexible': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'Specialty': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'Support': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
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
      <h2 className="section-title">{title}</h2>
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

  // Infer materials from temperature if no official data
  const inferredMaterials = useMemo(
    () => inferMaterialsFromTemp(printer.max_nozzle_temp_c, printer.bed_max_temp_c),
    [printer.max_nozzle_temp_c, printer.bed_max_temp_c]
  );

  // Use official materials if available, otherwise use inferred
  const displayMaterials = categorizedMaterials.size > 0 ? categorizedMaterials : inferredMaterials;
  const isInferred = categorizedMaterials.size === 0 && inferredMaterials.size > 0;

  // Get temperature-based material hints
  const materialTempHints = useMemo(
    () => getMaterialTempHints(printer.max_nozzle_temp_c),
    [printer.max_nozzle_temp_c]
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

  // Brand info
  const brandName = printer.brand?.brand || printer.brand_name || '';
  const brandSlug = brandName ? toBrandSlug(brandName) : null;

  // Collect all supported material names for the recommended filaments query
  const allMaterialNames = useMemo(() => {
    const mats: string[] = [];
    for (const materials of displayMaterials.values()) {
      mats.push(...materials);
    }
    return mats;
  }, [displayMaterials]);

  // Fetch recommended filaments for this printer
  const { data: recommendedFilaments } = useQuery({
    queryKey: ['printer-recommended-filaments', printer.id, allMaterialNames],
    enabled: allMaterialNames.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('filaments')
        .select('id, product_title, product_handle, vendor, material, variant_price, featured_image, filascope_score')
        .in('material', allMaterialNames.slice(0, 6))
        .not('filascope_score', 'is', null)
        .not('product_handle', 'is', null)
        .order('filascope_score', { ascending: false })
        .limit(5);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Filter accessories by type
  const hotends = accessories.filter((a) => a.accessory_type === 'nozzle' || a.accessory_type === 'hotend');
  const buildPlates = accessories.filter((a) => a.accessory_type === 'build_plate');
  const amsMmu = accessories.filter((a) => a.accessory_type === 'ams_mmu');

  return (
    <div className="tab-content">
      {/* Browse Compatible Filaments Banner */}
      <section className="mb-6">
        <div className="flex items-center justify-between bg-teal-500/5 border border-teal-500/15 rounded-xl p-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground/90">
              This printer is compatible with {displayMaterials.size > 0 ? Array.from(displayMaterials.values()).flat().length : '—'} material types
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse our full filament database filtered for the {printer.model_name}
            </p>
          </div>
          <Button asChild size="sm" className="ml-4 bg-teal-600 hover:bg-teal-700 text-white flex-shrink-0">
            <Link to={`/filaments?printer=${encodeURIComponent(printer.model_name)}`}>
              Browse Compatible Filaments
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Supported Materials - Now at top with fallback logic */}
      <section className="section-card">
        <SectionHeader icon={Palette} title="Supported Materials" />
        
        {displayMaterials.size > 0 ? (
          <div className="space-y-4">
            {isInferred && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm text-muted-foreground mb-4">
                <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Based on max nozzle temperature of <strong className="text-foreground">{printer.max_nozzle_temp_c}°C</strong>
                </span>
              </div>
            )}
            {Array.from(displayMaterials.entries()).map(([category, materials]) => (
              <div key={category}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-lg font-medium text-foreground">{category}</span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {materials.map((material) => (
                    <Link 
                      key={material}
                      to={`/filaments?material=${encodeURIComponent(material)}&printer=${encodeURIComponent(printer.model_name)}`}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200",
                        "hover:scale-105 hover:shadow-md cursor-pointer",
                        getCategoryColor(category)
                      )}
                    >
                      {material}
                      <ArrowRight className="w-3 h-3 opacity-60" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border/50 rounded-lg">
            No temperature data available to infer compatible materials
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

      {/* Temperature Capability Visual with Material Hints */}
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
        
        {/* Material compatibility hints */}
        {materialTempHints.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-sm text-muted-foreground mb-3">Materials printable at this temperature:</p>
            <div className="flex flex-wrap gap-2">
              {materialTempHints.map((hint) => (
                <Link 
                  key={hint.material}
                  to={`/filaments?material=${encodeURIComponent(hint.material)}&printer=${encodeURIComponent(printer.model_name)}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border border-border/40 bg-muted/30 transition-all duration-200",
                    "hover:scale-105 hover:shadow-md cursor-pointer",
                    hint.color
                  )}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {hint.material}
                  <span className="text-muted-foreground/60">({hint.temp}°C)</span>
                  <ArrowRight className="w-3 h-3 opacity-60" />
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {printer.max_recommended_material_temp_c && (
          <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Max recommended material temperature: <strong className="text-foreground">{printer.max_recommended_material_temp_c}°C</strong>
            </span>
          </div>
        )}
      </section>

      {/* Multi-Material System */}
      <section className="section-card">
        <SectionHeader icon={Package} title="Multi-Material System" />
        
        {/* Native Multi-Material Info - show first if available */}
        {printer.native_multi_material_system && (
          <div className="flex items-center gap-3 py-3 px-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <span className="text-sm font-medium text-foreground">
                Built-in Multi-Material: Yes — supports up to {printer.multi_material_max_spools || '?'} spools
              </span>
            </div>
          </div>
        )}

        {/* Compatible Third-Party Systems */}
        {compatibleCount > 0 ? (
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Compatible Third-Party Systems</h4>
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
        ) : !printer.native_multi_material_system ? (
          <div className="text-center py-6 text-muted-foreground border border-dashed border-border/50 rounded-lg mb-4">
            No multi-material support detected
          </div>
        ) : null}

        {/* Incompatible Systems (Collapsible) */}
        {incompatibleSystems.length > 0 && (
          <Collapsible open={showIncompatible} onOpenChange={setShowIncompatible}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-between py-2">
                <span>Third-party compatibility: Not Compatible ({incompatibleSystems.length} systems)</span>
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
      </section>

      {/* Material Recommendations */}
      <section className="section-card">
        <SectionHeader icon={CheckCircle2} title="Material Recommendations" />
        
        {recommendedMaterials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {recommendedMaterials.slice(0, 6).map((material: string, index: number) => (
              <Link
                key={index}
                to={`/filaments?material=${encodeURIComponent(material)}&printer=${encodeURIComponent(printer.model_name)}`}
                className="block group"
              >
                <Card className="bg-card/80 border-border/40 hover:border-teal-500/30 hover:bg-muted/70 transition-all duration-150 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Palette className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{material}</span>
                        <p className="text-xs text-muted-foreground">Recommended</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">Browse {material} filaments →</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-teal-400 transition-colors duration-150 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
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

      {/* Buying Guides for This Printer */}
      <section className="section-card">
        <SectionHeader icon={BookOpen} title="Buying Guides for This Printer" />
        <div className="grid sm:grid-cols-2 gap-3">
          {(() => {
            const brandName = (printer.brand?.brand || printer.brand_name || '').toLowerCase();
            const modelName = (printer.model_name || '').toLowerCase();
            const guides: { href: string; label: string }[] = [];

            // Brand-specific guides
            if (brandName.includes('bambu')) {
              if (modelName.includes('p1s')) guides.push({ href: '/guides/best-filament-for-bambu-lab-p1s', label: 'Best Filaments for Bambu Lab P1S' });
              if (modelName.includes('a1') && modelName.includes('mini')) guides.push({ href: '/guides/best-filament-for-bambu-lab-a1-mini', label: 'Best Filaments for Bambu Lab A1 Mini' });
              if (modelName.includes('x1')) guides.push({ href: '/guides/best-filament-for-bambu-lab-x1-carbon', label: 'Best Filaments for Bambu Lab X1 Carbon' });
              // Fallback to P1S guide as a general Bambu guide
              if (guides.length === 0) guides.push({ href: '/guides/best-filament-for-bambu-lab-p1s', label: 'Best Filaments for Bambu Lab Printers' });
            }
            if (brandName.includes('prusa')) guides.push({ href: '/guides/best-filament-for-prusa-mk4', label: 'Best Filaments for Prusa MK4' });
            if (brandName.includes('creality')) {
              if (modelName.includes('k1')) guides.push({ href: '/guides/best-filament-for-creality-k1', label: 'Best Filaments for Creality K1 & K1 Max' });
              if (modelName.includes('ender')) guides.push({ href: '/guides/best-filament-for-creality-ender-3-v3', label: 'Best Filaments for Creality Ender 3 V3' });
              if (guides.length === 0) guides.push({ href: '/guides/best-filament-for-creality-k1', label: 'Best Filaments for Creality Printers' });
            }

            // Universal guides
            guides.push(
              { href: '/guides/how-to-choose-3d-printer-filament', label: 'How to Choose the Right 3D Printer Filament' },
              { href: '/guides/3d-printer-filament-types-explained', label: '3D Printer Filament Types Explained' },
              { href: '/guides/filament-temperature-guide', label: 'Filament Temperature Guide — Print Settings for Every Material' },
            );

            return guides.map(g => (
              <Link
                key={g.href}
                to={g.href}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-border/40 bg-muted/30 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
              >
                <BookOpen className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">{g.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-primary transition-colors" />
              </Link>
            ));
          })()}
        </div>
      </section>
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
