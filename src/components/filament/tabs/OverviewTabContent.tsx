import React from 'react';
import { Database } from '@/integrations/supabase/types';
import { TechnicalDetailsAccordion } from '../TechnicalDetailsAccordion';
import { BestPricesSection } from '../BestPricesSection';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Package, 
  Droplets, 
  Shield, 
  CheckCircle2, 
  AlertTriangle,
  User,
  Wrench,
  Palette,
  Box,
  Gauge
} from 'lucide-react';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface OverviewTabContentProps {
  filament: Filament;
  onNavigateToPricing?: () => void;
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
  
  // Build highlights
  const highlights: string[] = [];
  if (filament.high_speed_capable) highlights.push('high-speed printing');
  if (filament.spool_ams_fit) highlights.push('AMS compatibility');
  if (filament.print_speed_max_mms && filament.print_speed_max_mms > 300) highlights.push(`speeds up to ${filament.print_speed_max_mms}mm/s`);
  
  // Build use case description
  const useCases = filament.use_case_tags?.slice(0, 2).join(' and ') || 'general purpose printing';
  
  let summary = `A high-quality ${material} from ${vendor}`;
  
  if (highlights.length > 0) {
    summary += ` featuring ${highlights.slice(0, 2).join(' and ')}`;
  }
  
  summary += `. This ${easeLabel} material is well-suited for ${useCases}.`;
  
  return summary;
}

// Infer "Ideal For" tags from filament properties
function inferIdealForTags(filament: Filament): Array<{ label: string; icon: React.ReactNode }> {
  const tags: Array<{ label: string; icon: React.ReactNode }> = [];
  
  // Beginners - easy to print
  if (filament.ease_of_printing_score && filament.ease_of_printing_score >= 7) {
    tags.push({ label: 'Beginners', icon: <User className="w-3.5 h-3.5" /> });
  }
  
  // Functional parts - from use case tags or material type
  const functionalMaterials = ['PETG', 'ABS', 'ASA', 'PA', 'PC', 'PAHT'];
  if (
    filament.use_case_tags?.some(t => t.toLowerCase().includes('functional')) ||
    functionalMaterials.includes(filament.material?.toUpperCase() || '')
  ) {
    tags.push({ label: 'Functional Parts', icon: <Wrench className="w-3.5 h-3.5" /> });
  }
  
  // High detail prints
  if (
    filament.use_case_tags?.some(t => 
      t.toLowerCase().includes('art') || 
      t.toLowerCase().includes('decorative') ||
      t.toLowerCase().includes('detail')
    ) ||
    filament.finish_type?.toLowerCase().includes('silk') ||
    filament.finish_type?.toLowerCase().includes('matte')
  ) {
    tags.push({ label: 'High Detail Prints', icon: <Palette className="w-3.5 h-3.5" /> });
  }
  
  // High-volume printing
  if (filament.high_speed_capable) {
    tags.push({ label: 'High-Volume Printing', icon: <Gauge className="w-3.5 h-3.5" /> });
  }
  
  // Prototyping
  if (filament.use_case_tags?.some(t => t.toLowerCase().includes('prototype'))) {
    tags.push({ label: 'Rapid Prototyping', icon: <Box className="w-3.5 h-3.5" /> });
  }
  
  return tags;
}

// Infer "Not Recommended For" warnings
function inferNotRecommendedWarnings(filament: Filament): Array<{ label: string; reason: string }> {
  const warnings: Array<{ label: string; reason: string }> = [];
  
  // High heat applications - check Tg and HDT
  const tg = filament.tg_c;
  const hdt = filament.hdt_045_mpa_c || filament.hdt_18_mpa_c;
  if ((tg && tg < 60) || (hdt && hdt < 70)) {
    warnings.push({
      label: 'High-heat applications',
      reason: `Low heat resistance (${tg ? `Tg: ${tg}°C` : hdt ? `HDT: ${hdt}°C` : ''})`
    });
  }
  
  // Abrasive materials need special nozzles
  if (filament.is_nozzle_abrasive) {
    warnings.push({
      label: 'Standard brass nozzles',
      reason: 'Requires hardened steel nozzle'
    });
  }
  
  // High moisture sensitivity
  if (filament.moisture_sensitivity_level?.toLowerCase() === 'high') {
    warnings.push({
      label: 'Humid environments without dry storage',
      reason: 'Requires dry storage and drying before use'
    });
  }
  
  // Outdoor use for PLA
  if (filament.material?.toUpperCase() === 'PLA' && !filament.material?.includes('HT')) {
    warnings.push({
      label: 'Outdoor/UV exposure',
      reason: 'PLA degrades in sunlight and heat'
    });
  }
  
  return warnings;
}

export function OverviewTabContent({ filament, onNavigateToPricing }: OverviewTabContentProps) {
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

  // Get inferred tags and warnings
  const idealForTags = inferIdealForTags(filament);
  const notRecommendedWarnings = inferNotRecommendedWarnings(filament);
  const productSummary = generateProductSummary(filament);

  return (
    <div className="space-y-6">
      {/* Product Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/[0.02] border-primary/20">
        <CardContent className="p-6">
          <p className="text-base text-foreground/90 leading-relaxed">
            {productSummary}
          </p>
        </CardContent>
      </Card>

      {/* Best Prices Section - Above the fold */}
      <BestPricesSection 
        filamentId={filament.id} 
        onSeeAllPrices={onNavigateToPricing}
      />

      {/* Ideal For / Not Recommended Section */}
      {(idealForTags.length > 0 || notRecommendedWarnings.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Ideal For */}
          {idealForTags.length > 0 && (
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-semibold text-emerald-400">Ideal For</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {idealForTags.map((tag, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 gap-1.5"
                    >
                      {tag.icon}
                      {tag.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Not Recommended For */}
          {notRecommendedWarnings.length > 0 && (
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h4 className="font-semibold text-amber-400">Not Recommended For</h4>
                </div>
                <ul className="space-y-2">
                  {notRecommendedWarnings.map((warning, idx) => (
                    <li key={idx} className="text-sm">
                      <span className="text-amber-300">{warning.label}</span>
                      <span className="text-muted-foreground ml-1">— {warning.reason}</span>
                    </li>
                  ))}
                </ul>
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
