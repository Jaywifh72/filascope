import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import type { AccessoryCompatibilityResult } from "@/lib/accessoryCompatibility";

interface AccessoryCompatibilityBadgeProps {
  compatibility: AccessoryCompatibilityResult;
  showIcon?: boolean;
  compact?: boolean;
}

export function AccessoryCompatibilityBadge({ 
  compatibility, 
  showIcon = true,
  compact = false 
}: AccessoryCompatibilityBadgeProps) {
  const { rating, reason, details } = compatibility;

  const getBadgeContent = () => {
    switch (rating) {
      case "green":
        return {
          variant: "default" as const,
          className: "gap-1 bg-green-600 hover:bg-green-700 text-white",
          icon: <CheckCircle2 className="h-3 w-3" />,
          label: compact ? "" : "Compatible"
        };
      case "orange":
        return {
          variant: "default" as const,
          className: "gap-1 bg-orange-500 hover:bg-orange-600 text-white",
          icon: <AlertCircle className="h-3 w-3" />,
          label: compact ? "" : "Check"
        };
      case "red":
        return {
          variant: "destructive" as const,
          className: "gap-1",
          icon: <XCircle className="h-3 w-3" />,
          label: compact ? "" : "Not Compatible"
        };
      default:
        return {
          variant: "outline" as const,
          className: "gap-1",
          icon: null,
          label: "Unknown"
        };
    }
  };

  const content = getBadgeContent();
  
  const badge = (
    <Badge variant={content.variant} className={content.className}>
      {showIcon && content.icon}
      {content.label}
    </Badge>
  );

  // Wrap in tooltip to show reason
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">{reason}</p>
          {details && details.length > 0 && (
            <ul className="mt-1 text-xs text-muted-foreground list-disc list-inside">
              {details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
