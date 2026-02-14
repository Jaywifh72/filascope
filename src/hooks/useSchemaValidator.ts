import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Development-only hook that validates JSON-LD schemas on every page transition.
 * Completely tree-shaken from production builds.
 */
export function useSchemaValidator() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    // Dynamic import so the module is never bundled in production
    import("@/utils/schemaValidator").then(({ runSchemaValidation }) => {
      runSchemaValidation(pathname);
    });
  }, [pathname]);
}
