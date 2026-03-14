import { Search, Loader2, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface IntelligentSearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  isLoading: boolean;
  isIntelligentMode: boolean;
  placeholder?: string;
}

const SUGGESTION_CHIPS = [
  { emoji: "🔥", label: "High heat resistant" },
  { emoji: "🌿", label: "Easy to print" },
  { emoji: "☀️", label: "Outdoor use" },
  { emoji: "🍽️", label: "Food safe" },
  { emoji: "🤸", label: "Flexible / TPU" },
  { emoji: "🎨", label: "HueForge compatible" },
  { emoji: "💪", label: "Functional parts" },
  { emoji: "❄️", label: "No enclosure needed" },
];

const IntelligentSearchBar = ({
  query,
  onQueryChange,
  isLoading,
  isIntelligentMode,
  placeholder = "Ask anything... e.g. 'PLA good in high heat?' or 'flexible filament for phone cases'",
}: IntelligentSearchBarProps) => {
  return (
    <div className="w-full space-y-3">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-28 h-11 bg-background border-border rounded-lg text-foreground placeholder:text-muted-foreground"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isIntelligentMode && (
            <span className="flex items-center gap-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs rounded-full px-2 py-0.5">
              <Sparkles className="h-3 w-3" />
              AI Search
            </span>
          )}
          {query && (
            <button
              onClick={() => onQueryChange("")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestion chips — hidden on mobile to save space, visible on md+ */}
      <div className="hidden md:flex flex-wrap gap-2">
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => onQueryChange(chip.label)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-full px-3 py-1 border border-gray-700 transition-colors"
          >
            {chip.emoji} {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default IntelligentSearchBar;
