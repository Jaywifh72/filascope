import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  RefreshCw, CheckCircle, XCircle, AlertTriangle, 
  ExternalLink, Package, Database, Wrench, Play, Search, ArrowRight, Loader2, Trash2, ShieldCheck,
  ChevronDown, ChevronUp, Edit, Ban
} from "lucide-react";
import { toast } from "sonner";
import { DISCONTINUED_MARKER } from "@/lib/urlValidation";

// HTTP status code explanations
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

export interface UrlValidationResult {
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
  entity_name?: string;
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
  total: number;
  scanned: number;
}

type CategoryType = 'filament' | 'printer' | 'hotend' | 'build_plate' | 'other';

interface BrokenLinkSectionProps {
  category: CategoryType;
  title: string;
  icon: React.ReactNode;
  userId?: string;
  onRefresh: () => void;
}

const getCategoryEntityTypes = (category: CategoryType): { entityType: string; accessoryType?: string }[] => {
  switch (category) {
    case 'filament':
      return [{ entityType: 'filament' }];
    case 'printer':
      return [{ entityType: 'printer' }];
    case 'hotend':
      return [{ entityType: 'accessory', accessoryType: 'hotend' }];
    case 'build_plate':
      return [{ entityType: 'accessory', accessoryType: 'build_plate' }];
    case 'other':
      return [{ entityType: 'accessory', accessoryType: 'ams_mmu' }];
    default:
      return [];
  }
};

