import { SearchX, X } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useSpecialtyFilters } from '@/contexts/SpecialtyFilterContext';

export default function NoResultsState() {
  const { clearFilters } = useSpecialtyFilters();

  return (
    <EmptyState
      icon={SearchX}
      title="No tools match your filters"
      message="Try removing some filters or adjusting your criteria."
      action={{ label: 'Clear All Filters', icon: X, onClick: clearFilters }}
    />
  );
}
