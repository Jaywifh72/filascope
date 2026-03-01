import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  milestoneCelebration,
  sessionMilestoneCelebration,
} from "@/lib/celebrationToast";

const RECENTLY_VIEWED_KEY = "filascope_recently_viewed";
const WISHLIST_KEY = "filascope_wishlist_count";

/**
 * Tracks engagement milestones and fires celebration toasts.
 * Mount once in App — it reads route changes and localStorage passively.
 */
export function useCelebrationMilestones() {
  const location = useLocation();
  const detailViewCount = useRef(0);
  const hasCheckedReturn = useRef(false);

  // ── Return visitor welcome ──
  useEffect(() => {
    if (hasCheckedReturn.current) return;
    hasCheckedReturn.current = true;

    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
        if (!raw) return;
        const items = JSON.parse(raw);
        if (!Array.isArray(items) || items.length < 3) return;

        // Only welcome back if they have meaningful history
        sessionMilestoneCelebration(
          "return_visitor",
          "👋 Welcome back!",
          {
            description: `You've explored ${items.length} filaments. Pick up where you left off.`,
          }
        );
      } catch {
        // Invalid storage, skip
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // ── Exploration milestone: 5 detail page views ──
  useEffect(() => {
    if (/^\/filament\//.test(location.pathname)) {
      detailViewCount.current += 1;

      if (detailViewCount.current === 5) {
        sessionMilestoneCelebration(
          "5_explored",
          "🔍 Explorer! You've researched 5 filaments",
          {
            description: "Ready to compare your favorites?",
            action: {
              label: "Compare now →",
              onClick: () => {
                window.location.href = "/compare";
              },
            },
          }
        );
      }
    }
  }, [location.pathname]);
}

/**
 * Call this when a compare item is added.
 * Pass the NEW count after addition.
 */
export function checkFirstCompareMilestone(newCount: number) {
  if (newCount === 2) {
    milestoneCelebration(
      "first_compare",
      "✨ Your first comparison!",
      {
        description: "Tap Compare to see them side by side.",
        action: {
          label: "Compare now →",
          onClick: () => {
            window.location.href = "/compare";
          },
        },
      }
    );
  }
}

/**
 * Call this when viewing a deal. Fires celebration for >75% off deals.
 */
export function checkDealDiscoveryMilestone(discountPercent: number) {
  if (discountPercent >= 75) {
    sessionMilestoneCelebration(
      "top_deal_discovery",
      "🏆 Incredible deal!",
      {
        description: "This is in the top 10% of all active discounts.",
      }
    );
  }
}
