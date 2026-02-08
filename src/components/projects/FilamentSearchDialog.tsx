import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Check } from "lucide-react";

interface FilamentSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (filament: {
    id: string;
    product_title: string;
    vendor: string | null;
    material: string | null;
    color_hex: string | null;
    featured_image: string | null;
  }) => void;
  excludeIds?: string[];
}

export function FilamentSearchDialog({
  open,
  onOpenChange,
  onSelect,
  excludeIds = [],
}: FilamentSearchDialogProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = search.trim();

  const { data: results, isLoading } = useQuery({
    queryKey: ["filament-search", debouncedSearch],
    enabled: debouncedSearch.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("id, product_title, vendor, material, color_hex, featured_image")
        .ilike("product_title", `%${debouncedSearch}%`)
        .limit(20);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 30,
  });

  const excludeSet = new Set(excludeIds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Filament to Project</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search filaments by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-1 mt-2">
          {debouncedSearch.length < 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Type at least 2 characters to search
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Searching...</p>
          ) : !results?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No filaments found</p>
          ) : (
            results.map((f) => {
              const isAdded = excludeSet.has(f.id);
              return (
                <button
                  key={f.id}
                  disabled={isAdded}
                  onClick={() => onSelect(f)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                >
                  {/* Color swatch */}
                  <div
                    className="w-8 h-8 rounded-md border border-border shrink-0"
                    style={{ backgroundColor: f.color_hex || "#888" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.product_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.vendor} · {f.material}
                    </p>
                  </div>
                  {isAdded ? (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
