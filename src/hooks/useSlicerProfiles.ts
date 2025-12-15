import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ProfileData, SlicerType, formatProfileForSlicer, SLICERS } from "@/lib/slicerMapping";

export interface SavedSlicerProfile {
  id: string;
  filament_id: string;
  slicer_type: SlicerType;
  profile_name: string;
  profile_data: ProfileData;
  is_custom: boolean;
  custom_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useSlicerProfiles() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<SavedSlicerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    if (!user) {
      setProfiles([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_slicer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProfiles((data || []).map(d => ({
        ...d,
        profile_data: d.profile_data as unknown as ProfileData,
        slicer_type: d.slicer_type as SlicerType,
      })) as SavedSlicerProfile[]);
    } catch (error) {
      console.error('Error fetching slicer profiles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const saveProfile = async (
    filamentId: string,
    filamentName: string,
    slicerType: SlicerType,
    profileData: ProfileData,
    isCustom: boolean = false,
    notes?: string
  ) => {
    if (!user) {
      toast.error("Please sign in to save profiles");
      return null;
    }

    try {
      // Check if profile already exists
      const existingProfile = profiles.find(
        p => p.filament_id === filamentId && p.slicer_type === slicerType
      );

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('user_slicer_profiles')
          .update({
            profile_name: filamentName,
            profile_data: profileData as never,
            is_custom: isCustom,
            custom_notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProfile.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_slicer_profiles')
          .insert({
            user_id: user.id,
            filament_id: filamentId,
            slicer_type: slicerType as string,
            profile_name: filamentName,
            profile_data: profileData as never,
            is_custom: isCustom,
            custom_notes: notes || null,
          } as never);
        if (insertError) throw insertError;
      }

      toast.success("Profile saved to your library");
      await fetchProfiles();
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Failed to save profile");
      return false;
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_slicer_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("Profile deleted");
      await fetchProfiles();
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error("Failed to delete profile");
      return false;
    }
  };

  const getProfileForFilament = (filamentId: string, slicerType: SlicerType) => {
    return profiles.find(
      p => p.filament_id === filamentId && p.slicer_type === slicerType
    );
  };

  const downloadProfile = (profile: SavedSlicerProfile) => {
    const content = formatProfileForSlicer(profile.profile_data, profile.slicer_type);
    const extension = SLICERS[profile.slicer_type].extension;
    const filename = `${profile.profile_name.replace(/[^a-z0-9]/gi, '_')}${extension}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAllProfiles = async () => {
    if (profiles.length === 0) {
      toast.error("No profiles to export");
      return;
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      profiles: profiles.map(p => ({
        name: p.profile_name,
        slicer: p.slicer_type,
        is_custom: p.is_custom,
        data: p.profile_data,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filascope_profiles_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Profiles exported successfully");
  };

  return {
    profiles,
    isLoading,
    saveProfile,
    deleteProfile,
    getProfileForFilament,
    downloadProfile,
    exportAllProfiles,
    refetch: fetchProfiles,
  };
}