const BrokenLinkSection = ({ category, title, icon, userId, onRefresh }: BrokenLinkSectionProps) => {
  const [results, setResults] = useState<UrlValidationResult[]>([]);
  const [stats, setStats] = useState<ValidationStats>({ total: 0, valid: 0, broken: 0, amazonBroken: 0, redirect: 0, timeout: 0, verified: 0 });
  const [coverage, setCoverage] = useState<ScanCoverage>({ total: 0, scanned: 0 });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("broken");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fixingIds, setFixingIds] = useState<Set<string>>(new Set());
  const [bulkFixing, setBulkFixing] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [discontinuingIds, setDiscontinuingIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [editingResult, setEditingResult] = useState<UrlValidationResult | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [batchSize, setBatchSize] = useState(150);

  const fetchData = async () => {
    if (!expanded) return;
    
    setLoading(true);
    try {
      // Fetch all data independently
      await Promise.all([
        fetchResultsAndStats(),
        fetchCoverageInternal()
      ]);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    if (expanded && !initialized) {
      fetchData();
    }
  }, [expanded]);

  // Refetch results when tab changes (only if already initialized)
  useEffect(() => {
    if (initialized && expanded) {
      fetchResultsAndStats(activeTab);
    }
  }, [activeTab]);

  const fetchCoverageInternal = async () => {
    const categoryTypes = getCategoryEntityTypes(category);
    let totalCount = 0;
    let scannedCount = 0;

    for (const ct of categoryTypes) {
      if (ct.entityType === 'filament') {
        // Count total filaments with product_url
        const { count: total } = await supabase
          .from("filaments")
          .select("id", { count: "exact", head: true })
          .not("product_url", "is", null);
        totalCount += total || 0;
        
        // Count unique filament entity_ids in url_validation_results
        const { data: scannedData } = await supabase
          .from("url_validation_results")
          .select("entity_id")
          .eq("entity_type", "filament");
        
        // Use Set to count unique entity_ids
        const uniqueScannedIds = new Set(scannedData?.map(r => r.entity_id) || []);
        scannedCount += uniqueScannedIds.size;
        
      } else if (ct.entityType === 'printer') {
        // For printers, we count individual URLs, not printers
        const { data: printerUrls } = await supabase
          .from("printers")
          .select("id, official_store_url, official_product_url")
          .eq("status", "active");
        
        printerUrls?.forEach(p => {
          if (p.official_store_url) totalCount++;
          if (p.official_product_url) totalCount++;
        });
        
        // Count scanned printer URLs (unique entity_id + url_field combinations)
        const { data: scannedData } = await supabase
          .from("url_validation_results")
          .select("entity_id, url_field")
          .eq("entity_type", "printer");
        
        scannedCount += scannedData?.length || 0;
        
      } else if (ct.entityType === 'accessory' && ct.accessoryType) {
        // Count accessories of this type with product_url
        const { data: accessories } = await supabase
          .from("printer_accessories")
          .select("id")
          .eq("accessory_type", ct.accessoryType)
          .not("product_url", "is", null);
        
        const accessoryIds = accessories?.map(a => a.id) || [];
        totalCount += accessoryIds.length;

        if (accessoryIds.length > 0) {
          // Count scanned accessories of this type
          const { data: scannedData } = await supabase
            .from("url_validation_results")
            .select("entity_id")
            .eq("entity_type", "accessory")
            .in("entity_id", accessoryIds);
          
          const uniqueScannedIds = new Set(scannedData?.map(r => r.entity_id) || []);
          scannedCount += uniqueScannedIds.size;
        }
      }
    }

    setCoverage({ total: totalCount, scanned: scannedCount });
  };

  const fetchResultsAndStats = async (tabFilter?: string) => {
    const categoryTypes = getCategoryEntityTypes(category);
    let allResults: UrlValidationResult[] = [];
    let accessoryIdsForCategory: string[] = [];
    const currentTab = tabFilter || activeTab;

    // Build status filters based on tab
    const buildQuery = (baseQuery: any) => {
      switch (currentTab) {
        case 'broken':
          return baseQuery
            .eq("status", "broken")
            .eq("manually_verified", false)
            .not("url", "ilike", "%amazon.%");
        case 'amazon':
          return baseQuery
            .eq("status", "broken")
            .ilike("url", "%amazon.%");
        case 'redirect':
          return baseQuery.eq("status", "redirect");
        case 'timeout':
          return baseQuery
            .eq("status", "timeout")
            .eq("manually_verified", false);
        case 'valid':
          return baseQuery.eq("status", "valid").eq("manually_verified", false);
        case 'verified':
          return baseQuery.eq("manually_verified", true);
        case 'user_reported':
          // User-reported: broken status, no verified_by, and recent (last 7 days)
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          return baseQuery
            .eq("status", "broken")
            .eq("manually_verified", false)
            .is("verified_by", null)
            .gte("checked_at", sevenDaysAgo);
        case 'all':
        default:
          return baseQuery;
      }
    };

    // Fetch results for display (filtered by tab, limited to 200)
    for (const ct of categoryTypes) {
      if (ct.entityType === 'accessory' && ct.accessoryType) {
        const { data: accessories } = await supabase
          .from("printer_accessories")
          .select("id")
          .eq("accessory_type", ct.accessoryType);
        
        const accessoryIds = accessories?.map(a => a.id) || [];
        accessoryIdsForCategory = accessoryIds;
        
        if (accessoryIds.length > 0) {
          let query = supabase
            .from("url_validation_results")
            .select("*")
            .eq("entity_type", "accessory")
            .in("entity_id", accessoryIds);
          
          query = buildQuery(query);
          const { data } = await query
            .order("checked_at", { ascending: false })
            .limit(200);
          if (data) allResults = [...allResults, ...data];
        }
      } else {
        let query = supabase
          .from("url_validation_results")
          .select("*")
          .eq("entity_type", ct.entityType);
        
        query = buildQuery(query);
        const { data } = await query
          .order("checked_at", { ascending: false })
          .limit(200);
        if (data) allResults = [...allResults, ...data];
      }
    }

    // Resolve entity names
    const resultsWithNames = await resolveEntityNames(allResults);
    setResults(resultsWithNames);

    // Fetch stats from ALL records (no limit) - only on initial load or all tab
    if (currentTab === 'all' || !tabFilter) {
      await fetchStatsInternal(categoryTypes, accessoryIdsForCategory);
    }
    setSelectedIds(new Set());
  };

  const fetchStatsInternal = async (categoryTypes: { entityType: string; accessoryType?: string }[], accessoryIdsForCategory: string[]) => {
    const isAmazonUrl = (url: string) => url?.toLowerCase().includes('amazon.');
    let statsCalc = { total: 0, valid: 0, broken: 0, amazonBroken: 0, redirect: 0, timeout: 0, verified: 0 };

    for (const ct of categoryTypes) {
      let data: { status: string; url: string; manually_verified: boolean | null }[] | null = null;
      
      if (ct.entityType === 'accessory' && ct.accessoryType) {
        if (accessoryIdsForCategory.length > 0) {
          const result = await supabase
            .from("url_validation_results")
            .select("status, url, manually_verified")
            .eq("entity_type", "accessory")
            .in("entity_id", accessoryIdsForCategory);
          data = result.data;
        }
      } else {
        const result = await supabase
          .from("url_validation_results")
          .select("status, url, manually_verified")
          .eq("entity_type", ct.entityType);
        data = result.data;
      }

      data?.forEach(r => {
        statsCalc.total++;
        if (r.manually_verified) statsCalc.verified++;
        if (r.status === 'valid') statsCalc.valid++;
        else if (r.status === 'broken' && !r.manually_verified) {
          if (isAmazonUrl(r.url)) statsCalc.amazonBroken++;
          else statsCalc.broken++;
        }
        else if (r.status === 'redirect') statsCalc.redirect++;
        else if (r.status === 'timeout' && !r.manually_verified) statsCalc.timeout++;
      });
    }
    
    setStats(statsCalc);
  };

  const resolveEntityNames = async (results: UrlValidationResult[]): Promise<UrlValidationResult[]> => {
    const filamentIds = results.filter(r => r.entity_type === 'filament').map(r => r.entity_id);
    const printerIds = results.filter(r => r.entity_type === 'printer').map(r => r.entity_id);
    const accessoryIds = results.filter(r => r.entity_type === 'accessory').map(r => r.entity_id);

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

    return results.map(r => ({
      ...r,
      entity_name: nameMap.get(r.entity_id) || undefined
    }));
  };

  const clearCategoryResults = async () => {
    const categoryTypes = getCategoryEntityTypes(category);
    
    for (const ct of categoryTypes) {
      if (ct.entityType === 'accessory' && ct.accessoryType) {
        // Get accessory IDs of this type first
        const { data: accessories } = await supabase
          .from("printer_accessories")
          .select("id")
          .eq("accessory_type", ct.accessoryType);
        
        if (accessories && accessories.length > 0) {
          const accessoryIds = accessories.map(a => a.id);
          await supabase
            .from("url_validation_results")
            .delete()
            .eq("entity_type", "accessory")
            .in("entity_id", accessoryIds);
        }
      } else {
        await supabase
          .from("url_validation_results")
          .delete()
          .eq("entity_type", ct.entityType);
      }
    }
  };

  const rescanAll = async () => {
    if (!confirm(`This will clear all existing scan results for ${title} and rescan from scratch. Continue?`)) {
      return;
    }
    
    setScanning(true);
    setScanProgress(0);
    
    try {
      // Clear existing results for this category
      await clearCategoryResults();
      toast.info(`Cleared existing results for ${title}`);
      
      // Reset stats and coverage
      setStats({ total: 0, valid: 0, broken: 0, amazonBroken: 0, redirect: 0, timeout: 0, verified: 0 });
      setResults([]);
      
      // Refresh coverage to get new counts
      await fetchCoverageInternal();
      
      // Now run the scan
      await runScanInternal();
    } catch (error) {
      console.error("Error during rescan all:", error);
      toast.error("Failed to rescan all");
    } finally {
      setScanning(false);
      await fetchData();
    }
  };

  const runScanInternal = async () => {
    const categoryTypes = getCategoryEntityTypes(category);
      let urls: { entity_type: string; entity_id: string; url_field: string; url: string }[] = [];

      for (const ct of categoryTypes) {
        if (ct.entityType === 'filament') {
          // Get already scanned filament IDs
          const { data: alreadyScanned } = await supabase
            .from("url_validation_results")
            .select("entity_id")
            .eq("entity_type", "filament");
          
          const scannedIds = new Set(alreadyScanned?.map(r => r.entity_id) || []);

          // Get filaments with product_url - fetch enough to find unscanned
          let unscanned: { id: string; product_url: string }[] = [];
          let offset = 0;
          const fetchBatchSize = 200;
          
          while (unscanned.length < batchSize && offset < 3000) {
            const { data } = await supabase
              .from("filaments")
              .select("id, product_url")
              .not("product_url", "is", null)
              .range(offset, offset + fetchBatchSize - 1);
            
            if (!data || data.length === 0) break;
            
            const filtered = data.filter(f => !scannedIds.has(f.id));
            unscanned = [...unscanned, ...filtered];
            offset += fetchBatchSize;
          }
          
          urls = unscanned.slice(0, batchSize).map(f => ({ 
            entity_type: 'filament', 
            entity_id: f.id, 
            url_field: 'product_url', 
            url: f.product_url! 
          }));
          
        } else if (ct.entityType === 'printer') {
          // Get already scanned printer URL keys
          const { data: alreadyScanned } = await supabase
            .from("url_validation_results")
            .select("entity_id, url_field")
            .eq("entity_type", "printer");
          
          const scannedKeys = new Set(alreadyScanned?.map(r => `${r.entity_id}:${r.url_field}`) || []);

          // Get printers with URLs
          const { data } = await supabase
            .from("printers")
            .select("id, official_store_url, official_product_url")
            .eq("status", "active")
            .limit(batchSize * 2);
          
          const printerUrls: typeof urls = [];
          data?.forEach(p => {
            if (p.official_store_url && !scannedKeys.has(`${p.id}:official_store_url`)) {
              printerUrls.push({ entity_type: 'printer', entity_id: p.id, url_field: 'official_store_url', url: p.official_store_url });
            }
            if (p.official_product_url && !scannedKeys.has(`${p.id}:official_product_url`)) {
              printerUrls.push({ entity_type: 'printer', entity_id: p.id, url_field: 'official_product_url', url: p.official_product_url });
            }
          });
          urls = printerUrls.slice(0, batchSize);
          
        } else if (ct.entityType === 'accessory' && ct.accessoryType) {
          // Get accessories of this specific type first
          const { data: accessories } = await supabase
            .from("printer_accessories")
            .select("id, product_url")
            .eq("accessory_type", ct.accessoryType)
            .not("product_url", "is", null)
            .limit(batchSize * 2);
          
          if (!accessories || accessories.length === 0) {
            continue;
          }
          
          const accessoryIds = accessories.map(a => a.id);
          
          // Get already scanned accessory IDs of THIS type
          const { data: alreadyScanned } = await supabase
            .from("url_validation_results")
            .select("entity_id")
            .eq("entity_type", "accessory")
            .in("entity_id", accessoryIds);
          
          const scannedIds = new Set(alreadyScanned?.map(r => r.entity_id) || []);
          
          const unscanned = accessories.filter(a => !scannedIds.has(a.id));
          urls = unscanned.slice(0, batchSize).map(a => ({
            entity_type: 'accessory', 
            entity_id: a.id, 
            url_field: 'product_url', 
            url: a.product_url! 
          }));
        }
      }
      if (urls.length === 0) {
        toast.info(`All ${title} URLs have been scanned`);
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
              status = 'redirect';
            }
          }

          await supabase.from("url_validation_results").delete()
            .eq("entity_type", urlData.entity_type).eq("entity_id", urlData.entity_id).eq("url_field", urlData.url_field);

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

    toast.success(`Scanned ${urls.length} ${title} URLs`);
    onRefresh();
  };

  const runScan = async () => {
    setScanning(true);
    setScanProgress(0);
    try {
      await runScanInternal();
    } finally {
      setScanning(false);
      await fetchData();
    }
  };

  const updateToRedirectUrl = async (result: UrlValidationResult) => {
    if (!result.redirect_url) return;
    setFixingIds(prev => new Set(prev).add(result.id));

    try {
      const tableName = result.entity_type === 'filament' ? 'filaments' 
        : result.entity_type === 'printer' ? 'printers' 
        : 'printer_accessories';

      await supabase.from(tableName).update({ [result.url_field]: result.redirect_url }).eq('id', result.entity_id);
      await supabase.from("url_validation_results").update({ status: 'valid', url: result.redirect_url, status_code: 200 }).eq('id', result.id);

      toast.success("URL updated");
      await fetchResultsAndStats();
    } catch (error) {
      toast.error("Failed to update URL");
    } finally {
      setFixingIds(prev => { const next = new Set(prev); next.delete(result.id); return next; });
    }
  };

  const findReplacementUrl = async (result: UrlValidationResult) => {
    setFixingIds(prev => new Set(prev).add(result.id));

    try {
      let productTitle = '';
      let vendor = '';

      if (result.entity_type === 'filament') {
        const { data } = await supabase.from('filaments').select('product_title, vendor').eq('id', result.entity_id).maybeSingle();
        if (data) { productTitle = data.product_title; vendor = data.vendor || ''; }
      } else if (result.entity_type === 'printer') {
        const { data } = await supabase.from('printers').select('model_name, printer_brands(brand)').eq('id', result.entity_id).maybeSingle();
        if (data) { productTitle = data.model_name; vendor = (data.printer_brands as any)?.brand || ''; }
      } else if (result.entity_type === 'accessory') {
        const { data } = await supabase.from('printer_accessories').select('name, brand').eq('id', result.entity_id).maybeSingle();
        if (data) { productTitle = data.name; vendor = data.brand || ''; }
      }

      if (!productTitle) { toast.error("Could not find entity details"); return; }

      const { data, error } = await supabase.functions.invoke('fix-filament-url', {
        body: { entityId: result.entity_id, entityType: result.entity_type, urlField: result.url_field, productTitle, vendor, currentUrl: result.url }
      });

      if (!error && data?.newUrl) {
        await supabase.from("url_validation_results").update({ status: 'valid', url: data.newUrl, status_code: 200 }).eq('id', result.id);
        toast.success("Found and applied replacement URL");
        await fetchResultsAndStats();
      } else {
        toast.error(data?.error || "Could not find a replacement URL");
      }
    } catch (error) {
      toast.error("Failed to find replacement URL");
    } finally {
      setFixingIds(prev => { const next = new Set(prev); next.delete(result.id); return next; });
    }
  };

  const openManualEdit = (result: UrlValidationResult) => {
    setEditingResult(result);
    setNewUrl(result.url);
  };

  const saveManualUrl = async () => {
    if (!editingResult || !newUrl.trim()) return;
    
    // Basic URL validation
    try {
      new URL(newUrl.trim());
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setFixingIds(prev => new Set(prev).add(editingResult.id));

    try {
      const tableName = editingResult.entity_type === 'filament' ? 'filaments' 
        : editingResult.entity_type === 'printer' ? 'printers' 
        : 'printer_accessories';

      await supabase.from(tableName).update({ [editingResult.url_field]: newUrl.trim() }).eq('id', editingResult.entity_id);
      await supabase.from("url_validation_results").update({ 
        status: 'valid', 
        url: newUrl.trim(), 
        status_code: 200,
        manually_verified: true,
        verified_at: new Date().toISOString()
      }).eq('id', editingResult.id);

      toast.success("URL updated manually");
      setEditingResult(null);
      setNewUrl("");
      await fetchResultsAndStats();
    } catch (error) {
      toast.error("Failed to update URL");
    } finally {
      setFixingIds(prev => { const next = new Set(prev); next.delete(editingResult.id); return next; });
    }
  };

  const fixSelected = async () => {
    const selectedResults = results.filter(r => selectedIds.has(r.id));
    if (selectedResults.length === 0) return;

    setBulkFixing(true);
    let fixed = 0;

    for (const result of selectedResults) {
      try {
        if (result.status === 'redirect' && result.redirect_url) {
          const tableName = result.entity_type === 'filament' ? 'filaments' 
            : result.entity_type === 'printer' ? 'printers' 
            : 'printer_accessories';
          await supabase.from(tableName).update({ [result.url_field]: result.redirect_url }).eq('id', result.entity_id);
          await supabase.from("url_validation_results").update({ status: 'valid', url: result.redirect_url, status_code: 200 }).eq('id', result.id);
          fixed++;
        } else if (result.status === 'broken' || result.status === 'timeout') {
          let productTitle = '', vendor = '';
          if (result.entity_type === 'filament') {
            const { data } = await supabase.from('filaments').select('product_title, vendor').eq('id', result.entity_id).maybeSingle();
            if (data) { productTitle = data.product_title; vendor = data.vendor || ''; }
          } else if (result.entity_type === 'printer') {
            const { data } = await supabase.from('printers').select('model_name, printer_brands(brand)').eq('id', result.entity_id).maybeSingle();
            if (data) { productTitle = data.model_name; vendor = (data.printer_brands as any)?.brand || ''; }
          } else if (result.entity_type === 'accessory') {
            const { data } = await supabase.from('printer_accessories').select('name, brand').eq('id', result.entity_id).maybeSingle();
            if (data) { productTitle = data.name; vendor = data.brand || ''; }
          }
          if (!productTitle) continue;

          const { data } = await supabase.functions.invoke('fix-filament-url', {
            body: { entityId: result.entity_id, entityType: result.entity_type, urlField: result.url_field, productTitle, vendor, currentUrl: result.url }
          });
          if (data?.newUrl) {
            await supabase.from("url_validation_results").update({ status: 'valid', url: data.newUrl, status_code: 200 }).eq('id', result.id);
            fixed++;
          }
        }
      } catch (e) {
        console.error("Error fixing item:", result.id, e);
      }
    }

    setBulkFixing(false);
    setSelectedIds(new Set());
    toast.success(`Fixed ${fixed} URLs`);
    await fetchResultsAndStats();
  };

  const markAsVerified = async (result: UrlValidationResult) => {
    if (!userId) return;
    await supabase.from("url_validation_results").update({ 
      manually_verified: true, 
      verified_at: new Date().toISOString(), 
      verified_by: userId,
      status: 'valid' // Mark as valid when manually verified
    }).eq('id', result.id);
    toast.success("URL marked as verified and valid");
    await fetchResultsAndStats();
  };

  const unmarkAsVerified = async (result: UrlValidationResult) => {
    await supabase.from("url_validation_results").update({ 
      manually_verified: false, verified_at: null, verified_by: null 
    }).eq('id', result.id);
    toast.success("Verification removed");
    await fetchResultsAndStats();
  };

  const deleteEntity = async (result: UrlValidationResult) => {
    if (result.entity_type !== 'filament' && result.entity_type !== 'accessory') {
      toast.error("Only filaments and accessories can be deleted from this view");
      return;
    }
    if (!window.confirm(`Delete ${result.entity_name}?`)) return;

    setDeletingIds(prev => new Set(prev).add(result.id));
    try {
      const tableName = result.entity_type === 'filament' ? 'filaments' : 'printer_accessories';
      await supabase.from(tableName).delete().eq('id', result.entity_id);
      await supabase.from('url_validation_results').delete().eq('id', result.id);
      toast.success("Deleted");
      await fetchResultsAndStats();
      await fetchCoverageInternal();
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setDeletingIds(prev => { const next = new Set(prev); next.delete(result.id); return next; });
    }
  };

  const markAsDiscontinued = async (result: UrlValidationResult) => {
    if (!window.confirm(`Mark ${result.entity_name || 'this product'} as discontinued? This will replace the product URL with "DISCONTINUED".`)) return;

    setDiscontinuingIds(prev => new Set(prev).add(result.id));
    try {
      // Update the product URL to DISCONTINUED based on entity type
      const urlColumn = result.url_field;
      let error: Error | null = null;
      
      if (result.entity_type === 'filament') {
        const updateData: Record<string, string> = { [urlColumn]: DISCONTINUED_MARKER };
        const res = await supabase.from('filaments').update(updateData as any).eq('id', result.entity_id);
        if (res.error) error = res.error;
      } else if (result.entity_type === 'printer') {
        const updateData: Record<string, string> = { [urlColumn]: DISCONTINUED_MARKER };
        const res = await supabase.from('printers').update(updateData as any).eq('id', result.entity_id);
        if (res.error) error = res.error;
      } else if (result.entity_type === 'accessory') {
        const updateData: Record<string, string> = { [urlColumn]: DISCONTINUED_MARKER };
        const res = await supabase.from('printer_accessories').update(updateData as any).eq('id', result.entity_id);
        if (res.error) error = res.error;
      }

      if (error) throw error;
      
      // Remove from url_validation_results since it's now handled
      await supabase.from('url_validation_results').delete().eq('id', result.id);
      
      toast.success(`${result.entity_name || 'Product'} marked as discontinued`);
      await fetchResultsAndStats();
      await fetchCoverageInternal();
      onRefresh();
    } catch (error) {
      console.error("Error marking as discontinued:", error);
      toast.error("Failed to mark as discontinued");
    } finally {
      setDiscontinuingIds(prev => { const next = new Set(prev); next.delete(result.id); return next; });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'broken': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'redirect': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const isAmazonUrl = (url: string) => url?.toLowerCase().includes('amazon.');
  
  const filteredResults = results.filter(r => {
    if (activeTab === 'all') return true;
    if (activeTab === 'verified') return r.manually_verified;
    if (activeTab === 'broken') return r.status === 'broken' && !r.manually_verified && !isAmazonUrl(r.url);
    if (activeTab === 'amazon') return r.status === 'broken' && !r.manually_verified && isAmazonUrl(r.url);
    if (activeTab === 'timeout') return r.status === 'timeout' && !r.manually_verified;
    if (activeTab === 'user_reported') {
      // User-reported: broken, not verified, no verified_by, recent
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      return r.status === 'broken' && !r.manually_verified && !r.verified_by && r.checked_at >= sevenDaysAgo;
    }
    return r.status === activeTab;
  });

  const selectedCount = Array.from(selectedIds).filter(id => filteredResults.some(r => r.id === id)).length;


  return (
    <Card className="mb-4">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-2">
            {stats.broken > 0 && (
              <Badge variant="destructive" className="text-xs">{stats.broken} broken</Badge>
            )}
            {stats.redirect > 0 && (
              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-500">{stats.redirect} redirects</Badge>
            )}
            {stats.timeout > 0 && (
              <Badge variant="outline" className="text-xs">{stats.timeout} timeouts</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {coverage.scanned} / {coverage.total} scanned
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 pt-0 border-t border-border">
          {/* Scan Progress */}
          {scanning && (
            <div className="mb-4 space-y-2">
              <Progress value={scanProgress} />
              <p className="text-sm text-muted-foreground">Scanning... {scanProgress}%</p>
            </div>
          )}

          {/* Scan Actions */}
          {!scanning && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Batch:</span>
                <Input
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Math.max(10, Math.min(500, parseInt(e.target.value) || 150)))}
                  className="w-20 h-8 text-sm"
                  min={10}
                  max={500}
                />
              </div>
              <Button 
                onClick={runScan} 
                variant="outline" 
                size="sm"
                disabled={coverage.scanned >= coverage.total}
              >
                <Play className="w-4 h-4 mr-2" />
                {coverage.scanned >= coverage.total 
                  ? "All Scanned" 
                  : `Scan Next ${batchSize} (${coverage.total - coverage.scanned} remaining)`}
              </Button>
              <Button 
                onClick={rescanAll} 
                variant="outline" 
                size="sm"
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Rescan All
              </Button>
              <Button onClick={() => fetchData()} variant="ghost" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          )}

          {/* Results Tabs */}
          {stats.total > 0 && (
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedIds(new Set()); }}>
              <TabsList className="mb-3 flex-wrap">
                <TabsTrigger value="all" className="text-xs">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="broken" className="text-xs">Broken ({stats.broken})</TabsTrigger>
                {stats.amazonBroken > 0 && (
                  <TabsTrigger value="amazon" className="text-xs text-orange-500">Amazon ({stats.amazonBroken})</TabsTrigger>
                )}
                <TabsTrigger value="redirect" className="text-xs">Redirects ({stats.redirect})</TabsTrigger>
                <TabsTrigger value="timeout" className="text-xs">Timeouts ({stats.timeout})</TabsTrigger>
                <TabsTrigger value="valid" className="text-xs">Valid ({stats.valid})</TabsTrigger>
                <TabsTrigger value="user_reported" className="text-xs text-purple-500">User Reported</TabsTrigger>
                {stats.verified > 0 && (
                  <TabsTrigger value="verified" className="text-xs text-green-600">Verified ({stats.verified})</TabsTrigger>
                )}
              </TabsList>

              {/* Bulk Actions */}
              {selectedCount > 0 && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-muted/30 rounded-md">
                  <span className="text-sm text-muted-foreground">{selectedCount} selected</span>
                  <Button variant="outline" size="sm" onClick={fixSelected} disabled={bulkFixing}>
                    {bulkFixing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wrench className="w-4 h-4 mr-2" />}
                    Fix Selected
                  </Button>
                </div>
              )}

              <TabsContent value={activeTab} className="mt-0">
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading...</div>
                ) : filteredResults.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No results</div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredResults.map((result) => (
                      <div key={result.id} className={`p-2 rounded-md border ${selectedIds.has(result.id) ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                        <div className="flex items-center gap-2">
                          {(result.status === 'broken' || result.status === 'redirect' || result.status === 'timeout') && (
                            <Checkbox checked={selectedIds.has(result.id)} onCheckedChange={() => toggleSelect(result.id)} />
                          )}
                          {getStatusIcon(result.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground truncate">{result.entity_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground/70 truncate">{result.url}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {result.manually_verified && (
                              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                                <ShieldCheck className="w-3 h-3 mr-1" />Verified
                              </Badge>
                            )}
                            {result.status_code !== null && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant={result.status_code === 200 ? "default" : "destructive"} className="text-xs">
                                    {result.status_code}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-semibold">{getStatusCodeInfo(result.status_code).label}</p>
                                  <p className="text-xs">{getStatusCodeInfo(result.status_code).description}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            
                            {result.status === 'redirect' && result.redirect_url && (
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateToRedirectUrl(result)} disabled={fixingIds.has(result.id)}>
                                {fixingIds.has(result.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                              </Button>
                            )}
                            
                            {(result.status === 'broken' || result.status === 'timeout') && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openManualEdit(result)}>
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit URL manually</TooltipContent>
                                </Tooltip>
                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => findReplacementUrl(result)} disabled={fixingIds.has(result.id)}>
                                  {fixingIds.has(result.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                                </Button>
                                {result.manually_verified ? (
                                  <Button variant="ghost" size="sm" className="h-7 text-green-600" onClick={() => unmarkAsVerified(result)}>
                                    <ShieldCheck className="w-3 h-3" />
                                  </Button>
                                ) : (
                                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => markAsVerified(result)}>
                                    <ShieldCheck className="w-3 h-3" />
                                  </Button>
                                )}
                                {/* Mark as Discontinued button - show for 404/410 errors */}
                                {(result.status_code === 404 || result.status_code === 410) && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 text-xs gap-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                                        onClick={() => markAsDiscontinued(result)} 
                                        disabled={discontinuingIds.has(result.id)}
                                      >
                                        {discontinuingIds.has(result.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                                        <span>Discontinued</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Mark product as discontinued (replaces URL with "DISCONTINUED")</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {(result.entity_type === 'filament' || result.entity_type === 'accessory') && (
                                  <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => deleteEntity(result)} disabled={deletingIds.has(result.id)}>
                                    {deletingIds.has(result.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                  </Button>
                                )}
                              </>
                            )}
                            
                            <Button variant="ghost" size="sm" className="h-7" onClick={() => window.open(result.url, '_blank')}>
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {stats.total === 0 && !loading && (
            <div className="text-center py-4 text-muted-foreground">
              No URLs scanned yet. Click "Scan Next" to start.
            </div>
          )}
        </div>
      )}

      {/* Manual URL Edit Dialog */}
      <Dialog open={!!editingResult} onOpenChange={(open) => !open && setEditingResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit URL Manually</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Product:</p>
              <p className="text-sm font-medium">{editingResult?.entity_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current URL:</p>
              <p className="text-xs text-muted-foreground break-all">{editingResult?.url}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">New URL:</p>
              <Input 
                value={newUrl} 
                onChange={(e) => setNewUrl(e.target.value)} 
                placeholder="https://..."
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingResult(null)}>Cancel</Button>
            <Button onClick={saveManualUrl} disabled={!newUrl.trim() || fixingIds.has(editingResult?.id || '')}>
              {fixingIds.has(editingResult?.id || '') ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BrokenLinkSection;
