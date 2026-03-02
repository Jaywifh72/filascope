import type { AffiliateDiscountCode } from "@/types/affiliate";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import { trackDiscountCode as trackGA4DiscountCode } from "@/lib/analytics";

interface AffiliateDiscountBannerProps {
  discountCodes: AffiliateDiscountCode[];
  className?: string;
  /** When true, shows a muted empty state instead of returning null */
  showEmptyState?: boolean;
}

/**
 * Displays active, assigned discount codes as a small teal banner.
 * Only renders when there are qualifying codes (or showEmptyState is true).
 */
export function AffiliateDiscountBanner({ discountCodes, className, showEmptyState }: AffiliateDiscountBannerProps) {
  // Only show assigned, active codes
  const activeCodes = discountCodes.filter((c) => c.is_assigned && c.is_active && c.code);

  if (activeCodes.length === 0) {
    if (showEmptyState) {
      return (
        <div className={className}>
          <p className="text-xs text-muted-foreground italic">
            No discount codes available for this region currently.
          </p>
        </div>
      );
    }
    return null;
  }

  const handleCodeClick = (code: AffiliateDiscountCode) => {
    trackGA4DiscountCode(
      code.code || '',
      '', // brand not available here
      code.discount_value ?? undefined
    );
  };

  return (
    <div className={className}>
      {activeCodes.map((code) => (
        <div
          key={code.id}
          className="flex items-center gap-2 rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs cursor-pointer"
          onClick={() => handleCodeClick(code)}
        >
          <Tag className="w-3 h-3 text-primary shrink-0" />
          <span className="text-foreground">
            Use code{" "}
            <span className="font-mono font-bold text-primary">{code.code}</span>
            {code.display_text ? ` — ${code.display_text}` : code.description ? ` — ${code.description}` : ""}
          </span>
          {code.valid_until && (
            <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
              Expires {new Date(code.valid_until).toLocaleDateString()}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
