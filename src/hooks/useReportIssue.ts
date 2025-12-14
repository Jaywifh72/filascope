import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface CommunityReport {
  id: string;
  user_id: string | null;
  brand: string;
  material: string;
  batch_number: string | null;
  issue_type: string;
  description: string;
  severity: string;
  status: string;
  upvote_count: number;
  created_at: string;
}

export interface ReportFormData {
  brand: string;
  material: string;
  batch_number?: string;
  issue_type: string;
  description: string;
  severity: string;
  filament_id?: string;
}

export function useReportIssue() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (formData: ReportFormData) => {
      const reportData = {
        user_id: user?.id || null,
        brand: formData.brand,
        material: formData.material,
        batch_number: formData.batch_number || null,
        issue_type: formData.issue_type,
        description: formData.description,
        severity: formData.severity,
        filament_id: formData.filament_id || null,
        status: "pending",
      };

      const { data, error } = await supabase
        .from("community_safety_reports")
        .insert(reportData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-reports"] });
      toast.success("Report submitted", {
        description: "Our team will review your report shortly.",
      });
    },
    onError: (error) => {
      toast.error("Failed to submit report: " + error.message);
    },
  });

  return {
    submitReport: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
  };
}

export function useCommunityReports(brand?: string, material?: string) {
  return useQuery({
    queryKey: ["community-reports", brand, material],
    queryFn: async () => {
      let query = supabase
        .from("community_safety_reports")
        .select("*")
        .in("status", ["pending", "investigating", "verified"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (brand) {
        query = query.eq("brand", brand);
      }
      if (material) {
        query = query.eq("material", material);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CommunityReport[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
