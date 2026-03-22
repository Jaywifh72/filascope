import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CircleDot, Square, Layers } from "lucide-react";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
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
    <>
    <DocumentHead
      title="3D Printer Accessories — Hotends, Build Plates & AMS Systems | FilaScope"
      description={`Browse ${stats?.hotends || 200}+ hotends, ${stats?.buildPlates || 90} build plates, and ${stats?.amsSystems || 14} AMS/MMU systems from ${stats?.brands || 25} brands. Compare specs and prices.`}
      canonical="https://filascope.com/accessories"
    />
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <Breadcrumbs items={[{ name: "Accessories", url: "/accessories" }]} />

        {/* Header — compact */}
        <div className="space-y-2 pb-4 border-b border-border/50">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">3D Printer Accessories</h1>
          <p className="text-sm text-muted-foreground">
            Browse hotends, build plates, and multi-material systems from {stats?.brands || 25}+ brands.
          </p>
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
            Hotends{stats?.hotends ? <span className="text-xs text-muted-foreground ml-1">({stats.hotends})</span> : ''}
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
            Build Plates{stats?.buildPlates ? <span className="text-xs text-muted-foreground ml-1">({stats.buildPlates})</span> : ''}
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
            AMS/MMU{stats?.amsSystems ? <span className="text-xs text-muted-foreground ml-1">({stats.amsSystems})</span> : ''}
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
    </>
  );
}
