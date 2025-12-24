import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, RefreshCw, CheckCircle2, Clock, FileSearch } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TdsStats {
  totalFilaments: number;
  withTdsUrl: number;
  fullyParsed: number;
  pendingDiscovery: number;
  pendingParsing: number;
  percentComplete: number;
}

interface TdsParsingStatusProps {
  onRefresh?: () => void;
  refreshTrigger?: number;
}

export function TdsParsingStatus({ onRefresh, refreshTrigger }: TdsParsingStatusProps) {
  const [stats, setStats] = useState<TdsStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Get total Elegoo filaments count
      const { count: totalFilaments } = await supabase
        .from("filaments")
        .select("*", { count: "exact", head: true })
        .eq("vendor", "Elegoo");

      // Get count of filaments with TDS URL
      const { count: withTdsUrl } = await supabase
        .from("filaments")
        .select("*", { count: "exact", head: true })
        .not("tds_url", "is", null)
        .eq("vendor", "Elegoo");

      // Get count of fully parsed filaments (has TDS URL + all key fields)
      const { count: fullyParsed } = await supabase
        .from("filaments")
        .select("*", { count: "exact", head: true })
        .not("tds_url", "is", null)
        .not("nozzle_temp_min_c", "is", null)
        .not("density_g_cm3", "is", null)
        .not("drying_temp_c", "is", null)
        .eq("vendor", "Elegoo");

      const total = totalFilaments || 0;
      const hasTds = withTdsUrl || 0;
      const parsed = fullyParsed || 0;
      const needsDiscovery = total - hasTds;
      const needsParsing = hasTds - parsed;
      const percent = total > 0 ? Math.round((parsed / total) * 100) : 0;

      setStats({
        totalFilaments: total,
        withTdsUrl: hasTds,
        fullyParsed: parsed,
        pendingDiscovery: needsDiscovery,
        pendingParsing: needsParsing,
        percentComplete: percent,
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch TDS stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    fetchStats();
    onRefresh?.();
  };

  if (!stats && !isLoading) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            TDS Parsing Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 px-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Parsing Progress</span>
            <span className="font-medium">{stats?.percentComplete ?? 0}% Complete</span>
          </div>
          <Progress value={stats?.percentComplete ?? 0} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="flex items-center justify-center gap-1.5 text-green-600 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">Parsed</span>
            </div>
            <div className="text-2xl font-bold">{stats?.fullyParsed.toLocaleString() ?? "-"}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="flex items-center justify-center gap-1.5 text-amber-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Need Parse</span>
            </div>
            <div className="text-2xl font-bold">{stats?.pendingParsing.toLocaleString() ?? "-"}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="flex items-center justify-center gap-1.5 text-orange-600 mb-1">
              <FileSearch className="w-4 h-4" />
              <span className="text-xs font-medium">Need TDS</span>
            </div>
            <div className="text-2xl font-bold">{stats?.pendingDiscovery.toLocaleString() ?? "-"}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold">{stats?.totalFilaments.toLocaleString() ?? "-"}</div>
          </div>
        </div>

        {/* Info Footer */}
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
          TDS discovery & parsing runs automatically after each sync (10/batch)
          {lastRefresh && (
            <span className="ml-auto">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
