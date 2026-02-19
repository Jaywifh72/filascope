import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/hooks/useCompare';
import type { SuggestedComparison } from '@/lib/performanceProfileService';

interface ComparisonQuickPicksProps {
  currentFilamentId: string;
  suggestions: SuggestedComparison[];
}

export function ComparisonQuickPicks({ currentFilamentId, suggestions }: ComparisonQuickPicksProps) {
  const { addItem, items } = useCompare();

  if (!suggestions.length) return null;

  const handleCompareAll = () => {
    // Add top 3 suggestions
    suggestions.slice(0, 3).forEach(suggestion => {
      if (!items.find(i => i.id === suggestion.id)) {
        addItem({
          id: suggestion.id,
          product_title: suggestion.name,
          vendor: null,
          material: suggestion.material || null,
          color_hex: null,
          variant_price: suggestion.price,
          net_weight_g: null,
          featured_image: suggestion.featured_image
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">Compare with Alternatives</h4>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleCompareAll}
          className="text-primary border-primary/30 hover:bg-primary/10"
        >
          Compare All
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {suggestions.slice(0, 3).map((suggestion) => (
          <Link
            key={suggestion.id}
            to={`/filament/${suggestion.id}`}
            className={cn(
              "group relative bg-muted/30 rounded-lg p-3 border border-border/50",
              "hover:border-primary/40 hover:bg-muted/50 transition-all"
            )}
          >
            {/* Differentiator badge */}
            <div className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary border border-primary/30">
              {suggestion.differentiator}
            </div>

            {/* Image */}
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-muted overflow-hidden">
              {suggestion.featured_image ? (
                <img 
                  src={suggestion.featured_image} 
                  alt={suggestion.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={48}
                  height={48}
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-primary/20" />
                </div>
              )}
            </div>

            {/* Name */}
            <h5 className="text-sm font-medium text-foreground text-center truncate group-hover:text-primary transition-colors">
              {suggestion.name}
            </h5>

            {/* Material type */}
            {suggestion.material && (
              <p className="text-xs text-muted-foreground text-center truncate">
                {suggestion.material}
              </p>
            )}

            {/* Price & Score */}
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-muted-foreground">
                {suggestion.pricePerKg 
                  ? `$${suggestion.pricePerKg.toFixed(0)}/kg`
                  : suggestion.price 
                    ? `$${suggestion.price.toFixed(2)}`
                    : '—'
                }
              </span>
              <span className="font-semibold text-primary tabular-nums">
                {suggestion.overallScore.toFixed(1)}/10
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
