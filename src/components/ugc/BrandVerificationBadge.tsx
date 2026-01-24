import { Shield, CheckCircle2, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BrandVerificationBadgeProps {
  brandName: string;
  isVerified: boolean;
  role?: "representative" | "admin" | "support";
  compact?: boolean;
  className?: string;
}

export function BrandVerificationBadge({
  brandName,
  isVerified,
  role = "representative",
  compact = false,
  className,
}: BrandVerificationBadgeProps) {
  if (!isVerified) return null;

  const roleLabels = {
    representative: "Brand Representative",
    admin: "Brand Admin",
    support: "Brand Support",
  };

  const content = (
    <Badge
      className={cn(
        "gap-1 border",
        isVerified
          ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
          : "bg-muted text-muted-foreground border-muted",
        compact && "px-1.5 py-0",
        className
      )}
    >
      <Shield className={cn("w-3 h-3", compact && "w-2.5 h-2.5")} />
      {!compact && <span className="text-[10px] font-medium">Verified</span>}
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="font-medium">{roleLabels[role]}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            This user is an official representative of {brandName} and has been verified
            by our team.
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface BrandClaimBannerProps {
  brandName: string;
  brandSlug: string;
}

export function BrandClaimBanner({ brandName, brandSlug }: BrandClaimBannerProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/20">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">Are you from {brandName}?</p>
          <p className="text-xs text-muted-foreground">
            Claim this brand profile to respond to questions and verify answers
          </p>
        </div>
      </div>
      <a
        href={`/brand-claim/${brandSlug}`}
        className="text-sm font-medium text-primary hover:underline whitespace-nowrap"
      >
        Claim Profile →
      </a>
    </div>
  );
}
