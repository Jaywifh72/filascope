import React from 'react';
import { ChevronDown, Check, X, ExternalLink, Zap, Lightbulb, Sparkles, Palette, Server, Ruler, Box, Database, Wifi, Wrench, Star } from 'lucide-react';
import { SpecialtyTool, categoryLabels, pricingLabels } from '@/lib/specialtyData';
import { numericToRating } from '@/lib/platformData';
import { useSpecialtyFilters } from '@/contexts/SpecialtyFilterContext';
import RatingValue from '@/components/reference/repos/shared/RatingValue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const getCategoryIcon = (category: SpecialtyTool['category']) => {
  switch (category) {
    case 'ai-generation': return <Sparkles className="h-4 w-4" />;
    case 'filament-art': return <Palette className="h-4 w-4" />;
    case 'farm-management': return <Server className="h-4 w-4" />;
    case 'calibration': return <Ruler className="h-4 w-4" />;
    case 'cad': return <Box className="h-4 w-4" />;
    case 'repository': return <Database className="h-4 w-4" />;
    case 'remote-control': return <Wifi className="h-4 w-4" />;
    case 'mesh-tools': return <Wrench className="h-4 w-4" />;
    default: return null;
  }
};

const getPricingBadgeStyle = (pricing: SpecialtyTool['pricingModel']) => {
  switch (pricing) {
    case 'free': return 'bg-green-500/15 text-green-400 border-green-500/30';
    case 'freemium': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'one-time': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'subscription': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    default: return '';
  }
};

interface SpecialtyProfileAccordionProps {
  expandedIds: string[];
  onToggle: (id: string) => void;
}

