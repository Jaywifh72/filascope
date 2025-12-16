import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Printer,
  ChevronRight,
  Star,
  HelpCircle,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSmartPrinterDetection } from "@/hooks/useSmartPrinterDetection";
import { useMultiplePrinters } from "@/hooks/useMultiplePrinters";
import { SmartDetectionBanner } from "@/components/filters/SmartDetectionBanner";
import { GuidedPrinterWizard } from "@/components/filters/GuidedPrinterWizard";

interface PrinterSelectorDropdownProps {
  onClose: () => void;
  onSelect: (printerId: string, brand: string, modelName: string) => void;
  onSelectGeneric: (profileType: string) => void;
  currentPrinterId?: string;
}

const POPULAR_PRINTERS = [
  { printer_id: "bambu-lab-p1s", display: "Bambu Lab P1S" },
  { printer_id: "bambu-lab-a1", display: "Bambu Lab A1" },
  { printer_id: "bambu-lab-x1-carbon", display: "Bambu Lab X1 Carbon" },
  { printer_id: "prusa-mk4s", display: "Prusa MK4S" },
  { printer_id: "creality-k1c", display: "Creality K1C" },
  { printer_id: "elegoo-neptune-4-pro", display: "Elegoo Neptune 4 Pro" },
];

const GENERIC_PROFILES = [
  { id: "direct-drive-all-metal", name: "Direct Drive (All Metal)", description: "300°C+ capable", icon: "🔥" },
  { id: "direct-drive-standard", name: "Direct Drive (Standard)", description: "Up to 260°C", icon: "⚙️" },
  { id: "bowden-standard", name: "Bowden Setup", description: "PLA/PETG focused", icon: "📏" },
  { id: "corexy-enclosed", name: "CoreXY Enclosed", description: "ABS/ASA capable", icon: "📦" },
];

const TOP_BRANDS = ["Bambu Lab", "Prusa Research", "Creality", "Anycubic", "Elegoo", "QIDI", "Sovol", "FlashForge"];

