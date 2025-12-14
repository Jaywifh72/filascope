import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAlertHistory, HistoricalAlert } from "@/hooks/useAlertHistory";
import { History, Search, CheckCircle2, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface AlertHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusStyles = {
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    color: "text-green-400",
    bg: "bg-green-500/20",
  },
  ongoing: {
    label: "Ongoing",
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/20",
  },
  active: {
    label: "Active",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/20",
  },
};

function AlertHistoryCard({ alert }: { alert: HistoricalAlert }) {
  const status = alert.resolution_status || "active";
  const statusConfig = statusStyles[status as keyof typeof statusStyles] || statusStyles.active;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground">
            {alert.brand} {alert.material}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {alert.reason}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 text-xs", statusConfig.color, statusConfig.bg)}
        >
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusConfig.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Created: {format(parseISO(alert.created_at), "MMM d, yyyy")}</span>
        {alert.resolved_at && (
          <span>Resolved: {format(parseISO(alert.resolved_at), "MMM d, yyyy")}</span>
        )}
      </div>

      {alert.resolution_notes && (
        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          Resolution: {alert.resolution_notes}
        </p>
      )}
    </div>
  );
}

export function AlertHistoryModal({ open, onOpenChange }: AlertHistoryModalProps) {
  const [filter, setFilter] = useState<"all" | "resolved" | "active">("all");
  const [search, setSearch] = useState("");
  const { data: alerts, isLoading } = useAlertHistory(filter, search);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Safety Alert History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex gap-1">
            {(["all", "resolved", "active"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>

          {/* Alert list */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <AlertHistoryCard key={alert.id} alert={alert} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <History className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No alerts found</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
