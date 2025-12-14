import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filamentCount: number;
  brandCount: number;
}

const HeroSection = ({ searchTerm, onSearchChange, filamentCount, brandCount }: HeroSectionProps) => {
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);

  // Material badges for the animated spool visual
  const materials = ["PLA", "PETG", "ABS", "TPU", "Nylon", "PC"];
  const materialColors = [
    "hsl(180 100% 50%)", // cyan
    "hsl(160 80% 45%)", // teal
    "hsl(200 80% 50%)", // blue
    "hsl(280 70% 60%)", // purple
    "hsl(45 90% 55%)", // amber
    "hsl(340 75% 55%)", // pink
  ];

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Gradient background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent" />
      
      <div className="relative max-w-[1800px] mx-auto px-4 lg:px-6 py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          
          {/* Left Content - 60% */}
          <div className="flex-1 lg:max-w-[60%] space-y-6 lg:space-y-8 animate-fade-in">
            {/* H1 Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Find Your{" "}
              <span className="text-primary bg-gradient-to-r from-primary to-[hsl(160_80%_45%)] bg-clip-text text-transparent">
                Perfect
              </span>{" "}
              Filament
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl">
              Compare {filamentCount.toLocaleString()} filaments across {brandCount}+ brands with real user scores, 
              material properties, and price tracking
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl">
              <div 
                className={`relative transition-all duration-300 ${
                  isFocused ? "scale-[1.02]" : ""
                }`}
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by brand, material, or color..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className={`h-14 pl-12 pr-4 text-lg bg-card border-2 rounded-xl transition-all duration-300 ${
                    isFocused 
                      ? "border-primary ring-4 ring-primary/20 shadow-[var(--shadow-glow)]" 
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                  aria-label="Search filaments"
                />
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 lg:gap-4">
              <Button 
                size="lg"
                onClick={() => navigate("/compare")}
                className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-200 font-semibold"
              >
                Compare Filaments
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/wizard")}
                className="h-12 px-6 border-2 border-primary text-primary hover:bg-primary/10 hover:scale-105 transition-all duration-200 font-semibold"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Material Wizard
              </Button>
              
              <Button 
                variant="link"
                onClick={() => navigate("/printers")}
                className="h-12 px-4 text-muted-foreground hover:text-primary transition-colors group"
              >
                Browse by Printer
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            {/* Trust Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {filamentCount.toLocaleString()} Filaments
              </span>
              <span className="text-border">•</span>
              <span>{brandCount}+ Brands</span>
              <span className="text-border">•</span>
              <span>Real-time Pricing</span>
            </div>
          </div>
          
          {/* Right Visual - 40% */}
          <div className="flex-1 lg:max-w-[40%] flex items-center justify-center animate-fade-in" style={{ animationDelay: "150ms" }}>
            <div className="relative w-64 h-64 lg:w-80 lg:h-80">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-2xl animate-pulse" />
              
              {/* Spool container */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Animated color ring */}
                <div 
                  className="absolute inset-4 rounded-full border-[12px] lg:border-[16px] animate-[spin_20s_linear_infinite]"
                  style={{
                    borderImage: "conic-gradient(from 0deg, hsl(180 100% 50%), hsl(280 70% 60%), hsl(340 75% 55%), hsl(45 90% 55%), hsl(160 80% 45%), hsl(200 80% 50%), hsl(180 100% 50%)) 1",
                    borderRadius: "50%",
                  }}
                />
                
                {/* Inner spool hub */}
                <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-card border-4 border-border flex items-center justify-center">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-muted border-2 border-border" />
                </div>
                
                {/* Floating material badges */}
                {materials.map((material, index) => {
                  const angle = (index * 60) - 60; // Spread around the circle
                  const radius = 140; // Distance from center
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  const delay = index * 0.5;
                  
                  return (
                    <div
                      key={material}
                      className="absolute px-3 py-1.5 rounded-full text-xs font-semibold bg-card border border-border shadow-lg animate-bounce"
                      style={{
                        left: `calc(50% + ${x}px - 24px)`,
                        top: `calc(50% + ${y}px - 12px)`,
                        animationDelay: `${delay}s`,
                        animationDuration: "3s",
                        color: materialColors[index],
                        borderColor: materialColors[index],
                        boxShadow: `0 0 12px ${materialColors[index]}40`,
                      }}
                    >
                      {material}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
