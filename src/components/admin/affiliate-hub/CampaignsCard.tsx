import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Megaphone, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAffiliateCampaigns, useCreateCampaign, useUpdateCampaign } from "@/hooks/useAffiliatePrograms";
import type { AffiliateCampaign } from "@/types/affiliate";

interface CampaignsCardProps {
  programId: string;
  brandName?: string;
  allProgramIds?: string[];
}

export function CampaignsCard({ programId, brandName, allProgramIds }: CampaignsCardProps) {
  const { data: campaigns = [] } = useAffiliateCampaigns(programId, allProgramIds);
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AffiliateCampaign | null>(null);

  const now = new Date().toISOString();

  const getStatus = (c: AffiliateCampaign) => {
    if (!c.is_active) return { label: "Inactive", class: "bg-muted text-muted-foreground", order: 3 };
    if (c.end_date && c.end_date < now) return { label: "Ended", class: "bg-muted text-muted-foreground", order: 2 };
    if (c.start_date && c.start_date > now) return { label: "Upcoming", class: "bg-blue-500/20 text-blue-400", order: 1 };
    return { label: "Active", class: "bg-green-500/20 text-green-400", order: 0 };
  };

  const sorted = [...campaigns].sort((a, b) => getStatus(a).order - getStatus(b).order);
  const activeCount = campaigns.filter((c) => c.is_active && (!c.end_date || c.end_date >= now)).length;

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (c: AffiliateCampaign) => { setEditing(c); setDialogOpen(true); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: any = {
      program_id: programId,
      campaign_name: fd.get("campaign_name") as string,
      campaign_description: fd.get("campaign_description") as string || null,
      campaign_url: fd.get("campaign_url") as string || null,
      campaign_type: fd.get("campaign_type") as string || null,
      start_date: fd.get("start_date") as string || null,
      end_date: fd.get("end_date") as string || null,
      notes: fd.get("notes") as string || null,
      is_active: true,
    };
    try {
      if (editing) {
        await updateCampaign.mutateAsync({ ...payload, id: editing.id });
        toast.success("Campaign updated");
      } else {
        await createCampaign.mutateAsync(payload);
        toast.success("Campaign created");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="p-5 bg-card border-border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-orange-400" /> Active Campaigns
          <Badge variant="secondary">{activeCount}</Badge>
        </h3>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Campaign
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No campaigns configured yet.</p>
      ) : (
        <div className="grid gap-3">
          {sorted.map((c) => {
            const status = getStatus(c);
            return (
              <div key={c.id} className="rounded-md border border-border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{c.campaign_name}</span>
                    {c.campaign_type && <Badge variant="outline" className="text-xs">{c.campaign_type}</Badge>}
                    {c.deal_scope && <Badge variant="outline" className="text-xs bg-muted/50">{c.deal_scope}</Badge>}
                    <Badge variant="outline" className={status.class}>{status.label}</Badge>
                    {c.region_specific && (
                      <Badge variant="outline" className="text-[10px] bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        {c.region_specific} only
                      </Badge>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {c.campaign_description && <p className="text-sm text-muted-foreground">{c.campaign_description}</p>}
                <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span>
                    {c.start_date ? new Date(c.start_date).toLocaleDateString() : "—"} → {c.end_date ? new Date(c.end_date).toLocaleDateString() : "Ongoing"}
                  </span>
                  {c.creative_asset_count != null && <span>· {c.creative_asset_count} assets</span>}
                  {c.target_audience && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                      {c.target_audience}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Campaign" : "Add Campaign"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Campaign Name *</Label><Input name="campaign_name" required defaultValue={editing?.campaign_name || ""} /></div>
            <div><Label>Type</Label><Input name="campaign_type" defaultValue={editing?.campaign_type || ""} placeholder="product_launch, seasonal, etc." /></div>
            <div><Label>Description</Label><Textarea name="campaign_description" defaultValue={editing?.campaign_description || ""} rows={2} /></div>
            <div><Label>Campaign URL</Label><Input name="campaign_url" defaultValue={editing?.campaign_url || ""} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input name="start_date" type="date" defaultValue={editing?.start_date?.split("T")[0] || ""} /></div>
              <div><Label>End Date</Label><Input name="end_date" type="date" defaultValue={editing?.end_date?.split("T")[0] || ""} /></div>
            </div>
            <div><Label>Notes</Label><Textarea name="notes" defaultValue={editing?.notes || ""} rows={2} /></div>
            <DialogFooter>
              <Button type="submit" disabled={createCampaign.isPending || updateCampaign.isPending}>
                {editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
