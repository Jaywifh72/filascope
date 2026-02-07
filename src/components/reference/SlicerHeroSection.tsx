import { useState } from "react";
import { Layers, Compass, ChevronDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlicerQuizModal } from "@/components/reference/SlicerQuizModal";

interface SlicerHeroSectionProps {
  slicerCount: number;
  onScrollToComparison: () => void;
}

const topSlicers = ["UltiMaker Cura", "PrusaSlicer", "Bambu Studio", "OrcaSlicer"];

const SlicerHeroSection = ({ slicerCount, onScrollToComparison }: SlicerHeroSectionProps) => {
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <>
      <section className="relative w-full min-h-[450px] py-20 px-10 flex flex-col items-center justify-center text-center gap-8 overflow-hidden md:py-16 md:px-5 md:min-h-fit md:gap-6">
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 z-0 opacity-50"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.03) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
        
        {/* Radial gradient spotlight */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.08) 0%, transparent 70%)"
          }}
        />
        
        <div className="relative z-10 max-w-[900px] w-full flex flex-col items-center gap-0 animate-fade-in">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
            <Layers className="w-4 h-4" />
            SLICER GUIDE
          </span>

          {/* Main Headline */}
          <h1 className="text-[42px] font-bold text-foreground tracking-tight leading-tight mb-4 md:text-[32px]">
            Find Your Perfect 3D Slicer Software
          </h1>

          {/* Subheadline */}
          <p className="text-lg font-medium text-muted-foreground leading-relaxed mb-2 md:text-base">
            Compare <span className="text-primary font-semibold">{slicerCount}</span> slicers across <span className="text-primary font-semibold">15</span> key features
          </p>

          {/* Trust Signals */}
          <div className="inline-flex items-center gap-4 flex-wrap justify-center text-sm font-medium text-muted-foreground mb-8">
            <span className="inline-flex items-center gap-1.5">⭐ Expert ratings</span>
            <span className="text-muted-foreground/50">•</span>
            <span className="inline-flex items-center gap-1.5">💬 Real user reviews</span>
            <span className="text-muted-foreground/50">•</span>
            <span className="inline-flex items-center gap-1.5">🔄 Updated {new Date().getFullYear()}</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4 flex-wrap mb-8 md:flex-col md:w-full md:max-w-[400px] md:gap-3">
            <Button 
              onClick={() => setQuizOpen(true)}
              className="h-14 px-8 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40 transition-all duration-200 md:w-full w-[260px]"
            >
              <Compass className="w-5 h-5 mr-2" />
              Take 60-Second Quiz
            </Button>

            <Button 
              variant="outline"
              onClick={onScrollToComparison}
              className="h-14 px-7 text-base font-semibold border-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary hover:-translate-y-0.5 transition-all duration-200 md:w-full w-[240px]"
            >
              View Full Comparison
              <ChevronDown className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Social Proof Ticker */}
          <div className="inline-flex items-center flex-wrap justify-center gap-2 text-sm font-medium text-muted-foreground">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span>Most Popular:</span>
            {topSlicers.map((slicer, index) => (
              <span key={slicer} className="inline-flex items-center">
                <span className="text-foreground/80">{slicer}</span>
                {index < topSlicers.length - 1 && (
                  <span className="text-muted-foreground/50 mx-1">•</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      <SlicerQuizModal open={quizOpen} onOpenChange={setQuizOpen} />
    </>
  );
};

export default SlicerHeroSection;
