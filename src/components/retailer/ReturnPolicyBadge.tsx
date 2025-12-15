import { cn } from "@/lib/utils";
import { RotateCcw, Check, AlertTriangle, Ban } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReturnPolicyBadgeProps {
  returnDays: number | null;
  returnType: string | null;
  restockingFee?: number | null;
  className?: string;
}

export function ReturnPolicyBadge({
  returnDays,
  returnType,
  restockingFee = 0,
  className,
}: ReturnPolicyBadgeProps) {
  if (!returnDays) return null;

  const getConfig = () => {
    if (returnType === 'no_questions') {
      return {
        icon: Check,
        label: `${returnDays}-Day Returns`,
        sublabel: 'No questions asked',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
      };
    }
    
    if (returnType === 'restocking_fee' && restockingFee) {
      return {
        icon: AlertTriangle,
        label: `${returnDays}-Day Returns`,
        sublabel: `${restockingFee}% restocking fee`,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
      };
    }
    
    if (returnType === 'store_credit') {
      return {
        icon: RotateCcw,
        label: `${returnDays}-Day Returns`,
        sublabel: 'Store credit only',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
      };
    }

    return {
      icon: RotateCcw,
      label: `${returnDays}-Day Returns`,
      sublabel: null,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/10',
      borderColor: 'border-border/30',
    };
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border",
              config.bgColor,
              config.borderColor,
              config.color,
              className
            )}
          >
            <Icon className="h-3 w-3" />
            <span>{config.label}</span>
          </div>
        </TooltipTrigger>
        {config.sublabel && (
          <TooltipContent side="top" className="text-xs">
            {config.sublabel}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export function NoReturnsIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border",
        "bg-red-500/10 border-red-500/30 text-red-400",
        className
      )}
    >
      <Ban className="h-3 w-3" />
      <span>Final Sale</span>
    </div>
  );
}
