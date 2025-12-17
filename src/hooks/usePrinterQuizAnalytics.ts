import { useCallback, useRef } from 'react';
import { useModuleAnalytics } from './useModuleAnalytics';

const MODULE_NAME = 'printer_quiz';

export function usePrinterQuizAnalytics() {
  const { trackView, trackClick, trackCTAClick, trackConversion } = useModuleAnalytics();
  const quizStartTime = useRef<number>(0);
  const questionStartTime = useRef<number>(0);

  const trackQuizOpened = useCallback(() => {
    quizStartTime.current = Date.now();
    trackView(MODULE_NAME, undefined, 'quiz_modal');
  }, [trackView]);

  const trackQuizStarted = useCallback(() => {
    questionStartTime.current = Date.now();
    trackClick(MODULE_NAME, undefined, 'quiz_start', { action: 'first_question_answered' });
  }, [trackClick]);

  const trackQuestionAnswered = useCallback((
    questionId: string, 
    answerId: string, 
    questionNumber: number
  ) => {
    const timeSpent = Date.now() - questionStartTime.current;
    questionStartTime.current = Date.now();
    
    trackClick(MODULE_NAME, questionId, 'question_answer', {
      answerId,
      questionNumber,
      timeSpentMs: timeSpent
    });
  }, [trackClick]);

  const trackQuizAbandoned = useCallback((
    lastQuestionIndex: number,
    totalQuestions: number,
    answersCount: number
  ) => {
    const completionPercent = Math.round((lastQuestionIndex / totalQuestions) * 100);
    const totalTime = Date.now() - quizStartTime.current;
    
    trackClick(MODULE_NAME, undefined, 'quiz_abandoned', {
      lastQuestion: lastQuestionIndex + 1,
      totalAnswered: answersCount,
      completionPercent,
      totalTimeMs: totalTime
    });
  }, [trackClick]);

  const trackQuizCompleted = useCallback((
    topPrinterId: string,
    topPrinterName: string,
    topScore: number,
    totalMatches: number
  ) => {
    const totalTime = Date.now() - quizStartTime.current;
    
    trackConversion(MODULE_NAME, 'quiz_completed', undefined, topPrinterId);
    trackClick(MODULE_NAME, topPrinterId, 'quiz_complete', {
      topPrinterName,
      topScore,
      totalMatches,
      totalTimeMs: totalTime
    });
  }, [trackConversion, trackClick]);

  const trackRecommendationClicked = useCallback((
    printerId: string,
    printerName: string,
    rank: number,
    action: 'view_details' | 'add_to_compare'
  ) => {
    trackCTAClick(MODULE_NAME, action, printerId, {
      printerName,
      rank: rank + 1,
      action
    });
  }, [trackCTAClick]);

  const trackCompareAllClicked = useCallback((printerIds: string[]) => {
    trackCTAClick(MODULE_NAME, 'compare_all', undefined, {
      printerIds,
      count: printerIds.length
    });
  }, [trackCTAClick]);

  const trackQuizRetaken = useCallback(() => {
    quizStartTime.current = Date.now();
    trackClick(MODULE_NAME, undefined, 'quiz_retake', { action: 'retake' });
  }, [trackClick]);

  return {
    trackQuizOpened,
    trackQuizStarted,
    trackQuestionAnswered,
    trackQuizAbandoned,
    trackQuizCompleted,
    trackRecommendationClicked,
    trackCompareAllClicked,
    trackQuizRetaken
  };
}
