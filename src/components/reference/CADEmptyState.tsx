import { SearchX, X } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface CADEmptyStateProps {
  onClear: () => void;
}

const CADEmptyState = ({ onClear }: CADEmptyStateProps) => {
  return (
    <EmptyState
      icon={SearchX}
      title="No software matches your filters"
      message="Try adjusting your filter criteria or clear all filters to see all available options."
      action={{ label: 'Clear All Filters', icon: X, onClick: onClear }}
    />
  );
};

export default CADEmptyState;
