import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Hero Header */}
        <div className="space-y-3 pb-6 border-b border-border/50">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
            <Wrench className="w-4 h-4" />
            UPGRADE CENTER
          </span>
          
          {/* Title */}
          <h1 className="text-4xl font-bold tracking-tight">Accessories</h1>
          
          {/* Subtitle */}
          <p className="text-muted-foreground">
            Browse hotends, build plates, and multi-material systems for your 3D printer
          </p>
          
          {/* Quick Stats */}
          {stats && (
            <p className="text-gray-400 mt-2">
              <span className="text-primary font-medium">{stats.hotends}</span> Hotends • {" "}
              <span className="text-primary font-medium">{stats.buildPlates}</span> Build Plates • {" "}
              <span className="text-primary font-medium">{stats.amsSystems}</span> AMS/MMU Systems • {" "}
              <span className="text-primary font-medium">{stats.brands}</span> Brands
            </p>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="hotends" className="gap-2">
              <CircleDot className="h-4 w-4" />
              Hotends
            </TabsTrigger>
            <TabsTrigger value="build-plates" className="gap-2">
              <Square className="h-4 w-4" />
              Build Plates
            </TabsTrigger>
            <TabsTrigger value="ams" className="gap-2">
              <Layers className="h-4 w-4" />
              AMS/MMU
            </TabsTrigger>
          </TabsList>

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
