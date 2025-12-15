import { cn } from "@/lib/utils";
import { Package, AlertTriangle, XCircle, Clock, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InventoryBadgeProps {
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder' | 'unknown';
  quantity?: number | null;
  retailerName?: string;
  lastChecked?: string;
  className?: string;
}

export function InventoryBadge({ 
  status, 
  quantity, 
  retailerName,
  lastChecked,
  className 
}: InventoryBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'in_stock':
        if (quantity !== null && quantity !== undefined && quantity <= 5) {
          return {
            icon: AlertTriangle,
            label: `Only ${quantity} left`,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/30',
            urgency: true,
          };
        }
        return {
          icon: Package,
          label: quantity ? `In Stock (${quantity > 10 ? '10+' : quantity})` : 'In Stock',
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          urgency: false,
        };
      
      case 'low_stock':
        return {
          icon: AlertTriangle,
          label: quantity ? `Low Stock - ${quantity} left` : 'Low Stock',
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          urgency: true,
        };
      
      case 'out_of_stock':
        return {
          icon: XCircle,
          label: 'Out of Stock',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          urgency: false,
        };
      
      case 'preorder':
        return {
          icon: Clock,
          label: 'Pre-order',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          urgency: false,
        };
      
      default:
        return {
          icon: HelpCircle,
          label: 'Check Availability',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/10',
          borderColor: 'border-border/30',
          urgency: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const badge = (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border",
        config.bgColor,
        config.borderColor,
        config.color,
        config.urgency && "animate-pulse",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );

  if (!lastChecked && !retailerName) {
    return badge;
  }

  const formatLastChecked = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="space-y-1">
            {retailerName && <p className="font-medium">{retailerName}</p>}
            {lastChecked && (
              <p className="text-muted-foreground">
                Updated: {formatLastChecked(lastChecked)}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
