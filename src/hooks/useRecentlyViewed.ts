import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "filascope_recently_viewed";
const MAX_ITEMS = 10;

export interface RecentlyViewedItem {
  id: string;
  name: string;
  brand: string;
  price: string;
  image: string | null;
  url: string;
  type: "filament" | "printer";
  timestamp: number;
}

function isValidItem(item: unknown): item is RecentlyViewedItem {
  if (!item || typeof item !== "object") return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i.id === "string" && i.id.trim() !== "" &&
    typeof i.name === "string" && i.name.trim() !== "" &&
    typeof i.url === "string" && i.url.trim() !== ""
  );
}

function loadItems(): RecentlyViewedItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(isValidItem);
    // Clean up corrupted entries
    if (valid.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>(loadItems);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(loadItems());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = useCallback((item: Omit<RecentlyViewedItem, "timestamp">) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }, []);

  return { items, addItem, clearAll };
}

/** Format relative time */
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
