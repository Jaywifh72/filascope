import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Link2, RefreshCw, CheckCircle, XCircle, AlertTriangle, 
  ExternalLink, Package, Database, Wrench, Play
} from "lucide-react";
import { toast } from "sonner";

interface UrlValidationResult {
  id: string;
  entity_type: string;
  entity_id: string;
  url_field: string;
  url: string;
  status_code: number | null;
  status: string;
  checked_at: string;
}

interface ValidationStats {
  total: number;
  valid: number;
  broken: number;
  redirect: number;
  timeout: number;
}

const AdminBrokenLinks = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [results, setResults] = useState<UrlValidationResult[]>([]);
  const [stats, setStats] = useState<ValidationStats>({ total: 0, valid: 0, broken: 0, redirect: 0, timeout: 0 });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("broken");

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      navigate("/");
    } else if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [isAdmin, authLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchResults();
    }
  }, [isAdmin]);

  const fetchResults = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("url_validation_results")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(500);

    if (!error && data) {
      setResults(data);
      
      // Calculate stats
      const statsCalc = data.reduce((acc, r) => {
        acc.total++;
        if (r.status === 'valid') acc.valid++;
        else if (r.status === 'broken') acc.broken++;
        else if (r.status === 'redirect') acc.redirect++;
        else if (r.status === 'timeout') acc.timeout++;
        return acc;
      }, { total: 0, valid: 0, broken: 0, redirect: 0, timeout: 0 });
      
      setStats(statsCalc);
    }
    setLoading(false);
  };

  const runScan = async (entityType: 'filament' | 'printer' | 'accessory') => {
    setScanning(true);
    setScanProgress(0);

    try {
      let urls: { entity_type: string; entity_id: string; url_field: string; url: string }[] = [];

      if (entityType === 'filament') {
        const { data } = await supabase
          .from("filaments")
          .select("id, product_url")
          .not("product_url", "is", null)
          .limit(50);
        
        urls = data?.map(f => ({
          entity_type: 'filament',
          entity_id: f.id,
          url_field: 'product_url',
          url: f.product_url!
        })) || [];
      } else if (entityType === 'printer') {
        const { data } = await supabase
          .from("printers")
          .select("id, official_store_url, official_product_url")
          .eq("status", "active")
          .limit(50);
        
        data?.forEach(p => {
          if (p.official_store_url) {
            urls.push({
              entity_type: 'printer',
              entity_id: p.id,
              url_field: 'official_store_url',
              url: p.official_store_url
            });
          }
          if (p.official_product_url) {
            urls.push({
              entity_type: 'printer',
              entity_id: p.id,
              url_field: 'official_product_url',
              url: p.official_product_url
            });
          }
        });
      } else {
        const { data } = await supabase
          .from("printer_accessories")
          .select("id, product_url")
          .not("product_url", "is", null)
          .limit(50);
        
        urls = data?.map(a => ({
          entity_type: 'accessory',
          entity_id: a.id,
          url_field: 'product_url',
          url: a.product_url!
        })) || [];
      }

      // Test URLs one by one
      for (let i = 0; i < urls.length; i++) {
        const urlData = urls[i];
        setScanProgress(Math.round(((i + 1) / urls.length) * 100));

        try {
          const { data: testResult, error } = await supabase.functions.invoke('test-url', {
            body: { url: urlData.url }
          });

          let status = 'broken';
          let statusCode = null;

          if (!error && testResult) {
            statusCode = testResult.statusCode;
            if (testResult.ok) {
              status = testResult.isRedirect ? 'redirect' : 'valid';
            } else if (testResult.statusCode === 0) {
              status = 'timeout';
            }
          }

          // Delete old result for this URL
          await supabase
            .from("url_validation_results")
            .delete()
            .eq("entity_type", urlData.entity_type)
            .eq("entity_id", urlData.entity_id)
            .eq("url_field", urlData.url_field);

          // Insert new result
          await supabase.from("url_validation_results").insert({
            entity_type: urlData.entity_type,
            entity_id: urlData.entity_id,
            url_field: urlData.url_field,
            url: urlData.url,
            status_code: statusCode,
            status
          });
        } catch (e) {
          console.error("Error testing URL:", urlData.url, e);
        }
      }

      toast.success(`Scanned ${urls.length} ${entityType} URLs`);
      fetchResults();
    } catch (error) {
      console.error("Error running scan:", error);
      toast.error("Failed to run scan");
    } finally {
      setScanning(false);
      setScanProgress(0);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'broken': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'redirect': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'filament': return <Package className="w-4 h-4" />;
      case 'printer': return <Database className="w-4 h-4" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  const filteredResults = results.filter(r => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link2 className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-foreground">Broken Link Monitor</h1>
          </div>
          <Button onClick={fetchResults} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 bg-card border-border">
            <p className="text-sm text-muted-foreground">Total Checked</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-card border-border border-l-4 border-l-green-500">
            <p className="text-sm text-muted-foreground">Valid</p>
            <p className="text-2xl font-bold text-green-500">{stats.valid}</p>
          </Card>
          <Card className="p-4 bg-card border-border border-l-4 border-l-red-500">
            <p className="text-sm text-muted-foreground">Broken</p>
            <p className="text-2xl font-bold text-red-500">{stats.broken}</p>
          </Card>
          <Card className="p-4 bg-card border-border border-l-4 border-l-yellow-500">
            <p className="text-sm text-muted-foreground">Redirects</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.redirect}</p>
          </Card>
          <Card className="p-4 bg-card border-border border-l-4 border-l-muted">
            <p className="text-sm text-muted-foreground">Timeouts</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.timeout}</p>
          </Card>
        </div>

        {/* Scan Actions */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-3">Run URL Scan</h3>
          {scanning ? (
            <div className="space-y-2">
              <Progress value={scanProgress} />
              <p className="text-sm text-muted-foreground">Scanning... {scanProgress}%</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => runScan('filament')} variant="outline" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Scan Filaments (50)
              </Button>
              <Button onClick={() => runScan('printer')} variant="outline" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Scan Printers (50)
              </Button>
              <Button onClick={() => runScan('accessory')} variant="outline" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Scan Accessories (50)
              </Button>
            </div>
          )}
        </Card>

        {/* Results Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="broken">Broken ({stats.broken})</TabsTrigger>
            <TabsTrigger value="redirect">Redirects ({stats.redirect})</TabsTrigger>
            <TabsTrigger value="timeout">Timeouts ({stats.timeout})</TabsTrigger>
            <TabsTrigger value="valid">Valid ({stats.valid})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No results found. Run a scan to check URLs.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredResults.map((result) => (
                  <Card key={result.id} className="p-3 bg-card border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getStatusIcon(result.status)}
                        <Badge variant="outline" className="text-xs">
                          {getEntityIcon(result.entity_type)}
                          <span className="ml-1 capitalize">{result.entity_type}</span>
                        </Badge>
                        <span className="text-sm text-muted-foreground truncate flex-1">
                          {result.url}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.status_code && (
                          <Badge variant={result.status_code === 200 ? "default" : "destructive"}>
                            {result.status_code}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(result.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminBrokenLinks;
