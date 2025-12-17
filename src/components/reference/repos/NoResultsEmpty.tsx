import React from 'react';
import { SearchX } from 'lucide-react';
import { useFilters } from '@/contexts/PlatformFilterContext';

const NoResultsEmpty: React.FC = () => {
  const { clearFilters, filteredCount, hasActiveFilters } = useFilters();
  
  if (filteredCount > 0 || !hasActiveFilters) return null;
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 bg-muted/20 border border-dashed border-border/50 rounded-2xl text-center">
      <div className="mb-5 text-muted-foreground">
        <SearchX size={48} />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        No platforms match your filters
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        Try adjusting your filter criteria or clear all filters to see all platforms.
      </p>
      <button
        onClick={clearFilters}
        className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default NoResultsEmpty;
