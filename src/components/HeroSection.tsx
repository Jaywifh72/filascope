import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filamentCount: number;
  brandCount: number;
  compatibleCount: number;
}

const HeroSection = ({ searchTerm, onSearchChange, filamentCount, brandCount, compatibleCount }: HeroSectionProps) => {
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Main content */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left: Text Content */}
          <div className="flex flex-col items-start text-left">
            {/* Headline */}
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-light tracking-[0.08em] leading-[1.15] mb-8 animate-fade-in uppercase"
            >
              Measure Material.
              <br />
              Master The{" "}
              <span className="text-primary italic font-normal">Print.</span>
            </h1>
            
            {/* Sub-text */}
            <p 
              className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-[540px] animate-fade-in"
              style={{ animationDelay: "0.15s" }}
            >
              The future of filament is loading. We are indexing thousands of materials to provide the most accurate 3D printing data hub ever built.
            </p>
            
            {/* Buttons Row */}
            <div 
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              {/* Primary Button - Material Wizard with Cyan Gradient */}
              <Button 
                size="lg"
                onClick={() => navigate("/wizard")}
                className="h-14 px-8 bg-gradient-to-r from-primary via-[hsl(185_100%_45%)] to-[hsl(195_100%_50%)] text-background hover:from-[hsl(180_100%_55%)] hover:via-[hsl(185_100%_50%)] hover:to-[hsl(195_100%_55%)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200 font-bold text-base rounded-xl shadow-[0_8px_24px_rgba(0,207,232,0.35)] hover:shadow-[0_12px_32px_rgba(0,207,232,0.5)]"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Material Wizard
              </Button>
              
              {/* Secondary - Search Input with Glass Background */}
              <div 
                className={`relative transition-all duration-300 ${
                  isFocused ? "scale-[1.01]" : ""
                }`}
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className={`w-full sm:w-[280px] h-14 pl-12 pr-5 text-base bg-white/5 backdrop-blur-md text-foreground placeholder:text-muted-foreground rounded-xl border transition-all duration-300 outline-none ${
                    isFocused 
                      ? "border-primary/60 shadow-[0_0_16px_rgba(0,207,232,0.25)]" 
                      : "border-white/10 hover:border-white/20"
                  }`}
                  aria-label="Search materials"
                />
              </div>
            </div>
          </div>
          
          {/* Right: 3D Box Visual */}
          <div 
            className="hidden lg:flex justify-center items-center animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            {/* Glassmorphic Container */}
            <div 
              className="relative p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl"
              style={{
                transform: "rotate(6deg)",
              }}
            >
              {/* Scan Line Animation */}
              <div 
                className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60 z-20 pointer-events-none"
                style={{
                  animation: "scanLine 4s ease-in-out infinite",
                }}
              />
              
              {/* 3D Stacked Boxes */}
              <div className="relative w-[280px] h-[280px] flex items-center justify-center">
                {/* Bottom Box - Magenta */}
                <div 
                  className="absolute w-32 h-32 rounded-2xl border-2 border-[#FF0055]/40 bg-gradient-to-br from-[#FF0055]/20 to-[#FF0055]/5 shadow-[0_25px_50px_-12px_rgba(255,0,85,0.3)]"
                  style={{
                    transform: "translateX(-40px) translateY(50px) translateZ(-30px) rotateX(-15deg) rotateY(15deg)",
                    transformStyle: "preserve-3d",
                  }}
                />
                
                {/* Middle Box - Clear/Glass */}
                <div 
                  className="absolute w-32 h-32 rounded-2xl border-2 border-white/30 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm shadow-[0_25px_50px_-12px_rgba(255,255,255,0.15)]"
                  style={{
                    transform: "translateX(0px) translateY(10px) translateZ(0px) rotateX(-15deg) rotateY(15deg)",
                    transformStyle: "preserve-3d",
                  }}
                />
                
                {/* Top Box - Cyan */}
                <div 
                  className="absolute w-32 h-32 rounded-2xl border-2 border-primary/50 bg-gradient-to-br from-primary/25 to-primary/5 shadow-[0_25px_50px_-12px_rgba(0,207,232,0.4)]"
                  style={{
                    transform: "translateX(40px) translateY(-30px) translateZ(30px) rotateX(-15deg) rotateY(15deg)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Glow effect on top box */}
                  <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" />
                </div>
                
                {/* Decorative grid lines */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white to-transparent" />
                </div>
              </div>
              
              {/* Corner accents */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/40 rounded-tl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/40 rounded-br-lg" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Add scan line keyframes */}
      <style>{`
        @keyframes scanLine {
          0%, 100% {
            top: 0%;
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          50% {
            top: 100%;
            opacity: 0.6;
          }
          60% {
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
