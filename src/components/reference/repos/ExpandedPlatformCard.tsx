import React, { useState } from 'react';
import { 
  ChevronDown, 
  ExternalLink, 
  Check, 
  X, 
  User, 
  UserX, 
  FileText,
  Target,
  DollarSign,
  Server,
  Users,
  Download,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RepoData } from '@/lib/repoData';
import { RatingLevel, metricTooltips } from '@/lib/platformData';
import { getStandoutForPlatform } from '@/lib/standoutFeatures';
import RatingValue from './shared/RatingValue';
import StandoutBadge from './shared/StandoutBadge';

interface ExpandedPlatformCardProps {
  repo: RepoData;
  rank: number;
  logo?: string;
  comparisonData?: {
    quality: number;
    community: number;
    search: number;
    ux: number;
    monetization: number;
    mobile: boolean;
    standout: string;
    model: string;
  };
}

const mapNumberToSemantic = (num: number): RatingLevel => {
  if (num >= 5) return 'excellent';
  if (num >= 4) return 'great';
  if (num >= 3) return 'good';
  if (num >= 2) return 'average';
  return 'limited';
};

const ExpandedPlatformCard: React.FC<ExpandedPlatformCardProps> = ({
  repo,
  rank,
  logo,
  comparisonData
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

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
    <div 
      id={`platform-${repo.id}`}
      className="border border-border/50 rounded-xl bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-border data-[state=open]:border-purple-500/30"
      data-platform-name={repo.name}
    >
      {/* Card Header - Always Visible */}
      <button 
        className="w-full p-4 md:p-5 flex items-center gap-3 md:gap-4 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`content-${repo.id}`}
      >
        <span className="text-xs font-mono text-muted-foreground w-6 flex-shrink-0">
          {String(rank).padStart(2, '0')}
        </span>
        {logo && (
          <img 
            src={logo} 
            alt={`${repo.name} logo`}
            className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-contain bg-muted/30 p-1.5 flex-shrink-0"
            loading="lazy"
            width={48}
            height={48}
            decoding="async"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base md:text-lg font-semibold text-foreground">{repo.name}</h3>
            <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground border-border">
              {repo.owner}
            </Badge>
            {comparisonData && (
              <Badge variant="outline" className={`text-xs ${getModelColor(comparisonData.model)}`}>
                {comparisonData.model}
              </Badge>
            )}
          </div>
          <p className="text-sm text-primary">{repo.status}</p>
        </div>
        <div className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {/* Expanded Content */}
      <div 
        id={`content-${repo.id}`}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 md:px-5 pb-5 space-y-5 border-t border-border/30 pt-5">
          
          {/* Standout Feature - FIRST and most prominent */}
          {(() => {
            const standout = getStandoutForPlatform(repo.id);
            return standout ? (
              <StandoutBadge standout={standout} variant="expanded" />
            ) : null;
          })()}

          {/* The Bottom Line */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
              The Bottom Line
            </div>
            <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
              {repo.bottomLine}
            </p>
          </div>

          {/* Quick Stats */}
          {comparisonData && (
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              <div className="flex flex-col items-center gap-1.5 min-w-[70px] p-2 rounded-lg bg-muted/30">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Quality</span>
                <RatingValue rating={mapNumberToSemantic(comparisonData.quality)} size="small" showTooltip tooltipContent={metricTooltips.quality} />
              </div>
              <div className="flex flex-col items-center gap-1.5 min-w-[70px] p-2 rounded-lg bg-muted/30">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Community</span>
                <RatingValue rating={mapNumberToSemantic(comparisonData.community)} size="small" showTooltip tooltipContent={metricTooltips.community} />
              </div>
              <div className="flex flex-col items-center gap-1.5 min-w-[70px] p-2 rounded-lg bg-muted/30">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Search</span>
                <RatingValue rating={mapNumberToSemantic(comparisonData.search)} size="small" showTooltip tooltipContent={metricTooltips.search} />
              </div>
              <div className="flex flex-col items-center gap-1.5 min-w-[70px] p-2 rounded-lg bg-muted/30">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">UX</span>
                <RatingValue rating={mapNumberToSemantic(comparisonData.ux)} size="small" showTooltip tooltipContent={metricTooltips.ux} />
              </div>
              <div className="flex flex-col items-center gap-1.5 min-w-[70px] p-2 rounded-lg bg-muted/30">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Mobile</span>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${comparisonData.mobile ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted/50 text-muted-foreground'}`}>
                  {comparisonData.mobile ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {comparisonData.mobile ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Strengths */}
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-3 pb-2 border-b border-emerald-500/20">
                <Check className="w-4 h-4" />
                Strengths
              </div>
              <div className="space-y-3">
                {repo.strengths.map((strength, idx) => (
                  <div key={idx} className="pl-3 border-l-2 border-emerald-500/40">
                    <div className="font-medium text-sm text-foreground">{strength.title}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{strength.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-3 pb-2 border-b border-red-500/20">
                <X className="w-4 h-4" />
                Weaknesses
              </div>
              <div className="space-y-3">
                {repo.weaknesses.map((weakness, idx) => (
                  <div key={idx} className="pl-3 border-l-2 border-red-500/40">
                    <div className="font-medium text-sm text-foreground">{weakness.title}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{weakness.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Best For / Not Ideal For */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Best For */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-3">
                <User className="w-4 h-4" />
                Best For
              </div>
              <ul className="space-y-2">
                {repo.bestFor.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-emerald-400 font-bold flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Not Ideal For */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-3">
                <UserX className="w-4 h-4" />
                Not Ideal For
              </div>
              <ul className="space-y-2">
                {repo.notIdealFor.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-amber-400 font-bold flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Full Analysis Toggle */}
          <Collapsible open={showFullAnalysis} onOpenChange={setShowFullAnalysis}>
            <CollapsibleTrigger asChild>
              <button 
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-muted/30 border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-expanded={showFullAnalysis}
              >
                <FileText className="w-4 h-4" />
                <span>{showFullAnalysis ? 'Hide' : 'Read'} Full Analysis</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFullAnalysis ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="animate-accordion-down">
              <div className="space-y-4 pt-4">
                {/* Summary */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-sm text-muted-foreground leading-relaxed">{repo.summary}</p>
                </div>

                {/* Strategic Positioning */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                  <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Strategic Positioning
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{repo.strategicPositioning}</p>
                </div>

                {/* Business Model */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                  <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Business Model & Monetization
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{repo.businessModel}</p>
                </div>

                {/* Technical Architecture */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                  <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Technical Architecture
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{repo.technicalArchitecture}</p>
                </div>

                {/* Community */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                  <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Community & Culture
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{repo.community}</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {repo.links.website && (
              <Button variant="default" size="sm" asChild className="flex-1 bg-primary hover:bg-primary/90">
                <a href={repo.links.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit {repo.name}
                </a>
              </Button>
            )}
            {repo.links.app && (
              <Button variant="outline" size="sm" asChild className="flex-1 border-primary/30 text-primary hover:bg-primary/10">
                <a href={repo.links.app} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Download App
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandedPlatformCard;
