import { useState, useEffect, useRef, useCallback, forwardRef, KeyboardEvent, Ref } from 'react';
import { X, ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { quizQuestions, QuizAnswers, QuizOption } from '@/lib/printerQuizData';
import { Button } from '@/components/ui/button';
import { usePrinterQuizAnalytics } from '@/hooks/usePrinterQuizAnalytics';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STORAGE_KEY = 'filascope_quiz_progress';
const STORAGE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

interface SavedProgress {
  answers: QuizAnswers;
  currentIndex: number;
  timestamp: number;
}

interface PrinterQuizProps {
  onClose: () => void;
  onComplete: (answers: QuizAnswers) => void;
}

const PrinterQuiz = ({ onClose, onComplete }: PrinterQuizProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const analytics = usePrinterQuizAnalytics();

  const currentQuestion = quizQuestions[currentIndex];
  const progress = ((currentIndex + 1) / quizQuestions.length) * 100;
  const isLastQuestion = currentIndex === quizQuestions.length - 1;
  const currentAnswer = answers[currentQuestion.id] || [];
  const canProceed = currentAnswer.length > 0;

  // Check for saved progress on mount
  useEffect(() => {
    analytics.trackQuizOpened();
    
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: SavedProgress = JSON.parse(saved);
        const age = Date.now() - data.timestamp;
        
        if (age < STORAGE_MAX_AGE_MS && Object.keys(data.answers).length > 0) {
          setShowRestorePrompt(true);
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [analytics]);

  // Save progress whenever answers change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      const progress: SavedProgress = {
        answers,
        currentIndex,
        timestamp: Date.now()
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [answers, currentIndex]);

  // Focus first option when question changes
  useEffect(() => {
    setTimeout(() => {
      firstOptionRef.current?.focus();
    }, 100);
  }, [currentIndex]);

  const handleRestoreProgress = () => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: SavedProgress = JSON.parse(saved);
        setAnswers(data.answers);
        setCurrentIndex(data.currentIndex);
        setHasStarted(true);
      } catch {
        // Ignore errors
      }
    }
    setShowRestorePrompt(false);
  };

  const handleStartFresh = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setShowRestorePrompt(false);
  };

  const handleOptionSelect = (optionId: string) => {
    // Track first answer as quiz start
    if (!hasStarted) {
      analytics.trackQuizStarted();
      setHasStarted(true);
    }

    analytics.trackQuestionAnswered(currentQuestion.id, optionId, currentIndex + 1);

    if (currentQuestion.type === 'single') {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: [optionId]
      }));
    } else {
      const maxSelections = currentQuestion.maxSelections || 999;
      setAnswers(prev => {
        const current = prev[currentQuestion.id] || [];
        const isSelected = current.includes(optionId);
        
        if (isSelected) {
          return {
            ...prev,
            [currentQuestion.id]: current.filter(id => id !== optionId)
          };
        } else if (current.length < maxSelections) {
          return {
            ...prev,
            [currentQuestion.id]: [...current, optionId]
          };
        }
        return prev;
      });
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      sessionStorage.removeItem(STORAGE_KEY);
      onComplete(answers);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleCloseAttempt = () => {
    if (Object.keys(answers).length > 0) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    analytics.trackQuizAbandoned(currentIndex, quizQuestions.length, Object.keys(answers).length);
    sessionStorage.removeItem(STORAGE_KEY);
    setShowCloseConfirm(false);
    onClose();
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCloseAttempt();
    }
  }, []);

  const handleOptionKeyDown = (e: React.KeyboardEvent, optionId: string, index: number) => {
    const options = currentQuestion.options;
    
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % options.length;
      const nextButton = document.querySelector(`[data-option-index="${nextIndex}"]`) as HTMLButtonElement;
      nextButton?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + options.length) % options.length;
      const prevButton = document.querySelector(`[data-option-index="${prevIndex}"]`) as HTMLButtonElement;
      prevButton?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOptionSelect(optionId);
    }
  };

  // Restore prompt dialog
  if (showRestorePrompt) {
    return (
      <div 
        className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-title"
      >
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <h2 id="restore-title" className="text-xl font-bold text-foreground">
              Continue where you left off?
            </h2>
          </div>
          <p className="text-muted-foreground mb-6">
            You have an incomplete quiz. Would you like to continue from where you stopped?
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleStartFresh}
              className="flex-1"
            >
              Start Fresh
            </Button>
            <Button
              onClick={handleRestoreProgress}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={modalRef}
        className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
        onClick={handleCloseAttempt}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-title"
      >
        <div 
          className="w-full max-w-[700px] bg-card border border-border rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 md:rounded-2xl max-h-[90vh] md:max-h-none overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-5 md:px-8 py-5 border-b border-border sticky top-0 bg-card z-10">
            <div className="flex-1">
              <div 
                className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2"
                role="progressbar"
                aria-valuenow={currentIndex + 1}
                aria-valuemin={1}
                aria-valuemax={quizQuestions.length}
                aria-label={`Question ${currentIndex + 1} of ${quizQuestions.length}`}
              >
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
                Question {currentIndex + 1} of {quizQuestions.length}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseAttempt}
              className="ml-4 h-10 w-10 rounded-lg hover:bg-destructive/10 hover:text-destructive"
              aria-label="Close quiz"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Question Content */}
          <div className="px-5 md:px-8 py-6 md:py-8">
            <h2 
              id="quiz-title"
              className="text-xl md:text-[26px] font-bold text-foreground leading-tight mb-2"
            >
              {currentQuestion.title}
            </h2>
            {currentQuestion.subtitle && (
              <p className="text-muted-foreground mb-6 md:mb-8">
                {currentQuestion.subtitle}
              </p>
            )}

            <div 
              className="flex flex-col gap-3"
              role={currentQuestion.type === 'single' ? 'radiogroup' : 'group'}
              aria-label={currentQuestion.title}
            >
              {currentQuestion.options.map((option, index) => (
                <QuizOptionButton
                  key={option.id}
                  ref={index === 0 ? firstOptionRef : undefined}
                  option={option}
                  isSelected={currentAnswer.includes(option.id)}
                  onClick={() => handleOptionSelect(option.id)}
                  onKeyDown={(e) => handleOptionKeyDown(e, option.id, index)}
                  isMultiple={currentQuestion.type === 'multiple'}
                  index={index}
                />
              ))}
            </div>

            {currentQuestion.type === 'multiple' && (
              <p className="mt-4 text-sm text-muted-foreground text-center" aria-live="polite">
                Select up to {currentQuestion.maxSelections} options ({currentAnswer.length} selected)
              </p>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="flex justify-between items-center px-5 md:px-8 py-5 border-t border-border sticky bottom-0 bg-card">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentIndex === 0}
              className="h-12 px-4 md:px-6 font-semibold min-h-[48px] touch-manipulation"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="h-12 px-6 md:px-8 font-bold min-h-[48px] min-w-[120px] touch-manipulation"
            >
              {isLastQuestion ? (
                <>
                  See Results
                  <Check className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Close Confirmation Dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved progress. Your answers will be saved for 30 minutes if you want to come back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>
              Leave Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

interface QuizOptionButtonProps {
  option: QuizOption;
  isSelected: boolean;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  isMultiple: boolean;
  index: number;
  ref?: Ref<HTMLButtonElement>;
}

const QuizOptionButton = forwardRef<HTMLButtonElement, Omit<QuizOptionButtonProps, 'ref'>>(
  ({ option, isSelected, onClick, onKeyDown, isMultiple, index }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        onKeyDown={onKeyDown}
        data-option-index={index}
        role={isMultiple ? 'checkbox' : 'radio'}
        aria-checked={isSelected}
        aria-label={`${option.emoji} ${option.label}${option.description ? `. ${option.description}` : ''}`}
        tabIndex={0}
        className={`
          relative w-full p-4 md:p-5 flex items-center gap-3 md:gap-4 text-left
          rounded-xl border-2 transition-all duration-200
          min-h-[64px] md:min-h-[60px] touch-manipulation
          ${isSelected 
            ? 'bg-primary/15 border-primary/50' 
            : 'bg-muted/30 border-border hover:bg-muted/50 hover:border-primary/30'
          }
          hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
          active:scale-[0.98]
        `}
      >
        <span className="text-2xl md:text-3xl flex-shrink-0" aria-hidden="true">{option.emoji}</span>
        
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm md:text-base ${isSelected ? 'text-primary' : 'text-foreground'}`}>
            {option.label}
          </div>
          {option.description && (
            <div className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {option.description}
            </div>
          )}
        </div>

        {isSelected && (
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Check className="h-3 w-3 md:h-4 md:w-4 text-primary-foreground" strokeWidth={3} />
          </div>
        )}
      </button>
    );
  }
);

QuizOptionButton.displayName = 'QuizOptionButton';

export default PrinterQuiz;
