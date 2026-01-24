import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getMaterialInfo, getMaterialCategory } from "@/lib/materialHierarchy";
import { cn } from "@/lib/utils";
import { Thermometer, Shield, Zap, Layers } from "lucide-react";

interface MaterialBadgeProps {
  material: string;
  variant?: "default" | "outline" | "secondary";
  className?: string;
  showTooltip?: boolean;
  size?: "sm" | "md";
}

const PropertyIndicator = ({ 
  level, 
  label 
}: { 
  level: 'Low' | 'Medium' | 'High' | 'Very High' | 'Easy' | 'Hard' | 'Expert' | 'Rigid' | 'Semi-Flexible' | 'Flexible' | 'Very Flexible';
  label: string;
}) => {
  // WCAG 2.1 AA: Use brighter colors for better contrast against dark backgrounds
  const getColor = () => {
    switch (level) {
      case 'Easy':
      case 'Low':
        return 'bg-green-400';
      case 'Medium':
      case 'Semi-Flexible':
        return 'bg-yellow-400';
      case 'High':
      case 'Hard':
      case 'Flexible':
        return 'bg-orange-400';
      case 'Very High':
      case 'Expert':
      case 'Very Flexible':
      case 'Rigid':
        return 'bg-red-400';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <div className={cn("w-2 h-2 rounded-full", getColor())} />
        <span className="text-[11px] font-medium text-foreground">{level}</span>
      </div>
    </div>
  );
};

export const MaterialBadge = ({ 
  material, 
  variant = "outline", 
  className,
  showTooltip = true,
  size = "sm"
}: MaterialBadgeProps) => {
  const info = getMaterialInfo(material);
  const category = getMaterialCategory(material);

  // WCAG 2.1 AA: Use text-violet-300 for improved contrast (4.5:1+ ratio)
  const badge = (
    <Badge 
      variant={variant} 
      className={cn(
        "bg-violet-500/15 border-violet-500/40 text-violet-300 font-semibold cursor-default",
        size === "sm" ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1.5",
        showTooltip && "cursor-help hover:bg-primary/25 transition-colors",
        className
      )}
    >
      {material}
    </Badge>
  );

  if (!showTooltip || !info) {
    return badge;
  }

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="w-72 p-0 bg-card border-border shadow-xl"
        sideOffset={8}
      >
        <div className="p-3 space-y-3">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground">{info.name}</span>
              {category && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {category.name}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {info.description}
            </p>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 p-2 rounded-md bg-muted/30">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <PropertyIndicator level={info.properties.printability} label="Print" />
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-blue-400" />
              <PropertyIndicator level={info.properties.strength} label="Strength" />
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-purple-400" />
              <PropertyIndicator level={info.properties.flexibility} label="Flex" />
            </div>
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-3 h-3 text-red-400" />
              <PropertyIndicator level={info.properties.heatResistance} label="Heat" />
            </div>
          </div>

          {/* Use Cases */}
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Best For
            </span>
            <div className="flex flex-wrap gap-1">
              {info.useCases.slice(0, 4).map((useCase, i) => (
                <span 
                  key={i} 
                  className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400"
                >
                  {useCase}
                </span>
              ))}
            </div>
          </div>

          {/* Requirements */}
          {info.requirements && info.requirements.length > 0 && (
            <div className="pt-2 border-t border-border">
              <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wide">
                ⚠️ Requirements
              </span>
              <ul className="mt-1 space-y-0.5">
                {info.requirements.map((req, i) => (
                  <li key={i} className="text-[10px] text-muted-foreground">
                    • {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default MaterialBadge;
