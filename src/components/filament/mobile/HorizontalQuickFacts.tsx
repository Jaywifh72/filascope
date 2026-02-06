import React from 'react';
import { cn } from '@/lib/utils';
import type { QuickFact } from './types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
    <TooltipProvider delayDuration={300}>
      <div className={cn("relative -mx-4", className)}>
        {/* Scroll Container */}
        <div 
          className="flex gap-2.5 px-4 overflow-x-auto overflow-y-hidden scrollbar-none scroll-smooth snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {facts.map((fact, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div 
                  className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[96px] py-3 px-2.5 bg-card/50 border border-border rounded-xl snap-start"
                >
                  {fact.icon && (
                    <div className="text-xl mb-0.5">{fact.icon}</div>
                  )}
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide text-center">
                    {fact.label}
                  </span>
                  <span className="text-sm font-bold text-foreground text-center break-words leading-tight">
                    {fact.value}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{fact.label}: {fact.value}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      
        {/* Scroll fade indicator */}
        <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </TooltipProvider>
  );
};

export default HorizontalQuickFacts;
