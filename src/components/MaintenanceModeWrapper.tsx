import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { ComingSoonPage } from "./ComingSoonPage";

interface MaintenanceModeWrapperProps {
  children: ReactNode;
}

export const MaintenanceModeWrapper = ({ children }: MaintenanceModeWrapperProps) => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { isMaintenanceMode, loading: maintenanceLoading } = useMaintenanceMode();
  const [bypassMaintenance, setBypassMaintenance] = useState(false);

  // Reset bypass when user logs out
  useEffect(() => {
    if (!user) {
      setBypassMaintenance(false);
    }
  }, [user]);

  // Show loading state while checking auth and maintenance mode
  if (authLoading || maintenanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If maintenance mode is enabled and user is not admin and hasn't bypassed
  if (isMaintenanceMode && !isAdmin && !bypassMaintenance) {
    return (
      <ComingSoonPage 
        onLoginSuccess={() => {
          // After login, check admin status will happen automatically via useAuth
          // If they're admin, isAdmin will update and show the site
          // If not admin, they'll still see coming soon
          setBypassMaintenance(true);
        }} 
      />
    );
  }

  // Show the actual site
  return <>{children}</>;
};
