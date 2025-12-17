import React from 'react';
import { Trophy, Check, AlertCircle, ExternalLink, RotateCcw, X } from 'lucide-react';
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

  const getMatchBg = (score: number): string => {
    if (score >= 85) return 'bg-green-500/10 border-green-500/30';
    if (score >= 70) return 'bg-cyan-500/10 border-cyan-500/30';
    if (score >= 55) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-muted/50 border-border';
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Trophy className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                We Found Your Match!
              </h2>
              <p className="text-sm text-muted-foreground">
                Based on your answers, here are our top picks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
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
          "relative p-5 rounded-xl border-2",
          "bg-gradient-to-br from-cyan-500/5 to-transparent",
          "border-cyan-500/40"
        )}>
          {/* Badge */}
          <div className="absolute -top-3 left-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500 text-white text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" />
              TOP MATCH
            </span>
          </div>

          <div className="mt-3">
            {/* Software name and score */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground">
                  {topMatch.softwareName}
                </h3>
              </div>
              <div className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg border",
                getMatchBg(topMatch.matchScore)
              )}>
                <span className={cn("text-2xl font-bold tabular-nums", getMatchColor(topMatch.matchScore))}>
                  {topMatch.matchScore}%
                </span>
                <span className="text-sm text-muted-foreground">match</span>
              </div>
            </div>

            {/* Why we recommend */}
            {topMatch.matchReasons.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                  Why we recommend it:
                </h4>
                <ul className="space-y-1.5">
                  {topMatch.matchReasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/90">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Considerations */}
            {topMatch.considerations.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                  Things to consider:
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
            <div className="flex gap-3">
              <button
                onClick={() => onLearnMore?.(topMatch.softwareId)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
                  "bg-cyan-500 hover:bg-cyan-600 text-white font-medium",
                  "transition-colors"
                )}
              >
                <ExternalLink className="w-4 h-4" />
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
              Also worth considering:
            </h4>
            <div className="grid gap-3">
              {alternatives.map((result, index) => (
                <div
                  key={result.softwareId}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border",
                    "bg-card/50 border-border hover:border-border/80",
                    "transition-colors"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-sm font-bold text-muted-foreground">
                        #{index + 2}
                      </span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-foreground">
                        {result.softwareName}
                      </h5>
                      {result.matchReasons[0] && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {result.matchReasons[0]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-lg font-bold tabular-nums",
                      getMatchColor(result.matchScore)
                    )}>
                      {result.matchScore}%
                    </span>
                    <button
                      onClick={() => onLearnMore?.(result.softwareId)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg",
                        "bg-muted hover:bg-muted/80",
                        "text-sm font-medium text-foreground",
                        "transition-colors"
                      )}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onRetake}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg",
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
              "px-4 py-2 rounded-lg",
              "bg-muted hover:bg-muted/80",
              "text-foreground font-medium",
              "transition-colors"
            )}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
