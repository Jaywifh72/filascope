import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ScoreFactor } from '@/lib/unifiedFilamentScore';
import type { CommunityReviewStats } from '@/hooks/useCommunityReviewStats';
import type { Database } from '@/integrations/supabase/types';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

function getScoreBarColor(score: number): string {
  if (score >= 8) return '#6366f1';
  if (score >= 6.5) return '#22c55e';
  if (score >= 4) return '#f59e0b';
  return '#ef4444';
}

function getSpecsLabel(factors: ScoreFactor[]): string {
  const dataFactor = factors.find(f => f.category === 'data');
  if (!dataFactor) return 'Limited';
  const ratio = dataFactor.points / dataFactor.maxPoints;
  if (ratio >= 0.8) return 'Excellent';
  if (ratio >= 0.5) return 'Good';
  return 'Limited';
}

function getValueLabel(factors: ScoreFactor[]): string {
  const priceFactor = factors.find(f => f.category === 'price');
  if (!priceFactor) return 'N/A';
  const ratio = priceFactor.points / priceFactor.maxPoints;
  if (ratio >= 0.8) return 'Great';
  if (ratio >= 0.5) return 'Fair';
  return 'Low';
}

interface FilaScoreHeroDisplayProps {
  score: number;
  factors: ScoreFactor[];
  communityRating?: CommunityReviewStats | null;
  pricingFilament: Filament;
}

export function FilaScoreHeroDisplay({ score, factors, communityRating }: FilaScoreHeroDisplayProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const barColor = getScoreBarColor(score);
  const specsLabel = getSpecsLabel(factors);
  const valueLabel = getValueLabel(factors);
  const communityAvg = communityRating && communityRating.reviewCount > 0
    ? communityRating.avgRating
    : null;

  return (
    <div className="space-y-2">
      {/* FilaScore label + bar + number + info */}
      <div className="space-y-1">
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          FilaScore
        </span>
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: animated ? `${(score / 10) * 100}%` : '0%',
                backgroundColor: barColor,
                transition: 'all 700ms ease-out',
              }}
            />
          </div>
          <span className="text-lg font-semibold" style={{ color: barColor }}>
            {score.toFixed(1)}<span className="text-sm text-muted-foreground font-normal">/10</span>
          </span>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs max-w-[280px]">
              FilaScore combines community ratings, technical specifications quality, price competitiveness, and availability. Higher is better.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Micro-score pills */}
      <div className="flex flex-wrap gap-1.5">
        {communityAvg != null && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Community ★{communityAvg.toFixed(1)}
          </span>
        )}
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          Specs ✓{specsLabel}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          Value ${valueLabel}
        </span>
      </div>
    </div>
  );
}
