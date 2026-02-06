import { useState, useRef, useEffect } from "react";
import { Search, Sparkles, Building2, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getBrandLogo } from "@/lib/brandLogos";

interface BrandSuggestion {
  name: string;
  count: number;
  logoUrl?: string | null;
}

interface BrandsHeroSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  brandCount: number;
  productCount: number;
  isLoading?: boolean;
  onOpenQuiz?: () => void;
  brandSuggestions?: BrandSuggestion[];
}

const BrandsHeroSection = ({ 
  searchTerm, 
  onSearchChange, 
  brandCount,
  productCount,
  isLoading = false,
  onOpenQuiz,
  brandSuggestions = []
}: BrandsHeroSectionProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show dropdown when typing
  useEffect(() => {
    if (searchTerm.length > 0 && isFocused) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [searchTerm, isFocused]);

  const handleBrandClick = (brandName: string) => {
    setShowDropdown(false);
    navigate(`/brands/${encodeURIComponent(brandName)}`);
  };

  const handleClearSearch = () => {
    onSearchChange("");
    inputRef.current?.focus();
  };

  // Highlight matching text in brand name
  const highlightMatch = (name: string, query: string) => {
    if (!query) return name;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = name.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-primary/30 text-white">{part}</mark> : part
    );
  };

  const topSuggestions = brandSuggestions.slice(0, 5);

  return (
    <section className="relative overflow-hidden">
      {/* Main content */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 pt-20 pb-8 sm:pt-24 sm:pb-10 md:pt-28 md:pb-12 lg:pt-32 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 items-center">
          
          {/* Left: Text Content */}
          <div className="flex flex-col items-start text-left order-1">
            {/* Brand Directory Badge */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-4 sm:mb-6 animate-fade-in"
            >
              <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.15em] text-primary">
                Brand Directory
              </span>
            </div>

            {/* Headline - Responsive sizing */}
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-light tracking-[0.1em] sm:tracking-[0.15em] leading-[1.15] mb-4 sm:mb-6 animate-fade-in uppercase"
            >
              <span className="text-foreground">Discover</span>
              <br />
              <span className="text-muted-foreground font-light">Trusted</span>
              <br />
              <span className="font-black italic text-primary">Brands.</span>
            </h1>
            
            {/* Sub-text */}
            <p 
              className="text-sm sm:text-base md:text-lg text-muted-foreground font-light leading-relaxed mb-6 sm:mb-8 md:mb-10 max-w-[480px] animate-fade-in font-mono"
              style={{ animationDelay: "0.15s" }}
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-8 h-4 bg-primary/20 rounded animate-pulse" /> filament brands tracked with{" "}
                  <span className="inline-block w-12 h-4 bg-primary/20 rounded animate-pulse" /> products.
                </>
              ) : (
                <>
                  <span className="text-primary">{brandCount}</span> filament brands tracked with{" "}
                  <span className="text-primary">{productCount.toLocaleString()}</span> products.
                </>
              )}
              <span className="hidden sm:inline"> Find your perfect manufacturer with live pricing and verified data.</span>
            </p>
            
            {/* Buttons Row - Stack on mobile */}
            <div 
              className="flex flex-col w-full gap-3 sm:flex-row sm:items-start sm:gap-4 sm:w-auto animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              {/* Primary Button - Brand Quiz */}
              <Button 
                size="lg"
                onClick={onOpenQuiz}
                className="h-12 sm:h-14 px-6 sm:px-8 bg-gradient-to-r from-primary via-[hsl(185_100%_45%)] to-[hsl(195_100%_50%)] text-background hover:from-[hsl(180_100%_55%)] hover:via-[hsl(185_100%_50%)] hover:to-[hsl(195_100%_55%)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200 font-bold text-sm sm:text-base rounded-xl shadow-[0_8px_24px_rgba(0,207,232,0.35)] hover:shadow-[0_12px_32px_rgba(0,207,232,0.5)] w-full sm:w-auto"
              >
                <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Find Your Brand
              </Button>
              
              {/* Secondary - Search Input with Dropdown */}
              <div className="relative w-full sm:w-auto">
                <div 
                  className={`relative transition-all duration-300 ${
                    isFocused ? "scale-[1.01]" : ""
                  }`}
                >
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search brands..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                    className={`w-full sm:w-[280px] md:w-[320px] h-12 sm:h-14 pl-11 sm:pl-12 pr-10 text-sm sm:text-base font-mono bg-white/5 backdrop-blur-md text-foreground placeholder:text-muted-foreground rounded-xl border transition-all duration-300 outline-none ${
                      isFocused 
                        ? "border-primary/60 shadow-[0_0_16px_rgba(0,207,232,0.25)]" 
                        : "border-white/10 hover:border-white/20"
                    }`}
                    aria-label="Search brands"
                  />
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Search Dropdown */}
                {showDropdown && topSuggestions.length > 0 && (
                  <div 
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-2">
                      {topSuggestions.map((brand) => {
                        const logoUrl = brand.logoUrl || getBrandLogo(brand.name);
                        return (
                          <button
                            key={brand.name}
                            onClick={() => handleBrandClick(brand.name)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-left group"
                          >
                            {logoUrl ? (
                              <img src={logoUrl} alt="" className="w-8 h-8 object-contain" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {highlightMatch(brand.name, searchTerm)}
                              </p>
                              <p className="text-xs text-gray-400">{brand.count} filaments</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
                          </button>
                        );
                      })}
                    </div>
                    {brandSuggestions.length > 5 && (
                      <div className="border-t border-gray-700 p-2">
                        <button
                          onClick={() => setShowDropdown(false)}
                          className="w-full text-center text-sm text-primary hover:text-primary/80 py-2 transition-colors"
                        >
                          See all {brandSuggestions.length} results
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right: Brand Storefront Visual */}
          <div 
            className="hidden lg:flex justify-end items-center animate-fade-in order-2"
            style={{ animationDelay: "0.4s" }}
          >
            {/* Glass Container with Brand Visual */}
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
              
              {/* Stylized Building/Storefront Visual */}
              <div className="relative w-[260px] h-[260px] flex items-center justify-center" style={{ perspective: "1000px" }}>
                <svg 
                  viewBox="0 0 200 200" 
                  className="w-full h-full"
                  style={{ transform: "rotateX(-15deg) rotateY(-15deg)" }}
                >
                  {/* Base platform */}
                  <polygon 
                    points="100,180 180,150 180,160 100,190 20,160 20,150" 
                    fill="rgba(255,255,255,0.05)" 
                    stroke="rgba(255,255,255,0.2)" 
                    strokeWidth="1"
                  />
                  
                  {/* Main building - front */}
                  <polygon 
                    points="40,140 100,160 100,80 40,60" 
                    fill="rgba(0,207,232,0.08)" 
                    stroke="rgba(0,207,232,0.5)" 
                    strokeWidth="1.5"
                  />
                  
                  {/* Main building - side */}
                  <polygon 
                    points="100,160 160,140 160,60 100,80" 
                    fill="rgba(255,0,85,0.05)" 
                    stroke="rgba(255,0,85,0.4)" 
                    strokeWidth="1"
                  />
                  
                  {/* Main building - top */}
                  <polygon 
                    points="40,60 100,80 160,60 100,40" 
                    fill="rgba(0,207,232,0.05)" 
                    stroke="rgba(0,207,232,0.6)" 
                    strokeWidth="1.5"
                  />
                  
                  {/* Secondary building - front */}
                  <polygon 
                    points="110,160 150,175 150,110 110,95" 
                    fill="rgba(255,255,255,0.03)" 
                    stroke="rgba(255,255,255,0.25)" 
                    strokeWidth="1"
                  />
                  
                  {/* Secondary building - side */}
                  <polygon 
                    points="150,175 175,165 175,100 150,110" 
                    fill="rgba(255,255,255,0.02)" 
                    stroke="rgba(255,255,255,0.15)" 
                    strokeWidth="1"
                  />
                  
                  {/* Window grid on main building */}
                  <line x1="55" y1="75" x2="55" y2="135" stroke="rgba(0,207,232,0.3)" strokeWidth="0.5" />
                  <line x1="70" y1="80" x2="70" y2="140" stroke="rgba(0,207,232,0.3)" strokeWidth="0.5" />
                  <line x1="85" y1="85" x2="85" y2="145" stroke="rgba(0,207,232,0.3)" strokeWidth="0.5" />
                  
                  {/* Horizontal lines */}
                  <line x1="45" y1="90" x2="95" y2="105" stroke="rgba(0,207,232,0.2)" strokeWidth="0.5" />
                  <line x1="45" y1="110" x2="95" y2="125" stroke="rgba(0,207,232,0.2)" strokeWidth="0.5" />
                  
                  {/* Floating brand markers */}
                  <circle cx="60" cy="50" r="4" fill="rgba(0,207,232,0.5)" />
                  <circle cx="140" cy="45" r="3" fill="rgba(255,0,85,0.5)" />
                  <circle cx="170" cy="85" r="2" fill="rgba(255,255,255,0.4)" />
                  
                  {/* Connection lines */}
                  <line x1="60" y1="54" x2="70" y2="70" stroke="rgba(0,207,232,0.3)" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="140" y1="48" x2="130" y2="65" stroke="rgba(255,0,85,0.3)" strokeWidth="0.5" strokeDasharray="2,2" />
                </svg>
                
                {/* Floating Telemetry Tags */}
                <div className="absolute top-4 right-0 font-mono text-[9px] uppercase tracking-wider text-primary/70 bg-primary/5 border border-primary/20 px-2 py-1 rounded">
                  BRANDS_ACTIVE: {isLoading ? "..." : brandCount}
                </div>
                <div className="absolute bottom-8 left-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground bg-white/5 border border-white/10 px-2 py-1 rounded">
                  SYNC_STATUS: {isLoading ? "LOADING" : "OK"}
                </div>
                <div className="absolute top-1/2 right-0 font-mono text-[9px] uppercase tracking-wider text-[#FF0055]/70 bg-[#FF0055]/5 border border-[#FF0055]/20 px-2 py-1 rounded">
                  PRODUCTS: {isLoading ? "..." : productCount.toLocaleString()}
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

export default BrandsHeroSection;
