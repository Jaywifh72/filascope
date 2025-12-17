import { useState } from "react";
import { Star, GraduationCap, Settings, Microscope } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

export type PriceType = 'free' | 'freemium' | 'paid';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

// ============================================
// PRICE BADGE (TIER 1)
// ============================================

interface PriceBadgeProps {
  type: PriceType;
  price?: string;
  className?: string;
}

const priceStyles: Record<PriceType, string> = {
  free: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  freemium: "bg-amber-500/15 border-amber-500/30 text-amber-400",
  paid: "bg-pink-500/15 border-pink-500/30 text-pink-400",
};

export function PriceBadge({ type, price, className }: PriceBadgeProps) {
  const displayText = type === 'paid' && price ? price : type.charAt(0).toUpperCase() + type.slice(1);
  
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center h-[26px] px-3 rounded-md border text-xs font-semibold tracking-wide whitespace-nowrap",
        priceStyles[type],
        className
      )}
      aria-label={`Price: ${displayText}`}
    >
      {displayText}
    </span>
  );
}

// ============================================
// SCORE DISPLAY (TIER 2)
// ============================================

interface ScoreDisplayProps {
  score: number;
  showStar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getScoreColor = (score: number): string => {
  if (score >= 9.0) return 'text-emerald-400';
  if (score >= 7.0) return 'text-cyan-400';
  if (score >= 5.0) return 'text-yellow-400';
  return 'text-orange-400';
};

export function ScoreDisplay({ score, showStar = true, size = 'md', className }: ScoreDisplayProps) {
  const sizeClasses = {
    sm: 'text-[13px]',
    md: 'text-[15px]',
    lg: 'text-lg',
  };
  
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-bold whitespace-nowrap",
        sizeClasses[size],
        getScoreColor(score),
        className
      )}
      aria-label={`Overall score: ${score.toFixed(1)} out of 10`}
    >
      <span>{score.toFixed(1)}/10</span>
      {showStar && <Star size={iconSizes[size]} fill="currentColor" />}
    </span>
  );
}

// ============================================
// SKILL ICON (TIER 3)
// ============================================

interface SkillIconProps {
  level: SkillLevel;
  showTooltip?: boolean;
  className?: string;
}

const skillConfig = {
  beginner: {
    icon: GraduationCap,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10 hover:bg-emerald-400/20',
    borderColor: 'border-emerald-400/30',
    tooltip: 'Beginner-Friendly: Easy to learn, minimal 3D experience required'
  },
  intermediate: {
    icon: Settings,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10 hover:bg-cyan-400/20',
    borderColor: 'border-cyan-400/30',
    tooltip: 'Intermediate: Requires some 3D modeling knowledge'
  },
  advanced: {
    icon: Microscope,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10 hover:bg-purple-400/20',
    borderColor: 'border-purple-400/30',
    tooltip: 'Advanced: Professional tool requiring significant expertise'
  }
};

export function SkillIcon({ level, showTooltip = true, className }: SkillIconProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const config = skillConfig[level];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center w-7 h-7 rounded-md cursor-help transition-colors",
        config.bgColor,
        className
      )}
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
      onFocus={() => setIsTooltipVisible(true)}
      onBlur={() => setIsTooltipVisible(false)}
      tabIndex={0}
      role="img"
      aria-label={config.tooltip}
    >
      <Icon size={16} className={config.color} />
      
      {showTooltip && isTooltipVisible && (
        <div
          className={cn(
            "absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50",
            "max-w-[250px] px-3 py-2.5 rounded-lg",
            "bg-popover border shadow-lg",
            "text-xs font-medium text-popover-foreground text-center leading-relaxed",
            "animate-in fade-in-0 zoom-in-95 duration-200"
          )}
          style={{ borderColor: `${config.color}30` }}
        >
          {config.tooltip}
          <div 
            className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent"
            style={{ borderBottomColor: config.color }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// COMBINED BADGE ROW
// ============================================

interface SoftwareBadgesProps {
  priceType: PriceType;
  priceValue?: string;
  overallScore: number;
  skillLevel: SkillLevel;
  showScore?: boolean;
  showSkill?: boolean;
  compact?: boolean;
  className?: string;
}

export function SoftwareBadges({
  priceType,
  priceValue,
  overallScore,
  skillLevel,
  showScore = true,
  showSkill = true,
  compact = false,
  className
}: SoftwareBadgesProps) {
  return (
    <div className={cn("inline-flex items-center flex-wrap", compact ? "gap-2" : "gap-3", className)}>
      <PriceBadge type={priceType} price={priceValue} />
      {showScore && <ScoreDisplay score={overallScore} size={compact ? 'sm' : 'md'} />}
      {showSkill && <SkillIcon level={skillLevel} />}
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Map old price strings to new price types
export function mapPriceType(price: string): PriceType {
  const normalized = price.toLowerCase();
  if (normalized === 'free') return 'free';
  if (normalized === 'freemium') return 'freemium';
  return 'paid';
}

// Calculate overall score from individual ratings (0-5 scale)
export function calculateOverallScore(ratings: {
  ease: number;
  precision: number;
  sculpt: number;
  printReady: number;
  parametric: number;
}): number {
  const weights = {
    ease: 0.25,
    precision: 0.25,
    printReady: 0.20,
    parametric: 0.15,
    sculpt: 0.15
  };
  
  const weightedSum = 
    ratings.ease * weights.ease +
    ratings.precision * weights.precision +
    ratings.printReady * weights.printReady +
    ratings.parametric * weights.parametric +
    ratings.sculpt * weights.sculpt;
  
  // Convert from 0-5 to 0-10 scale
  const score = weightedSum * 2;
  return Math.round(score * 10) / 10;
}

// Determine skill level based on ease rating
export function mapSkillLevel(ease: number): SkillLevel {
  if (ease >= 4) return 'beginner';
  if (ease >= 2) return 'intermediate';
  return 'advanced';
}
