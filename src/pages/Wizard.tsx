import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Sparkles, Check, ExternalLink, RefreshCw, Filter, Trophy, Lightbulb } from "lucide-react";

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

interface Recommendation {
  material: string;
  matchPercent: number;
  description: string;
  whyRecommended: string[];
  priceRange: string;
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  brands: { name: string; url: string }[];
}

const Wizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;

  const handleSingleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
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
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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

  const getRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    const useCase = answers.use_case as string;
    const priority = answers.priority as string;
    const budget = answers.budget as string;
    const special = (answers.special as string[]) || [];
    const printer = answers.printer as string;

    // Base scoring for materials
    const materials: Record<string, { 
      score: number; 
      reasons: string[];
      desc: string;
      price: string;
      difficulty: 'Easy' | 'Moderate' | 'Advanced';
      brands: { name: string; url: string }[];
    }> = {
      'PLA': { 
        score: 50, 
        reasons: [],
        desc: "The most popular and beginner-friendly filament. Great print quality with minimal hassle.",
        price: "$15-25",
        difficulty: 'Easy',
        brands: [
          { name: "Bambu Lab PLA Basic", url: "/finder?material=PLA&brand=Bambu%20Lab" },
          { name: "Polymaker PolyLite PLA", url: "/finder?material=PLA&brand=Polymaker" },
          { name: "eSUN PLA+", url: "/finder?material=PLA&brand=eSUN" },
        ]
      },
      'PETG': { 
        score: 40, 
        reasons: [],
        desc: "Strong, durable, and food-safe. A great step up from PLA for functional parts.",
        price: "$18-30",
        difficulty: 'Easy',
        brands: [
          { name: "Overture PETG", url: "/finder?material=PETG&brand=Overture" },
          { name: "Polymaker PolyLite PETG", url: "/finder?material=PETG&brand=Polymaker" },
          { name: "Prusament PETG", url: "/finder?material=PETG&brand=Prusament" },
        ]
      },
      'TPU': { 
        score: 20, 
        reasons: [],
        desc: "Flexible, rubber-like material perfect for phone cases, gaskets, and wearables.",
        price: "$25-40",
        difficulty: 'Moderate',
        brands: [
          { name: "Overture TPU", url: "/finder?material=TPU&brand=Overture" },
          { name: "NinjaTek NinjaFlex", url: "/finder?material=TPU&brand=NinjaTek" },
          { name: "eSUN TPU 95A", url: "/finder?material=TPU&brand=eSUN" },
        ]
      },
      'ABS': { 
        score: 30, 
        reasons: [],
        desc: "Classic engineering plastic with excellent heat resistance and durability.",
        price: "$18-30",
        difficulty: 'Advanced',
        brands: [
          { name: "Polymaker ABS", url: "/finder?material=ABS&brand=Polymaker" },
          { name: "Bambu Lab ABS", url: "/finder?material=ABS&brand=Bambu%20Lab" },
          { name: "eSUN ABS+", url: "/finder?material=ABS&brand=eSUN" },
        ]
      },
      'ASA': { 
        score: 25, 
        reasons: [],
        desc: "UV-stable alternative to ABS. Ideal for outdoor applications that need to last.",
        price: "$25-40",
        difficulty: 'Advanced',
        brands: [
          { name: "Polymaker ASA", url: "/finder?material=ASA&brand=Polymaker" },
          { name: "Prusament ASA", url: "/finder?material=ASA&brand=Prusament" },
          { name: "eSUN ASA", url: "/finder?material=ASA&brand=eSUN" },
        ]
      },
      'PLA+': { 
        score: 45, 
        reasons: [],
        desc: "Enhanced PLA with better strength and temperature resistance while staying easy to print.",
        price: "$18-28",
        difficulty: 'Easy',
        brands: [
          { name: "eSUN PLA+", url: "/finder?material=PLA%2B&brand=eSUN" },
          { name: "Sunlu PLA+", url: "/finder?material=PLA%2B&brand=Sunlu" },
          { name: "Overture PLA+", url: "/finder?material=PLA%2B&brand=Overture" },
        ]
      },
    };

    // Use case scoring
    if (useCase === 'functional') {
      materials['PETG'].score += 25;
      materials['PETG'].reasons.push("Excellent strength for functional parts");
      materials['ABS'].score += 20;
      materials['ABS'].reasons.push("High durability for mechanical components");
      materials['PLA+'].score += 15;
      materials['PLA+'].reasons.push("Enhanced strength over standard PLA");
    } else if (useCase === 'art_display') {
      materials['PLA'].score += 30;
      materials['PLA'].reasons.push("Best surface finish for display pieces");
      materials['PLA+'].score += 20;
      materials['PLA+'].reasons.push("Great colors and print quality");
    } else if (useCase === 'prototypes') {
      materials['PLA'].score += 25;
      materials['PLA'].reasons.push("Fast, reliable prints for prototyping");
      materials['PLA+'].score += 20;
      materials['PLA+'].reasons.push("Quick iteration cycles");
    } else if (useCase === 'outdoor') {
      materials['ASA'].score += 35;
      materials['ASA'].reasons.push("UV-resistant for outdoor durability");
      materials['PETG'].score += 20;
      materials['PETG'].reasons.push("Weather-resistant option");
    } else if (useCase === 'household') {
      materials['PETG'].score += 20;
      materials['PETG'].reasons.push("Food-safe and durable for home use");
      materials['PLA'].score += 15;
      materials['PLA'].reasons.push("Easy prints for everyday items");
    }

    // Priority scoring
    if (priority === 'strength') {
      materials['PETG'].score += 20;
      materials['PETG'].reasons.push("High strength-to-ease ratio");
      materials['ABS'].score += 15;
      materials['ABS'].reasons.push("Excellent impact resistance");
    } else if (priority === 'appearance') {
      materials['PLA'].score += 25;
      materials['PLA'].reasons.push("Best surface quality and color options");
      materials['PLA+'].score += 15;
      materials['PLA+'].reasons.push("Great finish with added strength");
    } else if (priority === 'easy') {
      materials['PLA'].score += 30;
      materials['PLA'].reasons.push("Most forgiving material to print");
      materials['PLA+'].score += 25;
      materials['PLA+'].reasons.push("Easy printing with enhanced properties");
      materials['PETG'].score += 10;
      materials['PETG'].reasons.push("Relatively easy for engineering material");
    } else if (priority === 'price') {
      materials['PLA'].score += 20;
      materials['PLA'].reasons.push("Most affordable quality option");
      materials['PLA+'].score += 15;
      materials['PLA+'].reasons.push("Great value for enhanced properties");
    }

    // Budget scoring
    if (budget === 'budget') {
      materials['PLA'].score += 15;
      materials['PLA+'].score += 10;
    } else if (budget === 'premium' || budget === 'any') {
      materials['ASA'].score += 10;
      materials['ABS'].score += 10;
    }

    // Special requirements
    if (special.includes('food_safe')) {
      materials['PETG'].score += 25;
      materials['PETG'].reasons.push("FDA compliant for food contact");
    }
    if (special.includes('uv_resistant')) {
      materials['ASA'].score += 30;
      materials['ASA'].reasons.push("Excellent UV stability");
    }
    if (special.includes('flexible')) {
      materials['TPU'].score += 50;
      materials['TPU'].reasons.push("Flexible, rubber-like properties");
    }
    if (special.includes('high_temp')) {
      materials['ABS'].score += 25;
      materials['ABS'].reasons.push("High temperature resistance");
      materials['ASA'].score += 20;
      materials['ASA'].reasons.push("Excellent heat resistance");
    }

    // Printer compatibility boost
    if (printer === 'bambu' || printer === 'prusa') {
      // These printers can handle most materials well
      materials['ABS'].score += 5;
      materials['ASA'].score += 5;
    } else if (printer === 'creality' || printer === 'other') {
      // Boost easier materials for potentially less enclosed printers
      materials['PLA'].score += 10;
      materials['PETG'].score += 5;
    }

    // Convert to recommendations
    const sortedMaterials = Object.entries(materials)
      .sort(([, a], [, b]) => b.score - a.score)
      .slice(0, 3);

    const maxScore = sortedMaterials[0][1].score;
    
    for (const [material, data] of sortedMaterials) {
      const matchPercent = Math.round((data.score / maxScore) * 100);
      recommendations.push({
        material,
        matchPercent: Math.min(matchPercent, 98), // Cap at 98%
        description: data.desc,
        whyRecommended: data.reasons.length > 0 ? data.reasons : ["Good all-around choice for your needs"],
        priceRange: data.price,
        difficulty: data.difficulty,
        brands: data.brands,
      });
    }

    return recommendations;
  };

  const handleRefine = () => {
    setShowResults(false);
    setCurrentStep(0);
  };

  if (showResults) {
    const recommendations = getRecommendations();
    
    return (
      <div className="min-h-screen py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-6">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs uppercase tracking-wider text-primary">
                Top 3 Recommendations
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Your Perfect Filaments</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Based on your answers, here are the best materials for your project
            </p>
          </div>

          {/* Recommendations */}
          <div className="space-y-6 mb-10">
            {recommendations.map((rec, index) => (
              <Card 
                key={rec.material} 
                className={`p-6 transition-all duration-200 hover:shadow-lg ${
                  index === 0 ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Match Badge */}
                  <div className="flex-shrink-0">
                    <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center ${
                      index === 0 
                        ? 'bg-gradient-to-br from-primary to-primary/70 text-background' 
                        : 'bg-gray-800 text-white'
                    }`}>
                      <span className="text-2xl font-bold">{rec.matchPercent}%</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-80">Match</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          {index === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                              Best Match
                            </span>
                          )}
                          <h3 className="text-xl font-bold">{rec.material}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">{rec.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium">{rec.priceRange}</div>
                        <div className={`text-xs ${
                          rec.difficulty === 'Easy' ? 'text-green-400' : 
                          rec.difficulty === 'Moderate' ? 'text-yellow-400' : 'text-orange-400'
                        }`}>
                          {rec.difficulty} to print
                        </div>
                      </div>
                    </div>

                    {/* Why Recommended */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Why we recommend this</span>
                      </div>
                      <ul className="space-y-1">
                        {rec.whyRecommended.map((reason, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="h-3 w-3 text-primary flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Brand Links */}
                    <div className="flex flex-wrap gap-2">
                      {rec.brands.map((brand) => (
                        <Button
                          key={brand.name}
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 text-xs hover:border-primary hover:text-primary"
                        >
                          <Link to={brand.url}>
                            {brand.name}
                            <ExternalLink className="ml-1.5 h-3 w-3" />
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={handleRefine}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refine Results
            </Button>
            <Button
              onClick={() => navigate('/finder')}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Browse All Filaments
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Quick Match — Find Your Perfect Filament in 60 Seconds | FilaScope</title>
        <meta name="description" content="Answer 5 quick questions and get personalized 3D printer filament recommendations based on your project needs." />
      </Helmet>
      <div className="min-h-screen py-4 sm:py-8 md:py-12 px-3 sm:px-6 lg:px-8 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <Card className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-xl md:text-2xl font-bold">Material Wizard</h2>
              </div>
              <span className="text-sm text-muted-foreground font-mono">
                {currentStep + 1} / {questions.length}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h3 className="text-lg md:text-xl font-semibold mb-2">{currentQuestion.question}</h3>
            {currentQuestion.subtitle && (
              <p className="text-sm text-muted-foreground mb-6">{currentQuestion.subtitle}</p>
            )}
            
            {currentQuestion.type === 'single' ? (
              <RadioGroup
                value={answers[currentQuestion.id] as string || ''}
                onValueChange={handleSingleAnswer}
                className="space-y-2 sm:space-y-3"
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.value}>
                    <RadioGroupItem value={option.value} id={option.value} className="sr-only peer" />
                    <Label
                      htmlFor={option.value}
                      className="flex items-start gap-3 sm:gap-4 cursor-pointer p-3 sm:p-4 rounded-xl border-2 border-border hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all min-h-[56px] touch-manipulation"
                    >
                      {option.icon && (
                        <span className="text-xl sm:text-2xl flex-shrink-0">{option.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base">{option.label}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{option.description}</div>
                      </div>
                      <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-muted-foreground/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary flex items-center justify-center">
                        {(answers[currentQuestion.id] === option.value) && (
                          <Check className="h-3 w-3 text-background" />
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {currentQuestion.options.map((option) => {
                  const currentValues = (answers[currentQuestion.id] as string[]) || [];
                  const isChecked = currentValues.includes(option.value);
                  
                  return (
                    <div
                      key={option.value}
                      className={`flex items-start gap-3 sm:gap-4 cursor-pointer p-3 sm:p-4 rounded-xl border-2 transition-all min-h-[56px] touch-manipulation ${
                        isChecked 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleMultiAnswer(option.value, !isChecked)}
                    >
                      {option.icon && (
                        <span className="text-xl sm:text-2xl flex-shrink-0">{option.icon}</span>
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
              className="flex-1 h-12 sm:h-11 min-h-[48px] touch-manipulation bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
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
