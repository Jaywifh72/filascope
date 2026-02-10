import { useState, useEffect } from "react";

/**
 * Measures real API latency by sampling Performance API resource entries
 * for Supabase requests. Falls back to a modest estimate if no entries found.
 */
export function useApiLatency(intervalMs = 5000) {
  const [latency, setLatency] = useState(14);

  useEffect(() => {
    function measure() {
      try {
        const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        const supabaseEntries = entries.filter(
          (e) => e.name.includes("supabase") && e.responseEnd > 0 && e.startTime > 0
        );

        if (supabaseEntries.length > 0) {
          // Take the last 10 entries for a recent average
          const recent = supabaseEntries.slice(-10);
          const avg =
            recent.reduce((sum, e) => sum + (e.responseEnd - e.startTime), 0) /
            recent.length;
          setLatency(Math.round(avg));
        }
        // If no entries yet, keep current value
      } catch {
        // Performance API not available, keep default
      }
    }

    measure();
    const id = setInterval(measure, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return latency;
}

/** Returns a Tailwind text color class based on latency thresholds */
export function getLatencyColor(ms: number): string {
  if (ms < 100) return "text-emerald-500";
  if (ms <= 500) return "text-amber-500";
  return "text-red-500";
}

/** Returns a human-readable label for the latency range */
export function getLatencyLabel(ms: number): string {
  if (ms < 100) return "Excellent";
  if (ms <= 500) return "Moderate";
  return "Slow";
}
