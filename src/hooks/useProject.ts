import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type ProjectStatus = "planning" | "in_progress" | "completed" | "archived";
export type ProjectType = "single_print" | "multi_part" | "collection" | "custom";
export type PurchaseStatus = "need_to_buy" | "purchased" | "in_use" | "done";

export interface ProjectMaterial {
  id: string;
  project_id: string;
  filament_id: string;
  quantity_grams: number | null;
  quantity_spools: number;
  note: string;
  sort_order: number;
  purchase_status: PurchaseStatus;
  created_at: string;
  filament?: {
    id: string;
    product_title: string;
    vendor: string | null;
    material: string | null;
    color_hex: string | null;
    featured_image: string | null;
    variant_price: number | null;
    price_cad: number | null;
    price_eur: number | null;
    price_gbp: number | null;
    price_aud: number | null;
    price_jpy: number | null;
    net_weight_g: number | null;
    pack_quantity: number | null;
    product_handle: string | null;
  };
}

export interface ProjectAccessory {
  id: string;
  project_id: string;
  name: string;
  url: string | null;
  price: number | null;
  currency: string;
  purchase_status: PurchaseStatus;
  sort_order: number;
  created_at: string;
}

export interface ProjectLogEntry {
  id: string;
  project_id: string;
  user_id: string;
  entry_text: string;
  created_at: string;
  photos?: { id: string; photo_url: string; created_at: string }[];
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  project_type: ProjectType;
  status: ProjectStatus;
  cover_image_url: string | null;
  is_public: boolean;
  printer_id: string | null;
  budget: number | null;
  budget_currency: string | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
  printer?: { id: string; model_name: string; brand: { brand: string } | null } | null;
  materials?: ProjectMaterial[];
  accessories?: ProjectAccessory[];
  log_entries?: ProjectLogEntry[];
}

export function useProjects(statusFilter?: ProjectStatus | "all") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects", user?.id, statusFilter],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, project_materials(id)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useProject(projectId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["project-detail", projectId],
    enabled: !!projectId && !!user,
    queryFn: async () => {
      const [projectRes, materialsRes, accessoriesRes, logRes] = await Promise.all([
        supabase
          .from("projects")
          .select("*, printer:printers(id, model_name, brand:printer_brands(brand))")
          .eq("id", projectId!)
          .single(),
        supabase
          .from("project_materials")
          .select(`*, filament:filaments(id, product_title, vendor, material, color_hex, featured_image, variant_price, price_cad, price_eur, price_gbp, price_aud, price_jpy, net_weight_g, pack_quantity, product_handle)`)
          .eq("project_id", projectId!)
          .order("sort_order", { ascending: true }),
        supabase
          .from("project_accessories")
          .select("*")
          .eq("project_id", projectId!)
          .order("sort_order", { ascending: true }),
        supabase
          .from("project_log_entries")
          .select("*, photos:project_log_photos(*)")
          .eq("project_id", projectId!)
          .order("created_at", { ascending: false }),
      ]);

      if (projectRes.error) throw projectRes.error;

      return {
        ...projectRes.data,
        materials: materialsRes.data ?? [],
        accessories: accessoriesRes.data ?? [],
        log_entries: logRes.data ?? [],
      } as Project;
    },
  });
}

