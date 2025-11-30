import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import { getBrandInfo } from "@/lib/brandInfo";
import type { Tables } from "@/integrations/supabase/types";

type Filament = Tables<"filaments">;

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

  const getPricePerKg = (price: number | null, weight: number | null) => {
    if (!price || !weight) return null;
    return ((price / weight) * 1000).toFixed(2);
  };

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
                  <h1 className="text-4xl font-bold mb-2">{decodedBrand}</h1>
                  {brandInfo && (
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {brandInfo.location && <span>📍 {brandInfo.location}</span>}
                      {brandInfo.founded && <span>📅 Founded {brandInfo.founded}</span>}
                    </div>
                  )}
                </div>
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
            {decodedBrand} Filaments {filaments && `(${filaments.length})`}
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading filaments...
          </div>
        ) : filaments && filaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filaments.map((filament) => (
              <Card
                key={filament.id}
                className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => navigate(`/filament/${filament.id}`)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-muted/30 to-muted/50 flex items-center justify-center relative">
                      {filament.featured_image && filament.featured_image.startsWith('http') ? (
                        <img
                          src={filament.featured_image}
                          alt={filament.product_title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && brandLogo) {
                              const placeholder = document.createElement('img');
                              placeholder.src = brandLogo;
                              placeholder.alt = decodedBrand;
                              placeholder.className = 'max-w-[60%] max-h-[60%] object-contain opacity-20';
                              parent.appendChild(placeholder);
                            }
                          }}
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
                              <span className="text-2xl font-bold text-primary">{filament.material?.charAt(0) || '📦'}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">{filament.material || 'Filament'}</div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {filament.product_title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {filament.material && (
                          <Badge variant="secondary">{filament.material}</Badge>
                        )}
                        {filament.color_family && (
                          <Badge variant="outline">{filament.color_family}</Badge>
                        )}
                      </div>
                      {filament.variant_price && filament.net_weight_g && (
                        <div className="text-xl font-bold text-primary">
                          ${getPricePerKg(filament.variant_price, filament.net_weight_g)}/kg
                        </div>
                      )}
                      {filament.net_weight_g && (
                        <p className="text-sm text-muted-foreground">
                          {filament.net_weight_g}g spool
                        </p>
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
