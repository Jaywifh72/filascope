import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Copy, Plus, Tag, Pencil, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAffiliateDiscountCodes, useCreateDiscountCode, useUpdateDiscountCode } from "@/hooks/useAffiliatePrograms";
import type { AffiliateDiscountCode } from "@/types/affiliate";

const scopeStyles: Record<string, string> = {
  all_stores: "bg-green-500/20 text-green-400 border-green-500/30",
  resin_products: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pla_filament: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  specific_product: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const scopeLabels: Record<string, string> = {
  all_stores: "All Stores",
  resin_products: "Resin",
  pla_filament: "PLA",
  specific_product: "Product",
};

interface DiscountCodesCardProps {
  programId: string;
  brandName?: string;
  allProgramIds?: string[];
}

export function DiscountCodesCard({ programId, brandName, allProgramIds }: DiscountCodesCardProps) {
  const { data: codes = [], isLoading } = useAffiliateDiscountCodes(programId, allProgramIds);
  const createCode = useCreateDiscountCode();
  const updateCode = useUpdateDiscountCode();
  const [showExpired, setShowExpired] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<AffiliateDiscountCode | null>(null);

  const now = new Date().toISOString();
  const visibleCodes = showExpired
    ? codes
    : codes.filter((c) => !c.valid_until || c.valid_until > now);

  const getStatus = (code: AffiliateDiscountCode) => {
    if (!code.is_active) return { label: "Inactive", class: "bg-muted text-muted-foreground" };
    if (code.valid_from && code.valid_from > now) return { label: "Upcoming", class: "bg-blue-500/20 text-blue-400" };
    if (code.valid_until && code.valid_until < now) return { label: "Expired", class: "bg-muted text-muted-foreground" };
    return { label: "Active", class: "bg-green-500/20 text-green-400" };
  };

  const activeCodes = codes.filter((c) => c.is_active && (!c.valid_until || c.valid_until > now));

  const openCreate = () => { setEditingCode(null); setDialogOpen(true); };
  const openEdit = (code: AffiliateDiscountCode) => { setEditingCode(code); setDialogOpen(true); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: any = {
      program_id: programId,
      code: fd.get("code") as string || null,
      discount_type: fd.get("discount_type") as string || null,
      discount_value: fd.get("discount_value") ? Number(fd.get("discount_value")) : null,
      description: fd.get("description") as string || null,
      display_text: fd.get("display_text") as string || null,
      min_purchase_amount: fd.get("min_purchase_amount") ? Number(fd.get("min_purchase_amount")) : null,
      valid_from: fd.get("valid_from") as string || null,
      valid_until: fd.get("valid_until") as string || null,
      is_exclusive: fd.get("is_exclusive") === "on",
      posting_restrictions: fd.get("posting_restrictions") as string || null,
      is_active: true,
      is_assigned: true,
    };
    try {
      if (editingCode) {
        await updateCode.mutateAsync({ ...payload, id: editingCode.id });
        toast.success("Discount code updated");
      } else {
        await createCode.mutateAsync(payload);
        toast.success("Discount code created");
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
          <Tag className="w-4 h-4 text-purple-400" /> Discount Codes
          <Badge variant="secondary">{activeCodes.length}</Badge>
        </h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Switch checked={showExpired} onCheckedChange={setShowExpired} />
            Show expired
          </label>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Code
          </Button>
        </div>
      </div>

      {codes.length === 0 && !isLoading ? (
        <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm text-yellow-300">
          No coupon code assigned yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Display Text</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleCodes.map((code) => {
              const status = getStatus(code);
              const isExpired = code.valid_until && code.valid_until < now;
              const scope = code.scope || "all_stores";
              return (
                <TableRow key={code.id} className={isExpired ? "opacity-50" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <code className="font-mono text-sm">{code.code || "—"}</code>
                      {code.code && (
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(code.code!); toast.success("Copied"); }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${scopeStyles[scope] || scopeStyles.all_stores}`}>
                      {scopeLabels[scope] || scope}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{code.discount_type || "—"}</TableCell>
                  <TableCell className="text-sm">{code.discount_value != null ? code.discount_value : "—"}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{code.display_text || "—"}</TableCell>
                  <TableCell className="text-sm">{code.valid_until ? new Date(code.valid_until).toLocaleDateString() : "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={status.class}>{status.label}</Badge></TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(code)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Posting restrictions warning */}
      {codes.some((c) => c.posting_restrictions) && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <strong>Posting Restrictions:</strong>
            {codes.filter((c) => c.posting_restrictions).map((c) => (
              <p key={c.id} className="mt-1">{c.posting_restrictions}</p>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCode ? "Edit Discount Code" : "Add Discount Code"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code</Label><Input name="code" defaultValue={editingCode?.code || ""} placeholder="SAVE10" /></div>
              <div><Label>Discount Type</Label><Input name="discount_type" defaultValue={editingCode?.discount_type || ""} placeholder="percentage" /></div>
              <div><Label>Discount Value</Label><Input name="discount_value" type="number" step="0.01" defaultValue={editingCode?.discount_value ?? ""} placeholder="10" /></div>
              <div><Label>Min Purchase</Label><Input name="min_purchase_amount" type="number" step="0.01" defaultValue={editingCode?.min_purchase_amount ?? ""} /></div>
              <div><Label>Valid From</Label><Input name="valid_from" type="date" defaultValue={editingCode?.valid_from?.split("T")[0] || ""} /></div>
              <div><Label>Valid Until</Label><Input name="valid_until" type="date" defaultValue={editingCode?.valid_until?.split("T")[0] || ""} /></div>
            </div>
            <div><Label>Description</Label><Input name="description" defaultValue={editingCode?.description || ""} /></div>
            <div><Label>Display Text</Label><Input name="display_text" defaultValue={editingCode?.display_text || ""} placeholder="Use code SAVE10 for 10% off" /></div>
            <div className="flex items-center gap-2">
              <Switch name="is_exclusive" defaultChecked={editingCode?.is_exclusive ?? false} />
              <Label>Exclusive code</Label>
            </div>
            <div><Label>Posting Restrictions</Label><Textarea name="posting_restrictions" defaultValue={editingCode?.posting_restrictions || ""} rows={2} /></div>
            <DialogFooter>
              <Button type="submit" disabled={createCode.isPending || updateCode.isPending}>
                {editingCode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
