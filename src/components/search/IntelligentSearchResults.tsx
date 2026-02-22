import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { FilamentSearchResult, SearchIntent } from "@/types/intelligentSearch";
import SearchIntentBanner from "./SearchIntentBanner";
import FilamentMatchCard from "./FilamentMatchCard";

interface IntelligentSearchResultsProps {
  results: FilamentSearchResult[];
  isLoading: boolean;
  isIntelligentMode: boolean;
  query: string;
  intent: SearchIntent | null;
  region?: string;
  onClear: () => void;
}

const IntelligentSearchResults = ({
  results,
  isLoading,
  isIntelligentMode,
  query,
  intent,
  region,
  onClear,
}: IntelligentSearchResultsProps) => {
  if (query.trim().length < 3) return null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <Search className="h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">
          No matches found for &lsquo;{query}&rsquo;
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Try removing material type constraints, or rephrase as a question like
          &ldquo;What&rsquo;s a good filament for outdoor use?&rdquo;
        </p>
        <Button variant="outline" onClick={onClear}>
          Clear Search
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchIntentBanner
        intent={intent}
        query={query}
        resultCount={results.length}
        isIntelligentMode={isIntelligentMode}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((filament) => (
          <FilamentMatchCard
            key={filament.id}
            filament={filament}
            isIntelligentMode={isIntelligentMode}
            region={region}
          />
        ))}
      </div>
    </div>
  );
};

export default IntelligentSearchResults;
