import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ExternalLink, Settings, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { PublicProfile, ProfileBadge } from "@/hooks/usePublicProfile";

// Social platform configs
const SOCIAL_PLATFORMS: { key: string; label: string; icon: string }[] = [
  { key: "printables", label: "Printables", icon: "🖨️" },
  { key: "thingiverse", label: "Thingiverse", icon: "🔧" },
  { key: "youtube", label: "YouTube", icon: "▶️" },
  { key: "instagram", label: "Instagram", icon: "📷" },
];

interface ProfileHeaderProps {
  profile: PublicProfile;
  badges: ProfileBadge[];
  reviewCount: number;
  projectCount: number;
  helpfulVotes: number;
  isOwnProfile: boolean;
}

function getInitials(name: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileHeader({
  profile,
  badges,
  reviewCount,
  projectCount,
  helpfulVotes,
  isOwnProfile,
}: ProfileHeaderProps) {
  const memberSince = profile.created_at
    ? format(new Date(profile.created_at), "MMMM yyyy")
    : null;

  const socialLinks = (profile.social_links || {}) as Record<string, string>;
  const hasSocialLinks = SOCIAL_PLATFORMS.some((p) => socialLinks[p.key]);

  return (
    <div className="rounded-xl bg-card/50 border border-border/50 p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start gap-5">
        {/* Avatar */}
        <Avatar className="h-20 w-20 shrink-0 border-2 border-primary/20">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-2xl">
            {getInitials(profile.display_name)}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-foreground truncate">
                {profile.display_name || "Anonymous User"}
              </h1>
              {memberSince && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Member since {memberSince}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isOwnProfile ? (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" disabled>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-muted-foreground mt-3 max-w-xl">
              {profile.bio}
            </p>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {badges.map((b) => (
                <Badge key={b.label} variant={b.variant} className="text-xs">
                  {b.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/40">
            <StatItem value={reviewCount} label="Reviews" />
            <StatItem value={projectCount} label="Projects" />
            <StatItem value={helpfulVotes} label="Helpful Votes" />
          </div>

          {/* Social links */}
          {hasSocialLinks && (
            <div className="flex flex-wrap gap-2 mt-3">
              {SOCIAL_PLATFORMS.map((platform) => {
                const url = socialLinks[platform.key];
                if (!url) return null;
                return (
                  <a
                    key={platform.key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors text-xs"
                  >
                    <span>{platform.icon}</span>
                    <span>{platform.label}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Own-profile banners */}
      {isOwnProfile && (
        <div className="mt-4 pt-3 border-t border-border/40">
          {profile.is_public ? (
            <p className="text-xs text-muted-foreground italic">
              🔍 This is how others see your profile
            </p>
          ) : (
            <p className="text-xs text-destructive font-medium">
              🔒 Your profile is currently private. Only you can see this page.{" "}
              <Link to="/settings" className="underline hover:text-destructive/80">
                Make it public
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <span className="font-semibold text-foreground">{value}</span>{" "}
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}
