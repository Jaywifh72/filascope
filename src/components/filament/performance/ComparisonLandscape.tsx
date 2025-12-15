import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Scale, Crown, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/hooks/useCompare';
import { 
  selectComparisonLandscape, 
  type ComparisonLandscapeItem,
  type SuggestedComparison 
} from '@/lib/performanceProfileService';
import { cn } from '@/lib/utils';

interface ComparisonLandscapeProps {
  currentId: string;
  currentName: string;
  currentPrice: number | null;
  currentScore: number;
  recommendations: SuggestedComparison[];
}

const tierIcons = {
  budget: DollarSign,
  balanced: Scale,
  premium: Crown
};

const tierColors = {
  budget: 'text-green-400 border-green-500/30 bg-green-500/5',
  balanced: 'text-primary border-primary/30 bg-primary/5',
  premium: 'text-amber-400 border-amber-500/30 bg-amber-500/5'
};

export function ComparisonLandscape({
  currentId,
  currentName,
  currentPrice,
  currentScore,
  recommendations
}: ComparisonLandscapeProps) {
  const { addItem, items, removeItem } = useCompare();

  const landscape = useMemo(() => {
    return selectComparisonLandscape(
      currentPrice,
      currentScore,
      currentName,
      currentId,
      recommendations
    );
  }, [currentPrice, currentScore, currentName, currentId, recommendations]);

  const handleToggleCompare = (item: SuggestedComparison) => {
    const isInCompare = items.some(i => i.id === item.id);
    
    if (isInCompare) {
      removeItem(item.id);
    } else {
      addItem({
        id: item.id,
        product_title: item.name,
        vendor: null,
        material: item.material || null,
        color_hex: null,
        variant_price: item.price,
        net_weight_g: null,
        featured_image: item.featured_image || null
      });
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Most users choose between:
      </h4>
      
      <div className="grid grid-cols-3 gap-3">
        {landscape.map((tier) => {
          const Icon = tierIcons[tier.tier];
          const isInCompare = tier.item ? items.some(i => i.id === tier.item?.id) : false;
          
          return (
            <div 
              key={tier.tier}
              className={cn(
                "relative rounded-xl border p-4 transition-all",
                tierColors[tier.tier],
                tier.isCurrent && "ring-2 ring-primary/50"
              )}
            >
              {tier.isCurrent && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary rounded-full text-xs font-medium text-primary-foreground whitespace-nowrap">
                  You are here
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  {tier.label}
                </span>
              </div>
              
              {tier.item ? (
                <>
                  <p className="font-medium text-foreground text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
                    {tier.item.name}
                  </p>
                  
                  <div className="space-y-1 text-xs text-muted-foreground mb-3">
                    {tier.item.pricePerKg && (
                      <p>${tier.item.pricePerKg.toFixed(2)}/kg</p>
                    )}
                    <p>{tier.item.overallScore.toFixed(1)}/10 overall</p>
                  </div>
                  
                  <p className="text-xs text-muted-foreground italic mb-3">
                    "{tier.summary}"
                  </p>
                  
                  {!tier.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => handleToggleCompare(tier.item!)}
                    >
                      {isInCompare ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 mr-1" />
                          Compare
                        </>
                      )}
                    </Button>
                  )}
                  
                  {tier.isCurrent && (
                    <Link to={`/filament/${tier.item.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs"
                        disabled
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Selected
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-24">
                  <p className="text-xs text-muted-foreground text-center">
                    {tier.summary}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
