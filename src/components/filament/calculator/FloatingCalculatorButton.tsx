import React from 'react';
import { Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingCalculatorButtonProps {
  onClick: () => void;
  pulseOnMount?: boolean;
  className?: string;
}

export const FloatingCalculatorButton: React.FC<FloatingCalculatorButtonProps> = ({
  onClick,
  pulseOnMount = true,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-24 right-4 md:right-6 z-40",
        "flex items-center gap-2 px-4 py-3 md:px-5 md:py-3.5",
        "bg-gradient-to-r from-primary to-primary/80",
        "border-none rounded-full",
        "text-primary-foreground cursor-pointer",
        "shadow-lg shadow-primary/30",
        "transition-all duration-300",
        "hover:scale-105 hover:shadow-xl hover:shadow-primary/40",
        "active:scale-98",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        pulseOnMount && "animate-pulse",
        className
      )}
      aria-label="Open print calculator"
    >
      <div className="flex items-center justify-center">
        <Calculator className="h-5 w-5 md:h-6 md:w-6" />
      </div>
      <span className="text-sm md:text-base font-bold hidden sm:inline">
        Calculator
      </span>
    </button>
  );
};
