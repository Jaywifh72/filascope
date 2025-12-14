import { Users } from "lucide-react";
import { useCommunityReports } from "@/hooks/useReportIssue";

interface CommunityReportsBadgeProps {
  brand: string;
  material: string;
}

export function CommunityReportsBadge({ brand, material }: CommunityReportsBadgeProps) {
  const { data: reports } = useCommunityReports(brand, material);

  if (!reports || reports.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-amber-400/80">
      <Users className="h-3 w-3" />
      <span>
        {reports.length} user{reports.length > 1 ? "s" : ""} reported issues
      </span>
    </div>
  );
}
