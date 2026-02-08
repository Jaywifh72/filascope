import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type NoteStatus = "want_to_try" | "currently_using" | "used_before" | "not_recommended";

export interface UserNote {
  id: string;
  user_id: string;
  product_id: string;
  product_type: "filament" | "printer";
  note_text: string;
  tags: string[];
  status: NoteStatus | null;
  created_at: string;
  updated_at: string;
}

interface SaveNoteInput {
  product_id: string;
  product_type: "filament" | "printer";
  note_text: string;
  tags?: string[];
  status?: NoteStatus | null;
}

/**
 * Hook to fetch a single note for a specific product (for product pages)
 */
export function useProductNote(productId: string | undefined, productType: "filament" | "printer") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-note", user?.id, productId, productType],
    enabled: !!user && !!productId,
    queryFn: async (): Promise<UserNote | null> => {
      const { data, error } = await supabase
        .from("user_notes")
        .select("*")
        .eq("user_id", user!.id)
        .eq("product_id", productId!)
        .eq("product_type", productType)
        .maybeSingle();

      if (error) throw error;
      return data as UserNote | null;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch all user notes (for Vault)
 */
export function useAllUserNotes(filters?: {
  status?: NoteStatus | null;
  productType?: "filament" | "printer" | null;
  sortBy?: "date" | "name" | "status";
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-notes-all", user?.id, filters?.status, filters?.productType, filters?.sortBy],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("user_notes")
        .select("*")
        .eq("user_id", user!.id);

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.productType) {
        query = query.eq("product_type", filters.productType);
      }

      // Default sort by date
      query = query.order("updated_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const notes = (data || []) as UserNote[];

      // Enrich with product data
      const filamentIds = notes.filter(n => n.product_type === "filament").map(n => n.product_id);
      const printerIds = notes.filter(n => n.product_type === "printer").map(n => n.product_id);

      let filamentMap = new Map<string, any>();
      let printerMap = new Map<string, any>();

      if (filamentIds.length > 0) {
        const { data: filaments } = await supabase
          .from("filaments")
          .select("id, product_title, vendor, featured_image, material")
          .in("id", filamentIds);
        filamentMap = new Map((filaments || []).map(f => [f.id, f]));
      }

      if (printerIds.length > 0) {
        const { data: printers } = await supabase
          .from("printers")
          .select("id, model_name, display_name, printer_brands(brand)")
          .in("id", printerIds);
        printerMap = new Map((printers || []).map((p: any) => [p.id, {
          id: p.id,
          product_title: p.display_name || p.model_name,
          vendor: p.printer_brands?.brand || null,
          featured_image: null,
        }]));
      }

      return notes.map(note => ({
        ...note,
        product: note.product_type === "filament"
          ? filamentMap.get(note.product_id) || null
          : printerMap.get(note.product_id) || null,
      }));
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook for saving (upsert) and deleting notes
 */
export function useNoteMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const saveNote = useMutation({
    mutationFn: async (input: SaveNoteInput) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("user_notes")
        .upsert(
          {
            user_id: user.id,
            product_id: input.product_id,
            product_type: input.product_type,
            note_text: input.note_text,
            tags: input.tags || [],
            status: input.status || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,product_id,product_type",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-note", user?.id, variables.product_id, variables.product_type] });
      queryClient.invalidateQueries({ queryKey: ["user-notes-all"] });
      queryClient.invalidateQueries({ queryKey: ["vault-counts"] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async ({ noteId, productId, productType }: { noteId: string; productId: string; productType: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("user_notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-note"] });
      queryClient.invalidateQueries({ queryKey: ["user-notes-all"] });
      queryClient.invalidateQueries({ queryKey: ["vault-counts"] });
    },
  });

  return { saveNote, deleteNote };
}
