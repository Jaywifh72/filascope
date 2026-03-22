import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { checkMaterialCompatibility, type PrinterSpecsForMaterial } from '@/lib/materialCompatibility';

interface MaterialOption {
  name: string;
  count?: number;
}

interface MaterialSelectProps {
  materials: MaterialOption[];
  selectedMaterial: string | null;
  onSelect: (material: string | null) => void;
  printerSpecs?: PrinterSpecsForMaterial | null;
}

export function MaterialSelect({ materials, selectedMaterial, onSelect, printerSpecs }: MaterialSelectProps) {
  const [open, setOpen] = useState(false);

  const materialsWithCompat = useMemo(() => {
    return materials.map(m => ({
      ...m,
      compat: printerSpecs ? checkMaterialCompatibility(m.name, printerSpecs) : { compatible: true },
    }));
  }, [materials, printerSpecs]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-[220px] justify-between border-2 border-purple-500 bg-card text-left font-semibold"
        >
          <div className="flex items-center gap-2 truncate">
            <FlaskConical className="h-4 w-4 shrink-0 text-purple-500" />
            {selectedMaterial || 'Select material...'}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search materials..." />
          <CommandList>
            <CommandEmpty>No material found.</CommandEmpty>
            <CommandGroup>
              {materialsWithCompat.map(({ name, count, compat }) => {
                const item = (
                  <CommandItem
                    key={name}
                    value={name}
                    disabled={!compat.compatible}
                    onSelect={() => {
                      onSelect(name === selectedMaterial ? null : name);
                      setOpen(false);
                    }}
                    className={cn(!compat.compatible && 'opacity-50')}
                  >
                    <Check className={cn('mr-2 h-4 w-4', selectedMaterial === name ? 'opacity-100' : 'opacity-0')} />
                    <span className="flex-1">{name}</span>
                    {count != null && <span className="text-xs text-muted-foreground">{count}</span>}
                  </CommandItem>
                );

                if (compat.warning) {
                  return (
                    <Tooltip key={name}>
                      <TooltipTrigger asChild>{item}</TooltipTrigger>
                      <TooltipContent side="right"><p className="text-xs">{compat.warning}</p></TooltipContent>
                    </Tooltip>
                  );
                }
                return item;
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
