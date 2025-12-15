import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SCORE_TOOLTIPS } from '@/lib/scoreEducation';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  term: keyof typeof SCORE_TOOLTIPS | string;
  className?: string;
  iconClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function InfoTooltip({ term, className, iconClassName, side = "top" }: InfoTooltipProps) {
  const tooltipData = SCORE_TOOLTIPS[term];
  
  if (!tooltipData) {
    return null;
  }
  
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            className={cn(
              "inline-flex items-center justify-center p-0.5 rounded-full",
              "hover:bg-muted/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50",
              className
            )}
            aria-label={`Learn about ${tooltipData.title}`}
          >
            <HelpCircle className={cn("w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-[280px] p-3 bg-popover border-border"
        >
          <p className="font-semibold text-foreground text-sm mb-1">{tooltipData.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{tooltipData.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Inline version for embedding in text
export function InlineInfoTooltip({ term, label }: { term: string; label?: string }) {
  const tooltipData = SCORE_TOOLTIPS[term];
  
  if (!tooltipData) {
    return <span>{label || term}</span>;
  }
  
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/40 hover:border-primary transition-colors">
            {label || tooltipData.title}
            <HelpCircle className="w-3 h-3 text-muted-foreground/50" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px] p-3 bg-popover border-border">
          <p className="font-semibold text-foreground text-sm mb-1">{tooltipData.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{tooltipData.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
