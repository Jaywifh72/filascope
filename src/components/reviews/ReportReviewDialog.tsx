import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Flag } from "lucide-react";

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "fake", label: "Fake Review" },
  { value: "other", label: "Other" },
] as const;

interface ReportReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string, details?: string) => void;
  isSubmitting: boolean;
}

export function ReportReviewDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: ReportReviewDialogProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit(reason, details.trim() || undefined);
    setReason("");
    setDetails("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setReason("");
      setDetails("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Report Review
          </DialogTitle>
          <DialogDescription>
            Help us keep reviews honest. Select a reason for flagging this review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional Details (optional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context..."
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
