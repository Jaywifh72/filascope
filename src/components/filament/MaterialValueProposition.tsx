import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Dna } from "lucide-react";
import { getMaterialValueProposition, getComparisonMaterial } from "@/lib/materialValuePropositions";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import { useIntelligentContent } from "@/hooks/useIntelligentContent";
import { useSmartComparisons } from "@/hooks/useSmartComparisons";
import { useComparisonPreview } from "@/hooks/useComparisonPreview";
import { useCompare } from "@/hooks/useCompare";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ComparisonPreviewTooltip } from "./ComparisonPreviewTooltip";
import { MultiCompareCards } from "./MultiCompareCards";
import { ComparisonHistoryContext } from "./ComparisonHistoryContext";
import { SmartComparisonSuggestion } from "@/lib/smartComparisonService";


type Filament = Database["public"]["Tables"]["filaments"]["Row"];
type Printer = Database["public"]["Tables"]["printers"]["Row"];
type Accessory = Database["public"]["Tables"]["printer_accessories"]["Row"];

interface MaterialValuePropositionProps {
  material: string | null | undefined;
  productTitle: string;
  filamentId: string;
  vendor?: string | null;
  filament?: Filament | null;
  printer?: Printer | null;
  hotend?: Accessory | null;
}

export function MaterialValueProposition({
  material,
  productTitle,
  filamentId,
  vendor,
  filament,
  printer,
  hotend,
}: MaterialValuePropositionProps) {
  const navigate = useNavigate();
  const { addItem, items } = useCompare();
  
  const proposition = getMaterialValueProposition(material, productTitle);
  const comparisonMaterial = getComparisonMaterial(material);
  const intelligentContent = useIntelligentContent(filament || null, printer || null, hotend || null);
  
  // Smart comparison suggestions
  const filamentForComparison = useMemo(() => {
    if (!filament) return null;
    return {
      id: filament.id,
      product_title: filament.product_title,
      material: filament.material,
      vendor: filament.vendor,
      variant_price: filament.variant_price,
      net_weight_g: filament.net_weight_g,
      strength_index: filament.strength_index,
      printability_index: filament.printability_index,
      color_hex: filament.color_hex
    };
  }, [filament]);
  
  const { suggestions, primarySuggestion, isLoading: suggestionsLoading } = useSmartComparisons(filamentForComparison, 3);
  
  // Comparison preview for hover
  const primaryComparisonFilament = useMemo(() => {
    if (!primarySuggestion) return null;
    return {
      product_title: primarySuggestion.name,
      variant_price: primarySuggestion.price,
      net_weight_g: null, // Not available from suggestion
      strength_index: primarySuggestion.strength_index,
      printability_index: primarySuggestion.printability_index
    };
  }, [primarySuggestion]);
  
  const currentFilamentForPreview = useMemo(() => {
    if (!filament) return null;
    return {
      product_title: filament.product_title,
      variant_price: filament.variant_price,
      net_weight_g: filament.net_weight_g,
      strength_index: filament.strength_index,
      printability_index: filament.printability_index
    };
  }, [filament]);
  
  const previewData = useComparisonPreview(currentFilamentForPreview, primaryComparisonFilament);
  
  // Track which items are in the compare tray
  const addedIds = useMemo(() => new Set(items.map(i => i.id)), [items]);

  if (!material) return null;

  // Merge static and dynamic "perfect for" items
  const allPerfectFor = [
    ...proposition.perfectFor,
    ...(intelligentContent?.dynamicPerfectFor || [])
  ].filter((item, index, self) => self.indexOf(item) === index); // dedupe

  const handleCompare = () => {
    if (comparisonMaterial) {
      navigate(`/materials?material=${encodeURIComponent(comparisonMaterial)}`);
    }
  };

  const handleSimilar = () => {
    if (material) {
      const baseMaterial = material.replace(/[-\s]*(CF|GF|PLUS|\+|PRO|TOUGH|SILK|WOOD|GLOW).*$/i, "").trim();
      navigate(`/materials?material=${encodeURIComponent(baseMaterial)}`);
    }
  };

  const handleFamilyClick = () => {
    if (proposition.familyInfo) {
      navigate(`/materials?family=${encodeURIComponent(proposition.familyInfo.familyId)}`);
    }
  };

  const handleProjectClick = (url: string) => {
    navigate(url);
  };

  const handleSmartCompare = (suggestion: SmartComparisonSuggestion) => {
    navigate(`/materials/compare?ids=${filamentId},${suggestion.id}`);
  };

  const handleAddToCompare = (suggestion: SmartComparisonSuggestion) => {
    // Add current filament first if not in tray
    if (filament && !addedIds.has(filament.id)) {
      addItem({
        id: filament.id,
        product_title: filament.product_title,
        vendor: filament.vendor,
        material: filament.material,
        color_hex: filament.color_hex,
        variant_price: filament.variant_price,
        net_weight_g: filament.net_weight_g,
        featured_image: filament.featured_image
      });
    }
    // Add the suggestion
    if (!addedIds.has(suggestion.id)) {
      addItem({
        id: suggestion.id,
        product_title: suggestion.name,
        vendor: suggestion.vendor,
        material: suggestion.material,
        color_hex: suggestion.color_hex,
        variant_price: suggestion.price,
        net_weight_g: null
      });
    }
  };

  const handleAddAllToCompare = () => {
    // Add current filament first
    if (filament && !addedIds.has(filament.id)) {
      addItem({
        id: filament.id,
        product_title: filament.product_title,
        vendor: filament.vendor,
        material: filament.material,
        color_hex: filament.color_hex,
        variant_price: filament.variant_price,
        net_weight_g: filament.net_weight_g,
        featured_image: filament.featured_image
      });
    }
    // Add all suggestions
    suggestions.forEach(suggestion => {
      if (!addedIds.has(suggestion.id)) {
        addItem({
          id: suggestion.id,
          product_title: suggestion.name,
          vendor: suggestion.vendor,
          material: suggestion.material,
          color_hex: suggestion.color_hex,
          variant_price: suggestion.price,
          net_weight_g: null
        });
      }
    });
  };

  return (
    <section
      aria-label="Material value proposition"
      className={cn(
        "rounded-xl p-6 lg:p-6 md:p-5",
        "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent",
        "border-l-2 border-l-primary/50 border-y border-r border-y-primary/15 border-r-primary/15",
        "transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.01]",
        "animate-fade-in"
      )}
    >
      {/* Context Badges - Trending/New/Seasonal */}
      {intelligentContent && intelligentContent.contextBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {intelligentContent.contextBadges.map((badge, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-sm"
            >
              <span>{badge.icon}</span>
              <span className="text-orange-400 font-medium">{badge.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Headline with Icon */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-3xl" role="img" aria-hidden="true">
          {proposition.icon}
        </span>
        <h2 className="text-xl lg:text-[22px] font-bold text-primary leading-tight">
          {material} — {proposition.headline}
        </h2>
      </div>

      {/* Description */}
      <p className="text-base text-muted-foreground leading-relaxed mb-5">
        {proposition.description}
      </p>

      {/* Printer Compatibility Warnings */}
      {intelligentContent && intelligentContent.printerWarnings.length > 0 && (
        <div className="space-y-2 mb-5 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
          <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Compatibility Notes for Your Printer
          </h4>
          {intelligentContent.printerWarnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="shrink-0">{warning.icon}</span>
              <div>
                <span className={cn(
                  "font-medium",
                  warning.severity === "error" ? "text-red-400" : "text-amber-400"
                )}>
                  {warning.text}
                </span>
                {warning.subtext && (
                  <p className="text-muted-foreground text-xs mt-0.5">{warning.subtext}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Why Choose This? - Differentiator Badges */}
      {proposition.differentiators && proposition.differentiators.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">
            Why Choose This?
          </h3>
          <div className="flex flex-wrap gap-2">
            {proposition.differentiators.map((diff, index) => (
              <div
                key={index}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5",
                  "bg-primary/10 border border-primary/20 rounded-full",
                  "text-sm font-medium text-foreground"
                )}
              >
                <span className="text-base" role="img" aria-hidden="true">
                  {diff.icon}
                </span>
                <span>{diff.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Perfect For / Not Ideal For */}
      <div className="space-y-3 mb-5">
        {/* Perfect For - Merged static + dynamic */}
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
          <div className="text-sm">
            <span className="sr-only">Perfect for: </span>
            <span className="text-green-400 font-medium">Perfect for: </span>
            <span className="text-foreground/80">
              {allPerfectFor.join(", ")}
            </span>
          </div>
        </div>

        {/* Not Ideal For - Enhanced with explanations */}
        {proposition.notIdealFor.map((item, index) => (
          <div 
            key={index} 
            className="inline-flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="sr-only">Not ideal for: </span>
              <span className="text-amber-400 font-medium">{item.issue}</span>
              <span className="text-muted-foreground"> — {item.reason}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Project Type Suggestions */}
      {intelligentContent && intelligentContent.projectSuggestions.length > 0 && (
        <div className="mb-5">
          <h4 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-2">
            Suggested Projects
          </h4>
          <div className="flex flex-wrap gap-2">
            {intelligentContent.projectSuggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => suggestion.link && handleProjectClick(suggestion.link.url)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
              >
                <span>{suggestion.icon}</span>
                <span className="text-sm">{suggestion.text}</span>
                <ArrowRight className="w-3 h-3 text-primary" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Material Family Context */}
      {proposition.familyInfo && (
        <div className="mb-5 pt-4 border-t border-border/50">
          <button
            onClick={handleFamilyClick}
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Dna className="w-4 h-4" />
            <span>
              Part of the <span className="text-foreground font-medium">{proposition.familyInfo.familyName}</span>
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span className="text-muted-foreground/80">{proposition.familyInfo.variantPosition}</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
          </button>
        </div>
      )}

      {/* Smart Comparison Section */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        {/* Primary Smart Comparison with Hover Preview */}
        {primarySuggestion && (
          <div className="flex flex-wrap gap-3">
            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <button
                  onClick={() => handleSmartCompare(primarySuggestion)}
                  className={cn(
                    "group inline-flex items-center gap-1.5",
                    "px-4 py-2 rounded-full",
                    "text-sm font-medium text-primary",
                    "bg-primary/10 border border-primary/20",
                    "hover:bg-primary/20 hover:border-primary/30",
                    "transition-all duration-200"
                  )}
                >
                  Compare with {primarySuggestion.name.length > 25 
                    ? primarySuggestion.name.substring(0, 25) + "..." 
                    : primarySuggestion.name}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({primarySuggestion.relevanceReason})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </HoverCardTrigger>
              {previewData && (
                <HoverCardContent side="top" align="start" className="p-0 border-border/50">
                  <ComparisonPreviewTooltip
                    current={previewData.current}
                    comparison={previewData.comparison}
                    diffs={previewData.diffs}
                  />
                </HoverCardContent>
              )}
            </HoverCard>

            <button
              onClick={handleSimilar}
              className={cn(
                "group inline-flex items-center gap-1.5",
                "px-4 py-2 rounded-full",
                "text-sm font-medium text-primary",
                "bg-primary/10 border border-primary/20",
                "hover:bg-primary/20 hover:border-primary/30",
                "transition-all duration-200"
              )}
            >
              View similar materials
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {/* Fallback if no smart suggestions */}
        {!primarySuggestion && !suggestionsLoading && comparisonMaterial && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCompare}
              className={cn(
                "group inline-flex items-center gap-1.5",
                "px-4 py-2 rounded-full",
                "text-sm font-medium text-primary",
                "bg-primary/10 border border-primary/20",
                "hover:bg-primary/20 hover:border-primary/30",
                "transition-all duration-200"
              )}
            >
              Compare with {comparisonMaterial}
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={handleSimilar}
              className={cn(
                "group inline-flex items-center gap-1.5",
                "px-4 py-2 rounded-full",
                "text-sm font-medium text-primary",
                "bg-primary/10 border border-primary/20",
                "hover:bg-primary/20 hover:border-primary/30",
                "transition-all duration-200"
              )}
            >
              View similar materials
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {/* Multi-Compare Mini Cards */}
        {suggestions.length > 0 && (
          <MultiCompareCards
            suggestions={suggestions}
            onAddToCompare={handleAddToCompare}
            onAddAllToCompare={handleAddAllToCompare}
            addedIds={addedIds}
          />
        )}

        {/* User Comparison History */}
        {filament && (
          <ComparisonHistoryContext
            currentFilamentId={filamentId}
            currentFilamentName={filament.product_title}
          />
        )}
      </div>
    </section>
  );
}
