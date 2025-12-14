import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const LOCAL_STORAGE_KEY = "sidebar_prefs";
const DEFAULT_MODULE_ORDER = ["safety", "watchlist", "trending", "deals", "recent", "contextual"];

interface SidebarPreferences {
  module_order: string[];
  hidden_modules: string[];
  module_engagement: Record<string, number>;
  price_sensitivity: "budget" | "moderate" | "premium";
}

function getLocalPrefs(): SidebarPreferences | null {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

function setLocalPrefs(prefs: Partial<SidebarPreferences>) {
  const existing = getLocalPrefs() || {
    module_order: DEFAULT_MODULE_ORDER,
    hidden_modules: [],
    module_engagement: {},
    price_sensitivity: "moderate",
  };
  const updated = { ...existing, ...prefs };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
}

export function useSidebarPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["sidebar-preferences", user?.id],
    queryFn: async (): Promise<SidebarPreferences> => {
      if (!user?.id) {
        const local = getLocalPrefs();
        return local || {
          module_order: DEFAULT_MODULE_ORDER,
          hidden_modules: [],
          module_engagement: {},
          price_sensitivity: "moderate",
        };
      }

      const { data, error } = await supabase
        .from("user_sidebar_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        return {
          module_order: (data.module_order as string[]) || DEFAULT_MODULE_ORDER,
          hidden_modules: data.hidden_modules || [],
          module_engagement: (data.module_engagement as Record<string, number>) || {},
          price_sensitivity: (data.price_sensitivity as "budget" | "moderate" | "premium") || "moderate",
        };
      }

      // Create default preferences for user
      const defaultPrefs: SidebarPreferences = {
        module_order: DEFAULT_MODULE_ORDER,
        hidden_modules: [],
        module_engagement: {},
        price_sensitivity: "moderate",
      };

      await supabase.from("user_sidebar_preferences").insert({
        user_id: user.id,
        module_order: defaultPrefs.module_order,
        hidden_modules: defaultPrefs.hidden_modules,
        module_engagement: defaultPrefs.module_engagement,
        price_sensitivity: defaultPrefs.price_sensitivity,
      });

      return defaultPrefs;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Track module interaction
  const trackModuleInteraction = useMutation({
    mutationFn: async (moduleName: string) => {
      const current = preferences || {
        module_order: DEFAULT_MODULE_ORDER,
        hidden_modules: [],
        module_engagement: {},
        price_sensitivity: "moderate",
      };

      const newEngagement = {
        ...current.module_engagement,
        [moduleName]: (current.module_engagement[moduleName] || 0) + 1,
      };

      if (user?.id) {
        await supabase
          .from("user_sidebar_preferences")
          .upsert({
            user_id: user.id,
            module_engagement: newEngagement,
            updated_at: new Date().toISOString(),
          });
      } else {
        setLocalPrefs({ module_engagement: newEngagement });
      }

      return newEngagement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sidebar-preferences"] });
    },
  });

  // Get smart module order based on engagement
  const getSmartOrder = (): string[] => {
    if (!preferences) return DEFAULT_MODULE_ORDER;

    const engagement = preferences.module_engagement;
    
    // Safety always first
    const safetyModule = "safety";
    const otherModules = DEFAULT_MODULE_ORDER.filter((m) => m !== safetyModule);

    // Sort by engagement, but keep a reasonable baseline
    const sorted = [...otherModules].sort((a, b) => {
      const scoreA = engagement[a] || 0;
      const scoreB = engagement[b] || 0;
      return scoreB - scoreA;
    });

    return [safetyModule, ...sorted];
  };

  return {
    preferences: preferences || {
      module_order: DEFAULT_MODULE_ORDER,
      hidden_modules: [],
      module_engagement: {},
      price_sensitivity: "moderate",
    },
    isLoading,
    moduleOrder: getSmartOrder(),
    trackModuleInteraction: trackModuleInteraction.mutate,
    hiddenModules: preferences?.hidden_modules || [],
  };
}
