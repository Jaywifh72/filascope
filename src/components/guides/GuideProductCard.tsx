import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, ExternalLink, ChevronRight, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { type GuideFilament } from '@/hooks/useGuideFilaments';
import { useResolvedPrice, type FormattedResolvedPrice } from '@/hooks/useResolvedPrice';
import { cleanFilamentDisplayName } from '@/lib/productNameUtils';
import { getScoreNumberColor } from '@/lib/unifiedFilamentScore';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { generateFilamentSlug } from '@/lib/seoSlugUtils';

interface GuideProductCardProps {
  filament: GuideFilament;
  rank: number;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
        <Trophy className="w-4 h-4" />
        <span className="text-sm font-bold">#1</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-300/10 border border-slate-400/30 text-slate-300">
        <Medal className="w-4 h-4" />
        <span className="text-sm font-bold">#2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-600/10 border border-orange-600/30 text-orange-400">
        <Award className="w-4 h-4" />
        <span className="text-sm font-bold">#3</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted border border-border text-muted-foreground">
      <span className="text-sm font-bold">#{rank}</span>
    </div>
  );
}

function generateWhyWePicked(filament: GuideFilament): string[] {
  const pros: string[] = [];
  const { factors } = filament.score;
  
  for (const f of factors) {
    if (f.points >= f.maxPoints * 0.8) {
      switch (f.category) {
        case 'data': pros.push('Comprehensive specs'); break;
        case 'price': pros.push('Transparent regional pricing'); break;
        case 'color': pros.push('Wide color selection'); break;
        case 'tds': pros.push('Full technical documentation'); break;
        case 'brand': pros.push('Verified brand'); break;
        case 'regional': pros.push('Strong regional availability'); break;
      }
    }
  }

  if (filament.high_speed_capable) pros.push('High-speed compatible');
  if (filament.transmission_distance != null) pros.push(`TD: ${filament.transmission_distance}mm`);

  const tempRange = filament.nozzle_temp_max_c && filament.nozzle_temp_min_c 
    ? filament.nozzle_temp_max_c - filament.nozzle_temp_min_c 
    : 0;
  if (tempRange >= 30) pros.push('Wide temperature range');

  return pros.slice(0, 4);
}

function generateCons(filament: GuideFilament): string[] {
  const cons: string[] = [];
  const { factors } = filament.score;

  for (const f of factors) {
    if (f.points < f.maxPoints * 0.3) {
      switch (f.category) {
        case 'data': cons.push('Limited specs available'); break;
        case 'tds': cons.push('No TDS/mechanical data'); break;
        case 'regional': cons.push('Limited regional availability'); break;
        case 'color': cons.push('Few color options'); break;
      }
    }
  }

  return cons.slice(0, 2);
}

function PriceDisplay({ filament }: { filament: GuideFilament }) {
  const resolved = useResolvedPrice(filament as any);

  if (resolved.isLoading) {
    return <div className="w-16 h-5 bg-muted animate-pulse rounded" />;
  }

  if (!resolved.formattedSpoolPrice) {
    return <span className="text-sm text-muted-foreground">Price N/A</span>;
  }

  return (
    <div>
      <span className="text-lg font-bold">{resolved.formattedSpoolPrice}</span>
      {resolved.formattedPricePerKg && (
        <span className="text-xs text-muted-foreground ml-1">({resolved.formattedPricePerKg}/kg)</span>
      )}
    </div>
  );
}

export function GuideProductCard({ filament, rank }: GuideProductCardProps) {
  const displayTitle = cleanFilamentDisplayName(
    filament.product_title.replace(new RegExp(`^${filament.vendor}\\s*`, 'i'), '').trim()
  );
  const pros = generateWhyWePicked(filament);
  const cons = generateCons(filament);
  const slug = generateFilamentSlug(filament.vendor, filament.material, filament.product_title, filament.color_family);
  const scoreColor = getScoreNumberColor(filament.score.score);

  return (
    <Card id={`guide-product-${rank}`} className="bg-card/60 border-border hover:border-primary/40 transition-all group">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Rank + Image */}
          <div className="flex sm:flex-col items-center gap-3 sm:gap-2 sm:w-20 flex-shrink-0">
            <RankBadge rank={rank} />
            {filament.featured_image && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                <OptimizedImage
                  src={filament.featured_image}
                  alt={filament.product_title}
                  className="w-full h-full object-cover"
                  width={64}
                  height={64}
                />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{filament.vendor}</p>
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                  {displayTitle}
                </h3>
              </div>

              {/* Score */}
              {filament.score.score != null && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-xl font-bold tabular-nums ${scoreColor}`}>
                        {filament.score.score.toFixed(1)}
                      </span>
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">FilaScore Breakdown</p>
                    {filament.score.factors.map((f, i) => (
                      <div key={i} className="flex justify-between text-xs gap-4">
                        <span>{f.label}</span>
                        <span className="tabular-nums">{f.points.toFixed(1)}/{f.maxPoints.toFixed(1)}</span>
                      </div>
                    ))}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
                {filament.material}
              </Badge>
              {filament.high_speed_capable && (
                <Badge variant="outline" className="text-xs bg-cyan-500/5 border-cyan-500/20 text-cyan-400">
                  High-Speed
                </Badge>
              )}
              {filament.transmission_distance != null && (
                <Badge variant="outline" className="text-xs bg-amber-500/5 border-amber-500/20 text-amber-400">
                  TD: {filament.transmission_distance}mm
                </Badge>
              )}
            </div>

            {/* Price */}
            <div className="mb-3">
              <PriceDisplay filament={filament} />
            </div>

            {/* Why we picked / Pros & Cons */}
            {(pros.length > 0 || cons.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-2 mb-3">
                {pros.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-emerald-400 mb-1">✓ Why we picked this</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {pros.map((p, i) => <li key={i}>• {p}</li>)}
                    </ul>
                  </div>
                )}
                {cons.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-orange-400 mb-1">⚠ Consider</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {cons.map((c, i) => <li key={i}>• {c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* CTAs */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to={`/filament/${slug}`}>
                  View Details
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
              {filament.product_url && (
                <Button size="sm" variant="default" asChild>
                  <a href={filament.product_url} target="_blank" rel="noopener noreferrer">
                    Buy
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
