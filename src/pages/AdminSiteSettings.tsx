import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const AdminSiteSettings = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { isMaintenanceMode, loading: maintenanceLoading, setMaintenanceMode } = useMaintenanceMode();

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      navigate("/");
    } else if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [isAdmin, authLoading, user, navigate]);

  const handleToggleMaintenance = async () => {
    const newValue = !isMaintenanceMode;
    const { error } = await setMaintenanceMode(newValue);

    if (error) {
      toast.error("Failed to update maintenance mode");
    } else {
      toast.success(
        newValue
          ? "Site is now in 'Coming Soon' mode. Only admins can see it."
          : "Maintenance mode disabled. Site is now public."
      );
    }
  };

  if (authLoading || maintenanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Site Settings</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="w-5 h-5" />
              Coming Soon Mode
            </CardTitle>
            <CardDescription>
              Enable this to show a "Coming Soon" page to all visitors. 
              Admins can still log in and access the full site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="maintenance-mode" className="text-base font-medium">
                  Enable Coming Soon Page
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isMaintenanceMode
                    ? "The site is currently showing 'Coming Soon' to visitors"
                    : "The site is currently visible to everyone"}
                </p>
              </div>
              <Switch
                id="maintenance-mode"
                checked={isMaintenanceMode}
                onCheckedChange={handleToggleMaintenance}
              />
            </div>

            {isMaintenanceMode && (
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  <strong>Note:</strong> You can still access the site because you're logged in as an admin. 
                  Regular visitors will only see the "Coming Soon" page with a hidden login option.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSiteSettings;
