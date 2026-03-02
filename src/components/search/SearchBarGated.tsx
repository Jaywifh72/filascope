import type { ReactNode } from "react";
import { useFeatureSwitch } from "@/hooks/useFeatureSwitch";
import { useAuth } from "@/hooks/useAuth";

/**
 * Wraps search UI and only renders children when the "filament_search_public"
 * feature switch is enabled — or when the current user is an admin.
 * Returns null (hidden) when the switch is off for non-admins.
 */
export function SearchBarGated({ children }: { children: ReactNode }) {
  const { enabled } = useFeatureSwitch("filament_search_public");
  const { isAdmin } = useAuth();

  if (enabled || isAdmin) return <>{children}</>;
  return null;
}
