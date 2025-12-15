import { Printer, Check, AlertTriangle, X, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PrinterSpecs {
  maxNozzleTemp: number | null;
  maxBedTemp: number | null;
  hasEnclosure: boolean | null;
  abrasiveSupport: boolean | null;
}

interface FilamentRequirements {
  nozzle_temp_min_c?: number | null;
  bed_temp_min_c?: number | null;
  is_nozzle_abrasive?: boolean | null;
  material?: string | null;
}

interface CompatibilityResult {
  isCompatible: boolean;
  level: "full" | "partial" | "incompatible";
  warnings: string[];
  requirements: string[];
}

function checkCompatibility(
  filament: FilamentRequirements,
  printer: PrinterSpecs
): CompatibilityResult {
  const warnings: string[] = [];
  const requirements: string[] = [];
  let isCompatible = true;
  let hasWarnings = false;

  // Check nozzle temperature
  if (filament.nozzle_temp_min_c && printer.maxNozzleTemp) {
    if (filament.nozzle_temp_min_c > printer.maxNozzleTemp) {
      isCompatible = false;
      warnings.push(`Requires ${filament.nozzle_temp_min_c}°C nozzle (printer max: ${printer.maxNozzleTemp}°C)`);
    }
  }

  // Check bed temperature
  if (filament.bed_temp_min_c && printer.maxBedTemp) {
    if (filament.bed_temp_min_c > printer.maxBedTemp) {
      hasWarnings = true;
      warnings.push(`Optimal bed temp ${filament.bed_temp_min_c}°C may not be achievable`);
    }
  }

  // Check abrasive materials
  if (filament.is_nozzle_abrasive && printer.abrasiveSupport === false) {
    hasWarnings = true;
    requirements.push("Hardened nozzle recommended");
    warnings.push("This material will wear brass nozzles quickly");
  }

  // Check enclosure for specific materials
  const needsEnclosure = ["ABS", "ASA", "NYLON", "PC", "PEEK"].some(
    (m) => filament.material?.toUpperCase().includes(m)
  );
  if (needsEnclosure && printer.hasEnclosure === false) {
    hasWarnings = true;
    requirements.push("Enclosure recommended");
    warnings.push("Best results with enclosed printer for temperature stability");
  }

  const level = !isCompatible
    ? "incompatible"
    : hasWarnings
    ? "partial"
    : "full";

  return { isCompatible, level, warnings, requirements };
}

interface PrinterCompatibilityIndicatorProps {
  filament: FilamentRequirements;
  printerSpecs: PrinterSpecs | null;
  printerName?: string | null;
  variant?: "badge" | "icon" | "detailed";
}

export function PrinterCompatibilityIndicator({
  filament,
  printerSpecs,
  printerName,
  variant = "icon",
}: PrinterCompatibilityIndicatorProps) {
  // No printer selected
  if (!printerSpecs) {
    return null;
  }

  const result = checkCompatibility(filament, printerSpecs);

  const iconColor =
    result.level === "full"
      ? "text-green-400"
      : result.level === "partial"
      ? "text-amber-400"
      : "text-red-400";

  const bgColor =
    result.level === "full"
      ? "bg-green-500/10 border-green-500/30"
      : result.level === "partial"
      ? "bg-amber-500/10 border-amber-500/30"
      : "bg-red-500/10 border-red-500/30";

  const Icon =
    result.level === "full"
      ? Check
      : result.level === "partial"
      ? AlertTriangle
      : X;

  const label =
    result.level === "full"
      ? "Compatible"
      : result.level === "partial"
      ? "May need adjustments"
      : "Not compatible";

  const content = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Printer className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{printerName || "Your Printer"}</span>
      </div>
      <p className={`text-sm ${iconColor}`}>
        <Icon className="inline mr-1 h-3.5 w-3.5" />
        {label}
      </p>
      {result.warnings.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {result.warnings.map((warning, idx) => (
            <li key={idx} className="flex items-start gap-1">
              <span className="text-amber-400">•</span>
              {warning}
            </li>
          ))}
        </ul>
      )}
      {result.requirements.length > 0 && (
        <div className="pt-1 border-t border-border/50">
          <p className="text-xs font-medium text-foreground/70">Requirements:</p>
          <ul className="text-xs text-muted-foreground">
            {result.requirements.map((req, idx) => (
              <li key={idx}>→ {req}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (variant === "detailed") {
    return (
      <div className={`rounded-lg border p-3 ${bgColor}`}>
        {content}
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`text-xs cursor-help ${bgColor} ${iconColor}`}
            >
              <Icon className="mr-1 h-3 w-3" />
              {result.level === "full"
                ? "Compatible"
                : result.level === "partial"
                ? "Partial"
                : "Incompatible"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[280px]">
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Icon variant (default)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px]">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
