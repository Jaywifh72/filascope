import { useState, useEffect } from "react";
import { Printer, ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { PrinterSelectorDropdown } from "./PrinterSelectorDropdown";
import { CompatibleCountBadge } from "./CompatibleCountBadge";
import { toast } from "sonner";

// Generic profile display names
const GENERIC_PROFILE_NAMES: Record<string, string> = {
  "direct-drive-all-metal": "Direct Drive (All Metal)",
  "direct-drive-standard": "Direct Drive (Standard)",
  "bowden-standard": "Bowden Setup",
  "corexy-enclosed": "CoreXY Enclosed",
};

interface PrinterSelectorHeaderProps {
  compatibleCount: number;
}

export function PrinterSelectorHeader({ compatibleCount }: PrinterSelectorHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const {
    selectedPrinter,
    selectedBrand,
    setSelectedBrand,
    setSelectedPrinterId,
    genericProfile,
    setGenericProfile,
  } = usePrinterSelection();

  const hasPrinter = selectedPrinter && selectedBrand;
  const hasGenericProfile = !!genericProfile;
  const hasSelection = hasPrinter || hasGenericProfile;

  const printerName = hasPrinter
    ? `${selectedPrinter.brand?.brand || selectedBrand} ${selectedPrinter.model_name}`
    : hasGenericProfile
    ? GENERIC_PROFILE_NAMES[genericProfile] || genericProfile
    : null;

  // First-time user tooltip
  useEffect(() => {
    if (!hasSelection) {
      const hasSeenTooltip = localStorage.getItem("printer_selector_tooltip_seen");
      if (!hasSeenTooltip) {
        const timer = setTimeout(() => setShowTooltip(true), 1000);
        const hideTimer = setTimeout(() => {
          setShowTooltip(false);
          localStorage.setItem("printer_selector_tooltip_seen", "true");
        }, 6000);
        return () => {
          clearTimeout(timer);
          clearTimeout(hideTimer);
        };
      }
    }
  }, [hasSelection]);

  const handleSelectPrinter = (printerId: string, brand: string, modelName: string) => {
    localStorage.removeItem("generic_printer_profile");
    setSelectedBrand(brand);
    setSelectedPrinterId(printerId);
    toast.success(`Now showing materials for ${brand} ${modelName}`);
  };

  const handleSelectGeneric = (profileType: string) => {
    setGenericProfile(profileType);
    const profileName = GENERIC_PROFILE_NAMES[profileType] || profileType;
    toast.success(`Profile set to ${profileName}`);
  };

  return (
    <div className="relative flex items-center gap-3">
      {/* Selector Button */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-label={`Select your 3D printer. ${printerName ? `Currently selected: ${printerName}` : "No printer selected"}`}
        aria-expanded={dropdownOpen}
        aria-haspopup="listbox"
        className={cn(
          "flex items-center gap-3 min-w-[280px] max-w-[420px] px-3 py-2.5 rounded-xl",
          "cursor-pointer transition-all duration-200",
          hasSelection
            ? [
                "bg-primary/[0.08] border-[1.5px] border-primary/30",
                "hover:bg-primary/[0.12] hover:border-primary/50 hover:-translate-y-0.5",
                "hover:shadow-[0_4px_12px_rgba(0,217,217,0.15)]",
              ]
            : [
                "bg-orange-400/[0.08] border-[1.5px] border-dashed border-orange-400/50",
                "hover:bg-orange-400/[0.12] hover:border-orange-400/70",
                "animate-pulse-subtle",
              ],
          dropdownOpen && [
            hasSelection
              ? "bg-primary/[0.15] border-primary shadow-[0_0_0_3px_rgba(0,217,217,0.2)]"
              : "bg-orange-400/[0.15] border-orange-400",
          ]
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0",
            hasSelection ? "bg-primary/[0.15]" : "bg-orange-400/[0.15]"
          )}
        >
          {hasSelection ? (
            <Printer className="w-5 h-5 text-primary" strokeWidth={2} />
          ) : (
            <AlertCircle className="w-5 h-5 text-orange-400" strokeWidth={2} />
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-0 text-left">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.05em]",
              hasSelection ? "text-muted-foreground" : "text-orange-400"
            )}
          >
            {hasSelection ? "Your Printer" : "Select Printer"}
          </span>
          <span
            className={cn(
              "text-[15px] font-semibold leading-tight truncate",
              hasSelection ? "text-foreground" : "text-orange-400"
            )}
          >
            {printerName || "Choose your printer first"}
          </span>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "w-5 h-5 flex-shrink-0 transition-transform duration-200",
            hasSelection ? "text-primary" : "text-orange-400",
            dropdownOpen && "rotate-180"
          )}
        />
      </button>

      {/* Compatible Count Badge - only show when printer selected */}
      {hasSelection && <CompatibleCountBadge count={compatibleCount} />}

      {/* Dropdown */}
      {dropdownOpen && (
        <PrinterSelectorDropdown
          onClose={() => setDropdownOpen(false)}
          onSelect={handleSelectPrinter}
          onSelectGeneric={handleSelectGeneric}
          currentPrinterId={selectedPrinter?.printer_id}
        />
      )}

      {/* First-time tooltip */}
      {showTooltip && !hasSelection && (
        <div
          className={cn(
            "absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50",
            "bg-slate-800 border border-orange-400/50 rounded-lg",
            "px-4 py-3 text-sm text-foreground shadow-lg",
            "animate-fade-in"
          )}
        >
          <div className="flex items-center gap-2">
            <span>👋</span>
            <span>Select your printer to see compatible filaments</span>
          </div>
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 border-l border-t border-orange-400/50 rotate-45" />
        </div>
      )}
    </div>
  );
}
