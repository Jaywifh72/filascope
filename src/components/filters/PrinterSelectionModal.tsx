import { useState, useMemo } from "react";
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
import { SmartDetectionBanner } from "./SmartDetectionBanner";
import { PrinterProfileCard } from "./PrinterProfileCard";
import { GuidedPrinterWizard } from "./GuidedPrinterWizard";
import { CommunityPrinterStats } from "./CommunityPrinterStats";

interface PrinterSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (printerId: string, brand: string, modelName: string) => void;
  onSelectGeneric: (profileType: string) => void;
  currentPrinterId?: string;
}

// Popular printer models for quick selection
const POPULAR_PRINTERS = [
  { printer_id: "bambu-lab-p1s", display: "Bambu Lab P1S" },
  { printer_id: "bambu-lab-a1", display: "Bambu Lab A1" },
  { printer_id: "bambu-lab-x1-carbon", display: "Bambu Lab X1 Carbon" },
  { printer_id: "prusa-mk4s", display: "Prusa MK4S" },
  { printer_id: "creality-k1c", display: "Creality K1C" },
  { printer_id: "elegoo-neptune-4-pro", display: "Elegoo Neptune 4 Pro" },
];

// Generic profiles for users who don't know their model
const GENERIC_PROFILES = [
  {
    id: "direct-drive-all-metal",
    name: "Direct Drive (All Metal Hotend)",
    description: "High temp capable, 300°C+ nozzle",
    icon: "🔥",
  },
  {
    id: "direct-drive-standard",
    name: "Direct Drive (Standard)",
    description: "PTFE lined, up to 260°C",
    icon: "⚙️",
  },
  {
    id: "bowden-standard",
    name: "Bowden Setup",
    description: "Tube-fed extruder, good for PLA/PETG",
    icon: "📏",
  },
  {
    id: "corexy-enclosed",
    name: "CoreXY Enclosed",
    description: "Enclosed chamber, good for ABS/ASA",
    icon: "📦",
  },
];

// Top brands to display
const TOP_BRANDS = [
  "Bambu Lab",
  "Prusa Research",
  "Creality",
  "Anycubic",
  "Elegoo",
  "QIDI",
  "Sovol",
  "FlashForge",
];

