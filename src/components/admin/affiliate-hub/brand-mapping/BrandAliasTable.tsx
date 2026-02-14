import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Check, X, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

interface Alias {
  id: string;
  product_vendor_name: string;
  affiliate_brand_name: string;
}

export function BrandAliasTable() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState("");
  const [affiliateName, setAffiliateName] = useState("");
  const [vendorSuggestions, setVendorSuggestions] = useState<string[]>([]);
  const [affiliateSuggestions, setAffiliateSuggestions] = useState<string[]>([]);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);
  const [showAffiliateSuggestions, setShowAffiliateSuggestions] = useState(false);

  const { data: aliases = [], isLoading } = useQuery({
    queryKey: ["brand-affiliate-aliases-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_affiliate_aliases")
        .select("*")
        .order("product_vendor_name");
      if (error) throw error;
      return data as Alias[];
    },
  });

  const { data: distinctVendors = [] } = useQuery({
    queryKey: ["distinct-filament-vendors"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("vendor")
        .not("vendor", "is", null);
      if (error) return [];
      const unique = [...new Set((data || []).map((d) => d.vendor).filter(Boolean))] as string[];
      return unique.sort();
    },
  });

  const { data: distinctBrandNames = [] } = useQuery({
    queryKey: ["distinct-affiliate-brand-names"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_programs")
        .select("brand_name");
      if (error) return [];
      const unique = [...new Set((data || []).map((d) => d.brand_name))] as string[];
      return unique.sort();
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ id, vendor, affiliate }: { id?: string; vendor: string; affiliate: string }) => {
      if (id) {
        const { error } = await supabase
          .from("brand_affiliate_aliases")
          .update({ product_vendor_name: vendor, affiliate_brand_name: affiliate })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("brand_affiliate_aliases")
          .insert({ product_vendor_name: vendor, affiliate_brand_name: affiliate });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-affiliate-aliases-all"] });
      queryClient.invalidateQueries({ queryKey: ["brand-affiliate-alias"] });
      queryClient.invalidateQueries({ queryKey: ["unmatched-brands"] });
      resetForm();
      toast.success("Alias saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("brand_affiliate_aliases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-affiliate-aliases-all"] });
      queryClient.invalidateQueries({ queryKey: ["brand-affiliate-alias"] });
      queryClient.invalidateQueries({ queryKey: ["unmatched-brands"] });
      toast.success("Alias deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setAdding(false);
    setEditingId(null);
    setVendorName("");
    setAffiliateName("");
  };

  const startEdit = (alias: Alias) => {
    setEditingId(alias.id);
    setVendorName(alias.product_vendor_name);
    setAffiliateName(alias.affiliate_brand_name);
    setAdding(false);
  };

  const handleSave = () => {
    if (!vendorName.trim() || !affiliateName.trim()) return;
    upsertMutation.mutate({
      id: editingId || undefined,
      vendor: vendorName.trim(),
      affiliate: affiliateName.trim(),
    });
  };

  const filterVendorSuggestions = (val: string) => {
    setVendorName(val);
    if (val.length > 0) {
      setVendorSuggestions(distinctVendors.filter((v) => v.toLowerCase().includes(val.toLowerCase())).slice(0, 8));
      setShowVendorSuggestions(true);
    } else {
      setShowVendorSuggestions(false);
    }
  };

  const filterAffiliateSuggestions = (val: string) => {
    setAffiliateName(val);
    if (val.length > 0) {
      setAffiliateSuggestions(distinctBrandNames.filter((v) => v.toLowerCase().includes(val.toLowerCase())).slice(0, 8));
      setShowAffiliateSuggestions(true);
    } else {
      setShowAffiliateSuggestions(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          Brand Aliases
        </CardTitle>
        <Button size="sm" onClick={() => { resetForm(); setAdding(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Alias
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Vendor Name</TableHead>
              <TableHead>Affiliate Brand Name</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adding && (
              <TableRow>
                <TableCell>
                  <div className="relative">
                    <Input
                      value={vendorName}
                      onChange={(e) => filterVendorSuggestions(e.target.value)}
                      onFocus={() => vendorName && setShowVendorSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowVendorSuggestions(false), 200)}
                      placeholder="e.g. eSun"
                      className="h-8"
                    />
                    {showVendorSuggestions && vendorSuggestions.length > 0 && (
                      <div className="absolute z-10 top-full left-0 w-full bg-popover border border-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                        {vendorSuggestions.map((s) => (
                          <button key={s} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted" onMouseDown={() => { setVendorName(s); setShowVendorSuggestions(false); }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <Input
                      value={affiliateName}
                      onChange={(e) => filterAffiliateSuggestions(e.target.value)}
                      onFocus={() => affiliateName && setShowAffiliateSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowAffiliateSuggestions(false), 200)}
                      placeholder="e.g. eSUN"
                      className="h-8"
                    />
                    {showAffiliateSuggestions && affiliateSuggestions.length > 0 && (
                      <div className="absolute z-10 top-full left-0 w-full bg-popover border border-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                        {affiliateSuggestions.map((s) => (
                          <button key={s} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted" onMouseDown={() => { setAffiliateName(s); setShowAffiliateSuggestions(false); }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave} disabled={upsertMutation.isPending}>
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={resetForm}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {aliases.map((a) => (
              <TableRow key={a.id}>
                {editingId === a.id ? (
                  <>
                    <TableCell>
                      <div className="relative">
                        <Input value={vendorName} onChange={(e) => filterVendorSuggestions(e.target.value)} onFocus={() => vendorName && setShowVendorSuggestions(true)} onBlur={() => setTimeout(() => setShowVendorSuggestions(false), 200)} className="h-8" />
                        {showVendorSuggestions && vendorSuggestions.length > 0 && (
                          <div className="absolute z-10 top-full left-0 w-full bg-popover border border-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                            {vendorSuggestions.map((s) => (
                              <button key={s} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted" onMouseDown={() => { setVendorName(s); setShowVendorSuggestions(false); }}>{s}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <Input value={affiliateName} onChange={(e) => filterAffiliateSuggestions(e.target.value)} onFocus={() => affiliateName && setShowAffiliateSuggestions(true)} onBlur={() => setTimeout(() => setShowAffiliateSuggestions(false), 200)} className="h-8" />
                        {showAffiliateSuggestions && affiliateSuggestions.length > 0 && (
                          <div className="absolute z-10 top-full left-0 w-full bg-popover border border-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                            {affiliateSuggestions.map((s) => (
                              <button key={s} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted" onMouseDown={() => { setAffiliateName(s); setShowAffiliateSuggestions(false); }}>{s}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave} disabled={upsertMutation.isPending}>
                          <Check className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={resetForm}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="font-mono text-sm">{a.product_vendor_name}</TableCell>
                    <TableCell className="font-mono text-sm">{a.affiliate_brand_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(a)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(a.id)} disabled={deleteMutation.isPending}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
            {!isLoading && aliases.length === 0 && !adding && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No aliases configured yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
