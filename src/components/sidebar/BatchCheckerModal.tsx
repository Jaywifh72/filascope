import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SafetyAlert } from "@/hooks/useSafetyAlerts";
import { CheckCircle2, AlertTriangle, Search } from "lucide-react";

interface BatchCheckerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: SafetyAlert | null;
}

type CheckResult = "safe" | "affected" | null;

export function BatchCheckerModal({ open, onOpenChange, alert }: BatchCheckerModalProps) {
  const [batchNumber, setBatchNumber] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CheckResult>(null);

  const handleCheck = async () => {
    if (!batchNumber.trim() || !alert) return;

    setIsChecking(true);
    
    // Simulate batch check - in production this would query a database
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simple logic: if batch number contains any part of the affected batch info, it's affected
    const isAffected = alert.batch_info
      ? batchNumber.toLowerCase().includes(alert.batch_info.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 3))
      : false;

    setResult(isAffected ? "affected" : "safe");
    setIsChecking(false);
  };

  const handleClose = () => {
    setBatchNumber("");
    setResult(null);
    onOpenChange(false);
  };

  if (!alert) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Check Your Spool
          </DialogTitle>
          <DialogDescription>
            Enter your batch number to check if your {alert.brand} {alert.material} spool is affected by this recall.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Batch Number</label>
            <p className="text-xs text-muted-foreground">
              Usually found on the spool label or packaging
            </p>
            <Input
              placeholder="e.g., 402, 2024-08-15, LOT123"
              value={batchNumber}
              onChange={(e) => {
                setBatchNumber(e.target.value);
                setResult(null);
              }}
              disabled={isChecking}
            />
          </div>

          {result === "safe" && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-950/30 border border-green-500/30">
              <CheckCircle2 className="h-6 w-6 text-green-400 shrink-0" />
              <div>
                <p className="font-semibold text-green-400">Your spool is safe</p>
                <p className="text-sm text-muted-foreground">
                  Batch "{batchNumber}" is not affected by this recall.
                </p>
              </div>
            </div>
          )}

          {result === "affected" && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-950/30 border border-red-500/30">
              <AlertTriangle className="h-6 w-6 text-red-400 shrink-0" />
              <div>
                <p className="font-semibold text-red-400">Your spool may be affected</p>
                <p className="text-sm text-muted-foreground">
                  Batch "{batchNumber}" matches the recall criteria. Please stop using this spool and contact {alert.brand} for a replacement.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleCheck}
              disabled={!batchNumber.trim() || isChecking}
              className="flex-1"
            >
              {isChecking ? "Checking..." : "Check Batch"}
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>

          {alert.details_url && (
            <p className="text-xs text-center text-muted-foreground">
              For complete information, see the{" "}
              <a
                href={alert.details_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                full safety bulletin
              </a>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