export function PrinterSelectionModal({
  open,
  onOpenChange,
  onSelect,
  onSelectGeneric,
  currentPrinterId,
}: PrinterSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string | null>(null);
  const [showGenericProfiles, setShowGenericProfiles] = useState(false);
  const [showGuidedWizard, setShowGuidedWizard] = useState(false);
  const [dismissedDetection, setDismissedDetection] = useState(false);

  const { detection, hasDetection } = useSmartPrinterDetection();
  const { addPrinter } = useMultiplePrinters();

  // Fetch all printers for search (include active and pending so users can select newer models)
  const { data: allPrinters } = useQuery({
    queryKey: ["all-printers-for-search"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printers")
        .select(`
          printer_id,
          model_name,
          brand:printer_brands(brand)
        `)
        .in("status", ["active", "pending"])
        .order("model_name");

      if (error) throw error;
      return data as Array<{
        printer_id: string;
        model_name: string;
        brand: { brand: string } | null;
      }>;
    },
  });

  // Fetch brands
  const { data: brands } = useQuery({
    queryKey: ["printer-brands-modal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_brands")
        .select("brand")
        .order("brand");

      if (error) throw error;
      return data.map((b) => b.brand);
    },
  });

  // Filter printers based on search or brand filter
  const filteredPrinters = useMemo(() => {
    if (!allPrinters) return [];

    let filtered = allPrinters;

    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.model_name.toLowerCase().includes(query) ||
          p.brand?.brand.toLowerCase().includes(query)
      );
      // Limit search results to 30
      return filtered.slice(0, 30);
    } else if (selectedBrandFilter) {
      // Show ALL printers for selected brand (no limit)
      filtered = filtered.filter(
        (p) => p.brand?.brand === selectedBrandFilter
      );
      return filtered;
    } else {
      return [];
    }
  }, [allPrinters, searchQuery, selectedBrandFilter]);

  // Sort brands: top brands first, then alphabetically
  const sortedBrands = useMemo(() => {
    if (!brands) return [];
    const topSet = new Set(TOP_BRANDS);
    const top = TOP_BRANDS.filter((b) => brands.includes(b));
    const others = brands.filter((b) => !topSet.has(b)).sort();
    return [...top, ...others];
  }, [brands]);

  const handleSelectPrinter = (printer: {
    printer_id: string;
    model_name: string;
    brand: { brand: string } | null;
  }) => {
    onSelect(printer.printer_id, printer.brand?.brand || "", printer.model_name);
    onOpenChange(false);
    resetState();
  };

  const handleSelectGeneric = (profileId: string) => {
    onSelectGeneric(profileId);
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setSearchQuery("");
    setSelectedBrandFilter(null);
    setShowGenericProfiles(false);
    setShowGuidedWizard(false);
    setDismissedDetection(false);
  };

  const handleConfirmDetection = () => {
    if (detection) {
      // Add to user's printers
      addPrinter({ printerId: detection.printerId });
      onSelect(detection.printerId, detection.brand, detection.modelName);
      onOpenChange(false);
      resetState();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Printer className="h-5 w-5 text-primary" />
            Select Your Printer
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search printer model..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedBrandFilter(null);
              }}
              className="pl-10 bg-muted/50"
              autoFocus
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

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-6">
            {/* Smart Detection Banner */}
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

            {/* Guided Wizard Mode */}
            {showGuidedWizard && (
              <GuidedPrinterWizard
                onSelect={(printerId, brand, modelName) => {
                  addPrinter({ printerId });
                  onSelect(printerId, brand, modelName);
                  onOpenChange(false);
                  resetState();
                }}
                onBack={() => setShowGuidedWizard(false)}
              />
            )}

            {/* Search Results */}
            {!showGuidedWizard && (searchQuery.length >= 2 || selectedBrandFilter) && filteredPrinters.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {searchQuery ? "Search Results" : `${selectedBrandFilter} Models`}
                </h3>
                <div className="grid gap-2">
                  {filteredPrinters.map((printer) => (
                    <button
                      key={printer.printer_id}
                      onClick={() => handleSelectPrinter(printer)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                        "hover:bg-primary/5 hover:border-primary/30",
                        currentPrinterId === printer.printer_id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-card"
                      )}
                    >
                      <div>
                        <div className="font-medium text-foreground">
                          {printer.model_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {printer.brand?.brand}
                        </div>
                      </div>
                      {currentPrinterId === printer.printer_id && (
                        <Check className="h-5 w-5 text-primary" />
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
              <div className="text-center py-8 text-muted-foreground">
                <Printer className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No printers found for "{searchQuery}"</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            )}

            {/* Default view (no search active) */}
            {!showGuidedWizard && !searchQuery && !selectedBrandFilter && (
              <>
                {/* Popular Models */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    Popular Models
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {POPULAR_PRINTERS.map((printer) => (
                      <button
                        key={printer.printer_id}
                        onClick={() => {
                          const found = allPrinters?.find(
                            (p) => p.printer_id === printer.printer_id
                          );
                          if (found) {
                            handleSelectPrinter(found);
                          }
                        }}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          "hover:bg-primary/5 hover:border-primary/30",
                          currentPrinterId === printer.printer_id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 bg-card"
                        )}
                      >
                        <div className="font-medium text-sm text-foreground">
                          {printer.display}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Browse by Brand */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Browse by Brand
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {sortedBrands.slice(0, 12).map((brand) => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrandFilter(brand)}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-left"
                      >
                        <span className="font-medium text-sm text-foreground truncate">
                          {brand}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                  {sortedBrands.length > 12 && (
                    <div className="mt-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => setSearchQuery(" ")}
                      >
                        View all {sortedBrands.length} brands
                      </Button>
                    </div>
                  )}
                </div>

                {/* Guided wizard trigger */}
                <div className="pt-2 border-t border-border/50">
                  <Button
                    variant="outline"
                    onClick={() => setShowGuidedWizard(true)}
                    className="w-full gap-2 justify-start"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    Help me find my printer (3 questions)
                  </Button>
                </div>

                {/* I don't know my model */}
                <div>
                  <button
                    onClick={() => setShowGenericProfiles(!showGenericProfiles)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>I don't know my exact model</span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        showGenericProfiles && "rotate-90"
                      )}
                    />
                  </button>

                  {showGenericProfiles && (
                    <div className="mt-3 grid gap-2">
                      {GENERIC_PROFILES.map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => handleSelectGeneric(profile.id)}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-left"
                        >
                          <span className="text-2xl">{profile.icon}</span>
                          <div>
                            <div className="font-medium text-sm text-foreground">
                              {profile.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {profile.description}
                            </div>
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
      </DialogContent>
    </Dialog>
  );
}
