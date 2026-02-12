import React, { useState } from 'react';
import { Database } from '@/integrations/supabase/types';
import { TechnicalDetailsAccordion } from '../TechnicalDetailsAccordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BestPricesSection } from '../BestPricesSection';
import type { PriceCandidate } from '@/hooks/useFilamentDetailPricing';
import { useCommunityPhotoCount } from '@/hooks/useCommunityPhotos';
import { MaterialQuickGuide } from '../MaterialQuickGuide';
import { useBrowseHistory } from '@/hooks/useBrowseHistory';
import { 
  Zap, 
  Package, 
  Droplets, 
  Shield, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  User,
  Wrench,
  Palette,
  Box,
  Gauge,
  Camera,
  Sun,
  Thermometer,
  Utensils,
  Layers,
  ChevronDown,
  Car,
  Wind,
  Eye,
  Shapes,
  Hammer,
  Flower2,
} from 'lucide-react';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface OverviewTabContentProps {
  filament: Filament;
  onNavigateToPricing?: () => void;
  onNavigateToCommunity?: () => void;
  /** Pre-computed price candidates from the unified pricing hook */
  priceCandidates?: PriceCandidate[];
  /** Whether the pricing data is still loading */
  priceCandidatesLoading?: boolean;
  /** Total retailer count from unified hook */
  totalRetailerCount?: number;
}

// Helper function to get ease label
function getEaseLabel(score: number | null): string {
  if (!score) return 'standard';
  if (score >= 8) return 'beginner-friendly';
  if (score >= 6) return 'intermediate';
  if (score >= 4) return 'moderate';
  return 'advanced';
}

// Generate a dynamic product summary from filament properties
function generateProductSummary(filament: Filament): string {
  const material = filament.material || 'filament';
  const vendor = filament.vendor || 'manufacturer';
  const easeLabel = getEaseLabel(filament.ease_of_printing_score);
  
  const highlights: string[] = [];
  if (filament.high_speed_capable) highlights.push('high-speed printing');
  if (filament.spool_ams_fit) highlights.push('AMS compatibility');
  if (filament.print_speed_max_mms && filament.print_speed_max_mms > 300) highlights.push(`speeds up to ${filament.print_speed_max_mms}mm/s`);
  
  const useCases = filament.use_case_tags?.slice(0, 2).join(' and ') || 'general purpose printing';
  
  let summary = `A high-quality ${material} from ${vendor}`;
  
  if (highlights.length > 0) {
    summary += ` featuring ${highlights.slice(0, 2).join(' and ')}`;
  }
  
  summary += `. This ${easeLabel} material is well-suited for ${useCases}.`;
  
  return summary;
}

// ─── Use-case entry types ───

interface UseCaseEntry {
  label: string;
  reason: string;
  icon: React.ReactNode;
  isDefault: boolean;
}

// ─── Material-type defaults ───
// Add additional materials here following the same pattern.

interface MaterialDefaults {
  idealFor: Array<{ label: string; reason: string; icon: React.ReactNode; condition?: (f: Filament) => boolean }>;
  notRecommendedFor: Array<{ label: string; reason: string; icon: React.ReactNode }>;
}

