import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HealthMetrics {
  filaments: {
    total: number;
    withImages: number;
    withPrices: number;
    withTemps: number;
    withTds: number;
    score: number;
  };
  printers: {
    total: number;
    withImages: number;
    withPrices: number;
    withSpecs: number;
    withUrls: number;
    score: number;
  };
  hotends: {
    total: number;
    withImages: number;
    withPrices: number;
    withSpecs: number;
    score: number;
  };
  buildPlates: {
    total: number;
    withImages: number;
    withPrices: number;
    score: number;
  };
  overallScore: number;
}

interface StaleDataAlert {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  count: number;
  entityType: string;
  link: string;
}

export function useAdminHealth() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [alerts, setAlerts] = useState<StaleDataAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      // Fetch filament health using proper count queries to avoid 1000 row limit
      const [
        filamentTotal,
        filamentWithImages,
        filamentWithPrices,
        filamentWithTemps,
        filamentWithTds
      ] = await Promise.all([
        supabase.from("filaments").select("id", { count: "exact", head: true }),
        supabase.from("filaments").select("id", { count: "exact", head: true }).not("featured_image", "is", null),
        supabase.from("filaments").select("id", { count: "exact", head: true }).not("variant_price", "is", null),
        supabase.from("filaments").select("id", { count: "exact", head: true }).not("nozzle_temp_min_c", "is", null).not("nozzle_temp_max_c", "is", null),
        supabase.from("filaments").select("id", { count: "exact", head: true }).not("tds_url", "is", null)
      ]);
      
      const filamentMetrics = {
        total: filamentTotal.count || 0,
        withImages: filamentWithImages.count || 0,
        withPrices: filamentWithPrices.count || 0,
        withTemps: filamentWithTemps.count || 0,
        withTds: filamentWithTds.count || 0,
        score: 0
      };
      filamentMetrics.score = filamentMetrics.total > 0 
        ? Math.round(((filamentMetrics.withImages + filamentMetrics.withPrices + filamentMetrics.withTemps) / (filamentMetrics.total * 3)) * 100)
        : 0;

      // Fetch printer health
      const { data: printers } = await supabase
        .from("printers")
        .select("id, scraped_data, current_price_usd_store, current_price_usd_amazon, build_volume_x_mm, official_store_url, official_product_url")
        .eq("status", "active");
      
      const printerMetrics = {
        total: printers?.length || 0,
        withImages: printers?.filter(p => {
          const images = (p.scraped_data as any)?.images?.product_images;
          return images && images.length > 0;
        }).length || 0,
        withPrices: printers?.filter(p => p.current_price_usd_store || p.current_price_usd_amazon).length || 0,
        withSpecs: printers?.filter(p => p.build_volume_x_mm).length || 0,
        withUrls: printers?.filter(p => p.official_store_url || p.official_product_url).length || 0,
        score: 0
      };
      printerMetrics.score = printerMetrics.total > 0
        ? Math.round(((printerMetrics.withImages + printerMetrics.withPrices + printerMetrics.withSpecs + printerMetrics.withUrls) / (printerMetrics.total * 4)) * 100)
        : 0;

      // Fetch hotend health
      const { data: hotends } = await supabase
        .from("printer_accessories")
        .select("id, image_url, price, specs")
        .eq("accessory_type", "hotend");
      
      const hotendMetrics = {
        total: hotends?.length || 0,
        withImages: hotends?.filter(h => h.image_url).length || 0,
        withPrices: hotends?.filter(h => h.price).length || 0,
        withSpecs: hotends?.filter(h => h.specs && Object.keys(h.specs as object).length > 0).length || 0,
        score: 0
      };
      hotendMetrics.score = hotendMetrics.total > 0
        ? Math.round(((hotendMetrics.withImages + hotendMetrics.withPrices + hotendMetrics.withSpecs) / (hotendMetrics.total * 3)) * 100)
        : 0;

      // Fetch build plate health
      const { data: buildPlates } = await supabase
        .from("printer_accessories")
        .select("id, image_url, price")
        .eq("accessory_type", "build_plate");
      
      const buildPlateMetrics = {
        total: buildPlates?.length || 0,
        withImages: buildPlates?.filter(b => b.image_url).length || 0,
        withPrices: buildPlates?.filter(b => b.price).length || 0,
        score: 0
      };
      buildPlateMetrics.score = buildPlateMetrics.total > 0
        ? Math.round(((buildPlateMetrics.withImages + buildPlateMetrics.withPrices) / (buildPlateMetrics.total * 2)) * 100)
        : 0;

      // Calculate overall score
      const overallScore = Math.round(
        (filamentMetrics.score * 0.4) + 
        (printerMetrics.score * 0.3) + 
        (hotendMetrics.score * 0.2) + 
        (buildPlateMetrics.score * 0.1)
      );

      setMetrics({
        filaments: filamentMetrics,
        printers: printerMetrics,
        hotends: hotendMetrics,
        buildPlates: buildPlateMetrics,
        overallScore
      });

      // Generate alerts
      const newAlerts: StaleDataAlert[] = [];

      // Critical: Printers with stale prices (>30 days)
      const { count: stalePrinterPrices } = await supabase
        .from("printers")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .or("prices_last_updated_at.is.null,prices_last_updated_at.lt." + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (stalePrinterPrices && stalePrinterPrices > 0) {
        newAlerts.push({
          type: 'critical',
          title: 'Stale Printer Prices',
          description: 'Printers with prices older than 30 days',
          count: stalePrinterPrices,
          entityType: 'printer',
          link: '/admin/printers'
        });
      }

      // Warning: Filaments without images
      const filamentsNoImage = filamentMetrics.total - filamentMetrics.withImages;
      if (filamentsNoImage > 0) {
        newAlerts.push({
          type: 'warning',
          title: 'Missing Filament Images',
          description: 'Filaments without featured images',
          count: filamentsNoImage,
          entityType: 'filament',
          link: '/admin/filaments'
        });
      }

      // Warning: Printers without images
      const printersNoImage = printerMetrics.total - printerMetrics.withImages;
      if (printersNoImage > 0) {
        newAlerts.push({
          type: 'warning',
          title: 'Missing Printer Images',
          description: 'Printers without product images',
          count: printersNoImage,
          entityType: 'printer',
          link: '/admin/printers'
        });
      }

      // Warning: Accessories without TDS
      const { count: accessoriesNoTds } = await supabase
        .from("printer_accessories")
        .select("id", { count: "exact", head: true })
        .is("tds_url", null);
      
      if (accessoriesNoTds && accessoriesNoTds > 0) {
        newAlerts.push({
          type: 'info',
          title: 'Missing Accessory TDS',
          description: 'Accessories without technical data sheets',
          count: accessoriesNoTds,
          entityType: 'accessory',
          link: '/admin/maintenance'
        });
      }

      // Info: Brands without affiliate config
      const { data: vendors } = await supabase
        .from("filaments")
        .select("vendor")
        .not("vendor", "is", null);
      
      const uniqueVendors = [...new Set(vendors?.map(v => v.vendor))];
      
      const { data: affiliateConfigs } = await supabase
        .from("affiliate_configs")
        .select("vendor_name");
      
      const configuredVendors = affiliateConfigs?.map(c => c.vendor_name.toLowerCase()) || [];
      const unconfiguredVendors = uniqueVendors.filter(v => !configuredVendors.includes(v?.toLowerCase() || ''));
      
      if (unconfiguredVendors.length > 0) {
        newAlerts.push({
          type: 'info',
          title: 'Unconfigured Affiliates',
          description: 'Brands without affiliate link configuration',
          count: unconfiguredVendors.length,
          entityType: 'affiliate',
          link: '/admin/affiliates'
        });
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error("Error fetching health data:", error);
    } finally {
      setLoading(false);
    }
  };

  return { metrics, alerts, loading, refresh: fetchHealthData };
}
