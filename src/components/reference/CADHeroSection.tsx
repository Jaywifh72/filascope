import { Compass, ChevronDown, Star, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CADHeroSectionProps {
  softwareCount: number;
  onScrollToComparison: () => void;
}

const topCADSoftware = ["Fusion 360", "Blender", "SolidWorks", "FreeCAD"];

const CADHeroSection = ({ softwareCount, onScrollToComparison }: CADHeroSectionProps) => {
  const { toast } = useToast();

  const handleQuizClick = () => {
    toast({
      title: "CAD Quiz Coming Soon!",
      description: "We're building a personalized quiz to help you find the perfect CAD software.",
    });
  };

  return (
    <section className="relative w-full min-h-[400px] py-16 px-10 flex flex-col items-center justify-center text-center overflow-hidden md:py-12 md:px-5 md:min-h-fit">
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
      
      <div className="relative z-10 max-w-[900px] w-full flex flex-col items-center animate-fade-in">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
          <Box className="w-4 h-4" />
          CAD GUIDE
        </span>

        {/* Main Headline */}
        <h1 className="text-[42px] font-bold text-foreground tracking-tight leading-tight mb-4 md:text-[32px]">
          Find Your Perfect CAD Software
        </h1>

        {/* Subheadline */}
        <p className="text-lg font-medium text-muted-foreground leading-relaxed mb-2 md:text-base">
          Compare <span className="text-primary font-semibold">{softwareCount}</span> professional tools across <span className="text-primary font-semibold">10+</span> criteria
        </p>

        {/* Trust Signals */}
        <div className="inline-flex items-center gap-4 flex-wrap justify-center text-sm font-medium text-muted-foreground mb-8">
          <span className="inline-flex items-center gap-1.5">⭐ Expert ratings</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="inline-flex items-center gap-1.5">🏗️ Industry-tested</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="inline-flex items-center gap-1.5">🔄 Updated {new Date().getFullYear()}</span>
        </div>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4 flex-wrap mb-8 md:flex-col md:w-full md:max-w-[400px] md:gap-3">
          <Button 
            onClick={handleQuizClick}
            className="h-14 px-8 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40 transition-all duration-200 md:w-full w-[260px]"
          >
            <Compass className="w-5 h-5 mr-2" />
            Take 90-Second Quiz
          </Button>

          <Button 
            variant="outline"
            onClick={onScrollToComparison}
            className="h-14 px-7 text-base font-semibold border-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary hover:-translate-y-0.5 transition-all duration-200 md:w-full w-[240px]"
          >
            Browse All Software
            <ChevronDown className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Social Proof Ticker */}
        <div className="inline-flex items-center flex-wrap justify-center gap-2 text-sm font-medium text-muted-foreground">
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          <span>Top Picks:</span>
          {topCADSoftware.map((software, index) => (
            <span key={software} className="inline-flex items-center">
              <span className="text-foreground/80">{software}</span>
              {index < topCADSoftware.length - 1 && (
                <span className="text-muted-foreground/50 mx-1">•</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CADHeroSection;
