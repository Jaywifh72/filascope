import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, CheckCircle, TrendingDown, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HealthStats {
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  successRate: number;
}

interface FailingBrand {
  id: string;
  brand_name: string;
  brand_slug: string;
  extraction_success_rate: number | null;
  extraction_working: boolean | null;
  last_extraction_test_at: string | null;
}

interface ExtractionHealthOverviewProps {
  onEditBrand: (brand: FailingBrand) => void;
}

export function ExtractionHealthOverview({ onEditBrand }: ExtractionHealthOverviewProps) {
  // Fetch 24-hour extraction stats
  const { data: healthStats, isLoading: statsLoading } = useQuery({
    queryKey: ['extraction-health-stats'],
    queryFn: async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('price_extraction_logs')
        .select('success')
        .gte('created_at', oneDayAgo);
      
      if (error) throw error;
      
      const totalAttempts = data?.length || 0;
      const successCount = data?.filter(d => d.success).length || 0;
      const failureCount = totalAttempts - successCount;
      const successRate = totalAttempts > 0 ? (successCount / totalAttempts) * 100 : 0;
      
      return { totalAttempts, successCount, failureCount, successRate } as HealthStats;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch brands with low success rates
  const { data: failingBrands, isLoading: brandsLoading } = useQuery({
    queryKey: ['failing-extraction-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automated_brands')
        .select('id, brand_name, brand_slug, extraction_success_rate, extraction_working, last_extraction_test_at')
        .eq('is_visible', true)
        .or('extraction_working.eq.false,extraction_success_rate.lt.80')
        .order('extraction_success_rate', { ascending: true, nullsFirst: false })
        .limit(5);
      
      if (error) throw error;
      return data as FailingBrand[];
    },
  });

  if (statsLoading || brandsLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Overall Health Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Last 24 Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              {healthStats?.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {healthStats?.successCount || 0} successful / {healthStats?.totalAttempts || 0} total attempts
            </p>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                {healthStats?.successCount || 0}
              </Badge>
              <Badge variant="outline" className="text-destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {healthStats?.failureCount || 0}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Failing Brands Card */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Brands Needing Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          {failingBrands && failingBrands.length > 0 ? (
            <div className="space-y-2">
              {failingBrands.map((brand) => (
                <div 
                  key={brand.id} 
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {brand.extraction_working === false ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="font-medium">{brand.brand_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {brand.extraction_success_rate !== null 
                        ? `${brand.extraction_success_rate.toFixed(1)}%`
                        : 'Untested'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {brand.last_extraction_test_at 
                        ? formatDistanceToNow(new Date(brand.last_extraction_test_at), { addSuffix: true })
                        : 'Never tested'
                      }
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEditBrand(brand as unknown as FailingBrand)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              All brands are performing well!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links Card */}
      <Card className="md:col-span-3">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/broken-links">
                <FileText className="h-4 w-4 mr-2" />
                View Broken Links
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/price-verification">
                <Activity className="h-4 w-4 mr-2" />
                Price Verification
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
