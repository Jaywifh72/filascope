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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Link2, RefreshCw, CheckCircle, XCircle, AlertTriangle, 
  ExternalLink, Package, Database, Wrench, Play, Search, ArrowRight, Loader2, Trash2, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

// HTTP status code explanations and fix strategies
const HTTP_STATUS_INFO: Record<number, { label: string; description: string; fixStrategy: string }> = {
  200: { label: "OK", description: "The request succeeded.", fixStrategy: "No action needed" },
  301: { label: "Moved Permanently", description: "The URL has been permanently moved to a new location.", fixStrategy: "Update to the new redirect URL" },
  302: { label: "Found (Redirect)", description: "The URL temporarily redirects to another location.", fixStrategy: "Update to the redirect URL or keep monitoring" },
  303: { label: "See Other", description: "The server redirects to a different resource.", fixStrategy: "Update to the redirect URL" },
  307: { label: "Temporary Redirect", description: "The URL temporarily redirects, preserving the request method.", fixStrategy: "Update to the redirect URL or keep monitoring" },
  308: { label: "Permanent Redirect", description: "The URL has been permanently moved, preserving the request method.", fixStrategy: "Update to the new redirect URL" },
  400: { label: "Bad Request", description: "The server cannot process the request due to malformed syntax.", fixStrategy: "Check URL format and special characters" },
  401: { label: "Unauthorized", description: "Authentication is required to access this resource.", fixStrategy: "URL may require login - search for public alternative" },
  403: { label: "Forbidden", description: "The server refuses to authorize access. Often due to geo-blocking, bot detection, or access restrictions.", fixStrategy: "Product may be discontinued or region-locked. Search for alternative URL" },
  404: { label: "Not Found", description: "The page no longer exists at this URL.", fixStrategy: "Product likely discontinued or URL changed. Search for replacement" },
  410: { label: "Gone", description: "The resource has been permanently removed.", fixStrategy: "Product discontinued. Remove or find alternative" },
  429: { label: "Too Many Requests", description: "Rate limited by the server.", fixStrategy: "Temporary issue - re-scan later" },
  500: { label: "Internal Server Error", description: "The server encountered an unexpected error.", fixStrategy: "Temporary server issue - re-scan later" },
  502: { label: "Bad Gateway", description: "The server received an invalid response from upstream.", fixStrategy: "Temporary server issue - re-scan later" },
  503: { label: "Service Unavailable", description: "The server is temporarily unavailable (maintenance or overload).", fixStrategy: "Temporary issue - re-scan later. If persistent, search for alternative" },
  504: { label: "Gateway Timeout", description: "The server didn't receive a timely response from upstream.", fixStrategy: "Temporary timeout - re-scan later" },
  0: { label: "Timeout/No Response", description: "The request timed out or the server didn't respond.", fixStrategy: "Server may be down or blocking requests. Try again or search for alternative" },
};

const getStatusCodeInfo = (code: number | null): { label: string; description: string; fixStrategy: string } => {
  if (code === null) return { label: "Unknown", description: "No status code received", fixStrategy: "Re-scan to check status" };
  return HTTP_STATUS_INFO[code] || { label: `HTTP ${code}`, description: "Unrecognized status code", fixStrategy: "Investigate manually" };
};

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
  manually_verified?: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  entity_name?: string; // Resolved from entity tables
}

interface ValidationStats {
  total: number;
  valid: number;
  broken: number;
  amazonBroken: number;
  redirect: number;
  timeout: number;
  verified: number;
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
  const [stats, setStats] = useState<ValidationStats>({ total: 0, valid: 0, broken: 0, amazonBroken: 0, redirect: 0, timeout: 0, verified: 0 });
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
  const [fullScanning, setFullScanning] = useState(false);
  const [fullScanStatus, setFullScanStatus] = useState<string>("");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

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
    // Get total counts - for printers, count URLs not entities since each printer can have 2 URL fields
    const [filamentTotal, accessoryTotal] = await Promise.all([
      supabase.from("filaments").select("id", { count: "exact", head: true }).not("product_url", "is", null),
      supabase.from("printer_accessories").select("id", { count: "exact", head: true }).not("product_url", "is", null)
    ]);
    
