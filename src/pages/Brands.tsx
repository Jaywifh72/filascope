import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Package, BadgeCheck, Zap, Radio } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";

// Custom Plastic Spool Icon
const PlasticSpoolIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v6" />
    <path d="M12 15v6" />
    <path d="M3 12h6" />
    <path d="M15 12h6" />
  </svg>
);

// Custom Cardboard Spool Icon (with recycling indicator)
const CardboardSpoolIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M9 9l-2-2" />
    <path d="M15 9l2-2" />
    <path d="M9 15l-2 2" />
    <path d="M15 15l2 2" />
  </svg>
);

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

interface BrandStats {
  name: string;
  count: number;
  spoolMaterial: "Cardboard" | "Plastic" | "Mixed" | null;
  hasHighSpeed: boolean;
  avgTransmissionDistance: number | null;
}

const Brands = () => {
  const navigate = useNavigate();
  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("vendor, spool_material, transmission_distance, high_speed_capable")
        .not("vendor", "is", null);
      
      if (error) throw error;
      
      const brandStats = data.reduce((acc, f) => {
        if (!acc[f.vendor]) {
          acc[f.vendor] = {
            count: 0,
            hasCardboard: false,
            hasPlastic: false,
            hasHighSpeed: false,
            transmissionDistances: [] as number[],
          };
        }
        acc[f.vendor].count += 1;
        if (f.spool_material === "Cardboard") {
          acc[f.vendor].hasCardboard = true;
        }
        if (f.spool_material === "Plastic") {
          acc[f.vendor].hasPlastic = true;
        }
        if (f.high_speed_capable) {
          acc[f.vendor].hasHighSpeed = true;
        }
        if (f.transmission_distance != null) {
          acc[f.vendor].transmissionDistances.push(f.transmission_distance);
        }
        return acc;
      }, {} as Record<string, { count: number; hasCardboard: boolean; hasPlastic: boolean; hasHighSpeed: boolean; transmissionDistances: number[] }>);
      
      return Object.entries(brandStats)
        .map(([name, stats]): BrandStats => {
          let spoolMaterial: BrandStats["spoolMaterial"] = null;
          if (stats.hasCardboard && stats.hasPlastic) {
            spoolMaterial = "Mixed";
          } else if (stats.hasCardboard) {
            spoolMaterial = "Cardboard";
          } else if (stats.hasPlastic) {
            spoolMaterial = "Plastic";
          }
          return {
            name,
            count: stats.count,
            spoolMaterial,
            hasHighSpeed: stats.hasHighSpeed,
            avgTransmissionDistance: stats.transmissionDistances.length > 0
              ? Math.round(stats.transmissionDistances.reduce((a, b) => a + b, 0) / stats.transmissionDistances.length)
              : null,
          };
        })
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
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <h3 className="font-inter font-bold text-lg text-white group-hover:text-primary transition-colors">
                            {brand.name}
                          </h3>
                          {isVerified && (
                            <BadgeCheck className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <p className="font-mono text-sm text-muted-foreground">{brand.count} filaments</p>
                        
                        {/* Feature Tags */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                          {brand.spoolMaterial === "Cardboard" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              <CardboardSpoolIcon className="w-3 h-3" />
                              Cardboard
                            </span>
                          )}
                          {brand.spoolMaterial === "Plastic" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              <PlasticSpoolIcon className="w-3 h-3" />
                              Plastic
                            </span>
                          )}
                          {brand.spoolMaterial === "Mixed" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-gray-500/20 text-gray-400 border border-gray-500/30">
                              <PlasticSpoolIcon className="w-3 h-3" />
                              Mixed
                            </span>
                          )}
                          {brand.hasHighSpeed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-primary/20 text-primary border border-primary/30">
                              <Zap className="w-3 h-3" />
                              High Speed
                            </span>
                          )}
                          {brand.avgTransmissionDistance != null && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              <Radio className="w-3 h-3" />
                              {brand.avgTransmissionDistance}m
                            </span>
                          )}
                        </div>
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
