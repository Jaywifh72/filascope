import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SLICERS, SlicerType } from "@/lib/slicerMapping";
import { cn } from "@/lib/utils";

interface SlicerSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (slicer: SlicerType, remember: boolean) => void;
  recommendedSlicer?: SlicerType;
  recommendedReason?: string;
}

const SLICER_DESCRIPTIONS: Record<SlicerType, string> = {
  bambu: 'Best for Bambu Lab printers with AMS support',
  prusaslicer: 'Best for Prusa & generic FDM printers',
  orcaslicer: 'Best for Klipper & advanced users',
  cura: 'Best for Creality & wide printer support',
  simplify3d: 'For commercial/professional use',
};

export function SlicerSelectionModal({
  open,
  onOpenChange,
  onSelect,
  recommendedSlicer,
  recommendedReason,
}: SlicerSelectionModalProps) {
  const [selected, setSelected] = useState<SlicerType | null>(recommendedSlicer || null);
  const [remember, setRemember] = useState(true);

  const handleContinue = () => {
    if (selected) {
      onSelect(selected, remember);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>What slicer do you use?</DialogTitle>
          <DialogDescription>
            Select your primary slicer to personalize profile downloads
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {Object.entries(SLICERS).map(([key, slicer]) => {
            const slicerType = key as SlicerType;
            const isRecommended = slicerType === recommendedSlicer;
            const isSelected = slicerType === selected;

            return (
              <button
                key={key}
                onClick={() => setSelected(slicerType)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    isSelected ? "border-primary" : "border-muted-foreground"
                  )}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{slicer.name}</span>
                    {isRecommended && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {SLICER_DESCRIPTIONS[slicerType]}
                  </p>
                </div>

                <span className="text-xs text-muted-foreground font-mono">
                  {slicer.extension}
                </span>
              </button>
            );
          })}
        </div>

        {recommendedReason && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            💡 {recommendedReason}
          </p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(checked) => setRemember(checked === true)}
          />
          <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            Remember my choice
          </Label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={!selected}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
