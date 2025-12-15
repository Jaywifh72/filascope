import { cn } from '@/lib/utils';
import type { CategoryComparison } from '@/lib/performanceProfileService';

interface CategoryPositionBarProps {
  comparison: CategoryComparison;
}

export function CategoryPositionBar({ comparison }: CategoryPositionBarProps) {
  const { category, overallPercentile, position, comparisonText } = comparison;
  
  // Calculate fill width (percentile is 1-99)
  const fillWidth = Math.max(5, Math.min(95, overallPercentile));
  
  // Determine color based on percentile
  const barColor = overallPercentile >= 75 ? 'bg-green-500' :
                   overallPercentile >= 50 ? 'bg-primary' :
                   overallPercentile >= 25 ? 'bg-amber-500' : 'bg-red-500';

  const textColor = overallPercentile >= 75 ? 'text-green-500' :
                    overallPercentile >= 50 ? 'text-primary' :
                    overallPercentile >= 25 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          vs {category} Materials
        </span>
        <span className={cn("font-semibold", textColor)}>
          {position}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
        {/* Fill */}
        <div 
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
            barColor
          )}
          style={{ width: `${fillWidth}%` }}
        />
        
        {/* Position marker */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-foreground rounded-full shadow-lg transition-all duration-700"
          style={{ left: `calc(${fillWidth}% - 2px)` }}
        />
        
        {/* Scale markers */}
        <div className="absolute inset-0 flex justify-between px-1">
          {[0, 25, 50, 75, 100].map((mark) => (
            <div 
              key={mark}
              className="w-px h-full bg-background/30"
            />
          ))}
        </div>
      </div>
      
      {/* Scale labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
      
      {/* Comparison text */}
      <p className="text-sm text-muted-foreground text-center pt-1">
        {comparisonText}
      </p>
    </div>
  );
}
