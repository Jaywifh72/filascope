import React from 'react';
import { Trophy, Check, AlertCircle, ExternalLink, RotateCcw, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CADMatchResult } from '@/lib/cadQuizService';

interface CADQuizResultsProps {
  results: CADMatchResult[];
  onClose: () => void;
  onRetake: () => void;
  onLearnMore?: (softwareId: string) => void;
}

export const CADQuizResults: React.FC<CADQuizResultsProps> = ({
  results,
  onClose,
  onRetake,
  onLearnMore
}) => {
  const topMatch = results[0];
  const alternatives = results.slice(1, 3);

  const getMatchColor = (score: number): string => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-cyan-500';
    if (score >= 55) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const getMatchBadgeBg = (score: number): string => {
    if (score >= 85) return 'from-green-500 to-emerald-600';
    if (score >= 70) return 'from-cyan-500 to-cyan-600';
    return 'from-amber-500 to-orange-600';
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="relative sticky top-0 z-10 bg-background border-b border-border p-5 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-cyan-500/5" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                Your Perfect Match
                <Sparkles className="w-5 h-5 text-amber-500" />
              </h2>
              <p className="text-sm text-muted-foreground">
                Based on your answers, here's what we recommend
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close results"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Top Match */}
        <div className={cn(
          "relative p-6 rounded-2xl border-2",
          "bg-gradient-to-br from-cyan-500/5 via-transparent to-cyan-500/5",
          "border-cyan-500/40"
        )}>
          {/* Match Badge */}
          <div className="absolute -top-4 right-5">
            <div className={cn(
              "flex items-baseline gap-1 px-4 py-2 rounded-xl",
              "bg-gradient-to-r shadow-lg",
              getMatchBadgeBg(topMatch.matchScore)
            )}>
              <span className="text-2xl font-extrabold text-white tabular-nums">
                {topMatch.matchScore}%
              </span>
              <span className="text-sm font-semibold text-white/80">Match</span>
            </div>
          </div>

          {/* Top Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500 text-white text-xs font-bold mb-4">
            <Trophy className="w-3.5 h-3.5" />
            TOP MATCH
          </div>

          {/* Software name */}
          <h3 className="text-3xl font-extrabold text-foreground mb-5">
            {topMatch.softwareName}
          </h3>

          {/* Why we recommend */}
          {topMatch.matchReasons.length > 0 && (
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-cyan-500 mb-3 uppercase tracking-wide">
                Why we recommend it
              </h4>
              <ul className="space-y-2.5">
                {topMatch.matchReasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-foreground/90">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Considerations */}
          {topMatch.considerations.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-5">
              <h4 className="text-sm font-semibold text-amber-500 mb-2">
                Things to consider
              </h4>
              <ul className="space-y-1.5">
                {topMatch.considerations.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/70">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <button
            onClick={() => onLearnMore?.(topMatch.softwareId)}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl",
              "bg-cyan-500 hover:bg-cyan-600 text-white font-semibold",
              "shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30",
              "transform hover:-translate-y-0.5 transition-all duration-200"
            )}
          >
            <ExternalLink className="w-4 h-4" />
            Learn More About {topMatch.softwareName}
          </button>
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
              Also Great For You
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {alternatives.map((result, index) => (
                <button
                  key={result.softwareId}
                  onClick={() => onLearnMore?.(result.softwareId)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border text-left",
                    "bg-card/50 border-border hover:border-cyan-500/50",
                    "hover:bg-muted/30 transition-all group"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 2}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-foreground group-hover:text-cyan-500 transition-colors">
                      {result.softwareName}
                    </h5>
                    {result.matchReasons[0] && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {result.matchReasons[0]}
                      </p>
                    )}
                  </div>
                  <span className={cn(
                    "text-lg font-bold tabular-nums flex-shrink-0",
                    getMatchColor(result.matchScore)
                  )}>
                    {result.matchScore}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onRetake}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
              "font-medium transition-colors"
            )}
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz
          </button>
          <button
            onClick={onClose}
            className={cn(
              "px-6 py-2.5 rounded-lg",
              "bg-muted hover:bg-muted/80",
              "text-foreground font-medium",
              "transition-colors"
            )}
          >
            View All Software
          </button>
        </div>
      </div>
    </div>
  );
};
