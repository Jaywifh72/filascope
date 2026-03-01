import { useState, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColorFinderFilament } from '@/hooks/useColorFinderFilaments';
import type { PlannerSlot } from './useProjectPlannerState';

interface Props {
  slot: PlannerSlot;
  index: number;
  filaments: ColorFinderFilament[];
  onSelect: (filamentId: string | null) => void;
}

export function PlannerFilamentSlotPicker({ slot, index, filaments, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const tdFiltered = useMemo(() => {
    let list = filaments.filter((f) => f.transmission_distance != null);
    if (!showAll) {
      list = list.filter((f) => {
        const td = f.transmission_distance!;
        return td >= slot.targetTdMin && td <= slot.targetTdMax;
      });
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.product_title?.toLowerCase().includes(s) ||
          f.vendor?.toLowerCase().includes(s) ||
          f.color_family?.toLowerCase().includes(s)
      );
    }
    return list.slice(0, 50);
  }, [filaments, slot, search, showAll]);

  const selected = useMemo(
    () => filaments.find((f) => f.id === slot.selectedFilamentId) ?? null,
    [filaments, slot.selectedFilamentId]
  );

  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Layer {index + 1}: {slot.role}</h4>
          <p className="text-xs text-muted-foreground">Target TD: {slot.targetTdMin}–{slot.targetTdMax}</p>
        </div>
        {selected && (
          <div className="flex items-center gap-2">
            {selected.color_hex && (
              <span className="w-4 h-4 rounded-full border border-border/50 shrink-0" style={{ backgroundColor: selected.color_hex }} />
            )}
            <Check className="w-4 h-4 text-green-500" />
          </div>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between h-10 text-left font-normal">
            {selected ? (
              <span className="flex items-center gap-2 truncate">
                {selected.color_hex && (
                  <span className="w-4 h-4 rounded-full border shrink-0" style={{ backgroundColor: selected.color_hex }} />
                )}
                <span className="truncate">{selected.vendor} {selected.product_title} — TD {selected.transmission_distance}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Select filament...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search filaments..." value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>
                <div className="space-y-2 p-2">
                  <p className="text-sm">No filaments in TD {slot.targetTdMin}–{slot.targetTdMax}</p>
                  {!showAll && (
                    <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
                      Show all filaments
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {!showAll && tdFiltered.length > 0 && (
                  <CommandItem onSelect={() => setShowAll(true)} className="text-xs text-muted-foreground justify-center">
                    See all options →
                  </CommandItem>
                )}
                {tdFiltered.map((f) => (
                  <CommandItem
                    key={f.id}
                    value={f.id}
                    onSelect={() => {
                      onSelect(f.id === slot.selectedFilamentId ? null : f.id);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check className={cn('h-4 w-4 shrink-0', f.id === slot.selectedFilamentId ? 'opacity-100' : 'opacity-0')} />
                    {f.color_hex && <span className="w-4 h-4 rounded-full border shrink-0" style={{ backgroundColor: f.color_hex }} />}
                    <span className="truncate">{f.vendor} {f.product_title}</span>
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">TD {f.transmission_distance}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
