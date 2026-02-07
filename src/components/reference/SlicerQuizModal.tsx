import { useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, RotateCcw, Trophy, ExternalLink, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { slicerTierData, type SlicerTierInfo } from "@/lib/slicerTierData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuizOption {
  label: string;
  description: string;
  value: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

interface SlicerResult {
  slicer: SlicerTierInfo;
  matchPercent: number;
  matchReasons: string[];
}

type Answers = Record<string, string>;

// ---------------------------------------------------------------------------
// Quiz Data
// ---------------------------------------------------------------------------

const QUESTIONS: QuizQuestion[] = [
  {
    id: "experience",
    question: "What's your experience level?",
    options: [
      { label: "Beginner", description: "Just starting out", value: "beginner" },
      { label: "Intermediate", description: "Printed a few projects", value: "intermediate" },
      { label: "Advanced", description: "Experienced maker", value: "advanced" },
      { label: "Professional", description: "Commercial / production use", value: "professional" },
    ],
  },
  {
    id: "printer",
    question: "What type of printer do you use?",
    options: [
      { label: "FDM / FFF", description: "Filament-based", value: "fdm" },
      { label: "SLA / Resin", description: "Resin-based", value: "resin" },
      { label: "Both", description: "FDM and Resin", value: "both" },
      { label: "Not sure yet", description: "Haven't decided", value: "unsure" },
    ],
  },
  {
    id: "priority",
    question: "What matters most to you?",
    options: [
      { label: "Ease of use & setup", description: "Quick start, guided workflow", value: "ease" },
      { label: "Advanced features & control", description: "Fine-grained settings", value: "advanced" },
      { label: "Multi-material / color printing", description: "AMS / MMU support", value: "multi" },
      { label: "Community & support", description: "Docs, forums, plugins", value: "community" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget for software?",
    options: [
      { label: "Free only", description: "No paid software", value: "free" },
      { label: "Open to paid / freemium", description: "Will pay for value", value: "open" },
      { label: "No budget limit", description: "Best tool wins", value: "any" },
    ],
  },
  {
    id: "os",
    question: "What operating system do you use?",
    options: [
      { label: "Windows", description: "", value: "windows" },
      { label: "Mac", description: "", value: "mac" },
      { label: "Linux", description: "", value: "linux" },
      { label: "Multiple / Cross-platform", description: "", value: "cross" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreSlicer(slicer: SlicerTierInfo, answers: Answers): SlicerResult {
  let score = 0;
  let max = 0;
  const reasons: string[] = [];

  const features = slicer.topFeatures.map((f) => f.toLowerCase());
  const name = slicer.name.toLowerCase();

  // Experience (weight 25)
  max += 25;
  const exp = answers.experience;
  if (exp === "beginner") {
    if (features.some((f) => f.includes("beginner") || f.includes("simple"))) {
      score += 25;
      reasons.push("Beginner-friendly interface");
    } else if (slicer.overallScore >= 8.5) {
      score += 15;
    } else {
      score += 8;
    }
  } else if (exp === "intermediate") {
    if (features.some((f) => f.includes("customizable") || f.includes("calibration") || f.includes("feature"))) {
      score += 25;
      reasons.push("Great balance of simplicity and power");
    } else {
      score += 15;
    }
  } else if (exp === "advanced") {
    if (features.some((f) => f.includes("advanced") || f.includes("calibration") || f.includes("feature-rich"))) {
      score += 25;
      reasons.push("Advanced calibration & features");
    } else {
      score += 10;
    }
  } else if (exp === "professional") {
    if (features.some((f) => f.includes("professional") || f.includes("enterprise") || f.includes("fleet"))) {
      score += 25;
      reasons.push("Professional-grade capabilities");
    } else if (slicer.overallScore >= 8.0) {
      score += 18;
    } else {
      score += 8;
    }
  }

  // Printer type (weight 20)
  max += 20;
  const printer = answers.printer;
  if (printer === "resin") {
    if (features.some((f) => f.includes("resin"))) {
      score += 20;
      reasons.push("Optimized for resin printing");
    } else {
      score += 2;
    }
  } else if (printer === "fdm") {
    if (!features.some((f) => f.includes("resin"))) {
      score += 18;
      if (!reasons.some((r) => r.includes("FDM"))) reasons.push("Full FDM support");
    } else {
      score += 8;
    }
  } else if (printer === "both") {
    if (features.some((f) => f.includes("resin")) || name.includes("lychee")) {
      score += 15;
    } else {
      score += 12;
    }
  } else {
    // unsure — favor popular, well-documented slicers
    if (slicer.overallScore >= 8.5) {
      score += 18;
      reasons.push("Great for any printer type");
    } else {
      score += 10;
    }
  }

  // Priority (weight 25)
  max += 25;
  const priority = answers.priority;
  if (priority === "ease") {
    if (features.some((f) => f.includes("beginner") || f.includes("simple") || f.includes("intuitive"))) {
      score += 25;
      reasons.push("Easy to learn and use");
    } else if (slicer.overallScore >= 9.0) {
      score += 18;
    } else {
      score += 10;
    }
  } else if (priority === "advanced") {
    if (features.some((f) => f.includes("advanced") || f.includes("customizable") || f.includes("feature-rich") || f.includes("calibration"))) {
      score += 25;
      reasons.push("Deep customization options");
    } else {
      score += 10;
    }
  } else if (priority === "multi") {
    if (slicer.multiMaterial) {
      score += 25;
      reasons.push("Multi-material/color support");
    } else {
      score += 5;
    }
  } else if (priority === "community") {
    if (features.some((f) => f.includes("open source") || f.includes("community") || f.includes("documentation"))) {
      score += 25;
      reasons.push("Strong community & documentation");
    } else if (features.some((f) => f.includes("plugin"))) {
      score += 20;
      reasons.push("Active plugin ecosystem");
    } else {
      score += 10;
    }
  }

  // Budget (weight 15)
  max += 15;
  const budget = answers.budget;
  if (budget === "free") {
    if (slicer.priceType === "free") {
      score += 15;
      reasons.push("Completely free");
    } else if (slicer.priceType === "freemium") {
      score += 8;
    } else {
      score += 0;
    }
  } else if (budget === "open") {
    score += 12; // accept anything
    if (slicer.priceType === "freemium") reasons.push("Free tier with premium upgrades");
  } else {
    score += 15; // any budget
  }

  // OS (weight 15)
  max += 15;
  const os = answers.os;
  const platforms = slicer.platforms.map((p) => p.toLowerCase());
  if (os === "cross") {
    if (platforms.length >= 3 || platforms.includes("web")) {
      score += 15;
      reasons.push("Works on all platforms");
    } else {
      score += 8;
    }
  } else if (os === "linux") {
    if (platforms.includes("linux")) {
      score += 15;
      reasons.push("Linux supported");
    } else if (platforms.includes("web")) {
      score += 10;
    } else {
      score += 0;
    }
  } else if (os === "mac") {
    if (platforms.includes("mac")) {
      score += 15;
    } else {
      score += 0;
    }
  } else {
    if (platforms.includes("windows")) {
      score += 15;
    } else {
      score += 0;
    }
  }

  // Bonus for high overall score (tiebreaker)
  score += (slicer.overallScore / 10) * 5;
  max += 5;

  const matchPercent = Math.round((score / max) * 100);

  // Ensure at least one reason
  if (reasons.length === 0) {
    reasons.push(slicer.editorialQuote);
  }

  return { slicer, matchPercent, matchReasons: reasons.slice(0, 3) };
}

function getTopResults(answers: Answers): SlicerResult[] {
  const results = Object.values(slicerTierData)
    .map((s) => scoreSlicer(s, answers))
    .sort((a, b) => b.matchPercent - a.matchPercent);

  return results.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Slicer slug helper
// ---------------------------------------------------------------------------
function toSlicerSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function QuestionStep({
  question,
  selected,
  onSelect,
}: {
  question: QuizQuestion;
  selected: string | undefined;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-xl font-bold text-foreground text-center">
        {question.question}
      </h3>
      <div className="grid gap-3">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={cn(
              "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
              "hover:border-primary/60 hover:bg-primary/5",
              selected === opt.value
                ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                : "border-border/50 bg-card/50"
            )}
          >
            <span className="font-semibold text-foreground">{opt.label}</span>
            {opt.description && (
              <span className="text-sm text-muted-foreground ml-2">
                — {opt.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultCard({
  result,
  rank,
}: {
  result: SlicerResult;
  rank: number;
}) {
  const { slicer, matchPercent, matchReasons } = result;
  const slug = toSlicerSlug(slicer.name);

  const rankColors: Record<number, string> = {
    1: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/40",
    2: "from-slate-400/15 to-slate-500/5 border-slate-400/30",
    3: "from-amber-700/15 to-amber-800/5 border-amber-700/30",
  };

  const matchColor =
    matchPercent >= 85
      ? "text-green-400"
      : matchPercent >= 70
        ? "text-primary"
        : "text-amber-400";

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 p-5 bg-gradient-to-br transition-all",
        rankColors[rank] || "border-border/50"
      )}
    >
      {/* Rank badge */}
      <div className="absolute -top-3 -left-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full",
            rank === 1
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
              : "bg-muted text-muted-foreground border border-border/50"
          )}
        >
          {rank === 1 && <Trophy className="w-3 h-3" />}
          #{rank}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3 mb-3 mt-1">
        <div>
          <h4 className="text-lg font-bold text-foreground">{slicer.name}</h4>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {slicer.brand}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={cn("text-2xl font-bold tabular-nums", matchColor)}>
            {matchPercent}%
          </span>
          <div className="text-[10px] text-muted-foreground uppercase">Match</div>
        </div>
      </div>

      {/* Score + Price */}
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          {slicer.overallScore.toFixed(1)}
        </span>
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            slicer.priceType === "free"
              ? "bg-green-500/15 text-green-400"
              : slicer.priceType === "freemium"
                ? "bg-blue-500/15 text-blue-400"
                : "bg-amber-500/15 text-amber-400"
          )}
        >
          {slicer.priceType === "free"
            ? "Free"
            : slicer.priceValue || "Paid"}
        </span>
        <span className="text-xs text-muted-foreground">
          {slicer.platforms.join(" · ")}
        </span>
      </div>

      {/* Match reasons */}
      <ul className="space-y-1 mb-4">
        {matchReasons.map((reason, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <span className="text-primary mt-0.5">✓</span>
            {reason}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button variant="outline" size="sm" asChild className="w-full gap-2">
        <a href={`/reference/slicers#${slug}`}>
          Learn More
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

interface SlicerQuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SlicerQuizModal({ open, onOpenChange }: SlicerQuizModalProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState(false);

  const totalSteps = QUESTIONS.length;
  const currentQuestion = QUESTIONS[step];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const handleSelect = useCallback(
    (value: string) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    },
    [currentQuestion],
  );

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      setShowResults(true);
    }
  }, [step, totalSteps]);

  const handleBack = useCallback(() => {
    if (showResults) {
      setShowResults(false);
    } else if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step, showResults]);

  const handleReset = useCallback(() => {
    setStep(0);
    setAnswers({});
    setShowResults(false);
  }, []);

  const results = showResults ? getTopResults(answers) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background border-border">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <h2 className="text-lg font-bold text-foreground">
            {showResults ? "Your Slicer Matches" : "Find Your Perfect Slicer"}
          </h2>
          {!showResults && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Question {step + 1} of {totalSteps}
                </span>
                <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
              </div>
              <Progress
                value={((step + 1) / totalSteps) * 100}
                className="h-1.5"
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 min-h-[280px]">
          {showResults ? (
            <div className="space-y-5 animate-fade-in">
              <p className="text-sm text-muted-foreground text-center">
                Based on your answers, here are our top recommendations:
              </p>
              {results.map((r, i) => (
                <ResultCard key={r.slicer.name} result={r} rank={i + 1} />
              ))}
            </div>
          ) : (
            <QuestionStep
              key={currentQuestion.id}
              question={currentQuestion}
              selected={currentAnswer}
              onSelect={handleSelect}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-border/30">
          {showResults ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Retake Quiz
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={step === 0}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                disabled={!currentAnswer}
                className="gap-1"
              >
                {step === totalSteps - 1 ? "See Results" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
