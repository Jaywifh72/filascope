import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useCreateDiscountCode, useUpdateDiscountCode } from "@/hooks/useAffiliatePrograms";
import type { AffiliateDiscountCode, AffiliateProgram } from "@/types/affiliate";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: AffiliateDiscountCode | null;
  programs: AffiliateProgram[];
}

const EMPTY = {
  program_id: "",
  code: "",
  discount_type: "fixed",
  discount_value: "",
  display_text: "",
  is_exclusive: false,
  valid_from: "",
  valid_until: "",
  description: "",
};

export function DiscountCodeFormDialog({ open, onOpenChange, code, programs }: Props) {
  const [form, setForm] = useState(EMPTY);
  const createCode = useCreateDiscountCode();
  const updateCode = useUpdateDiscountCode();
  const isEditing = !!code;

  useEffect(() => {
    if (code) {
      setForm({
        program_id: code.program_id,
        code: code.code || "",
        discount_type: code.discount_type || "fixed",
        discount_value: code.discount_value != null ? String(code.discount_value) : "",
        display_text: code.display_text || "",
        is_exclusive: !!code.is_exclusive,
        valid_from: code.valid_from?.slice(0, 10) || "",
        valid_until: code.valid_until?.slice(0, 10) || "",
        description: code.description || "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [code, open]);

  const set = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.program_id || !form.code) {
      toast({ title: "Program and code are required", variant: "destructive" });
      return;
    }

    const payload: any = {
      program_id: form.program_id,
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: form.discount_value ? Number(form.discount_value) : null,
      display_text: form.display_text || null,
      is_exclusive: form.is_exclusive,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      description: form.description || null,
    };

    try {
      if (isEditing) {
        await updateCode.mutateAsync({ id: code!.id, ...payload });
      } else {
        await createCode.mutateAsync(payload);
      }
      toast({ title: "Code saved" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Discount Code" : "Add Discount Code"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Program *</label>
            <Select value={form.program_id} onValueChange={(v) => set("program_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.brand_name} ({p.region_code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Code *</label>
            <Input
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              className="font-mono uppercase"
              placeholder="SAVE25"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Discount Type</label>
              <Select value={form.discount_type} onValueChange={(v) => set("discount_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Value</label>
              <Input type="number" value={form.discount_value} onChange={(e) => set("discount_value", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Display Text</label>
            <Input value={form.display_text} onChange={(e) => set("display_text", e.target.value)} placeholder="Save $25 on orders over $200" />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={form.is_exclusive} onCheckedChange={(v) => set("is_exclusive", !!v)} />
            <span>Exclusive code</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Valid From</label>
              <Input type="date" value={form.valid_from} onChange={(e) => set("valid_from", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Valid Until</label>
              <Input type="date" value={form.valid_until} onChange={(e) => set("valid_until", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{isEditing ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
