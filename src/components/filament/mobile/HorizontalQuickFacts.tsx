import React from 'react';
import { cn } from '@/lib/utils';
import type { QuickFact } from './types';

interface HorizontalQuickFactsProps {
  facts: QuickFact[];
  className?: string;
}

const HorizontalQuickFacts: React.FC<HorizontalQuickFactsProps> = ({ 
  facts,
  className,
}) => {
  if (facts.length === 0) return null;

  return (
    <div className={cn("relative -mx-4", className)}>
      {/* Scroll Container */}
      <div 
        className="flex gap-2.5 px-4 overflow-x-auto overflow-y-hidden scrollbar-none scroll-smooth snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {facts.map((fact, index) => (
          <div 
            key={index}
            className="flex-shrink-0 flex flex-col items-center gap-1 w-[90px] py-3 px-2 bg-card/50 border border-border rounded-xl snap-start"
          >
            {fact.icon && (
              <div className="text-xl mb-0.5">{fact.icon}</div>
            )}
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              {fact.label}
            </span>
            <span className="text-sm font-bold text-foreground text-center">
              {fact.value}
            </span>
          </div>
        ))}
      </div>
      
      {/* Scroll fade indicator */}
      <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
};

export default HorizontalQuickFacts;
