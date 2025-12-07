import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Building2, MapPin, Calendar, Users, Globe, TrendingUp } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import { getBrandInfo } from "@/lib/brandInfo";
import type { Tables } from "@/integrations/supabase/types";
import { useMemo } from "react";

type Filament = Tables<"filaments">;

interface GroupedProduct {
  baseName: string;
  material: string | null;
  variants: Filament[];
  representativeImage: string | null;
  priceRange: { min: number | null; max: number | null };
  productUrl: string | null;
}

// Extract base product name by removing color suffix
const getBaseProductName = (title: string): string => {
  // Pattern: "Brand Material - Color" or "Brand Material Color"
  // Try to match " - " separator first
  const dashMatch = title.match(/^(.+?)\s+-\s+.+$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  
  // For products without separator, return as-is (single products like NonOilen)
  return title;
};

// Extract color from product title
const getColorFromTitle = (title: string, baseName: string): string | null => {
  if (title === baseName) return null;
  
  const dashMatch = title.match(/^.+?\s+-\s+(.+)$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  
  return null;
};

const BrandDetail = () => {
  const { brand } = useParams<{ brand: string }>();
  const navigate = useNavigate();
  const decodedBrand = brand ? decodeURIComponent(brand) : "";

  const brandInfo = getBrandInfo(decodedBrand);
  const brandLogo = getBrandLogo(decodedBrand);

  const { data: filaments, isLoading } = useQuery({
    queryKey: ["brand-filaments", decodedBrand],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .eq("vendor", decodedBrand)
        .order("product_title");

      if (error) throw error;
      return data as Filament[];
    },
    enabled: !!decodedBrand,
  });

  // Group filaments by base product name
  const groupedProducts = useMemo(() => {
    if (!filaments) return [];

    const groups = new Map<string, GroupedProduct>();

    filaments.forEach((filament) => {
      const baseName = getBaseProductName(filament.product_title);
      
      if (!groups.has(baseName)) {
        groups.set(baseName, {
          baseName,
          material: filament.material,
          variants: [],
          representativeImage: null,
          priceRange: { min: null, max: null },
          productUrl: filament.product_url,
        });
      }

      const group = groups.get(baseName)!;
      group.variants.push(filament);

      // Use first available image as representative
      if (!group.representativeImage && filament.featured_image?.startsWith('http')) {
        group.representativeImage = filament.featured_image;
      }

      // Track price range
      if (filament.variant_price) {
        if (group.priceRange.min === null || filament.variant_price < group.priceRange.min) {
          group.priceRange.min = filament.variant_price;
        }
        if (group.priceRange.max === null || filament.variant_price > group.priceRange.max) {
          group.priceRange.max = filament.variant_price;
        }
      }
    });

    return Array.from(groups.values()).sort((a, b) => a.baseName.localeCompare(b.baseName));
  }, [filaments]);

  const getPricePerKg = (price: number | null) => {
    if (!price) return null;
    return price.toFixed(2);
  };

  const getCompanyTypeLabel = (type: string | undefined) => {
    switch (type) {
      case 'public': return 'Publicly Traded';
      case 'private': return 'Private Company';
      case 'subsidiary': return 'Subsidiary';
      case 'open-source': return 'Open Source Project';
      default: return null;
    }
  };

  const getCompanyTypeBadgeVariant = (type: string | undefined): "default" | "secondary" | "outline" | "destructive" => {
    switch (type) {
      case 'public': return 'default';
      case 'private': return 'secondary';
      case 'subsidiary': return 'outline';
      case 'open-source': return 'outline';
      default: return 'secondary';
    }
  };

  const totalVariants = filaments?.length || 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/brands")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Brands
        </Button>

        {/* Brand Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {brandLogo && (
                <div className="w-full md:w-48 h-32 flex items-center justify-center bg-background rounded-lg p-6 shrink-0">
                  <img
                    src={brandLogo}
                    alt={decodedBrand}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold">{decodedBrand}</h1>
                    {brandInfo?.companyType && (
                      <Badge variant={getCompanyTypeBadgeVariant(brandInfo.companyType)}>
                        {getCompanyTypeLabel(brandInfo.companyType)}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Quick Info Row */}
                  {brandInfo && (
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      {brandInfo.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {brandInfo.location}
                        </span>
                      )}
                      {brandInfo.founded && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Founded {brandInfo.founded}
                        </span>
                      )}
                      {brandInfo.employees && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {brandInfo.employees} employees
                        </span>
                      )}
                      {brandInfo.website && (
                        <a 
                          href={brandInfo.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Globe className="w-4 h-4" />
                          Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Company Details Grid */}
                {brandInfo && (brandInfo.headquarters || brandInfo.founder || brandInfo.ceo || brandInfo.president || brandInfo.parentCompany || brandInfo.subsidiaries || brandInfo.stockTicker) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border">
                    {brandInfo.headquarters && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Headquarters</div>
                        <div className="text-sm font-medium">{brandInfo.headquarters}</div>
                      </div>
                    )}
                    
                    {(brandInfo.founder || brandInfo.ceo || brandInfo.president) && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                          {brandInfo.ceo ? 'CEO' : brandInfo.president ? 'President' : 'Founder'}
                        </div>
                        <div className="text-sm font-medium">
                          {brandInfo.ceo || brandInfo.president || brandInfo.founder}
                        </div>
                      </div>
                    )}
                    
                    {brandInfo.parentCompany && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Parent Company</div>
                        <div className="text-sm font-medium">{brandInfo.parentCompany}</div>
                      </div>
                    )}
                    
                    {brandInfo.subsidiaries && brandInfo.subsidiaries.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Subsidiaries</div>
                        <div className="text-sm font-medium">{brandInfo.subsidiaries.join(', ')}</div>
                      </div>
                    )}
                    
                    {brandInfo.stockTicker && brandInfo.stockExchange && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Stock
                        </div>
                        <div className="text-sm font-medium">
                          {brandInfo.stockTicker} ({brandInfo.stockExchange})
                        </div>
                      </div>
                    )}
                    
                    {brandInfo.revenue && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Revenue</div>
                        <div className="text-sm font-medium">{brandInfo.revenue}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary */}
                {brandInfo ? (
                  <p className="text-foreground leading-relaxed whitespace-pre-line">
                    {brandInfo.summary}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    Information about {decodedBrand} coming soon.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filaments Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">
            {decodedBrand} Products ({groupedProducts.length} products, {totalVariants} variants)
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading filaments...
          </div>
        ) : groupedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedProducts.map((product) => (
              <Card
                key={product.baseName}
                className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => navigate(`/filament/${product.variants[0].id}`)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Product Image */}
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                      {product.representativeImage ? (
                        <img
                          src={product.representativeImage}
                          alt={product.baseName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <>
                          {brandLogo && (
                            <img
                              src={brandLogo}
                              alt={decodedBrand}
                              className="max-w-[60%] max-h-[60%] object-contain opacity-20"
                            />
                          )}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                              <span className="text-2xl font-bold text-primary">{product.material?.charAt(0) || '📦'}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">{product.material || 'Filament'}</div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">{product.baseName}</h3>
                      
                      <div className="flex flex-wrap gap-2">
                        {product.material && (
                          <Badge variant="secondary">{product.material}</Badge>
                        )}
                        <Badge variant="outline">{product.variants.length} color{product.variants.length !== 1 ? 's' : ''}</Badge>
                      </div>

                      {/* Price Range */}
                      {product.priceRange.min && (
                        <div className="text-lg font-bold text-primary">
                          {product.priceRange.min === product.priceRange.max 
                            ? `$${getPricePerKg(product.priceRange.min)}/kg`
                            : `$${getPricePerKg(product.priceRange.min)} - $${getPricePerKg(product.priceRange.max)}/kg`
                          }
                        </div>
                      )}

                      {/* Color Variants */}
                      {product.variants.length > 1 && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground mb-2">Available Colors:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {product.variants.map((variant) => {
                              const color = getColorFromTitle(variant.product_title, product.baseName) || variant.color_family;
                              return (
                                <button
                                  key={variant.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/filament/${variant.id}`);
                                  }}
                                  className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-primary/20 hover:text-primary transition-colors"
                                  title={color || variant.product_title}
                                >
                                  {color || 'View'}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Single product - direct link */}
                      {product.variants.length === 1 && (
                        <Button 
                          variant="outline" 
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/filament/${product.variants[0].id}`);
                          }}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No filaments found for {decodedBrand}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BrandDetail;
