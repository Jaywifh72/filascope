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
    <section className="relative overflow-hidden">
      {/* Main content - Compact height, no separate background */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left: Text Content */}
          <div className="flex flex-col items-start text-left order-1">
            {/* Headline - Smaller, more compact */}
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-light tracking-[0.2em] leading-[1.2] mb-6 animate-fade-in uppercase"
            >
              Measure Material.
              <br />
              Master The{" "}
              <span className="font-black italic text-primary">Print.</span>
            </h1>
            
            {/* Sub-text */}
            <p 
              className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed mb-12 max-w-[540px] animate-fade-in"
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
          
          {/* Right: Glass Container with 3D Box Visual */}
          <div 
            className="hidden lg:flex justify-end items-center animate-fade-in order-2"
            style={{ animationDelay: "0.4s" }}
          >
            {/* Compact Glass Container */}
            <div 
              className="relative p-8 rounded-2xl border border-white/10 shadow-xl overflow-hidden"
              style={{
                transform: "rotate(6deg)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              {/* Horizontal Cyan Scan Line */}
              <div 
                className="absolute left-0 right-0 h-[2px] z-30 pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent, #00CFE8, transparent)",
                  boxShadow: "0 0 20px 4px rgba(0, 207, 232, 0.6), 0 0 40px 8px rgba(0, 207, 232, 0.3)",
                  animation: "heroScanLine 4s ease-in-out infinite",
                }}
              />
              
              {/* 3D Stacked Boxes - Compact */}
              <div className="relative w-[240px] h-[240px] flex items-center justify-center" style={{ perspective: "1000px" }}>
                {/* Bottom Box - Magenta */}
                <div 
                  className="absolute w-28 h-28 rounded-xl"
                  style={{
                    transform: "translateX(-35px) translateY(40px) translateZ(-25px) rotateX(-15deg) rotateY(15deg)",
                    transformStyle: "preserve-3d",
                    border: "2px solid rgba(255, 0, 85, 0.5)",
                    background: "linear-gradient(135deg, rgba(255, 0, 85, 0.25) 0%, rgba(255, 0, 85, 0.08) 100%)",
                    boxShadow: "0 20px 40px -12px rgba(255, 0, 85, 0.35)",
                  }}
                />
                
                {/* Middle Box - Clear/Glass */}
                <div 
                  className="absolute w-28 h-28 rounded-xl backdrop-blur-sm"
                  style={{
                    transform: "translateX(0px) translateY(8px) translateZ(0px) rotateX(-15deg) rotateY(15deg)",
                    transformStyle: "preserve-3d",
                    border: "2px solid rgba(255, 255, 255, 0.35)",
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.06) 100%)",
                    boxShadow: "0 20px 40px -12px rgba(255, 255, 255, 0.15)",
                  }}
                />
                
                {/* Top Box - Cyan */}
                <div 
                  className="absolute w-28 h-28 rounded-xl"
                  style={{
                    transform: "translateX(35px) translateY(-28px) translateZ(25px) rotateX(-15deg) rotateY(15deg)",
                    transformStyle: "preserve-3d",
                    border: "2px solid rgba(0, 207, 232, 0.6)",
                    background: "linear-gradient(135deg, rgba(0, 207, 232, 0.3) 0%, rgba(0, 207, 232, 0.08) 100%)",
                    boxShadow: "0 20px 40px -12px rgba(0, 207, 232, 0.45), inset 0 0 20px rgba(0, 207, 232, 0.1)",
                  }}
                >
                  {/* Inner glow effect */}
                  <div 
                    className="absolute inset-0 rounded-xl blur-lg"
                    style={{ background: "rgba(0, 207, 232, 0.15)" }}
                  />
                </div>
                
                {/* Decorative grid lines */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white to-transparent" />
                </div>
              </div>
              
              {/* Corner accents - Cyan */}
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
                  borderRight: "2px solid rgba(0, 207, 232, 0.5)",
                  borderBottom: "2px solid rgba(0, 207, 232, 0.5)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Hero scan line keyframes */}
      <style>{`
        @keyframes heroScanLine {
          0% {
            top: 0%;
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          45% {
            opacity: 1;
          }
          50% {
            top: 100%;
            opacity: 0;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
