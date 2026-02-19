import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureSwitch } from "@/hooks/useFeatureSwitch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PageLoadingSkeleton } from "@/components/skeletons/PageLoadingSkeleton";
import { Settings, ToggleLeft, ExternalLink, Handshake, BarChart3 } from "lucide-react";
import { SyncMonitorContent } from "@/pages/admin/SyncMonitor";

export default function NewAdminPanel() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { enabled: lightModePublic, loading: switchLoading, setEnabled: setLightModePublic } = useFeatureSwitch("light_mode_public");

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/auth", { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate]);

  if (authLoading || switchLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage feature flags and site-wide settings</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/old-admin/dashboard" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              OldAdmin Dashboard
            </Link>
          </Button>
        </div>

        {/* Top row: Feature Switches + Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature Switches */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ToggleLeft className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Feature Switches</CardTitle>
                  <CardDescription>Toggle site-wide features on or off</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Light mode option</Label>
                  <p className="text-xs text-muted-foreground">
                    {lightModePublic
                      ? "Light mode is available to all users."
                      : "Light mode is restricted to admins only."}
                  </p>
                </div>
                <Switch
                  checked={lightModePublic}
                  onCheckedChange={(checked) => setLightModePublic(checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                to="/admin/affiliate-hub"
                className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Handshake className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Affiliate Hub</p>
                  <p className="text-xs text-muted-foreground">Programs, discount codes, campaigns & click analytics</p>
                </div>
              </Link>
              <Link
                to="/admin/pricing-data"
                className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors mt-3"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Pricing Data</p>
                  <p className="text-xs text-muted-foreground">Raw pricing, link health & regional price overview</p>
                </div>
              </Link>
              <Link
                to="/admin/analytics"
                className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors mt-3"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Analytics Dashboard</p>
                  <p className="text-xs text-muted-foreground">Affiliate performance, search insights, SEO health & content gaps</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Sync Monitor */}
        <SyncMonitorContent />
      </div>
    </div>
  );
}
