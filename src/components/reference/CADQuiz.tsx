import React, { useState, useCallback, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Check, Loader2, Compass, Clock, Target, Sparkles } from 'lucide-react';
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

type QuizStage = 'welcome' | 'questions' | 'calculating' | 'results';

const STORAGE_KEY = 'cad_quiz_progress';
const STORAGE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export const CADQuiz: React.FC<CADQuizProps> = ({ open, onClose, onLearnMore }) => {
  const [stage, setStage] = useState<QuizStage>('welcome');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<CADQuizAnswers>({});
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
      setStage('questions');
    }
    setShowRestorePrompt(false);
  };

  const startFresh = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setCurrentIndex(0);
    setStage('questions');
    setShowRestorePrompt(false);
  };

  const startQuiz = () => {
    setStage('questions');
  };

  const handleOptionSelect = useCallback((optionId: string) => {
    const question = currentQuestion;
    
    if (question.type === 'single') {
      setAnswers(prev => ({ ...prev, [question.id]: optionId }));
      // Auto-advance after 300ms delay for single-select questions
      setTimeout(() => {
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Last question - trigger results calculation
          setStage('calculating');
          setTimeout(() => {
            const quizResults = getTopCADRecommendations({ ...answers, [question.id]: optionId });
            setResults(quizResults);
            setStage('results');
            localStorage.removeItem(STORAGE_KEY);
          }, 2000);
        }
      }, 300);
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
  }, [currentQuestion, currentIndex, totalQuestions, answers]);

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
      setStage('calculating');
      setTimeout(() => {
        const quizResults = getTopCADRecommendations(answers);
        setResults(quizResults);
        setStage('results');
        localStorage.removeItem(STORAGE_KEY);
      }, 2000);
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
    setStage('welcome');
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
        setStage('welcome');
      }
    }, 300);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || stage !== 'questions' || showRestorePrompt) return;
      
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
  }, [open, stage, showRestorePrompt, currentQuestion, canProceed]);

  if (!open) return null;

  // Results view
  if (stage === 'results' && results) {
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
  if (stage === 'calculating') {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md p-0 gap-0 bg-background border-border overflow-hidden">
          <DialogTitle className="sr-only">Calculating Results</DialogTitle>
          <div className="relative flex flex-col items-center justify-center py-16 px-8 text-center">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-cyan-500/5 animate-pulse" />
            
            {/* Spinner with glow */}
            <div className="relative mb-8">
              <div className="absolute inset-0 blur-xl bg-cyan-500/20 animate-pulse" />
              <div className="relative w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-2">
              Finding your perfect match...
            </h3>
            <p className="text-muted-foreground text-sm">
              Analyzing your preferences against 20+ software options
            </p>
            
            {/* Progress dots */}
            <div className="flex gap-1.5 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
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

  // Welcome screen
  if (stage === 'welcome') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg p-0 gap-0 bg-background border-border overflow-hidden">
          <DialogTitle className="sr-only">CAD Software Quiz</DialogTitle>
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-muted/80 transition-colors"
            aria-label="Close quiz"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="relative px-8 py-12 text-center">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
            
            {/* Icon */}
            <div className="relative mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border-2 border-cyan-500/30 flex items-center justify-center">
              <Compass className="w-10 h-10 text-cyan-500" />
            </div>
            
            {/* Title */}
            <h2 className="relative text-2xl md:text-3xl font-extrabold text-foreground mb-3">
              Find Your Perfect<br />
              <span className="text-cyan-500">CAD Software</span>
            </h2>
            
            {/* Subtitle */}
            <p className="relative text-muted-foreground mb-8 max-w-sm mx-auto">
              Answer 6 quick questions and we'll recommend the best tools for your specific needs
            </p>
            
            {/* Features */}
            <div className="relative flex flex-wrap justify-center gap-4 md:gap-6 mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-cyan-500" />
                <span className="font-medium">90 seconds</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4 text-cyan-500" />
                <span className="font-medium">Personalized results</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span className="font-medium">Match percentage</span>
              </div>
            </div>
            
            {/* Start button */}
            <button
              onClick={startQuiz}
              className={cn(
                "relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl",
                "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500",
                "text-white font-bold text-lg",
                "shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40",
                "transform hover:-translate-y-0.5 transition-all duration-200"
              )}
            >
              Start Quiz
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Questions screen
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
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-300 ease-out rounded-full"
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
              <p className="text-sm text-cyan-500 mt-2 font-medium">
                Select up to {currentQuestion.maxSelections}
              </p>
            )}
          </div>

          {/* Options grid */}
          <div className={cn(
            "grid gap-3",
            currentQuestion.options.length > 4 ? "md:grid-cols-2" : "grid-cols-1"
          )}>
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
                      ? "border-cyan-500 bg-cyan-500/10 shadow-md shadow-cyan-500/10" 
                      : "border-border hover:border-cyan-500/50 hover:bg-muted/30"
                  )}
                >
                  {/* Checkbox/Radio indicator */}
                  <div className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center",
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
                      <span className="text-xs text-muted-foreground font-mono">
                        {index + 1}
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
                  ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
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
