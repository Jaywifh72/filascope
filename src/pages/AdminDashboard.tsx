import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminHealth } from "@/hooks/useAdminHealth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HealthScoreWidget } from "@/components/admin/HealthScoreWidget";
import { StaleDataAlerts } from "@/components/admin/StaleDataAlerts";
import { RecentActivityLog } from "@/components/admin/RecentActivityLog";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { 
  Database, Users, Package, TrendingUp, Shield, 
  BarChart3, RefreshCw, Building2,
  DollarSign, PieChart, Star, FileText,
  Scan, Settings, Globe, ClipboardCheck, Calendar
} from "lucide-react";

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const { metrics, alerts, loading: healthLoading, refresh } = useAdminHealth();
  const [stats, setStats] = useState({
    totalFilaments: 0,
    totalUsers: 0,
    totalDeals: 0,
    totalPrinters: 0,
    totalRegionalStores: 0,
    brandsWithStores: 0,
    totalBrands: 0,
  });

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    const [filamentsRes, usersRes, dealsRes, printersRes, storesRes, brandsRes] = await Promise.all([
      supabase.from("filaments").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id", { count: "exact", head: true }),
      supabase.from("printers").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("brand_regional_stores").select("id, brand_id", { count: "exact" }),
      supabase.from("automated_brands").select("id", { count: "exact", head: true }),
    ]);

    // Calculate unique brands with stores
    const uniqueBrandsWithStores = new Set(storesRes.data?.map(s => s.brand_id) || []).size;

    setStats({
      totalFilaments: filamentsRes.count || 0,
      totalUsers: usersRes.count || 0,
      totalDeals: dealsRes.count || 0,
      totalPrinters: printersRes.count || 0,
      totalRegionalStores: storesRes.count || 0,
      brandsWithStores: uniqueBrandsWithStores,
      totalBrands: brandsRes.count || 0,
    });
  };

  const quickActions = [
    { to: "/admin/site-settings", icon: Settings, title: "Site Settings", desc: "Coming soon mode & more", color: "text-orange-500" },
    { to: "/admin/brand-pipeline", icon: Building2, title: "Brand Pipeline", desc: "Unified scraping & sync", color: "text-emerald-500" },
    { to: "/admin/regional-stores", icon: Globe, title: "Regional Stores", desc: "Manage brand storefronts", color: "text-teal-500" },
    { to: "/admin/region-test", icon: Globe, title: "Region Testing", desc: "Price accuracy verification", color: "text-cyan-500" },
    { to: "/admin/exchange-rates", icon: DollarSign, title: "Exchange Rates", desc: "Currency conversion rates", color: "text-green-500" },
    { to: "/admin/data-health", icon: BarChart3, title: "Data Health", desc: "Quality & completeness", color: "text-cyan-500" },
    { to: "/admin/filament-scraper", icon: Scan, title: "Filament Scraper", desc: "Scrape product pages to DB", color: "text-violet-500" },
    { to: "/admin/filaments", icon: Package, title: "Manage Filaments", desc: "Edit filament entries", color: "text-primary" },
    { to: "/admin/printers", icon: Database, title: "Manage Printers", desc: "Printer database & pricing", color: "text-primary" },
    { to: "/admin/filament-audit", icon: ClipboardCheck, title: "Filament Audit", desc: "Quality audit & URL testing", color: "text-green-500" },
    { to: "/admin/module-analytics", icon: PieChart, title: "Module Analytics", desc: "Sidebar engagement metrics", color: "text-pink-500" },
    { to: "/admin/featured-content", icon: Star, title: "Featured Content", desc: "Curate sidebar content", color: "text-amber-500" },
    { to: "/admin/scheduler", icon: Calendar, title: "Scheduler", desc: "Automated tasks & cron jobs", color: "text-indigo-500" },
    { to: "/admin/users", icon: Users, title: "User Management", desc: "Manage accounts & roles", color: "text-primary" },
    { to: "/admin/docs", icon: FileText, title: "Documentation", desc: "Architecture & technical docs", color: "text-blue-500" },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <Button onClick={refresh} variant="outline" size="sm" disabled={healthLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${healthLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Health & Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <HealthScoreWidget metrics={metrics} loading={healthLoading} />
          <StaleDataAlerts alerts={alerts} loading={healthLoading} />
          <RecentActivityLog />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Filaments</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalFilaments}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Printers</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalPrinters}</p>
              </div>
              <Database className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalDeals}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-400" />
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Regional Stores</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalRegionalStores}</p>
              </div>
              <Globe className="w-8 h-8 text-teal-500" />
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Store Coverage</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalBrands > 0 
                    ? Math.round((stats.brandsWithStores / stats.totalBrands) * 100) 
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.brandsWithStores}/{stats.totalBrands} brands
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-cyan-500" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card key={action.to} className="p-4 bg-card border-border hover:border-primary transition-colors">
              <Link to={action.to} className="block">
                <div className="flex items-center gap-3 mb-2">
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                  <h3 className="font-semibold text-foreground">{action.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{action.desc}</p>
              </Link>
            </Card>
          ))}
        </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
