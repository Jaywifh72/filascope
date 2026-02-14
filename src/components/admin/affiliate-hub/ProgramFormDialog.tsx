import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useCreateProgram, useUpdateProgram } from "@/hooks/useAffiliatePrograms";
import type { AffiliateProgram } from "@/types/affiliate";

interface ProgramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: AffiliateProgram | null;
}

export function ProgramFormDialog({ open, onOpenChange, program }: ProgramFormDialogProps) {
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const isEditing = !!program;

  // Live link preview state
  const [storeUrl, setStoreUrl] = useState(program?.store_base_url || "");
  const [linkTemplate, setLinkTemplate] = useState(program?.link_template || "{store_url}{path}?{tracking_value}");
  const [trackingValue, setTrackingValue] = useState(program?.tracking_value || "");

  const previewLink = useMemo(() => {
    return linkTemplate
      .replace("{store_url}", storeUrl || "https://store.example.com")
      .replace("{path}", "/products/sample")
      .replace("{tracking_value}", trackingValue || "YOUR_ID");
  }, [storeUrl, linkTemplate, trackingValue]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const payload: any = {
      brand_name: fd.get("brand_name") as string,
      region_code: fd.get("region_code") as string,
      store_base_url: fd.get("store_base_url") as string,
      affiliate_network: fd.get("affiliate_network") as string,
      affiliate_id: fd.get("affiliate_id") as string || null,
      referral_handle: fd.get("referral_handle") as string || null,
      account_email: fd.get("account_email") as string || null,
      portal_url: fd.get("portal_url") as string || null,
      account_status: fd.get("account_status") as string || "active",
      tracking_parameter: fd.get("tracking_parameter") as string,
      tracking_value: fd.get("tracking_value") as string,
      link_template: fd.get("link_template") as string,
      deep_linking_supported: fd.get("deep_linking_supported") === "on",
      commission_rate: fd.get("commission_rate") ? Number(fd.get("commission_rate")) : null,
      commission_type: fd.get("commission_type") as string || null,
      commission_notes: fd.get("commission_notes") as string || null,
      payout_schedule: fd.get("payout_schedule") as string || null,
      payout_method: fd.get("payout_method") as string || null,
      payout_currency: fd.get("payout_currency") as string || null,
      cookie_duration_hours: fd.get("cookie_duration_hours") ? Number(fd.get("cookie_duration_hours")) : null,
      cart_persistence_days: fd.get("cart_persistence_days") ? Number(fd.get("cart_persistence_days")) : null,
      attribution_model: fd.get("attribution_model") as string || null,
      program_notes: fd.get("program_notes") as string || null,
      status_notes: fd.get("status_notes") as string || null,
      is_active: true,
    };

    try {
      if (isEditing) {
        await updateProgram.mutateAsync({ ...payload, id: program.id });
        toast.success("Program updated");
      } else {
        await createProgram.mutateAsync(payload);
        toast.success("Program created");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Program" : "Add New Program"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Brand & Region */}
          <Section title="Brand & Region">
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Brand Name *</Label><Input name="brand_name" required defaultValue={program?.brand_name || ""} placeholder="Anycubic" /></div>
              <div><Label>Region Code *</Label><Input name="region_code" required defaultValue={program?.region_code || ""} placeholder="CA" /></div>
              <div>
                <Label>Store Base URL *</Label>
                <Input
                  name="store_base_url"
                  required
                  defaultValue={program?.store_base_url || ""}
                  placeholder="https://store.anycubic.com"
                  onChange={(e) => setStoreUrl(e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* Section 2: Network & Account */}
          <Section title="Network & Account">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Affiliate Network *</Label><Input name="affiliate_network" required defaultValue={program?.affiliate_network || ""} placeholder="GoAffPro, Impact, Awin..." /></div>
              <div><Label>Affiliate ID</Label><Input name="affiliate_id" defaultValue={program?.affiliate_id || ""} /></div>
              <div><Label>Referral Handle</Label><Input name="referral_handle" defaultValue={program?.referral_handle || ""} placeholder="JEANJACQUESBOILEAU" /></div>
              <div><Label>Account Email</Label><Input name="account_email" type="email" defaultValue={program?.account_email || ""} /></div>
              <div><Label>Portal URL</Label><Input name="portal_url" defaultValue={program?.portal_url || ""} /></div>
              <div><Label>Account Status</Label><Input name="account_status" defaultValue={program?.account_status || "active"} placeholder="active, pending_verification" /></div>
            </div>
          </Section>

          {/* Section 3: Tracking */}
          <Section title="Tracking">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tracking Parameter *</Label><Input name="tracking_parameter" required defaultValue={program?.tracking_parameter || ""} placeholder="ref" /></div>
              <div>
                <Label>Tracking Value *</Label>
                <Input
                  name="tracking_value"
                  required
                  defaultValue={program?.tracking_value || ""}
                  placeholder="JEANJACQUESBOILEAU"
                  onChange={(e) => setTrackingValue(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Link Template *</Label>
              <Input
                name="link_template"
                required
                defaultValue={program?.link_template || "{store_url}{path}?ref={tracking_value}"}
                placeholder="{store_url}{path}?ref={tracking_value}"
                onChange={(e) => setLinkTemplate(e.target.value)}
              />
              <div className="mt-2 text-xs text-muted-foreground">
                Preview: <code className="font-mono text-primary break-all">{previewLink}</code>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch name="deep_linking_supported" defaultChecked={program?.deep_linking_supported ?? false} />
              <Label>Deep Linking Supported</Label>
            </div>
          </Section>

          {/* Section 4: Commission & Payout */}
          <Section title="Commission & Payout">
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Commission Rate (%)</Label><Input name="commission_rate" type="number" step="0.1" min="0" defaultValue={program?.commission_rate ?? ""} /></div>
              <div><Label>Commission Type</Label><Input name="commission_type" defaultValue={program?.commission_type || ""} placeholder="percentage, flat, tiered" /></div>
              <div><Label>Payout Currency</Label><Input name="payout_currency" defaultValue={program?.payout_currency || ""} placeholder="CAD" /></div>
              <div><Label>Payout Schedule</Label><Input name="payout_schedule" defaultValue={program?.payout_schedule || ""} placeholder="monthly" /></div>
              <div><Label>Payout Method</Label><Input name="payout_method" defaultValue={program?.payout_method || ""} placeholder="PayPal, wire" /></div>
            </div>
            <div><Label>Commission Notes</Label><Textarea name="commission_notes" defaultValue={program?.commission_notes || ""} rows={2} /></div>
          </Section>

          {/* Section 5: Session & Attribution */}
          <Section title="Session & Attribution">
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Cookie Duration (hours)</Label><Input name="cookie_duration_hours" type="number" defaultValue={program?.cookie_duration_hours ?? ""} /></div>
              <div><Label>Cart Persistence (days)</Label><Input name="cart_persistence_days" type="number" defaultValue={program?.cart_persistence_days ?? ""} /></div>
              <div><Label>Attribution Model</Label><Input name="attribution_model" defaultValue={program?.attribution_model || ""} placeholder="last_click" /></div>
            </div>
          </Section>

          {/* Section 6: Notes */}
          <Section title="Notes">
            <div><Label>Program Notes</Label><Textarea name="program_notes" defaultValue={program?.program_notes || ""} rows={2} /></div>
            <div><Label>Status Notes</Label><Textarea name="status_notes" defaultValue={program?.status_notes || ""} rows={2} /></div>
          </Section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createProgram.isPending || updateProgram.isPending}>
              {isEditing ? "Update Program" : "Create Program"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground border-b border-border pb-1">{title}</h4>
      {children}
    </div>
  );
}
