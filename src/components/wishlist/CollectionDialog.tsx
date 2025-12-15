import { useState } from "react";
import { Folder, Star, Printer, DollarSign, Wrench } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WishlistCollection } from "@/hooks/useWishlistCollections";
import { cn } from "@/lib/utils";

interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: WishlistCollection | null;
  onSave: (data: {
    name: string;
    description: string;
    icon: string;
    color: string;
  }) => void;
  onDelete?: () => void;
}

const ICONS = [
  { id: "folder", icon: Folder },
  { id: "star", icon: Star },
  { id: "printer", icon: Printer },
  { id: "dollar", icon: DollarSign },
  { id: "wrench", icon: Wrench },
];

const COLORS = [
  "#00d9ff", // Cyan
  "#ff6b6b", // Red
  "#ffd93d", // Yellow
  "#6bcb77", // Green
  "#a855f7", // Purple
  "#f97316", // Orange
  "#ec4899", // Pink
  "#64748b", // Slate
];

export function CollectionDialog({
  open,
  onOpenChange,
  collection,
  onSave,
  onDelete,
}: CollectionDialogProps) {
  const [name, setName] = useState(collection?.name || "");
  const [description, setDescription] = useState(collection?.description || "");
  const [icon, setIcon] = useState(collection?.icon || "folder");
  const [color, setColor] = useState(collection?.color || "#00d9ff");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description, icon, color });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {collection ? "Edit Collection" : "Create Collection"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Engineering Materials"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection for?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex gap-2">
              {ICONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIcon(item.id)}
                  className={cn(
                    "p-2 rounded-md border transition-colors",
                    icon === item.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <item.icon className="h-5 w-5" style={{ color }} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-transform",
                    color === c && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {collection && onDelete && (
            <Button
              variant="destructive"
              onClick={onDelete}
              className="sm:mr-auto"
            >
              Delete Collection
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {collection ? "Save Changes" : "Create Collection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
