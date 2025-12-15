import { useNavigate } from "react-router-dom";
import { CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
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

  return (
    <section
      aria-label="Material value proposition"
      className={cn(
        "rounded-xl p-6 lg:p-6 md:p-5",
        "bg-primary/5 border border-primary/20",
        "transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.01]",
        "animate-fade-in"
      )}
    >
      {/* Headline with Icon */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl" role="img" aria-hidden="true">
          {proposition.icon}
        </span>
        <h2 className="text-lg lg:text-xl font-bold text-primary leading-tight">
          {material} — {proposition.headline}
        </h2>
      </div>

      {/* Description */}
      <p className="text-base text-muted-foreground leading-relaxed mb-5">
        {proposition.description}
      </p>

      {/* Perfect For / Not Ideal For */}
      <div className="space-y-3 mb-5">
        {/* Perfect For */}
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="sr-only">Perfect for: </span>
            <span className="text-green-500 font-medium">Perfect for: </span>
            <span className="text-foreground/80">
              {proposition.perfectFor.join(", ")}
            </span>
          </div>
        </div>

        {/* Not Ideal For */}
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="sr-only">Not ideal for: </span>
            <span className="text-amber-500 font-medium">Not ideal for: </span>
            <span className="text-foreground/80">
              {proposition.notIdealFor.join(", ")}
            </span>
          </div>
        </div>
      </div>

      {/* CTA Links */}
      <div className="flex flex-wrap gap-4 pt-1">
        {comparisonMaterial && (
          <button
            onClick={handleCompare}
            className="group inline-flex items-center gap-1 text-sm text-primary hover:underline transition-all"
          >
            Compare with {comparisonMaterial}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        )}
        <button
          onClick={handleSimilar}
          className="group inline-flex items-center gap-1 text-sm text-primary hover:underline transition-all"
        >
          View similar materials
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}
