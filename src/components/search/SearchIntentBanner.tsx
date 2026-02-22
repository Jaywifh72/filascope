import { Sparkles } from "lucide-react";
import type { SearchIntent } from "@/types/intelligentSearch";

interface SearchIntentBannerProps {
  intent: SearchIntent | null;
  query: string;
  resultCount: number;
  isIntelligentMode: boolean;
}

const SearchIntentBanner = ({
  intent,
  resultCount,
  isIntelligentMode,
}: SearchIntentBannerProps) => {
  if (!isIntelligentMode || !intent?.explanation) return null;

  return (
    <div className="flex items-center gap-3 bg-violet-950/40 border border-violet-800/30 rounded-lg px-4 py-3">
      <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />
      <p className="flex-1 text-sm">
        <span className="text-gray-400">Searching for: </span>
        <span className="text-gray-100">{intent.explanation}</span>
      </p>
      <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs rounded-full px-2.5 py-0.5 whitespace-nowrap">
        {resultCount} results
      </span>
    </div>
  );
};

export default SearchIntentBanner;
