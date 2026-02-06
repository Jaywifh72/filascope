import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface FeatureHelpDefinition {
  title: string;
  description: string;
  learnMoreUrl?: string;
  learnMoreLabel?: string;
}

export const FEATURE_HELP_DEFINITIONS: Record<string, FeatureHelpDefinition> = {
  // Nozzle setup
  nozzle_size: {
    title: "Nozzle Size",
    description: "Standard is 0.4mm. Smaller nozzles give finer detail but print slower. Larger nozzles are faster but less detailed.",
    learnMoreUrl: "/learn/temperature-settings",
    learnMoreLabel: "Temperature guide",
  },
  flow_type: {
    title: "Flow Type",
    description: "High-flow nozzles push more material faster, ideal for large prints. Regular flow is best for detailed work.",
  },
  nozzle_material: {
    title: "Nozzle Material",
    description: "Brass is standard but wears with abrasive filaments. Hardened steel or tungsten carbide handles carbon fiber, glass-filled, and glow-in-the-dark materials.",
    learnMoreUrl: "/compare",
    learnMoreLabel: "Material reference",
  },
  
  // Material types
  reinforcement_carbon: {
    title: "Carbon Fiber Reinforced",
    description: "Contains chopped carbon fibers for increased stiffness and reduced weight. Requires hardened nozzle. Great for functional parts.",
  },
  reinforcement_glass: {
    title: "Glass Fiber Reinforced",
    description: "Glass fibers add strength and heat resistance. Less stiff than carbon but more affordable. Requires hardened nozzle.",
  },
  reinforcement_wood: {
    title: "Wood Filled",
    description: "Contains wood particles for a natural wood-like appearance and texture. Safe for brass nozzles. Great for decorative prints.",
  },
  reinforcement_metal: {
    title: "Metal Filled",
    description: "Contains metal particles (copper, bronze, steel) for metallic appearance. Can be polished. May require hardened nozzle depending on content.",
  },
  
  // Data quality
  data_quality: {
    title: "Data Quality Score",
    description: "Shows how complete the printer's specification data is. Higher scores mean more accurate compatibility predictions and recommendations.",
    learnMoreUrl: "/printers",
    learnMoreLabel: "Browse printers",
  },
  
  // Print settings
  print_speed: {
    title: "High-Speed Capable",
    description: "Filaments optimized for high-speed printing (>150mm/s) with good flow characteristics and fast cooling.",
  },
  moisture_sensitivity: {
    title: "Moisture Sensitivity",
    description: "How much the filament absorbs moisture from air. High sensitivity materials need dry storage and may require drying before printing.",
    learnMoreUrl: "/learn/beginner-filament-guide",
    learnMoreLabel: "Filament care guide",
  },
};

interface FeatureHelpIconProps {
  feature: keyof typeof FEATURE_HELP_DEFINITIONS;
  className?: string;
  iconClassName?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function FeatureHelpIcon({ 
  feature, 
  className, 
  iconClassName,
  side = 'top' 
}: FeatureHelpIconProps) {
  const definition = FEATURE_HELP_DEFINITIONS[feature];
  
  if (!definition) {
    return null;
  }
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center justify-center p-0.5 rounded-full",
              "opacity-40 hover:opacity-100 transition-opacity",
              "hover:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/50",
              className
            )}
            aria-label={`Learn about ${definition.title}`}
          >
            <HelpCircle 
              className={cn(
                "w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors",
                iconClassName
              )} 
            />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-[280px] p-3 bg-popover border-border z-50"
        >
          <p className="font-semibold text-foreground text-sm mb-1">
            {definition.title}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            {definition.description}
          </p>
          {definition.learnMoreUrl && (
            <Link
              to={definition.learnMoreUrl}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {definition.learnMoreLabel || 'Learn more'} →
            </Link>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Inline version that wraps text
interface InlineFeatureHelpProps {
  feature: keyof typeof FEATURE_HELP_DEFINITIONS;
  label?: string;
  children?: React.ReactNode;
}

export function InlineFeatureHelp({ feature, label, children }: InlineFeatureHelpProps) {
  const definition = FEATURE_HELP_DEFINITIONS[feature];
  
  if (!definition) {
    return <span>{label || children}</span>;
  }
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/30 hover:border-primary transition-colors">
            {label || children || definition.title}
            <HelpCircle className="w-3 h-3 text-muted-foreground/50" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px] p-3 bg-popover border-border z-50">
          <p className="font-semibold text-foreground text-sm mb-1">
            {definition.title}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {definition.description}
          </p>
          {definition.learnMoreUrl && (
            <Link
              to={definition.learnMoreUrl}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              {definition.learnMoreLabel || 'Learn more'} →
            </Link>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
