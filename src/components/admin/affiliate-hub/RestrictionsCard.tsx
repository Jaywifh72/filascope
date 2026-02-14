import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Shield, Ban, AlertTriangle, Info, Plus, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAffiliateProgramRestrictions,
  useCreateRestriction,
  useDeleteRestriction,
  type AffiliateProgramRestriction,
} from "@/hooks/useAffiliatePrograms";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  trademark: Shield,
  prohibited: Ban,
  warning: AlertTriangle,
};

const severityColors: Record<string, string> = {
  mandatory: "bg-red-500/20 text-red-400 border-red-500/30",
  recommended: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  informational: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

interface RestrictionsCardProps {
  programId: string;
}

export function RestrictionsCard({ programId }: RestrictionsCardProps) {
  const { data: restrictions = [] } = useAffiliateProgramRestrictions(programId);
  const createRestriction = useCreateRestriction();
  const deleteRestriction = useDeleteRestriction();
  const [dialogOpen, setDialogOpen] = useState(false);

  const copyAll = () => {
    const text = restrictions.map((r) => `[${r.severity || "info"}] ${r.restriction_type}: ${r.description}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied all restrictions");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createRestriction.mutateAsync({
        program_id: programId,
        restriction_type: fd.get("restriction_type") as string,
        description: fd.get("description") as string,
        severity: fd.get("severity") as string || "informational",
      });
      toast.success("Restriction added");
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (r: AffiliateProgramRestriction) => {
    try {
      await deleteRestriction.mutateAsync({ id: r.id, program_id: programId });
      toast.success("Restriction removed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="p-5 bg-card border-border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-400" /> Program Restrictions & Rules
        </h3>
        <div className="flex gap-2">
          {restrictions.length > 0 && (
            <Button size="sm" variant="outline" onClick={copyAll}>
              <Copy className="w-3 h-3 mr-1.5" /> Copy All
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add
          </Button>
        </div>
      </div>

      {restrictions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No restrictions defined.</p>
      ) : (
        <div className="space-y-1.5">
          {restrictions.map((r) => {
            const Icon = typeIcons[r.restriction_type] || Info;
            const sevClass = severityColors[r.severity || "informational"] || severityColors.informational;
            return (
              <div key={r.id} className="flex items-start gap-3 py-1.5 group">
                <Icon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <Badge variant="outline" className={`shrink-0 text-[10px] ${sevClass}`}>
                  {r.severity || "info"}
                </Badge>
                <span className="text-sm text-foreground flex-1">{r.description}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(r)}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Restriction</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Type</Label><Input name="restriction_type" required placeholder="trademark, ppc, coupon_sites, etc." /></div>
            <div><Label>Severity</Label><Input name="severity" placeholder="mandatory, recommended, informational" defaultValue="mandatory" /></div>
            <div><Label>Description</Label><Input name="description" required placeholder="Do not bid on brand terms..." /></div>
            <DialogFooter>
              <Button type="submit" disabled={createRestriction.isPending}>Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
