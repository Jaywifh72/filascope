import { Trophy, Star, Gem, ArrowRight, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SoftwareBadges, PriceType, SkillLevel } from "@/components/reference/CADBadges";
import { useCADComparison, SelectedCADSoftware } from "@/contexts/CADComparisonContext";

// Logo mapping
const cadLogos: Record<string, string> = {
  "Fusion 360": "/images/cad/fusion360.png",
  "Blender": "/images/cad/blender.png",
  "ZBrush": "/images/cad/zbrush.png",
};

const darkLogos = ["Fusion 360"];
const needsBrightness = (name: string) => darkLogos.includes(name);

// Badge configurations
const badgeConfigs = {
  staffPick: { icon: Trophy, text: '#1 STAFF PICK', color: 'cyan' },
  bestFree: { icon: Star, text: 'BEST FREE OPTION', color: 'emerald' },
  bestPro: { icon: Gem, text: 'BEST PROFESSIONAL', color: 'purple' },
};

// Staff Picks data with profile categories
export const staffPicks = [
  {
    name: "Fusion 360",
    badge: badgeConfigs.staffPick,
    priceType: 'freemium' as PriceType,
    overallScore: 9.2,
    skillLevel: 'intermediate' as SkillLevel,
    type: "Solid/Mesh",
    os: "Win/Mac",
    ease: 4,
    precision: 5,
    sculpt: 3,
    printReady: 5,
    parametric: 5,
    cloud: "Yes",
    perpetual: "No",
    standout: "Integrated CAD/CAM/CAE",
    profiles: ['maker', 'professional'] as const,
    whyPicked: [
      'Best balance of power and accessibility',
      'Free for hobbyists and small businesses',
      'Industry-standard parametric CAD',
      'Excellent learning resources'
    ],
    bestFor: 'Most users—from beginners to professionals'
  },
  {
    name: "Blender",
    badge: badgeConfigs.bestFree,
    priceType: 'free' as PriceType,
    overallScore: 9.0,
    skillLevel: 'intermediate' as SkillLevel,
    type: "Mesh",
    os: "Win/Mac/Lin",
    ease: 2,
    precision: 3,
    sculpt: 5,
    printReady: 4,
    parametric: 2,
    cloud: "No",
    perpetual: "Yes",
    standout: "Complete 3D Suite",
    profiles: ['artist', 'maker'] as const,
    whyPicked: [
      'Completely free, forever, no limitations',
      'Handles modeling, sculpting, animation',
      'Massive community with endless tutorials',
      'Constantly improving with new releases'
    ],
    bestFor: 'Artists, hobbyists, and budget-conscious creators'
  },
  {
    name: "ZBrush",
    badge: badgeConfigs.bestPro,
    priceType: 'paid' as PriceType,
    overallScore: 9.5,
    skillLevel: 'advanced' as SkillLevel,
    type: "Sculpt",
    os: "Win/Mac",
    ease: 2,
    precision: 2,
    sculpt: 5,
    printReady: 4,
    parametric: 1,
    cloud: "No",
    perpetual: "No",
    standout: "Ultra High-Poly",
    profiles: ['artist', 'professional'] as const,
    whyPicked: [
      'Industry standard for digital sculpting',
      'Handles millions of polygons effortlessly',
      'Used by Weta, ILM, and top studios',
      'Unmatched brush and detail tools'
    ],
    bestFor: 'Professional sculptors and character artists'
  },
  {
    name: "Tinkercad",
    badge: { icon: Star, text: 'BEST FOR BEGINNERS', color: 'cyan' as const },
    priceType: 'free' as PriceType,
    overallScore: 7.5,
    skillLevel: 'beginner' as SkillLevel,
    type: "CSG",
    os: "Browser",
    ease: 5,
    precision: 2,
    sculpt: 1,
    printReady: 5,
    parametric: 1,
    cloud: "Yes",
    perpetual: "N/A",
    standout: "Zero Learning Curve",
    profiles: ['beginner'] as const,
    whyPicked: [
      'Easiest 3D software to learn',
      'Runs in any web browser',
      'Perfect for education and kids',
      'Direct export to 3D printers'
    ],
    bestFor: 'Complete beginners and educators'
  }
];

export type StaffPick = typeof staffPicks[number];

interface CADStaffPickCardProps {
  pick: typeof staffPicks[0];
  onViewDetails: () => void;
}

