import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'filascope_onboarding_tour_seen';

export type TourPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  position: TourPosition;
}

export const ONBOARDING_TOUR_STEPS: TourStep[] = [
  {
    id: 'printer-filter',
    target: "[data-tour='printer-filter']",
    title: "Set Your Printer",
    description: "Configure your printer and nozzle for personalized material recommendations and compatibility warnings.",
    position: "right",
  },
  {
    id: 'compare-tray',
    target: "[data-tour='compare-tray']",
    title: "Compare Materials",
    description: "Add filaments here to compare specs side-by-side. Click the compare icon on any material card.",
    position: "top",
  },
  {
    id: 'quick-match',
    target: "[data-tour='quick-match']",
    title: "Quick Match Wizard",
    description: "Answer 3 quick questions to get personalized filament recommendations based on your project needs.",
    position: "bottom",
  },
];

export function useOnboardingTour() {
  const [hasSeenTour, setHasSeenTour] = useState(true); // Default true to prevent flash
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setHasSeenTour(false);
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissTour = useCallback((dontShowAgain: boolean = true) => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setHasSeenTour(true);
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < ONBOARDING_TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      dismissTour(true);
    }
  }, [currentStep, dismissTour]);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipTour = useCallback(() => {
    dismissTour(true);
  }, [dismissTour]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSeenTour(false);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  return {
    hasSeenTour,
    currentStep,
    isActive,
    currentTourStep: ONBOARDING_TOUR_STEPS[currentStep],
    totalSteps: ONBOARDING_TOUR_STEPS.length,
    dismissTour,
    nextStep,
    previousStep,
    skipTour,
    resetTour,
  };
}
