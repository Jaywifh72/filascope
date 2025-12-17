import React, { useState, useCallback, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cadQuizQuestions, CADQuizAnswers, cadSoftwareIdMap } from '@/lib/cadQuizData';
import { getTopCADRecommendations, CADMatchResult } from '@/lib/cadQuizService';
import { CADQuizResults } from './CADQuizResults';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface CADQuizProps {
  open: boolean;
  onClose: () => void;
  onLearnMore?: (cadDataId: string) => void;
}

const STORAGE_KEY = 'cad_quiz_progress';
const STORAGE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export const CADQuiz: React.FC<CADQuizProps> = ({ open, onClose, onLearnMore }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<CADQuizAnswers>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<CADMatchResult[] | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

  const questions = cadQuizQuestions;
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // Check for saved progress on mount
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const { answers: savedAnswers, index, timestamp } = JSON.parse(saved);
          const isExpired = Date.now() - timestamp > STORAGE_EXPIRY_MS;
          if (!isExpired && Object.keys(savedAnswers).length > 0) {
            setShowRestorePrompt(true);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [open]);

  // Save progress
  useEffect(() => {
    if (Object.keys(answers).length > 0 && !results) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers,
        index: currentIndex,
        timestamp: Date.now()
      }));
    }
  }, [answers, currentIndex, results]);

  const restoreProgress = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { answers: savedAnswers, index } = JSON.parse(saved);
      setAnswers(savedAnswers);
      setCurrentIndex(index);
    }
    setShowRestorePrompt(false);
  };

  const startFresh = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setCurrentIndex(0);
    setShowRestorePrompt(false);
  };

  const handleOptionSelect = useCallback((optionId: string) => {
    const question = currentQuestion;
    
    if (question.type === 'single') {
      setAnswers(prev => ({ ...prev, [question.id]: optionId }));
    } else {
      // Multi-select
      setAnswers(prev => {
        const current = (prev[question.id] as string[]) || [];
        const maxSelections = question.maxSelections || 10;
        
        if (current.includes(optionId)) {
          return { ...prev, [question.id]: current.filter(id => id !== optionId) };
        } else if (current.length < maxSelections) {
          return { ...prev, [question.id]: [...current, optionId] };
        }
        return prev;
      });
    }
  }, [currentQuestion]);

  const isOptionSelected = (optionId: string): boolean => {
    const answer = answers[currentQuestion.id];
    if (Array.isArray(answer)) {
      return answer.includes(optionId);
    }
    return answer === optionId;
  };

  const canProceed = (): boolean => {
    const answer = answers[currentQuestion.id];
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return !!answer;
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Calculate results
      setIsCalculating(true);
      setTimeout(() => {
        const quizResults = getTopCADRecommendations(answers);
        setResults(quizResults);
        setIsCalculating(false);
        localStorage.removeItem(STORAGE_KEY);
      }, 1500);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentIndex(0);
    setResults(null);
  };

  const handleClose = () => {
    onClose();
    // Reset state after animation
    setTimeout(() => {
      if (!results) {
        // Keep progress if quiz not completed
      } else {
        setAnswers({});
        setCurrentIndex(0);
        setResults(null);
      }
    }, 300);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || results || isCalculating || showRestorePrompt) return;
      
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (canProceed()) {
          handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      } else if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (currentQuestion.options[index]) {
          handleOptionSelect(currentQuestion.options[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, isCalculating, showRestorePrompt, currentQuestion, canProceed]);

  if (!open) return null;

  // Results view
  if (results) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background border-border">
          <DialogTitle className="sr-only">Quiz Results</DialogTitle>
          <CADQuizResults
            results={results}
            onClose={handleClose}
            onRetake={handleRetake}
            onLearnMore={(softwareId) => {
              const cadDataId = cadSoftwareIdMap[softwareId] || softwareId;
              onLearnMore?.(cadDataId);
              handleClose();
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Calculating view
  if (isCalculating) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md p-8 bg-background border-border">
          <DialogTitle className="sr-only">Calculating Results</DialogTitle>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-6">
              <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Analyzing Your Preferences
            </h3>
            <p className="text-muted-foreground">
              Finding your perfect CAD software match...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Restore prompt
  if (showRestorePrompt) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-6 bg-background border-border">
          <DialogTitle className="sr-only">Resume Quiz</DialogTitle>
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Resume Your Quiz?
            </h3>
            <p className="text-muted-foreground mb-6">
              We found your previous progress. Would you like to continue where you left off?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={startFresh}
                className={cn(
                  "px-4 py-2 rounded-lg",
                  "bg-muted hover:bg-muted/80",
                  "text-foreground font-medium",
                  "transition-colors"
                )}
              >
                Start Fresh
              </button>
              <button
                onClick={restoreProgress}
                className={cn(
                  "px-4 py-2 rounded-lg",
                  "bg-cyan-500 hover:bg-cyan-600",
                  "text-white font-medium",
                  "transition-colors"
                )}
              >
                Continue
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background border-border">
        <DialogTitle className="sr-only">CAD Software Quiz - Question {currentIndex + 1}</DialogTitle>
        
        {/* Header with progress */}
        <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close quiz"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">
              {currentQuestion.question}
            </h2>
            {currentQuestion.subtext && (
              <p className="text-muted-foreground">
                {currentQuestion.subtext}
              </p>
            )}
            {currentQuestion.type === 'multi' && currentQuestion.maxSelections && (
              <p className="text-sm text-cyan-500 mt-1">
                Select up to {currentQuestion.maxSelections}
              </p>
            )}
          </div>

          {/* Options grid */}
          <div className="grid gap-3">
            {currentQuestion.options.map((option, index) => {
              const selected = isOptionSelected(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  className={cn(
                    "relative flex items-start gap-4 p-4 rounded-xl text-left",
                    "border-2 transition-all duration-200",
                    selected 
                      ? "border-cyan-500 bg-cyan-500/10" 
                      : "border-border hover:border-border/80 hover:bg-muted/30"
                  )}
                >
                  {/* Checkbox/Radio indicator */}
                  <div className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    "transition-all duration-200",
                    selected 
                      ? "border-cyan-500 bg-cyan-500" 
                      : "border-muted-foreground/40"
                  )}>
                    {selected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  
                  {/* Icon */}
                  <span className="text-2xl flex-shrink-0">{option.icon}</span>
                  
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-semibold",
                        selected ? "text-foreground" : "text-foreground/90"
                      )}>
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({index + 1})
                      </span>
                    </div>
                    {option.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {option.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer navigation */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentIndex === 0}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "font-medium transition-colors",
                currentIndex === 0
                  ? "text-muted-foreground/50 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-lg",
                "font-semibold transition-all",
                canProceed()
                  ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {currentIndex === totalQuestions - 1 ? (
                <>See Results</>
              ) : (
                <>Next <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
