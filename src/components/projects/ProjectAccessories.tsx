import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, ExternalLink } from "lucide-react";
import { useProjectMutations, type PurchaseStatus, type ProjectAccessory } from "@/hooks/useProject";
import { useRegion } from "@/contexts/RegionContext";

interface ProjectAccessoriesProps {
  projectId: string;
  accessories: ProjectAccessory[];
}

const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  need_to_buy: "Need to Buy",
  purchased: "Purchased",
  in_use: "In Use",
  done: "Done",
};

export function ProjectAccessories({ projectId, accessories }: ProjectAccessoriesProps) {
  const { addAccessory, updateAccessory, removeAccessory } = useProjectMutations();
  const { formatPrice, currency } = useRegion();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    addAccessory.mutate({
      project_id: projectId,
      name: newName.trim(),
      url: newUrl.trim() || undefined,
      price: newPrice ? Number(newPrice) : undefined,
      currency,
    });
    setNewName("");
    setNewUrl("");
    setNewPrice("");
    setShowForm(false);
  };

  const subtotal = accessories.reduce((sum, a) => sum + (a.price || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Accessories</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Accessory
        </Button>
      </div>

      {!accessories.length && !showForm ? (
        <div className="text-center py-6 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">
            No accessories added — nozzles, build plates, etc.
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Accessory
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {accessories.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{a.name}</span>
                  {a.url && (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="text-sm text-right shrink-0 w-20">
                {a.price != null ? formatPrice(a.price) : "—"}
              </div>

              <Select
                value={a.purchase_status}
                onValueChange={(v) =>
                  updateAccessory.mutate({
                    id: a.id,
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

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAccessory.mutate(a.id)}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          ))}

          {/* Add form */}
          {showForm && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <Input
                placeholder="Accessory name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 h-8 text-sm"
                autoFocus
              />
              <Input
                placeholder="URL (optional)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-32 h-8 text-sm"
              />
              <Input
                placeholder="Price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-20 h-8 text-sm"
              />
              <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Subtotal */}
          {accessories.length > 0 && (
            <div className="flex justify-end pt-2 border-t border-border">
              <p className="text-sm">
                <span className="text-muted-foreground">Accessories subtotal: </span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
