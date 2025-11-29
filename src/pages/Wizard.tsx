import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string; description: string }[];
}

const questions: Question[] = [
  {
    id: "use_case",
    question: "What will you be printing?",
    options: [
      { value: "functional", label: "Functional Parts", description: "Mechanical components, tools" },
      { value: "decorative", label: "Decorative Items", description: "Art, figurines, display pieces" },
      { value: "prototypes", label: "Prototypes", description: "Design iterations, testing" },
      { value: "outdoor", label: "Outdoor Use", description: "Weather-resistant parts" },
    ],
  },
  {
    id: "strength",
    question: "What strength level do you need?",
    options: [
      { value: "low", label: "Low Strength", description: "Display models, art pieces" },
      { value: "medium", label: "Medium Strength", description: "General purpose, household items" },
      { value: "high", label: "High Strength", description: "Load-bearing, mechanical parts" },
      { value: "flexible", label: "Flexible", description: "Rubber-like, bendable parts" },
    ],
  },
  {
    id: "ease",
    question: "What's your printing experience level?",
    options: [
      { value: "beginner", label: "Beginner", description: "New to 3D printing" },
      { value: "intermediate", label: "Intermediate", description: "Some experience" },
      { value: "advanced", label: "Advanced", description: "Experienced with tricky materials" },
    ],
  },
  {
    id: "temperature",
    question: "Will the part be exposed to heat?",
    options: [
      { value: "no", label: "No Heat", description: "Room temperature only" },
      { value: "moderate", label: "Moderate Heat", description: "Up to 60°C" },
      { value: "high", label: "High Heat", description: "Above 80°C" },
    ],
  },
];

const Wizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
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

  const getRecommendations = () => {
    // Simple recommendation logic based on answers
    const recommendations = [];
    
    if (answers.ease === "beginner") {
      recommendations.push("PLA - Easy to print, great for beginners");
    }
    
    if (answers.strength === "high") {
      recommendations.push("PETG - Strong and durable");
      recommendations.push("Nylon - Excellent mechanical properties");
    }
    
    if (answers.strength === "flexible") {
      recommendations.push("TPU - Flexible and rubber-like");
    }
    
    if (answers.temperature === "high") {
      recommendations.push("ABS - High temperature resistance");
      recommendations.push("ASA - UV and heat resistant");
    }
    
    if (answers.use_case === "outdoor") {
      recommendations.push("ASA - Weather and UV resistant");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("PLA - Versatile and easy to use");
      recommendations.push("PETG - Good balance of strength and ease");
    }

    return recommendations;
  };

  if (showResults) {
    const recommendations = getRecommendations();
    
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Your Recommendations</h2>
              <p className="text-muted-foreground">
                Based on your answers, here are the best filaments for you:
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{rec}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResults(false);
                  setCurrentStep(0);
                  setAnswers({});
                }}
                className="flex-1"
              >
                Start Over
              </Button>
              <Button asChild className="flex-1">
                <a href="/finder">Browse All Filaments</a>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Filament Wizard</h2>
              <span className="text-sm text-muted-foreground">
                Question {currentStep + 1} of {questions.length}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-6">{currentQuestion.question}</h3>
            <RadioGroup
              value={answers[currentQuestion.id]}
              onValueChange={handleAnswer}
              className="space-y-4"
            >
              {currentQuestion.options.map((option) => (
                <div key={option.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <Label
                    htmlFor={option.value}
                    className="flex-1 cursor-pointer p-4 rounded-lg border-2 border-border hover:border-primary transition-colors"
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              className="flex-1"
            >
              {isLastQuestion ? "See Results" : "Next"}
              {!isLastQuestion && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Wizard;
