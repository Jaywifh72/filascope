import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { usePrinterSelection } from "./usePrinterSelection";
import { useBrowseHistory } from "./useBrowseHistory";
import { useNozzleConfig } from "./useNozzleConfig";

const SESSION_KEY = "filascope_session_id";

function getSessionId(): string {
  return localStorage.getItem(SESSION_KEY) || "";
}

interface MaterialInterest {
  material: string;
  interest_score: number;
}

interface SidebarPreferences {
  module_order: string[];
  hidden_modules: string[];
  module_engagement: Record<string, number>;
  price_sensitivity: "budget" | "moderate" | "premium";
}

const DEFAULT_MODULE_ORDER = ["safety", "watchlist", "trending", "deals", "recent"];

export function useUserPersonalization() {
  const { user } = useAuth();
  const { selectedPrinter } = usePrinterSelection();
  const { history: browseHistory } = useBrowseHistory(5);
  const nozzleConfig = useNozzleConfig(selectedPrinter?.stock_nozzle_diameter_mm);

  // Fetch user's favorites
  const { data: favorites } = useQuery({
    queryKey: ["user-favorites-ids", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_favorites")
        .select("filament_id")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data?.map(f => f.filament_id) || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch material interests
  const { data: materialInterests } = useQuery({
    queryKey: ["material-interests", user?.id],
    queryFn: async () => {
      const userId = user?.id;
      const sessionId = getSessionId();

      let queryBuilder = supabase
        .from("user_material_interests")
        .select("material, interest_score")
        .order("interest_score", { ascending: false })
        .limit(5);

      if (userId) {
        queryBuilder = queryBuilder.eq("user_id", userId);
      } else if (sessionId) {
        queryBuilder = queryBuilder.eq("session_id", sessionId);
      } else {
        return [];
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return (data || []) as MaterialInterest[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch sidebar preferences
  const { data: sidebarPrefs } = useQuery({
    queryKey: ["sidebar-preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        // Return localStorage-based preferences for anonymous users
        const stored = localStorage.getItem("sidebar_prefs");
        if (stored) return JSON.parse(stored) as SidebarPreferences;
        return null;
      }

      const { data, error } = await supabase
        .from("user_sidebar_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data ? {
        module_order: data.module_order as string[],
        hidden_modules: data.hidden_modules || [],
        module_engagement: (data.module_engagement || {}) as Record<string, number>,
        price_sensitivity: (data.price_sensitivity || "moderate") as "budget" | "moderate" | "premium",
      } : null;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Derive top material interests
  const topMaterials = materialInterests?.map(m => m.material) || [];

  // Calculate smart module order based on engagement
  const moduleOrder = (() => {
    if (!sidebarPrefs?.module_engagement) return DEFAULT_MODULE_ORDER;
    
    const engagement = sidebarPrefs.module_engagement;
    const modulesWithEngagement = DEFAULT_MODULE_ORDER.map(mod => ({
      name: mod,
      score: engagement[mod] || 0,
    }));

    // Safety always first
    const safety = modulesWithEngagement.find(m => m.name === "safety");
    const others = modulesWithEngagement.filter(m => m.name !== "safety")
      .sort((a, b) => b.score - a.score);

    return [safety?.name || "safety", ...others.map(o => o.name)];
  })();

  // Price sensitivity from preferences or derived from browsing
  const priceSensitivity = sidebarPrefs?.price_sensitivity || "moderate";

  // Check if user has printer context
  const hasPrinterContext = !!selectedPrinter;

  // Get printer specs for filtering (including nozzle config)
  const printerSpecs = selectedPrinter ? {
    maxNozzleTemp: selectedPrinter.max_nozzle_temp_c,
    maxBedTemp: selectedPrinter.bed_max_temp_c,
    hasEnclosure: selectedPrinter.has_enclosure,
    abrasiveSupport: selectedPrinter.abrasive_filament_support,
    maxFlowRate: selectedPrinter.max_flow_rate_mm3s,
    nozzleConfig: {
      size: nozzleConfig.size,
      material: nozzleConfig.material,
      flowType: nozzleConfig.flowType,
    },
  } : null;

  return {
    // User context
    isAuthenticated: !!user,
    userId: user?.id,
    
    // Printer context
    selectedPrinter,
    hasPrinterContext,
    printerSpecs,
    
    // Favorites
    favoriteFilamentIds: favorites || [],
    hasFavorites: (favorites?.length || 0) > 0,
    
    // Material interests
    topMaterials,
    hasInterests: topMaterials.length > 0,
    
    // Browse history
    recentlyViewed: browseHistory,
    hasHistory: browseHistory.length > 0,
    
    // Preferences
    moduleOrder,
    priceSensitivity,
    hiddenModules: sidebarPrefs?.hidden_modules || [],
    moduleEngagement: sidebarPrefs?.module_engagement || {},
  };
}
