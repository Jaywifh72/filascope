import { useState, useMemo, useRef, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TDFilament {
  id: string;
  product_title: string | null;
  vendor: string | null;
  material: string | null;
  color_family: string | null;
  color_hex: string | null;
  transmission_distance: number | null;
  variant_price: number | null;
  net_weight_g: number | null;
  product_handle: string | null;
  featured_image: string | null;
}

interface Props {
  filaments: TDFilament[];
  selectedId: string | null;
  onSelect: (filament: TDFilament | null) => void;
}

export function SubstituteFilamentPicker({ filaments, selectedId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = useMemo(
    () => filaments.find((f) => f.id === selectedId) ?? null,
    [filaments, selectedId]
  );

  const filtered = useMemo(() => {
    if (!search) return filaments.slice(0, 50);
    const s = search.toLowerCase();
    return filaments
      .filter(
        (f) =>
          f.product_title?.toLowerCase().includes(s) ||
          f.vendor?.toLowerCase().includes(s) ||
          f.color_family?.toLowerCase().includes(s)
      )
      .slice(0, 50);
  }, [filaments, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11 text-left font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              {selected.color_hex && (
                <span
                  className="w-4 h-4 rounded-full border shrink-0 inline-block"
                  style={{ backgroundColor: selected.color_hex }}
                />
              )}
              <span className="truncate">
                {selected.vendor} {selected.product_title} — TD {selected.transmission_distance}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select a filament to find substitutes...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, brand, color..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No filaments found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((f) => (
                <CommandItem
                  key={f.id}
                  value={f.id}
                  onSelect={() => {
                    onSelect(f.id === selectedId ? null : f);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn('h-4 w-4 shrink-0', f.id === selectedId ? 'opacity-100' : 'opacity-0')}
                  />
                  {f.color_hex && (
                    <span
                      className="w-4 h-4 rounded-full border shrink-0"
                      style={{ backgroundColor: f.color_hex }}
                    />
                  )}
                  <span className="truncate">
                    {f.vendor} {f.product_title}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">
                    TD {f.transmission_distance}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
