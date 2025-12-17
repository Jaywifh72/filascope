import React from 'react';
import { RatingLevel, getRatingColor } from '@/lib/platformData';

interface RatingValueProps {
  rating: RatingLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const RatingValue: React.FC<RatingValueProps> = ({ rating, size = 'medium', showLabel = true }) => {
  const color = getRatingColor(rating);
  
  const sizeClasses = {
    small: 'text-xs px-1.5 py-0.5',
    medium: 'text-sm px-2 py-1',
    large: 'text-base px-3 py-1.5'
  };
  
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md ${sizeClasses[size]}`}
      style={{ 
        color: color,
        backgroundColor: `${color}15`
      }}
    >
      {showLabel ? capitalizeFirst(rating) : null}
    </span>
  );
};

export default RatingValue;
