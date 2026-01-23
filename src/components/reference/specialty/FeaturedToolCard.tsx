import { ExternalLink, ChevronRight, Zap } from "lucide-react";
import { SpecialtyTool, categoryLabels, pricingLabels, categoryColors, pricingColors } from "@/lib/specialtyData";
import { numericToRating } from "@/lib/platformData";
import RatingValue from "@/components/reference/repos/shared/RatingValue";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeaturedToolCardProps {
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

export default function FeaturedToolCard({ tool, index = 0 }: FeaturedToolCardProps) {
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

  return (
    <article
      className={cn(
        "group relative flex flex-col p-6 rounded-2xl",
        "bg-card/50 border border-border/50",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:border-primary/50",
        "hover:shadow-lg hover:shadow-primary/10",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      aria-label={`${tool.name}: ${tool.standoutFeature.title}`}
    >
      {/* Decorative glow on hover */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top right, ${categoryColors[tool.category]}20 0%, transparent 70%)`
        }}
      />

      {/* Header */}
      <div className="relative flex items-start gap-4 mb-5">
        <span className="text-4xl transition-transform duration-200 group-hover:scale-110">
          {getCategoryIcon()}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-2 truncate">
            {tool.name}
          </h3>
          <div className="flex flex-wrap gap-2">
            <span 
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
              style={{ 
                backgroundColor: `${categoryColors[tool.category]}15`,
                color: categoryColors[tool.category],
                border: `1px solid ${categoryColors[tool.category]}30`
              }}
            >
              {categoryLabels[tool.category]}
            </span>
            <span 
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold"
              style={{ 
                backgroundColor: `${pricingColors[tool.pricingModel]}15`,
                color: pricingColors[tool.pricingModel]
              }}
            >
              {pricingLabels[tool.pricingModel]}
              {tool.pricingModel === 'one-time' && tool.pricing[0]?.price && (
                <span className="ml-1">({tool.pricing[0].price})</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Standout Feature */}
      <div className="relative flex gap-3 p-4 mb-4 rounded-xl bg-warning/10 border border-warning/20">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-warning/15 flex-shrink-0">
          <Zap className="h-4 w-4 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-warning mb-1">
            {tool.standoutFeature.title}
          </div>
          <div className="text-xs font-medium text-muted-foreground leading-relaxed">
            {tool.standoutFeature.description}
          </div>
        </div>
      </div>

      {/* Best For */}
      <div className="relative mb-4">
        <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">
          Best For
        </div>
        <div className="text-sm font-medium text-muted-foreground leading-relaxed">
          {tool.bestFor}
        </div>
      </div>

      {/* Key Ratings */}
      <div className="relative flex gap-6 py-3.5 mb-4 border-t border-b border-border/50">
        {tool.keyRatings.map(ratingKey => (
          <div key={ratingKey} className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              {ratingLabels[ratingKey]}
            </span>
            <RatingValue 
              rating={numericToRating(tool.ratings[ratingKey])} 
              size="small" 
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="relative flex gap-3 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 group/btn"
          asChild
        >
          <a href={`#${getToolAnchorId()}`}>
            Learn More
            <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
          </a>
        </Button>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          asChild
        >
          <a 
            href={tool.website} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Visit Site
            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
          </a>
        </Button>
      </div>
    </article>
  );
}
