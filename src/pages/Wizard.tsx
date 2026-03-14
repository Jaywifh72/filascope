import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs } from "@/components/seo";
import { HowToSchema } from "@/components/seo/HowToSchema";
import { SoftwareApplicationSchema } from "@/components/seo/SoftwareApplicationSchema";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRegion } from "@/contexts/RegionContext";
import { WizardResults } from "@/components/wizard/WizardResults";
import { trackQuickMatchStart } from "@/lib/analytics";

interface Question {
  id: string;
  question: string;
  subtitle?: string;
  type: 'single' | 'multi';
  options: { value: string; label: string; description: string; icon?: string }[];
}

const questions: Question[] = [
  {
    id: "use_case",
    question: "What are you printing?",
    subtitle: "This helps us understand your material requirements",
    type: 'single',
    options: [
      { value: "functional", label: "Functional Parts", description: "Gears, brackets, tools, mechanical components", icon: "⚙️" },
      { value: "art_display", label: "Art & Display", description: "Figurines, sculptures, decorative pieces", icon: "🎨" },
      { value: "prototypes", label: "Prototypes", description: "Design iterations, concept models, testing", icon: "📐" },
      { value: "household", label: "Household Items", description: "Organizers, hooks, containers, everyday objects", icon: "🏠" },
      { value: "outdoor", label: "Outdoor Use", description: "Garden items, weather-resistant parts", icon: "☀️" },
    ],
  },
  {
    id: "printer",
    question: "What printer do you have?",
    subtitle: "We'll recommend materials compatible with your setup",
    type: 'single',
    options: [
      { value: "bambu", label: "Bambu Lab", description: "X1, P1, A1 series printers", icon: "🟢" },
      { value: "prusa", label: "Prusa", description: "MK3, MK4, Mini, XL series", icon: "🟠" },
      { value: "creality", label: "Creality", description: "Ender, CR, K1 series", icon: "🔵" },
      { value: "anycubic", label: "Anycubic", description: "Kobra, Photon, Vyper series", icon: "🟣" },
      { value: "other", label: "Other / Not Sure", description: "Don't worry, we'll recommend versatile options", icon: "❓" },
    ],
  },
  {
    id: "priority",
    question: "What matters most to you?",
    subtitle: "Choose your top priority for this project",
    type: 'single',
    options: [
      { value: "strength", label: "Strength & Durability", description: "Load-bearing, impact-resistant parts", icon: "💪" },
      { value: "appearance", label: "Visual Appearance", description: "Surface finish, color accuracy, aesthetics", icon: "✨" },
      { value: "easy", label: "Easy to Print", description: "Reliable, forgiving, minimal issues", icon: "👍" },
      { value: "price", label: "Best Value", description: "Quality results without breaking the bank", icon: "💰" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget range?",
    subtitle: "Per spool pricing (1kg standard)",
    type: 'single',
    options: [
      { value: "budget", label: "Under $20", description: "Budget-friendly options", icon: "💵" },
      { value: "mid", label: "$20 - $35", description: "Mid-range quality brands", icon: "💵💵" },
      { value: "premium", label: "$35+", description: "Premium materials", icon: "💵💵💵" },
      { value: "any", label: "No Limit", description: "Show me the best options regardless of price", icon: "🎯" },
    ],
  },
  {
    id: "special",
    question: "Any special requirements?",
    subtitle: "Select all that apply (optional)",
    type: 'multi',
    options: [
      { value: "food_safe", label: "Food Safe", description: "FDA compliant for food contact", icon: "🍽️" },
      { value: "uv_resistant", label: "UV Resistant", description: "Won't degrade in sunlight", icon: "🌞" },
      { value: "flexible", label: "Flexible", description: "Bendable, rubber-like properties", icon: "🔄" },
      { value: "high_temp", label: "Heat Resistant", description: "Won't warp at high temperatures", icon: "🔥" },
      { value: "none", label: "No Special Needs", description: "Standard materials are fine", icon: "✓" },
    ],
  },
];

const STEP_LABELS = ["Use Case", "Printer", "Priority", "Budget", "Special"];

// Recommendation interface and scoring logic moved to useWizardRecommendations hook

const Wizard = () => {
  const navigate = useNavigate();
  const { convertPrice, formatPrice, hasRates, currencyConfig } = useRegion();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  // Fire quick_match_start once on mount
  useEffect(() => { trackQuickMatchStart(); }, []);
  const [showResults, setShowResults] = useState(false);
  const [bounceNext, setBounceNext] = useState(false);
  const wizardCardRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  // Scroll wizard card into view and focus the step heading for a11y
  const scrollToWizardTop = useCallback(() => {
    requestAnimationFrame(() => {
      if (wizardCardRef.current) {
        const navOffset = 80;
        const top = wizardCardRef.current.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      // Focus step heading for screen readers
      stepHeadingRef.current?.focus();
    });
  }, []);

  // Regionalize budget thresholds (base values in USD)
  const budgetThresholds = useMemo(() => {
    const low = 20;
    const high = 35;

    if (!hasRates || currencyConfig.code === 'USD') {
      const sym = currencyConfig.code === 'USD' ? '$' : `~$`;
      const suffix = currencyConfig.code === 'USD' ? '' : ' USD';
      return {
        under: `Under ${sym}${low}${suffix}`,
        mid: `${sym}${low}${suffix} - ${sym}${high}${suffix}`,
        premium: `${sym}${high}+${suffix}`,
      };
    }

    const convertedLow = Math.round(convertPrice(low, 'USD'));
    const convertedHigh = Math.round(convertPrice(high, 'USD'));
    const formatted = (n: number) => formatPrice(n);

    return {
      under: `Under ${formatted(convertedLow)}`,
      mid: `${formatted(convertedLow)} - ${formatted(convertedHigh)}`,
      premium: `${formatted(convertedHigh)}+`,
    };
  }, [convertPrice, formatPrice, hasRates, currencyConfig]);

  // Build questions with regionalized budget step
  const localizedQuestions = useMemo(() => {
    return questions.map(q => {
      if (q.id !== 'budget') return q;
      return {
        ...q,
        options: [
          { value: "budget", label: budgetThresholds.under, description: "Budget-friendly options", icon: "💵" },
          { value: "mid", label: budgetThresholds.mid, description: "Mid-range quality brands", icon: "💵💵" },
          { value: "premium", label: budgetThresholds.premium, description: "Premium materials", icon: "💵💵💵" },
          { value: "any", label: "No Limit", description: "Show me the best options regardless of price", icon: "🎯" },
        ],
      };
    });
  }, [budgetThresholds]);

  const currentQuestion = localizedQuestions[currentStep];
  const isLastQuestion = currentStep === localizedQuestions.length - 1;

  const handleSingleAnswer = (value: string) => {
    const prev = answers[currentQuestion.id];
    setAnswers({ ...answers, [currentQuestion.id]: value });
    // Trigger bounce if this is a new selection
    if (prev !== value) {
      setBounceNext(true);
      setTimeout(() => setBounceNext(false), 500);
    }
  };

  const handleMultiAnswer = (value: string, checked: boolean) => {
    const currentValues = (answers[currentQuestion.id] as string[]) || [];
    if (checked) {
      // If selecting "none", clear others; if selecting others, remove "none"
      if (value === 'none') {
        setAnswers({ ...answers, [currentQuestion.id]: ['none'] });
      } else {
        setAnswers({ ...answers, [currentQuestion.id]: [...currentValues.filter(v => v !== 'none'), value] });
      }
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: currentValues.filter(v => v !== value) });
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true);
    } else {
      setCurrentStep(currentStep + 1);
    }
    scrollToWizardTop();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollToWizardTop();
    }
  };

  const canProceed = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === 'multi') {
      // Multi-select: allow proceeding even with no selection (optional step)
      return true;
    }
    return answer && answer.length > 0;
  };

  const handleRefine = () => {
    setShowResults(false);
    setCurrentStep(0);
  };

  if (showResults) {
    return <WizardResults answers={answers} onRefine={handleRefine} />;
  }

  return (
    <>
      <DocumentHead
        title="Quick Match — Find Your Perfect Filament in 60 Seconds | FilaScope"
        description="Find your perfect 3D printing filament in 60 seconds. Answer 5 questions about your project, printer, and budget for personalized recommendations."
        ogTitle="Quick Match — Find Your Perfect Filament in 60 Seconds | FilaScope"
        ogDescription="Find your perfect 3D printing filament in 60 seconds. Answer 5 questions about your project, printer, and budget for personalized recommendations."
      />
      <Breadcrumbs
        items={[{ name: "Quick Match Wizard", url: "/wizard" }]}
        className="max-w-2xl mx-auto px-3 sm:px-6 pt-4 pb-1"
      />
      <HowToSchema
        name="How to Find Your Perfect 3D Printer Filament in 60 Seconds"
        description="Use FilaScope's Quick Match wizard to get personalized filament recommendations based on your printer, project type, material preferences, and budget."
        totalTime="PT1M"
        steps={[
          { name: "Select Your Printer", text: "Choose your 3D printer model from our database of 118+ printers to ensure material compatibility." },
          { name: "Choose Your Project Type", text: "Tell us what you're printing — functional parts, cosplay, decorative items, or prototypes." },
          { name: "Set Material Preferences", text: "Select preferred material properties like strength, flexibility, heat resistance, or ease of printing." },
          { name: "Set Your Budget", text: "Define your price range to filter recommendations to filaments you can afford." },
          { name: "Get Personalized Recommendations", text: "Review your matched filaments ranked by compatibility score, with direct links to compare specs and buy." },
        ]}
        tool={["FilaScope Quick Match Wizard"]}
      />
      <SoftwareApplicationSchema
        name="FilaScope Quick Match — Filament Recommendation Quiz"
        description="Answer 5 questions about your 3D printing project, printer, and budget to get personalized filament recommendations from FilaScope's database of 8,200+ filaments."
        url="https://filascope.com/wizard"
        applicationCategory="UtilityApplication"
        operatingSystem="Web"
        offers={{ price: "0", priceCurrency: "USD" }}
        creator={{ name: "FilaScope", url: "https://filascope.com" }}
      />
      {/* FAQ JSON-LD for SEO only — no visible FAQ wall above the wizard */}
      <FAQSchema faqs={[
        { question: "How does FilaScope's filament quiz work?", answer: "FilaScope's Quick Match asks 5 questions about your project type, printer model, material preference, budget, and priorities. It then recommends the best-matching filaments from our database of 8,200+ options with real pricing." },
        { question: "Is FilaScope's filament recommendation tool free?", answer: "Yes, FilaScope's Quick Match filament finder is completely free. No account required." },
      ]} />
      <div className="min-h-screen py-4 sm:py-8 md:py-12 px-3 sm:px-6 lg:px-8 flex flex-col" style={{ background: 'radial-gradient(ellipse at center, rgba(0,229,204,0.03) 0%, transparent 70%)' }}>
      <div className="max-w-2xl mx-auto w-full flex flex-col">
        {/* SEO H1 — visually hidden but readable by crawlers and screen readers */}
        <h1 className="sr-only">Quick Match — Find Your Perfect 3D Printer Filament</h1>
        <Card ref={wizardCardRef} className="p-4 sm:p-6 md:p-8 min-h-0 flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-xl md:text-2xl font-bold">Material Wizard</h2>
              </div>
              <div className="relative h-6 w-8 overflow-hidden">
                <span
                  key={currentStep}
                  className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground font-mono animate-[scale-in_200ms_ease-out]"
                >
                  {currentStep + 1} / {questions.length}
                </span>
              </div>
            </div>
            {/* Segmented progress */}
            <div className="flex gap-1">
              {STEP_LABELS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 w-[40px] sm:flex-1",
                    i < currentStep
                      ? "bg-amber-500"
                      : i === currentStep
                        ? "bg-amber-500/50 animate-pulse"
                        : "bg-muted"
                  )}
                />
              ))}
            </div>
            {/* Step labels — desktop only */}
            <div className="hidden sm:flex gap-1 mt-1.5">
              {STEP_LABELS.map((label, i) => (
                <span
                  key={label}
                  className={cn(
                    "flex-1 text-xs text-center",
                    i <= currentStep ? "text-muted-foreground" : "text-muted-foreground/40"
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h3 ref={stepHeadingRef} tabIndex={-1} className="text-lg md:text-xl font-semibold mb-2 outline-none">{currentQuestion.question}</h3>
            {currentQuestion.subtitle && (
              <p className="text-sm text-muted-foreground mb-6">{currentQuestion.subtitle}</p>
            )}
            
            {currentQuestion.type === 'single' ? (
              <RadioGroup
                value={answers[currentQuestion.id] as string || ''}
                onValueChange={handleSingleAnswer}
                className="space-y-2 sm:space-y-3"
              >
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestion.id] === option.value;
                  return (
                    <div key={option.value}>
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only peer" />
                      <Label
                        htmlFor={option.value}
                        className={cn(
                          "group flex items-start gap-3 sm:gap-4 cursor-pointer p-3 sm:p-4 rounded-xl border-2 transition-all duration-150 min-h-[56px] touch-manipulation",
                          isSelected
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-border hover:border-amber-500/50 hover:bg-muted/60"
                        )}
                      >
                        {option.icon && (
                          <span className="text-xl sm:text-2xl flex-shrink-0 transition-transform duration-150 group-hover:scale-110">{option.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base">{option.label}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">{option.description}</div>
                        </div>
                        <div className={cn(
                          "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          isSelected
                            ? "border-amber-500 bg-amber-500"
                            : "border-muted-foreground/30"
                        )}>
                          {isSelected && (
                            <Check className="h-3 w-3 text-background" />
                          )}
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {currentQuestion.options.map((option) => {
                  const currentValues = (answers[currentQuestion.id] as string[]) || [];
                  const isChecked = currentValues.includes(option.value);
                  
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "group flex items-start gap-3 sm:gap-4 cursor-pointer p-3 sm:p-4 rounded-xl border-2 transition-all duration-150 min-h-[56px] touch-manipulation",
                        isChecked
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-border hover:border-amber-500/50 hover:bg-muted/60"
                      )}
                      onClick={() => handleMultiAnswer(option.value, !isChecked)}
                    >
                      {option.icon && (
                        <span className="text-xl sm:text-2xl flex-shrink-0 transition-transform duration-150 group-hover:scale-110">{option.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base">{option.label}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{option.description}</div>
                      </div>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => handleMultiAnswer(option.value, checked as boolean)}
                        className="flex-shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation - Sticky on mobile */}
          <div className="flex gap-3 sm:gap-4 mt-auto pt-6 sticky bottom-0 bg-card pb-safe">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex-1 h-12 sm:h-11 min-h-[48px] touch-manipulation"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className={cn(
                "flex-1 h-12 sm:h-11 min-h-[48px] touch-manipulation bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                bounceNext && "animate-bounce"
              )}
            >
              {isLastQuestion ? (
                <>
                  See Results
                  <Sparkles className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
    </>
  );
};

export default Wizard;
