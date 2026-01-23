import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export type ProfileFilter = 'all' | 'beginner' | 'maker' | 'artist' | 'professional';

interface CADProfileFilterPillsProps {
  activeFilter: ProfileFilter;
  onChange: (filter: ProfileFilter) => void;
  onOpenQuiz?: () => void;
}

const filters: { id: ProfileFilter; label: string; subtitle: string }[] = [
  { id: 'all', label: 'All', subtitle: 'Our Top Recommendations' },
  { id: 'beginner', label: 'Beginner', subtitle: 'Best for Beginners' },
  { id: 'maker', label: 'Maker', subtitle: 'Best for Makers' },
  { id: 'artist', label: 'Artist', subtitle: 'Best for Artists' },
  { id: 'professional', label: 'Professional', subtitle: 'Best for Professionals' },
];

export function CADProfileFilterPills({ activeFilter, onChange, onOpenQuiz }: CADProfileFilterPillsProps) {
  const activeFilterData = filters.find(f => f.id === activeFilter);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground">Filter by your profile:</span>
          <div className="flex gap-2 flex-wrap">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onChange(filter.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  activeFilter === filter.id
                    ? "bg-teal-500 text-white shadow-md shadow-teal-500/25"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        
        {onOpenQuiz && (
          <button
            onClick={onOpenQuiz}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Take 90-Second Quiz
          </button>
        )}
      </div>
      
      {/* Contextual subtitle */}
      {activeFilterData && activeFilter !== 'all' && (
        <p className="text-sm text-teal-400 font-medium animate-fade-in">
          {activeFilterData.subtitle}
        </p>
      )}
    </div>
  );
}

export { filters as profileFilters };
