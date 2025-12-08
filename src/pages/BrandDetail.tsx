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

// Common color names to detect at the end of product titles
const COLOR_WORDS = [
  // Basic colors
  'Beige', 'Black', 'Blue', 'Brown', 'Burgundy', 'Charcoal', 'Copper', 'Cream', 'Cyan',
  'Gold', 'Gray', 'Grey', 'Green', 'Ivory', 'Lavender', 'Magenta', 'Maroon', 'Navy',
  'Olive', 'Orange', 'Peach', 'Pink', 'Purple', 'Red', 'Rose', 'Salmon', 'Silver',
  'Tan', 'Teal', 'Turquoise', 'Violet', 'White', 'Yellow', 'Kraft', 'Lemonade', 'Terracotta',
  'Bronze', 'Rust',
  // Stylized color names (Hatchbox PETG style)
  'Midnight', 'Peacock', 'Lake', 'Baby', 'Electric Lime', 'Dusk', 'Dawn', 'Sunset', 'Ocean',
  'Sky', 'Coral', 'Mint', 'Sage', 'Moss', 'Sand', 'Clay', 'Slate', 'Storm', 'Fog', 'Mist',
  'Eggplant', 'Caribbean', 'Pastel', 'Apple Sauce', 'Lemon', 'Electric', 'Neon', 'Arctic',
  'Crimson', 'Ruby', 'Sapphire', 'Emerald', 'Cobalt', 'Indigo', 'Plum', 'Wine', 'Berry',
  'Tangerine', 'Pumpkin', 'Caramel', 'Mocha', 'Espresso', 'Chocolate', 'Coffee', 'Butter',
  'Cream', 'Ivory', 'Pearl', 'Snow', 'Ice', 'Frost', 'Steel', 'Smoke', 'Charcoal', 'Onyx',
  'Jet', 'Raven', 'Shadow', 'Graphite', 'Gunmetal', 'Titanium', 'Chrome', 'Platinum',
  // Standalone modifier colors (Hatchbox style)
  'Light', 'Dark', 'Bright', 'Deep', 'Pale', 'Vivid',
  // Multi-word Hatchbox colors
  'Ash Gray', 'Stone Gray', 'Baby Pink', 'Blush Pink', 'Soft Purple', 'Light Lavender',
  'Cherry Red', 'Lemon Yellow', 'Seafoam Blue', 'Seafoam Green',
  'Baby Blue', 'Gray Blue', 'Lake Blue', 'Peacock Blue', 'Midnight Purple', 'Eggplant Purple',
  'Caribbean Green', 'Mint Green', 'Pastel Green', 'Forest Green',
  'Light Brown', 'Light Orange', 'Light Purple', 'Dark Yellow', 'Dark Green',
  'Transparent Black', 'Transparent Blue', 'Transparent Green', 'Transparent White',
  'Paint Free Brown',
  // Glow variants
  'Glow in the Dark', 'Glow in the Dark Blue', 'Glow in the Dark Green',
  // General multi-word colors
  'Light Blue', 'Dark Blue', 'Sky Blue', 'Royal Blue', 'Light Green',
  'Light Gray', 'Dark Gray', 'Light Grey', 'Dark Grey', 'Lime Green',
  'Hot Pink', 'Light Pink', 'Neon Green', 'Neon Orange', 'Neon Pink', 'Neon Yellow',
  'Glow Green', 'Glow Blue', 'True Black', 'True White', 'Jet Black', 'Snow White',
  'Natural', 'Clear', 'Transparent', 'Translucent',
];

