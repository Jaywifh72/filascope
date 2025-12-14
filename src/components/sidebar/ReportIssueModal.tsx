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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReportIssue, ReportFormData } from "@/hooks/useReportIssue";
import { AlertTriangle, Loader2, Info } from "lucide-react";

interface ReportIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ISSUE_TYPES = [
  { value: "clogging", label: "Nozzle clogging" },
  { value: "contamination", label: "Contamination/particles" },
  { value: "fire_risk", label: "Safety hazard (smoke, fire)" },
  { value: "quality", label: "Quality issue (brittleness, stringing)" },
  { value: "other", label: "Other" },
];

const SEVERITY_LEVELS = [
  { value: "low", label: "Low", description: "Minor inconvenience" },
  { value: "moderate", label: "Moderate", description: "Affects print quality" },
  { value: "high", label: "High", description: "Potential damage to printer" },
  { value: "critical", label: "Critical", description: "Safety risk" },
];

export function ReportIssueModal({ open, onOpenChange }: ReportIssueModalProps) {
  const { submitReport, isSubmitting } = useReportIssue();

  const [brand, setBrand] = useState("");
  const [material, setMaterial] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [confirmed, setConfirmed] = useState(false);

  const resetForm = () => {
    setBrand("");
    setMaterial("");
    setBatchNumber("");
    setIssueType("");
    setDescription("");
    setSeverity("moderate");
    setConfirmed(false);
  };

  const handleSubmit = () => {
    if (!brand || !material || !issueType || !description || !confirmed) return;

    const formData: ReportFormData = {
      brand,
      material,
      batch_number: batchNumber || undefined,
      issue_type: issueType,
      description,
      severity,
    };

    submitReport(formData);
    resetForm();
    onOpenChange(false);
  };

  const isValid = brand && material && issueType && description && confirmed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Report a Material Issue
          </DialogTitle>
          <DialogDescription>
            Help keep the community safe by reporting problems with filaments
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-5 py-2">
            {/* Brand and material */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand *</Label>
                <Input
                  placeholder="e.g., Sunlu"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Material *</Label>
                <Input
                  placeholder="e.g., PLA+"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                />
              </div>
            </div>

            {/* Batch number */}
            <div className="space-y-2">
              <Label>Batch Number (optional)</Label>
              <Input
                placeholder="e.g., #402, LOT2024-08"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Found on spool label or packaging
              </p>
            </div>

            {/* Issue type */}
            <div className="space-y-3">
              <Label>Issue Type *</Label>
              <RadioGroup value={issueType} onValueChange={setIssueType}>
                {ISSUE_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.value} id={`issue-${type.value}`} />
                    <Label htmlFor={`issue-${type.value}`} className="font-normal">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Describe the issue *</Label>
              <Textarea
                placeholder="What happened? When did you notice the issue? What printer were you using?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Severity */}
            <div className="space-y-3">
              <Label>Severity</Label>
              <RadioGroup value={severity} onValueChange={setSeverity}>
                {SEVERITY_LEVELS.map((level) => (
                  <div key={level.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={level.value} id={`severity-${level.value}`} />
                    <Label htmlFor={`severity-${level.value}`} className="font-normal">
                      <span className="font-medium">{level.label}</span>
                      <span className="text-muted-foreground ml-1">({level.description})</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Confirmation */}
            <div className="flex items-start space-x-2 p-3 rounded-lg bg-muted/50 border border-border/50">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <Label htmlFor="confirm" className="text-sm font-normal leading-relaxed">
                I confirm this report is accurate and based on my personal experience
              </Label>
            </div>

            {/* Info notice */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-950/20 border border-blue-500/30">
              <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Reports are reviewed by our team before being published as alerts.
                We may contact you for additional information.
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting} className="flex-1">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
