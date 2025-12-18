import { useSpecialtyFilters } from '@/contexts/SpecialtyFilterContext';

export default function NoResultsState() {
  const { clearFilters } = useSpecialtyFilters();

  return (
    <div className="text-center py-16 px-6">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="text-xl font-bold text-foreground mb-2">
        No tools match your filters
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Try removing some filters or adjusting your criteria
      </p>
      <button
        onClick={clearFilters}
        className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
}
