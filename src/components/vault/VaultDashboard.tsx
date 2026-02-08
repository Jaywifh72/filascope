import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star,
  FolderOpen,
  Bell,
  Search,
  Heart,
  Eye,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { VaultProfile, VaultCounts } from "@/hooks/useVaultProfile";
import type { VaultTab } from "./VaultSidebar";

interface VaultDashboardProps {
  profile: VaultProfile | null;
  counts: VaultCounts;
  onNavigate: (tab: VaultTab) => void;
}

export function VaultDashboard({ profile, counts, onNavigate }: VaultDashboardProps) {
  const { user } = useAuth();
  const totalData =
    counts.wishlist + counts.purchased + counts.projects + counts.reviews + counts.alerts;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {profile?.display_name
            ? `Welcome back, ${profile.display_name}!`
            : "Welcome to your Vault!"}
        </h2>
        <p className="text-muted-foreground mt-1">
          Your personal filament command center.
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {totalData === 0 ? (
        <OnboardingCard />
      ) : (
        <>
          {/* Recent Activity */}
          {user && <RecentActivityFeed userId={user.id} />}

          {/* Projects Summary */}
          {counts.projects > 0 && user && (
            <ProjectsSummary userId={user.id} onViewAll={() => onNavigate("projects")} />
          )}

          {/* Alerts Summary */}
          {counts.alerts > 0 && user && (
            <AlertsSummary userId={user.id} onViewAll={() => onNavigate("alerts")} />
          )}
        </>
      )}
    </div>
  );
}

function QuickActions() {
  const actions = [
    {
      icon: Star,
      label: "Write a Review",
      description: "Share your experience",
      href: "/",
    },
    {
      icon: FolderOpen,
      label: "Start a Project",
      description: "Organize your builds",
      href: "/vault?tab=projects",
    },
    {
      icon: Bell,
      label: "Set Price Alert",
      description: "Track price drops",
      href: "/",
    },
    {
      icon: Search,
      label: "Browse Filaments",
      description: "Discover new options",
      href: "/",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((action) => (
        <Link key={action.label} to={action.href}>
          <Card className="h-full hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <action.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function OnboardingCard() {
  const steps = [
    { icon: Search, label: "Browse filaments", href: "/", step: 1 },
    { icon: Heart, label: "Save favorites", href: "/", step: 2 },
    { icon: Bell, label: "Set price alerts", href: "/", step: 3 },
    { icon: FolderOpen, label: "Track your collection", href: "/vault?tab=projects", step: 4 },
  ];

  return (
    <Card className="border-dashed border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Get started with your Vault</CardTitle>
            <p className="text-sm text-muted-foreground">
              Follow these steps to build your personal filament hub
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => (
            <Link
              key={step.step}
              to={step.href}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors group"
            >
              <span className="text-xs font-bold text-primary">Step {step.step}</span>
              <step.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium text-center">{step.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivityFeed({ userId }: { userId: string }) {
  const { data: activity } = useQuery({
    queryKey: ["vault-recent-activity", userId],
    queryFn: async () => {
      const [historyRes, wishlistRes, reviewsRes, alertsRes] = await Promise.all([
        supabase
          .from("user_browse_history")
          .select("filament_id, viewed_at, filament:filaments(id, product_title)")
          .eq("user_id", userId)
          .order("viewed_at", { ascending: false })
          .limit(3),
        supabase
          .from("user_favorites")
          .select("filament_id, created_at, filament:filaments(id, product_title)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("filament_reviews")
          .select("filament_id, created_at, filament:filaments(id, product_title)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("price_alerts")
          .select("filament_id, created_at, filament:filaments(id, product_title)")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      type ActivityItem = {
        type: string;
        icon: "eye" | "heart" | "star" | "bell";
        title: string;
        filament_id: string;
        timestamp: string;
      };

      const items: ActivityItem[] = [];

      (historyRes.data || []).forEach((h: any) => {
        if (h.filament?.product_title) {
          items.push({
            type: "Viewed",
            icon: "eye",
            title: h.filament.product_title,
            filament_id: h.filament.id,
            timestamp: h.viewed_at,
          });
        }
      });

      (wishlistRes.data || []).forEach((w: any) => {
        if (w.filament?.product_title) {
          items.push({
            type: "Wishlisted",
            icon: "heart",
            title: w.filament.product_title,
            filament_id: w.filament.id,
            timestamp: w.created_at,
          });
        }
      });

      (reviewsRes.data || []).forEach((r: any) => {
        if (r.filament?.product_title) {
          items.push({
            type: "Reviewed",
            icon: "star",
            title: r.filament.product_title,
            filament_id: r.filament.id,
            timestamp: r.created_at,
          });
        }
      });

      (alertsRes.data || []).forEach((a: any) => {
        if (a.filament?.product_title) {
          items.push({
            type: "Alert set",
            icon: "bell",
            title: a.filament.product_title,
            filament_id: a.filament.id,
            timestamp: a.created_at,
          });
        }
      });

      // Sort by timestamp, dedupe, take 5
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const seen = new Set<string>();
      return items.filter((item) => {
        const key = `${item.type}:${item.filament_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 5);
    },
    staleTime: 1000 * 60 * 2,
  });

  const iconMap = {
    eye: Eye,
    heart: Heart,
    star: Star,
    bell: Bell,
  };

  if (!activity?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {activity.map((item, idx) => {
            const Icon = iconMap[item.icon];
            return (
              <Link
                key={idx}
                to={`/filament/${item.filament_id}`}
                className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    <span className="text-muted-foreground">{item.type}</span>{" "}
                    <span className="font-medium">{item.title}</span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectsSummary({ userId, onViewAll }: { userId: string; onViewAll: () => void }) {
  const { data: projects } = useQuery({
    queryKey: ["vault-projects-summary", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, created_at, project_filaments(id)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });

  if (!projects?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Your Projects</CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-3 sm:grid-cols-3">
          {projects.map((project: any) => (
            <div
              key={project.id}
              className="p-3 rounded-lg bg-muted/30 border border-border/30"
            >
              <p className="font-medium text-sm truncate">{project.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {project.project_filaments?.length || 0} filaments ·{" "}
                {format(new Date(project.created_at), "MMM d")}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsSummary({ userId, onViewAll }: { userId: string; onViewAll: () => void }) {
  const { data: alerts } = useQuery({
    queryKey: ["vault-alerts-summary", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_alerts")
        .select("id, target_price, created_at, filament:filaments(id, product_title, variant_price)")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });

  if (!alerts?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Active Alerts</CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {alerts.map((alert: any) => {
            const isTriggered =
              alert.filament?.variant_price && alert.filament.variant_price <= alert.target_price;
            return (
              <Link
                key={alert.id}
                to={`/filament/${alert.filament?.id}`}
                className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Bell
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isTriggered ? "text-primary fill-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-sm truncate">{alert.filament?.product_title}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  Target: ${alert.target_price}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