const MATERIAL_DEFAULTS: Record<string, MaterialDefaults> = {
  PLA: {
    idealFor: [
      { label: 'High Detail Prints', reason: 'Excellent layer adhesion and minimal warping', icon: <Palette className="w-4 h-4" /> },
      { label: 'Cosplay & Props', reason: 'Holds fine detail well for costume pieces', icon: <Shapes className="w-4 h-4" /> },
      { label: 'Prototyping', reason: 'Easy to print, low cost per part', icon: <Box className="w-4 h-4" /> },
      { label: 'Decorative Items', reason: 'Good surface finish, wide color range', icon: <Flower2 className="w-4 h-4" /> },
      { label: 'Lithophanes / HueForge', reason: 'Predictable light transmission for art prints', icon: <Sun className="w-4 h-4" />, condition: (f) => f.transmission_distance != null },
    ],
    notRecommendedFor: [
      { label: 'Outdoor / UV Exposure', reason: 'PLA degrades in sunlight and heat', icon: <Sun className="w-4 h-4" /> },
      { label: 'Mechanical Parts Under Load', reason: 'PLA is brittle under sustained stress', icon: <Hammer className="w-4 h-4" /> },
      { label: 'High-Temperature Environments', reason: 'Softens above 55–60°C', icon: <Thermometer className="w-4 h-4" /> },
      { label: 'Food Contact', reason: 'Not food-safe unless specifically certified', icon: <Utensils className="w-4 h-4" /> },
    ],
  },
  PETG: {
    idealFor: [
      { label: 'Functional Parts', reason: 'Good impact resistance and durability', icon: <Wrench className="w-4 h-4" /> },
      { label: 'Outdoor Use', reason: 'Better UV and weather resistance than PLA', icon: <Sun className="w-4 h-4" /> },
      { label: 'Food Containers', reason: 'Food-safe when certified; chemical resistant', icon: <Utensils className="w-4 h-4" /> },
      { label: 'Protective Cases', reason: 'Excellent layer adhesion and flexibility', icon: <Shield className="w-4 h-4" /> },
    ],
    notRecommendedFor: [
      { label: 'High-Detail Miniatures', reason: 'Prone to stringing on fine features', icon: <Eye className="w-4 h-4" /> },
      { label: 'High-Temperature Applications', reason: 'Softens around 75–80°C', icon: <Thermometer className="w-4 h-4" /> },
    ],
  },
  ABS: {
    idealFor: [
      { label: 'Mechanical Parts', reason: 'Strong and impact resistant', icon: <Wrench className="w-4 h-4" /> },
      { label: 'Automotive Components', reason: 'Heat-resistant up to ~100°C', icon: <Car className="w-4 h-4" /> },
      { label: 'Heat-Resistant Applications', reason: 'High Tg and dimensional stability', icon: <Thermometer className="w-4 h-4" /> },
    ],
    notRecommendedFor: [
      { label: 'Open-Frame Printers', reason: 'Requires enclosed printer to prevent warping', icon: <Box className="w-4 h-4" /> },
      { label: 'Unventilated Spaces', reason: 'Produces fumes; ventilation needed', icon: <Wind className="w-4 h-4" /> },
    ],
  },
  // TODO: Add defaults for TPU, ASA, PA/Nylon, PC, etc.
};

function getMaterialFamily(material: string | null): string | null {
  if (!material) return null;
  const upper = material.toUpperCase().replace(/[- ]/g, '');
  // Match PLA variants (PLA+, PLA-HT, etc.) to PLA unless it's PLA-HT
  if (upper.startsWith('PLA') && !upper.includes('HT')) return 'PLA';
  if (upper.startsWith('PETG') || upper === 'PCTG') return 'PETG';
  if (upper.startsWith('ABS') || upper === 'ASA') return 'ABS';
  // Direct match
  if (MATERIAL_DEFAULTS[upper]) return upper;
  return null;
}

