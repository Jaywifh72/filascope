import { useEffect, useState, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboardingTour, ONBOARDING_TOUR_STEPS, TourPosition } from '@/hooks/useOnboardingTour';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

function calculatePosition(
  targetRect: DOMRect,
  position: TourPosition,
  tooltipWidth: number = 320,
  tooltipHeight: number = 180
): TooltipPosition {
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  const padding = 16;
  
  let top = 0;
  let left = 0;
  let arrowPosition: TooltipPosition['arrowPosition'] = 'top';
  
  switch (position) {
    case 'bottom':
      top = targetRect.bottom + scrollY + padding;
      left = targetRect.left + scrollX + targetRect.width / 2 - tooltipWidth / 2;
      arrowPosition = 'top';
      break;
    case 'top':
      top = targetRect.top + scrollY - tooltipHeight - padding;
      left = targetRect.left + scrollX + targetRect.width / 2 - tooltipWidth / 2;
      arrowPosition = 'bottom';
      break;
    case 'left':
      top = targetRect.top + scrollY + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left + scrollX - tooltipWidth - padding;
      arrowPosition = 'right';
      break;
    case 'right':
      top = targetRect.top + scrollY + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.right + scrollX + padding;
      arrowPosition = 'left';
      break;
  }
  
  // Keep tooltip within viewport bounds
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  if (left < padding) left = padding;
  if (left + tooltipWidth > viewportWidth - padding) {
    left = viewportWidth - tooltipWidth - padding;
  }
  if (top < scrollY + padding) top = scrollY + padding;
  if (top + tooltipHeight > scrollY + viewportHeight - padding) {
    top = scrollY + viewportHeight - tooltipHeight - padding;
  }
  
  return { top, left, arrowPosition };
}

export function OnboardingTour() {
  const {
    isActive,
    currentStep,
    currentTourStep,
    totalSteps,
    nextStep,
    previousStep,
    skipTour,
  } = useOnboardingTour();
  
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  
  const findAndPositionTooltip = useCallback(() => {
    if (!isActive || !currentTourStep) return;
    
    const target = document.querySelector(currentTourStep.target);
    if (target) {
      setTargetElement(target);
      const rect = target.getBoundingClientRect();
      const newPosition = calculatePosition(rect, currentTourStep.position);
      setPosition(newPosition);
      
      // Scroll element into view smoothly
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    } else {
      setTargetElement(null);
      setPosition(null);
    }
  }, [isActive, currentTourStep]);
  
  useEffect(() => {
    if (!isActive) return;
    
    // Initial positioning with delay for DOM readiness
    const timer = setTimeout(findAndPositionTooltip, 300);
    
    // Reposition on scroll/resize
    window.addEventListener('scroll', findAndPositionTooltip);
    window.addEventListener('resize', findAndPositionTooltip);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', findAndPositionTooltip);
      window.removeEventListener('resize', findAndPositionTooltip);
    };
  }, [isActive, currentStep, findAndPositionTooltip]);
  
  if (!isActive || !currentTourStep || !position) {
    return null;
  }
  
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  
  const tooltipContent = (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-[9998] transition-opacity duration-300"
        onClick={skipTour}
      />
      
      {/* Highlight ring around target */}
      {targetElement && (
        <div
          className="fixed z-[9999] rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none"
          style={{
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
          }}
        />
      )}
      
      {/* Tooltip */}
      <div
        className={cn(
          "fixed z-[10000] w-[320px] bg-card border border-border rounded-xl shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        {/* Arrow */}
        <div
          className={cn(
            "absolute w-3 h-3 bg-card border-border rotate-45",
            position.arrowPosition === 'top' && "-top-1.5 left-1/2 -translate-x-1/2 border-l border-t",
            position.arrowPosition === 'bottom' && "-bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b",
            position.arrowPosition === 'left' && "-left-1.5 top-1/2 -translate-y-1/2 border-l border-b",
            position.arrowPosition === 'right' && "-right-1.5 top-1/2 -translate-y-1/2 border-r border-t"
          )}
        />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Getting Started
            </span>
          </div>
          <button
            onClick={skipTour}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close tour"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="text-base font-semibold text-foreground mb-2">
            {currentTourStep.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentTourStep.description}
          </p>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 pt-2 border-t border-border">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {ONBOARDING_TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  idx === currentStep 
                    ? "bg-primary w-4" 
                    : idx < currentStep 
                      ? "bg-primary/50" 
                      : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={previousStep}
                className="h-8 px-3 text-xs"
              >
                <ChevronLeft className="w-3 h-3 mr-1" />
                Back
              </Button>
            )}
            
            {isLastStep ? (
              <Button
                size="sm"
                onClick={skipTour}
                className="h-8 px-4 text-xs bg-primary hover:bg-primary/90"
              >
                Get Started!
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={nextStep}
                className="h-8 px-3 text-xs"
              >
                Next
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Skip link */}
        {!isLastStep && (
          <button
            onClick={skipTour}
            className="block w-full text-center py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors border-t border-border"
          >
            Skip tour
          </button>
        )}
      </div>
    </>
  );
  
  return createPortal(tooltipContent, document.body);
}
