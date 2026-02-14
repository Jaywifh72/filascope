import { cn } from "@/lib/utils";

interface AffiliateDisclosureProps {
  className?: string;
}

/**
 * A subtle affiliate disclosure notice. Only render this when at least one
 * affiliate link was displayed on the page (controlled by the parent).
 */
export function AffiliateDisclosure({ className }: AffiliateDisclosureProps) {
  return (
    <p
      className={cn(
        "text-[10px] text-muted-foreground/60 text-center py-2 select-none",
        className
      )}
    >
      Some links on this page are affiliate links. Filascope may earn a commission at no cost to you.
    </p>
  );
}
