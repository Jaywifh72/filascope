import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SpecialtyQuizCardProps {
  onStartQuiz: () => void;
}

const SpecialtyQuizCard: React.FC<SpecialtyQuizCardProps> = ({ onStartQuiz }) => {
  return (
    <div className="sticky top-20 p-5 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent border border-primary/20 rounded-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Find Your Perfect Tool</h3>
          <p className="text-xs text-muted-foreground">60-second personalized quiz</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Not sure where to start? Answer 4 quick questions and we'll recommend the best tools for your specific needs.
      </p>

      {/* Features */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md text-xs text-muted-foreground">
          ⏱️ 60 seconds
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md text-xs text-muted-foreground">
          🎯 Personalized
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md text-xs text-muted-foreground">
          💡 Match reasons
        </span>
      </div>

      {/* CTA */}
      <Button onClick={onStartQuiz} className="w-full gap-2">
        Take the Quiz
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default SpecialtyQuizCard;
