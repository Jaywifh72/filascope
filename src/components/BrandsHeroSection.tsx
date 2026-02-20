import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Building2, ArrowRight, X, Package, Layers, BadgeCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { toBrandSlug } from "@/utils/brandSlug";

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
  variantCount: number;
  verifiedCount?: number;
  isLoading?: boolean;
  onOpenQuiz?: () => void;
  brandSuggestions?: BrandSuggestion[];
}

const BrandsHeroSection = ({ 
  searchTerm, 
  onSearchChange, 
  brandCount,
  productCount,
  variantCount,
  verifiedCount = 0,
  isLoading = false,
  onOpenQuiz,
  brandSuggestions = []
}: BrandsHeroSectionProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const PLACEHOLDERS = [
    "Try 'flexible TPU'",
    "Search 1,080+ filaments",
    "Find 'Bambu Lab filament'",
    "Try 'high temp PETG'",
    "Search by color or brand",
  ];

  // Rotate placeholders when input is empty and not focused
  useEffect(() => {
    if (searchTerm || isFocused) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [searchTerm, isFocused]);

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
    navigate(`/brands/${toBrandSlug(brandName)}`);
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
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-12 items-center">
          
          {/* Left: Text Content */}
          <div className="flex flex-col items-start text-left">
            {/* Brand Directory Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-3 animate-fade-in">
              <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.15em] text-primary">
                Brand Directory
              </span>
            </div>

            {/* Headline - Compact */}
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-3 animate-fade-in">
              <span className="text-foreground">3D Filament </span>
              <span className="text-primary">Brands</span>
            </h1>
            
            {/* Sub-text - One concise line */}
            <p 
              className="text-sm md:text-base text-muted-foreground leading-relaxed mb-5 max-w-[520px] animate-fade-in"
              style={{ animationDelay: "0.15s" }}
            >
              {isLoading ? (
                <>
                  Compare <span className="inline-block w-8 h-4 bg-primary/20 rounded animate-pulse align-middle" /> filament brands with live pricing across <span className="inline-block w-12 h-4 bg-primary/20 rounded animate-pulse align-middle" />+ products.
                </>
              ) : (
                <>
                  Compare <span className="text-primary font-semibold">{brandCount}</span> filament brands with live pricing across <span className="text-primary font-semibold">{productCount.toLocaleString()}</span>+ products.
                </>
              )}
            </p>
            
            {/* Search + Quiz Row */}
            <div 
              className="flex flex-col w-full gap-3 sm:flex-row sm:items-start sm:gap-3 sm:w-auto animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              {/* Search Input with Dropdown */}
              <div className="relative w-full sm:w-auto">
                <div className={`relative transition-all duration-300 ${isFocused ? "scale-[1.01]" : ""}`}>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={PLACEHOLDERS[placeholderIndex]}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                    className={`w-full sm:min-w-[320px] md:min-w-[360px] h-11 pl-11 sm:pl-12 pr-10 text-sm text-foreground placeholder:text-muted-foreground rounded-xl border transition-all duration-200 outline-none ${
                      isFocused 
                        ? "border-primary/60 ring-2 ring-primary/20 bg-background shadow-[0_0_16px_rgba(0,207,232,0.25)]" 
                        : "border-border-hover ring-1 ring-border/50 bg-muted/30 hover:border-muted-foreground/40 hover:ring-muted-foreground/30"
                    }`}
                    aria-label="Search filaments, brands, and materials"
                    data-search-input="true"
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
                          <a
                            key={brand.name}
                            href={`/brands/${toBrandSlug(brand.name)}`}
                            onClick={(e) => { e.preventDefault(); handleBrandClick(brand.name); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-left group"
                          >
                            <BrandLogo src={logoUrl} brandName={brand.name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {highlightMatch(brand.name, searchTerm)}
                              </p>
                              <p className="text-xs text-gray-400">{brand.count.toLocaleString()} variants</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
                          </a>
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

              {/* Brand Quiz Button */}
              <Button 
                size="lg"
                onClick={onOpenQuiz}
                className="h-11 px-6 bg-gradient-to-r from-primary via-[hsl(185_100%_45%)] to-[hsl(195_100%_50%)] text-background hover:from-[hsl(180_100%_55%)] hover:via-[hsl(185_100%_50%)] hover:to-[hsl(195_100%_55%)] hover:-translate-y-0.5 transition-all duration-200 font-bold text-sm rounded-xl shadow-[0_6px_20px_rgba(0,207,232,0.3)] w-full sm:w-auto"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Find Your Brand
              </Button>
            </div>
          </div>
          
          {/* Right: Compact Stat Pills */}
          <div 
            className="flex flex-row lg:flex-col gap-3 lg:gap-2.5 justify-center lg:justify-start animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center gap-2.5 text-sm">
              <Package className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">
                <span className="text-primary font-bold">{isLoading ? "..." : brandCount}</span> Brands
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Layers className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">
                <span className="text-primary font-bold">{isLoading ? "..." : productCount.toLocaleString()}</span> Products
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <BadgeCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span className="text-muted-foreground">
                <span className="text-emerald-400 font-bold">{isLoading ? "..." : verifiedCount}</span> Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandsHeroSection;
