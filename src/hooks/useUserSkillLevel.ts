import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SkillLevel, SKILL_LEVELS, getSkillLevelFromPoints } from '@/lib/skillLevels';
import { useAchievements } from './useAchievements';

export function useUserSkillLevel() {
  const { user } = useAuth();
  const { getTotalPoints } = useAchievements();
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [settingsVisibility, setSettingsVisibility] = useState<SkillLevel>('beginner');
  const [isLoading, setIsLoading] = useState(true);

  // Load skill level from profile
  useEffect(() => {
    const loadSkillLevel = async () => {
      // Check localStorage for non-auth users
      const storedLevel = localStorage.getItem('filascope_skill_level') as SkillLevel | null;
      const storedVisibility = localStorage.getItem('filascope_settings_visibility') as SkillLevel | null;
      
      if (storedLevel) {
        setSkillLevel(storedLevel);
      }
      if (storedVisibility) {
        setSettingsVisibility(storedVisibility);
      }

      if (user) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('skill_level, settings_visibility')
            .eq('id', user.id)
            .single();

          if (data) {
            if (data.skill_level) {
              setSkillLevel(data.skill_level as SkillLevel);
              localStorage.setItem('filascope_skill_level', data.skill_level);
            }
            if (data.settings_visibility) {
              setSettingsVisibility(data.settings_visibility as SkillLevel);
              localStorage.setItem('filascope_settings_visibility', data.settings_visibility);
            }
          }
        } catch (error) {
          console.error('Error loading skill level:', error);
        }
      }

      setIsLoading(false);
    };

    loadSkillLevel();
  }, [user]);

  // Update skill level based on points
  const updateFromPoints = useCallback(() => {
    const points = getTotalPoints();
    const calculatedLevel = getSkillLevelFromPoints(points);
    
    if (calculatedLevel !== skillLevel) {
      setSkillLevel(calculatedLevel);
      localStorage.setItem('filascope_skill_level', calculatedLevel);
      
      if (user) {
        supabase
          .from('profiles')
          .update({ skill_level: calculatedLevel })
          .eq('id', user.id)
          .then(() => {});
      }
    }
  }, [getTotalPoints, skillLevel, user]);

  // Update settings visibility
  const updateSettingsVisibility = useCallback(async (newVisibility: SkillLevel) => {
    setSettingsVisibility(newVisibility);
    localStorage.setItem('filascope_settings_visibility', newVisibility);

    if (user) {
      await supabase
        .from('profiles')
        .update({ settings_visibility: newVisibility })
        .eq('id', user.id);
    }
  }, [user]);

  // Check if setting should be visible
  const shouldShowSetting = useCallback((settingLevel: SkillLevel): boolean => {
    const levels: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
    return levels.indexOf(settingsVisibility) >= levels.indexOf(settingLevel);
  }, [settingsVisibility]);

  return {
    skillLevel,
    settingsVisibility,
    skillLevelConfig: SKILL_LEVELS[skillLevel],
    isLoading,
    updateFromPoints,
    updateSettingsVisibility,
    shouldShowSetting,
  };
}
