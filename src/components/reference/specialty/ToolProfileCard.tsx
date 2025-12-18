import React from 'react';
import { SpecialtyTool, categoryLabels, pricingLabels, categoryColors, pricingColors } from '@/lib/specialtyData';
import { numericToRating, specialtyMetricTooltips } from '@/lib/platformData';
import RatingValue from '@/components/reference/repos/shared/RatingValue';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  Zap, 
  Check,
  Sparkles, 
  Palette, 
  Server, 
  Ruler, 
  Box, 
  Database, 
  Wifi, 
  Wrench 
} from 'lucide-react';

interface ToolProfileCardProps {
  tool: SpecialtyTool;
}

const getCategoryIcon = (category: SpecialtyTool['category']) => {
  switch (category) {
    case 'ai-generation': return <Sparkles className="h-5 w-5" />;
    case 'filament-art': return <Palette className="h-5 w-5" />;
    case 'farm-management': return <Server className="h-5 w-5" />;
    case 'calibration': return <Ruler className="h-5 w-5" />;
    case 'cad': return <Box className="h-5 w-5" />;
    case 'repository': return <Database className="h-5 w-5" />;
    case 'remote-control': return <Wifi className="h-5 w-5" />;
    case 'mesh-tools': return <Wrench className="h-5 w-5" />;
    default: return null;
  }
};

const ToolProfileCard: React.FC<ToolProfileCardProps> = ({ tool }) => {
  const categoryColor = categoryColors[tool.category];
  const pricingColor = pricingColors[tool.pricingModel];

  return (
    <article 
      id={`tool-${tool.id}`}
      className="bg-card/50 border border-border/50 rounded-2xl p-6 md:p-7 scroll-mt-24 transition-colors hover:border-border"
    >
      {/* Profile Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pb-5 border-b border-border/50">
        <div className="flex items-start gap-4">
          <span 
            className="text-4xl flex-shrink-0"
            style={{ color: categoryColor }}
          >
            {getCategoryIcon(tool.category)}
          </span>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              {tool.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="outline" 
                className="text-xs font-semibold"
                style={{ 
                  backgroundColor: `color-mix(in srgb, ${categoryColor} 15%, transparent)`,
                  borderColor: `color-mix(in srgb, ${categoryColor} 30%, transparent)`,
                  color: categoryColor
                }}
              >
                {categoryLabels[tool.category]}
              </Badge>
              <Badge 
                variant="secondary"
                className="text-xs font-bold"
                style={{ 
                  backgroundColor: `color-mix(in srgb, ${pricingColor} 15%, transparent)`,
                  color: pricingColor
                }}
              >
                {pricingLabels[tool.pricingModel]}
              </Badge>
            </div>
          </div>
        </div>
        {tool.tier === 'featured' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-bold flex-shrink-0">
            <span>⭐</span>
            <span>Staff Pick</span>
          </div>
        )}
      </header>

      {/* The Bottom Line */}
      <section className="p-5 mb-5 bg-primary/5 border border-primary/15 rounded-xl">
        <div className="flex items-center gap-2.5 mb-3 text-primary">
          <Lightbulb className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide">The Bottom Line</span>
        </div>
        <p className="text-[15px] font-medium text-foreground/90 leading-relaxed">
          {tool.bottomLine}
        </p>
      </section>

      {/* Why It's Unique (Standout Feature) */}
      <section className="p-5 mb-5 bg-warning/5 border border-warning/15 border-l-4 border-l-warning rounded-r-xl">
        <div className="flex items-center gap-2.5 mb-3 text-warning">
          <Zap className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide">Why It's Unique</span>
        </div>
        <h4 className="text-lg font-bold text-foreground mb-2">
          {tool.standoutFeature.title}
        </h4>
        <p className="text-sm font-medium text-muted-foreground leading-relaxed">
          {tool.standoutFeature.description}
        </p>
      </section>

      {/* Key Features */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3.5 text-muted-foreground">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-xs font-bold uppercase tracking-wide">Key Features</span>
        </div>
        <ul className="space-y-2.5">
          {tool.keyFeatures.slice(0, 5).map((feature, index) => (
            <li key={index} className="flex items-start gap-3 text-sm font-medium text-foreground/90">
              <span className="text-primary font-bold text-lg leading-tight">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Ratings Summary */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 bg-muted/20 rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Ease of Use</span>
          <RatingValue rating={numericToRating(tool.ratings.easeOfUse)} size="small" showTooltip tooltipContent={specialtyMetricTooltips.easeOfUse} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Features</span>
          <RatingValue rating={numericToRating(tool.ratings.featureDepth)} size="small" showTooltip tooltipContent={specialtyMetricTooltips.featureDepth} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Value</span>
          <RatingValue rating={numericToRating(tool.ratings.valueForMoney)} size="small" showTooltip tooltipContent={specialtyMetricTooltips.valueForMoney} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Community</span>
          <RatingValue rating={numericToRating(tool.ratings.communitySupport)} size="small" showTooltip tooltipContent={specialtyMetricTooltips.communitySupport} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Print Focus</span>
          <RatingValue rating={numericToRating(tool.ratings.printFocus)} size="small" showTooltip tooltipContent={specialtyMetricTooltips.printFocus} />
        </div>
      </section>
    </article>
  );
};

export default ToolProfileCard;
