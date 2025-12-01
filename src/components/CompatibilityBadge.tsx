import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from "lucide-react";
import type { CompatibilityResult } from "@/lib/printerCompatibility";

interface CompatibilityBadgeProps {
  compatibility: CompatibilityResult;
  showIcon?: boolean;
}

export function CompatibilityBadge({ compatibility, showIcon = true }: CompatibilityBadgeProps) {
  const { ease_rating, is_supported } = compatibility;

  if (!is_supported) {
    return (
      <Badge variant="destructive" className="gap-1">
        {showIcon && <XCircle className="h-3 w-3" />}
        Not Compatible
      </Badge>
    );
  }

  switch (ease_rating) {
    case "Easy":
      return (
        <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
          {showIcon && <CheckCircle2 className="h-3 w-3" />}
          Easy
        </Badge>
      );
    case "Medium":
      return (
        <Badge variant="default" className="gap-1 bg-yellow-600 hover:bg-yellow-700">
          {showIcon && <HelpCircle className="h-3 w-3" />}
          Medium
        </Badge>
      );
    case "Hard":
      return (
        <Badge variant="default" className="gap-1 bg-orange-600 hover:bg-orange-700">
          {showIcon && <AlertCircle className="h-3 w-3" />}
          Hard
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1">
          Unknown
        </Badge>
      );
  }
}