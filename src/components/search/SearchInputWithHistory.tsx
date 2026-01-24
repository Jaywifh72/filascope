import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Clock, X, ArrowUpRight, Package, Tag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchContext } from "@/hooks/useSearchContext";
import { useSearchSuggestions, SearchSuggestion } from "@/hooks/useSearchSuggestions";
import { SearchSuggestionItemSkeleton } from "@/components/skeletons/SearchSuggestionsSkeleton";

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
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { recentSearches, trackSearch } = useSearchContext();
  const { suggestions, isLoading, typoCorrection } = useSearchSuggestions(value, { context });

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

  // Get all items for keyboard navigation
  const allItems = value.length >= 2 
    ? suggestions.map((s) => s.value)
    : filteredRecentSearches;

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
          handleSelect(allItems[selectedIndex]);
        } else if (value) {
          trackSearch(value);
          setShowDropdown(false);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  }, [showDropdown, selectedIndex, allItems, value, trackSearch]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    trackSearch(selectedValue);
    setShowDropdown(false);
    onSelect?.(selectedValue);
    inputRef.current?.blur();
  };

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

  const getIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "brand":
        return <Tag className="w-3.5 h-3.5" />;
      case "material":
        return <Package className="w-3.5 h-3.5" />;
      case "product":
        return <ArrowUpRight className="w-3.5 h-3.5" />;
      case "typo":
        return <Sparkles className="w-3.5 h-3.5" />;
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
    <div className={cn("relative", className)} role="search">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow click events on dropdown items
            setTimeout(() => setIsFocused(false), 150);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full h-14 pl-12 pr-4 text-base bg-white/5 backdrop-blur-md text-foreground",
            "placeholder:text-muted-foreground/70 rounded-xl border transition-all duration-300 outline-none",
            isFocused
              ? "border-primary/60 shadow-[0_0_20px_rgba(0,207,232,0.3)]"
              : "border-white/15 hover:border-white/25",
            inputClassName
          )}
          aria-label="Search filaments, brands, and materials"
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
                  onClick={() => handleSelect(suggestion.value)}
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
                    {getIcon(suggestion.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">
                      {highlightMatch(suggestion.displayText, value)}
                    </div>
                    {suggestion.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.subtitle}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-0.5 bg-muted/50 rounded">
                    {suggestion.type}
                  </span>
                </button>
              ))}
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
