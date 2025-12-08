import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Package, BadgeCheck } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";

// Brands that have been lab-tested/verified
const VERIFIED_BRANDS = [
  "Bambu Lab",
  "Prusament", 
  "Polymaker",
  "ColorFabb",
  "Fillamentum",
  "eSUN",
  "Hatchbox",
  "Overture",
  "MatterHackers",
];

const Brands = () => {
  const navigate = useNavigate();
  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("vendor")
        .not("vendor", "is", null);
      
      if (error) throw error;
      
      const brandCounts = data.reduce((acc, f) => {
        acc[f.vendor] = (acc[f.vendor] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(brandCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Filament Brands</h1>
          <p className="text-muted-foreground">Browse filaments by manufacturer</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading brands...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {brands?.map((brand) => {
              const logoUrl = getBrandLogo(brand.name);
              const isVerified = VERIFIED_BRANDS.includes(brand.name);
              return (
                <div 
                  key={brand.name} 
                  className="bg-[#1A1A1A] border border-[#333] rounded-lg hover:border-primary transition-all duration-200 cursor-pointer group"
                  onClick={() => navigate(`/brands/${encodeURIComponent(brand.name)}`)}
                >
                  <div className="p-6">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-full h-24 flex items-center justify-center bg-background/50 rounded-lg p-4">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={brand.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="w-8 h-8 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="text-center space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <h3 className="font-inter font-bold text-lg text-white group-hover:text-primary transition-colors">
                            {brand.name}
                          </h3>
                          {isVerified && (
                            <BadgeCheck className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <p className="font-mono text-sm text-muted-foreground">{brand.count} filaments</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Brands;
