import { ArrowUpRight, ArrowDownRight, Equal } from "lucide-react";
import type { CostBenefitAnalysis } from "@/lib/filamentDifferentiators";

interface CostBenefitSectionProps {
  analysis: CostBenefitAnalysis | null;
}

export function CostBenefitSection({ analysis }: CostBenefitSectionProps) {
  if (!analysis) return null;

  const typeStyles = {
    upgrade: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      text: "text-cyan-400",
      icon: ArrowUpRight,
    },
    savings: {
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      text: "text-green-400",
      icon: ArrowDownRight,
    },
    neutral: {
      bg: "bg-muted/50",
      border: "border-border/50",
      text: "text-muted-foreground",
      icon: Equal,
    },
  };

  const style = typeStyles[analysis.tradeoffType];
  const Icon = style.icon;

  return (
    <div className={`rounded-lg p-2.5 ${style.bg} ${style.border} border`}>
      <div className="flex items-start gap-2">
        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${style.text}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${style.text}`}>
            {analysis.headline}
          </p>
          {analysis.recommendation && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {analysis.recommendation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
