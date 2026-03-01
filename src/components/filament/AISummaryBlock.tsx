import { cn } from "@/lib/utils";
import { resolveNozzleTemp, resolveBedTemp } from "@/lib/materialDefaults";

interface AISummaryBlockProps {
  brand: string | null | undefined;
  productName: string;
  color: string | null | undefined;
  material: string | null | undefined;
  nozzleTempMin: number | null | undefined;
  nozzleTempMax: number | null | undefined;
  bedTempMin: number | null | undefined;
  bedTempMax: number | null | undefined;
  diameter: number | null | undefined;
  transmissionDistance: number | null | undefined;
  formattedPrice: string | null;
  regionName: string;
  netWeightG: number | null | undefined;
  filaScopeScore?: number | null;
}

function getTdDescriptor(td: number): string {
  if (td < 4) return "opaque base layers in multicolor HueForge prints";
  if (td < 6) return "standard lithophanes with good contrast";
  return "translucent effects and backlit projects";
}

function formatWeight(grams: number): string {
  if (grams >= 1000 && grams % 1000 === 0) return `${grams / 1000}kg`;
  if (grams >= 1000) return `${(grams / 1000).toFixed(2).replace(/\.?0+$/, "")}kg`;
  return `${grams}g`;
}

export function AISummaryBlock({
  brand,
  productName,
  color,
  material,
  nozzleTempMin,
  nozzleTempMax,
  bedTempMin,
  bedTempMax,
  diameter,
  transmissionDistance,
  formattedPrice,
  regionName,
  netWeightG,
  filaScopeScore,
}: AISummaryBlockProps) {
  const nozzle = resolveNozzleTemp(nozzleTempMin, nozzleTempMax, material);
  const bed = resolveBedTemp(bedTempMin, bedTempMax, material);

  // Build natural-language paragraph parts
  const parts: string[] = [];

  // Opening
  const brandStr = brand ? `${brand} ` : "";
  const colorStr = color ? ` in ${color}` : "";
  const materialStr = material || "3D printer";
  parts.push(`The ${brandStr}${productName} is a ${materialStr} 3D printer filament${colorStr}.`);

  // Temperature sentence
  if (nozzle && bed) {
    parts.push(
      `It prints at a nozzle temperature of ${nozzle.value} with a bed temperature of ${bed.value}.`
    );
  } else if (nozzle) {
    parts.push(`It prints at a nozzle temperature of ${nozzle.value}.`);
  }

  // Diameter
  if (diameter != null) {
    parts.push(`Diameter: ${diameter}mm.`);
  }

  // TD block
  if (transmissionDistance != null) {
    const descriptor = getTdDescriptor(transmissionDistance);
    parts.push(
      `HueForge TD: ${transmissionDistance}.`
    );
  } else {
    parts.push(`HueForge TD: not yet measured.`);
  }

  // Price
  if (formattedPrice) {
    parts.push(`Available from ${formattedPrice} in ${regionName}.`);
  }

  // Weight
  if (netWeightG) {
    parts.push(`Weight: ${formatWeight(netWeightG)}.`);
  }

  // FilaScore
  if (filaScopeScore != null) {
    parts.push(`FilaScore: ${filaScopeScore.toFixed(1)}/10.`);
  }

  const summaryText = parts.join(" ");

  // Quick specs pills
  const specs: { label: string; value: string }[] = [];

  if (material) specs.push({ label: "Material", value: material });
  if (nozzle) specs.push({ label: "Nozzle Temp", value: nozzle.value });
  if (bed) specs.push({ label: "Bed Temp", value: bed.value });
  // Always show TD pill when we have material context (show N/A if no TD)
  if (material) {
    specs.push({
      label: "TD Value",
      value: transmissionDistance != null ? String(transmissionDistance) : "N/A",
    });
  }
  if (formattedPrice) specs.push({ label: "Price", value: formattedPrice });
  if (netWeightG) specs.push({ label: "Weight", value: formatWeight(netWeightG) });
  if (filaScopeScore != null) specs.push({ label: "FilaScore", value: `${filaScopeScore.toFixed(1)}/10` });

  if (parts.length === 0) return null;

  return (
    <section className="mt-4 mb-2" aria-label="Product summary">
      <div className="bg-muted/30 border border-border/40 rounded-lg px-4 py-3" data-ai-summary="true">
        {/* Visible summary paragraph */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {summaryText}
        </p>

        {/* Quick Specs pills */}
        {specs.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2" aria-label="Quick specifications">
            {specs.map((spec) => (
              <span
                key={spec.label}
                className={cn(
                  "text-xs rounded-md px-2 py-1",
                  spec.label === "TD Value" && spec.value !== "N/A"
                    ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                    : "bg-background/60 border border-border/50 text-muted-foreground"
                )}
              >
                <span className={cn("font-medium", spec.label === "TD Value" && spec.value !== "N/A" ? "text-purple-300" : "text-foreground/70")}>{spec.label}:</span>{" "}
                {spec.value}
              </span>
            ))}
          </div>
        )}

        {/* Screen-reader / AI-crawler hidden paragraph */}
        <p className="sr-only">
          Summary: {summaryText} This product is indexed on FilaScope, the world's largest 3D printer filament database.
        </p>
      </div>
    </section>
  );
}