const SpecialtyProfileAccordion: React.FC<SpecialtyProfileAccordionProps> = ({ expandedIds, onToggle }) => {
  const { filteredTools } = useSpecialtyFilters();

  return (
    <div className="space-y-3">
      {filteredTools.map((tool, index) => {
        const isExpanded = expandedIds.includes(tool.id);

        return (
          <div
            key={tool.id}
            id={`accordion-${tool.id}`}
            className={cn(
              "border rounded-xl overflow-hidden transition-all duration-300",
              isExpanded 
                ? "border-primary/50 bg-gray-800/50 shadow-lg shadow-primary/5" 
                : "border-border/50 bg-gray-900/30 hover:border-border hover:bg-gray-800/30"
            )}
          >
            {/* Accordion Header */}
            <button
              onClick={() => onToggle(tool.id)}
              className="w-full flex items-center gap-3 md:gap-4 p-4 md:p-5 text-left group"
              aria-expanded={isExpanded}
            >
              {/* Index Badge - Teal Circle */}
              <div className={cn(
                "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                isExpanded 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" 
                  : "bg-primary/20 text-primary group-hover:bg-primary/30"
              )}>
                {index + 1}
              </div>

              {/* Tool Icon */}
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                isExpanded ? "bg-gray-700" : "bg-gray-800 group-hover:bg-gray-700"
              )}>
                {getCategoryIcon(tool.category)}
              </div>

              {/* Tool Name & Tagline */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base md:text-lg font-semibold text-foreground">
                    {tool.name}
                  </h3>
                  {tool.tier === 'featured' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-[10px] md:text-xs font-bold uppercase tracking-wide">
                      <Star className="h-3 w-3 fill-amber-400" />
                      Staff Pick
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-sm text-muted-foreground truncate mt-0.5">
                  {tool.tagline}
                </p>
              </div>

              {/* Category Badge */}
              <Badge 
                variant="secondary"
                className="hidden md:flex items-center gap-1.5 text-xs font-medium flex-shrink-0"
              >
                {getCategoryIcon(tool.category)}
                {categoryLabels[tool.category]}
              </Badge>

              {/* Pricing Badge */}
              <Badge 
                variant="outline"
                className={cn(
                  "hidden sm:flex text-xs font-semibold flex-shrink-0 border",
                  getPricingBadgeStyle(tool.pricingModel)
                )}
              >
                {pricingLabels[tool.pricingModel]}
              </Badge>

              {/* Chevron */}
              <ChevronDown className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-300 flex-shrink-0",
                isExpanded && "rotate-180 text-primary"
              )} />
            </button>

            {/* Expanded Content */}
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-4 md:px-6 pb-6 space-y-6 border-t border-border/30 pt-5">
                  
                  {/* The Bottom Line */}
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wide text-primary">The Bottom Line</span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {tool.bottomLine}
                    </p>
                  </div>

                  {/* Why It's Unique / Standout Feature */}
                  <div className="p-4 bg-warning/5 border border-warning/20 border-l-4 border-l-warning rounded-r-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-warning" />
                      <span className="text-xs font-bold uppercase tracking-wide text-warning">Why It's Unique</span>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">{tool.standoutFeature.title}</h4>
                    <p className="text-sm text-muted-foreground">{tool.standoutFeature.description}</p>
                  </div>

                  {/* Full Description */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Overview</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tool.overview}
                    </p>
                  </div>

                  {/* Ratings Grid */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Ratings</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 p-4 bg-gray-800/50 rounded-lg border border-border/30">
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <span className="text-xs text-muted-foreground">Ease of Use</span>
                        <RatingValue rating={numericToRating(tool.ratings.easeOfUse)} size="small" />
                      </div>
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <span className="text-xs text-muted-foreground">Features</span>
                        <RatingValue rating={numericToRating(tool.ratings.featureDepth)} size="small" />
                      </div>
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <span className="text-xs text-muted-foreground">Value</span>
                        <RatingValue rating={numericToRating(tool.ratings.valueForMoney)} size="small" />
                      </div>
                      <div className="hidden sm:flex flex-col items-center gap-1.5 text-center">
                        <span className="text-xs text-muted-foreground">Community</span>
                        <RatingValue rating={numericToRating(tool.ratings.communitySupport)} size="small" />
                      </div>
                      <div className="hidden sm:flex flex-col items-center gap-1.5 text-center">
                        <span className="text-xs text-muted-foreground">Print Focus</span>
                        <RatingValue rating={numericToRating(tool.ratings.printFocus)} size="small" />
                      </div>
                    </div>
                  </div>

                  {/* Best For / Not Ideal For */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-green-400">👤</span>
                        <span className="text-xs font-bold uppercase tracking-wide text-green-400">Best For</span>
                      </div>
                      <ul className="space-y-2">
                        {tool.bestFor.slice(0, 4).map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-red-400">🚫</span>
                        <span className="text-xs font-bold uppercase tracking-wide text-red-400">Not Ideal For</span>
                      </div>
                      <ul className="space-y-2">
                        {tool.notIdealFor.slice(0, 4).map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <X className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Key Features */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Key Features</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tool.keyFeatures.slice(0, 6).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pricing Tiers */}
                  {tool.pricing.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3">Pricing Details</h4>
                      <div className={cn(
                        "grid gap-3",
                        tool.pricing.length <= 2 ? "grid-cols-1 sm:grid-cols-2" :
                        tool.pricing.length === 3 ? "grid-cols-1 sm:grid-cols-3" :
                        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                      )}>
                        {tool.pricing.map((tier, i) => (
                          <div key={i} className="p-3 bg-gray-800/50 rounded-lg border border-border/30">
                            <div className="font-semibold text-sm text-foreground">{tier.tier}</div>
                            <div className="text-sm font-bold text-primary mb-2">{tier.price}</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {tier.features.slice(0, 3).map((f, j) => (
                                <li key={j} className="flex items-start gap-1.5">
                                  <span className="text-primary">•</span>
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/30">
                    <Button variant="outline" className="flex-1 gap-2">
                      Learn More
                    </Button>
                    <Button asChild className="flex-1 gap-2">
                      <a
                        href={tool.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit Site
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SpecialtyProfileAccordion;
