import React, { createContext, useContext, useState, useCallback } from 'react';
import { Question, repoQuizQuestions, RepoQuizAnswers } from '@/lib/repoQuizData';
import { PlatformScore, QuizAnswer, calculateRepoQuizScores } from '@/lib/repoQuizScoring';

type QuizStep = 'intro' | 'questions' | 'results';

interface QuizState {
  currentStep: QuizStep;
  currentQuestionIndex: number;
  answers: RepoQuizAnswers;
  results: PlatformScore[] | null;
  startTime: number | null;
  completionTime: number | null;
}

interface RepoQuizContextType {
  state: QuizState;
  questions: Question[];
  startQuiz: () => void;
  answerQuestion: (questionId: string, optionIds: string[]) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  submitQuiz: () => void;
  resetQuiz: () => void;
  currentQuestion: Question | null;
  progress: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastQuestion: boolean;
}

const RepoQuizContext = createContext<RepoQuizContextType | undefined>(undefined);

const initialState: QuizState = {
  currentStep: 'intro',
  currentQuestionIndex: 0,
  answers: {},
  results: null,
  startTime: null,
  completionTime: null
};

export const RepoQuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<QuizState>(initialState);

  const startQuiz = useCallback(() => {
    setState({
      currentStep: 'questions',
      currentQuestionIndex: 0,
      answers: {},
      results: null,
      startTime: Date.now(),
      completionTime: null
    });
  }, []);

  const answerQuestion = useCallback((questionId: string, optionIds: string[]) => {
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: optionIds
      }
    }));
  }, []);

  const goToNextQuestion = useCallback(() => {
    setState(prev => {
      if (prev.currentQuestionIndex < repoQuizQuestions.length - 1) {
        return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 };
      }
      return prev;
    });
  }, []);

  const goToPreviousQuestion = useCallback(() => {
    setState(prev => {
      if (prev.currentQuestionIndex > 0) {
        return { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 };
      }
      return prev;
    });
  }, []);

  const submitQuiz = useCallback(() => {
    const answers: QuizAnswer[] = Object.entries(state.answers).map(([questionId, options]) => ({
      questionId,
      selectedOptions: options
    }));

    const results = calculateRepoQuizScores(answers);

    setState(prev => ({
      ...prev,
      currentStep: 'results',
      results,
      completionTime: prev.startTime ? Date.now() - prev.startTime : null
    }));
  }, [state.answers]);

  const resetQuiz = useCallback(() => {
    setState(initialState);
  }, []);

  const currentQuestion = state.currentStep === 'questions'
    ? repoQuizQuestions[state.currentQuestionIndex]
    : null;

  const progress = ((state.currentQuestionIndex + 1) / repoQuizQuestions.length) * 100;

  const canGoNext = currentQuestion
    ? !!state.answers[currentQuestion.id]?.length
    : false;

  const canGoPrevious = state.currentQuestionIndex > 0;

  const isLastQuestion = state.currentQuestionIndex === repoQuizQuestions.length - 1;

  const value: RepoQuizContextType = {
    state,
    questions: repoQuizQuestions,
    startQuiz,
    answerQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    submitQuiz,
    resetQuiz,
    currentQuestion,
    progress,
    canGoNext,
    canGoPrevious,
    isLastQuestion
  };

  return (
    <RepoQuizContext.Provider value={value}>
      {children}
    </RepoQuizContext.Provider>
  );
};

export const useRepoQuiz = () => {
  const context = useContext(RepoQuizContext);
  if (!context) {
    throw new Error('useRepoQuiz must be used within RepoQuizProvider');
  }
  return context;
};
