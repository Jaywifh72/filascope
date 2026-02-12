import { 
  CheckCircle, 
  Settings, 
  Palette, 
  Maximize2, 
  Droplet, 
  Zap, 
  Home, 
  Cpu, 
  XCircle,
  Award,
  Flame,
  Star,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeType } from "@/lib/printerCardUtils";

interface BadgeConfig {
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  className: string;
}

const badgeConfigs: Record<BadgeType, BadgeConfig> = {
  beginner: {
    label: 'Beginner Friendly',
    shortLabel: 'Beginner',
    icon: CheckCircle,
    className: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
  },
  advanced: {
    label: 'Advanced',
    shortLabel: 'Advanced',
    icon: Settings,
    className: 'bg-violet-500/15 border-violet-500/30 text-violet-400'
  },
  multiColor: {
    label: 'Multi-Color',
    shortLabel: 'Multi-Color',
    icon: Palette,
    className: 'bg-purple-500/15 border-purple-500/30 text-purple-400'
  },
  largeFormat: {
    label: 'Large Format',
    shortLabel: 'Large',
    icon: Maximize2,
    className: 'bg-amber-500/15 border-amber-500/30 text-amber-400'
  },
  resin: {
    label: 'Resin/SLA',
    shortLabel: 'Resin',
    icon: Droplet,
    className: 'bg-red-500/15 border-red-500/30 text-red-400'
  },
  highSpeed: {
    label: 'High-Speed',
    shortLabel: 'Fast',
    icon: Zap,
    className: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
  },
  enclosed: {
    label: 'Enclosed',
    shortLabel: 'Enclosed',
    icon: Home,
    className: 'bg-blue-500/15 border-blue-500/30 text-blue-400'
  },
  corexy: {
    label: 'CoreXY',
    shortLabel: 'CoreXY',
    icon: Cpu,
    className: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
  },
  discontinued: {
    label: 'Discontinued',
    shortLabel: 'Discontinued',
    icon: XCircle,
    className: 'bg-destructive/15 border-destructive/30 text-destructive'
  },
  staffPick: {
    label: 'Staff Pick',
    shortLabel: 'Staff Pick',
    icon: Award,
    className: 'bg-amber-500/15 border-amber-500/30 text-amber-400'
  },
  bestSeller: {
    label: 'Best Seller',
    shortLabel: 'Popular',
    icon: Flame,
    className: 'bg-primary/15 border-primary/30 text-primary'
  },
  newRelease: {
    label: 'New',
    shortLabel: 'New',
    icon: Star,
    className: 'bg-amber-400/15 border-amber-400/30 text-amber-300'
  }
};

interface PrinterBadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md';
  compact?: boolean;
  pulse?: boolean;
  className?: string;
}

export default function PrinterBadge({ 
  type, 
  size = 'md',
  compact = false,
  pulse = false,
  className 
}: PrinterBadgeProps) {
  const config = badgeConfigs[type];
  const Icon = config.icon;
  const label = compact ? config.shortLabel : config.label;

  return (
    <div
      role="status"
      aria-label={config.label}
      className={cn(
        "inline-flex items-center gap-1.5 border rounded-full font-semibold uppercase tracking-wide transition-all",
        size === 'sm' 
          ? "px-2 py-0.5 text-[10px]" 
          : "px-2 py-0.5 text-xs",
        config.className,
        pulse && "animate-pulse",
        className
      )}
    >
      <Icon 
        className={cn(
          "flex-shrink-0",
          size === 'sm' ? "h-3 w-3" : "h-3.5 w-3.5"
        )} 
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}

export { badgeConfigs };