export function PrinterSelectorDropdown({
  onClose,
  onSelect,
  onSelectGeneric,
  currentPrinterId,
}: PrinterSelectorDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string | null>(null);
  const [showGenericProfiles, setShowGenericProfiles] = useState(false);
  const [showGuidedWizard, setShowGuidedWizard] = useState(false);
  const [dismissedDetection, setDismissedDetection] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { detection, hasDetection } = useSmartPrinterDetection();
  const { addPrinter } = useMultiplePrinters();

  // Focus search on mount
  useEffect(() => {
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

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

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const { data: allPrinters } = useQuery({
    queryKey: ["all-printers-for-search"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printers")
        .select(`printer_id, model_name, brand:printer_brands(brand)`)
        .in("status", ["active", "pending"])
        .order("model_name");
      if (error) throw error;
      return data as Array<{ printer_id: string; model_name: string; brand: { brand: string } | null }>;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["printer-brands-modal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("printer_brands").select("brand").order("brand");
      if (error) throw error;
      return data.map((b) => b.brand);
    },
  });

  const filteredPrinters = useMemo(() => {
    if (!allPrinters) return [];
    let filtered = allPrinters;

    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.model_name.toLowerCase().includes(query) || p.brand?.brand.toLowerCase().includes(query)
      );
    } else if (selectedBrandFilter) {
      filtered = filtered.filter((p) => p.brand?.brand === selectedBrandFilter);
    } else {
      return [];
    }

    return filtered.slice(0, 20);
  }, [allPrinters, searchQuery, selectedBrandFilter]);

  const sortedBrands = useMemo(() => {
    if (!brands) return [];
    const topSet = new Set(TOP_BRANDS);
    const top = TOP_BRANDS.filter((b) => brands.includes(b));
    const others = brands.filter((b) => !topSet.has(b)).sort();
    return [...top, ...others];
  }, [brands]);

  const handleSelectPrinter = (printer: { printer_id: string; model_name: string; brand: { brand: string } | null }) => {
    onSelect(printer.printer_id, printer.brand?.brand || "", printer.model_name);
    onClose();
  };

  const handleSelectGeneric = (profileId: string) => {
    onSelectGeneric(profileId);
    onClose();
  };

  const handleConfirmDetection = () => {
    if (detection) {
      addPrinter({ printerId: detection.printerId });
      onSelect(detection.printerId, detection.brand, detection.modelName);
      onClose();
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-[60]",
        "w-[480px] max-w-[90vw] max-h-[520px]",
        "bg-slate-800 border border-primary/30 rounded-2xl",
        "shadow-[0_12px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]",
        "overflow-hidden flex flex-col",
        "animate-dropdown-open"
      )}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.08]">
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
            className="pl-10 h-10 bg-white/[0.05] border-white/[0.1] text-sm"
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
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-5">
          {/* Smart Detection */}
          {hasDetection && detection && !dismissedDetection && !currentPrinterId && !showGuidedWizard && (
            <SmartDetectionBanner
              modelName={detection.modelName}
              brand={detection.brand}
              imageUrl={detection.imageUrl}
              confidence={detection.confidence}
              reason={detection.reason}
              onConfirm={handleConfirmDetection}
              onReject={() => setDismissedDetection(true)}
            />
          )}

          {/* Guided Wizard */}
          {showGuidedWizard && (
            <GuidedPrinterWizard
              onSelect={(printerId, brand, modelName) => {
                addPrinter({ printerId });
                onSelect(printerId, brand, modelName);
                onClose();
              }}
              onBack={() => setShowGuidedWizard(false)}
            />
          )}

          {/* Search Results */}
          {!showGuidedWizard && (searchQuery.length >= 2 || selectedBrandFilter) && filteredPrinters.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {searchQuery ? "Search Results" : `${selectedBrandFilter} Models`}
              </h4>
              <div className="space-y-1">
                {filteredPrinters.map((printer) => (
                  <button
                    key={printer.printer_id}
                    onClick={() => handleSelectPrinter(printer)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-[10px] text-left transition-all",
                      "hover:bg-primary/[0.08]",
                      currentPrinterId === printer.printer_id
                        ? "bg-primary/[0.15] border border-primary/40"
                        : "bg-transparent"
                    )}
                  >
                    <div className="w-14 h-14 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center flex-shrink-0">
                      <Printer className="w-7 h-7 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                        {printer.brand?.brand}
                      </div>
                      <div className="text-[15px] font-semibold text-foreground truncate">{printer.model_name}</div>
                    </div>
                    {currentPrinterId === printer.printer_id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
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
          )}

          {/* No results */}
          {searchQuery.length >= 2 && filteredPrinters.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Printer className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No printers found for "{searchQuery}"</p>
            </div>
          )}

          {/* Default view */}
          {!showGuidedWizard && !searchQuery && !selectedBrandFilter && (
            <>
              {/* Popular */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  Popular Models
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {POPULAR_PRINTERS.map((printer) => (
                    <button
                      key={printer.printer_id}
                      onClick={() => {
                        const found = allPrinters?.find((p) => p.printer_id === printer.printer_id);
                        if (found) handleSelectPrinter(found);
                      }}
                      className={cn(
                        "p-2.5 rounded-lg border text-left transition-all text-sm",
                        "hover:bg-primary/[0.08] hover:border-primary/30",
                        currentPrinterId === printer.printer_id
                          ? "border-primary bg-primary/[0.1]"
                          : "border-white/[0.08] bg-white/[0.02]"
                      )}
                    >
                      <span className="font-medium text-foreground">{printer.display}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Browse by Brand
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {sortedBrands.slice(0, 8).map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrandFilter(brand)}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30 transition-all text-left"
                    >
                      <span className="font-medium text-sm text-foreground truncate">{brand}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Wizard */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuidedWizard(true)}
                className="w-full gap-2 border-white/[0.1]"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                Help me find my printer
              </Button>

              {/* Generic profiles */}
              <div>
                <button
                  onClick={() => setShowGenericProfiles(!showGenericProfiles)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>I don't know my exact model</span>
                  <ChevronRight className={cn("h-4 w-4 transition-transform", showGenericProfiles && "rotate-90")} />
                </button>

                {showGenericProfiles && (
                  <div className="mt-2 grid gap-1.5">
                    {GENERIC_PROFILES.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => handleSelectGeneric(profile.id)}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30 transition-all text-left"
                      >
                        <span className="text-xl">{profile.icon}</span>
                        <div>
                          <div className="font-medium text-sm text-foreground">{profile.name}</div>
                          <div className="text-xs text-muted-foreground">{profile.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
