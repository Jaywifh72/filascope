import React from 'react';
import { Sparkles, ArrowRight, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SpecialtyQuizCardProps {
  onStartQuiz: () => void;
  onBrowseAll?: () => void;
}

const SpecialtyQuizCard: React.FC<SpecialtyQuizCardProps> = ({ onStartQuiz, onBrowseAll }) => {
  return (
    <div className="sticky top-24 p-4 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent border border-primary/20 rounded-xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground">Find Your Perfect Tool</h3>
          <p className="text-xs text-muted-foreground">Answer 4 quick questions</p>
        </div>
      </div>

      {/* Benefits */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>Takes 60 seconds</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Target className="w-3.5 h-3.5 text-primary" />
          <span>Personalized results</span>
        </div>
      </div>

      {/* CTA */}
      <Button onClick={onStartQuiz} size="sm" className="w-full gap-2 mb-2">
        Start Quiz
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
      
      {/* Browse link */}
      {onBrowseAll && (
        <button 
          onClick={onBrowseAll}
          className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center py-1"
        >
          or browse all 10 tools →
        </button>
      )}
    </div>
  );
};

export default SpecialtyQuizCard;
