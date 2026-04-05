import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Printer, ChevronRight, X, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PrinterOption, PrinterGroup } from "@/types/printer";

interface PrinterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (printer: PrinterOption) => void;
  currentPrinterId?: string;
}

const TOP_BRANDS = ["Bambu Lab", "Prusa Research", "Creality", "Anycubic", "Elegoo", "QIDI", "Sovol", "FlashForge"];

const POPULAR_PRINTERS: PrinterOption[] = [
  { printer_id: "bambu-lab-p1s", model_name: "P1S", brand: "Bambu Lab", brand_id: "bambu-lab" },
  { printer_id: "bambu-lab-a1", model_name: "A1", brand: "Bambu Lab", brand_id: "bambu-lab" },
  { printer_id: "bambu-lab-x1-carbon", model_name: "X1 Carbon", brand: "Bambu Lab", brand_id: "bambu-lab" },
  { printer_id: "prusa-mk4s", model_name: "MK4S", brand: "Prusa Research", brand_id: "prusa-research" },
  { printer_id: "creality-k1c", model_name: "K1C", brand: "Creality", brand_id: "creality" },
  { printer_id: "elegoo-neptune-4-pro", model_name: "Neptune 4 Pro", brand: "Elegoo", brand_id: "elegoo" },
];

export function PrinterDropdown({
  isOpen,
  onClose,
  onSelect,
  currentPrinterId,
}: PrinterDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const { data: allPrinters } = useQuery({
    queryKey: ["all-printers-for-search"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printers")
        .select("printer_id, model_name, brand:printer_brands(brand), image_url, status")
        .in("status", ["active", "pending"])
        .order("model_name");

      if (error) throw error;
      return data as Array<{
        printer_id: string;
        model_name: string;
        brand: { brand: string } | null;
        image_url: string | null;
        status: string | null;
      }>;
    },
    enabled: isOpen,
  });

  const { data: brands } = useQuery({
    queryKey: ["printer-brands-modal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("printer_brands").select("brand").order("brand");
      if (error) throw error;
      return data.map((b) => b.brand);
    },
    enabled: isOpen,
  });

  const filteredPrinters = useMemo(() => {
    if (!allPrinters) return [];
    let filtered = allPrinters.map((p) => ({
      printer_id: p.printer_id,
      model_name: p.model_name,
      brand: p.brand?.brand || "",
      brand_id: p.brand?.brand?.toLowerCase() || "",
      image_url: p.image_url,
    }));

    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.model_name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query)
      );
      // Limit search results to 30
      return filtered.slice(0, 30);
    } else if (selectedBrandFilter) {
      // Show ALL printers for selected brand
      filtered = filtered.filter((p) => p.brand === selectedBrandFilter);
      return filtered;
    } else {
      return [];
    }
  }, [allPrinters, searchQuery, selectedBrandFilter]);

  const groupedPrinters = useMemo((): PrinterGroup[] => {
    if (searchQuery.length >= 2) {
      // Show search results grouped by brand
      const groups = new Map<string, PrinterOption[]>();
      filteredPrinters.forEach((printer) => {
        if (!groups.has(printer.brand)) {
          groups.set(printer.brand, []);
        }
        groups.get(printer.brand)!.push(printer);
      });
      return Array.from(groups.entries()).map(([brand, printers]) => ({ brand, printers }));
    } else if (selectedBrandFilter) {
      // Show selected brand group
      return [{ brand: selectedBrandFilter, printers: filteredPrinters }];
    } else {
      return [];
    }
  }, [filteredPrinters, searchQuery, selectedBrandFilter]);

  const sortedBrands = useMemo(() => {
    if (!brands) return [];
    const topSet = new Set(TOP_BRANDS);
    const top = TOP_BRANDS.filter((b) => brands.includes(b));
    const others = brands.filter((b) => !topSet.has(b)).sort();
    return [...top, ...others];
  }, [brands]);

  const handleSelectPrinter = (printer: PrinterOption) => {
    onSelect(printer);
    onClose();
    setSearchQuery("");
    setSelectedBrandFilter(null);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute top-[calc(100%+8px)] left-0 md:left-1/2 md:-translate-x-1/2 z-[60]",
        "w-full md:w-[480px] max-w-[90vw] max-h-[520px]",
        "bg-card border border-primary/30 rounded-2xl shadow-2xl",
        "overflow-hidden flex flex-col"
      )}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/10">
        <h3 className="text-base font-semibold text-foreground mb-1">Select Your Printer</h3>
        <p className="text-[13px] text-muted-foreground">Show materials compatible with your 3D printer</p>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search printers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedBrandFilter(null);
            }}
            className="pl-10 h-10 bg-muted/50 border-border"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto max-h-[380px]">
        <div className="p-4 space-y-5">
          {/* Search Results */}
          {!searchQuery && !selectedBrandFilter && (
            <>
              {/* Popular Models */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Popular Models
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {POPULAR_PRINTERS.map((printer) => (
                    <button
                      key={printer.printer_id}
                      onClick={() => handleSelectPrinter(printer)}
                      className={cn(
                        "p-2.5 rounded-lg border text-left transition-all text-sm",
                        "hover:bg-primary/10 hover:border-primary/30",
                        currentPrinterId === printer.printer_id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card"
                      )}
                    >
                      <span className="font-medium text-foreground">{printer.brand}</span>
                      <div className="text-xs text-muted-foreground">{printer.model_name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Browse by Brand */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Browse by Brand
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {sortedBrands.slice(0, 8).map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrandFilter(brand)}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-all text-left"
                    >
                      <span className="font-medium text-sm text-foreground truncate">{brand}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Search Results or Brand Filter Results */}
          {searchQuery.length >= 2 || selectedBrandFilter ? (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {searchQuery ? "Search Results" : selectedBrandFilter}
              </h4>
              {groupedPrinters.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Printer className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    {searchQuery ? `No printers found for "${searchQuery}"` : "No printers available"}
                  </p>
                </div>
              ) : (
                groupedPrinters.map((group) => (
                  <div key={group.brand} className="space-y-1">
                    <div className="px-2 py-1 text-[11px] font-semibold text-primary uppercase tracking-wider">
                      {group.brand}
                    </div>
                    {group.printers.map((printer) => (
                      <button
                        key={printer.printer_id}
                        onClick={() => handleSelectPrinter(printer)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                          "hover:bg-primary/5",
                          currentPrinterId === printer.printer_id
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-transparent border border-transparent"
                        )}
                      >
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Printer className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {printer.model_name}
                          </div>
                          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                            {printer.brand}
                          </div>
                        </div>
                        {currentPrinterId === printer.printer_id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
              {selectedBrandFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBrandFilter(null)}
                  className="mt-2 text-muted-foreground"
                >
                  ← Back to all brands
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
