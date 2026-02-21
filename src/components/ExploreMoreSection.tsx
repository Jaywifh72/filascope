import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, Layers, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface ExploreMoreSectionProps {
  /** Top brand in current results */
  topBrand?: { name: string; logoUrl?: string | null; slug?: string; count?: number };
  /** Current material label */
  materialLabel?: string;
  /** Material slug for linking */
  materialSlug?: string;
}

interface DiscoverCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

function DiscoverCard({ to, icon, title, description, className }: DiscoverCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center gap-4 rounded-xl bg-card border border-border p-4 transition-colors hover:bg-muted/50",
        className
      )}
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}

export function ExploreMoreSection({
  topBrand,
  materialLabel,
  materialSlug,
}: ExploreMoreSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "my-8 transition-opacity duration-[400ms] ease-out",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <h2 className="text-lg font-semibold text-foreground mb-4">Explore More</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card A — Brand */}
        {topBrand ? (
          <DiscoverCard
            to={`/brand/${topBrand.slug || topBrand.name.toLowerCase().replace(/\s+/g, "-")}`}
            icon={
              <BrandLogo
                src={topBrand.logoUrl}
                brandName={topBrand.name}
                size="sm"
              />
            }
            title={`More from ${topBrand.name}`}
            description={
              topBrand.count
                ? `View all ${topBrand.count} filaments →`
                : "View all filaments →"
            }
          />
        ) : (
          <DiscoverCard
            to="/brands"
            icon={
              <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                <Store className="w-3 h-3 text-primary" />
              </div>
            }
            title="Browse all brands"
            description="Explore 48+ filament manufacturers →"
          />
        )}

        {/* Card B — Material */}
        <DiscoverCard
          to={materialSlug ? `/filaments/${materialSlug}` : "/filaments"}
          icon={
            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
              <Layers className="w-3 h-3 text-primary" />
            </div>
          }
          title={materialLabel ? `Similar materials` : "All materials"}
          description={
            materialLabel
              ? `Browse all ${materialLabel} filaments →`
              : "Compare PLA, PETG, ABS & more →"
          }
        />

        {/* Card C — Deals */}
        <DiscoverCard
          to="/deals"
          icon={<span className="text-lg leading-none">🔥</span>}
          title="Trending deals"
          description="460 active deals — see what's on sale →"
        />
      </div>
    </div>
  );
}
