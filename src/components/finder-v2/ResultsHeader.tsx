import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info } from 'lucide-react';

interface ResultsHeaderProps {
  printerName: string | null;
  materialName: string | null;
  resultCount: number;
  sortValue: string;
  onSortChange: (sort: string) => void;
}

const SORT_OPTIONS = [
  { value: 'best_match', label: 'Best Match', requiresPrinter: true },
  { value: 'recommended', label: 'Recommended', requiresPrinter: false },
  { value: 'price_asc', label: 'Price: Low to High', requiresPrinter: false },
  { value: 'price_desc', label: 'Price: High to Low', requiresPrinter: false },
  { value: 'score_desc', label: 'FilaScore', requiresPrinter: false },
];

export function ResultsHeader({ printerName, materialName, resultCount, sortValue, onSortChange }: ResultsHeaderProps) {
  const isPersonalized = printerName != null;
  const availableSorts = SORT_OPTIONS.filter(o => !o.requiresPrinter || isPersonalized);

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 px-6 pb-2 pt-6 md:px-8">
      <div>
        {isPersonalized ? (
          <h2 className="text-lg font-bold md:text-xl">
            Top picks for <span className="text-primary">{printerName}</span>
            {materialName && <> + <span className="text-purple-500">{materialName}</span></>}
          </h2>
        ) : (
          <h2 className="text-lg font-bold md:text-xl">
            All Filaments — <span className="text-foreground">{resultCount.toLocaleString()}</span> products
          </h2>
        )}
        {isPersonalized && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{resultCount.toLocaleString()} compatible filaments</span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1 text-xs text-primary underline hover:text-primary/80">
                  <Info className="h-3 w-3" /> Why these results?
                </button>
              </PopoverTrigger>
              <PopoverContent className="max-w-xs text-sm">
                <p>Results are ranked by compatibility with your printer's specs (nozzle temp, extruder type, enclosure) and FilaScore quality rating.</p>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
      <select
        value={sortValue}
        onChange={e => onSortChange(e.target.value)}
        className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"
      >
        {availableSorts.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
