import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Layers, Building2, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProminentPrinterSelector } from "@/components/ProminentPrinterSelector";
import { PrinterSpecsGrid } from "@/components/PrinterSpecsGrid";
interface HeroSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filamentCount: number;
  brandCount: number;
  compatibleCount: number;
}

// Count-up animation hook
const useCountUp = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Ease-out curve for satisfying slowdown at end
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  
  return count;
};

interface StatBlockProps {
  icon: React.ElementType;
  targetNumber: number | null;
  displayText?: string;
  suffix?: string;
  label: string;
  delay: string;
  colorVariant: 'cyan' | 'purple' | 'green';
}

const colorConfig = {
  cyan: {
    bg: 'bg-primary/15',
    text: 'text-primary',
    glow: 'bg-primary',
    hoverBorder: 'hover:border-primary/50',
    hoverShadow: 'hover:shadow-[0_16px_48px_rgba(0,217,217,0.25)]',
  },
  purple: {
    bg: 'bg-violet-500/15',
    text: 'text-violet-400',
    glow: 'bg-violet-500',
    hoverBorder: 'hover:border-violet-400/50',
    hoverShadow: 'hover:shadow-[0_16px_48px_rgba(167,139,250,0.25)]',
  },
  green: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    glow: 'bg-emerald-500',
    hoverBorder: 'hover:border-emerald-400/50',
    hoverShadow: 'hover:shadow-[0_16px_48px_rgba(34,197,94,0.25)]',
  },
};

