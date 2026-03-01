import { useMemo } from "react";
import { useUserPrinterPreference } from "@/hooks/useUserPrinterPreference";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";

export interface CompatibilityResult {
  level: "compatible" | "warning" | "incompatible";
  shortLabel: string; // e.g. "✓ H2C Ready" or "⚠ H2C — Hardened nozzle"
  message: string;    // detailed tooltip text
  modelAbbrev: string; // e.g. "H2C", "P1S", "Ender 3"
}

/** Extract a short model abbreviation from a full printer name */
function getModelAbbrev(printerName: string | null): string {
  if (!printerName) return "";
  // Remove common brand prefixes
  const stripped = printerName
    .replace(/^(Bambu Lab|Creality|Prusa|AnkerMake|Elegoo|Qidi|FlashForge|Sovol|Artillery|Anycubic)\s*/i, "")
    .trim();
  // If what remains is short enough, use it directly
  if (stripped.length <= 8) return stripped;
  // Otherwise take first word
  return stripped.split(/\s+/)[0] || stripped.slice(0, 6);
}

interface FilamentCompat {
  nozzle_temp_min_c?: number | null;
  nozzle_temp_max_c?: number | null;
  bed_temp_min_c?: number | null;
  bed_temp_max_c?: number | null;
  material?: string | null;
  is_nozzle_abrasive?: boolean | null;
}

export function useFilamentCompatibility(filament: FilamentCompat): CompatibilityResult | null {
  const { printerName, nozzleTempMax, bedTempMax, hasEnclosure, hasSavedPrinter } = useUserPrinterPreference();
  const { selectedPrinter } = usePrinterSelection();

  return useMemo(() => {
    // Try logged-in user pref first, fallback to localStorage printer selection
    const effectivePrinterName = printerName || selectedPrinter?.model_name || null;
    const effectiveNozzleMax = nozzleTempMax ?? selectedPrinter?.max_nozzle_temp_c ?? null;
    const effectiveBedMax = bedTempMax ?? selectedPrinter?.bed_max_temp_c ?? null;
    const effectiveEnclosure = hasEnclosure || selectedPrinter?.has_enclosure || false;
    const hasPrinter = hasSavedPrinter || !!selectedPrinter;

    if (!hasPrinter) return null;

    const abbrev = getModelAbbrev(effectivePrinterName);
    const nozzleMin = filament.nozzle_temp_min_c;
    const nozzleMax = filament.nozzle_temp_max_c;
    const bedMin = filament.bed_temp_min_c;
    const needsEnclosure = ["ABS", "ASA", "NYLON", "PC", "PEEK"].some(
      (m) => filament.material?.toUpperCase()?.includes(m)
    );
    const isAbrasive = filament.is_nozzle_abrasive;

    // Check nozzle temp compatibility
    if (nozzleMin && effectiveNozzleMax && nozzleMin > effectiveNozzleMax) {
      const msg = `This filament needs ${nozzleMin}°C minimum nozzle temp, but your ${effectivePrinterName || "printer"} maxes at ${effectiveNozzleMax}°C.`;
      return {
        level: "incompatible",
        shortLabel: `✗ ${abbrev}`,
        message: msg,
        modelAbbrev: abbrev,
      };
    }

    // Check warnings
    const warnings: string[] = [];

    if (needsEnclosure && !effectiveEnclosure) {
      warnings.push("May need an enclosure for best results");
    }
    if (isAbrasive) {
      warnings.push("Hardened nozzle recommended");
    }

    if (warnings.length > 0) {
      return {
        level: "warning",
        shortLabel: `⚠ ${abbrev}`,
        message: `${warnings.join(". ")}. ${nozzleMin && nozzleMax && effectiveNozzleMax ? `Nozzle ${nozzleMin}-${nozzleMax}°C is within your ${effectiveNozzleMax}°C max.` : ""}`.trim(),
        modelAbbrev: abbrev,
      };
    }

    // Fully compatible
    const tempDetail = nozzleMin && nozzleMax && effectiveNozzleMax
      ? `Prints at ${nozzleMin}-${nozzleMax}°C — your ${effectivePrinterName || "printer"} supports up to ${effectiveNozzleMax}°C. ✓ Perfect match.`
      : `Compatible with your ${effectivePrinterName || "printer"}.`;

    return {
      level: "compatible",
      shortLabel: `✓ ${abbrev} Ready`,
      message: tempDetail,
      modelAbbrev: abbrev,
    };
  }, [printerName, nozzleTempMax, bedTempMax, hasEnclosure, hasSavedPrinter, selectedPrinter,
      filament.nozzle_temp_min_c, filament.nozzle_temp_max_c, filament.bed_temp_min_c,
      filament.material, filament.is_nozzle_abrasive]);
}

/** Non-hook version for use in table rows (no hooks per-row) */
export function computeFilamentCompatibility(
  filament: FilamentCompat,
  printer: {
    printerName: string | null;
    nozzleTempMax: number | null;
    bedTempMax: number | null;
    hasEnclosure: boolean;
  }
): CompatibilityResult | null {
  const abbrev = getModelAbbrev(printer.printerName);
  const nozzleMin = filament.nozzle_temp_min_c;
  const nozzleMax = filament.nozzle_temp_max_c;
  const needsEnclosure = ["ABS", "ASA", "NYLON", "PC", "PEEK"].some(
    (m) => filament.material?.toUpperCase()?.includes(m)
  );
  const isAbrasive = filament.is_nozzle_abrasive;

  if (nozzleMin && printer.nozzleTempMax && nozzleMin > printer.nozzleTempMax) {
    return {
      level: "incompatible",
      shortLabel: `✗ ${abbrev}`,
      message: `Needs ${nozzleMin}°C min, your printer maxes at ${printer.nozzleTempMax}°C.`,
      modelAbbrev: abbrev,
    };
  }

  const warnings: string[] = [];
  if (needsEnclosure && !printer.hasEnclosure) warnings.push("May need enclosure");
  if (isAbrasive) warnings.push("Hardened nozzle recommended");

  if (warnings.length > 0) {
    return {
      level: "warning",
      shortLabel: `⚠ ${abbrev}`,
      message: warnings.join(". "),
      modelAbbrev: abbrev,
    };
  }

  return {
    level: "compatible",
    shortLabel: `✓ ${abbrev}`,
    message: nozzleMin && nozzleMax && printer.nozzleTempMax
      ? `${nozzleMin}-${nozzleMax}°C within ${printer.nozzleTempMax}°C max.`
      : "Compatible.",
    modelAbbrev: abbrev,
  };
}
