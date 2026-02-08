import { useState } from "react";
import { ShoppingCart, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRegion } from "@/contexts/RegionContext";
import { useProjectCost } from "@/hooks/useProjectCost";
import type { Project, ProjectMaterial, ProjectAccessory } from "@/hooks/useProject";
import { toast } from "sonner";

interface ShoppingListGeneratorProps {
  project: Project;
  materials: ProjectMaterial[];
  accessories: ProjectAccessory[];
}

export function ShoppingListGenerator({ project, materials, accessories }: ShoppingListGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { formatPrice } = useRegion();
  const costData = useProjectCost(materials, accessories);

  const generateListText = () => {
    const lines: string[] = [];
    lines.push(`🖨️ ${project.name} — Shopping List`);
    lines.push("");

    materials.forEach((m) => {
      const name = m.filament
        ? `${m.filament.vendor || ""} ${m.filament.product_title}`.trim()
        : "Unknown filament";
      const color = m.filament?.color_hex ? ` (${m.filament.color_hex})` : "";
      const qty = m.quantity_grams
        ? `${m.quantity_grams}g`
        : `${m.quantity_spools || 1} spool${(m.quantity_spools || 1) > 1 ? "s" : ""}`;

      const itemCost = costData.itemizedMaterials.find((im) => im.materialId === m.id);
      const price = itemCost?.totalCost != null ? ` — ${formatPrice(itemCost.totalCost)}` : "";

      lines.push(`□ ${name}${color} — ${qty}${price}`);
    });

    if (accessories.length > 0) {
      lines.push("");
      accessories.forEach((a) => {
        const price = a.price != null ? ` — ${formatPrice(a.price)}` : "";
        lines.push(`□ ${a.name}${price}`);
      });
    }

    lines.push("");
    lines.push(`Total: ${formatPrice(costData.totalCost)}`);

    return lines.join("\n");
  };

  const handleCopy = async () => {
    const text = generateListText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Shopping list copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDownload = () => {
    const text = generateListText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_shopping_list.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Shopping list downloaded");
  };

  const listText = open ? generateListText() : "";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
        disabled={materials.length === 0 && accessories.length === 0}
      >
        <ShoppingCart className="w-4 h-4" />
        Generate Shopping List
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Shopping List
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-lg bg-muted/50 border border-border p-4 font-mono text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
            {listText}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button onClick={handleCopy} className="gap-2">
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
