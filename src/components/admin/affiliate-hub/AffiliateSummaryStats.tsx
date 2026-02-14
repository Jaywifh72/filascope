import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAffiliateProgramStats } from "@/hooks/useAffiliatePrograms";
import { Link2, CheckCircle, Clock, MousePointerClick, Tag, Megaphone } from "lucide-react";

export function AffiliateSummaryStats() {
  const { data: stats, isLoading } = useAffiliateProgramStats();

  const items = [
    { label: "Total Programs", value: stats?.total ?? 0, icon: Link2, color: "text-primary" },
    { label: "Active Programs", value: stats?.active ?? 0, icon: CheckCircle, color: "text-green-500" },
    { label: "Pending Verification", value: stats?.pending ?? 0, icon: Clock, color: "text-yellow-500" },
    { label: "Clicks (30d)", value: stats?.clicks30d ?? 0, icon: MousePointerClick, color: "text-blue-400" },
    { label: "Active Codes", value: stats?.activeCodes ?? 0, icon: Tag, color: "text-purple-400" },
    { label: "Active Campaigns", value: stats?.activeCampaigns ?? 0, icon: Megaphone, color: "text-orange-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <item.icon className={`w-5 h-5 shrink-0 ${item.color}`} />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{item.label}</p>
              {isLoading ? (
                <Skeleton className="h-6 w-10 mt-1" />
              ) : (
                <p className="text-xl font-bold text-foreground">{item.value}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