export function useProjectMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["project-detail"] });
    queryClient.invalidateQueries({ queryKey: ["vault-counts"] });
    queryClient.invalidateQueries({ queryKey: ["vault-projects-summary"] });
  };

  const createProject = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      project_type: ProjectType;
      is_public?: boolean;
      printer_id?: string | null;
      cover_image_url?: string | null;
    }) => {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          user_id: user!.id,
          name: data.name,
          description: data.description || null,
          project_type: data.project_type,
          is_public: data.is_public ?? false,
          printer_id: data.printer_id || null,
          cover_image_url: data.cover_image_url || null,
          slug,
        })
        .select("id")
        .single();
      if (error) throw error;
      return project;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Project created");
    },
    onError: () => toast.error("Failed to create project"),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { error } = await supabase.from("projects").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Project updated");
    },
    onError: () => toast.error("Failed to update project"),
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Project deleted");
    },
    onError: () => toast.error("Failed to delete project"),
  });

  const duplicateProject = useMutation({
    mutationFn: async (projectId: string) => {
      // Fetch source project
      const { data: src, error: srcErr } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (srcErr) throw srcErr;

      // Create copy
      const { data: newProject, error: newErr } = await supabase
        .from("projects")
        .insert({
          user_id: user!.id,
          name: `${src.name} (Copy)`,
          description: src.description,
          project_type: src.project_type,
          status: "planning",
          is_public: false,
          printer_id: src.printer_id,
          budget: src.budget,
          budget_currency: src.budget_currency,
        })
        .select("id")
        .single();
      if (newErr) throw newErr;

      // Copy materials
      const { data: materials } = await supabase
        .from("project_materials")
        .select("*")
        .eq("project_id", projectId);
      if (materials?.length) {
        await supabase.from("project_materials").insert(
          materials.map((m: any) => ({
            project_id: newProject.id,
            filament_id: m.filament_id,
            quantity_grams: m.quantity_grams,
            quantity_spools: m.quantity_spools,
            note: m.note,
            sort_order: m.sort_order,
            purchase_status: "need_to_buy",
          }))
        );
      }

      // Copy accessories
      const { data: accessories } = await supabase
        .from("project_accessories")
        .select("*")
        .eq("project_id", projectId);
      if (accessories?.length) {
        await supabase.from("project_accessories").insert(
          accessories.map((a: any) => ({
            project_id: newProject.id,
            name: a.name,
            url: a.url,
            price: a.price,
            currency: a.currency,
            purchase_status: "need_to_buy",
            sort_order: a.sort_order,
          }))
        );
      }

      return newProject;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Project duplicated");
    },
    onError: () => toast.error("Failed to duplicate project"),
  });

  // Material mutations
  const addMaterial = useMutation({
    mutationFn: async (data: {
      project_id: string;
      filament_id: string;
      quantity_grams?: number;
      quantity_spools?: number;
      note?: string;
    }) => {
      const { error } = await supabase.from("project_materials").insert({
        project_id: data.project_id,
        filament_id: data.filament_id,
        quantity_grams: data.quantity_grams ?? null,
        quantity_spools: data.quantity_spools ?? 1,
        note: data.note ?? "",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Filament added");
    },
    onError: () => toast.error("Failed to add filament"),
  });

  const updateMaterial = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectMaterial> & { id: string }) => {
      const { error } = await supabase.from("project_materials").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const removeMaterial = useMutation({
    mutationFn: async (materialId: string) => {
      const { error } = await supabase.from("project_materials").delete().eq("id", materialId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Filament removed");
    },
    onError: () => toast.error("Failed to remove filament"),
  });

  // Accessory mutations
  const addAccessory = useMutation({
    mutationFn: async (data: {
      project_id: string;
      name: string;
      url?: string;
      price?: number;
      currency?: string;
    }) => {
      const { error } = await supabase.from("project_accessories").insert({
        project_id: data.project_id,
        name: data.name,
        url: data.url ?? null,
        price: data.price ?? null,
        currency: data.currency ?? "USD",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Accessory added");
    },
    onError: () => toast.error("Failed to add accessory"),
  });

  const updateAccessory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectAccessory> & { id: string }) => {
      const { error } = await supabase.from("project_accessories").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const removeAccessory = useMutation({
    mutationFn: async (accessoryId: string) => {
      const { error } = await supabase.from("project_accessories").delete().eq("id", accessoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Accessory removed");
    },
    onError: () => toast.error("Failed to remove accessory"),
  });

  // Log mutations
  const addLogEntry = useMutation({
    mutationFn: async (data: {
      project_id: string;
      entry_text: string;
      photos?: File[];
    }) => {
      const { data: entry, error } = await supabase
        .from("project_log_entries")
        .insert({
          project_id: data.project_id,
          user_id: user!.id,
          entry_text: data.entry_text,
        })
        .select("id")
        .single();
      if (error) throw error;

      // Upload photos
      if (data.photos?.length) {
        for (const photo of data.photos) {
          const filePath = `${user!.id}/${entry.id}/${Date.now()}-${photo.name}`;
          const { error: uploadErr } = await supabase.storage
            .from("project-images")
            .upload(filePath, photo);
          if (uploadErr) continue;

          const { data: urlData } = supabase.storage
            .from("project-images")
            .getPublicUrl(filePath);

          await supabase.from("project_log_photos").insert({
            log_entry_id: entry.id,
            photo_url: urlData.publicUrl,
          });
        }
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Log entry added");
    },
    onError: () => toast.error("Failed to add log entry"),
  });

  const deleteLogEntry = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from("project_log_entries").delete().eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Log entry deleted");
    },
    onError: () => toast.error("Failed to delete log entry"),
  });

  return {
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    addMaterial,
    updateMaterial,
    removeMaterial,
    addAccessory,
    updateAccessory,
    removeAccessory,
    addLogEntry,
    deleteLogEntry,
  };
}
