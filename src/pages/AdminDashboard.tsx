import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Users, Package, Upload, TrendingUp, Shield, ExternalLink, BarChart3, ShoppingCart } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [stats, setStats] = useState({
    totalFilaments: 0,
    totalUsers: 0,
    totalDeals: 0,
    totalPrinters: 0,
  });

  useEffect(() => {
    // Only redirect after loading is complete AND user is confirmed not admin
    if (!loading && user && !isAdmin) {
      navigate("/");
    } else if (!loading && !user) {
      navigate("/auth");
    }
  }, [isAdmin, loading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    const [filamentsRes, usersRes, dealsRes, printersRes] = await Promise.all([
      supabase.from("filaments").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id", { count: "exact", head: true }),
      supabase.from("printers").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      totalFilaments: filamentsRes.count || 0,
      totalUsers: usersRes.count || 0,
      totalDeals: dealsRes.count || 0,
      totalPrinters: printersRes.count || 0,
    });
  };

  if (loading) {
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                <p className="text-sm text-muted-foreground">Printers</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalPrinters}</p>
              </div>
              <Database className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-6 bg-card border-border hover:border-primary transition-colors">
            <Link to="/admin/import" className="block">
              <div className="flex items-center gap-3 mb-3">
                <Upload className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Import Filaments</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload and import filament data from CSV files
              </p>
            </Link>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-primary transition-colors">
            <Link to="/admin/printers" className="block">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Import Printers</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload and import printer data from CSV files
              </p>
            </Link>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-primary transition-colors">
            <Link to="/admin/users" className="block">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">User Management</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage user accounts and permissions
              </p>
            </Link>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-primary transition-colors">
            <Link to="/admin/filaments" className="block">
              <div className="flex items-center gap-3 mb-3">
                <Package className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Manage Filaments</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Edit and manage filament database entries
              </p>
            </Link>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-primary transition-colors">
            <Link to="/admin/deals" className="block">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold text-foreground">Manage Deals</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Create and edit special deals and promotions
              </p>
            </Link>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-primary transition-colors">
            <Link to="/admin/printers" className="block">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Manage Printers</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage 3D printer database and compatibility
              </p>
            </Link>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-primary transition-colors">
            <Link to="/admin/enrichment" className="block">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <h3 className="text-lg font-semibold text-foreground">Data Enrichment</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Add missing weight data for better price calculations
              </p>
            </Link>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-primary transition-colors">
            <Link to="/admin/affiliates" className="block">
              <div className="flex items-center gap-3 mb-3">
                <ExternalLink className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Affiliate Links</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure affiliate URL patterns and Amazon tags
              </p>
            </Link>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-primary transition-colors">
            <Link to="/admin/data-quality" className="block">
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="w-6 h-6 text-cyan-500" />
                <h3 className="text-lg font-semibold text-foreground">Data Quality</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                View printer data completeness metrics and fix issues
              </p>
            </Link>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-primary transition-colors">
            <Link to="/admin/amazon-links" className="block">
              <div className="flex items-center gap-3 mb-3">
                <ShoppingCart className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-foreground">Amazon Link Finder</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Find and add Amazon links for filaments across regions
              </p>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
