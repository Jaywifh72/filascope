import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCreateProgram, useUpdateProgram } from "@/hooks/useAffiliatePrograms";
import type { AffiliateProgram } from "@/types/affiliate";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: AffiliateProgram | null;
}

const EMPTY = {
  brand_name: "",
  region_code: "",
  affiliate_id: "",
  affiliate_network: "",
  portal_url: "",
  commission_rate: "",
  commission_type: "percentage",
  link_template: "",
  store_base_url: "",
  program_notes: "",
  tracking_parameter: "",
  tracking_value: "",
};

/** Extract GoAffPro settings URL from notes */
function extractSettingsUrl(notes: string): string | null {
  const match = notes.match(/https:\/\/\S+goaffpro\.com\/settings\S*/);
  return match ? match[0] : null;
}

/** Extract sca_ref value from a link template */
function extractScaRef(template: string): { param: string; token: string } | null {
  const match = template.match(/sca_ref=([^\s&]+)/);
  if (!match) return null;
  return { param: `sca_ref=${match[1]}`, token: match[1] };
}

export function ProgramFormDialog({ open, onOpenChange, program }: Props) {
  const [form, setForm] = useState(EMPTY);
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const isEditing = !!program;

  useEffect(() => {
    if (program) {
      setForm({
        brand_name: program.brand_name || "",
        region_code: program.region_code || "",
        affiliate_id: program.affiliate_id || "",
        affiliate_network: program.affiliate_network || "",
        portal_url: program.portal_url || "",
        commission_rate: program.commission_rate != null ? String(program.commission_rate) : "",
        commission_type: program.commission_type || "percentage",
        link_template: program.link_template || "",
        store_base_url: program.store_base_url || "",
        program_notes: program.program_notes || "",
        tracking_parameter: program.tracking_parameter || "",
        tracking_value: program.tracking_value || "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [program, open]);

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const settingsUrl = extractSettingsUrl(form.program_notes);
  const scaRef = useMemo(() => extractScaRef(form.link_template), [form.link_template]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied" });
  };

  const handleSave = async () => {
    if (!form.brand_name || !form.region_code || !form.link_template) {
      toast({ title: "Missing required fields", variant: "destructive" });
      return;
    }

    const payload: any = {
      brand_name: form.brand_name,
      region_code: form.region_code,
      affiliate_id: form.affiliate_id || null,
      affiliate_network: form.affiliate_network,
      portal_url: form.portal_url || null,
      commission_rate: form.commission_rate ? Number(form.commission_rate) : null,
      commission_type: form.commission_type,
      link_template: form.link_template,
      store_base_url: form.store_base_url,
      program_notes: form.program_notes || null,
      tracking_parameter: form.tracking_parameter || "",
      tracking_value: form.tracking_value || "",
    };

    try {
      if (isEditing) {
        await updateProgram.mutateAsync({ id: program!.id, ...payload });
      } else {
        await createProgram.mutateAsync(payload);
      }
      toast({ title: `${form.brand_name} program saved` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Program" : "Add Program"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Brand Name *" value={form.brand_name} onChange={(v) => set("brand_name", v)} />
          <Field label="Region Code *" value={form.region_code} onChange={(v) => set("region_code", v)} placeholder="AU, UK, US, EU, GLOBAL…" />
          <Field label="Affiliate ID" value={form.affiliate_id} onChange={(v) => set("affiliate_id", v)} />
          <Field label="Platform / Network" value={form.affiliate_network} onChange={(v) => set("affiliate_network", v)} placeholder="GoAffPro, UpPromote, Impact, Awin…" />
          <Field label="Portal URL" value={form.portal_url} onChange={(v) => set("portal_url", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Commission Rate" value={form.commission_rate} onChange={(v) => set("commission_rate", v)} type="number" />
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Commission Type</label>
              <Select value={form.commission_type} onValueChange={(v) => set("commission_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Link Template *</label>
            <Input value={form.link_template} onChange={(e) => set("link_template", e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Use {"{path}"} as placeholder for product path</p>
          </div>
          <Field label="Base Store URL" value={form.store_base_url} onChange={(v) => set("store_base_url", v)} />
          <Field label="Tracking Parameter" value={form.tracking_parameter} onChange={(v) => set("tracking_parameter", v)} />
          <Field label="Tracking Value" value={form.tracking_value} onChange={(v) => set("tracking_value", v)} />

          {/* UpPromote ref fields — read-only convenience display */}
          {scaRef && (
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">UpPromote Ref (parsed from template)</p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-24 flex-shrink-0">Ref Parameter</label>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate">{scaRef.param}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => copyToClipboard(scaRef.param)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground w-24 flex-shrink-0">Full Ref Token</label>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate">{scaRef.token}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => copyToClipboard(scaRef.token)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
            <Textarea value={form.program_notes} onChange={(e) => set("program_notes", e.target.value)} rows={3} />
          </div>

          {/* Payment setup link parsed from notes */}
          {settingsUrl && (
            <a
              href={settingsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              Configure payment at GoAffPro Settings
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <Input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
