import React from 'react';
import { RatingLevel, ratingConfigs } from '@/lib/platformData';
import RatingValue from './RatingValue';

const RatingScaleLegend: React.FC = () => {
  const levels: RatingLevel[] = ['excellent', 'great', 'good', 'average', 'limited'];
  
  return (
    <div className="p-4 bg-muted/20 border border-border/30 rounded-xl">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
        Rating Scale
      </h4>
      <div className="flex flex-wrap gap-4 md:gap-6">
        {levels.map(level => {
          const config = ratingConfigs[level];
          return (
            <div key={level} className="flex items-center gap-2">
              <RatingValue rating={level} size="small" />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {config.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatingScaleLegend;
