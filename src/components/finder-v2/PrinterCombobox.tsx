import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';

interface PrinterOption {
  id: string;
  model_name: string;
  brand: string;
  image_url?: string | null;
}

interface PrinterComboboxProps {
  printers: PrinterOption[];
  selectedId: string | null;
  onSelect: (printerId: string | null) => void;
  isLoading?: boolean;
}

export function PrinterCombobox({ printers, selectedId, onSelect, isLoading }: PrinterComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedPrinter = useMemo(
    () => printers.find(p => p.id === selectedId),
    [printers, selectedId]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, PrinterOption[]> = {};
    for (const p of printers) {
      if (!groups[p.brand]) groups[p.brand] = [];
      groups[p.brand].push(p);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [printers]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-[220px] justify-between border-2 border-primary bg-card text-left font-semibold"
        >
          <div className="flex items-center gap-2 truncate">
            <Printer className="h-4 w-4 shrink-0 text-primary" />
            {selectedPrinter ? selectedPrinter.model_name : 'Select your printer...'}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search printers..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Loading printers...' : 'No printer found.'}
            </CommandEmpty>
            {grouped.map(([brand, models]) => (
              <CommandGroup key={brand} heading={brand}>
                {models.map(printer => (
                  <CommandItem
                    key={printer.id}
                    value={`${printer.brand} ${printer.model_name}`}
                    onSelect={() => {
                      onSelect(printer.id === selectedId ? null : printer.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', selectedId === printer.id ? 'opacity-100' : 'opacity-0')} />
                    <div className="flex items-center gap-2">
                      {printer.image_url && (
                        <img src={printer.image_url} alt="" className="h-5 w-5 rounded object-cover" />
                      )}
                      <span>{printer.model_name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
