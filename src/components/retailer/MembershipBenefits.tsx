import { cn } from "@/lib/utils";
import { Check, Crown, Sparkles, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MembershipBenefitsProps {
  isPrimeMember?: boolean;
  membershipProgram?: string | null;
  hasMembership?: boolean;
  savings?: number;
  freeShipping?: boolean;
  className?: string;
}

export function MembershipBenefits({
  isPrimeMember = false,
  membershipProgram,
  hasMembership = false,
  savings = 0,
  freeShipping = false,
  className,
}: MembershipBenefitsProps) {
  // Amazon Prime benefits
  if (membershipProgram === 'prime' && isPrimeMember) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center gap-1.5">
          <Badge 
            variant="outline" 
            className="bg-[#FF9900]/10 border-[#FF9900]/30 text-[#FF9900] text-xs gap-1"
          >
            <Crown className="h-3 w-3" />
            Prime
          </Badge>
          {freeShipping && (
            <span className="text-xs text-emerald-400 font-medium">Free 2-Day</span>
          )}
        </div>
        {savings > 0 && (
          <p className="text-xs text-emerald-400">
            <Gift className="h-3 w-3 inline mr-1" />
            Save ${savings.toFixed(2)} with Prime
          </p>
        )}
      </div>
    );
  }

  // Prusa Insider benefits
  if (membershipProgram === 'insider' && hasMembership) {
    return (
      <div className={cn("space-y-1", className)}>
        <Badge 
          variant="outline" 
          className="bg-orange-500/10 border-orange-500/30 text-orange-400 text-xs gap-1"
        >
          <Sparkles className="h-3 w-3" />
          Prusa Insider
        </Badge>
        {savings > 0 && (
          <p className="text-xs text-emerald-400">
            5% member discount applied
          </p>
        )}
      </div>
    );
  }

  // Generic membership benefits
  if (hasMembership && savings > 0) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Check className="h-3 w-3 text-emerald-400" />
        <span className="text-xs text-emerald-400">
          Member savings: -${savings.toFixed(2)}
        </span>
      </div>
    );
  }

  return null;
}

interface PrimeBadgeProps {
  small?: boolean;
  className?: string;
}

export function PrimeBadge({ small = false, className }: PrimeBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "bg-[#FF9900]/10 border-[#FF9900]/30 text-[#FF9900] gap-1",
        small ? "text-[10px] px-1.5 py-0" : "text-xs",
        className
      )}
    >
      <Crown className={small ? "h-2.5 w-2.5" : "h-3 w-3"} />
      Prime
    </Badge>
  );
}
