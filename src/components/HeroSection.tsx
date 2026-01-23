import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, FlaskConical } from "lucide-react";
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
      {/* Main content */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-10 pt-28 pb-12 md:pt-32 md:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left: Text Content */}
          <div className="flex flex-col items-start text-left order-1">
            {/* Material Registry Badge */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6 animate-fade-in"
            >
              <FlaskConical className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
                Material Registry
              </span>
            </div>

            {/* Headline */}
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light tracking-[0.15em] leading-[1.1] mb-6 animate-fade-in uppercase"
            >
              <span className="text-foreground">Measure</span>
              <br />
              <span className="text-muted-foreground font-light">Material.</span>
              <br />
              <span className="font-black italic text-primary">Print.</span>
            </h1>
            
            {/* Sub-text */}
            <p 
              className="text-base md:text-lg text-muted-foreground font-light leading-relaxed mb-10 max-w-[480px] animate-fade-in font-mono"
              style={{ animationDelay: "0.15s" }}
            >
              <span className="text-primary">{filamentCount.toLocaleString()}</span> materials indexed from{" "}
              <span className="text-primary">{brandCount}+</span> manufacturers. 
              Compare properties, specs, and pricing in one unified data hub.
            </p>
            
            {/* Buttons Row */}
            <div 
              className="flex flex-col items-start gap-3 w-full sm:w-auto animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                {/* Primary Button - Material Wizard with Cyan Gradient and Pulse */}
                <Button 
                  size="lg"
                  onClick={() => navigate("/wizard")}
                  className="group relative h-14 px-8 bg-gradient-to-r from-primary via-[hsl(185_100%_45%)] to-[hsl(195_100%_50%)] text-background hover:from-[hsl(180_100%_55%)] hover:via-[hsl(185_100%_50%)] hover:to-[hsl(195_100%_55%)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200 font-bold text-base rounded-xl shadow-[0_8px_24px_rgba(0,207,232,0.35)] hover:shadow-[0_12px_32px_rgba(0,207,232,0.5)]"
                >
                  {/* Subtle pulse ring */}
                  <span className="absolute inset-0 rounded-xl animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] bg-primary/20" />
                  <Sparkles className="relative mr-2 h-5 w-5 group-hover:animate-[spin_2s_ease-in-out]" />
                  <span className="relative">Find Your Perfect Filament</span>
                </Button>
                
                {/* Secondary - Search Input */}
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
                    className={`w-full sm:w-[280px] h-14 pl-12 pr-5 text-base font-mono bg-white/5 backdrop-blur-md text-foreground placeholder:text-muted-foreground rounded-xl border transition-all duration-300 outline-none ${
                      isFocused 
                        ? "border-primary/60 shadow-[0_0_16px_rgba(0,207,232,0.25)]" 
                        : "border-white/10 hover:border-white/20"
                    }`}
                    aria-label="Search materials"
                  />
                </div>
              </div>
              
              {/* Wizard subtitle */}
              <p className="text-xs text-muted-foreground font-mono ml-1">
                Answer 5 quick questions → Get personalized recommendations
              </p>
            </div>
          </div>
          
          {/* Right: Glass Container with 3D Filament Spool Visual */}
          <div 
            className="hidden lg:flex justify-end items-center animate-fade-in order-2"
            style={{ animationDelay: "0.4s" }}
          >
            {/* Glass Container with Spool Visualization */}
            <div 
              className="relative p-10 rounded-2xl border border-white/10 overflow-hidden"
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
              
              {/* 3D Stacked Boxes */}
              <div className="relative w-[260px] h-[260px] flex items-center justify-center" style={{ perspective: "1000px" }}>
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
                
                {/* Floating Telemetry Tags */}
                <div className="absolute top-4 right-0 font-mono text-[9px] uppercase tracking-wider text-primary/70 bg-primary/5 border border-primary/20 px-2 py-1 rounded">
                  MATERIAL_DB: ACTIVE
                </div>
                <div className="absolute bottom-8 left-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground bg-white/5 border border-white/10 px-2 py-1 rounded">
                  T_NOZZLE: 215°C
                </div>
                <div className="absolute top-1/2 right-0 font-mono text-[9px] uppercase tracking-wider text-[#FF0055]/70 bg-[#FF0055]/5 border border-[#FF0055]/20 px-2 py-1 rounded">
                  DENSITY: 1.24g/cm³
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
