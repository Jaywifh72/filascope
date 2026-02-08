import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Star, Package } from "lucide-react";
import type { ActivityItem } from "@/hooks/usePublicProfile";

interface ProfileActivityTabProps {
  activity: ActivityItem[];
}

export function ProfileActivityTab({ activity }: ProfileActivityTabProps) {
  if (activity.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No recent activity</p>
        <p className="text-sm mt-1">Public activity will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activity.map((item) => (
        <ActivityRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = item.type === "review" ? Star : Package;
  const link =
    item.type === "review"
      ? `/filament/${item.entityId}`
      : `/vault?tab=projects&project=${item.entityId}`;

  return (
    <Link
      to={link}
      className="flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors group"
    >
      <div className="mt-0.5 p-1.5 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors">
        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{item.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
        </p>
      </div>
    </Link>
  );
}
