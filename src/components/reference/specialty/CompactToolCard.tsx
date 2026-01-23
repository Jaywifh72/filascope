import { ChevronRight, Zap } from "lucide-react";
import { SpecialtyTool, categoryLabels, pricingLabels, categoryColors, pricingColors } from "@/lib/specialtyData";
import { numericToRating } from "@/lib/platformData";
import RatingValue from "@/components/reference/repos/shared/RatingValue";
import { cn } from "@/lib/utils";

interface CompactToolCardProps {
  tool: SpecialtyTool;
  index?: number;
}

const ratingLabels: Record<string, string> = {
  easeOfUse: 'Ease of Use',
  featureDepth: 'Features',
  valueForMoney: 'Value',
  communitySupport: 'Community',
  printFocus: 'Print Focus'
};

export default function CompactToolCard({ tool, index = 0 }: CompactToolCardProps) {
  const getCategoryIcon = () => {
    switch (tool.category) {
      case 'ai-generation': return '🤖';
      case 'filament-art': return '🎨';
      case 'farm-management': return '🖨️';
      case 'calibration': return '🎯';
      case 'cad': return '📐';
      case 'repository': return '📦';
      case 'remote-control': return '📡';
      case 'mesh-tools': return '🔧';
      default: return '⚙️';
    }
  };

  const getToolAnchorId = () => `tool-${tool.id.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
  const primaryRating = tool.keyRatings[0];

  return (
    <a
      href={`#${getToolAnchorId()}`}
      className={cn(
        "group flex flex-col p-4 rounded-xl",
        "bg-card/30 border border-border/30",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:border-primary/50",
        "hover:shadow-lg hover:shadow-primary/10",
        "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${200 + index * 50}ms` }}
      aria-label={`${tool.name}: ${tool.standoutFeature.title}. ${pricingLabels[tool.pricingModel]}. Click to view details.`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[28px]">
          {getCategoryIcon()}
        </span>
        <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
          {tool.name}
        </h4>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span 
          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
          style={{ 
            backgroundColor: `${categoryColors[tool.category]}10`,
            color: categoryColors[tool.category]
          }}
        >
          {categoryLabels[tool.category]}
        </span>
        <span 
          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold"
          style={{ 
            backgroundColor: `${pricingColors[tool.pricingModel]}10`,
            color: pricingColors[tool.pricingModel]
          }}
        >
          {pricingLabels[tool.pricingModel]}
        </span>
      </div>

      {/* Standout Feature (condensed) */}
      <div className="flex items-start gap-2 p-2.5 mb-3 rounded-lg bg-warning/5">
        <Zap className="h-3 w-3 text-warning flex-shrink-0 mt-0.5" />
        <span className="text-[11px] font-semibold text-warning leading-snug line-clamp-2">
          {tool.standoutFeature.title}
        </span>
      </div>

      {/* Single Key Rating */}
      <div className="flex items-center gap-2 mb-3.5">
        <RatingValue 
          rating={numericToRating(tool.ratings[primaryRating])} 
          size="small" 
        />
        <span className="text-[11px] font-medium text-muted-foreground">
          {ratingLabels[primaryRating]}
        </span>
      </div>

      {/* View Details Link */}
      <div className="flex items-center justify-center gap-1 pt-3 mt-auto border-t border-border/30 text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
        View Details
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </a>
  );
}
