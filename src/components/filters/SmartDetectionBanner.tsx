import { Check, X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SmartDetectionBannerProps {
  modelName: string;
  brand: string;
  imageUrl?: string;
  confidence: number;
  reason: string;
  onConfirm: () => void;
  onReject: () => void;
}

export function SmartDetectionBanner({
  modelName,
  brand,
  imageUrl,
  confidence,
  reason,
  onConfirm,
  onReject,
}: SmartDetectionBannerProps) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-4">
        {/* Printer image */}
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={modelName}
              className="w-full h-full object-contain"
            />
          ) : (
            <Printer className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground mb-1">
            We think you have:
          </p>
          <h4 className="font-semibold text-foreground">
            {brand} {modelName}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {reason}
          </p>

          {/* Confidence indicator */}
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  confidence >= 80 ? "bg-green-500" : confidence >= 50 ? "bg-amber-500" : "bg-muted-foreground"
                )}
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{confidence}% confident</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={onConfirm}
            className="gap-1.5"
          >
            <Check className="h-4 w-4" />
            That's mine
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onReject}
            className="gap-1.5 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            Not mine
          </Button>
        </div>
      </div>
    </div>
  );
}
