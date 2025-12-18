import React, { useState } from 'react';
import { SpecialtyTool, categoryLabels, pricingLabels, categoryColors, pricingColors } from '@/lib/specialtyData';
import { numericToRating, specialtyMetricTooltips } from '@/lib/platformData';
import RatingValue from '@/components/reference/repos/shared/RatingValue';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Lightbulb, 
  Zap, 
  Check,
  X,
  ExternalLink,
  BookOpen,
  BarChart3,
  Target,
  Telescope,
  ChevronDown,
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
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
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

      {/* Best For / Not Ideal For */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-green-500/5 border border-green-500/15 rounded-xl">
          <div className="flex items-center gap-2 mb-3 text-green-500">
            <span>👤</span>
            <span className="text-xs font-bold uppercase tracking-wide">Best For</span>
          </div>
          <ul className="space-y-2.5">
            {tool.bestFor.map((item, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-xl">
          <div className="flex items-center gap-2 mb-3 text-red-500">
            <span>🚫</span>
            <span className="text-xs font-bold uppercase tracking-wide">Not Ideal For</span>
          </div>
          <ul className="space-y-2.5">
            {tool.notIdealFor.map((item, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <X className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Ratings Summary */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 bg-muted/20 rounded-lg mb-6">
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

      {/* Pricing Section */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <span>💰</span>
          <span className="text-xs font-bold uppercase tracking-wide">Pricing</span>
        </div>
        <div 
          className="p-5 rounded-xl border"
          style={{
            backgroundColor: `color-mix(in srgb, ${pricingColor} 8%, transparent)`,
            borderColor: `color-mix(in srgb, ${pricingColor} 20%, transparent)`
          }}
        >
          <div className="text-lg font-bold mb-2" style={{ color: pricingColor }}>
            {tool.pricingModel === 'free' ? 'Completely Free' :
             tool.pricingModel === 'one-time' ? `${tool.pricing[0]?.price || 'One-Time Purchase'}` :
             tool.pricingModel === 'freemium' ? 'Free + Premium Options' :
             'Subscription Required'}
          </div>
          
          {tool.pricing.length > 0 && (
            <div className={cn(
              "grid gap-3 mt-4",
              tool.pricing.length === 1 ? "grid-cols-1" :
              tool.pricing.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
              tool.pricing.length === 3 ? "grid-cols-1 sm:grid-cols-3" :
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            )}>
              {tool.pricing.map((tier, index) => (
                <div key={index} className="p-3 bg-background/50 rounded-lg border border-border/30">
                  <div className="font-semibold text-sm text-foreground">{tier.tier}</div>
                  <div className="text-xs font-bold text-primary mb-2">{tier.price}</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {tier.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-primary">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 pb-6 border-b border-border/50">
        <a
          href={tool.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
        >
          Visit {tool.name.split(' ')[0]}
          <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href="#comparison-matrix"
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-transparent border border-border/50 hover:border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground font-semibold rounded-xl transition-all"
        >
          Compare with Others
        </a>
      </div>

      {/* Collapsible Full Analysis */}
      <div>
        <button
          onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
          aria-expanded={isAnalysisExpanded}
          aria-controls={`analysis-${tool.id}`}
          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/30 border border-border/30 hover:border-border/50 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-semibold">Read Full Analysis</span>
          </div>
          <ChevronDown className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-300",
            isAnalysisExpanded && "rotate-180"
          )} />
        </button>

        <div
          id={`analysis-${tool.id}`}
          className={cn(
            "overflow-hidden transition-all duration-300",
            isAnalysisExpanded ? "max-h-[3000px] opacity-100 mt-4" : "max-h-0 opacity-0"
          )}
        >
          <div className="space-y-6">
            {tool.overview && (
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Overview</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  {tool.overview}
                </p>
              </div>
            )}

            {tool.technicalDetails && (
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <Wrench className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Technical Details</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  {tool.technicalDetails}
                </p>
              </div>
            )}

            {tool.economicModel && (
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Economic Model</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  {tool.economicModel}
                </p>
              </div>
            )}

            {tool.competitivePosition && (
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Competitive Position</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  {tool.competitivePosition}
                </p>
              </div>
            )}

            {tool.futureOutlook && (
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <Telescope className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Future Outlook</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  {tool.futureOutlook}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ToolProfileCard;
