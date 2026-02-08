import { useState } from "react";
import { Download, Copy, QrCode, ChevronDown, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SlicerType, SLICERS, getRecommendedSlicer, generateDefaultProfile, formatProfileForSlicer } from "@/lib/slicerMapping";
import { SlicerProfilePreview } from "./SlicerProfilePreview";
import { SlicerSelectionModal } from "./SlicerSelectionModal";
import { SlicerQRCode } from "./SlicerQRCode";
import { useSlicerPreference } from "@/hooks/useSlicerPreference";
import { toast } from "sonner";

interface SlicerActionsProps {
  filament: {
    id: string;
    product_title: string;
    vendor?: string | null;
    material?: string | null;
    nozzle_temp_min_c?: number | null;
    nozzle_temp_max_c?: number | null;
    nozzle_temp_sweetspot_c?: number | null;
    bed_temp_min_c?: number | null;
    bed_temp_max_c?: number | null;
    fan_min_percent?: number | null;
    fan_max_percent?: number | null;
    diameter_nominal_mm?: number | null;
    density_g_cm3?: number | null;
    print_speed_max_mms?: number | null;
  };
  printerBrand?: string | null;
  printerName?: string | null;
}

export function SlicerActions({ filament, printerBrand, printerName }: SlicerActionsProps) {
  const { preference, updatePreference, hasPreference } = useSlicerPreference();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [slicerSelectOpen, setSlicerSelectOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedSlicer, setSelectedSlicer] = useState<SlicerType | null>(null);

  const recommendation = getRecommendedSlicer(printerBrand, preference);
  const activeSlicer = selectedSlicer || recommendation.primary;
  const profile = generateDefaultProfile(filament);

  const handleDownloadClick = () => {
    if (!hasPreference && !printerBrand) {
      setSlicerSelectOpen(true);
    } else {
      setPreviewOpen(true);
    }
  };

  const handleQuickDownload = (slicer: SlicerType) => {
    const content = formatProfileForSlicer(profile, slicer);
    const extension = SLICERS[slicer].extension;
    const filename = `${(filament.product_title || 'filament').replace(/[^a-z0-9]/gi, '_')}${extension}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${SLICERS[slicer].name} profile`);
  };

  const handleCopy = () => {
    const content = formatProfileForSlicer(profile, activeSlicer);
    navigator.clipboard.writeText(content);
    toast.success("Settings copied to clipboard");
  };

  const handleSlicerSelect = (slicer: SlicerType, remember: boolean) => {
    setSelectedSlicer(slicer);
    if (remember) {
      updatePreference(slicer);
    }
    setPreviewOpen(true);
  };

  return (
    <>
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">For Your Slicer</span>

        {(printerBrand || hasPreference) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            {recommendation.isUserPreference ? (
              <>Your preferred slicer: <span className="text-foreground">{SLICERS[recommendation.primary].name}</span></>
            ) : (
              <>Recommended for {printerBrand}: <span className="text-foreground">{SLICERS[recommendation.primary].name}</span></>
            )}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-2",
                  "text-[15px] text-primary",
                  "hover:underline hover:opacity-90",
                  "transition-opacity",
                  "focus:outline-none focus:underline"
                )}
              >
                <Download className="w-4 h-4" />
                <span>Download for {SLICERS[activeSlicer].name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-popover border-border">
              <DropdownMenuItem onClick={handleDownloadClick} className="cursor-pointer">
                <span className="font-medium">Preview & Edit Settings</span>
                <span className="ml-auto text-xs text-muted-foreground">✨</span>
              </DropdownMenuItem>
              <div className="h-px bg-border my-1" />
              {Object.entries(SLICERS).map(([key, slicer]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleQuickDownload(key as SlicerType)}
                  className="cursor-pointer"
                >
                  <span className={cn(
                    "font-medium",
                    key === activeSlicer && "text-primary"
                  )}>
                    {slicer.name}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{slicer.extension}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={handleCopy}
            className={cn(
              "inline-flex items-center gap-2",
              "text-[15px] text-primary",
              "hover:underline hover:opacity-90",
              "transition-opacity",
              "focus:outline-none focus:underline"
            )}
          >
            <Copy className="w-4 h-4" />
            <span>Copy Settings</span>
          </button>

          <button
            onClick={() => setQrOpen(true)}
            className={cn(
              "inline-flex items-center gap-2",
              "text-[15px] text-primary",
              "hover:underline hover:opacity-90",
              "transition-opacity",
              "focus:outline-none focus:underline"
            )}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code</span>
          </button>
        </div>
      </div>

      <SlicerProfilePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        filament={filament}
        slicer={activeSlicer}
        onSlicerChange={setSelectedSlicer}
        printerName={printerName || undefined}
      />

      <SlicerSelectionModal
        open={slicerSelectOpen}
        onOpenChange={setSlicerSelectOpen}
        onSelect={handleSlicerSelect}
        recommendedSlicer={recommendation.primary}
        recommendedReason={recommendation.reason}
      />

      <SlicerQRCode
        open={qrOpen}
        onOpenChange={setQrOpen}
        profile={profile}
        slicer={activeSlicer}
        filamentId={filament.id}
      />
    </>
  );
}