// Extract base product name by removing color suffix
const getBaseProductName = (title: string): string => {
  // Normalize the title first - merge variant names into base product
  let normalizedTitle = title
    .replace(/\bPLA\s+PRO\+/gi, 'PLA+')  // "PLA PRO+" -> "PLA+"
    .replace(/\bPLA\s+PRO\b/gi, 'PLA+'); // "PLA PRO" -> "PLA+"
  
  // Pattern 1: "Brand Material - Color" (dash separator)
  const dashMatch = normalizedTitle.match(/^(.+?)\s+-\s+.+$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  
  // Pattern 1.5: Handle compound material names like "Metallic PLA", "Silk PLA", "Matte PLA", "PETG Rapid"
  // Match: "Brand CompoundMaterial Color" -> "Brand CompoundMaterial"
  const compoundMaterialMatch = normalizedTitle.match(/^(.+?\s+(?:Metallic|Silk|Matte|Marble|Galaxy|Sparkle|Glitter|Glow|Wood|Carbon|Glass|Rapid)\s+(?:PLA|PETG|ABS|TPU|ASA))\s+.+$/i);
  if (compoundMaterialMatch) {
    return compoundMaterialMatch[1].trim();
  }
  
  // Pattern 1.6: Handle "Material Rapid" pattern (e.g., "Hatchbox PETG Rapid Black" -> "Hatchbox PETG Rapid")
  const materialRapidMatch = normalizedTitle.match(/^(.+?\s+(?:PLA|PETG|ABS|TPU|ASA)\s+Rapid)\s+.+$/i);
  if (materialRapidMatch) {
    return materialRapidMatch[1].trim();
  }
  
  // Pattern 1.7: Handle "Carbon Fiber Material" pattern (e.g., "Hatchbox Carbon Fiber PLA" as standalone product)
  const carbonFiberMatch = normalizedTitle.match(/^(.+?\s+Carbon\s+Fiber\s+(?:PLA|PETG|ABS|TPU|ASA))$/i);
  if (carbonFiberMatch) {
    return carbonFiberMatch[1].trim();
  }
  
  // Pattern 2: Check for color word at the end (case-insensitive)
  // Sort by length descending to match longer colors first ("Light Blue" before "Blue")
  const sortedColors = [...COLOR_WORDS].sort((a, b) => b.length - a.length);
  
  for (const color of sortedColors) {
    const regex = new RegExp(`^(.+?)\\s+${color}$`, 'i');
    const match = normalizedTitle.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  
  // No color found - return normalized title
  return normalizedTitle;
};

// Extract color from product title
const getColorFromTitle = (title: string, baseName: string): string | null => {
  if (title === baseName) return null;
  
  // Pattern 1: Dash separator
  const dashMatch = title.match(/^.+?\s+-\s+(.+)$/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  
  // Pattern 2: Color at the end
  const sortedColors = [...COLOR_WORDS].sort((a, b) => b.length - a.length);
  
  for (const color of sortedColors) {
    const regex = new RegExp(`\\s+${color}$`, 'i');
    if (title.match(regex)) {
      // Return the actual color from the title (preserving case)
      const extractedColor = title.slice(baseName.length).trim();
      return extractedColor || color;
    }
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

      // Use first available image as representative (supports both http URLs and local paths)
      if (!group.representativeImage && filament.featured_image) {
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
                              const colorName = getColorFromTitle(variant.product_title, product.baseName) || variant.color_family;
                              const hasColorHex = !!variant.color_hex;
                              
                              return (
                                <button
                                  key={variant.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/filament/${variant.id}`);
                                  }}
                                  className="group/swatch relative"
                                  title={colorName || variant.product_title}
                                >
                                  {hasColorHex ? (
                                    <div 
                                      className="w-7 h-7 rounded-full border-2 border-border hover:border-primary hover:scale-110 transition-all shadow-sm"
                                      style={{ 
                                        backgroundColor: variant.color_hex || '#888',
                                        boxShadow: variant.color_hex === '#FFFFFF' || variant.color_hex === '#ffffff' 
                                          ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' 
                                          : undefined
                                      }}
                                    />
                                  ) : (
                                    <div className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-primary/20 hover:text-primary transition-colors flex items-center gap-1">
                                      <span className="w-3 h-3 rounded-full bg-gradient-to-br from-muted-foreground/30 to-muted-foreground/10 border border-border" />
                                      {colorName || 'View'}
                                    </div>
                                  )}
                                  {/* Tooltip on hover */}
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover/swatch:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-border">
                                    {colorName || variant.product_title}
                                  </div>
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
