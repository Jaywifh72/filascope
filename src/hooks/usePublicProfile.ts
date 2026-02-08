import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// UUID v4 regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PublicProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  username_slug: string | null;
  social_links: Record<string, string>;
  wishlist_public: boolean;
  created_at: string | null;
}

export interface PublicReview {
  id: string;
  product_id: string;
  product_type: string;
  overall_rating: number;
  headline: string;
  body: string;
  helpful_count: number;
  is_verified_purchase: boolean;
  created_at: string;
  status: string;
  filament?: {
    id: string;
    product_title: string;
    vendor: string;
    featured_image: string | null;
    color_hex: string | null;
  } | null;
}

export interface PublicProject {
  id: string;
  name: string;
  description: string | null;
  project_type: string;
  status: string;
  cover_image_url: string | null;
  is_public: boolean;
  created_at: string;
  material_count: number;
}

export interface WishlistItem {
  id: string;
  created_at: string | null;
  filament: {
    id: string;
    product_title: string;
    vendor: string;
    featured_image: string | null;
    color_hex: string | null;
    material: string | null;
    variant_price: number | null;
  } | null;
}

export interface ActivityItem {
  id: string;
  type: "review" | "project";
  description: string;
  timestamp: string;
  entityId: string;
}

export interface ProfileBadge {
  label: string;
  variant: "default" | "secondary" | "outline";
}

function computeBadges(reviews: PublicReview[], projects: PublicProject[]): ProfileBadge[] {
  const badges: ProfileBadge[] = [];

  if (reviews.length >= 20) {
    badges.push({ label: "Top Reviewer", variant: "default" });
  } else if (reviews.length >= 5) {
    badges.push({ label: "Active Reviewer", variant: "secondary" });
  }

  if (projects.length >= 1) {
    badges.push({ label: "Project Creator", variant: "secondary" });
  }

  if (reviews.some((r) => r.is_verified_purchase)) {
    badges.push({ label: "Verified Buyer", variant: "outline" });
  }

  return badges;
}

export function usePublicProfile(identifier: string | undefined) {
  const { user } = useAuth();

  // Resolve profile — use v_public_profiles view (excludes email and sensitive fields)
  // Falls back to profiles table for the authenticated user viewing their own non-public profile
  const profileQuery = useQuery({
    queryKey: ["public-profile", identifier, user?.id],
    queryFn: async () => {
      if (!identifier) throw new Error("No identifier");

      // First try the secure public view (only exposes safe columns)
      let query = supabase
        .from("v_public_profiles" as any)
        .select("id, display_name, avatar_url, bio, is_public, username_slug, social_links, wishlist_public, created_at");

      if (UUID_REGEX.test(identifier)) {
        query = query.eq("id", identifier);
      } else {
        query = query.eq("username_slug", identifier);
      }

      const { data, error } = await query.single();

      // If found in public view, return it
      if (data && !error) {
        return data as unknown as PublicProfile;
      }

      // If not found and user is logged in, this might be their own non-public profile
      // Fall back to direct table access (RLS "Users can view own profile" allows this)
      if (user) {
        const { data: ownData, error: ownError } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, bio, is_public, username_slug, social_links, wishlist_public, created_at")
          .eq("id", user.id)
          .single();

        if (!ownError && ownData) {
          // Verify this is actually the user's own profile matching the identifier
          const isMatch = UUID_REGEX.test(identifier)
            ? ownData.id === identifier
            : (ownData as any).username_slug === identifier;

          if (isMatch) {
            return ownData as unknown as PublicProfile;
          }
        }
      }

      // Re-throw original error if not own profile
      if (error) throw error;
      throw new Error("Profile not found");
    },
    enabled: !!identifier,
  });

  const profileId = profileQuery.data?.id;
  const isOwnProfile = !!user && !!profileId && user.id === profileId;
  const isVisible = profileQuery.data?.is_public || isOwnProfile;

  // Fetch reviews
  const reviewsQuery = useQuery({
    queryKey: ["public-profile-reviews", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id, product_id, product_type, overall_rating, headline, body, helpful_count, is_verified_purchase, created_at, status")
        .eq("user_id", profileId!)
        .eq("is_public", true)
        .eq("status", "published")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with filament data for filament reviews
      const filamentIds = (data || [])
        .filter((r) => r.product_type === "filament")
        .map((r) => r.product_id);

      let filamentMap: Record<string, any> = {};
      if (filamentIds.length > 0) {
        const { data: filaments } = await supabase
          .from("filaments")
          .select("id, product_title, vendor, featured_image, color_hex")
          .in("id", filamentIds);

        if (filaments) {
          filamentMap = Object.fromEntries(filaments.map((f) => [f.id, f]));
        }
      }

      return (data || []).map((r) => ({
        ...r,
        filament: r.product_type === "filament" ? filamentMap[r.product_id] || null : null,
      })) as PublicReview[];
    },
    enabled: !!profileId && isVisible,
  });

  // Fetch projects
  const projectsQuery = useQuery({
    queryKey: ["public-profile-projects", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, project_type, status, cover_image_url, is_public, created_at, project_materials(id)")
        .eq("user_id", profileId!)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        project_type: p.project_type,
        status: p.status,
        cover_image_url: p.cover_image_url,
        is_public: p.is_public,
        created_at: p.created_at,
        material_count: p.project_materials?.length || 0,
      })) as PublicProject[];
    },
    enabled: !!profileId && isVisible,
  });

  // Fetch wishlist (only if public)
  const wishlistQuery = useQuery({
    queryKey: ["public-profile-wishlist", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("id, created_at, filament:filaments(id, product_title, vendor, featured_image, color_hex, material, variant_price)")
        .eq("user_id", profileId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as WishlistItem[];
    },
    enabled: !!profileId && isVisible && !!profileQuery.data?.wishlist_public,
  });

  // Compute activity feed
  const reviews = reviewsQuery.data || [];
  const projects = projectsQuery.data || [];

  const activity: ActivityItem[] = [
    ...reviews.map((r) => ({
      id: `review-${r.id}`,
      type: "review" as const,
      description: `Reviewed ${r.filament?.product_title || "a product"}: "${r.headline}"`,
      timestamp: r.created_at,
      entityId: r.product_id,
    })),
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      type: "project" as const,
      description: `Created project "${p.name}"`,
      timestamp: p.created_at,
      entityId: p.id,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  const badges = computeBadges(reviews, projects);

  const totalHelpfulVotes = reviews.reduce((sum, r) => sum + r.helpful_count, 0);

  return {
    profile: profileQuery.data ?? null,
    reviews,
    projects,
    wishlistItems: wishlistQuery.data || [],
    activity,
    badges,
    totalHelpfulVotes,
    isLoading: profileQuery.isLoading,
    isOwnProfile,
    isVisible,
    isNotFound: profileQuery.isError || (!profileQuery.isLoading && !profileQuery.data),
  };
}
