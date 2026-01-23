import React, { useState } from 'react';
import { ChevronDown, ExternalLink, Check, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RepoData } from '@/lib/repoData';
import { RatingLevel, metricTooltips } from '@/lib/platformData';
import { getStandoutForPlatform } from '@/lib/standoutFeatures';
import RatingValue from './shared/RatingValue';
import StandoutBadge from './shared/StandoutBadge';

interface ReposProfileAccordionProps {
  platforms: RepoData[];
  logos: Record<string, string>;
  comparisonData: Record<string, {
    quality: number;
    community: number;
    search: number;
    ux: number;
    monetization: number;
    mobile: boolean;
    model: string;
  }>;
}

const mapNumberToSemantic = (num: number): RatingLevel => {
  if (num >= 5) return 'excellent';
  if (num >= 4) return 'great';
  if (num >= 3) return 'good';
  if (num >= 2) return 'average';
  return 'limited';
};

const ReposProfileAccordion: React.FC<ReposProfileAccordionProps> = ({
  platforms,
  logos,
  comparisonData,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getModelColor = (model?: string) => {
    if (!model) return 'bg-muted/50 text-muted-foreground border-border';
    if (model === "Loss-Leader" || model === "Ad-Supported" || model === "Lead Gen") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
    if (model === "Hybrid" || model === "Search + Sub") {
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
    return "bg-purple-500/10 text-purple-400 border-purple-500/30";
  };

  return (
    <div className="space-y-3">
      {platforms.map((platform, index) => {
        const isExpanded = expandedId === platform.id;
        const comparison = comparisonData[platform.name];
        const logo = logos[platform.name];

        return (
          <div
            key={platform.id}
            className={cn(
              "border rounded-xl overflow-hidden transition-all duration-300 ease-in-out",
              isExpanded
                ? "border-primary/50 bg-card shadow-lg shadow-primary/5"
                : "border-border/50 bg-card/50 hover:bg-card hover:border-border hover:shadow-lg hover:shadow-teal-500/10"
            )}
          >
            {/* Header */}
            <button
              onClick={() => toggleExpand(platform.id)}
              className="w-full p-4 md:p-5 flex items-center gap-4 text-left focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset"
              aria-expanded={isExpanded}
            >
              {/* Number Badge */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors duration-300",
                  isExpanded
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index + 1}
              </div>

              {/* Logo */}
              {logo && (
                <img
                  src={logo}
                  alt={`${platform.name} logo`}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-contain bg-muted/30 p-1.5 flex-shrink-0"
                />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base md:text-lg font-semibold text-foreground">
                    {platform.name}
                  </h3>
                  <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground border-border">
                    {platform.owner}
                  </Badge>
                  {comparison && (
                    <Badge variant="outline" className={cn("text-xs", getModelColor(comparison.model))}>
                      {comparison.model}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-primary truncate">{platform.status}</p>
              </div>

              {/* Chevron */}
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-300 ease-in-out flex-shrink-0",
                  isExpanded && "rotate-180 text-primary"
                )}
              />
            </button>

            {/* Expanded Content */}
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-4 md:px-5 pb-5 space-y-5 border-t border-border/30 pt-5">
                  {/* Standout Feature */}
                  {(() => {
                    const standout = getStandoutForPlatform(platform.id);
                    return standout ? (
                      <StandoutBadge standout={standout} variant="expanded" />
                    ) : null;
                  })()}

                  {/* Bottom Line */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                      The Bottom Line
                    </div>
                    <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
                      {platform.bottomLine}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  {comparison && (
                    <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                      {(['quality', 'community', 'search', 'ux'] as const).map((key) => (
                        <div key={key} className="flex flex-col items-center gap-1.5 min-w-[70px] p-2 rounded-lg bg-muted/30">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide capitalize">
                            {key}
                          </span>
                          <RatingValue
                            rating={mapNumberToSemantic(comparison[key])}
                            size="small"
                            showTooltip
                            tooltipContent={metricTooltips[key]}
                          />
                        </div>
                      ))}
                      <div className="flex flex-col items-center gap-1.5 min-w-[70px] p-2 rounded-lg bg-muted/30">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Mobile
                        </span>
                        <div
                          className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold",
                            comparison.mobile
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-muted/50 text-muted-foreground"
                          )}
                        >
                          {comparison.mobile ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {comparison.mobile ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Strengths & Weaknesses */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-3 pb-2 border-b border-emerald-500/20">
                        <Check className="w-4 h-4" />
                        Strengths
                      </div>
                      <div className="space-y-3">
                        {platform.strengths.map((strength, idx) => (
                          <div key={idx} className="pl-3 border-l-2 border-emerald-500/40">
                            <div className="font-medium text-sm text-foreground">{strength.title}</div>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                              {strength.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                      <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-3 pb-2 border-b border-red-500/20">
                        <X className="w-4 h-4" />
                        Weaknesses
                      </div>
                      <div className="space-y-3">
                        {platform.weaknesses.map((weakness, idx) => (
                          <div key={idx} className="pl-3 border-l-2 border-red-500/40">
                            <div className="font-medium text-sm text-foreground">{weakness.title}</div>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                              {weakness.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {platform.links.website && (
                      <Button variant="default" size="sm" asChild className="flex-1 bg-primary hover:bg-primary/90">
                        <a href={platform.links.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Visit {platform.name}
                        </a>
                      </Button>
                    )}
                    {platform.links.app && (
                      <Button variant="outline" size="sm" asChild className="flex-1 border-primary/30 text-primary hover:bg-primary/10">
                        <a href={platform.links.app} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" />
                          Download App
                        </a>
                      </Button>
                    )}
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

export default ReposProfileAccordion;
