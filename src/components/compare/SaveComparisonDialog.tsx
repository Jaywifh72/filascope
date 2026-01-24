import { useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CompareItem } from "@/hooks/useCompare";

interface SaveComparisonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: CompareItem[];
}

export function SaveComparisonDialog({
  isOpen,
  onClose,
  items,
}: SaveComparisonDialogProps) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for this comparison");
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to save comparisons");
        return;
      }

      // Save to user's comparison presets in localStorage for now
      // This could be extended to save to database
      const presets = JSON.parse(localStorage.getItem('filascope_compare_presets') || '[]');
      
      presets.unshift({
        id: crypto.randomUUID(),
        name: name.trim(),
        items: items.map(i => ({
          id: i.id,
          product_title: i.product_title,
          vendor: i.vendor,
          material: i.material,
        })),
        createdAt: new Date().toISOString(),
        userId: user.id,
      });

      // Keep only last 20 presets
      localStorage.setItem('filascope_compare_presets', JSON.stringify(presets.slice(0, 20)));

      toast.success("Comparison saved!", {
        description: `"${name}" saved to your presets`,
      });
      
      setName("");
      onClose();
    } catch (error) {
      console.error("Error saving comparison:", error);
      toast.error("Failed to save comparison");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            Save Comparison
          </DialogTitle>
          <DialogDescription>
            Save this comparison of {items.length} materials to access it later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Comparison Name</Label>
            <Input
              id="name"
              placeholder="e.g., Budget PLA Options"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Materials included:</p>
            <ul className="list-disc list-inside space-y-1">
              {items.slice(0, 4).map(item => (
                <li key={item.id} className="truncate">
                  {item.product_title}
                </li>
              ))}
              {items.length > 4 && (
                <li className="text-muted-foreground">
                  +{items.length - 4} more
                </li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
