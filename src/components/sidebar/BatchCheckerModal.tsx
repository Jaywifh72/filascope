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
import { CheckCircle2, AlertTriangle, Search, ExternalLink, Mail, Phone, Trash2 } from "lucide-react";

interface BatchCheckerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: SafetyAlert | null;
}

type CheckResult = "safe" | "affected" | null;

const FORMAT_EXAMPLES = [
  { format: "#402", description: "Batch number" },
  { format: "2024-08-15", description: "Production date" },
  { format: "LOT4023", description: "Lot number" },
];

export function BatchCheckerModal({ open, onOpenChange, alert }: BatchCheckerModalProps) {
  const [batchNumber, setBatchNumber] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CheckResult>(null);

  const handleCheck = async () => {
    if (!batchNumber.trim() || !alert) return;

    setIsChecking(true);
    
    // Simulate check delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check against affected_batches array
    const normalizedInput = batchNumber.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    let isAffected = false;
    
    if (alert.affected_batches && Array.isArray(alert.affected_batches)) {
      isAffected = alert.affected_batches.some((batch) => {
        const normalizedBatch = batch.toLowerCase().replace(/[^a-z0-9]/g, "");
        return (
          normalizedInput.includes(normalizedBatch) ||
          normalizedBatch.includes(normalizedInput)
        );
      });
    } else if (alert.batch_info) {
      // Fallback to old logic
      const normalizedBatchInfo = alert.batch_info.toLowerCase().replace(/[^a-z0-9]/g, "");
      isAffected = normalizedInput.includes(normalizedBatchInfo.slice(0, 3));
    }

    setResult(isAffected ? "affected" : "safe");
    setIsChecking(false);
  };

  const handleClose = () => {
    setBatchNumber("");
    setResult(null);
    onOpenChange(false);
  };

  // Parse contact info
  const contactParts = alert?.manufacturer_contact?.split("|").map((s) => s.trim()) || [];
  const email = contactParts.find((p) => p.includes("@"));
  const phone = contactParts.find((p) => p.match(/^\+?[\d\s()-]+$/) || p.match(/^\d/));

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
            Enter your batch number to check if your {alert.brand} {alert.material} spool is affected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Batch Number</label>
            <p className="text-xs text-muted-foreground">
              Found on the spool label or packaging
            </p>
            <Input
              placeholder="e.g., #402, 2024-08-15, LOT4023"
              value={batchNumber}
              onChange={(e) => {
                setBatchNumber(e.target.value);
                setResult(null);
              }}
              disabled={isChecking}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            />

            {/* Format examples */}
            <div className="flex flex-wrap gap-2 mt-2">
              {FORMAT_EXAMPLES.map((ex) => (
                <button
                  key={ex.format}
                  type="button"
                  onClick={() => setBatchNumber(ex.format)}
                  className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  {ex.format}
                </button>
              ))}
            </div>
          </div>

          {/* Safe result */}
          {result === "safe" && (
            <div className="p-4 rounded-lg bg-green-950/30 border border-green-500/30 space-y-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-400 shrink-0" />
                <div>
                  <p className="font-semibold text-green-400">Your spool is safe</p>
                  <p className="text-sm text-muted-foreground">
                    Batch "{batchNumber}" is not affected by this recall.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  setBatchNumber("");
                  setResult(null);
                }}
              >
                Check another batch
              </Button>
            </div>
          )}

          {/* Affected result */}
          {result === "affected" && (
            <div className="p-4 rounded-lg bg-red-950/30 border border-red-500/30 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-400 shrink-0" />
                <div>
                  <p className="font-semibold text-red-400">Your spool may be affected</p>
                  <p className="text-sm text-muted-foreground">
                    Batch "{batchNumber}" matches the recall criteria.
                  </p>
                </div>
              </div>

              {/* What to do */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">What to do:</p>
                <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Stop using this spool immediately</li>
                  <li>Contact {alert.brand} for replacement</li>
                  {alert.disposal_instructions && (
                    <li>{alert.disposal_instructions}</li>
                  )}
                </ol>
              </div>

              {/* Contact info */}
              {(email || phone) && (
                <div className="flex flex-wrap gap-3 pt-2 border-t border-red-500/20">
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80"
                    >
                      <Mail className="h-4 w-4" />
                      {email}
                    </a>
                  )}
                  {phone && (
                    <a
                      href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80"
                    >
                      <Phone className="h-4 w-4" />
                      {phone}
                    </a>
                  )}
                </div>
              )}

              {/* Replacement process */}
              {alert.replacement_process && (
                <details className="group">
                  <summary className="text-sm text-primary cursor-pointer hover:text-primary/80">
                    View replacement instructions
                  </summary>
                  <p className="text-sm text-muted-foreground mt-2 pl-3 border-l-2 border-border whitespace-pre-line">
                    {alert.replacement_process}
                  </p>
                </details>
              )}

              {/* Disposal instructions */}
              {alert.disposal_instructions && (
                <div className="flex items-start gap-2 p-2 rounded bg-muted/50">
                  <Trash2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Safe disposal:</span> {alert.disposal_instructions}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {result === null && (
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
          )}

          {/* Official recall link */}
          {alert.recall_url && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              asChild
            >
              <a href={alert.recall_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Official Recall Page
              </a>
            </Button>
          )}

          {alert.details_url && !alert.recall_url && (
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
