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
    <section className="mt-1 mb-1" aria-label="Product summary">
      {/* AI-indexable summary — visually hidden but accessible to crawlers and screen readers */}
      <div data-ai-summary="true" className="sr-only">
        <p>{summaryText}</p>
      </div>
    </section>
  );
}
