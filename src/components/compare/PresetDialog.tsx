import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { CompareItem } from "@/hooks/useCompare";

interface PresetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  items: CompareItem[];
}

export function PresetDialog({ isOpen, onClose, onSave, items }: PresetDialogProps) {
  const [name, setName] = useState("");

  const handleSave = () => {
    onSave(name || `Comparison ${new Date().toLocaleDateString()}`);
    setName("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  // Generate suggested name based on materials
  const materials = [...new Set(items.map(i => i.material).filter(Boolean))];
  const suggestedName = materials.length > 0 
    ? `${materials.join(' vs ')} comparison`
    : `Comparison ${new Date().toLocaleDateString()}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-primary" />
            Save Comparison Preset
          </DialogTitle>
          <DialogDescription>
            Save this comparison for quick access later
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={suggestedName}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Materials included</Label>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg"
                >
                  {item.color_hex && (
                    <div 
                      className="w-3 h-3 rounded-full border border-border"
                      style={{ backgroundColor: item.color_hex }}
                    />
                  )}
                  <span className="text-sm truncate max-w-[150px]">
                    {item.product_title}
                  </span>
                  {item.material && (
                    <Badge variant="outline" className="text-xs">
                      {item.material}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
