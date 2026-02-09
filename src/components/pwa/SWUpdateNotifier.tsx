import { useState, useEffect, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { UpdateBanner } from "./PWABanners";

/**
 * Listens for service worker updates and shows a prompt to reload.
 * Uses vite-plugin-pwa's built-in `useRegisterSW` hook.
 */
export const SWUpdateNotifier = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // Check for updates every 60 seconds
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowUpdate(true);
    }
  }, [needRefresh]);

  const handleUpdate = useCallback(() => {
    setShowUpdate(false);
    updateServiceWorker(true); // true = reload page
  }, [updateServiceWorker]);

  if (!showUpdate) return null;

  return <UpdateBanner onUpdate={handleUpdate} />;
};
