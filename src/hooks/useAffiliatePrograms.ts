import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  AffiliateProgram,
  AffiliateDiscountCode,
  AffiliateCampaign,
} from "@/types/affiliate";

/* ─── Programs ─── */

export function useAffiliatePrograms() {
  return useQuery({
    queryKey: ["affiliate-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_programs")
        .select("*")
        .order("brand_name");
      if (error) throw error;
      return data as AffiliateProgram[];
    },
  });
}

export function useAffiliateProgramStats() {
  return useQuery({
    queryKey: ["affiliate-program-stats"],
    queryFn: async () => {
      const [programs, clicks, codes, campaigns] = await Promise.all([
        supabase.from("affiliate_programs").select("id, is_active, account_status"),
        supabase
          .from("affiliate_clicks")
          .select("id", { count: "exact", head: true })
          .gte("clicked_at", new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase
          .from("affiliate_discount_codes")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("affiliate_campaigns")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
      ]);
      if (programs.error) throw programs.error;
      const all = programs.data || [];
      return {
        total: all.length,
        active: all.filter((p) => p.is_active).length,
        pending: all.filter((p) => p.account_status === "pending_verification").length,
        clicks30d: clicks.count || 0,
        activeCodes: codes.count || 0,
        activeCampaigns: campaigns.count || 0,
      };
    },
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (program: Omit<AffiliateProgram, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("affiliate_programs")
        .insert(program as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-programs"] });
      qc.invalidateQueries({ queryKey: ["affiliate-program-stats"] });
    },
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AffiliateProgram> & { id: string }) => {
      const { data, error } = await supabase
        .from("affiliate_programs")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-programs"] });
      qc.invalidateQueries({ queryKey: ["affiliate-program-stats"] });
    },
  });
}

/* ─── Discount Codes ─── */

export function useAffiliateDiscountCodes(programId: string | undefined, allProgramIds?: string[]) {
  const ids = allProgramIds && allProgramIds.length > 0 ? allProgramIds : programId ? [programId] : [];
  return useQuery({
    queryKey: ["affiliate-discount-codes", ids.sort().join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_discount_codes")
        .select("*")
        .in("program_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AffiliateDiscountCode[];
    },
  });
}

export function useCreateDiscountCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: Omit<AffiliateDiscountCode, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("affiliate_discount_codes")
        .insert(code as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["affiliate-discount-codes", v.program_id] });
      qc.invalidateQueries({ queryKey: ["affiliate-program-stats"] });
    },
  });
}

export function useUpdateDiscountCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AffiliateDiscountCode> & { id: string; program_id: string }) => {
      const { data, error } = await supabase
        .from("affiliate_discount_codes")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["affiliate-discount-codes", v.program_id] });
    },
  });
}

/* ─── Campaigns ─── */

export function useAffiliateCampaigns(programId: string | undefined, allProgramIds?: string[]) {
  const ids = allProgramIds && allProgramIds.length > 0 ? allProgramIds : programId ? [programId] : [];
  return useQuery({
    queryKey: ["affiliate-campaigns", ids.sort().join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_campaigns")
        .select("*")
        .in("program_id", ids)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as AffiliateCampaign[];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: Omit<AffiliateCampaign, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("affiliate_campaigns")
        .insert(campaign as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["affiliate-campaigns", v.program_id] });
      qc.invalidateQueries({ queryKey: ["affiliate-program-stats"] });
    },
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AffiliateCampaign> & { id: string; program_id: string }) => {
      const { data, error } = await supabase
        .from("affiliate_campaigns")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["affiliate-campaigns", v.program_id] });
    },
  });
}

/* ─── Restrictions ─── */

export interface AffiliateProgramRestriction {
  id: string;
  program_id: string;
  restriction_type: string;
  description: string;
  severity: string | null;
  created_at: string | null;
}

export function useAffiliateProgramRestrictions(programId: string | undefined, allProgramIds?: string[]) {
  const ids = allProgramIds && allProgramIds.length > 0 ? allProgramIds : programId ? [programId] : [];
  return useQuery({
    queryKey: ["affiliate-restrictions", ids.sort().join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_program_restrictions")
        .select("*")
        .in("program_id", ids)
        .order("severity");
      if (error) throw error;
      return data as AffiliateProgramRestriction[];
    },
  });
}

export function useCreateRestriction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (restriction: Omit<AffiliateProgramRestriction, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("affiliate_program_restrictions")
        .insert(restriction as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["affiliate-restrictions", v.program_id] });
    },
  });
}

export function useDeleteRestriction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, program_id }: { id: string; program_id: string }) => {
      const { error } = await supabase
        .from("affiliate_program_restrictions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["affiliate-restrictions", v.program_id] });
    },
  });
}