export function CADStaffPickCard({ pick, onViewDetails }: CADStaffPickCardProps) {
  const { addSoftware, removeSoftware, isInComparison, canAddMore } = useCADComparison();
  
  const softwareId = pick.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const isSelected = isInComparison(softwareId);
  const isDisabled = !isSelected && !canAddMore;

  const handleCompareClick = () => {
    if (isDisabled) return;
    
    const software: SelectedCADSoftware = {
      id: softwareId,
      name: pick.name,
      logo: cadLogos[pick.name],
      priceType: pick.priceType,
      overallScore: pick.overallScore,
      skillLevel: pick.skillLevel,
      type: pick.type,
      os: pick.os,
      ease: pick.ease,
      precision: pick.precision,
      sculpt: pick.sculpt,
      printReady: pick.printReady,
      parametric: pick.parametric,
      cloud: pick.cloud,
      perpetual: pick.perpetual,
      standout: pick.standout,
    };

    if (isSelected) {
      removeSoftware(softwareId);
    } else {
      addSoftware(software);
    }
  };

  const BadgeIcon = pick.badge.icon;
  const colorClasses = {
    cyan: {
      border: 'border-cyan-400/30 hover:border-cyan-400',
      badge: 'bg-cyan-400/15 border-cyan-400/30 text-cyan-400',
      accent: 'before:bg-cyan-400',
      shadow: 'hover:shadow-cyan-400/20',
    },
    emerald: {
      border: 'border-emerald-400/30 hover:border-emerald-400',
      badge: 'bg-emerald-400/15 border-emerald-400/30 text-emerald-400',
      accent: 'before:bg-emerald-400',
      shadow: 'hover:shadow-emerald-400/20',
    },
    purple: {
      border: 'border-purple-400/30 hover:border-purple-400',
      badge: 'bg-purple-400/15 border-purple-400/30 text-purple-400',
      accent: 'before:bg-purple-400',
      shadow: 'hover:shadow-purple-400/20',
    },
  };
  const colors = colorClasses[pick.badge.color as keyof typeof colorClasses];

  return (
    <div className={cn(
      "relative w-full h-full p-6 rounded-2xl overflow-hidden",
      "bg-card/50 border-2 flex flex-col transition-all duration-300",
      "hover:scale-[1.02] hover:-translate-y-1",
      "hover:shadow-lg hover:shadow-primary/10",
      "before:absolute before:top-0 before:left-0 before:right-0 before:h-1",
      colors.border,
      colors.accent,
      "hover:border-primary/50"
    )}>
      {/* Badge */}
      <div className={cn(
        "inline-flex items-center gap-2 self-start px-3 py-1.5 mb-4 rounded-lg border text-xs font-bold uppercase tracking-wide",
        colors.badge
      )}>
        <BadgeIcon size={14} />
        <span>{pick.badge.text}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-xl bg-white/5 p-2.5 flex-shrink-0 flex items-center justify-center">
          {cadLogos[pick.name] && (
            <img 
              src={cadLogos[pick.name]} 
              alt={`${pick.name} logo`}
              className={cn(
                "w-full h-full object-contain",
                needsBrightness(pick.name) && "brightness-150 invert"
              )}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-foreground mb-1">{pick.name}</h3>
          <SoftwareBadges
            priceType={pick.priceType}
            overallScore={pick.overallScore}
            skillLevel={pick.skillLevel}
            compact
          />
        </div>
      </div>

      {/* Why Picked */}
      <div className="flex-1 mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Why We Picked It</p>
        <ul className="space-y-1.5">
          {pick.whyPicked.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check size={14} className="text-primary mt-0.5 flex-shrink-0" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Best For */}
      <div className="mb-5 p-3 rounded-lg bg-muted/30">
        <p className="text-xs font-semibold text-muted-foreground mb-1">Best For</p>
        <p className="text-sm text-foreground">{pick.bestFor}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          variant="default" 
          className="flex-1 h-11"
          onClick={onViewDetails}
        >
          View Details
          <ArrowRight size={16} className="ml-2" />
        </Button>
        <Button
          variant="outline"
          onClick={handleCompareClick}
          disabled={isDisabled}
          className={cn(
            "h-11 px-4 transition-all",
            isSelected 
              ? "bg-primary/15 border-primary text-primary hover:bg-destructive/15 hover:border-destructive hover:text-destructive" 
              : isDisabled
                ? "opacity-50 cursor-not-allowed"
                : "border-primary/30 text-primary hover:bg-primary/10 hover:border-primary"
          )}
          title={isDisabled ? 'Remove an item to add more (max 4)' : undefined}
        >
          {isSelected ? <Check size={16} /> : <Plus size={16} />}
        </Button>
      </div>
    </div>
  );
}
