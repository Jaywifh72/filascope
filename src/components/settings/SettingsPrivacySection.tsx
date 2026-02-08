import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, Loader2 } from "lucide-react";
import type { ProfileData } from "@/hooks/useSettings";

interface Props {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  saving: boolean;
  onSave: () => void;
}

export function SettingsPrivacySection({ profile, setProfile, saving, onSave }: Props) {
  const toggles = [
    {
      key: "is_public" as const,
      label: "Make my profile public",
      description: "Allow others to see your profile page with reviews and projects",
    },
    {
      key: "wishlist_public" as const,
      label: "Make my wishlist public",
      description: "Let visitors see your saved filaments on your profile",
      disabled: !profile.is_public,
    },
    {
      key: "reviews_public" as const,
      label: "Show my reviews on my profile",
      description: "Display your product reviews on your public profile page",
      disabled: !profile.is_public,
    },
    {
      key: "projects_public" as const,
      label: "Show my projects on my profile",
      description: "Display your public projects on your profile page",
      disabled: !profile.is_public,
    },
    {
      key: "purchases_public" as const,
      label: "Allow others to see what I've purchased",
      description: "Show your purchase history on your public profile (default: off)",
      disabled: !profile.is_public,
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Privacy</CardTitle>
            <CardDescription>Control what others can see about you</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {toggles.map((toggle) => (
          <div key={toggle.key} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{toggle.label}</Label>
              <p className="text-xs text-muted-foreground">{toggle.description}</p>
            </div>
            <Switch
              checked={profile[toggle.key]}
              onCheckedChange={(checked) =>
                setProfile(prev => ({ ...prev, [toggle.key]: checked }))
              }
              disabled={toggle.disabled}
            />
          </div>
        ))}

        {!profile.is_public && (
          <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
            Your profile is currently private. Enable "Make my profile public" to configure the other visibility settings.
          </p>
        )}

        <Button onClick={onSave} disabled={saving} className="mt-2">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Privacy Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
