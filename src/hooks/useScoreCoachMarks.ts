import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'filascope_score_coach_marks_seen';

export function useScoreCoachMarks() {
  const [hasSeenCoachMarks, setHasSeenCoachMarks] = useState(true); // Default to true to prevent flash
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setHasSeenCoachMarks(false);
      setIsActive(true);
    }
  }, []);

  const dismissCoachMarks = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setHasSeenCoachMarks(true);
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const resetCoachMarks = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSeenCoachMarks(false);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  return {
    hasSeenCoachMarks,
    currentStep,
    isActive,
    dismissCoachMarks,
    nextStep,
    previousStep,
    resetCoachMarks,
    totalSteps: 4,
  };
}
