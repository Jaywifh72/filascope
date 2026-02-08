import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface CommunityPhoto {
  id: string;
  user_id: string;
  product_id: string;
  product_type: string;
  caption: string | null;
  printer_id: string | null;
  nozzle_temp: number | null;
  bed_temp: number | null;
  layer_height: number | null;
  infill_pct: number | null;
  model_source: string | null;
  like_count: number;
  is_reported: boolean;
  created_at: string;
  files: { id: string; file_url: string; sort_order: number }[];
  user_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  printer?: {
    model_name: string;
    display_name: string | null;
  } | null;
  liked_by_me: boolean;
}

export interface UploadPhotoInput {
  product_id: string;
  product_type: string;
  caption?: string;
  printer_id?: string | null;
  nozzle_temp?: number | null;
  bed_temp?: number | null;
  layer_height?: number | null;
  infill_pct?: number | null;
  model_source?: string;
  files: File[];
}

export type PhotoSortOption = "recent" | "popular";
export type PhotoFilterOption = "all" | "mine" | string; // string = printer model filter

export function useCommunityPhotos(productId: string, productType: string = "filament") {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const photosQuery = useQuery({
    queryKey: ["community-photos", productId, productType],
    queryFn: async (): Promise<CommunityPhoto[]> => {
      const { data, error } = await supabase
        .from("community_photos")
        .select(`
          *,
          files:community_photo_files(id, file_url, sort_order),
          user_profile:profiles!community_photos_user_id_fkey(display_name, avatar_url),
          printer:printers!community_photos_printer_id_fkey(model_name, display_name)
        `)
        .eq("product_id", productId)
        .eq("product_type", productType)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Check which ones the current user has liked
      let likedSet = new Set<string>();
      if (user?.id && data && data.length > 0) {
        const photoIds = data.map((p: any) => p.id);
        const { data: likes } = await supabase
          .from("community_photo_likes")
          .select("photo_id")
          .eq("user_id", user.id)
          .in("photo_id", photoIds);
        likedSet = new Set((likes || []).map((l: any) => l.photo_id));
      }

      return (data || []).map((photo: any) => ({
        ...photo,
        files: (photo.files || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        user_profile: Array.isArray(photo.user_profile) ? photo.user_profile[0] : photo.user_profile,
        printer: Array.isArray(photo.printer) ? photo.printer[0] : photo.printer,
        liked_by_me: likedSet.has(photo.id),
      }));
    },
    staleTime: 1000 * 60 * 2,
  });

  const uploadPhoto = useMutation({
    mutationFn: async (input: UploadPhotoInput) => {
      if (!user?.id) throw new Error("Must be logged in");

      // 1. Create the photo record
      const { data: photo, error: photoError } = await supabase
        .from("community_photos")
        .insert({
          user_id: user.id,
          product_id: input.product_id,
          product_type: input.product_type,
          caption: input.caption || null,
          printer_id: input.printer_id || null,
          nozzle_temp: input.nozzle_temp ?? null,
          bed_temp: input.bed_temp ?? null,
          layer_height: input.layer_height ?? null,
          infill_pct: input.infill_pct ?? null,
          model_source: input.model_source || null,
        })
        .select("id")
        .single();

      if (photoError) throw photoError;

      // 2. Upload files to storage and create file records
      const fileRecords: { photo_id: string; file_url: string; sort_order: number }[] = [];

      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${photo.id}/${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("community-photos")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("community-photos")
          .getPublicUrl(path);

        fileRecords.push({
          photo_id: photo.id,
          file_url: urlData.publicUrl,
          sort_order: i,
        });
      }

      if (fileRecords.length > 0) {
        const { error: filesError } = await supabase
          .from("community_photo_files")
          .insert(fileRecords);

        if (filesError) throw filesError;
      }

      return photo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-photos", productId] });
      queryClient.invalidateQueries({ queryKey: ["community-photo-count"] });
      toast.success("Photo shared with the community!");
    },
    onError: (error: any) => {
      toast.error("Failed to upload photo", {
        description: error?.message || "Please try again",
      });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async ({ photoId, liked }: { photoId: string; liked: boolean }) => {
      if (!user?.id) throw new Error("Must be logged in");

      if (liked) {
        const { error } = await supabase
          .from("community_photo_likes")
          .delete()
          .eq("photo_id", photoId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("community_photo_likes")
          .insert({ photo_id: photoId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-photos", productId] });
    },
  });

  const reportPhoto = useMutation({
    mutationFn: async (photoId: string) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("community_photos")
        .update({ is_reported: true })
        .eq("id", photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Photo reported. We'll review it shortly.");
    },
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      if (!user?.id) throw new Error("Must be logged in");

      // Get files to delete from storage
      const { data: files } = await supabase
        .from("community_photo_files")
        .select("file_url")
        .eq("photo_id", photoId);

      // Delete storage files
      if (files && files.length > 0) {
        const paths = files.map((f: any) => {
          const url = new URL(f.file_url);
          const parts = url.pathname.split("/community-photos/");
          return parts[1] || "";
        }).filter(Boolean);

        if (paths.length > 0) {
          await supabase.storage.from("community-photos").remove(paths);
        }
      }

      // Delete photo record (cascade deletes files and likes)
      const { error } = await supabase
        .from("community_photos")
        .delete()
        .eq("id", photoId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-photos", productId] });
      queryClient.invalidateQueries({ queryKey: ["community-photo-count"] });
      toast.success("Photo deleted");
    },
  });

  return {
    photos: photosQuery.data ?? [],
    isLoading: photosQuery.isLoading,
    uploadPhoto: uploadPhoto.mutateAsync,
    isUploading: uploadPhoto.isPending,
    toggleLike: toggleLike.mutate,
    reportPhoto: reportPhoto.mutate,
    deletePhoto: deletePhoto.mutate,
    isDeleting: deletePhoto.isPending,
  };
}

/** Quick count of community photos for a product (for badges) */
export function useCommunityPhotoCount(productId: string | undefined, productType: string = "filament") {
  return useQuery({
    queryKey: ["community-photo-count", productId, productType],
    queryFn: async () => {
      if (!productId) return 0;
      const { count, error } = await supabase
        .from("community_photos")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId)
        .eq("product_type", productType);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });
}
