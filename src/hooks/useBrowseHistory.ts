import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "filascope_recently_viewed";
const SESSION_KEY = "filascope_session_id";
const MAX_ITEMS = 20;

export type ProductType = "filament" | "printer";

export interface RecentlyViewedItem {
  product_id: string;
  product_type: ProductType;
  timestamp: number;
}

export interface BrowseHistoryItem {
  id: string;
  product_id: string;
  product_type: ProductType;
  viewed_at: string;
  filament: {
    id: string;
    product_title: string;
    vendor: string | null;
    material: string | null;
    featured_image: string | null;
    color_hex: string | null;
    variant_price: number | null;
    net_weight_g: number | null;
  } | null;
  printer: {
    id: string;
    model_name: string;
    display_name: string | null;
    image_url: string | null;
    current_price_usd_store: number | null;
  } | null;
}

// ============================
// localStorage helpers
// ============================

function getLocalHistory(): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: RecentlyViewedItem[] = JSON.parse(raw);
    return items.slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function saveLocalHistory(items: RecentlyViewedItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // quota exceeded etc.
  }
}

function addToLocalHistory(productId: string, productType: ProductType) {
  const items = getLocalHistory().filter(
    (i) => !(i.product_id === productId && i.product_type === productType)
  );
  items.unshift({ product_id: productId, product_type: productType, timestamp: Date.now() });
  saveLocalHistory(items.slice(0, MAX_ITEMS));
}

function clearLocalHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

