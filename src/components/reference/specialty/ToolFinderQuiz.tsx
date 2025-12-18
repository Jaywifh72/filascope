import { useState, useCallback, useMemo } from 'react';
import { Sparkles, ArrowLeft, RotateCcw, List, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  SpecialtyQuizAnswers, 
  QuestionId, 
  specialtyQuizQuestions 
} from '@/lib/specialtyQuizData';
import { ToolMatch, calculateToolMatches } from '@/lib/specialtyQuizService';
import { specialtyTools } from '@/lib/specialtyData';
import { cn } from '@/lib/utils';

type QuizStep = 'intro' | 'questions' | 'results';

interface QuizState {
  step: QuizStep;
  currentQuestion: number;
  answers: SpecialtyQuizAnswers;
  results: ToolMatch[] | null;
}

// Category icon mapping
const categoryIcons: Record<string, string> = {
  'ai-generation': '🤖',
  'filament-art': '🎨',
  'farm-management': '🏭',
  'calibration': '🎯',
  'cad': '📐',
  'repository': '📦',
  'remote-control': '📡',
  'mesh-tools': '🔧'
};

const useQuizState = () => {
  const [state, setState] = useState<QuizState>({
    step: 'intro',
    currentQuestion: 0,
    answers: {
      goal: null,
      skillLevel: null,
      budget: null,
      printerType: null
    },
    results: null
  });

  const startQuiz = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: 'questions',
      currentQuestion: 0
    }));
  }, []);

  const selectAnswer = useCallback((questionId: QuestionId, answerId: string) => {
    setState(prev => {
      const newAnswers = {
        ...prev.answers,
        [questionId]: answerId
      };
      
      const isLastQuestion = prev.currentQuestion === specialtyQuizQuestions.length - 1;
      
      if (isLastQuestion) {
        const results = calculateToolMatches(newAnswers);
        return {
          ...prev,
          answers: newAnswers,
          results,
          step: 'results'
        };
      } else {
        return {
          ...prev,
          answers: newAnswers,
          currentQuestion: prev.currentQuestion + 1
        };
      }
    });
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.currentQuestion > 0) {
        return {
          ...prev,
          currentQuestion: prev.currentQuestion - 1
        };
      }
      return {
        ...prev,
        step: 'intro'
      };
    });
  }, []);

  const restartQuiz = useCallback(() => {
    setState({
      step: 'intro',
      currentQuestion: 0,
      answers: {
        goal: null,
        skillLevel: null,
        budget: null,
        printerType: null
      },
      results: null
    });
  }, []);

  const currentQuestionData = useMemo(() => {
    return specialtyQuizQuestions[state.currentQuestion];
  }, [state.currentQuestion]);

  const progress = useMemo(() => {
    return ((state.currentQuestion + 1) / specialtyQuizQuestions.length) * 100;
  }, [state.currentQuestion]);

  return {
    state,
    startQuiz,
    selectAnswer,
    goBack,
    restartQuiz,
    currentQuestionData,
    progress
  };
};

// Quiz Intro Screen
interface QuizIntroProps {
  onStart: () => void;
}

const QuizIntro = ({ onStart }: QuizIntroProps) => {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12 md:px-12">
      {/* Pulsing Icon */}
      <div className="w-20 h-20 md:w-22 md:h-22 mb-6 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center animate-pulse">
        <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-primary" />
      </div>
      
      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
        Find Your Perfect Tool
      </h2>
      
      {/* Subtitle */}
      <p className="max-w-[400px] text-sm md:text-base text-muted-foreground leading-relaxed mb-8">
        Answer 4 quick questions and we'll recommend the best 
        specialty tools for your specific needs.
      </p>
      
      {/* Feature badges */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-lg">⏱️</span>
          <span>Takes 60 seconds</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-lg">🎯</span>
          <span>Personalized results</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-lg">💡</span>
          <span>Match explanations</span>
        </div>
      </div>
      
      {/* Start Button */}
      <Button
        onClick={onStart}
        size="lg"
        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold px-10 py-6 text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Start Quiz
      </Button>
      
      {/* Skip Link */}
      <a 
        href="#tool-cards"
        className="mt-5 text-sm text-muted-foreground/70 hover:text-primary transition-colors"
      >
        or browse all 10 tools →
      </a>
    </div>
  );
};

