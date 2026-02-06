import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, FlaskConical, Target, Columns3, Tag, Users, RefreshCw } from "lucide-react";
import SearchInputWithHistory from "@/components/search/SearchInputWithHistory";
import { useDealsCount } from "@/hooks/useDealsCount";

interface HeroSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filamentCount: number;
  brandCount: number;
  compatibleCount: number;
}

const searchSuggestions = [
  "Try 'PETG for outdoor use'",
  "Try 'best budget PLA'",
  "Try 'Bambu Lab filament'",
  "Try 'carbon fiber PETG'",
  "Try 'flexible TPU'",
];

const HeroSection = ({ searchTerm, onSearchChange, filamentCount, brandCount, compatibleCount }: HeroSectionProps) => {
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);

  // Use shared deals count hook for consistency with Deals page
  const { data: dealsData } = useDealsCount();
  const dealsCount = dealsData?.uniqueProducts || 0;

  // Dynamic quick start paths
  const quickStartPaths = useMemo(() => [
    {
      title: "Quick Match",
      description: "Answer 5 questions, get your perfect filament",
      icon: Target,
      href: "/wizard",
      color: "purple",
    },
    {
      title: "Browse Filaments",
      description: `Explore ${filamentCount.toLocaleString()}+ materials`,
      icon: Search,
      href: "#system-config",
      color: "primary",
      isScroll: true,
    },
    {
      title: "Compare Tool",
      description: "Side-by-side specs & properties",
      icon: Columns3,
      href: "/compare",
      color: "blue",
    },
    {
      title: "Today's Deals",
      description: dealsCount > 0 ? `${dealsCount} active deals` : "Best prices right now",
      icon: Tag,
      href: "/deals",
      color: "green",
      hasLiveBadge: true,
    },
  ], [filamentCount, dealsCount]);

  // Cycle through search suggestions - respects reduced motion preference
  useEffect(() => {
    if (searchTerm) return; // Don't cycle when has value
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return; // Don't animate for users who prefer reduced motion
    
    const interval = setInterval(() => {
      setCurrentSuggestionIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [searchTerm]);

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return 'border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 text-primary hover:shadow-primary/10';
      case 'blue':
        return 'border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 hover:shadow-blue-500/10';
      case 'purple':
        return 'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 hover:shadow-purple-500/10';
      case 'green':
        return 'border-green-500/30 hover:border-green-500/60 bg-green-500/5 hover:bg-green-500/10 text-green-400 hover:shadow-green-500/10';
      default:
        return 'border-gray-500/30 hover:border-gray-500/60 bg-gray-500/5 hover:bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <section className="relative overflow-hidden">
      {/* Main content */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 pt-16 pb-6 sm:pt-20 sm:pb-8 md:pt-24 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left: Text Content */}
          <div className="flex flex-col items-start text-left order-1">
            {/* Material Registry Badge */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-5 animate-fade-in"
            >
              <FlaskConical className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-primary">
                Material Registry
              </span>
            </div>

            {/* Headline */}
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-light tracking-[0.12em] leading-[1.1] mb-4 animate-fade-in uppercase"
            >
              <span className="text-foreground">Measure</span>
              <br />
              <span className="text-muted-foreground font-light">Material.</span>
              <br />
              <span className="font-black italic text-primary">Print.</span>
            </h1>
            
            {/* Sub-text with stats */}
            <p 
              className="text-sm md:text-base text-muted-foreground font-light mb-3 max-w-[460px] animate-fade-in font-mono"
              style={{ animationDelay: "0.15s", lineHeight: "1.7" }}
            >
              <span className="text-primary">{filamentCount.toLocaleString()}</span> materials indexed from{" "}
              <span className="text-primary">{brandCount}+</span> manufacturers. 
              Compare properties, specs, and pricing in one unified data hub.
            </p>

            {/* Social proof - Responsive wrap for small screens */}
            <div 
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mb-6 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary/70" />
                <span>Trusted by <span className="text-foreground font-medium">10,000+</span> makers</span>
              </div>
              <span className="text-gray-600 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 text-primary/70" />
                <span>Updated daily from <span className="text-foreground font-medium">15+</span> retailers</span>
              </div>
            </div>
            
            {/* Search Input with History & Suggestions */}
            <div 
              className="w-full max-w-full sm:max-w-[500px] mb-6 animate-fade-in"
              style={{ animationDelay: "0.25s" }}
            >
              <SearchInputWithHistory
                value={searchTerm}
                onChange={onSearchChange}
                placeholder={searchSuggestions[currentSuggestionIndex]}
                context="filaments"
                className="h-12 sm:h-14"
              />
            </div>

            {/* Quick Start Paths - 4 cards */}
            <div 
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full max-w-[600px] animate-fade-in mb-12 sm:mb-16 md:mb-20"
              style={{ animationDelay: "0.35s" }}
            >
              {quickStartPaths.map((path) => {
                const Icon = path.icon;
                const cardClasses = `group relative flex flex-col items-center text-center p-3 sm:p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg min-h-[100px] sm:min-h-[120px] touch-manipulation ${getColorClasses(path.color)}`;
                
                const cardContent = (
                  <>
                    {/* LIVE badge for deals card */}
                    {path.hasLiveBadge && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[8px] font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Live
                      </div>
                    )}
                    <Icon className="h-7 w-7 mb-2 transition-transform group-hover:scale-110" />
                    <span className="text-sm font-medium text-foreground mb-0.5">{path.title}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{path.description}</span>
                  </>
                );
                
                if (path.isScroll) {
                  return (
                    <button
                      key={path.title}
                      onClick={() => {
                        const element = document.getElementById('system-config');
                        if (element) {
                          const headerOffset = 80;
                          const elementPosition = element.getBoundingClientRect().top;
                          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                          // Respect reduced motion preference
                          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                          window.scrollTo({ top: offsetPosition, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
                        }
                      }}
                      className={cardClasses}
                      aria-label={`${path.title}: ${path.description}`}
                    >
                      {cardContent}
                    </button>
                  );
                }
                
                return (
                  <Link
                    key={path.title}
                    to={path.href}
                    className={cardClasses}
                    data-tour={path.title === "Quick Match" ? "quick-match" : undefined}
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Right: Glass Container with 3D Filament Spool Visual - Show on tablet with scaling */}
          <div 
            className="hidden md:flex justify-end items-center animate-fade-in order-2"
            style={{ animationDelay: "0.4s" }}
          >
            {/* Glass Container with Spool Visualization - Responsive scaling */}
            <div 
              className="relative p-6 lg:p-8 rounded-2xl border border-white/10 overflow-hidden md:scale-[0.6] lg:scale-[0.82] origin-center"
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
