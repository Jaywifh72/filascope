import { useNavigate } from "react-router-dom";
import { CheckCircle, AlertTriangle, ArrowRight, Dna } from "lucide-react";
import { getMaterialValueProposition, getComparisonMaterial } from "@/lib/materialValuePropositions";
import { cn } from "@/lib/utils";

interface MaterialValuePropositionProps {
  material: string | null | undefined;
  productTitle: string;
  filamentId: string;
  vendor?: string | null;
}

export function MaterialValueProposition({
  material,
  productTitle,
  filamentId,
  vendor,
}: MaterialValuePropositionProps) {
  const navigate = useNavigate();
  
  const proposition = getMaterialValueProposition(material, productTitle);
  const comparisonMaterial = getComparisonMaterial(material);

  if (!material) return null;

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
        {/* Perfect For */}
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
          <div className="text-sm">
            <span className="sr-only">Perfect for: </span>
            <span className="text-green-400 font-medium">Perfect for: </span>
            <span className="text-foreground/80">
              {proposition.perfectFor.join(", ")}
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

      {/* CTA Links - Pill-shaped buttons */}
      <div className="flex flex-wrap gap-3 pt-1">
        {comparisonMaterial && (
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
        )}
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
    </section>
  );
}