    // For printers, count actual URLs (official_store_url + official_product_url)
    const { data: printerUrls } = await supabase
      .from("printers")
      .select("official_store_url, official_product_url")
      .eq("status", "active");
    
    let printerUrlCount = 0;
    printerUrls?.forEach(p => {
      if (p.official_store_url) printerUrlCount++;
      if (p.official_product_url) printerUrlCount++;
    });

    // Get scanned counts per entity type
    const [filamentScanned, printerScanned, accessoryScanned] = await Promise.all([
      supabase.from("url_validation_results").select("id", { count: "exact", head: true }).eq("entity_type", "filament"),
      supabase.from("url_validation_results").select("id", { count: "exact", head: true }).eq("entity_type", "printer"),
      supabase.from("url_validation_results").select("id", { count: "exact", head: true }).eq("entity_type", "accessory")
    ]);

    setCoverage({
      filament: { total: filamentTotal.count || 0, scanned: filamentScanned.count || 0 },
      printer: { total: printerUrlCount, scanned: printerScanned.count || 0 },
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
      // Fetch entity names for each result
      const resultsWithNames = await resolveEntityNames(data);
      setResults(resultsWithNames);
      
      const isAmazonUrl = (url: string) => url?.toLowerCase().includes('amazon.');
      
      const statsCalc = data.reduce((acc, r) => {
        acc.total++;
        if (r.manually_verified) acc.verified++;
        // Don't count verified URLs in broken/timeout stats
        if (r.status === 'valid') acc.valid++;
        else if (r.status === 'broken' && !r.manually_verified) {
          if (isAmazonUrl(r.url)) acc.amazonBroken++;
          else acc.broken++;
        }
        else if (r.status === 'redirect') acc.redirect++;
        else if (r.status === 'timeout' && !r.manually_verified) acc.timeout++;
        return acc;
      }, { total: 0, valid: 0, broken: 0, amazonBroken: 0, redirect: 0, timeout: 0, verified: 0 });
      
      setStats(statsCalc);
    }
    setLoading(false);
    setSelectedIds(new Set());
  };

