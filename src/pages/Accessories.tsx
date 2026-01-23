import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CircleDot, Square, Layers, Wrench } from "lucide-react";
import HotendList from "@/components/HotendList";
import BuildPlateList from "@/components/BuildPlateList";
import AMSList from "@/components/AMSList";
import { supabase } from "@/integrations/supabase/client";

export default function Accessories() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Default to "hotends" if no tab specified
  const activeTab = searchParams.get("tab") || "hotends";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Fetch accessory stats
  const { data: stats } = useQuery({
    queryKey: ["accessories-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_accessories")
        .select("accessory_type, brand");

      if (error) throw error;

      const hotends = data.filter(a => a.accessory_type === "hotend").length;
      const buildPlates = data.filter(a => a.accessory_type === "build_plate").length;
      const amsSystems = data.filter(a => a.accessory_type === "ams_mmu").length;
      const brands = new Set(data.map(a => a.brand).filter(Boolean)).size;

      return { hotends, buildPlates, amsSystems, brands };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Hero Header */}
        <div className="space-y-3 pb-4 sm:pb-6 border-b border-border/50">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs sm:text-sm font-medium">
            <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            UPGRADE CENTER
          </span>
          
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Accessories</h1>
          
          {/* Subtitle */}
          <p className="text-sm sm:text-base text-muted-foreground">
            Browse hotends, build plates, and multi-material systems for your 3D printer
          </p>
          
          {/* Quick Stats - Stack on mobile */}
          {stats && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-0 text-sm sm:text-base text-gray-400 mt-2">
              <span className="whitespace-nowrap">
                <span className="text-primary font-medium">{stats.hotends}</span> Hotends
              </span>
              <span className="hidden sm:inline mx-2">•</span>
              <span className="whitespace-nowrap">
                <span className="text-primary font-medium">{stats.buildPlates}</span> Build Plates
              </span>
              <span className="hidden sm:inline mx-2">•</span>
              <span className="whitespace-nowrap">
                <span className="text-primary font-medium">{stats.amsSystems}</span> AMS/MMU Systems
              </span>
              <span className="hidden sm:inline mx-2">•</span>
              <span className="whitespace-nowrap">
                <span className="text-primary font-medium">{stats.brands}</span> Brands
              </span>
            </div>
          )}
        </div>

        {/* Tabs - Horizontal scroll on mobile, or 2x2 grid */}
        <div className="flex gap-4 sm:gap-8 border-b border-gray-700 overflow-x-auto scrollbar-hide pb-px -mb-px">
          <button
            onClick={() => handleTabChange("hotends")}
            className={`pb-3 flex items-center gap-2 text-sm font-medium transition-all duration-300 relative whitespace-nowrap min-w-fit ${
              activeTab === "hotends" ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <CircleDot className="w-4 h-4" />
            Hotends
            <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-300 ${
              activeTab === "hotends" ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
            }`} />
          </button>
          <button
            onClick={() => handleTabChange("build-plates")}
            className={`pb-3 flex items-center gap-2 text-sm font-medium transition-all duration-300 relative whitespace-nowrap min-w-fit ${
              activeTab === "build-plates" ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <Square className="w-4 h-4" />
            Build Plates
            <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-300 ${
              activeTab === "build-plates" ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
            }`} />
          </button>
          <button
            onClick={() => handleTabChange("ams")}
            className={`pb-3 flex items-center gap-2 text-sm font-medium transition-all duration-300 relative whitespace-nowrap min-w-fit ${
              activeTab === "ams" ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            AMS/MMU
            <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-300 ${
              activeTab === "ams" ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
            }`} />
          </button>
        </div>

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>

          <TabsContent value="hotends" className="mt-6">
            <HotendList />
          </TabsContent>

          <TabsContent value="build-plates" className="mt-6">
            <BuildPlateList />
          </TabsContent>

          <TabsContent value="ams" className="mt-6">
            <AMSList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
