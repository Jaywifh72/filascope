import { useState, useEffect, useCallback } from "react";

export interface UseOfflineReturn {
  /** Whether the browser is currently offline */
  isOffline: boolean;
  /** Whether we've gone offline since the app loaded */
  wasOffline: boolean;
  /** Whether we just came back online */
  justReconnected: boolean;
  /** Clear the reconnected state */
  clearReconnectedState: () => void;
}

/**
 * Offline Detection Hook
 * 
 * Monitors network connectivity and provides state for
 * showing offline banners and caching notices.
 */
export const useOffline = (): UseOfflineReturn => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  const clearReconnectedState = useCallback(() => {
    setJustReconnected(false);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      if (isOffline) {
        setJustReconnected(true);
        // Auto-clear after 5 seconds
        setTimeout(() => setJustReconnected(false), 5000);
      }
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isOffline]);

  return {
    isOffline,
    wasOffline,
    justReconnected,
    clearReconnectedState,
  };
};

/**
 * Background Sync Hook
 * 
 * Queues actions to be synced when the device comes back online.
 * Used for compare list changes, favorites, etc.
 */
export interface SyncAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

const SYNC_QUEUE_KEY = "pwa-sync-queue";

export const useBackgroundSync = () => {
  const [syncQueue, setSyncQueue] = useState<SyncAction[]>(() => {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Persist queue to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(syncQueue));
    } catch {
      // Ignore storage errors
    }
  }, [syncQueue]);

  // Add action to sync queue
  const queueAction = useCallback((type: string, payload: any) => {
    const action: SyncAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
    };

    setSyncQueue((prev) => [...prev, action]);
    return action.id;
  }, []);

  // Remove action from queue
  const removeAction = useCallback((id: string) => {
    setSyncQueue((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Clear all actions
  const clearQueue = useCallback(() => {
    setSyncQueue([]);
  }, []);

  // Process sync queue
  const processQueue = useCallback(
    async (processor: (action: SyncAction) => Promise<boolean>) => {
      if (syncQueue.length === 0 || isSyncing) return;

      setIsSyncing(true);

      const failedActions: SyncAction[] = [];

      for (const action of syncQueue) {
        try {
          const success = await processor(action);
          if (!success) {
            failedActions.push(action);
          }
        } catch {
          failedActions.push(action);
        }
      }

      setSyncQueue(failedActions);
      setIsSyncing(false);
    },
    [syncQueue, isSyncing]
  );

  return {
    syncQueue,
    queueAction,
    removeAction,
    clearQueue,
    processQueue,
    isSyncing,
    hasPendingSync: syncQueue.length > 0,
  };
};
