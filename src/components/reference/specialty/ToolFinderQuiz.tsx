import { useState, useCallback, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  SpecialtyQuizAnswers, 
  QuestionId, 
  specialtyQuizQuestions 
} from '@/lib/specialtyQuizData';
import { ToolMatch, calculateToolMatches } from '@/lib/specialtyQuizService';

type QuizStep = 'intro' | 'questions' | 'results';

interface QuizState {
  step: QuizStep;
  currentQuestion: number;
  answers: SpecialtyQuizAnswers;
  results: ToolMatch[] | null;
}

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
    >
      {state.step === 'intro' && (
        <QuizIntro onStart={startQuiz} />
      )}
      
      {state.step === 'questions' && currentQuestionData && (
        <div className="p-6 text-center text-muted-foreground">
          {/* Question screen placeholder - Part 2 */}
          <p>Question {state.currentQuestion + 1} of {specialtyQuizQuestions.length}</p>
          <p className="mt-2 font-semibold text-foreground">{currentQuestionData.question}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {currentQuestionData.options.map(option => (
              <button
                key={option.id}
                onClick={() => selectAnswer(currentQuestionData.id, option.id)}
                className="p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-primary/10 hover:border-primary/50 transition-all text-left"
              >
                <span className="text-2xl">{option.icon}</span>
                <p className="mt-2 font-semibold text-foreground text-sm">{option.title}</p>
              </button>
            ))}
          </div>
          {state.currentQuestion > 0 && (
            <button onClick={goBack} className="mt-4 text-sm text-muted-foreground hover:text-primary">
              ← Back
            </button>
          )}
        </div>
      )}
      
      {state.step === 'results' && state.results && (
        <div className="p-6 text-center text-muted-foreground">
          {/* Results screen placeholder - Part 2 */}
          <p className="font-bold text-foreground mb-4">Your Top Matches</p>
          {state.results.slice(0, 3).map((match, i) => (
            <div key={match.toolId} className="mb-2 p-3 rounded-lg bg-background/50 border border-border/30">
              <span className="font-semibold text-foreground">#{i + 1} {match.toolId}</span>
              <span className="ml-2 text-primary font-bold">{match.matchPercentage}%</span>
            </div>
          ))}
          <button 
            onClick={restartQuiz}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Retake Quiz
          </button>
        </div>
      )}
    </section>
  );
};

export default ToolFinderQuiz;
