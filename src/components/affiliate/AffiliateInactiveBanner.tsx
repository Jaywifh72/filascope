import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { AffiliateProgram } from "@/types/affiliate";

interface AffiliateInactiveBannerProps {
  inactiveProgram: AffiliateProgram | null;
  className?: string;
}

/**
 * Yellow warning banner shown only to admins when an affiliate program
 * exists but is inactive (e.g. pending verification).
 */
export function AffiliateInactiveBanner({ inactiveProgram, className }: AffiliateInactiveBannerProps) {
  const { isAdmin } = useAuth();

  if (!inactiveProgram || !isAdmin) return null;

  return (
    <div className={className}>
      <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-xs text-yellow-200">
        <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
        <span>
          ⚠️ Affiliate program for <strong>{inactiveProgram.brand_name} ({inactiveProgram.region_code})</strong> is pending verification — links are inactive until approved.
          Activate in Admin &gt; Affiliates once GoAffPro confirms your account.
        </span>
      </div>
    </div>
  );
}
