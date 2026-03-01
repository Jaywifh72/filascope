import { toast } from "sonner";
import { ReactNode } from "react";

/**
 * Celebration Toast System
 * 
 * Three tiers: info, success, celebration
 * - Rate limiting: max 1 celebration per 30s
 * - Deduplication: same-id info toasts replace previous
 * - Milestone tracking via localStorage/sessionStorage
 */

let lastCelebrationTime = 0;
const CELEBRATION_COOLDOWN_MS = 30_000;

// ── Tier: Info ──
export function toastInfo(message: string, opts?: { description?: string; id?: string }) {
  toast(message, {
    id: opts?.id,
    description: opts?.description,
    duration: 3000,
    className: "!border-l-2 !border-l-muted-foreground/30",
  });
}

// ── Tier: Success ──
export function toastSuccess(
  message: string,
  opts?: { description?: string; action?: { label: string; onClick: () => void } }
) {
  toast.success(message, {
    description: opts?.description,
    duration: 4000,
    className: "!border-l-2 !border-l-primary",
    action: opts?.action
      ? { label: opts.action.label, onClick: opts.action.onClick }
      : undefined,
  });
}

// ── Tier: Celebration ──
export function toastCelebration(
  message: string,
  opts?: {
    description?: string;
    action?: { label: string; onClick: () => void };
  }
) {
  // Rate-limit celebrations
  const now = Date.now();
  if (now - lastCelebrationTime < CELEBRATION_COOLDOWN_MS) return;
  lastCelebrationTime = now;

  toast(message, {
    description: opts?.description,
    duration: 5000,
    className: "celebration-toast !border-l-2 !border-l-amber-500 !border-amber-800/30",
    action: opts?.action
      ? { label: opts.action.label, onClick: opts.action.onClick }
      : undefined,
  });
}

// ── Milestone helpers ──

/** Fire a celebration only once ever (localStorage) */
export function milestoneCelebration(
  key: string,
  message: string,
  opts?: { description?: string; action?: { label: string; onClick: () => void } }
) {
  const storageKey = `filascope_milestone_${key}`;
  if (localStorage.getItem(storageKey)) return;
  localStorage.setItem(storageKey, "true");
  toastCelebration(message, opts);
}

/** Fire a celebration only once per session (sessionStorage) */
export function sessionMilestoneCelebration(
  key: string,
  message: string,
  opts?: { description?: string; action?: { label: string; onClick: () => void } }
) {
  const storageKey = `filascope_session_${key}`;
  if (sessionStorage.getItem(storageKey)) return;
  sessionStorage.setItem(storageKey, "true");
  toastCelebration(message, opts);
}