const StatBlock = ({ icon: Icon, targetNumber, displayText, suffix = '', label, delay, colorVariant }: StatBlockProps) => {
  const count = useCountUp(targetNumber ?? 0, 2000);
  const colors = colorConfig[colorVariant];
  
  return (
    <div 
      className={`group flex flex-col items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-10 py-8 min-w-[200px] w-full sm:w-auto transition-all duration-300 hover:-translate-y-2 hover:bg-white/8 ${colors.hoverBorder} ${colors.hoverShadow} animate-fade-in`}
      style={{ animationDelay: delay }}
      role="group"
      aria-label={`${targetNumber ? count.toLocaleString() : displayText} ${label}`}
    >
      {/* Icon with colored glow */}
      <div className={`relative p-3 rounded-full ${colors.bg}`}>
        <Icon className={`w-12 h-12 ${colors.text} group-hover:scale-110 transition-transform duration-300`} />
        <div className={`absolute inset-0 rounded-full blur-xl opacity-30 ${colors.glow}`} />
      </div>
      
      {/* Number with count-up animation */}
      <span className="text-5xl font-extrabold text-white leading-tight group-hover:text-primary transition-colors duration-300 drop-shadow-[0_2px_4px_rgba(255,255,255,0.1)]">
        {targetNumber !== null ? count.toLocaleString() : displayText}{suffix}
      </span>
      
      {/* Label */}
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
};

const HeroSection = ({ searchTerm, onSearchChange, filamentCount, brandCount, compatibleCount }: HeroSectionProps) => {
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already connected via onSearchChange - this just prevents form submission
  };

  return (
    <section className="relative overflow-x-clip border-b border-border">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-background" />
      
      {/* Optional: Subtle geometric background element */}
      <div 
        className="absolute -top-24 -right-24 w-[400px] h-[400px] opacity-[0.06] pointer-events-none rotate-[15deg]"
        style={{
          background: "conic-gradient(from 0deg, hsl(var(--primary)), hsl(280 70% 60%), hsl(340 75% 55%), hsl(45 90% 55%), hsl(160 80% 45%), hsl(200 80% 50%), hsl(var(--primary)))",
          borderRadius: "50%",
        }}
      />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20 lg:py-24">
        <div className="flex flex-col items-center text-center">
          
          {/* Headline */}
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-bold tracking-tight leading-[1.1] mb-8 animate-fade-in"
            style={{ letterSpacing: "-0.02em" }}
          >
            Find Your{" "}
            <span className="text-primary">Perfect</span>{" "}
            Filament
          </h1>
          
          {/* Stat Blocks */}
          <div className="flex flex-col sm:flex-row justify-center items-stretch gap-4 sm:gap-6 lg:gap-12 mb-12 w-full sm:w-auto">
            <StatBlock 
              icon={Layers} 
              targetNumber={filamentCount}
              label="Filaments" 
              delay="0.2s"
              colorVariant="cyan"
            />
            <StatBlock 
              icon={Building2} 
              targetNumber={brandCount}
              suffix="+"
              label="Brands" 
              delay="0.3s"
              colorVariant="purple"
            />
            <StatBlock 
              icon={TrendingUp} 
              targetNumber={null}
              displayText="Real-Time"
              label="Pricing" 
              delay="0.4s"
              colorVariant="green"
            />
          </div>
          
          {/* Search Bar */}
          <form 
            onSubmit={handleSearchSubmit}
            className="w-full max-w-[700px] mb-6 animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            <div 
              className={`relative transition-all duration-300 ${
                isFocused ? "scale-[1.01]" : ""
              }`}
            >
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 z-10" />
              <input
                type="text"
                placeholder="Search by brand, material, or color..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`w-full h-16 pl-14 pr-44 text-lg bg-[#1A1D23] text-white placeholder:text-slate-500 rounded-2xl border transition-all duration-300 outline-none ${
                  isFocused 
                    ? "border-[#00CFE8] shadow-[0_0_12px_rgba(0,207,232,0.4)]" 
                    : "border-white/10"
                }`}
                aria-label="Search filaments by brand, material, or color"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-40 bg-gradient-to-r from-primary to-[hsl(180_70%_40%)] hover:from-[hsl(180_100%_47%)] hover:to-[hsl(180_70%_45%)] text-slate-900 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(0,217,217,0.3)]"
                aria-label="Submit search"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </form>

          {/* Prominent Printer Selector */}
          <div 
            className="w-full mb-4 animate-fade-in"
            style={{ animationDelay: "0.55s" }}
          >
            <ProminentPrinterSelector compatibleCount={compatibleCount} />
          </div>
          
          {/* Printer Specs Grid - directly below printer selector */}
          <div 
            className="w-full mb-8 animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            <PrinterSpecsGrid />
          </div>
          
          {/* CTA Button Row */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 w-full sm:w-auto animate-fade-in"
            style={{ animationDelay: "0.65s" }}
          >
            {/* Primary Button - Cyan-to-Blue Gradient */}
            <Button 
              size="lg"
              onClick={() => navigate("/compare")}
              className="w-full sm:w-[220px] h-14 px-10 bg-gradient-to-r from-[hsl(180_100%_50%)] via-[hsl(200_100%_50%)] to-[hsl(220_100%_60%)] text-white hover:from-[hsl(180_100%_55%)] hover:via-[hsl(200_100%_55%)] hover:to-[hsl(220_100%_65%)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200 font-bold text-lg rounded-xl shadow-[0_8px_24px_rgba(0,207,232,0.4)] hover:shadow-[0_12px_32px_rgba(0,207,232,0.5)]"
            >
              Compare Filaments
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            {/* Secondary Button - Ghost with Shimmer Border */}
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/wizard")}
              className="group relative w-full sm:w-[200px] h-[52px] px-6 bg-transparent text-primary hover:text-primary/90 hover:-translate-y-0.5 transition-all duration-200 font-semibold text-base rounded-xl overflow-hidden border-0"
            >
              {/* Animated shimmer border */}
              <span 
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'linear-gradient(90deg, transparent, hsl(180 100% 50%), hsl(280 100% 70%), hsl(180 100% 50%), transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s linear infinite',
                  padding: '1px',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />
              {/* Inner background */}
              <span className="absolute inset-[1px] rounded-[11px] bg-background group-hover:bg-primary/5 transition-colors duration-200" />
              {/* Content */}
              <span className="relative flex items-center">
                <span className="mr-2 text-lg">✨</span>
                Material Wizard
              </span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
