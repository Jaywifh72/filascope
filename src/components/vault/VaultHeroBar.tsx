import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { VaultProfile, VaultCounts } from "@/hooks/useVaultProfile";

interface VaultHeroBarProps {
  profile: VaultProfile | null;
  counts: VaultCounts;
  onStatClick: (tab: string) => void;
}

const statItems: { key: keyof VaultCounts; label: string; tab: string }[] = [
  { key: "wishlist", label: "Wishlist", tab: "wishlist" },
  { key: "purchased", label: "Purchased", tab: "purchased" },
  { key: "projects", label: "Projects", tab: "projects" },
  { key: "reviews", label: "Reviews", tab: "reviews" },
  { key: "alerts", label: "Alerts", tab: "alerts" },
];

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return "U";
}

export function VaultHeroBar({ profile, counts, onStatClick }: VaultHeroBarProps) {
  const memberSince = profile?.created_at
    ? format(new Date(profile.created_at), "MMMM yyyy")
    : null;

  return (
    <div className="rounded-xl bg-card/50 border border-border/50 p-5 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Avatar + Identity */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Avatar className="h-14 w-14 shrink-0 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {getInitials(profile?.display_name ?? null, profile?.email ?? null)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {profile?.display_name || "My Vault"}
            </h1>
            {memberSince && (
              <p className="text-sm text-muted-foreground">Member since {memberSince}</p>
            )}
          </div>
        </div>

        {/* Edit Profile */}
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link to="/settings">
            <Settings className="w-4 h-4 mr-2" />
            Edit Profile
          </Link>
        </Button>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/40">
        {statItems.map((stat) => (
          <button
            key={stat.key}
            onClick={() => onStatClick(stat.tab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors text-sm"
          >
            <span className="font-semibold">{counts[stat.key]}</span>
            <span className="text-muted-foreground">{stat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
