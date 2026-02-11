import { Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchInputWithHistory from "@/components/search/SearchInputWithHistory";

interface PrintersHeroSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  printerCount: number;
  brandCount: number;
  activeQuickFilters: string[];
  onQuickFilterToggle: (filterId: string) => void;
  onOpenQuiz?: () => void;
}

const PrintersHeroSection = ({ 
  searchTerm, 
  onSearchChange, 
  printerCount, 
  brandCount,
  onOpenQuiz
}: PrintersHeroSectionProps) => {

  return (
    <section className="relative overflow-hidden">
      {/* Main content */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 pt-20 pb-4 sm:pt-24 sm:pb-6 md:pt-28 md:pb-8 lg:pt-32 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 items-center">
          
          {/* Left: Text Content */}
          <div className="flex flex-col items-start text-left order-1">
            {/* System Registry Badge */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-4 sm:mb-6 animate-fade-in"
            >
              <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.15em] text-primary">
                Hardware Registry
              </span>
            </div>

            {/* Headline - Responsive sizing */}
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-light tracking-[0.1em] sm:tracking-[0.15em] leading-[1.15] mb-4 sm:mb-6 animate-fade-in uppercase"
            >
              <span className="text-foreground">Deploy</span>
              <br />
              <span className="text-muted-foreground font-light">Fabrication</span>
              <br />
              <span className="font-black italic text-primary">Hardware.</span>
            </h1>
            
            {/* Sub-text */}
            <p 
              className="text-sm sm:text-base md:text-lg text-muted-foreground font-light leading-relaxed mb-6 sm:mb-8 md:mb-10 max-w-[480px] animate-fade-in font-mono"
              style={{ animationDelay: "0.15s" }}
            >
              <span className="text-primary">{printerCount.toLocaleString()}</span> units indexed from{" "}
              <span className="text-primary">{brandCount}+</span> brands. 
              <span className="hidden sm:inline"> Compare specs, prices, and capabilities in one unified command center.</span>
            </p>
            
            {/* Buttons Row - Stack on mobile */}
            <div 
              className="flex flex-col w-full gap-3 sm:flex-row sm:items-center sm:gap-4 sm:w-auto animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              {/* Primary Button - Printer Quiz */}
              <Button 
                size="lg"
                onClick={onOpenQuiz}
                className="h-12 sm:h-14 px-6 sm:px-8 bg-gradient-to-r from-primary via-[hsl(185_100%_45%)] to-[hsl(195_100%_50%)] text-background hover:from-[hsl(180_100%_55%)] hover:via-[hsl(185_100%_50%)] hover:to-[hsl(195_100%_55%)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200 font-bold text-sm sm:text-base rounded-xl shadow-[0_8px_24px_rgba(0,207,232,0.35)] hover:shadow-[0_12px_32px_rgba(0,207,232,0.5)] w-full sm:w-auto"
              >
                <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Hardware Quiz
              </Button>
              
              {/* Secondary - Search Input with History */}
              <div className="w-full sm:w-[260px] md:w-[300px] relative">
                <SearchInputWithHistory
                  value={searchTerm}
                  onChange={onSearchChange}
                  placeholder="Search by printer name, brand, or build size..."
                  context="printers"
                  className="h-12 sm:h-14"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 pointer-events-none">
                  /
                </kbd>
              </div>
            </div>
          </div>
          
          {/* Right: Calibration Cube Visual */}
          <div 
            className="hidden lg:flex justify-end items-center animate-fade-in order-2"
            style={{ animationDelay: "0.4s" }}
          >
            {/* Glass Container with Wireframe Cube */}
            <div 
              className="relative p-10 rounded-2xl border border-white/10 overflow-hidden"
              style={{
                transform: "rotate(6deg)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              {/* Vertical Cyan Laser Scan */}
              <div 
                className="absolute top-0 bottom-0 w-[2px] z-30 pointer-events-none animate-printers-laser-scan"
                style={{
                  background: "linear-gradient(180deg, transparent, #00CFE8, transparent)",
                  boxShadow: "0 0 20px 4px rgba(0, 207, 232, 0.6), 0 0 40px 8px rgba(0, 207, 232, 0.3)",
                }}
              />
              
              {/* Wireframe Isometric Calibration Cube */}
              <div className="relative w-[260px] h-[260px] flex items-center justify-center" style={{ perspective: "1000px" }}>
                <svg 
                  viewBox="0 0 200 200" 
                  className="w-full h-full"
                  style={{ transform: "rotateX(-15deg) rotateY(-15deg)" }}
                >
                  {/* Back face - White */}
                  <polygon 
                    points="100,30 160,60 160,140 100,170 40,140 40,60" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.15)" 
                    strokeWidth="1"
                  />
                  
                  {/* Top face - Cyan */}
                  <polygon 
                    points="100,30 160,60 100,90 40,60" 
                    fill="rgba(0,207,232,0.05)" 
                    stroke="rgba(0,207,232,0.6)" 
                    strokeWidth="1.5"
                  />
                  
                  {/* Left face - White */}
                  <polygon 
                    points="40,60 100,90 100,170 40,140" 
                    fill="rgba(255,255,255,0.02)" 
                    stroke="rgba(255,255,255,0.3)" 
                    strokeWidth="1"
                  />
                  
                  {/* Right face - Magenta */}
                  <polygon 
                    points="160,60 100,90 100,170 160,140" 
                    fill="rgba(255,0,85,0.05)" 
                    stroke="rgba(255,0,85,0.5)" 
                    strokeWidth="1"
                  />
                  
                  {/* Inner edge highlights */}
                  <line x1="100" y1="90" x2="100" y2="170" stroke="rgba(0,207,232,0.4)" strokeWidth="1" />
                  
                  {/* Grid lines on top face */}
                  <line x1="70" y1="45" x2="70" y2="75" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="130" y1="45" x2="130" y2="75" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="2,2" />
                </svg>
                
                {/* Floating Telemetry Tags */}
                <div className="absolute top-4 right-0 font-mono text-[9px] uppercase tracking-wider text-primary/70 bg-primary/5 border border-primary/20 px-2 py-1 rounded">
                  CALIB_STATUS: OK
                </div>
                <div className="absolute bottom-8 left-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground bg-white/5 border border-white/10 px-2 py-1 rounded">
                  Z_OFFSET: -0.42mm
                </div>
                <div className="absolute top-1/2 right-0 font-mono text-[9px] uppercase tracking-wider text-[#FF0055]/70 bg-[#FF0055]/5 border border-[#FF0055]/20 px-2 py-1 rounded">
                  T_DISTANCE: 4.2mm
                </div>
              </div>
              
              {/* Corner accents */}
              <div 
                className="absolute top-4 left-4 w-8 h-8 rounded-tl-lg"
                style={{ 
                  borderLeft: "2px solid rgba(0, 207, 232, 0.5)",
                  borderTop: "2px solid rgba(0, 207, 232, 0.5)",
                }}
              />
              <div 
                className="absolute bottom-4 right-4 w-8 h-8 rounded-br-lg"
                style={{ 
                  borderRight: "2px solid rgba(255, 0, 85, 0.5)",
                  borderBottom: "2px solid rgba(255, 0, 85, 0.5)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrintersHeroSection;
