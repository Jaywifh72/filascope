import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, ExternalLink } from "lucide-react";
import { useProjectMutations, type ProjectMaterial, type PurchaseStatus } from "@/hooks/useProject";
import { useProjectCost } from "@/hooks/useProjectCost";
import { useRegion } from "@/contexts/RegionContext";
import { FilamentSearchDialog } from "./FilamentSearchDialog";

interface ProjectMaterialsProps {
  projectId: string;
  materials: ProjectMaterial[];
  accessories: any[];
}

const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  need_to_buy: "Need to Buy",
  purchased: "Purchased",
  in_use: "In Use",
  done: "Done",
};

const PURCHASE_STATUS_COLORS: Record<PurchaseStatus, string> = {
  need_to_buy: "bg-amber-500/10 text-amber-400",
  purchased: "bg-blue-500/10 text-blue-400",
  in_use: "bg-primary/10 text-primary",
  done: "bg-green-500/10 text-green-400",
};

export function ProjectMaterials({ projectId, materials, accessories }: ProjectMaterialsProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { addMaterial, updateMaterial, removeMaterial } = useProjectMutations();
  const { formatPrice } = useRegion();
  const costData = useProjectCost(materials, accessories);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Materials</h3>
        <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Filament
        </Button>
      </div>

      {!materials.length ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">No filaments added yet</p>
          <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add First Filament
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((m) => {
            const itemCost = costData.itemizedMaterials.find((c) => c.materialId === m.id);
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-muted-foreground/20 transition-colors"
              >
                {/* Color swatch */}
                <div
                  className="w-8 h-8 rounded-md border border-border shrink-0"
                  style={{ backgroundColor: m.filament?.color_hex || "#888" }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {m.filament?.product_handle ? (
                      <Link
                        to={`/filament/${m.filament.product_handle}`}
                        className="text-sm font-medium truncate hover:text-primary transition-colors"
                      >
                        {m.filament?.product_title || "Filament unavailable"}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium truncate">
                        {m.filament?.product_title || "Filament unavailable"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {m.filament?.vendor} · {m.filament?.material}
                    {m.note && ` · ${m.note}`}
                  </p>
                </div>

                {/* Quantity */}
                <div className="text-xs text-muted-foreground text-right shrink-0">
                  <span className="font-medium">{m.quantity_spools || 1}</span> spool
                  {(m.quantity_spools || 1) > 1 ? "s" : ""}
                </div>

                {/* Price */}
                <div className="text-sm text-right shrink-0 w-20">
                  {itemCost?.totalCost != null ? (
                    <span className={itemCost.isConverted ? "text-muted-foreground" : ""}>
                      {itemCost.isConverted && "~"}
                      {formatPrice(itemCost.totalCost)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>

                {/* Status */}
                <Select
                  value={m.purchase_status}
                  onValueChange={(v) =>
                    updateMaterial.mutate({
                      id: m.id,
                      purchase_status: v as PurchaseStatus,
                    })
                  }
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PURCHASE_STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Remove */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMaterial.mutate(m.id)}
                  className="shrink-0"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            );
          })}

          {/* Subtotal */}
          <div className="flex justify-end pt-2 border-t border-border">
            <p className="text-sm">
              <span className="text-muted-foreground">Materials subtotal: </span>
              <span className="font-semibold">{formatPrice(costData.materialsCost)}</span>
            </p>
          </div>
        </div>
      )}

      <FilamentSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        excludeIds={materials.map((m) => m.filament_id)}
        onSelect={(f) => {
          addMaterial.mutate({ project_id: projectId, filament_id: f.id });
          setSearchOpen(false);
        }}
      />
    </div>
  );
}
