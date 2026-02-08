import { ArrowRight, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

/**
 * Material upgrade suggestions — shown when viewing ABS, etc.
 * Suggests complementary materials with brief reasons.
 */

interface MaterialSuggestion {
  from: string;
  to: string;
  reason: string;
}

const MATERIAL_SUGGESTIONS: Record<string, MaterialSuggestion> = {
  ABS: {
    from: "ABS",
    to: "PETG",
    reason: "PETG offers similar strength with easier printability and no warping",
  },
  ASA: {
    from: "ASA",
    to: "PETG",
    reason: "PETG is easier to print with comparable outdoor durability",
  },
  PLA: {
    from: "PLA",
    to: "PLA+",
    reason: "PLA+ adds impact resistance while keeping the same easy printability",
  },
  NYLON: {
    from: "Nylon",
    to: "PETG",
    reason: "PETG requires no drying and offers good chemical resistance at lower cost",
  },
  PC: {
    from: "PC",
    to: "PETG",
    reason: "PETG provides similar clarity with much easier print requirements",
  },
};

interface ConsiderInsteadBannerProps {
  currentMaterial: string | null;
}

export function ConsiderInsteadBanner({ currentMaterial }: ConsiderInsteadBannerProps) {
  if (!currentMaterial) return null;

  const baseMaterial = currentMaterial.split(/[\s\-+]/)[0].toUpperCase();
  const suggestion = MATERIAL_SUGGESTIONS[baseMaterial];

  if (!suggestion) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-lg bg-amber-500/10">
          <Lightbulb className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="text-sm font-semibold text-foreground">
              Consider Instead
            </h4>
            <Badge
              variant="outline"
              className="text-xs border-amber-500/30 text-amber-400 bg-amber-500/10"
            >
              {suggestion.from}
              <ArrowRight className="inline h-3 w-3 mx-1" />
              {suggestion.to}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {suggestion.reason}
          </p>
          <Link
            to={`/?material=${encodeURIComponent(suggestion.to)}`}
            className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Browse {suggestion.to} filaments
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
