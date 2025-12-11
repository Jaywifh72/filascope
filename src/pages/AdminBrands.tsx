import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, Search, Package, Database, Wrench, Square, 
  ExternalLink, RefreshCw, ChevronRight, CheckCircle, XCircle
} from "lucide-react";

interface BrandData {
  name: string;
  filamentCount: number;
  printerCount: number;
  hotendCount: number;
  buildPlateCount: number;
  hasAffiliate: boolean;
  dataScore: number;
  lastUpdated: string | null;
}

const AdminBrands = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      navigate("/");
    } else if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [isAdmin, authLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchBrands();
    }
  }, [isAdmin]);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      // Fetch all filament vendors
      const { data: filaments } = await supabase
        .from("filaments")
        .select("vendor, featured_image, variant_price, updated_at");
      
      // Fetch printer brands
      const { data: printerBrands } = await supabase
        .from("printer_brands")
        .select("brand");
      
      const { data: printers } = await supabase
        .from("printers")
        .select("brand_id, scraped_data, current_price_usd_store, updated_at")
        .eq("status", "active");
      
      // Fetch accessories
      const { data: accessories } = await supabase
        .from("printer_accessories")
        .select("brand, accessory_type, image_url, price");
      
      // Fetch affiliate configs
      const { data: affiliates } = await supabase
        .from("affiliate_configs")
        .select("vendor_name");
      
      const affiliateVendors = new Set(affiliates?.map(a => a.vendor_name.toLowerCase()) || []);

      // Aggregate by brand
      const brandMap = new Map<string, BrandData>();

      // Process filaments
      filaments?.forEach(f => {
        if (!f.vendor) return;
        const name = f.vendor;
        if (!brandMap.has(name)) {
          brandMap.set(name, {
            name,
            filamentCount: 0,
            printerCount: 0,
            hotendCount: 0,
            buildPlateCount: 0,
            hasAffiliate: affiliateVendors.has(name.toLowerCase()),
            dataScore: 0,
            lastUpdated: null
          });
        }
        const brand = brandMap.get(name)!;
        brand.filamentCount++;
        if (f.updated_at && (!brand.lastUpdated || f.updated_at > brand.lastUpdated)) {
          brand.lastUpdated = f.updated_at;
        }
      });

      // Process printers (by brand name from printer_brands)
      const brandIdToName = new Map(printerBrands?.map(b => [b.brand, b.brand]) || []);
      printers?.forEach(p => {
        // Get brand name - this is simplified, in reality you'd join tables
        const brandId = p.brand_id;
        // For simplicity, we'll just count printer brands separately
      });

      // Count printers by brand
      const { data: printersWithBrand } = await supabase
        .from("printers")
        .select("id, printer_brands(brand)")
        .eq("status", "active");
      
      printersWithBrand?.forEach((p: any) => {
        const brandName = p.printer_brands?.brand;
        if (!brandName) return;
        if (!brandMap.has(brandName)) {
          brandMap.set(brandName, {
            name: brandName,
            filamentCount: 0,
            printerCount: 0,
            hotendCount: 0,
            buildPlateCount: 0,
            hasAffiliate: affiliateVendors.has(brandName.toLowerCase()),
            dataScore: 0,
            lastUpdated: null
          });
        }
        brandMap.get(brandName)!.printerCount++;
      });

      // Process accessories
      accessories?.forEach(a => {
        if (!a.brand) return;
        const name = a.brand;
        if (!brandMap.has(name)) {
          brandMap.set(name, {
            name,
            filamentCount: 0,
            printerCount: 0,
            hotendCount: 0,
            buildPlateCount: 0,
            hasAffiliate: affiliateVendors.has(name.toLowerCase()),
            dataScore: 0,
            lastUpdated: null
          });
        }
        const brand = brandMap.get(name)!;
        if (a.accessory_type === 'hotend') brand.hotendCount++;
        if (a.accessory_type === 'build_plate') brand.buildPlateCount++;
      });

      // Calculate data scores
      brandMap.forEach((brand) => {
        const total = brand.filamentCount + brand.printerCount + brand.hotendCount + brand.buildPlateCount;
        // Simple score based on having products
        brand.dataScore = total > 0 ? Math.min(100, Math.round((total / 50) * 100)) : 0;
      });

      // Sort by total products
      const sortedBrands = Array.from(brandMap.values()).sort((a, b) => {
        const totalA = a.filamentCount + a.printerCount + a.hotendCount + a.buildPlateCount;
        const totalB = b.filamentCount + b.printerCount + b.hotendCount + b.buildPlateCount;
        return totalB - totalA;
      });

      setBrands(sortedBrands);
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

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
            <Building2 className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-foreground">Brand Management</h1>
          </div>
          <Button onClick={fetchBrands} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          {filteredBrands.length} brands found
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-6 bg-muted rounded w-32 mb-3"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBrands.map((brand) => (
              <Card key={brand.name} className="p-4 bg-card border-border hover:border-primary transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-lg">{brand.name}</h3>
                  {brand.hasAffiliate ? (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Affiliate
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <XCircle className="w-3 h-3 mr-1" />
                      No Affiliate
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Package className="w-3 h-3" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">{brand.filamentCount}</p>
                    <p className="text-xs text-muted-foreground">Filaments</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Database className="w-3 h-3" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">{brand.printerCount}</p>
                    <p className="text-xs text-muted-foreground">Printers</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Wrench className="w-3 h-3" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">{brand.hotendCount}</p>
                    <p className="text-xs text-muted-foreground">Hotends</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Square className="w-3 h-3" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">{brand.buildPlateCount}</p>
                    <p className="text-xs text-muted-foreground">Plates</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/admin/filaments?vendor=${encodeURIComponent(brand.name)}`)}
                  >
                    View Products
                  </Button>
                  {!brand.hasAffiliate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/admin/affiliates')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBrands;
