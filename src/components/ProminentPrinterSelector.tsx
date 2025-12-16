import { useState, useEffect } from "react";
import { Printer, ChevronDown, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { PrinterSelectorDropdown } from "./PrinterSelectorDropdown";
import { toast } from "sonner";

// Generic profile display names
const GENERIC_PROFILE_NAMES: Record<string, string> = {
  "direct-drive-all-metal": "Direct Drive (All Metal)",
  "direct-drive-standard": "Direct Drive (Standard)",
  "bowden-standard": "Bowden Setup",
  "corexy-enclosed": "CoreXY Enclosed",
};

interface ProminentPrinterSelectorProps {
  compatibleCount: number;
}

export function ProminentPrinterSelector({ compatibleCount }: ProminentPrinterSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [countAnimating, setCountAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(compatibleCount);

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

  // First-time user pulse animation
  useEffect(() => {
    if (!hasSelection) {
      const hasSeen = localStorage.getItem("printer_selector_hero_seen");
      if (!hasSeen) {
        setShowPulse(true);
        const timer = setTimeout(() => {
          setShowPulse(false);
          localStorage.setItem("printer_selector_hero_seen", "true");
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [hasSelection]);

  // Animate count changes
  useEffect(() => {
    if (compatibleCount !== prevCount && hasSelection) {
      setCountAnimating(true);
      const timer = setTimeout(() => setCountAnimating(false), 600);
      setPrevCount(compatibleCount);
      return () => clearTimeout(timer);
    }
  }, [compatibleCount, prevCount, hasSelection]);

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
    <div className="relative w-full max-w-[700px] mx-auto">
      {/* Main Selector Container */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-label={`Select your 3D printer. ${printerName ? `Currently selected: ${printerName}. ${compatibleCount} compatible materials.` : "No printer selected"}`}
        aria-expanded={dropdownOpen}
        aria-haspopup="dialog"
        className={cn(
          "w-full flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer",
          "transition-all duration-200 relative",
          hasSelection
            ? [
                "bg-[rgba(0,217,217,0.12)] border-2 border-[rgba(0,217,217,0.4)]",
                "hover:bg-[rgba(0,217,217,0.18)] hover:border-[rgba(0,217,217,0.6)]",
                "hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,217,217,0.2)]",
              ]
            : [
                "bg-[rgba(251,146,60,0.08)] border-2 border-dashed border-[rgba(251,146,60,0.5)]",
                "hover:bg-[rgba(251,146,60,0.12)] hover:border-[rgba(251,146,60,0.7)]",
              ],
          dropdownOpen && [
            hasSelection
              ? "bg-[rgba(0,217,217,0.20)] border-primary shadow-[0_0_0_4px_rgba(0,217,217,0.15)]"
              : "bg-[rgba(251,146,60,0.15)] border-orange-400",
          ],
          showPulse && !hasSelection && "animate-[pulse-glow_2s_ease-in-out_2]"
        )}
        style={{
          boxShadow: hasSelection ? "0 0 30px rgba(0, 217, 217, 0.15)" : undefined,
        }}
      >
        {/* Left - Icon */}
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0",
            hasSelection ? "bg-[rgba(0,217,217,0.2)]" : "bg-[rgba(251,146,60,0.15)]"
          )}
        >
          {hasSelection ? (
            <Printer className="w-7 h-7 text-primary" strokeWidth={2} />
          ) : (
            <AlertCircle className="w-7 h-7 text-orange-400" strokeWidth={2} />
          )}
        </div>

        {/* Center - Info */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0 text-left">
          <span
            className={cn(
              "text-[13px] font-semibold uppercase tracking-[0.05em]",
              hasSelection ? "text-slate-400" : "text-orange-400"
            )}
          >
            {hasSelection ? "Your Printer" : "Select Printer"}
          </span>
          
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={cn(
                "text-lg font-bold leading-tight",
                hasSelection ? "text-white" : "text-orange-400"
              )}
            >
              {printerName || "Choose your printer to see compatible materials"}
            </span>

            {/* Compatible Count Badge - only show when printer selected */}
            {hasSelection && (
              <>
                <div className="w-px h-5 bg-white/20 hidden sm:block" />
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                    "bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)]",
                    countAnimating && "animate-[badge-pulse_0.6s_ease-out]"
                  )}
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-500">
                    {compatibleCount.toLocaleString()} <span className="hidden sm:inline">compatible</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right - Dropdown Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-medium text-primary hidden lg:block">Change</span>
          <ChevronDown
            className={cn(
              "w-6 h-6 text-primary transition-transform duration-200",
              !hasSelection && "text-orange-400",
              dropdownOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <PrinterSelectorDropdown
          onClose={() => setDropdownOpen(false)}
          onSelect={handleSelectPrinter}
          onSelectGeneric={handleSelectGeneric}
          currentPrinterId={selectedPrinter?.printer_id}
        />
      )}
    </div>
  );
}