  const resolveEntityNames = async (results: UrlValidationResult[]): Promise<UrlValidationResult[]> => {
    // Group entity IDs by type
    const filamentIds = results.filter(r => r.entity_type === 'filament').map(r => r.entity_id);
    const printerIds = results.filter(r => r.entity_type === 'printer').map(r => r.entity_id);
    const accessoryIds = results.filter(r => r.entity_type === 'accessory').map(r => r.entity_id);

    // Fetch names in parallel (including vendor/brand info)
    const [filaments, printers, accessories] = await Promise.all([
      filamentIds.length > 0 
        ? supabase.from("filaments").select("id, product_title, vendor").in("id", filamentIds)
        : { data: [] },
      printerIds.length > 0
        ? supabase.from("printers").select("id, model_name, printer_brands(brand)").in("id", printerIds)
        : { data: [] },
      accessoryIds.length > 0
        ? supabase.from("printer_accessories").select("id, name, brand").in("id", accessoryIds)
        : { data: [] }
    ]);

    // Create lookup maps with brand + name
    const nameMap = new Map<string, string>();
    filaments.data?.forEach(f => {
      const name = f.vendor ? `${f.vendor} - ${f.product_title}` : f.product_title;
      nameMap.set(f.id, name);
    });
    printers.data?.forEach(p => {
      const brand = (p.printer_brands as any)?.brand;
      const name = brand ? `${brand} - ${p.model_name}` : p.model_name;
      nameMap.set(p.id, name);
    });
    accessories.data?.forEach(a => {
      const name = a.brand ? `${a.brand} - ${a.name}` : a.name;
      nameMap.set(a.id, name);
    });

    // Attach names to results
    return results.map(r => ({
      ...r,
      entity_name: nameMap.get(r.entity_id) || undefined
    }));
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
      setStats({ total: 0, valid: 0, broken: 0, amazonBroken: 0, redirect: 0, timeout: 0, verified: 0 });
      fetchCoverage();
    }
    setLoading(false);
  };

  const rescanBrokenUrls = async () => {
    // Get all URLs currently marked as "broken" (excluding verified ones)
    const brokenResults = results.filter(r => r.status === 'broken' && !r.manually_verified);
    
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
      
      const scannedEntityIds = new Set(
        alreadyScanned?.map(r => r.entity_id) || []
      );
      const scannedKeys = new Set(
        alreadyScanned?.map(r => `${r.entity_id}:${r.url_field}`) || []
      );

      let urls: { entity_type: string; entity_id: string; url_field: string; url: string }[] = [];

      if (entityType === 'filament') {
        // Build query - exclude already scanned IDs if we have them
        let query = supabase
          .from("filaments")
          .select("id, product_url")
          .not("product_url", "is", null);
        
        // Use NOT IN filter if we have scanned IDs (up to 1000 to avoid query limits)
        const scannedArray = Array.from(scannedEntityIds).slice(0, 1000);
        if (scannedArray.length > 0 && scannedArray.length < 1000) {
          query = query.not("id", "in", `(${scannedArray.join(',')})`);
        }
        
        const { data } = await query.limit(50);
        
        urls = data?.filter(f => !scannedKeys.has(`${f.id}:product_url`))
          .map(f => ({
            entity_type: 'filament',
            entity_id: f.id,
            url_field: 'product_url',
            url: f.product_url!
          })) || [];
      } else if (entityType === 'printer') {
        let query = supabase
          .from("printers")
          .select("id, official_store_url, official_product_url")
          .eq("status", "active");
        
        const scannedArray = Array.from(scannedEntityIds).slice(0, 1000);
        if (scannedArray.length > 0 && scannedArray.length < 1000) {
          query = query.not("id", "in", `(${scannedArray.join(',')})`);
        }
        
        const { data } = await query.limit(100);
        
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
        let query = supabase
          .from("printer_accessories")
          .select("id, product_url")
          .not("product_url", "is", null);
        
        const scannedArray = Array.from(scannedEntityIds).slice(0, 1000);
        if (scannedArray.length > 0 && scannedArray.length < 1000) {
          query = query.not("id", "in", `(${scannedArray.join(',')})`);
        }
        
        const { data } = await query.limit(50);
        
        urls = data?.filter(a => !scannedKeys.has(`${a.id}:product_url`))
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

  const runFullScan = async () => {
    setFullScanning(true);
    setScanProgress(0);
    
    const entityTypes: ('filament' | 'printer' | 'accessory')[] = ['filament', 'printer', 'accessory'];
    let totalProcessed = 0;
    let totalToProcess = 0;
    
    // Calculate total URLs to scan
    for (const entityType of entityTypes) {
      const remaining = entityType === 'filament' 
        ? coverage.filament.total - coverage.filament.scanned
        : entityType === 'printer'
        ? coverage.printer.total - coverage.printer.scanned
        : coverage.accessory.total - coverage.accessory.scanned;
      totalToProcess += remaining;
    }
    
    if (totalToProcess === 0) {
      toast.info("All URLs have been scanned");
      setFullScanning(false);
      return;
    }
    
    toast.info(`Starting full scan of ${totalToProcess} URLs across all entities...`);
    
    // Use a ref-like variable to track cancellation since state updates are async
    let isCancelled = false;
    
    try {
      for (const entityType of entityTypes) {
        let hasMore = true;
        
        while (hasMore && !isCancelled) {
          setFullScanStatus(`Scanning ${entityType}s...`);
          
          // Get already scanned entity IDs
          const { data: alreadyScanned } = await supabase
            .from("url_validation_results")
            .select("entity_id, url_field")
            .eq("entity_type", entityType);
          
          const scannedKeys = new Set(
            alreadyScanned?.map(r => `${r.entity_id}:${r.url_field}`) || []
          );

          let urls: { entity_type: string; entity_id: string; url_field: string; url: string }[] = [];

          if (entityType === 'filament') {
            // Get entity IDs that have been scanned to exclude them from the query
            const scannedEntityIds = new Set(
              alreadyScanned?.filter(r => r.url_field === 'product_url').map(r => r.entity_id) || []
            );
            
            let query = supabase
              .from("filaments")
              .select("id, product_url")
              .not("product_url", "is", null);
            
            const scannedArray = Array.from(scannedEntityIds).slice(0, 1000);
            if (scannedArray.length > 0 && scannedArray.length < 1000) {
              query = query.not("id", "in", `(${scannedArray.join(',')})`);
            }
            
            const { data } = await query.limit(100);
            
            urls = data?.filter(f => !scannedKeys.has(`${f.id}:product_url`))
              .map(f => ({
                entity_type: 'filament',
                entity_id: f.id,
                url_field: 'product_url',
                url: f.product_url!
              })) || [];
          } else if (entityType === 'printer') {
            // For printers, we need to be careful - a printer can have 2 URLs
            // Only exclude printers where BOTH URLs have been scanned
            const scannedBothUrls = new Set<string>();
            const scannedOneUrl = new Map<string, string>(); // entity_id -> url_field that was scanned
            
            alreadyScanned?.forEach(r => {
              if (scannedOneUrl.has(r.entity_id)) {
                // Already saw one URL for this printer, now seeing another - both are scanned
                scannedBothUrls.add(r.entity_id);
              } else {
                scannedOneUrl.set(r.entity_id, r.url_field);
              }
            });
            
            let query = supabase
              .from("printers")
              .select("id, official_store_url, official_product_url")
              .eq("status", "active");
            
            const scannedArray = Array.from(scannedBothUrls).slice(0, 1000);
            if (scannedArray.length > 0 && scannedArray.length < 1000) {
              query = query.not("id", "in", `(${scannedArray.join(',')})`);
            }
            
            const { data } = await query.limit(100);
            
            const printerUrls: typeof urls = [];
            data?.forEach(p => {
              if (p.official_store_url && !scannedKeys.has(`${p.id}:official_store_url`)) {
                printerUrls.push({
                  entity_type: 'printer',
                  entity_id: p.id,
                  url_field: 'official_store_url',
                  url: p.official_store_url
                });
              }
              if (p.official_product_url && !scannedKeys.has(`${p.id}:official_product_url`)) {
                printerUrls.push({
                  entity_type: 'printer',
                  entity_id: p.id,
                  url_field: 'official_product_url',
                  url: p.official_product_url
                });
              }
            });
            urls = printerUrls;
          } else {
            const scannedEntityIds = new Set(
              alreadyScanned?.filter(r => r.url_field === 'product_url').map(r => r.entity_id) || []
            );
            
            let query = supabase
              .from("printer_accessories")
              .select("id, product_url")
              .not("product_url", "is", null);
            
            const scannedArray = Array.from(scannedEntityIds).slice(0, 1000);
            if (scannedArray.length > 0 && scannedArray.length < 1000) {
              query = query.not("id", "in", `(${scannedArray.join(',')})`);
            }
            
            const { data } = await query.limit(100);
            
            urls = data?.filter(a => !scannedKeys.has(`${a.id}:product_url`))
              .map(a => ({
                entity_type: 'accessory',
                entity_id: a.id,
                url_field: 'product_url',
                url: a.product_url!
              })) || [];
          }

          if (urls.length === 0) {
            hasMore = false;
            continue;
          }

          // Process batch
          for (const urlData of urls) {
            let statusCode = null;
            let status = 'broken';
            let redirectUrl = null;

            try {
              const { data: testResult, error } = await supabase.functions.invoke('test-url', {
                body: { url: urlData.url }
              });

              if (!error && testResult) {
                statusCode = testResult.statusCode;
                redirectUrl = testResult.redirectLocation || null;
                if (testResult.ok) {
                  status = testResult.isRedirect ? 'redirect' : 'valid';
                } else if (testResult.statusCode === 0) {
                  status = 'timeout';
                } else if (testResult.statusCode >= 300 && testResult.statusCode < 400) {
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
              
              totalProcessed++;
              setScanProgress(Math.round((totalProcessed / totalToProcess) * 100));
            } catch (e) {
              console.error("Error testing URL:", urlData.url, e);
            }
          }
          
          // Refresh results periodically
          if (totalProcessed % 50 === 0) {
            await fetchResults();
            await fetchCoverage();
          }
        }
      }

      toast.success(`Full scan complete! Scanned ${totalProcessed} URLs`);
      await fetchResults();
      await fetchCoverage();
    } catch (error) {
      console.error("Error running full scan:", error);
      toast.error("Failed to complete full scan");
    } finally {
      setFullScanning(false);
      setFullScanStatus("");
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
          entityId: result.entity_id,
          entityType: result.entity_type,
          urlField: result.url_field,
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
              entityId: result.entity_id,
              entityType: result.entity_type,
              urlField: result.url_field,
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

  const markAsVerified = async (result: UrlValidationResult) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("url_validation_results")
        .update({ 
          manually_verified: true, 
          verified_at: new Date().toISOString(),
          verified_by: user.id
        })
        .eq('id', result.id);

      if (error) throw error;
      
      toast.success("URL marked as verified");
      fetchResults();
    } catch (error) {
      console.error("Error marking as verified:", error);
      toast.error("Failed to mark as verified");
    }
  };

  const deleteEntity = async (result: UrlValidationResult) => {
    if (result.entity_type !== 'filament') {
      toast.error("Only filaments can be deleted from this view");
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to permanently delete this filament?\n\n${result.entity_name || "Unknown filament"}\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    setDeletingIds(prev => new Set(prev).add(result.id));

    try {
      // Delete the filament
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .eq('id', result.entity_id);

      if (deleteError) throw deleteError;

      // Delete the URL validation result
      await supabase
        .from('url_validation_results')
        .delete()
        .eq('id', result.id);

      toast.success("Filament deleted successfully");
      fetchResults();
      fetchCoverage();
    } catch (error) {
      console.error("Error deleting filament:", error);
      toast.error("Failed to delete filament");
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(result.id);
        return next;
      });
    }
  };

  const deleteSelectedFilaments = async () => {
    const selectedFilaments = results.filter(r => selectedIds.has(r.id) && r.entity_type === 'filament');
    if (selectedFilaments.length === 0) {
      toast.error("No filaments selected");
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to permanently delete ${selectedFilaments.length} filament(s)?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    setBulkFixing(true);
    let deleted = 0;
    let failed = 0;

    for (const result of selectedFilaments) {
      try {
        const { error } = await supabase
          .from('filaments')
          .delete()
          .eq('id', result.entity_id);

        if (!error) {
          await supabase
            .from('url_validation_results')
            .delete()
            .eq('id', result.id);
          deleted++;
        } else {
          failed++;
        }
      } catch (e) {
        console.error("Error deleting filament:", result.entity_id, e);
        failed++;
      }
    }

    setBulkFixing(false);
    setSelectedIds(new Set());
    toast.success(`Deleted ${deleted} filament(s)${failed > 0 ? `, ${failed} failed` : ''}`);
    fetchResults();
    fetchCoverage();
  };

  const unmarkAsVerified = async (result: UrlValidationResult) => {
    try {
      const { error } = await supabase
        .from("url_validation_results")
        .update({ 
          manually_verified: false, 
          verified_at: null,
          verified_by: null
        })
        .eq('id', result.id);

      if (error) throw error;
      
      toast.success("Verification removed");
      fetchResults();
    } catch (error) {
      console.error("Error removing verification:", error);
      toast.error("Failed to remove verification");
    }
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

  const isAmazonUrl = (url: string) => url?.toLowerCase().includes('amazon.');
  
  const filteredResults = results.filter(r => {
    if (activeTab === 'all') return true;
    if (activeTab === 'verified') return r.manually_verified;
    // Exclude verified URLs from broken/timeout tabs
    if (activeTab === 'broken') return r.status === 'broken' && !r.manually_verified && !isAmazonUrl(r.url);
    if (activeTab === 'amazon') return r.status === 'broken' && !r.manually_verified && isAmazonUrl(r.url);
    if (activeTab === 'timeout') return r.status === 'timeout' && !r.manually_verified;
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
    <TooltipProvider>
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
          
          {/* Full Scan Progress */}
          {fullScanning && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <Progress value={scanProgress} />
              <p className="text-sm text-muted-foreground">
                {fullScanStatus} {scanProgress}%
              </p>
              <Button 
                onClick={() => setFullScanning(false)}
                variant="destructive"
                size="sm"
              >
                Stop Scan
              </Button>
            </div>
          )}
          
          {/* Action Buttons */}
          {!scanning && !fullScanning && !rescanningBroken && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3">
              {/* Full Scan Button */}
              {(coverage.filament.scanned < coverage.filament.total || 
                coverage.printer.scanned < coverage.printer.total || 
                coverage.accessory.scanned < coverage.accessory.total) && (
                <div>
                  <Button 
                    onClick={runFullScan}
                    variant="default"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run Full Scan ({
                      (coverage.filament.total - coverage.filament.scanned) + 
                      (coverage.printer.total - coverage.printer.scanned) + 
                      (coverage.accessory.total - coverage.accessory.scanned)
                    } URLs remaining)
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scan all unscanned URLs across filaments, printers, and accessories
                  </p>
                </div>
              )}
              
              {/* Re-scan Broken URLs */}
              {stats.broken > 0 && (
                <div>
                  <Button 
                    onClick={rescanBrokenUrls}
                    variant="secondary"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-scan {stats.broken} Broken URLs
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Re-check URLs marked as broken to recategorize redirects
                  </p>
                </div>
              )}
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
              <TabsTrigger value="amazon" className="text-orange-500">Amazon ({stats.amazonBroken})</TabsTrigger>
              <TabsTrigger value="redirect">Redirects ({stats.redirect})</TabsTrigger>
              <TabsTrigger value="timeout">Timeouts ({stats.timeout})</TabsTrigger>
              <TabsTrigger value="valid">Valid ({stats.valid})</TabsTrigger>
              <TabsTrigger value="verified" className="text-green-600">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Verified ({stats.verified})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Bulk Actions Bar */}
          {(activeTab === 'broken' || activeTab === 'amazon' || activeTab === 'redirect' || activeTab === 'timeout') && filteredResults.length > 0 && (
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
                <div className="flex items-center gap-2">
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
                  <Button 
                    onClick={deleteSelectedFilaments} 
                    disabled={selectedCount === 0 || bulkFixing || !results.some(r => selectedIds.has(r.id) && r.entity_type === 'filament')}
                    size="sm"
                    variant="destructive"
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Filaments
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {activeTab === 'redirect' && "Redirects will be updated to their destination URL automatically"}
                {activeTab === 'broken' && "Broken links will search for replacement URLs via web search (best for 404/410 errors)"}
                {activeTab === 'amazon' && "Amazon links often break due to region restrictions or product unavailability - consider removing or finding alternatives"}
                {activeTab === 'timeout' && "Timed out links may be temporary - re-scan first, or search for replacements if persistent"}
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              <Badge variant="outline" className="text-xs shrink-0">
                                {getEntityIcon(result.entity_type)}
                                <span className="ml-1 capitalize">{result.entity_type}</span>
                              </Badge>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p className="font-medium">{result.entity_name || "Unknown"}</p>
                          </TooltipContent>
                        </Tooltip>
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
                        {/* Verified badge */}
                        {result.manually_verified && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  Verified
                                </Badge>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Manually verified as working</p>
                              <p className="text-xs text-muted-foreground">
                                {result.verified_at && `Verified ${new Date(result.verified_at).toLocaleDateString()}`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        
                        {result.status_code !== null && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                <Badge 
                                  variant={result.status_code === 200 ? "default" : "destructive"}
                                >
                                  {result.status_code}
                                </Badge>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold">{getStatusCodeInfo(result.status_code).label}</p>
                                <p className="text-xs">{getStatusCodeInfo(result.status_code).description}</p>
                                <p className="text-xs text-muted-foreground italic">
                                  Fix: {getStatusCodeInfo(result.status_code).fixStrategy}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
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
                          <>
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
                            
                            {/* Mark as Verified button for broken/timeout URLs */}
                            {result.manually_verified ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => unmarkAsVerified(result)}
                                    className="gap-1 text-green-600"
                                  >
                                    <ShieldCheck className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove verification</TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => markAsVerified(result)}
                                    className="gap-1"
                                  >
                                    <ShieldCheck className="w-4 h-4" />
                                    Verify
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Mark as manually verified</p>
                                  <p className="text-xs text-muted-foreground">Use when URL works in browser but fails automated scan (bot protection)</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            
                            {/* Delete filament button */}
                            {result.entity_type === 'filament' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteEntity(result)}
                                    disabled={deletingIds.has(result.id)}
                                    className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    {deletingIds.has(result.id) ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete this filament permanently</TooltipContent>
                              </Tooltip>
                            )}
                          </>
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
    </TooltipProvider>
  );
};

export default AdminBrokenLinks;
