import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Loader2, Mail, Monitor } from "lucide-react";
import type { ProfileData, NotificationSettings } from "@/hooks/useSettings";

interface Props {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  saving: boolean;
  onSave: () => void;
}

const EMAIL_TOGGLES: { key: keyof NotificationSettings; label: string; description: string }[] = [
  {
    key: "email_price_alerts",
    label: "Price Alerts",
    description: "Get notified when tracked filaments drop in price",
  },
  {
    key: "email_weekly_digest",
    label: "Weekly Deals Digest",
    description: "A weekly summary of the best deals and new arrivals",
  },
  {
    key: "email_review_replies",
    label: "Review Replies",
    description: "When someone replies to or comments on your reviews",
  },
  {
    key: "email_project_comments",
    label: "Project Comments",
    description: "When someone comments on your public projects",
  },
  {
    key: "email_new_reviews",
    label: "New Reviews on My Products",
    description: "When new reviews are posted on products you've purchased",
  },
];

export function SettingsNotificationsSection({ profile, setProfile, saving, onSave }: Props) {
  const updateNotification = (key: keyof NotificationSettings, value: boolean) => {
    setProfile(prev => ({
      ...prev,
      notification_settings: { ...prev.notification_settings, [key]: value },
    }));
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription>Choose what notifications you receive</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Email Notifications</Label>
          </div>
          <div className="space-y-4">
            {EMAIL_TOGGLES.map((toggle) => (
              <div key={toggle.key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm">{toggle.label}</p>
                  <p className="text-xs text-muted-foreground">{toggle.description}</p>
                </div>
                <Switch
                  checked={profile.notification_settings[toggle.key] ?? false}
                  onCheckedChange={(checked) => updateNotification(toggle.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* On-site Notifications */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">On-site Notifications</Label>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm">Show notification badges</p>
              <p className="text-xs text-muted-foreground">Display a badge on the account menu when new alerts trigger</p>
            </div>
            <Switch
              checked={profile.notification_settings.onsite_notifications ?? true}
              onCheckedChange={(checked) => updateNotification("onsite_notifications", checked)}
            />
          </div>
        </div>

        <Button onClick={onSave} disabled={saving} className="mt-2">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Notification Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
