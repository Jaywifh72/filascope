import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Clock, X, ArrowUpRight, Package, Tag, ChevronRight, Compass, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchContext } from "@/hooks/useSearchContext";
import { useSearchAutocomplete } from "@/hooks/useSearchAutocomplete";
import { SearchCategoryChips, useSmartChipFilters } from "@/components/search/SearchSmartChips";
import { getBrandLogoUrl } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { trackSearch as trackGA4Search } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";

interface SearchInputWithHistoryProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  context?: "filaments" | "printers" | "all";
  className?: string;
  inputClassName?: string;
  onSelect?: (value: string) => void;
}

// ────────────────────────────────────────────────────────────
// Highlight matched characters in text
// ────────────────────────────────────────────────────────────
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-500/20 text-amber-400 font-medium rounded-sm">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function SearchInputWithHistory({
  value,
  onChange,
  placeholder = "Search...",
  context = "filaments",
  className,
  inputClassName,
  onSelect,
}: SearchInputWithHistoryProps) {
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const zeroResultLoggedRef = useRef<string>("");

  const { recentSearches, trackSearch } = useSearchContext();
  const { activeFilters: chipFilters, toggle: toggleChip } = useSmartChipFilters();
  const { materials, brands, filaments, isLoading, hasResults } = useSearchAutocomplete(value, context === "filaments");

  // ── Recent searches ──
  const filteredRecentSearches = recentSearches
    .filter((s) => s.toLowerCase() !== value.toLowerCase())
    .slice(0, 5);

  // ── Build flat item list for keyboard navigation ──
  const allItems = useMemo(() => {
    if (value.length < 2) return filteredRecentSearches.map((s) => ({ type: "recent" as const, key: s }));
    const items: { type: "material" | "brand" | "filament"; key: string; index: number }[] = [];
    materials.forEach((m, i) => items.push({ type: "material", key: m.material, index: i }));
    brands.forEach((b, i) => items.push({ type: "brand", key: b.slug, index: i }));
    filaments.forEach((f, i) => items.push({ type: "filament", key: f.id, index: i }));
    return items;
  }, [value, materials, brands, filaments, filteredRecentSearches]);

  // ── Zero state ──
  const showZeroState = value.length >= 3 && !isLoading && !hasResults;

  // ── Dropdown visibility ──
  const hasContent = value.length >= 2 ? hasResults || showZeroState || isLoading : filteredRecentSearches.length > 0;
  useEffect(() => {
    setShowDropdown(isFocused && hasContent);
  }, [isFocused, hasContent]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [value, materials, brands, filaments]);

  // ── Log zero-result searches ──
  useEffect(() => {
    if (
      value.length >= 2 &&
      !isLoading &&
      !hasResults &&
      zeroResultLoggedRef.current !== value.trim().toLowerCase()
    ) {
      const term = value.trim().toLowerCase();
      zeroResultLoggedRef.current = term;
      const sessionId = sessionStorage.getItem("analytics_session_id") || undefined;
      supabase.from("search_logs").insert({
        search_term: term,
        results_count: 0,
        has_results: false,
        session_id: sessionId ?? null,
        source_page: window.location.pathname,
        created_at: new Date().toISOString(),
      }).then(() => {});
    }
    if (value.length < 2) zeroResultLoggedRef.current = "";
  }, [value, isLoading, hasResults]);

  // ── Selection handler ──
  const handleSelectItem = useCallback(
    (item: (typeof allItems)[number]) => {
      setShowDropdown(false);
      if (item.type === "recent") {
        onChange(item.key);
        trackSearch(item.key);
        onSelect?.(item.key);
        inputRef.current?.blur();
        return;
      }
      if (item.type === "material") {
        const mat = materials[item.index];
        onChange(mat.material);
        trackSearch(mat.material);
        onSelect?.(mat.material);
        inputRef.current?.blur();
        return;
      }
      if (item.type === "brand") {
        const brand = brands[item.index];
        trackSearch(brand.name);
        onChange("");
        navigate(`/brands/${brand.slug}`);
        return;
      }
      if (item.type === "filament") {
        const fil = filaments[item.index];
        trackSearch(fil.name);
        onChange("");
        navigate(`/filament/${fil.slug}`);
        return;
      }
    },
    [materials, brands, filaments, navigate, onChange, trackSearch, onSelect]
  );

  // ── Keyboard navigation ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && allItems[selectedIndex]) {
            handleSelectItem(allItems[selectedIndex]);
          } else if (value) {
            trackSearch(value);
            trackGA4Search(value, 0);
            setShowDropdown(false);
            navigate(`/filaments?search=${encodeURIComponent(value.trim())}`);
            inputRef.current?.blur();
          }
          break;
        case "Escape":
          setShowDropdown(false);
          inputRef.current?.blur();
          break;
      }
    },
    [showDropdown, selectedIndex, allItems, value, trackSearch, handleSelectItem, navigate]
  );

  // ── Click outside ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem("filament_search_history");
    setShowDropdown(false);
  };

  // ── Compute running index offsets for keyboard navigation ──
  const matOffset = 0;
  const brandOffset = materials.length;
  const filOffset = materials.length + brands.length;

  return (
    <div className={cn("relative w-full", className)} role="search">
      {/* Input */}
      <div className="relative w-full">
        <Search
          className={cn(
            "absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 z-10 transition-colors duration-200",
            isFocused ? "text-primary" : "text-muted-foreground"
          )}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onKeyDown={handleKeyDown}
          data-search-input="true"
          className={cn(
            "w-full h-12 sm:h-14 pl-10 sm:pl-12 pr-4 text-base bg-white/[0.07] backdrop-blur-md text-foreground",
            "placeholder:text-muted-foreground/60 rounded-xl border transition-all duration-300 outline-none",
            "min-h-[44px] touch-manipulation",
            "shadow-inner shadow-black/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
            isFocused ? "border-primary ring-2 ring-primary/20" : "border-white/20 hover:border-white/30",
            inputClassName
          )}
          aria-label="Search filaments, brands, and materials. Press forward slash to focus."
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls={showDropdown ? "search-suggestions-list" : undefined}
        />
        {/* Clear search × button */}
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors",
              isLoading && value.length >= 2 ? "right-10" : "right-3"
            )}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && value.length >= 2 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* ── Smart Category Chips ── */}
      <SearchCategoryChips
        query={value}
        activeFilters={chipFilters}
        onToggle={toggleChip}
        className="mt-2"
      />

      {/* ── Dropdown ── */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="search-suggestions-list"
          className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border rounded-lg shadow-lg max-h-[320px] overflow-y-auto animate-in fade-in-0 slide-in-from-top-2 duration-200"
          role="listbox"
          aria-label="Search suggestions"
        >
          {/* ── Loading skeleton ── */}
          {isLoading && value.length >= 2 && !hasResults && (
            <div className="p-2 space-y-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 px-3 flex items-center gap-3 animate-pulse">
                  <div className="w-4 h-4 rounded bg-muted" />
                  <div className="flex-1 h-3.5 rounded bg-muted" style={{ width: `${60 + i * 12}%` }} />
                </div>
              ))}
            </div>
          )}

          {/* ── MATERIALS section ── */}
          {value.length >= 2 && materials.length > 0 && (
            <div>
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Materials
                </span>
              </div>
              {materials.map((mat, i) => {
                const idx = matOffset + i;
                return (
                  <button
                    key={mat.material}
                    onClick={() => handleSelectItem({ type: "material", key: mat.material, index: i })}
                    className={cn(
                      "w-full h-10 px-3 flex items-center gap-3 cursor-pointer transition-colors",
                      selectedIndex === idx ? "bg-accent text-accent-foreground" : "hover:bg-accent"
                    )}
                    role="option"
                    aria-selected={selectedIndex === idx}
                  >
                    <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm truncate">
                      <HighlightMatch text={mat.material} query={value} />
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium px-1.5 py-0.5 bg-muted rounded-full whitespace-nowrap">
                      {mat.count} filaments
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Divider */}
          {value.length >= 2 && materials.length > 0 && (brands.length > 0 || filaments.length > 0) && (
            <div className="mx-3 border-t border-border/50" />
          )}

          {/* ── BRANDS section ── */}
          {value.length >= 2 && brands.length > 0 && (
            <div>
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Brands
                </span>
              </div>
              {brands.map((brand, i) => {
                const idx = brandOffset + i;
                const logoUrl = getBrandLogoUrl(brand.name, 16);
                return (
                  <button
                    key={brand.slug}
                    onClick={() => handleSelectItem({ type: "brand", key: brand.slug, index: i })}
                    className={cn(
                      "w-full h-10 px-3 flex items-center gap-3 cursor-pointer transition-colors",
                      selectedIndex === idx ? "bg-accent text-accent-foreground" : "hover:bg-accent"
                    )}
                    role="option"
                    aria-selected={selectedIndex === idx}
                  >
                    <BrandLogo
                      src={logoUrl || brand.logoUrl}
                      brandName={brand.name}
                      size="sm"
                      className="w-4 h-4"
                    />
                    <span className="flex-1 text-sm truncate">
                      <HighlightMatch text={brand.name} query={value} />
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Divider */}
          {value.length >= 2 && brands.length > 0 && filaments.length > 0 && (
            <div className="mx-3 border-t border-border/50" />
          )}

          {/* ── FILAMENTS section ── */}
          {value.length >= 2 && filaments.length > 0 && (
            <div>
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Filaments
                </span>
              </div>
              {filaments.map((fil, i) => {
                const idx = filOffset + i;
                return (
                  <button
                    key={fil.id}
                    onClick={() => handleSelectItem({ type: "filament", key: fil.id, index: i })}
                    className={cn(
                      "w-full h-10 px-3 flex items-center gap-3 cursor-pointer transition-colors",
                      selectedIndex === idx ? "bg-accent text-accent-foreground" : "hover:bg-accent"
                    )}
                    role="option"
                    aria-selected={selectedIndex === idx}
                  >
                    {/* Color swatch */}
                    <div
                      className="w-3 h-3 rounded-full border border-border/50 flex-shrink-0"
                      style={{ backgroundColor: fil.colorHex || "#888" }}
                    />
                    <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                      <span className="text-sm truncate">
                        <HighlightMatch text={fil.name} query={value} />
                      </span>
                      {fil.vendor && (
                        <span className="text-[11px] text-muted-foreground truncate flex-shrink-0">
                          {fil.vendor}
                        </span>
                      )}
                    </div>
                    {fil.price != null && (
                      <span className="text-xs text-muted-foreground font-medium flex-shrink-0">
                        ${fil.price.toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── "See all results" footer ── */}
          {value.length >= 2 && hasResults && (
            <div className="border-t border-border/50">
              <button
                onClick={() => {
                  trackSearch(value);
                  trackGA4Search(value, 0);
                  setShowDropdown(false);
                  onSelect?.(value);
                  inputRef.current?.blur();
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded-b-lg"
              >
                <span>
                  See all results for <span className="font-medium text-foreground">"{value}"</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Zero state ── */}
          {showZeroState && (
            <div className="p-4 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                No filaments found for "<span className="text-foreground font-medium">{value}</span>".
                Try searching by material type (e.g. TPU, PETG) or brand name.
              </p>
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <Link
                  to="/filaments"
                  onClick={() => setShowDropdown(false)}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Browse all filaments →
                </Link>
                <Link
                  to="/quick-match"
                  onClick={() => setShowDropdown(false)}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Try Quick Match →
                </Link>
              </div>
            </div>
          )}

          {/* ── Recent searches (when empty) ── */}
          {value.length < 2 && filteredRecentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Recent Searches
                </span>
                <button
                  onClick={handleClearRecent}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              </div>
              {filteredRecentSearches.map((search, index) => (
                <button
                  key={search}
                  onClick={() => handleSelectItem({ type: "recent", key: search })}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    selectedIndex === index
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent text-foreground"
                  )}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{search}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchInputWithHistory;
