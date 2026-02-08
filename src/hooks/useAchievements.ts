import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ACHIEVEMENTS, Achievement, getNextLevelThreshold } from '@/lib/achievements';
import { toast } from 'sonner';

interface UserStats {
  materials_explored: number;
  settings_exported: number;
  tutorials_watched: number;
  comparisons_made: number;
  printers_configured: number;
  glossary_lookups: number;
}

interface UnlockedAchievement {
  achievement_id: string;
  unlocked_at: string;
}

export function useAchievements() {
  const { user } = useAuth();
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [stats, setStats] = useState<UserStats>({
    materials_explored: 0,
    settings_exported: 0,
    tutorials_watched: 0,
    comparisons_made: 0,
    printers_configured: 0,
    glossary_lookups: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load achievements and stats
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // Load achievements
        const { data: achievementsData } = await supabase
          .from('user_achievements')
          .select('achievement_id, unlocked_at')
          .eq('user_id', user.id);

        if (achievementsData) {
          setUnlockedAchievements(achievementsData);
        }

        // Load stats
        const { data: statsData } = await supabase
          .from('user_printing_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (statsData) {
          setStats({
            materials_explored: statsData.materials_explored || 0,
            settings_exported: statsData.settings_exported || 0,
            tutorials_watched: statsData.tutorials_watched || 0,
            comparisons_made: statsData.comparisons_made || 0,
            printers_configured: statsData.printers_configured || 0,
            glossary_lookups: statsData.glossary_lookups || 0,
          });
        }
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Unlock achievement
  const unlockAchievement = useCallback(async (achievementId: string) => {
    if (!user) return;
    
    // Check if already unlocked
    if (unlockedAchievements.some(a => a.achievement_id === achievementId)) {
      return;
    }

    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return;

    try {
      const { error } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: user.id,
          achievement_id: achievementId,
        }, {
          onConflict: 'user_id,achievement_id',
          ignoreDuplicates: true,
        });

      if (!error) {
        setUnlockedAchievements(prev => [
          ...prev,
          { achievement_id: achievementId, unlocked_at: new Date().toISOString() }
        ]);

        // Show toast notification
        toast.success(`🎉 Achievement Unlocked: ${achievement.title}`, {
          description: achievement.description,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }, [user, unlockedAchievements]);

  // Increment stat and check for achievements
  const incrementStat = useCallback(async (statKey: keyof UserStats, amount: number = 1) => {
    if (!user) return;

    const newValue = stats[statKey] + amount;
    
    try {
      // Upsert stats
      const { error } = await supabase
        .from('user_printing_stats')
        .upsert({
          user_id: user.id,
          [statKey]: newValue,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (!error) {
        setStats(prev => ({ ...prev, [statKey]: newValue }));
        
        // Check for related achievements
        checkAchievementsForStat(statKey, newValue);
      }
    } catch (error) {
      console.error('Error incrementing stat:', error);
    }
  }, [user, stats]);

  // Check achievements based on stat updates
  const checkAchievementsForStat = useCallback((statKey: keyof UserStats, value: number) => {
    switch (statKey) {
      case 'materials_explored':
        if (value >= 1) unlockAchievement('first_material');
        if (value >= 5) unlockAchievement('five_materials');
        if (value >= 10) unlockAchievement('ten_materials');
        if (value >= 20) unlockAchievement('twenty_materials');
        break;
      case 'tutorials_watched':
        if (value >= 1) unlockAchievement('first_tutorial');
        if (value >= 5) unlockAchievement('five_tutorials');
        break;
      case 'glossary_lookups':
        if (value >= 10) unlockAchievement('glossary_explorer');
        if (value >= 30) unlockAchievement('glossary_master');
        break;
      case 'settings_exported':
        if (value >= 1) unlockAchievement('first_export');
        if (value >= 10) unlockAchievement('ten_exports');
        break;
      case 'comparisons_made':
        if (value >= 1) unlockAchievement('first_comparison');
        if (value >= 10) unlockAchievement('comparison_pro');
        break;
      case 'printers_configured':
        if (value >= 1) unlockAchievement('printer_configured');
        if (value >= 3) unlockAchievement('multi_printer');
        break;
    }

    // Check point-based achievements
    const totalPoints = getTotalPoints();
    if (totalPoints >= 100) unlockAchievement('hundred_points');
    if (totalPoints >= 500) unlockAchievement('five_hundred_points');
    if (totalPoints >= 1000) unlockAchievement('thousand_points');
  }, [unlockAchievement]);

  // Calculate total points
  const getTotalPoints = useCallback(() => {
    return unlockedAchievements.reduce((sum, ua) => {
      const achievement = ACHIEVEMENTS[ua.achievement_id];
      return sum + (achievement?.points || 0);
    }, 0);
  }, [unlockedAchievements]);

  // Check if achievement is unlocked
  const isUnlocked = useCallback((achievementId: string) => {
    return unlockedAchievements.some(a => a.achievement_id === achievementId);
  }, [unlockedAchievements]);

  // Get progress info
  const getProgress = useCallback(() => {
    const totalPoints = getTotalPoints();
    return getNextLevelThreshold(totalPoints);
  }, [getTotalPoints]);

  return {
    unlockedAchievements,
    stats,
    isLoading,
    incrementStat,
    unlockAchievement,
    isUnlocked,
    getTotalPoints,
    getProgress,
    allAchievements: ACHIEVEMENTS,
  };
}
