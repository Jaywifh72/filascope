import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const SESSION_KEY = "filascope_session_id";

function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

type ActivityType = "view" | "search" | "click" | "compare" | "module_click";
type EntityType = "filament" | "material" | "brand" | "deal" | "trend" | "module";

interface TrackOptions {
  activityType: ActivityType;
  entityType?: EntityType;
  entityId?: string;
  entityValue?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export function useUserActivity() {
  const { user } = useAuth();
  const lastTrackedRef = useRef<string>("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const track = useCallback(async (options: TrackOptions) => {
    const { activityType, entityType, entityId, entityValue, metadata } = options;
    
    // Debounce duplicate events
    const eventKey = `${activityType}-${entityType}-${entityId}-${entityValue}`;
    if (lastTrackedRef.current === eventKey) return;
    lastTrackedRef.current = eventKey;

    // Clear previous debounce timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        await supabase.from("user_activity").insert([{
          user_id: user?.id || null,
          session_id: user?.id ? null : getSessionId(),
          activity_type: activityType,
          entity_type: entityType || null,
          entity_id: entityId || null,
          entity_value: entityValue || null,
          metadata: metadata || {},
        }]);
      } catch (error) {
        console.error("Failed to track activity:", error);
      }
    }, 300);
  }, [user?.id]);

  const trackView = useCallback((entityType: EntityType, entityId?: string, entityValue?: string) => {
    track({ activityType: "view", entityType, entityId, entityValue });
  }, [track]);

  const trackSearch = useCallback((searchTerm: string, material?: string) => {
    track({ 
      activityType: "search", 
      entityType: "material", 
      entityValue: material || searchTerm,
      metadata: { searchTerm }
    });
  }, [track]);

  const trackClick = useCallback((entityType: EntityType, entityId?: string, entityValue?: string) => {
    track({ activityType: "click", entityType, entityId, entityValue });
  }, [track]);

  const trackModuleClick = useCallback((moduleName: string) => {
    track({ activityType: "module_click", entityType: "module", entityValue: moduleName });
  }, [track]);

  // Update material interest when viewing materials
  const updateMaterialInterest = useCallback(async (material: string) => {
    if (!material) return;
    
    try {
      const userId = user?.id;
      const sessionId = userId ? null : getSessionId();

      // Try to upsert material interest
      const { data: existing } = await supabase
        .from("user_material_interests")
        .select("id, interest_score")
        .eq(userId ? "user_id" : "session_id", userId || sessionId)
        .eq("material", material)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_material_interests")
          .update({ 
            interest_score: existing.interest_score + 1,
            last_interaction: new Date().toISOString()
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_material_interests").insert({
          user_id: userId || null,
          session_id: sessionId,
          material,
          interest_score: 1,
        });
      }
    } catch (error) {
      console.error("Failed to update material interest:", error);
    }
  }, [user?.id]);

  return {
    track,
    trackView,
    trackSearch,
    trackClick,
    trackModuleClick,
    updateMaterialInterest,
    sessionId: getSessionId(),
  };
}
