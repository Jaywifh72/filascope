import { Building2, Palette, LayoutGrid, Cylinder, Heart, SearchX, RotateCcw, X } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

// ── BrandsEmptyState ──
export function BrandsEmptyState({
  searchQuery,
  onClearFilters,
  className,
}: {
  searchQuery?: string;
  onClearFilters: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Building2}
      title={searchQuery ? `No brands found for "${searchQuery}"` : 'No brands found'}
      message="Try searching for a different name or browse all brands by clearing your filters."
      action={{ label: 'Clear Search & Filters', icon: X, onClick: onClearFilters }}
      className={className}
    />
  );
}

// ── ColorFinderEmptyState ──
export function ColorFinderEmptyState({
  onReset,
  className,
}: {
  onReset?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Palette}
      title="No color matches found"
      message="Try picking a different target color or broadening your material and brand filters."
      action={onReset ? { label: 'Reset Filters', icon: RotateCcw, onClick: onReset } : undefined}
      compact
      className={className}
    />
  );
}

// ── BuildPlateEmptyState ──
export function BuildPlateEmptyState({
  onClearFilters,
  className,
}: {
  onClearFilters?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={LayoutGrid}
      title="No build plates match your criteria"
      message="Try adjusting your filters to see more options."
      action={onClearFilters ? { label: 'Clear Filters', icon: X, onClick: onClearFilters } : undefined}
      compact
      className={className}
    />
  );
}

// ── HotendEmptyState ──
export function HotendEmptyState({
  onClearFilters,
  className,
}: {
  onClearFilters?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Cylinder}
      title="No hotends match your criteria"
      message="Try adjusting your filters to see more options."
      action={onClearFilters ? { label: 'Clear Filters', icon: X, onClick: onClearFilters } : undefined}
      compact
      className={className}
    />
  );
}

// ── SharedWishlistEmptyState ──
export function SharedWishlistEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Heart}
      title="This wishlist is empty"
      message="Items added to this wishlist will appear here."
      compact
      className={className}
    />
  );
}

// ── PrinterQuizEmptyState ──
export function PrinterQuizEmptyState({
  onRetake,
  className,
}: {
  onRetake: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={SearchX}
      title="No printers matched your criteria"
      message="Try adjusting your preferences to see more recommendations."
      action={{ label: 'Retake Quiz', icon: RotateCcw, onClick: onRetake }}
      className={className}
    />
  );
}
