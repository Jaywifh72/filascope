import { useState } from 'react';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { quizQuestions, QuizAnswers, QuizQuestion, QuizOption } from '@/lib/printerQuizData';
import { Button } from '@/components/ui/button';

interface PrinterQuizProps {
  onClose: () => void;
  onComplete: (answers: QuizAnswers) => void;
}

const PrinterQuiz = ({ onClose, onComplete }: PrinterQuizProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const currentQuestion = quizQuestions[currentIndex];
  const progress = ((currentIndex + 1) / quizQuestions.length) * 100;
  const isLastQuestion = currentIndex === quizQuestions.length - 1;
  const currentAnswer = answers[currentQuestion.id] || [];

  const handleOptionSelect = (optionId: string) => {
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

  const canProceed = currentAnswer.length > 0;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[700px] bg-card border border-border rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 md:px-8 py-5 border-b border-border">
          <div className="flex-1">
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Question {currentIndex + 1} of {quizQuestions.length}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="ml-4 h-10 w-10 rounded-lg hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Question Content */}
        <div className="px-6 md:px-8 py-8">
          <h2 className="text-2xl md:text-[26px] font-bold text-foreground leading-tight mb-2">
            {currentQuestion.title}
          </h2>
          {currentQuestion.subtitle && (
            <p className="text-muted-foreground mb-8">
              {currentQuestion.subtitle}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {currentQuestion.options.map(option => (
              <QuizOptionButton
                key={option.id}
                option={option}
                isSelected={currentAnswer.includes(option.id)}
                onClick={() => handleOptionSelect(option.id)}
                isMultiple={currentQuestion.type === 'multiple'}
              />
            ))}
          </div>

          {currentQuestion.type === 'multiple' && (
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Select up to {currentQuestion.maxSelections} options ({currentAnswer.length} selected)
            </p>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center px-6 md:px-8 py-5 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="h-12 px-6 font-semibold"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="h-12 px-8 font-bold"
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
  );
};

interface QuizOptionButtonProps {
  option: QuizOption;
  isSelected: boolean;
  onClick: () => void;
  isMultiple: boolean;
}

const QuizOptionButton = ({ option, isSelected, onClick, isMultiple }: QuizOptionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full p-5 flex items-center gap-4 text-left
        rounded-xl border-2 transition-all duration-200
        ${isSelected 
          ? 'bg-primary/15 border-primary/50' 
          : 'bg-muted/30 border-border hover:bg-muted/50 hover:border-primary/30'
        }
        hover:translate-x-1
      `}
    >
      <span className="text-3xl flex-shrink-0">{option.emoji}</span>
      
      <div className="flex-1 min-w-0">
        <div className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
          {option.label}
        </div>
        {option.description && (
          <div className="text-sm text-muted-foreground mt-0.5">
            {option.description}
          </div>
        )}
      </div>

      {isSelected && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
        </div>
      )}
    </button>
  );
};

export default PrinterQuiz;
