import { Printer, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/hooks/useCompare';

interface StickyContextBarProps {
  printerName: string | null;
  materialName: string | null;
  resultCount: number;
  isVisible: boolean;
  onChangePrinter: () => void;
}

export function StickyContextBar({ printerName, materialName, resultCount, isVisible, onChangePrinter }: StickyContextBarProps) {
  const { items } = useCompare();
  if (!printerName || !isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-4 py-2.5 backdrop-blur-md" role="status" aria-live="polite">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-xs text-muted-foreground">Showing for:</span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Printer className="h-3 w-3" />{printerName}
          </span>
          {materialName && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-500">
              <FlaskConical className="h-3 w-3" />{materialName}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{resultCount.toLocaleString()} results</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onChangePrinter} className="text-xs">Change Printer</Button>
          {items.length > 0 && (
            <Button variant="outline" size="sm" className="border-primary/50 text-xs text-primary">
              Compare ({items.length}) ▾
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