// Quiz Question Screen
interface QuizQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  progress: number;
  selectedAnswer: string | null;
  onSelectAnswer: (answerId: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

const QuizQuestion = ({
  questionNumber,
  totalQuestions,
  progress,
  selectedAnswer,
  onSelectAnswer,
  onBack,
  canGoBack
}: QuizQuestionProps) => {
  const question = specialtyQuizQuestions[questionNumber - 1];
  
  return (
    <div 
      key={questionNumber}
      className="p-6 md:p-8 animate-in slide-in-from-right-8 duration-400"
    >
      {/* Progress Section */}
      <div className="mb-8">
        <div 
          className="h-1.5 bg-muted/50 rounded-full overflow-hidden mb-3"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div 
            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-sm font-semibold text-muted-foreground">
          Question {questionNumber} of {totalQuestions}
        </p>
      </div>
      
      {/* Back Button */}
      {canGoBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 mb-6 rounded-lg border border-border/50 text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}
      
      {/* Question Text */}
      <h3 className="text-xl md:text-2xl font-bold text-foreground text-center mb-2">
        {question.question}
      </h3>
      {question.subtitle && (
        <p className="text-sm font-medium text-muted-foreground text-center mb-8">
          {question.subtitle}
        </p>
      )}
      
      {/* Options Grid */}
      <div className={cn(
        "grid gap-3 max-w-[600px] mx-auto",
        question.options.length <= 3 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
      )}>
        {question.options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => onSelectAnswer(option.id)}
              className={cn(
                "flex items-start gap-4 p-5 min-h-[80px] rounded-xl border-2 text-left transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "active:scale-[0.99]",
                isSelected 
                  ? "bg-primary/10 border-primary" 
                  : "bg-background/50 border-border/50 hover:bg-muted/50 hover:border-border"
              )}
              role="button"
              aria-pressed={isSelected}
            >
              {/* Icon */}
              <span className="text-2xl flex-shrink-0">{option.icon}</span>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground mb-1">{option.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {option.description}
                </p>
              </div>
              
              {/* Selection Indicator */}
              <div className={cn(
                "w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all",
                isSelected 
                  ? "border-primary bg-primary" 
                  : "border-muted-foreground/30 bg-transparent"
              )}>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Quiz Results Screen
interface QuizResultsProps {
  results: ToolMatch[];
  onRestart: () => void;
}

const QuizResults = ({ results, onRestart }: QuizResultsProps) => {
  const topResults = results.slice(0, 3);
  
  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">
          Your Perfect Tools
        </h2>
        <p className="text-sm font-medium text-muted-foreground">
          Based on your answers, here are our top recommendations
        </p>
      </div>
      
      {/* Results List */}
      <div className="flex flex-col gap-4 max-w-[600px] mx-auto mb-8">
        {topResults.map((match, index) => {
          const tool = specialtyTools.find(t => t.id === match.toolId);
          if (!tool) return null;
          
          const rank = index + 1;
          const rankLabel = rank === 1 ? 'BEST MATCH' : rank === 2 ? 'GREAT MATCH' : 'GOOD MATCH';
          const categoryIcon = categoryIcons[tool.category] || '🔧';
          
          return (
            <div
              key={match.toolId}
              className={cn(
                "p-5 md:p-6 rounded-2xl border transition-all",
                "animate-in fade-in-0 slide-in-from-bottom-4",
                rank === 1 
                  ? "bg-primary/5 border-primary/30 shadow-lg shadow-primary/10" 
                  : "bg-background/50 border-border/50"
              )}
              style={{ animationDelay: `${(rank - 1) * 150}ms`, animationFillMode: 'both' }}
            >
              {/* Rank Badge */}
              <div className={cn(
                "text-xs font-bold tracking-wider mb-3",
                rank === 1 ? "text-primary" : rank === 2 ? "text-purple-400" : "text-muted-foreground"
              )}>
                #{rank} {rankLabel}
              </div>
              
              {/* Match Bar */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-extrabold text-foreground min-w-[60px]">
                  {match.matchPercentage}%
                </span>
                <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      rank === 1 ? "bg-gradient-to-r from-primary to-primary/80" :
                      rank === 2 ? "bg-gradient-to-r from-purple-500 to-purple-400" :
                      "bg-gradient-to-r from-muted-foreground to-muted-foreground/80"
                    )}
                    style={{ 
                      width: `${match.matchPercentage}%`,
                      transitionDelay: '300ms'
                    }}
                  />
                </div>
              </div>
              
              {/* Tool Info */}
              <div className="flex items-start gap-4 mb-4">
                <span className="text-4xl">{categoryIcon}</span>
                <div>
                  <h4 className="text-lg font-bold text-foreground mb-2">
                    {tool.name}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {tool.category.replace('-', ' ')}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        tool.pricingModel === 'free' && "border-green-500/50 text-green-500",
                        tool.pricingModel === 'freemium' && "border-blue-500/50 text-blue-500",
                        tool.pricingModel === 'one-time' && "border-amber-500/50 text-amber-500",
                        tool.pricingModel === 'subscription' && "border-purple-500/50 text-purple-500"
                      )}
                    >
                      {tool.pricingModel === 'free' ? 'Free' :
                       tool.pricingModel === 'freemium' ? 'Freemium' :
                       tool.pricingModel === 'one-time' ? 'One-Time' : 'Subscription'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Standout Feature */}
              {tool.standoutFeature && (
                <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-amber-500/10">
                  <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold text-amber-500">
                    {tool.standoutFeature.title}
                  </span>
                </div>
              )}
              
              {/* Match Reasons */}
              {match.matchReasons.length > 0 && (
                <div className="p-4 mb-4 rounded-xl bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Why this matches you:
                  </p>
                  <div className="flex flex-col gap-1">
                    {match.matchReasons.map((reason, i) => (
                      <p key={i} className="text-sm font-medium text-green-500">
                        {reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <a
                  href={`#tool-${tool.id}`}
                  className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl border border-border/50 text-sm font-semibold text-foreground hover:bg-muted/50 transition-all"
                >
                  Learn More
                </a>
                <a
                  href={tool.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 hover:-translate-y-0.5 transition-all"
                >
                  Visit Site
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-6 border-t border-border/50">
        <Button
          variant="outline"
          onClick={onRestart}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Retake Quiz
        </Button>
        <Button
          variant="outline"
          asChild
          className="gap-2"
        >
          <a href="#tool-cards">
            <List className="w-4 h-4" />
            Browse All Tools
          </a>
        </Button>
      </div>
    </div>
  );
};

// Main Quiz Container
const ToolFinderQuiz = () => {
  const {
    state,
    startQuiz,
    selectAnswer,
    goBack,
    restartQuiz,
    currentQuestionData,
    progress
  } = useQuizState();

  return (
    <section 
      id="tool-finder-quiz"
      className="max-w-[700px] mx-auto mb-12 bg-muted/30 border border-border/50 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,217,217,0.05),0_0_30px_rgba(139,92,246,0.03)]"
      aria-label="Tool Finder Quiz"
    >
      {state.step === 'intro' && (
        <QuizIntro onStart={startQuiz} />
      )}
      
      {state.step === 'questions' && currentQuestionData && (
        <QuizQuestion
          questionNumber={state.currentQuestion + 1}
          totalQuestions={specialtyQuizQuestions.length}
          progress={progress}
          selectedAnswer={state.answers[currentQuestionData.id]}
          onSelectAnswer={(answerId) => selectAnswer(currentQuestionData.id, answerId)}
          onBack={goBack}
          canGoBack={state.currentQuestion > 0}
        />
      )}
      
      {state.step === 'results' && state.results && (
        <QuizResults
          results={state.results}
          onRestart={restartQuiz}
        />
      )}
    </section>
  );
};

export default ToolFinderQuiz;
