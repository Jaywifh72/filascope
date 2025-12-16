import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Layers, Building2, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProminentPrinterSelector } from "@/components/ProminentPrinterSelector";

interface HeroSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filamentCount: number;
  brandCount: number;
  compatibleCount: number;
}

interface StatBlockProps {
  icon: React.ElementType;
  number: string;
  label: string;
  delay: string;
}

const StatBlock = ({ icon: Icon, number, label, delay }: StatBlockProps) => (
  <div 
    className="group flex flex-col items-center gap-3 bg-white/5 border border-primary/20 rounded-xl px-8 py-6 min-w-[180px] w-full sm:w-auto transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_8px_24px_rgba(0,217,217,0.15)] animate-fade-in"
    style={{ animationDelay: delay }}
    role="group"
    aria-label={`${number} ${label}`}
  >
    <Icon className="w-8 h-8 text-primary" />
    <span className="text-4xl font-bold text-white leading-tight">{number}</span>
    <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

const HeroSection = ({ searchTerm, onSearchChange, filamentCount, brandCount, compatibleCount }: HeroSectionProps) => {
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already connected via onSearchChange - this just prevents form submission
  };

  return (
    <section className="relative overflow-hidden border-b border-border">
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
              number={filamentCount.toLocaleString()} 
              label="Filaments" 
              delay="0.2s"
            />
            <StatBlock 
              icon={Building2} 
              number={`${brandCount}+`} 
              label="Brands" 
              delay="0.3s"
            />
            <StatBlock 
              icon={TrendingUp} 
              number="Real-Time" 
              label="Pricing" 
              delay="0.4s"
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
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
              <input
                type="text"
                placeholder="Search by brand, material, or color..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`w-full h-16 pl-14 pr-44 text-lg bg-white text-slate-800 placeholder:text-slate-400 rounded-2xl border-2 transition-all duration-300 outline-none ${
                  isFocused 
                    ? "border-primary shadow-[0_0_0_4px_rgba(0,217,217,0.1)]" 
                    : "border-transparent"
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

          {/* Prominent Printer Selector - NEW POSITION */}
          <div 
            className="w-full mb-8 animate-fade-in"
            style={{ animationDelay: "0.55s" }}
          >
            <ProminentPrinterSelector compatibleCount={compatibleCount} />
          </div>
          
          {/* CTA Button Row */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            {/* Primary Button */}
            <Button 
              size="lg"
              onClick={() => navigate("/compare")}
              className="w-full sm:w-auto h-12 px-8 bg-primary text-slate-900 hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 font-semibold rounded-xl shadow-[0_4px_12px_rgba(0,217,217,0.25)]"
            >
              Compare Filaments
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            {/* Secondary Button */}
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/wizard")}
              className="w-full sm:w-auto h-12 px-8 bg-transparent border-2 border-primary text-primary hover:bg-primary/10 hover:-translate-y-0.5 transition-all duration-200 font-semibold rounded-xl"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Material Wizard
            </Button>
            
            {/* Tertiary Link */}
            <button 
              onClick={() => navigate("/printers")}
              className="h-12 px-6 text-slate-400 hover:text-white underline underline-offset-4 font-medium transition-colors duration-200"
            >
              Browse by Printer
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
