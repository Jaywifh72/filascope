import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Upload, RefreshCw, Trash2, Edit, Database, Package, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
}

export function RecentActivityLog() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from("admin_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setActivities(data);
    }
    setLoading(false);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'import': return Upload;
      case 'scrape': return RefreshCw;
      case 'delete': return Trash2;
      case 'update': return Edit;
      default: return Database;
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'filament': return Package;
      case 'printer': return Database;
      case 'accessory': return Wrench;
      default: return Database;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'import': return "bg-green-500/10 text-green-500";
      case 'scrape': return "bg-blue-500/10 text-blue-500";
      case 'delete': return "bg-red-500/10 text-red-500";
      case 'update': return "bg-yellow-500/10 text-yellow-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-40 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No recent activity</p>
          <p className="text-sm text-muted-foreground mt-1">
            Actions will appear here as you use admin features
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const ActionIcon = getActionIcon(activity.action_type);
            const EntityIcon = getEntityIcon(activity.entity_type);
            
            return (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
              >
                <div className={`p-2 rounded-full ${getActionColor(activity.action_type)}`}>
                  <ActionIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground capitalize">
                      {activity.action_type}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <EntityIcon className="w-3 h-3 mr-1" />
                      {activity.entity_type}
                    </Badge>
                  </div>
                  {activity.details?.message && (
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.details.message}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
