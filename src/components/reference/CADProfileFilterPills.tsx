import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export type ProfileFilter = 'all' | 'beginner' | 'maker' | 'artist' | 'professional';

interface CADProfileFilterPillsProps {
  activeFilter: ProfileFilter;
  onChange: (filter: ProfileFilter) => void;
  onOpenQuiz?: () => void;
}

const filters: { id: ProfileFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'maker', label: 'Maker' },
  { id: 'artist', label: 'Artist' },
  { id: 'professional', label: 'Professional' },
];

export function CADProfileFilterPills({ activeFilter, onChange, onOpenQuiz }: CADProfileFilterPillsProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Filter by your profile:</span>
        <div className="flex gap-2 flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onChange(filter.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                activeFilter === filter.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-800/50 text-muted-foreground border border-gray-700 hover:border-primary/50 hover:text-foreground"
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
  );
}
