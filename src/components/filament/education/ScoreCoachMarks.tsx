import { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScoreCoachMarks } from '@/hooks/useScoreCoachMarks';
import { COACH_MARKS, CoachMarkPosition } from '@/lib/scoreEducation';
import { cn } from '@/lib/utils';

interface ScoreCoachMarksProps {
  children: React.ReactNode;
}

export function ScoreCoachMarks({ children }: ScoreCoachMarksProps) {
  const { 
    isActive, 
    currentStep, 
    dismissCoachMarks, 
    nextStep, 
    previousStep,
    totalSteps 
  } = useScoreCoachMarks();
  
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const currentMark = COACH_MARKS[currentStep];
  
  // Find target element and position the tooltip
  useEffect(() => {
    if (!isActive || !currentMark) return;
    
    const findTarget = () => {
      const target = document.querySelector(currentMark.target);
      if (target) {
        const rect = target.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        let top = rect.top + scrollY;
        let left = rect.left + scrollX;
        
        switch (currentMark.position) {
          case 'bottom':
            top = rect.bottom + scrollY + 12;
            left = rect.left + scrollX + rect.width / 2;
            break;
          case 'top':
            top = rect.top + scrollY - 12;
            left = rect.left + scrollX + rect.width / 2;
            break;
          case 'left':
            top = rect.top + scrollY + rect.height / 2;
            left = rect.left + scrollX - 12;
            break;
        }
        
        setPosition({ top, left });
        
        // Scroll element into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    
    // Delay to allow DOM to render
    const timer = setTimeout(findTarget, 300);
    return () => clearTimeout(timer);
  }, [isActive, currentStep, currentMark]);
  
  if (!isActive || !currentMark) {
    return <>{children}</>;
  }
  
  const isLastStep = currentStep === totalSteps - 1;
  
  return (
    <>
      {children}
      
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[100] pointer-events-auto" />
      
      {/* Coach mark tooltip */}
      <div
        className={cn(
          "fixed z-[101] w-[300px] bg-card border border-border rounded-xl shadow-2xl p-4 animate-fade-in",
          currentMark.position === 'bottom' && "-translate-x-1/2",
          currentMark.position === 'top' && "-translate-x-1/2 -translate-y-full",
          currentMark.position === 'left' && "-translate-x-full -translate-y-1/2"
        )}
        style={{ 
          top: position.top, 
          left: position.left,
        }}
      >
        {/* Arrow indicator */}
        <div className={cn(
          "absolute w-3 h-3 bg-card border-border rotate-45",
          currentMark.position === 'bottom' && "-top-1.5 left-1/2 -translate-x-1/2 border-l border-t",
          currentMark.position === 'top' && "-bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b",
          currentMark.position === 'left' && "-right-1.5 top-1/2 -translate-y-1/2 border-t border-r"
        )} />
        
        {/* Close button */}
        <button
          onClick={dismissCoachMarks}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Close guide"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        
        {/* Content */}
        <div className="pr-6">
          <p className="text-sm font-semibold text-foreground mb-1">
            {currentMark.title}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {currentMark.description}
          </p>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {COACH_MARKS.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  idx === currentStep ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
          
          {/* Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={previousStep}
                className="h-7 px-2 text-xs"
              >
                <ChevronLeft className="w-3 h-3 mr-1" />
                Back
              </Button>
            )}
            
            {isLastStep ? (
              <Button
                size="sm"
                onClick={dismissCoachMarks}
                className="h-7 px-3 text-xs bg-primary hover:bg-primary/90"
              >
                Got it!
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={nextStep}
                className="h-7 px-2 text-xs"
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
            onClick={dismissCoachMarks}
            className="block w-full text-center mt-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tutorial
          </button>
        )}
      </div>
    </>
  );
}
