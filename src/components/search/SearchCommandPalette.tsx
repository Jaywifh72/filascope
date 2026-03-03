import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock, ArrowRight, Package, Tag, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchContext } from "@/hooks/useSearchContext";
import { useSearchAutocomplete } from "@/hooks/useSearchAutocomplete";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getBrandLogoUrl } from "@/lib/brandLogos";

interface SearchCommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  "silk PLA",
  "PETG outdoor",
  "carbon fiber",
  "TD value 4+",
  "matte black",
  "wood filament",
];

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-primary font-medium rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function SearchCommandPalette({ open, onClose }: SearchCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { recentSearches, trackSearch } = useSearchContext();
  const { materials, brands, filaments, isLoading, hasResults } = useSearchAutocomplete(query, true);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    trackSearch(searchQuery.trim());
    navigate(`/filaments?search=${encodeURIComponent(searchQuery.trim())}`);
    onClose();
  }, [navigate, onClose, trackSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  if (!open) return null;

  const hasQuery = query.trim().length >= 2;
  const showResults = hasQuery && (hasResults || isLoading);
  const showEmpty = hasQuery && !isLoading && !hasResults;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl mx-4 bg-popover border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="flex items-center border-b border-border px-4">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filaments, brands, materials..."
            className="flex-1 h-14 px-3 bg-transparent text-foreground text-base placeholder:text-muted-foreground/50 focus:outline-none"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex ml-2 items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/50 bg-muted/30 border border-border/50 rounded">
            ESC
          </kbd>
        </form>

        {/* Results Area */}
        <div className="max-h-[50vh] overflow-y-auto overscroll-contain">
          {/* Loading */}
          {isLoading && hasQuery && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              Searching...
            </div>
          )}

          {/* No Results */}
          {showEmpty && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No results for "{query}"</p>
              <button
                onClick={() => handleSearch(query)}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Search all filaments →
              </button>
            </div>
          )}

          {/* Search Results */}
          {showResults && !isLoading && (
            <div className="py-2">
              {/* Materials */}
              {materials.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Materials
                  </div>
                  {materials.slice(0, 4).map((mat) => (
                    <button
                      key={mat.material}
                      onClick={() => handleSearch(mat.material)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                    >
                      <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-foreground">
                        <HighlightMatch text={mat.material} query={query} />
                      </span>
                      <span className="text-xs text-muted-foreground">{mat.count} filaments</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Brands */}
              {brands.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Brands
                  </div>
                  {brands.slice(0, 4).map((brand) => (
                    <button
                      key={brand.slug}
                      onClick={() => { navigate(`/brands/${brand.slug}`); onClose(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                    >
                      <BrandLogo
                        src={brand.logoUrl || getBrandLogoUrl(brand.name)}
                        brandName={brand.name}
                        size="sm"
                        className="w-5 h-5 rounded"
                      />
                      <span className="flex-1 text-foreground">
                        <HighlightMatch text={brand.name} query={query} />
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                    </button>
                  ))}
                </div>
              )}

              {/* Filaments */}
              {filaments.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Filaments
                  </div>
                  {filaments.slice(0, 6).map((fil) => (
                    <button
                      key={fil.id}
                      onClick={() => { navigate(`/filament/${fil.slug}`); onClose(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                    >
                      {fil.colorHex ? (
                        <div
                          className="w-5 h-5 rounded-full border border-border shrink-0"
                          style={{ backgroundColor: fil.colorHex.startsWith('#') ? fil.colorHex : `#${fil.colorHex}` }}
                        />
                      ) : (
                        <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-foreground truncate block">
                          <HighlightMatch text={fil.name} query={query} />
                        </span>
                        {fil.vendor && (
                          <span className="text-xs text-muted-foreground">{fil.vendor}</span>
                        )}
                      </div>
                      {fil.price != null && (
                        <span className="text-xs text-muted-foreground">${fil.price.toFixed(2)}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Full search link */}
              <div className="border-t border-border mt-1">
                <button
                  onClick={() => handleSearch(query)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-primary hover:bg-muted/30 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  Search all for "{query}"
                </button>
              </div>
            </div>
          )}

          {/* Default State: Recent + Popular */}
          {!hasQuery && (
            <div className="py-2">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    Recent
                  </div>
                  {recentSearches.slice(0, 5).map((search) => (
                    <button
                      key={search}
                      onClick={() => handleSearch(search)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                      <span className="text-foreground">{search}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  Popular searches
                </div>
                {POPULAR_SEARCHES.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleSearch(search)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                  >
                    <Compass className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    <span className="text-foreground">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
