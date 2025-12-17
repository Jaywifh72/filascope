import React from 'react';
import { RatingLevel, getRatingConfig } from '@/lib/platformData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RatingValueProps {
  rating: RatingLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showTooltip?: boolean;
  tooltipContent?: string;
}

const RatingValue: React.FC<RatingValueProps> = ({ 
  rating, 
  size = 'medium', 
  showLabel = true,
  showTooltip = false,
  tooltipContent
}) => {
  const config = getRatingConfig(rating);
  
  const sizeClasses = {
    small: 'text-xs px-1.5 py-0.5',
    medium: 'text-sm px-2 py-1',
    large: 'text-base px-3 py-1.5'
  };
  
  const badge = (
    <span
      className={`inline-flex items-center font-semibold rounded-md transition-transform hover:scale-105 ${sizeClasses[size]}`}
      style={{ 
        color: config.color,
        backgroundColor: config.backgroundColor
      }}
      role="text"
      aria-label={`Rating: ${config.label}. ${tooltipContent || config.description}`}
    >
      {showLabel ? config.label : null}
    </span>
  );
  
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold text-foreground">{config.label}</p>
            <p className="text-muted-foreground text-xs">{tooltipContent || config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return badge;
};

export default RatingValue;
