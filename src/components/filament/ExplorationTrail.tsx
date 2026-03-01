import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/hooks/useCompare";
import { getFilamentHref } from "@/lib/filamentUrl";
import { cn } from "@/lib/utils";

export interface TrailItem {
  id: string;
  title: string;
  vendor: string | null;
  handle: string | null;
}

const TRAIL_KEY = "filascope_exploration_trail";
const MAX_TRAIL = 6;

export function getTrail(): TrailItem[] {
  try {
    const raw = sessionStorage.getItem(TRAIL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushToTrail(item: TrailItem) {
  const trail = getTrail().filter((t) => t.id !== item.id);
  trail.push(item);
  if (trail.length > MAX_TRAIL) trail.shift();
  sessionStorage.setItem(TRAIL_KEY, JSON.stringify(trail));
}

interface ExplorationTrailProps {
  currentId: string;
}

export function ExplorationTrail({ currentId }: ExplorationTrailProps) {
  const trail = useMemo(() => getTrail(), [currentId]);
  const { addItem } = useCompare();

  if (trail.length < 2) return null;

  // Show max 4 items, collapsing older ones
  const maxVisible = 4;
  const visible = trail.slice(-maxVisible);
  const hasCollapsed = trail.length > maxVisible;

  const handleCompareAll = () => {
    for (const item of trail) {
      addItem({
        id: item.id,
        product_title: item.title,
        vendor: item.vendor,
        material: null,
        color_hex: null,
        variant_price: null,
        net_weight_g: null,
        featured_image: null,
      });
    }
  };

  return (
    <nav
      aria-label="Your browsing trail"
      className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto scrollbar-hide py-1 mb-2"
    >
      <span className="flex-shrink-0 text-muted-foreground/70">Your trail:</span>

      {hasCollapsed && (
        <>
          <span className="text-muted-foreground/50">…</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
        </>
      )}

      {visible.map((item, i) => {
        const isCurrent = item.id === currentId;
        return (
          <span key={item.id} className="flex items-center gap-1 flex-shrink-0">
            {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />}
            {isCurrent ? (
              <span className="font-medium text-foreground truncate max-w-[140px]">{item.title}</span>
            ) : (
              <Link
                to={getFilamentHref(item.id, item.handle)}
                className="text-primary hover:text-primary/80 hover:underline truncate max-w-[140px] transition-colors"
              >
                {item.title}
              </Link>
            )}
          </span>
        );
      })}

      {trail.length >= 2 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCompareAll}
          className="ml-2 h-6 px-2 text-[10px] text-primary hover:text-primary/80 flex-shrink-0"
        >
          <GitCompareArrows className="w-3 h-3 mr-1" />
          Compare these
        </Button>
      )}
    </nav>
  );
}
