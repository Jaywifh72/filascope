import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export interface UsePWAInstallReturn {
  /** Whether the app can be installed */
  canInstall: boolean;
  /** Whether the app is already installed */
  isInstalled: boolean;
  /** Whether the app is running in standalone mode */
  isStandalone: boolean;
  /** Whether the device is iOS */
  isIOS: boolean;
  /** Whether the device is Android */
  isAndroid: boolean;
  /** Trigger the install prompt */
  promptInstall: () => Promise<boolean>;
  /** Whether we've already shown the install prompt this session */
  hasPrompted: boolean;
  /** Dismiss the install prompt for this session */
  dismissPrompt: () => void;
  /** Whether user has dismissed the install banner */
  isDismissed: boolean;
}

/**
 * PWA Install Hook
 * 
 * Handles the install prompt lifecycle and provides utilities
 * for managing app installation state.
 */
export const usePWAInstall = (): UsePWAInstallReturn => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("pwa-install-dismissed") === "true";
    } catch {
      return false;
    }
  });

  // Detect standalone mode
  const isStandalone = 
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://");

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  // Detect Android
  const isAndroid = /Android/.test(navigator.userAgent);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the default browser prompt
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if already installed
    if (isStandalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isStandalone]);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    setHasPrompted(true);

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;

      // Clear the deferred prompt
      setDeferredPrompt(null);

      return outcome === "accepted";
    } catch (error) {
      console.error("Error showing install prompt:", error);
      return false;
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem("pwa-install-dismissed", "true");
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    canInstall: !!deferredPrompt && !isInstalled && !isDismissed,
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    promptInstall,
    hasPrompted,
    dismissPrompt,
    isDismissed,
  };
};
