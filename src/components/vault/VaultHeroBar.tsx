import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Settings, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { VaultProfile, VaultCounts } from "@/hooks/useVaultProfile";

interface VaultHeroBarProps {
  profile: VaultProfile | null;
  counts: VaultCounts;
  onStatClick: (tab: string) => void;
}

const statItems: { key: keyof VaultCounts; label: string; tab: string; tooltip: string }[] = [
  { key: "wishlist", label: "Wishlist", tab: "wishlist", tooltip: "Filaments you're interested in" },
  { key: "purchased", label: "Purchased", tab: "purchased", tooltip: "Filaments you've bought" },
  { key: "projects", label: "Projects", tab: "projects", tooltip: "Your organized print builds" },
  { key: "reviews", label: "Reviews", tab: "reviews", tooltip: "Your community contributions" },
  { key: "alerts", label: "Alerts", tab: "alerts", tooltip: "Price drop notifications" },
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
  const allZero = statItems.every((s) => counts[s.key] === 0);
  const navigate = useNavigate();
  const memberSince = profile?.created_at
    ? format(new Date(profile.created_at), "MMMM yyyy")
    : null;

  const handleViewProfile = () => {
    if (!profile?.username_slug) {
      toast.info("Set a username to enable your public profile");
      navigate("/settings");
      return;
    }
    navigate(`/user/${profile.username_slug}`);
  };

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

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" className="shrink-0" onClick={handleViewProfile}>
            <ExternalLink className="w-4 h-4 mr-2" />
            View Profile
          </Button>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link to="/settings">
              <Settings className="w-4 h-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/40">
        {allZero ? (
          <div className="flex items-center gap-2 w-full">
            <p className="text-sm text-muted-foreground">
              🎯 Start building your collection — browse filaments, save favorites, and track prices
            </p>
            <button
              onClick={() => {
                const onboarding = document.getElementById("vault-onboarding");
                if (onboarding) {
                  onboarding.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  onStatClick("wishlist");
                }
              }}
              className="text-sm text-primary hover:text-primary/80 transition-colors whitespace-nowrap font-medium"
            >
              Get Started →
            </button>
          </div>
        ) : (
          <TooltipProvider delayDuration={300}>
            {statItems.map((stat) => {
              const value = counts[stat.key];
              const isZero = value === 0;
              return (
                <Tooltip key={stat.key}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onStatClick(stat.tab)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 text-sm cursor-pointer ${
                        isZero
                          ? "bg-muted/30 border border-dashed border-border/50 text-muted-foreground/50"
                          : "bg-muted/50 border border-border/40 hover:border-primary/30"
                      }`}
                    >
                      <span className={isZero ? "font-medium" : "font-bold text-primary"}>
                        {value}
                      </span>
                      <span className={isZero ? "text-muted-foreground/50" : "text-muted-foreground"}>
                        {stat.label}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {stat.tooltip}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
