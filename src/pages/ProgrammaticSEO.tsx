import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { FilamentCard } from "@/components/FilamentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, TrendingDown, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

/**
 * Generic Programmatic SEO Page
 * 
 * Serves brand×material, best-material, and price-target pages.
 * The page type and data are determined from the URL pattern.
 */
export function ProgrammaticSEOPage() {
  const location = useLocation();
  const path = location.pathname;

  // Determine page type from URL
  let pageType: "brand-material" | "best-material" | "price-target" | null = null;
  let material: string | null = null;
  let brand: string | null = null;
  let maxPrice: number | null = null;

  // /compare/{material}/{brand}
  const brandMaterialMatch = path.match(/^\/compare\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
  if (brandMaterialMatch) {
    pageType = "brand-material";
    material = brandMaterialMatch[1];
    brand = brandMaterialMatch[2];
  }

  // /best-{material}-under-{price}
  const priceTargetMatch = path.match(/^\/best-([a-z0-9-]+)-under-(\d+)$/);
  if (priceTargetMatch) {
    pageType = "price-target";
    material = priceTargetMatch[1];
    maxPrice = parseInt(priceTargetMatch[2]);
  }

  // /best-{material}
  const bestMatch = path.match(/^\/best-([a-z0-9-]+)$/);
  if (bestMatch && !priceTargetMatch) {
    pageType = "best-material";
    material = bestMatch[1];
  }

  // Fetch filaments based on page type
  const { data: filaments = [], isLoading } = useQuery({
    queryKey: ["seo-page", pageType, material, brand, maxPrice],
    queryFn: async () => {
      let query = supabase
        .from("filaments")
        .select("id, product_title, vendor, material, variant_price, featured_image, color_family, color_hex, transmission_distance, nozzle_temp_min_c, nozzle_temp_max_c")
        .eq("variant_available", true)
        .gt("variant_price", 0)
        .order("variant_price", { ascending: true })
        .limit(50);

      if (pageType === "brand-material") {
        // Match material (case-insensitive, handle hyphens)
        const materialNames = getMaterialNames(material!);
        query = query.in("material", materialNames);
        // Match brand slug
        const brandNames = await getBrandNames(brand!);
        if (brandNames.length > 0) {
          query = query.in("vendor", brandNames);
        }
      } else {
        // best-material or price-target
        const materialNames = getMaterialNames(material!);
        query = query.in("material", materialNames);
        if (maxPrice) {
          query = query.lte("variant_price", maxPrice);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!pageType,
  });

  // Build page metadata
  const materialDisplay = material ? material.replace(/-/g, ' ').toUpperCase() : '';
  const brandDisplay = brand ? brand.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';

  let title = '';
  let description = '';
  let h1 = '';

  if (pageType === 'brand-material') {
    title = `${brandDisplay} ${materialDisplay} Filament — Prices, Specs & Reviews | FilaScope`;
    description = `Compare ${filaments.length} ${brandDisplay} ${materialDisplay} filaments. Best prices, specs, and reviews.`;
    h1 = `${brandDisplay} ${materialDisplay} Filament`;
  } else if (pageType === 'price-target') {
    title = `Best ${materialDisplay} Filament Under $${maxPrice} — ${filaments.length} Options | FilaScope`;
    description = `${filaments.length} ${materialDisplay} filaments under $${maxPrice}. Compare prices and find the best value.`;
    h1 = `Best ${materialDisplay} Under $${maxPrice}`;
  } else {
    title = `Best ${materialDisplay} Filament ${new Date().getFullYear()} — Top Picks | FilaScope`;
    description = `Compare the best ${materialDisplay} filaments in ${new Date().getFullYear()}. Prices, specs, and expert picks.`;
    h1 = `Best ${materialDisplay} Filament (${new Date().getFullYear()})`;
  }

  if (!pageType) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
        <Link to="/"><Button variant="outline">Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DocumentHead
        title={title}
        description={description}
        canonicalPath={path}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>›</span>
        <Link to="/filaments" className="hover:text-foreground">Filaments</Link>
        <span>›</span>
        {pageType === 'brand-material' ? (
          <>
            <Link to={`/filaments/${material}`} className="hover:text-foreground">{materialDisplay}</Link>
            <span>›</span>
            <span className="text-foreground">{brandDisplay}</span>
          </>
        ) : (
          <span className="text-foreground">{h1}</span>
        )}
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">{h1}</h1>
        <p className="text-muted-foreground text-lg">{description}</p>
        <div className="flex gap-2 mt-3">
          <Badge variant="secondary">
            <Package className="h-3 w-3 mr-1" />
            {filaments.length} filaments
          </Badge>
          {maxPrice && (
            <Badge variant="outline">
              <TrendingDown className="h-3 w-3 mr-1" />
              Under ${maxPrice}
            </Badge>
          )}
        </div>
      </div>

      {/* Filament Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filaments.map((f) => (
            <Link key={f.id} to={`/filament/${f.id}`}>
              <Card className="h-full hover:scale-[1.02] transition-transform">
                <div className="h-32 flex items-center justify-center p-4">
                  {f.featured_image ? (
                    <img
                      src={f.featured_image}
                      alt={f.product_title}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{f.vendor}</p>
                  <p className="text-sm font-medium line-clamp-2">{f.product_title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-green-400">${f.variant_price?.toFixed(2)}</span>
                    {f.transmission_distance && (
                      <Badge variant="outline" className="text-[10px]">TD: {f.transmission_distance}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Back Link */}
      <div className="mt-8">
        <Link to="/filaments">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Browse All Filaments
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Helper: map URL slug to possible material names in DB
function getMaterialNames(slug: string): string[] {
  const map: Record<string, string[]> = {
    'pla': ['PLA', 'PLA+', 'PLA Plus', 'Silk PLA', 'High-Speed PLA', 'PLA-CF'],
    'petg': ['PETG', 'PETG-CF', 'PETG+'],
    'abs': ['ABS', 'ABS+', 'ABS-CF'],
    'tpu': ['TPU', 'TPU-HP', 'Flexible TPU'],
    'asa': ['ASA', 'ASA-CF', 'ASA+'],
    'nylon': ['Nylon', 'PA6', 'PA12', 'PA-CF', 'Nylon-CF'],
    'pc': ['PC', 'PC-CF', 'Polycarbonate'],
    'pva': ['PVA'],
    'hips': ['HIPS'],
    'pet-cf': ['PET-CF'],
    'pps': ['PPS', 'PPS-CF'],
    'pa6-cf': ['PA6-CF', 'PA-CF'],
  };
  return map[slug] || [slug.toUpperCase()];
}

// Helper: find brand names from slug
async function getBrandNames(slug: string): Promise<string[]> {
  const { data } = await supabase
    .from('filaments')
    .select('vendor')
    .limit(5000);
  
  if (!data) return [];
  
  const vendors = [...new Set(data.map(d => d.vendor).filter(Boolean))];
  return vendors.filter(v => {
    const vSlug = v!.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return vSlug === slug;
  }) as string[];
}
