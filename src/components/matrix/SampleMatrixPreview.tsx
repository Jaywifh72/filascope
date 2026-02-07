import { Grid3x3, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SAMPLE_DATA = [
  { material: "PLA", brand: "Bambu Lab", product: "PLA Basic", status: "easy" as const },
  { material: "PLA", brand: "Polymaker", product: "PolyTerra PLA", status: "easy" as const },
  { material: "PETG", brand: "Prusament", product: "PETG", status: "easy" as const },
  { material: "PETG", brand: "Overture", product: "PETG", status: "medium" as const },
  { material: "ABS", brand: "Bambu Lab", product: "ABS", status: "medium" as const },
  { material: "TPU", brand: "NinjaTek", product: "NinjaFlex", status: "hard" as const },
  { material: "ASA", brand: "Polymaker", product: "PolyLite ASA", status: "medium" as const },
  { material: "PA/Nylon", brand: "Bambu Lab", product: "PA6-CF", status: "hard" as const },
];

const STATUS_CONFIG = {
  easy: { label: "Easy", className: "bg-green-600/80 text-green-50" },
  medium: { label: "Medium", className: "bg-yellow-600/80 text-yellow-50" },
  hard: { label: "Hard", className: "bg-orange-600/80 text-orange-50" },
};

export function SampleMatrixPreview() {
  return (
    <div className="relative rounded-xl border border-border overflow-hidden">
      {/* Blur overlay with CTA */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[6px]">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            Select a printer to unlock the full matrix
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            Choose your printer above or pick a popular model to see detailed compatibility ratings for thousands of filaments
          </p>
        </div>
      </div>

      {/* Sample table (blurred behind overlay) */}
      <div className="p-4" aria-hidden="true">
        <div className="flex items-center gap-2 mb-4">
          <Grid3x3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Filament Compatibility — Bambu Lab A1 (Sample)</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Material</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Brand</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Compatibility</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_DATA.map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2.5 px-3">
                    <Badge variant="secondary" className="text-xs">{row.material}</Badge>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{row.brand}</td>
                  <td className="py-2.5 px-3 font-medium">{row.product}</td>
                  <td className="py-2.5 px-3">
                    <Badge className={STATUS_CONFIG[row.status].className}>
                      {STATUS_CONFIG[row.status].label}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
