import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Link2, RefreshCw, CheckCircle, XCircle, AlertTriangle, 
  ExternalLink, Package, Database, Wrench, Play, Search, ArrowRight, Loader2, Trash2
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
  redirect_url?: string | null;
  checked_at: string;
}

interface ValidationStats {
  total: number;
  valid: number;
  broken: number;
  redirect: number;
  timeout: number;
}

interface ScanCoverage {
  filament: { total: number; scanned: number };
  printer: { total: number; scanned: number };
  accessory: { total: number; scanned: number };
}

const AdminBrokenLinks = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [results, setResults] = useState<UrlValidationResult[]>([]);
  const [stats, setStats] = useState<ValidationStats>({ total: 0, valid: 0, broken: 0, redirect: 0, timeout: 0 });
  const [coverage, setCoverage] = useState<ScanCoverage>({
    filament: { total: 0, scanned: 0 },
    printer: { total: 0, scanned: 0 },
    accessory: { total: 0, scanned: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("broken");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fixingIds, setFixingIds] = useState<Set<string>>(new Set());
  const [bulkFixing, setBulkFixing] = useState(false);
  const [rescanningBroken, setRescanningBroken] = useState(false);

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
      fetchCoverage();
    }
  }, [isAdmin]);

  const fetchCoverage = async () => {
    // Get total counts
    const [filamentTotal, printerTotal, accessoryTotal] = await Promise.all([
      supabase.from("filaments").select("id", { count: "exact", head: true }).not("product_url", "is", null),
      supabase.from("printers").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("printer_accessories").select("id", { count: "exact", head: true }).not("product_url", "is", null)
    ]);

    // Get scanned counts per entity type
    const [filamentScanned, printerScanned, accessoryScanned] = await Promise.all([
      supabase.from("url_validation_results").select("id", { count: "exact", head: true }).eq("entity_type", "filament"),
      supabase.from("url_validation_results").select("id", { count: "exact", head: true }).eq("entity_type", "printer"),
      supabase.from("url_validation_results").select("id", { count: "exact", head: true }).eq("entity_type", "accessory")
    ]);

    setCoverage({
      filament: { total: filamentTotal.count || 0, scanned: filamentScanned.count || 0 },
      printer: { total: printerTotal.count || 0, scanned: printerScanned.count || 0 },
      accessory: { total: accessoryTotal.count || 0, scanned: accessoryScanned.count || 0 }
    });
  };

  const fetchResults = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("url_validation_results")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(500);

    if (!error && data) {
      setResults(data);
      
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
    setSelectedIds(new Set());
  };

  const clearAllResults = async () => {
    if (!confirm("Are you sure you want to clear all scan results? This will allow you to start fresh.")) {
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("url_validation_results")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (error) {
      toast.error("Failed to clear results");
      console.error(error);
    } else {
      toast.success("All results cleared - ready to scan fresh");
      setResults([]);
      setStats({ total: 0, valid: 0, broken: 0, redirect: 0, timeout: 0 });
      fetchCoverage();
    }
    setLoading(false);
  };

  const rescanBrokenUrls = async () => {
    // Get all URLs currently marked as "broken"
    const brokenResults = results.filter(r => r.status === 'broken');
    
    if (brokenResults.length === 0) {
      toast.info("No broken URLs to re-scan");
      return;
    }

    setRescanningBroken(true);
    setScanProgress(0);

    try {
      let processed = 0;

      for (const result of brokenResults) {
        try {
          const { data: testResult, error } = await supabase.functions.invoke('test-url', {
            body: { url: result.url }
          });

          let newStatus = 'broken';
          let statusCode = null;
          let redirectUrl = null;

          if (!error && testResult) {
            statusCode = testResult.statusCode;
            redirectUrl = testResult.redirectLocation || null;
            if (testResult.ok) {
              newStatus = testResult.isRedirect ? 'redirect' : 'valid';
            } else if (testResult.statusCode === 0) {
              newStatus = 'timeout';
            } else if (testResult.statusCode >= 300 && testResult.statusCode < 400) {
              // 3xx status codes are redirects, not broken
              newStatus = 'redirect';
            }
          }

          // Update the result in database
          await supabase
            .from("url_validation_results")
            .update({
              status: newStatus,
              status_code: statusCode,
              redirect_url: redirectUrl,
              checked_at: new Date().toISOString()
            })
            .eq('id', result.id);

          processed++;
          setScanProgress(Math.round((processed / brokenResults.length) * 100));
        } catch (err) {
          console.error("Error re-scanning URL:", result.url, err);
        }
      }

      toast.success(`Re-scanned ${processed} URLs`);
      await fetchResults();
      await fetchCoverage();
    } catch (error) {
      console.error("Error re-scanning broken URLs:", error);
      toast.error("Failed to re-scan broken URLs");
    } finally {
      setRescanningBroken(false);
      setScanProgress(0);
    }
  };

  const runScan = async (entityType: 'filament' | 'printer' | 'accessory') => {
    setScanning(true);
    setScanProgress(0);

    try {
      // First, get already scanned entity IDs to skip them
      const { data: alreadyScanned } = await supabase
        .from("url_validation_results")
        .select("entity_id, url_field")
        .eq("entity_type", entityType);
      
      const scannedKeys = new Set(
        alreadyScanned?.map(r => `${r.entity_id}:${r.url_field}`) || []
      );

      let urls: { entity_type: string; entity_id: string; url_field: string; url: string }[] = [];

      if (entityType === 'filament') {
        const { data } = await supabase
          .from("filaments")
          .select("id, product_url")
          .not("product_url", "is", null)
          .limit(200); // Fetch more, then filter
        
        urls = data?.filter(f => !scannedKeys.has(`${f.id}:product_url`))
          .slice(0, 50)
          .map(f => ({
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
          .limit(200);
        
        const allUrls: typeof urls = [];
        data?.forEach(p => {
          if (p.official_store_url && !scannedKeys.has(`${p.id}:official_store_url`)) {
            allUrls.push({
              entity_type: 'printer',
              entity_id: p.id,
              url_field: 'official_store_url',
              url: p.official_store_url
            });
          }
          if (p.official_product_url && !scannedKeys.has(`${p.id}:official_product_url`)) {
            allUrls.push({
              entity_type: 'printer',
              entity_id: p.id,
              url_field: 'official_product_url',
              url: p.official_product_url
            });
          }
        });
        urls = allUrls.slice(0, 50);
      } else {
        const { data } = await supabase
          .from("printer_accessories")
          .select("id, product_url")
          .not("product_url", "is", null)
          .limit(200);
        
        urls = data?.filter(a => !scannedKeys.has(`${a.id}:product_url`))
          .slice(0, 50)
          .map(a => ({
            entity_type: 'accessory',
            entity_id: a.id,
            url_field: 'product_url',
            url: a.product_url!
          })) || [];
      }

      if (urls.length === 0) {
        toast.info(`All ${entityType} URLs have been scanned`);
        setScanning(false);
        return;
      }

      for (let i = 0; i < urls.length; i++) {
        const urlData = urls[i];
        setScanProgress(Math.round(((i + 1) / urls.length) * 100));

        try {
          const { data: testResult, error } = await supabase.functions.invoke('test-url', {
            body: { url: urlData.url }
          });

          let status = 'broken';
          let statusCode = null;
          let redirectUrl = null;

          if (!error && testResult) {
            statusCode = testResult.statusCode;
            redirectUrl = testResult.redirectLocation || null;
            if (testResult.ok) {
              status = testResult.isRedirect ? 'redirect' : 'valid';
            } else if (testResult.statusCode === 0) {
              status = 'timeout';
            } else if (testResult.statusCode >= 300 && testResult.statusCode < 400) {
              // 3xx status codes are redirects, not broken
              status = 'redirect';
            }
          }

          await supabase
            .from("url_validation_results")
            .delete()
            .eq("entity_type", urlData.entity_type)
            .eq("entity_id", urlData.entity_id)
            .eq("url_field", urlData.url_field);

          await supabase.from("url_validation_results").insert({
            entity_type: urlData.entity_type,
            entity_id: urlData.entity_id,
            url_field: urlData.url_field,
            url: urlData.url,
            status_code: statusCode,
            status,
            redirect_url: redirectUrl
          });
        } catch (e) {
          console.error("Error testing URL:", urlData.url, e);
        }
      }

      toast.success(`Scanned ${urls.length} ${entityType} URLs`);
      fetchResults();
      fetchCoverage();
    } catch (error) {
      console.error("Error running scan:", error);
      toast.error("Failed to run scan");
    } finally {
      setScanning(false);
      setScanProgress(0);
    }
  };

  const updateToRedirectUrl = async (result: UrlValidationResult) => {
    if (!result.redirect_url) {
      toast.error("No redirect URL available");
      return;
    }

    setFixingIds(prev => new Set(prev).add(result.id));

    try {
      const tableName = result.entity_type === 'filament' ? 'filaments' 
        : result.entity_type === 'printer' ? 'printers' 
        : 'printer_accessories';

      const { error } = await supabase
        .from(tableName)
        .update({ [result.url_field]: result.redirect_url })
        .eq('id', result.entity_id);

      if (error) throw error;

      // Update the validation result to valid
      await supabase
        .from("url_validation_results")
        .update({ status: 'valid', url: result.redirect_url, status_code: 200 })
        .eq('id', result.id);

      toast.success("URL updated to redirect destination");
      fetchResults();
    } catch (error) {
      console.error("Error updating URL:", error);
      toast.error("Failed to update URL");
    } finally {
      setFixingIds(prev => {
        const next = new Set(prev);
        next.delete(result.id);
        return next;
      });
    }
  };

  const findReplacementUrl = async (result: UrlValidationResult) => {
    setFixingIds(prev => new Set(prev).add(result.id));

    try {
      // First, fetch the entity details to get product title and vendor
      let productTitle = '';
      let vendor = '';

      if (result.entity_type === 'filament') {
        const { data: filament } = await supabase
          .from('filaments')
          .select('product_title, vendor')
          .eq('id', result.entity_id)
          .maybeSingle();
        
        if (filament) {
          productTitle = filament.product_title;
          vendor = filament.vendor || '';
        }
      } else if (result.entity_type === 'printer') {
        const { data: printer } = await supabase
          .from('printers')
          .select('model_name, printer_brands(brand)')
          .eq('id', result.entity_id)
          .maybeSingle();
        
        if (printer) {
          productTitle = printer.model_name;
          vendor = (printer.printer_brands as any)?.brand || '';
        }
      } else if (result.entity_type === 'accessory') {
        const { data: accessory } = await supabase
          .from('printer_accessories')
          .select('name, brand')
          .eq('id', result.entity_id)
          .maybeSingle();
        
        if (accessory) {
          productTitle = accessory.name;
          vendor = accessory.brand || '';
        }
      }

      if (!productTitle) {
        toast.error("Could not find entity details");
        return;
      }

      // Invoke the fix-filament-url function with correct parameters
      const { data, error } = await supabase.functions.invoke('fix-filament-url', {
        body: { 
          filamentId: result.entity_id,
          productTitle,
          vendor,
          currentUrl: result.url
        }
      });

      if (error) throw error;

      if (data?.newUrl) {
        // Update validation result
        await supabase
          .from("url_validation_results")
          .update({ status: 'valid', url: data.newUrl, status_code: 200 })
          .eq('id', result.id);

        toast.success("Found and applied replacement URL");
        fetchResults();
      } else {
        toast.error(data?.error || "Could not find a replacement URL");
      }
    } catch (error) {
      console.error("Error finding replacement:", error);
      toast.error("Failed to find replacement URL");
    } finally {
      setFixingIds(prev => {
        const next = new Set(prev);
        next.delete(result.id);
        return next;
      });
    }
  };

  const fixSelected = async () => {
    const selectedResults = results.filter(r => selectedIds.has(r.id));
    if (selectedResults.length === 0) {
      toast.error("No items selected");
      return;
    }

    setBulkFixing(true);
    let fixed = 0;
    let failed = 0;

    for (const result of selectedResults) {
      try {
        if (result.status === 'redirect' && result.redirect_url) {
          // For redirects, update to the redirect URL
          const tableName = result.entity_type === 'filament' ? 'filaments' 
            : result.entity_type === 'printer' ? 'printers' 
            : 'printer_accessories';

          const { error } = await supabase
            .from(tableName)
            .update({ [result.url_field]: result.redirect_url })
            .eq('id', result.entity_id);

          if (!error) {
            await supabase
              .from("url_validation_results")
              .update({ status: 'valid', url: result.redirect_url, status_code: 200 })
              .eq('id', result.id);
            fixed++;
          } else {
            failed++;
          }
        } else if (result.status === 'broken' || result.status === 'timeout') {
          // For broken/timeout, try to find replacement - need to fetch entity details first
          let productTitle = '';
          let vendor = '';

          if (result.entity_type === 'filament') {
            const { data: filament } = await supabase
              .from('filaments')
              .select('product_title, vendor')
              .eq('id', result.entity_id)
              .maybeSingle();
            if (filament) {
              productTitle = filament.product_title;
              vendor = filament.vendor || '';
            }
          } else if (result.entity_type === 'printer') {
            const { data: printer } = await supabase
              .from('printers')
              .select('model_name, printer_brands(brand)')
              .eq('id', result.entity_id)
              .maybeSingle();
            if (printer) {
              productTitle = printer.model_name;
              vendor = (printer.printer_brands as any)?.brand || '';
            }
          } else if (result.entity_type === 'accessory') {
            const { data: accessory } = await supabase
              .from('printer_accessories')
              .select('name, brand')
              .eq('id', result.entity_id)
              .maybeSingle();
            if (accessory) {
              productTitle = accessory.name;
              vendor = accessory.brand || '';
            }
          }

          if (!productTitle) {
            failed++;
            continue;
          }

          const { data, error } = await supabase.functions.invoke('fix-filament-url', {
            body: { 
              filamentId: result.entity_id,
              productTitle,
              vendor,
              currentUrl: result.url
            }
          });

          if (!error && data?.newUrl) {
            await supabase
              .from("url_validation_results")
              .update({ status: 'valid', url: data.newUrl, status_code: 200 })
              .eq('id', result.id);
            fixed++;
          } else {
            failed++;
          }
        }
      } catch (e) {
        console.error("Error fixing item:", result.id, e);
        failed++;
      }
    }

    setBulkFixing(false);
    setSelectedIds(new Set());
    toast.success(`Fixed ${fixed} URLs${failed > 0 ? `, ${failed} failed` : ''}`);
    fetchResults();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const currentFiltered = filteredResults;
    const allSelected = currentFiltered.every(r => selectedIds.has(r.id));
    
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentFiltered.map(r => r.id)));
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

  const selectedCount = Array.from(selectedIds).filter(id => 
    filteredResults.some(r => r.id === id)
  ).length;

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
          <div className="flex items-center gap-2">
            <Button onClick={clearAllResults} variant="outline" size="sm" disabled={loading || stats.total === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            <Button onClick={fetchResults} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filaments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Filaments</span>
                  <span className={coverage.filament.scanned >= coverage.filament.total ? "text-green-500" : "text-foreground"}>
                    {coverage.filament.scanned} / {coverage.filament.total}
                  </span>
                </div>
                <Progress 
                  value={coverage.filament.total > 0 ? (coverage.filament.scanned / coverage.filament.total) * 100 : 0} 
                  className="h-2"
                />
                <Button 
                  onClick={() => runScan('filament')} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  disabled={coverage.filament.scanned >= coverage.filament.total}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {coverage.filament.scanned >= coverage.filament.total 
                    ? "All Scanned" 
                    : `Scan Next 50 (${coverage.filament.total - coverage.filament.scanned} remaining)`}
                </Button>
              </div>

              {/* Printers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Printers</span>
                  <span className={coverage.printer.scanned >= coverage.printer.total ? "text-green-500" : "text-foreground"}>
                    {coverage.printer.scanned} / {coverage.printer.total}
                  </span>
                </div>
                <Progress 
                  value={coverage.printer.total > 0 ? (coverage.printer.scanned / coverage.printer.total) * 100 : 0} 
                  className="h-2"
                />
                <Button 
                  onClick={() => runScan('printer')} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  disabled={coverage.printer.scanned >= coverage.printer.total}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {coverage.printer.scanned >= coverage.printer.total 
                    ? "All Scanned" 
                    : `Scan Next 50 (${coverage.printer.total - coverage.printer.scanned} remaining)`}
                </Button>
              </div>

              {/* Accessories */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Accessories</span>
                  <span className={coverage.accessory.scanned >= coverage.accessory.total ? "text-green-500" : "text-foreground"}>
                    {coverage.accessory.scanned} / {coverage.accessory.total}
                  </span>
                </div>
                <Progress 
                  value={coverage.accessory.total > 0 ? (coverage.accessory.scanned / coverage.accessory.total) * 100 : 0} 
                  className="h-2"
                />
                <Button 
                  onClick={() => runScan('accessory')} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  disabled={coverage.accessory.scanned >= coverage.accessory.total}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {coverage.accessory.scanned >= coverage.accessory.total 
                    ? "All Scanned" 
                    : `Scan Next 50 (${coverage.accessory.total - coverage.accessory.scanned} remaining)`}
                </Button>
              </div>
            </div>
          )}
          
          {/* Re-scan Broken URLs */}
          {stats.broken > 0 && !scanning && !rescanningBroken && (
            <div className="mt-4 pt-4 border-t border-border">
              <Button 
                onClick={rescanBrokenUrls}
                variant="secondary"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-scan {stats.broken} Broken URLs
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Re-check URLs marked as broken to recategorize any that are actually redirects
              </p>
            </div>
          )}
          
          {rescanningBroken && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <Progress value={scanProgress} />
              <p className="text-sm text-muted-foreground">Re-scanning broken URLs... {scanProgress}%</p>
            </div>
          )}
        </Card>

        {/* Results Table */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedIds(new Set()); }}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="broken">Broken ({stats.broken})</TabsTrigger>
              <TabsTrigger value="redirect">Redirects ({stats.redirect})</TabsTrigger>
              <TabsTrigger value="timeout">Timeouts ({stats.timeout})</TabsTrigger>
              <TabsTrigger value="valid">Valid ({stats.valid})</TabsTrigger>
            </TabsList>
          </div>

          {/* Bulk Actions Bar */}
          {(activeTab === 'broken' || activeTab === 'redirect' || activeTab === 'timeout') && filteredResults.length > 0 && (
            <Card className="p-3 mb-4 bg-muted/30 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={filteredResults.length > 0 && filteredResults.every(r => selectedIds.has(r.id))}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
                  </span>
                </div>
                <Button 
                  onClick={fixSelected} 
                  disabled={selectedCount === 0 || bulkFixing}
                  size="sm"
                  className="gap-2"
                >
                  {bulkFixing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wrench className="w-4 h-4" />
                  )}
                  Fix Selected ({selectedCount})
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {activeTab === 'redirect' && "Redirects will be updated to their destination URL"}
                {activeTab === 'broken' && "Broken links will attempt to find replacement URLs"}
                {activeTab === 'timeout' && "Timed out links will attempt to find replacement URLs"}
              </p>
            </Card>
          )}

          <TabsContent value={activeTab} className="mt-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No results found. Run a scan to check URLs.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredResults.map((result) => (
                  <Card key={result.id} className={`p-3 bg-card border-border ${selectedIds.has(result.id) ? 'border-primary' : ''}`}>
                    <div className="flex items-center gap-3">
                      {(result.status === 'broken' || result.status === 'redirect' || result.status === 'timeout') && (
                        <Checkbox 
                          checked={selectedIds.has(result.id)}
                          onCheckedChange={() => toggleSelect(result.id)}
                        />
                      )}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getStatusIcon(result.status)}
                        <Badge variant="outline" className="text-xs shrink-0">
                          {getEntityIcon(result.entity_type)}
                          <span className="ml-1 capitalize">{result.entity_type}</span>
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-muted-foreground truncate block">
                            {result.url}
                          </span>
                          {result.redirect_url && (
                            <span className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                              <ArrowRight className="w-3 h-3" />
                              {result.redirect_url}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {result.status_code && (
                          <Badge variant={result.status_code === 200 ? "default" : "destructive"}>
                            {result.status_code}
                          </Badge>
                        )}
                        
                        {/* Action buttons based on status */}
                        {result.status === 'redirect' && result.redirect_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateToRedirectUrl(result)}
                            disabled={fixingIds.has(result.id)}
                            className="gap-1"
                          >
                            {fixingIds.has(result.id) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3 h-3" />
                            )}
                            Update
                          </Button>
                        )}
                        
                        {(result.status === 'broken' || result.status === 'timeout') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => findReplacementUrl(result)}
                            disabled={fixingIds.has(result.id)}
                            className="gap-1"
                          >
                            {fixingIds.has(result.id) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Search className="w-3 h-3" />
                            )}
                            Find Link
                          </Button>
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