// Infer filament-specific "Ideal For" entries
function inferIdealForEntries(filament: Filament): UseCaseEntry[] {
  const entries: UseCaseEntry[] = [];
  
  if (filament.ease_of_printing_score && filament.ease_of_printing_score >= 7) {
    entries.push({ label: 'Beginners', reason: 'Easy to print with minimal tuning', icon: <User className="w-4 h-4" />, isDefault: false });
  }
  
  const functionalMaterials = ['PETG', 'ABS', 'ASA', 'PA', 'PC', 'PAHT'];
  if (
    filament.use_case_tags?.some(t => t.toLowerCase().includes('functional')) ||
    functionalMaterials.includes(filament.material?.toUpperCase() || '')
  ) {
    entries.push({ label: 'Functional Parts', reason: 'Strong enough for real-world use', icon: <Wrench className="w-4 h-4" />, isDefault: false });
  }
  
  if (
    filament.use_case_tags?.some(t => 
      t.toLowerCase().includes('art') || 
      t.toLowerCase().includes('decorative') ||
      t.toLowerCase().includes('detail')
    ) ||
    filament.finish_type?.toLowerCase().includes('silk') ||
    filament.finish_type?.toLowerCase().includes('matte')
  ) {
    entries.push({ label: 'High Detail Prints', reason: 'Surface finish suited for display pieces', icon: <Palette className="w-4 h-4" />, isDefault: false });
  }
  
  if (filament.high_speed_capable) {
    entries.push({ label: 'High-Volume Printing', reason: 'Optimized for fast print speeds', icon: <Gauge className="w-4 h-4" />, isDefault: false });
  }
  
  if (filament.use_case_tags?.some(t => t.toLowerCase().includes('prototype'))) {
    entries.push({ label: 'Rapid Prototyping', reason: 'Fast iteration with good accuracy', icon: <Box className="w-4 h-4" />, isDefault: false });
  }
  
  return entries;
}

// Infer filament-specific "Not Recommended" entries
function inferNotRecommendedEntries(filament: Filament): UseCaseEntry[] {
  const entries: UseCaseEntry[] = [];
  
  const tg = filament.tg_c;
  const hdt = filament.hdt_045_mpa_c || filament.hdt_18_mpa_c;
  if ((tg && tg < 60) || (hdt && hdt < 70)) {
    entries.push({
      label: 'High-Heat Applications',
      reason: `Low heat resistance (${tg ? `Tg: ${tg}°C` : hdt ? `HDT: ${hdt}°C` : ''})`,
      icon: <Thermometer className="w-4 h-4" />,
      isDefault: false,
    });
  }
  
  if (filament.is_nozzle_abrasive) {
    entries.push({
      label: 'Standard Brass Nozzles',
      reason: 'Requires hardened steel nozzle',
      icon: <Shield className="w-4 h-4" />,
      isDefault: false,
    });
  }
  
  if (filament.moisture_sensitivity_level?.toLowerCase() === 'high') {
    entries.push({
      label: 'Humid Environments',
      reason: 'Requires dry storage and drying before use',
      icon: <Droplets className="w-4 h-4" />,
      isDefault: false,
    });
  }
  
  return entries;
}

// Merge filament-specific entries with material defaults, deduplicating by label
function mergeWithDefaults(
  specific: UseCaseEntry[],
  defaults: Array<{ label: string; reason: string; icon: React.ReactNode; condition?: (f: Filament) => boolean }>,
  filament: Filament,
): UseCaseEntry[] {
  const specificLabels = new Set(specific.map(e => e.label.toLowerCase()));
  const defaultEntries: UseCaseEntry[] = defaults
    .filter(d => {
      if (d.condition && !d.condition(filament)) return false;
      return !specificLabels.has(d.label.toLowerCase());
    })
    .map(d => ({ label: d.label, reason: d.reason, icon: d.icon, isDefault: true }));
  
  return [...specific, ...defaultEntries];
}

// ─── Collapsible list sub-component ───

const VISIBLE_COUNT = 3;

