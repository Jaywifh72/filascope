import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock, X, ArrowUpRight, Package, Tag, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchContext } from "@/hooks/useSearchContext";
import { useSearchSuggestions, SearchSuggestion } from "@/hooks/useSearchSuggestions";
import { SearchSuggestionItemSkeleton } from "@/components/skeletons/SearchSuggestionsSkeleton";
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
  const { suggestions, isLoading, typoCorrection, totalProductGroups } = useSearchSuggestions(value, { context });

  // Filter recent searches to not duplicate current value
  const filteredRecentSearches = recentSearches
    .filter((s) => s.toLowerCase() !== value.toLowerCase())
    .slice(0, 5);

  // Show dropdown when focused and we have content to show
  const hasContent = value.length >= 2 
    ? suggestions.length > 0 
    : filteredRecentSearches.length > 0;

  useEffect(() => {
    setShowDropdown(isFocused && hasContent);
  }, [isFocused, hasContent]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions, filteredRecentSearches, value]);

  // Log zero-result searches to search_logs (feeds search_zero_results view)
  useEffect(() => {
    if (
      value.length >= 2 &&
      !isLoading &&
      (totalProductGroups ?? 1) === 0 &&
      suggestions.length === 0 &&
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
    // Reset tracker when value changes substantially
    if (value.length < 2) {
      zeroResultLoggedRef.current = "";
    }
  }, [value, isLoading, totalProductGroups, suggestions.length]);

  // Get all items for keyboard navigation
  const allItems = value.length >= 2 
    ? suggestions.map((s) => s.value)
    : filteredRecentSearches;

  const handleSelect = useCallback((selectedValue: string, suggestion?: SearchSuggestion) => {
    // If this is a product suggestion with an ID, navigate to detail page
    if (suggestion?.type === "product" && suggestion.id) {
      trackSearch(selectedValue);
      setShowDropdown(false);
      onChange(""); // Clear input after navigation
      
      // Navigate using product_handle or ID
      const slug = suggestion.productHandle || suggestion.id;
      navigate(`/filament/${slug}`);
      return;
    }

    // Color suggestion → navigate to filtered color view
    if (suggestion?.type === "color") {
      trackSearch(selectedValue);
      setShowDropdown(false);
      onChange("");
      navigate(`/filaments?colors=${encodeURIComponent(selectedValue)}`);
      inputRef.current?.blur();
      return;
    }
    
    // For brands, materials, typos, and recent searches - update search input
    onChange(selectedValue);
    trackSearch(selectedValue);
    setShowDropdown(false);
    onSelect?.(selectedValue);
    inputRef.current?.blur();
  }, [navigate, onChange, trackSearch, onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < allItems.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          // Find the corresponding suggestion for keyboard navigation
          const selectedSuggestion = value.length >= 2 
            ? suggestions[selectedIndex] 
            : undefined;
          handleSelect(allItems[selectedIndex], selectedSuggestion);
        } else if (value) {
          trackSearch(value);
          trackGA4Search(value, totalProductGroups ?? 0);
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
  }, [showDropdown, selectedIndex, allItems, value, trackSearch, handleSelect, suggestions]);

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem("filament_search_history");
    setShowDropdown(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case "brand":
        return <Tag className="w-3.5 h-3.5" />;
      case "material":
        return <Package className="w-3.5 h-3.5" />;
      case "product":
        return <ArrowUpRight className="w-3.5 h-3.5" />;
      case "typo":
        return <Sparkles className="w-3.5 h-3.5" />;
      case "color":
        return (
          <div
            className="w-3.5 h-3.5 rounded-full border border-border/50 flex-shrink-0"
            style={{ backgroundColor: suggestion.colorHex || "#888" }}
          />
        );
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="text-primary font-medium">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className={cn("relative w-full", className)} role="search">
      {/* Input - Full width on mobile */}
      <div className="relative w-full">
        <Search className={cn(
          "absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 z-10 transition-colors duration-200",
          isFocused ? "text-primary" : "text-muted-foreground"
        )} />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 150);
          }}
          onKeyDown={handleKeyDown}
          data-search-input="true"
          className={cn(
            "w-full h-12 sm:h-14 pl-10 sm:pl-12 pr-4 text-base bg-white/[0.07] backdrop-blur-md text-foreground",
            "placeholder:text-muted-foreground/60 rounded-xl border transition-all duration-300 outline-none",
            "min-h-[44px] touch-manipulation",
            "shadow-inner shadow-black/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
            isFocused
              ? "border-primary ring-2 ring-primary/20"
              : "border-white/20 hover:border-white/30",
            inputClassName
          )}
          aria-label="Search filaments, brands, and materials. Press forward slash to focus."
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls={showDropdown ? "search-suggestions-list" : undefined}
        />
        {isLoading && value.length >= 2 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="search-suggestions-list"
          className={cn(
            "absolute top-full left-0 right-0 mt-2 z-50",
            "bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-xl",
            "animate-in fade-in-0 slide-in-from-top-2 duration-200",
            "max-h-[400px] overflow-y-auto"
          )}
          role="listbox"
          aria-label="Search suggestions"
        >
          {/* Loading skeleton while fetching suggestions */}
          {isLoading && value.length >= 2 && suggestions.length === 0 && (
            <div className="p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SearchSuggestionItemSkeleton key={i} index={i} />
              ))}
            </div>
          )}

          {/* Suggestions (when typing) */}
          {value.length >= 2 && suggestions.length > 0 && (
            <div className="p-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.value}`}
                  onClick={() => handleSelect(suggestion.value, suggestion)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    selectedIndex === index
                      ? "bg-primary/20 text-foreground"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <span className={cn(
                    "flex-shrink-0",
                    suggestion.type === "typo" ? "text-amber-500" : "text-muted-foreground"
                  )}>
                    {getIcon(suggestion)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm">
                      {highlightMatch(suggestion.displayText, value)}
                    </div>
                    {suggestion.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.subtitle}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {suggestion.variantCount && suggestion.variantCount > 1 && (
                      <span className="text-[10px] text-primary/80 font-medium px-1.5 py-0.5 bg-primary/10 rounded-full whitespace-nowrap">
                        {suggestion.variantCount} variants
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-0.5 bg-muted/50 rounded">
                      {suggestion.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* "See all results" footer */}
          {value.length >= 2 && suggestions.length > 0 && (
            <div className="border-t border-border/50">
              <button
                onClick={() => {
                  trackSearch(value);
                  trackGA4Search(value, totalProductGroups ?? 0);
                  setShowDropdown(false);
                  onSelect?.(value);
                  inputRef.current?.blur();
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors rounded-b-xl"
              >
                <span>
                  See all results for <span className="font-medium text-foreground">"{value}"</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Recent searches (when empty) */}
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
                  onClick={() => handleSelect(search)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    selectedIndex === index
                      ? "bg-primary/20 text-foreground"
                      : "hover:bg-muted/50 text-foreground"
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

          {/* Typo correction hint */}
          {typoCorrection && value.length >= 3 && !suggestions.some(s => s.type === "typo") && (
            <div className="px-4 py-3 border-t border-border/50 bg-amber-500/5">
              <button
                onClick={() => handleSelect(typoCorrection)}
                className="flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Did you mean "<span className="font-medium">{typoCorrection}</span>"?
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchInputWithHistory;
