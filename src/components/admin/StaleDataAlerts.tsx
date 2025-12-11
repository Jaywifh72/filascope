import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, ChevronRight, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaleDataAlert {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  count: number;
  entityType: string;
  link: string;
}

interface StaleDataAlertsProps {
  alerts: StaleDataAlert[];
  loading: boolean;
}

export function StaleDataAlerts({ alerts, loading }: StaleDataAlertsProps) {
  if (loading) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return AlertCircle;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  };

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'critical': return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        icon: "text-red-500",
        badge: "bg-red-500 text-white"
      };
      case 'warning': return {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        icon: "text-yellow-500",
        badge: "bg-yellow-500 text-black"
      };
      default: return {
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        icon: "text-blue-500",
        badge: "bg-blue-500 text-white"
      };
    }
  };

  // Sort alerts by severity
  const sortedAlerts = [...alerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.type] - order[b.type];
  });

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Data Alerts</h3>
        </div>
        {alerts.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {alerts.length} issue{alerts.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {sortedAlerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
            <Info className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-muted-foreground">All data is up to date!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAlerts.map((alert, index) => {
            const Icon = getAlertIcon(alert.type);
            const colors = getAlertColors(alert.type);
            
            return (
              <Link
                key={index}
                to={alert.link}
                className={cn(
                  "block p-4 rounded-lg border transition-colors hover:bg-muted/50",
                  colors.bg,
                  colors.border
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className={cn("w-5 h-5 mt-0.5", colors.icon)} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{alert.title}</span>
                        <Badge className={cn("text-xs", colors.badge)}>
                          {alert.count}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
