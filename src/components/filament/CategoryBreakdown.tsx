import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface CategoryData {
  label: string;
  avg: number;
  percentile: number;
  count: number;
}

interface CategoryBreakdownProps {
  budget: CategoryData | null;
  midRange: CategoryData | null;
  premium: CategoryData | null;
  currentScore: number;
  materialType: string;
}

type CategoryKey = 'all' | 'budget' | 'midRange' | 'premium';

export function CategoryBreakdown({
  budget,
  midRange,
  premium,
  currentScore,
  materialType,
}: CategoryBreakdownProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  
  const categories: Array<{ key: CategoryKey; label: string; data: CategoryData | null }> = [
    { key: 'budget', label: 'Budget', data: budget },
    { key: 'midRange', label: 'Mid-Range', data: midRange },
    { key: 'premium', label: 'Premium', data: premium },
  ];
  
  const validCategories = categories.filter(c => c.data !== null);
  
  if (validCategories.length === 0) return null;
  
  // Calculate "all" category average
  const allAvg = validCategories.reduce((sum, c) => sum + (c.data?.avg || 0), 0) / validCategories.length;
  
  const getPercentileLabel = (percentile: number) => {
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 55) return 'Above Avg';
    if (percentile >= 45) return 'Average';
    return 'Below Avg';
  };
  
  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return 'text-green-400';
    if (percentile >= 50) return 'text-primary';
    return 'text-amber-400';
  };

  return (
    <div className="space-y-2">
      {/* Toggle Buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[10px] text-muted-foreground mr-1">Compare:</span>
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            "px-2 py-0.5 text-[10px] rounded-full transition-colors",
            activeCategory === 'all'
              ? "bg-primary/20 text-primary"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
          )}
        >
          All {materialType}
        </button>
        {validCategories.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={cn(
              "px-2 py-0.5 text-[10px] rounded-full transition-colors",
              activeCategory === key
                ? "bg-primary/20 text-primary"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      
      {/* Category Comparison Bars */}
      <div className="space-y-1.5">
        {activeCategory === 'all' ? (
          // Show all categories
          validCategories.map(({ key, label, data }) => {
            if (!data) return null;
            const diff = currentScore - data.avg;
            const percentWidth = Math.min(100, Math.max(10, (currentScore / 10) * 100));
            
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-16 shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      diff >= 0.5 ? "bg-green-500" : diff >= -0.3 ? "bg-primary" : "bg-amber-500"
                    )}
                    style={{ width: `${percentWidth}%` }}
                  />
                </div>
                <span className={cn(
                  "text-[10px] font-medium w-12 text-right shrink-0",
                  getPercentileColor(data.percentile)
                )}>
                  {getPercentileLabel(data.percentile)}
                </span>
              </div>
            );
          })
        ) : (
          // Show selected category detail
          (() => {
            const selected = categories.find(c => c.key === activeCategory);
            if (!selected?.data) return null;
            
            const data = selected.data;
            const diff = currentScore - data.avg;
            
            return (
              <div className="p-2 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground">
                    vs {selected.label} {materialType}
                  </span>
                  <span className={cn(
                    "text-xs font-semibold",
                    getPercentileColor(data.percentile)
                  )}>
                    {getPercentileLabel(data.percentile)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>You: <span className="text-foreground font-medium">{currentScore.toFixed(1)}</span></span>
                  <span>•</span>
                  <span>Avg: {data.avg.toFixed(1)}</span>
                  <span>•</span>
                  <span className={cn(
                    "font-medium",
                    diff > 0 ? "text-green-400" : diff < 0 ? "text-amber-400" : "text-muted-foreground"
                  )}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