function getSessionId(): string {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// ============================
// Hook
// ============================

export function useBrowseHistory(limit = 10) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const syncedRef = useRef(false);

  // Fetch from Supabase (enriched with product data) for logged-in users
  // For guests, return localStorage items enriched via a secondary query
  const query = useQuery({
    queryKey: ["browse-history", user?.id, limit],
    queryFn: async (): Promise<BrowseHistoryItem[]> => {
      const localItems = getLocalHistory();

      if (user?.id) {
        // Logged-in: query Supabase directly (it has richer data)
        const { data, error } = await supabase
          .from("user_browse_history")
          .select(`
            id,
            filament_id,
            printer_id,
            product_type,
            viewed_at,
            filament:filaments(
              id,
              product_title,
              vendor,
              material,
              featured_image,
              color_hex,
              variant_price,
              net_weight_g
            ),
            printer:printers(
              id,
              model_name,
              display_name,
              image_url,
              current_price_usd_store
            )
          `)
          .eq("user_id", user.id)
          .order("viewed_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Deduplicate by product_id + product_type
        const seen = new Set<string>();
        return (data || [])
          .map((row: any) => ({
            id: row.id,
            product_id: row.filament_id || row.printer_id || "",
            product_type: (row.product_type || "filament") as ProductType,
            viewed_at: row.viewed_at,
            filament: row.filament,
            printer: row.printer,
          }))
          .filter((item) => {
            const key = `${item.product_type}:${item.product_id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
      }

      // Guest: enrich localStorage items
      if (localItems.length === 0) return [];

      const filamentIds = localItems
        .filter((i) => i.product_type === "filament")
        .map((i) => i.product_id)
        .slice(0, limit);
      const printerIds = localItems
        .filter((i) => i.product_type === "printer")
        .map((i) => i.product_id)
        .slice(0, limit);

      const [filRes, prRes] = await Promise.all([
        filamentIds.length > 0
          ? supabase
              .from("filaments")
              .select("id, product_title, vendor, material, featured_image, color_hex, variant_price, net_weight_g")
              .in("id", filamentIds)
          : { data: [], error: null },
        printerIds.length > 0
          ? supabase
              .from("printers")
              .select("id, model_name, display_name, image_url, current_price_usd_store")
              .in("id", printerIds)
          : { data: [], error: null },
      ]);

      const filMap = new Map((filRes.data || []).map((f: any) => [f.id, f]));
      const prMap = new Map((prRes.data || []).map((p: any) => [p.id, p]));

      return localItems.slice(0, limit).map((item, idx) => ({
        id: `local-${idx}`,
        product_id: item.product_id,
        product_type: item.product_type,
        viewed_at: new Date(item.timestamp).toISOString(),
        filament: item.product_type === "filament" ? filMap.get(item.product_id) || null : null,
        printer: item.product_type === "printer" ? prMap.get(item.product_id) || null : null,
      }));
    },
    staleTime: 1000 * 60 * 2,
  });

  // Sync localStorage to Supabase when user logs in (once per session)
  useEffect(() => {
    if (!user?.id || syncedRef.current) return;
    syncedRef.current = true;

    const localItems = getLocalHistory();
    if (localItems.length === 0) return;

    // Background sync - don't block the UI
    const syncItems = async () => {
      for (const item of localItems.slice(0, 10)) {
        try {
          await supabase.from("user_browse_history").insert({
            user_id: user.id,
            filament_id: item.product_type === "filament" ? item.product_id : null,
            printer_id: item.product_type === "printer" ? item.product_id : null,
            product_type: item.product_type,
          });
        } catch {
          // Ignore duplicates etc.
        }
      }
      queryClient.invalidateQueries({ queryKey: ["browse-history"] });
    };

    syncItems();
  }, [user?.id, queryClient]);

  const addToHistory = useMutation({
    mutationFn: async ({ productId, productType }: { productId: string; productType: ProductType }) => {
      // Always update localStorage first (instant)
      addToLocalHistory(productId, productType);

      // Sync to Supabase for logged-in users
      if (user?.id) {
        await supabase.from("user_browse_history").insert({
          user_id: user.id,
          filament_id: productType === "filament" ? productId : null,
          printer_id: productType === "printer" ? productId : null,
          product_type: productType,
        });

        // Clean up old entries (keep last 50)
        const { data: oldEntries } = await supabase
          .from("user_browse_history")
          .select("id")
          .eq("user_id", user.id)
          .order("viewed_at", { ascending: false })
          .range(50, 1000);

        if (oldEntries && oldEntries.length > 0) {
          const idsToDelete = oldEntries.map((e) => e.id);
          await supabase.from("user_browse_history").delete().in("id", idsToDelete);
        }
      } else {
        // For guests, also try session-based Supabase insert
        const sessionId = getSessionId();
        await supabase.from("user_browse_history").insert({
          session_id: sessionId,
          filament_id: productType === "filament" ? productId : null,
          printer_id: productType === "printer" ? productId : null,
          product_type: productType,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browse-history"] });
    },
  });

  const removeFromHistoryMutation = useMutation({
    mutationFn: async ({ productId, productType }: { productId: string; productType: string }) => {
      // Remove from localStorage
      const items = getLocalHistory().filter(
        (i) => !(i.product_id === productId && i.product_type === productType)
      );
      saveLocalHistory(items);

      // Remove from Supabase
      if (user?.id) {
        const col = productType === "printer" ? "printer_id" : "filament_id";
        await supabase
          .from("user_browse_history")
          .delete()
          .eq("user_id", user.id)
          .eq(col, productId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browse-history"] });
    },
  });

  const clearHistory = useMutation({
    mutationFn: async () => {
      clearLocalHistory();
      if (user?.id) {
        await supabase.from("user_browse_history").delete().eq("user_id", user.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browse-history"] });
    },
  });

  // Convenience wrapper matching old API + new multi-type API
  const addView = useCallback(
    (productId: string, productType: ProductType = "filament") => {
      addToHistory.mutate({ productId, productType });
    },
    [addToHistory]
  );

  const removeFromHistoryFn = useCallback(
    (productId: string, productType: string) => {
      removeFromHistoryMutation.mutate({ productId, productType });
    },
    [removeFromHistoryMutation]
  );

  return {
    history: query.data || [],
    isLoading: query.isLoading,
    addToHistory: addView,
    clearHistory: clearHistory.mutate,
    removeFromHistory: removeFromHistoryFn,
    /** Raw localStorage items for instant display without waiting for Supabase */
    localItems: getLocalHistory(),
  };
}
