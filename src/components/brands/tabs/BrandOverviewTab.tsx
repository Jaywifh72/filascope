import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Leaf, Cpu, Package, Layers, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { MaterialBadge } from "@/components/MaterialBadge";

type Filament = Tables<"filaments">;

interface GroupedProduct {
  baseName: string;
  material: string | null;
  variants: Filament[];
  representativeImage: string | null;
  priceRange: { min: number; max: number } | null;
  categoryUrl: string | null;
}

interface BrandOverviewTabProps {
  brandName: string;
  brandLogo: string | null;
  groupedProducts: GroupedProduct[];
  availableMaterials: string[];
  hasHighSpeedProducts: boolean;
  hasEcoSpools: boolean;
  hasRFID: boolean;
  onViewAllProducts: () => void;
}

export function BrandOverviewTab({
  brandName,
  brandLogo,
  groupedProducts,
  availableMaterials,
  hasHighSpeedProducts,
  hasEcoSpools,
  hasRFID,
  onViewAllProducts,
}: BrandOverviewTabProps) {
  const navigate = useNavigate();

  // Build highlights
  const highlights: Array<{ icon: React.ReactNode; label: string; value: string; highlight?: boolean }> = [];

  if (hasHighSpeedProducts) {
    highlights.push({
      icon: <Zap className="w-4 h-4" />,
      label: "High-Speed Ready",
      value: "Optimized for high-speed printing",
      highlight: true,
    });
  }

  if (hasEcoSpools) {
    highlights.push({
      icon: <Leaf className="w-4 h-4" />,
      label: "Eco-Friendly Spools",
      value: "Cardboard or recyclable spool materials",
    });
  }

  if (hasRFID) {
    highlights.push({
      icon: <Cpu className="w-4 h-4" />,
      label: "RFID Enabled",
      value: "Automatic filament recognition",
    });
  }

  if (availableMaterials.length > 5) {
    highlights.push({
      icon: <Package className="w-4 h-4" />,
      label: "Wide Material Selection",
      value: `${availableMaterials.length} different material types`,
    });
  }

  // Popular products (first 6)
  const popularProducts = groupedProducts.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Brand Highlights */}
      {highlights.length > 0 && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Brand Highlights</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    highlight.highlight
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-muted/30"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      highlight.highlight
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {highlight.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{highlight.label}</div>
                    <div className="text-xs text-muted-foreground">{highlight.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Products Carousel */}
      {popularProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Popular Products</h3>
            <Button variant="ghost" size="sm" onClick={onViewAllProducts} className="text-primary">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularProducts.map((product) => (
              <Card
                key={product.baseName}
                className="bg-card/50 border-border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => navigate(`/filament/${product.variants[0].id}`)}
              >
                <CardContent className="p-3">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center mb-2">
                    {product.representativeImage ? (
                      <img
                        src={product.representativeImage}
                        alt={product.baseName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : brandLogo ? (
                      <img
                        src={brandLogo}
                        alt={brandName}
                        className="max-w-[50%] max-h-[50%] object-contain opacity-30"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-xs font-medium line-clamp-2 mb-1">
                    {product.baseName.replace(/\s+[\d.]+mm\s+[\d.]+kg\s+Filament$/i, "")}
                  </div>
                  {product.material && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {product.material}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Materials Offered */}
      {availableMaterials.length > 0 && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Materials Offered</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableMaterials.map((material) => (
                <MaterialBadge key={material} material={material} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