function UseCaseList({ entries, materialFamily, variant }: {
  entries: UseCaseEntry[];
  materialFamily: string | null;
  variant: 'ideal' | 'notRecommended';
}) {
  const [expanded, setExpanded] = useState(false);
  const needsCollapse = entries.length > 4;
  const visibleEntries = needsCollapse && !expanded ? entries.slice(0, VISIBLE_COUNT) : entries;
  const hiddenCount = entries.length - VISIBLE_COUNT;

  // Find the split point between specific and default entries
  const firstDefaultIdx = visibleEntries.findIndex(e => e.isDefault);
  const hasSpecificAndDefault = firstDefaultIdx > 0;

  return (
    <div className="flex flex-col gap-2">
      {visibleEntries.map((entry, idx) => (
        <React.Fragment key={idx}>
          {/* Divider between specific and default entries */}
          {hasSpecificAndDefault && idx === firstDefaultIdx && materialFamily && (
            <div className="flex items-center gap-2 pt-1 pb-0.5">
              <div className="flex-1 border-t border-border/30" />
              <span className="text-[11px] text-muted-foreground italic whitespace-nowrap">
                Typical for {materialFamily}
              </span>
              <div className="flex-1 border-t border-border/30" />
            </div>
          )}
          <div className="flex items-start gap-2.5">
            <span className={variant === 'ideal' ? 'text-emerald-500/60 mt-0.5 flex-shrink-0' : 'text-amber-500/60 mt-0.5 flex-shrink-0'}>
              {entry.icon}
            </span>
            <div className="min-w-0">
              <span className="text-sm font-medium text-foreground/90">{entry.label}</span>
              <span className="text-xs text-muted-foreground ml-1.5">— {entry.reason}</span>
            </div>
          </div>
        </React.Fragment>
      ))}
      {needsCollapse && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Show {hiddenCount} more
        </button>
      )}
    </div>
  );
}

export function OverviewTabContent({ filament, onNavigateToPricing, onNavigateToCommunity, priceCandidates, priceCandidatesLoading, totalRetailerCount }: OverviewTabContentProps) {
  const { data: photoCount } = useCommunityPhotoCount(filament.id, "filament");
  const { localItems } = useBrowseHistory(1);
  const sessionViewCount = localItems.filter(i => i.product_type === 'filament').length;
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

  // ─── Build enriched use-case entries ───
  const materialFamily = getMaterialFamily(filament.material);
  const defaults = materialFamily ? MATERIAL_DEFAULTS[materialFamily] : null;

  const specificIdeal = inferIdealForEntries(filament);
  const specificNotRec = inferNotRecommendedEntries(filament);

  const idealEntries = defaults
    ? mergeWithDefaults(specificIdeal, defaults.idealFor, filament)
    : specificIdeal;
  
  const notRecEntries = defaults
    ? mergeWithDefaults(specificNotRec, defaults.notRecommendedFor.map(d => ({ ...d })), filament)
    : specificNotRec;

  const productSummary = generateProductSummary(filament);

  return (
    <div className="space-y-6">
      {/* Best Prices Section - Above the fold */}
      <BestPricesSection 
        filamentId={filament.id} 
        onViewAllPrices={onNavigateToPricing}
        candidates={priceCandidates}
        candidatesLoading={priceCandidatesLoading}
        totalRetailerCount={totalRetailerCount}
      />

      {/* Community Photos Link */}
      {photoCount != null && photoCount > 0 && onNavigateToCommunity && (
        <button
          onClick={onNavigateToCommunity}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-primary/30 transition-all text-sm text-muted-foreground hover:text-foreground group"
        >
          <Camera className="w-4 h-4 text-primary group-hover:text-primary" />
          <span className="font-medium">{photoCount} community print{photoCount !== 1 ? "s" : ""}</span>
          <span className="text-xs">→ View gallery</span>
        </button>
      )}

      {/* Product Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/[0.02] border-primary/20">
        <CardContent className="p-6">
          <p className="text-base text-foreground/90 leading-relaxed">
            {productSummary}
          </p>
        </CardContent>
      </Card>

      {/* Material Quick Guide — educational, collapsed by default */}
      <MaterialQuickGuide material={filament.material} sessionViewCount={sessionViewCount} />

      {/* Ideal For / Not Recommended Section */}
      {(idealEntries.length > 0 || notRecEntries.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Ideal For */}
          {idealEntries.length > 0 && (
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-semibold text-emerald-400">Ideal For</h4>
                </div>
                <UseCaseList entries={idealEntries} materialFamily={materialFamily} variant="ideal" />
              </CardContent>
            </Card>
          )}

          {/* Not Recommended For */}
          {notRecEntries.length > 0 && (
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h4 className="font-semibold text-amber-400">Not Recommended For</h4>
                </div>
                <UseCaseList entries={notRecEntries} materialFamily={materialFamily} variant="notRecommended" />
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
