import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { z } from "zod";

export const displayNameSchema = z.string().trim().max(50, "Display name must be less than 50 characters").optional();
export const slugSchema = z.string().regex(/^[a-z0-9-]{3,30}$/, "3-30 characters: lowercase letters, numbers, hyphens only");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface ProfileData {
  display_name: string;
  email: string;
  avatar_url: string | null;
  bio: string;
  username_slug: string;
  is_public: boolean;
  wishlist_public: boolean;
  reviews_public: boolean;
  projects_public: boolean;
  purchases_public: boolean;
  social_links: Record<string, string>;
  printing_setup: PrintingSetup;
  preferences: Preferences;
  notification_settings: NotificationSettings;
  skill_level: string;
  preferred_currency: string | null;
  shipping_country: string | null;
}

export interface PrintingSetup {
  experience_level?: string;
  default_nozzle_diameter?: number;
  default_nozzle_material?: string;
}

export interface Preferences {
  default_spool_size?: string;
  units?: string;
  theme?: string;
  preferred_brands?: string[];
}

export interface NotificationSettings {
  email_price_alerts?: boolean;
  email_weekly_digest?: boolean;
  email_review_replies?: boolean;
  email_project_comments?: boolean;
  email_new_reviews?: boolean;
  onsite_notifications?: boolean;
}

const DEFAULT_PROFILE: ProfileData = {
  display_name: "",
  email: "",
  avatar_url: null,
  bio: "",
  username_slug: "",
  is_public: false,
  wishlist_public: false,
  reviews_public: true,
  projects_public: true,
  purchases_public: false,
  social_links: {},
  printing_setup: {},
  preferences: { units: "metric", theme: "system" },
  notification_settings: {
    email_price_alerts: true,
    email_weekly_digest: false,
    email_review_replies: true,
    email_project_comments: true,
    email_new_reviews: false,
    onsite_notifications: true,
  },
  skill_level: "beginner",
  preferred_currency: null,
  shipping_country: null,
};

export function useSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile({
          display_name: data.display_name || "",
          email: data.email || user.email || "",
          avatar_url: data.avatar_url || null,
          bio: (data as any).bio || "",
          username_slug: (data as any).username_slug || "",
          is_public: (data as any).is_public || false,
          wishlist_public: (data as any).wishlist_public || false,
          reviews_public: (data as any).reviews_public ?? true,
          projects_public: (data as any).projects_public ?? true,
          purchases_public: (data as any).purchases_public ?? false,
          social_links: ((data as any).social_links as Record<string, string>) || {},
          printing_setup: ((data as any).printing_setup as PrintingSetup) || {},
          preferences: ((data as any).preferences as Preferences) || DEFAULT_PROFILE.preferences,
          notification_settings: ((data as any).notification_settings as NotificationSettings) || DEFAULT_PROFILE.notification_settings,
          skill_level: data.skill_level || "beginner",
          preferred_currency: data.preferred_currency || null,
          shipping_country: data.shipping_country || null,
        });
      } else {
        setProfile(prev => ({ ...prev, email: user.email || "" }));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = useCallback(async (updates: Partial<ProfileData>) => {
    if (!user) return false;
    setSaving(true);
    try {
      const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };

      if (updates.display_name !== undefined) dbUpdates.display_name = updates.display_name.trim() || null;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio.trim() || null;
      if (updates.username_slug !== undefined) dbUpdates.username_slug = updates.username_slug.trim() || null;
      if (updates.is_public !== undefined) dbUpdates.is_public = updates.is_public;
      if (updates.wishlist_public !== undefined) dbUpdates.wishlist_public = updates.wishlist_public;
      if (updates.reviews_public !== undefined) dbUpdates.reviews_public = updates.reviews_public;
      if (updates.projects_public !== undefined) dbUpdates.projects_public = updates.projects_public;
      if (updates.purchases_public !== undefined) dbUpdates.purchases_public = updates.purchases_public;
      if (updates.social_links !== undefined) dbUpdates.social_links = updates.social_links;
      if (updates.printing_setup !== undefined) dbUpdates.printing_setup = updates.printing_setup;
      if (updates.preferences !== undefined) dbUpdates.preferences = updates.preferences;
      if (updates.notification_settings !== undefined) dbUpdates.notification_settings = updates.notification_settings;
      if (updates.skill_level !== undefined) dbUpdates.skill_level = updates.skill_level;
      if (updates.preferred_currency !== undefined) dbUpdates.preferred_currency = updates.preferred_currency;
      if (updates.shipping_country !== undefined) dbUpdates.shipping_country = updates.shipping_country;

      const { error } = await supabase
        .from("profiles")
        .update(dbUpdates)
        .eq("id", user.id);

      if (error) {
        const msg = error.message.includes("idx_profiles_username_slug")
          ? "This username is already taken."
          : "Failed to save. Please try again.";
        toast.error(msg);
        return false;
      }

      setProfile(prev => ({ ...prev, ...updates }));
      toast.success("Settings saved successfully.");
      return true;
    } catch {
      toast.error("Failed to save settings.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [user]);

  const validateSlug = useCallback(async (slug: string) => {
    if (!slug) {
      setSlugError(null);
      return true;
    }
    const result = slugSchema.safeParse(slug);
    if (!result.success) {
      setSlugError(result.error.errors[0]?.message || "Invalid slug");
      return false;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username_slug", slug)
      .neq("id", user?.id || "")
      .maybeSingle();
    if (data) {
      setSlugError("This username is already taken");
      return false;
    }
    setSlugError(null);
    return true;
  }, [user?.id]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return;
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Please upload an image smaller than 5MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBust, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: urlWithCacheBust }));
      toast.success("Avatar updated successfully.");
    } catch {
      toast.error("Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  }, [user]);

  const removeAvatar = useCallback(async () => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const { data: files } = await supabase.storage.from('avatars').list(user.id);
      if (files && files.length > 0) {
        const filePaths = files.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('avatars').remove(filePaths);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: null }));
      toast.success("Avatar removed.");
    } catch {
      toast.error("Failed to remove avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  }, [user]);

  const deleteAccount = useCallback(async () => {
    toast.error("Account deletion requires contacting support.");
  }, []);

  const changePassword = useCallback(async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast.error("Failed to send password reset email.");
    } else {
      toast.success("Password reset email sent. Check your inbox.");
    }
  }, [user?.email]);

  return {
    profile,
    setProfile,
    loading,
    saving,
    slugError,
    uploadingAvatar,
    updateProfile,
    validateSlug,
    uploadAvatar,
    removeAvatar,
    deleteAccount,
    changePassword,
  };
}
