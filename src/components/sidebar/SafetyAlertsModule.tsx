import { AlertTriangle, X, ChevronRight, History, Bell, Flag } from "lucide-react";
import { SidebarModule } from "./SidebarModule";
import { useSafetyAlerts, SafetyAlert } from "@/hooks/useSafetyAlerts";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BatchCheckerModal } from "./BatchCheckerModal";
import { AlertHistoryModal } from "./AlertHistoryModal";
import { AlertSubscriptionModal } from "./AlertSubscriptionModal";
import { ReportIssueModal } from "./ReportIssueModal";
import { ManufacturerResponse } from "./ManufacturerResponse";
import { CommunityReportsBadge } from "./CommunityReportsBadge";
import { cn } from "@/lib/utils";

const priorityStyles = {
  critical: {
    border: "border-l-4 border-l-red-500",
    bg: "bg-red-950/20",
    icon: "text-red-400",
  },
  warning: {
    border: "border-l-4 border-l-amber-500",
    bg: "bg-amber-950/20",
    icon: "text-amber-400",
  },
  info: {
    border: "border-l-4 border-l-blue-500",
    bg: "bg-blue-950/20",
    icon: "text-blue-400",
  },
};

function AlertCard({
  alert,
  onDismiss,
  onCheckBatch,
}: {
  alert: SafetyAlert;
  onDismiss: () => void;
  onCheckBatch: () => void;
}) {
  const styles = priorityStyles[alert.priority];

  return (
    <div className={cn("rounded-md p-3", styles.border, styles.bg)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <AlertTriangle className={cn("h-5 w-5 shrink-0 mt-0.5", styles.icon)} />
          <div className="space-y-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground leading-tight">
              {alert.brand} {alert.material}
              {alert.batch_info && (
                <span className="text-muted-foreground font-normal"> - {alert.batch_info}</span>
              )}
            </h4>
            <p className="text-sm text-muted-foreground">{alert.reason}</p>
            {alert.affected_timeframe && (
              <p className="text-xs text-muted-foreground">
                Affected: {alert.affected_timeframe}
              </p>
            )}
            
            {/* Community reports badge */}
            <CommunityReportsBadge brand={alert.brand} material={alert.material} />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Manufacturer response section */}
      <ManufacturerResponse
        statement={alert.manufacturer_statement}
        contact={alert.manufacturer_contact}
        recallUrl={alert.recall_url}
        replacementProcess={alert.replacement_process}
        brand={alert.brand}
      />

      <div className="flex items-center gap-2 mt-3 ml-7">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onCheckBatch}
        >
          Check your spool
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
        {alert.details_url && (
          <a
            href={alert.details_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Read full details
          </a>
        )}
      </div>
    </div>
  );
}

export function SafetyAlertsModule() {
  const { alerts, isLoading, dismissAlert, dismissedCount } = useSafetyAlerts();
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const handleCheckBatch = (alert: SafetyAlert) => {
    setSelectedAlert(alert);
    setBatchModalOpen(true);
  };

  // Don't render if no alerts (after dismissals)
  if (!isLoading && alerts.length === 0) {
    return null;
  }

  const displayedAlerts = alerts.slice(0, 2);
  const remainingCount = alerts.length - 2;

  return (
    <>
      <SidebarModule
        icon={<AlertTriangle className="h-5 w-5" />}
        title="Safety Alert"
        isLoading={isLoading}
        isEmpty={false}
        accentColor="amber"
        className="border-amber-500/30"
      >
        <div className="space-y-3">
          {displayedAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={() => dismissAlert(alert.id)}
              onCheckBatch={() => handleCheckBatch(alert)}
            />
          ))}

          {remainingCount > 0 && (
            <button className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors w-full justify-center">
              {remainingCount} more alert{remainingCount > 1 ? "s" : ""}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {dismissedCount > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {dismissedCount} alert{dismissedCount > 1 ? "s" : ""} dismissed
            </p>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-center gap-1 pt-2 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setHistoryModalOpen(true)}
            >
              <History className="h-3.5 w-3.5 mr-1" />
              History
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setSubscriptionModalOpen(true)}
            >
              <Bell className="h-3.5 w-3.5 mr-1" />
              Subscribe
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setReportModalOpen(true)}
            >
              <Flag className="h-3.5 w-3.5 mr-1" />
              Report
            </Button>
          </div>
        </div>
      </SidebarModule>

      <BatchCheckerModal
        open={batchModalOpen}
        onOpenChange={setBatchModalOpen}
        alert={selectedAlert}
      />

      <AlertHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
      />

      <AlertSubscriptionModal
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
      />

      <ReportIssueModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
      />
    </>
  );
}
