import { PrinterCombobox } from './PrinterCombobox';
import { MaterialSelect } from './MaterialSelect';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { PrinterSpecsForMaterial } from '@/lib/materialCompatibility';

interface HeroSelectorProps {
  printers: { id: string; model_name: string; brand: string; image_url?: string | null }[];
  selectedPrinterId: string | null;
  onPrinterSelect: (id: string | null) => void;
  printersLoading?: boolean;
  materials: { name: string; count?: number }[];
  selectedMaterial: string | null;
  onMaterialSelect: (material: string | null) => void;
  printerSpecs?: PrinterSpecsForMaterial | null;
  filamentCount: number;
  brandCount: number;
  onShowResults: () => void;
  onBrowseAll: () => void;
}

export function HeroSelector({
  printers, selectedPrinterId, onPrinterSelect, printersLoading,
  materials, selectedMaterial, onMaterialSelect, printerSpecs,
  filamentCount, brandCount, onShowResults, onBrowseAll,
}: HeroSelectorProps) {
  return (
    <section className="px-6 pb-8 pt-12 text-center md:px-8">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight md:text-4xl">
        Find the <span className="text-primary">right filament</span> in seconds.
      </h1>
      <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
        Compare prices, specs, and compatibility across{' '}
        <span className="font-semibold text-foreground">{filamentCount.toLocaleString()}+</span> filaments from{' '}
        <span className="font-semibold text-foreground">{brandCount}+</span> brands.
      </p>

      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-3">
        <span className="text-sm text-muted-foreground">I have a</span>
        <PrinterCombobox
          printers={printers}
          selectedId={selectedPrinterId}
          onSelect={onPrinterSelect}
          isLoading={printersLoading}
        />
        <span className="text-sm text-muted-foreground">and I need</span>
        <MaterialSelect
          materials={materials}
          selectedMaterial={selectedMaterial}
          onSelect={onMaterialSelect}
          printerSpecs={printerSpecs}
        />
        <Button onClick={onShowResults} size="lg" className="gap-2 font-bold">
          Show Results <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 text-center">
        <span className="text-xs text-muted-foreground">or </span>
        <button onClick={onBrowseAll} className="text-xs text-muted-foreground underline hover:text-foreground">
          browse all filaments without a printer
        </button>
      </div>
    </section>
  );
}
