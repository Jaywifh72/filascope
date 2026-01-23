import React from 'react';
import { ChevronDown, Wrench, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SpecialtyToolsHeroSectionProps {
  onScrollToComparison: () => void;
  onOpenQuiz?: () => void;
}

const SpecialtyToolsHeroSection: React.FC<SpecialtyToolsHeroSectionProps> = ({ onScrollToComparison, onOpenQuiz }) => {
  return (
    <section 
      className="w-full py-12 md:py-16 mb-8 border-b border-border/50 relative overflow-hidden"
      role="region"
      aria-labelledby="specialty-hero-headline"
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-5xl mx-auto px-4 relative">
        {/* Headline Area */}
        <div className="text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-sm font-medium mb-4">
            <Wrench className="w-4 h-4" />
            UTILITY BELT
          </span>
          
          <h2 
            id="specialty-hero-headline"
            className="text-3xl md:text-4xl lg:text-[42px] font-extrabold text-foreground mb-4 tracking-tight"
          >
            The 3D Printing <span className="text-primary">Utility Belt</span>
          </h2>
          <p className="text-base md:text-lg font-medium text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Essential tools we actually use—from calibration wizards to remote monitoring magic.
          </p>
          
          {/* Stats Row */}
          <div className="flex items-center justify-center gap-4 md:gap-8 text-sm md:text-base text-muted-foreground mb-8 flex-wrap">
            <span>
              <span className="text-teal-400 font-semibold">10</span> Tools Reviewed
            </span>
            <span className="text-border">•</span>
            <span>
              <span className="text-teal-400 font-semibold">7</span> Categories
            </span>
            <span className="text-border hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              <span className="text-teal-400 font-semibold">4</span> Free Options
            </span>
            <span className="text-border hidden md:inline">•</span>
            <span className="hidden md:inline">
              <span className="text-teal-400 font-semibold">100%</span> Personally Tested
            </span>
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {onOpenQuiz && (
              <Button 
                onClick={onOpenQuiz}
                size="default"
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Take 60-Second Quiz
              </Button>
            )}
            <button
              onClick={onScrollToComparison}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors group border border-border/50 rounded-lg hover:border-primary/30"
              aria-label="View full comparison"
            >
              <span>View Full Comparison</span>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpecialtyToolsHeroSection;
