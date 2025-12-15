import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StandoutBadge } from "@/lib/filamentDifferentiators";

interface StandoutBadgesProps {
  badges: StandoutBadge[];
  maxBadges?: number;
}

const BADGE_STYLES: Record<string, string> = {
  amber: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  green: "border-green-500/50 bg-green-500/10 text-green-400",
  cyan: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
  purple: "border-purple-500/50 bg-purple-500/10 text-purple-400",
  blue: "border-blue-500/50 bg-blue-500/10 text-blue-400",
  red: "border-red-500/50 bg-red-500/10 text-red-400",
};

export function StandoutBadges({ badges, maxBadges = 2 }: StandoutBadgesProps) {
  if (!badges || badges.length === 0) return null;

  const displayBadges = badges.slice(0, maxBadges);

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayBadges.map((badge, idx) => (
        <TooltipProvider key={idx}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`cursor-help text-[10px] font-medium ${BADGE_STYLES[badge.color] || BADGE_STYLES.cyan}`}
              >
                {badge.icon} {badge.label}
              </Badge>
            </TooltipTrigger>
            {badge.tooltip && (
              <TooltipContent side="top" className="max-w-[200px] text-xs">
                {badge.tooltip}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}
