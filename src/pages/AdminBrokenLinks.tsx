import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Link2, RefreshCw, Trash2, Package, Database, Wrench, Layers, Box
} from "lucide-react";
import { toast } from "sonner";
import BrokenLinkSection from "@/components/admin/BrokenLinkSection";

interface GlobalStats {
  totalScanned: number;
  totalBroken: number;
  totalRedirects: number;
  totalTimeouts: number;
}

const AdminBrokenLinks = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ totalScanned: 0, totalBroken: 0, totalRedirects: 0, totalTimeouts: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("filament");

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      navigate("/");
    } else if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [isAdmin, authLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchGlobalStats();
    }
  }, [isAdmin, refreshKey]);

  const fetchGlobalStats = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("url_validation_results")
      .select("status, url");

    if (!error && data) {
      const isAmazonUrl = (url: string) => url?.toLowerCase().includes('amazon.');
      const stats = data.reduce((acc, r) => {
        acc.totalScanned++;
        if (r.status === 'broken' && !isAmazonUrl(r.url)) acc.totalBroken++;
        else if (r.status === 'redirect') acc.totalRedirects++;
        else if (r.status === 'timeout') acc.totalTimeouts++;
        return acc;
      }, { totalScanned: 0, totalBroken: 0, totalRedirects: 0, totalTimeouts: 0 });
      setGlobalStats(stats);
    }
    setLoading(false);
  };

  const clearAllResults = async () => {
    if (!confirm("Are you sure you want to clear all scan results? This will allow you to start fresh.")) {
      return;
    }

    const { error } = await supabase
      .from("url_validation_results")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      toast.error("Failed to clear results");
    } else {
      toast.success("All results cleared");
      setRefreshKey(k => k + 1);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    fetchGlobalStats();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link2 className="w-8 h-8 text-orange-500" />
              <h1 className="text-3xl font-bold text-foreground">Broken Link Monitor</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={clearAllResults} variant="outline" size="sm" disabled={loading || globalStats.totalScanned === 0}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Global Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-card border-border">
              <p className="text-sm text-muted-foreground">Total Scanned</p>
              <p className="text-2xl font-bold text-foreground">{globalStats.totalScanned}</p>
            </Card>
            <Card className="p-4 bg-card border-border border-l-4 border-l-red-500">
              <p className="text-sm text-muted-foreground">Broken</p>
              <p className="text-2xl font-bold text-red-500">{globalStats.totalBroken}</p>
            </Card>
            <Card className="p-4 bg-card border-border border-l-4 border-l-yellow-500">
              <p className="text-sm text-muted-foreground">Redirects</p>
              <p className="text-2xl font-bold text-yellow-500">{globalStats.totalRedirects}</p>
            </Card>
            <Card className="p-4 bg-card border-border border-l-4 border-l-muted">
              <p className="text-sm text-muted-foreground">Timeouts</p>
              <p className="text-2xl font-bold text-muted-foreground">{globalStats.totalTimeouts}</p>
            </Card>
          </div>

          {/* Tabbed Category Sections */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="filament" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Filaments</span>
              </TabsTrigger>
              <TabsTrigger value="printer" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Printers</span>
              </TabsTrigger>
              <TabsTrigger value="hotend" className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                <span className="hidden sm:inline">Hotends</span>
              </TabsTrigger>
              <TabsTrigger value="build_plate" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Build Plates</span>
              </TabsTrigger>
              <TabsTrigger value="other" className="flex items-center gap-2">
                <Box className="w-4 h-4" />
                <span className="hidden sm:inline">AMS/MMU</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="filament">
              <BrokenLinkSection
                key={`filament-${refreshKey}`}
                category="filament"
                title="Filaments"
                icon={<Package className="w-5 h-5 text-blue-500" />}
                userId={user?.id}
                onRefresh={handleRefresh}
              />
            </TabsContent>

            <TabsContent value="printer">
              <BrokenLinkSection
                key={`printer-${refreshKey}`}
                category="printer"
                title="Printers"
                icon={<Database className="w-5 h-5 text-green-500" />}
                userId={user?.id}
                onRefresh={handleRefresh}
              />
            </TabsContent>

            <TabsContent value="hotend">
              <BrokenLinkSection
                key={`hotend-${refreshKey}`}
                category="hotend"
                title="Hotends / Nozzles"
                icon={<Wrench className="w-5 h-5 text-orange-500" />}
                userId={user?.id}
                onRefresh={handleRefresh}
              />
            </TabsContent>

            <TabsContent value="build_plate">
              <BrokenLinkSection
                key={`build_plate-${refreshKey}`}
                category="build_plate"
                title="Build Plates"
                icon={<Layers className="w-5 h-5 text-purple-500" />}
                userId={user?.id}
                onRefresh={handleRefresh}
              />
            </TabsContent>

            <TabsContent value="other">
              <BrokenLinkSection
                key={`other-${refreshKey}`}
                category="other"
                title="Others (AMS/MMU)"
                icon={<Box className="w-5 h-5 text-cyan-500" />}
                userId={user?.id}
                onRefresh={handleRefresh}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AdminBrokenLinks;
