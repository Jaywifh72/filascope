import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleDot, Square, Layers } from "lucide-react";
import HotendList from "@/components/HotendList";
import BuildPlateList from "@/components/BuildPlateList";
import AMSList from "@/components/AMSList";

export default function Accessories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const initialTab = searchParams.get("tab") || "hotends";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Log on mount
  useEffect(() => {
    console.log("[Accessories] MOUNTED - location:", location.pathname, location.search);
    console.log("[Accessories] Initial tab from URL:", initialTab);
    return () => {
      console.log("[Accessories] UNMOUNTED");
    };
  }, []);

  // Log tab state changes
  useEffect(() => {
    console.log("[Accessories] activeTab state changed to:", activeTab);
  }, [activeTab]);

  // Log location changes
  useEffect(() => {
    console.log("[Accessories] Location changed:", location.pathname, location.search);
  }, [location]);

  // Sync URL when tab changes (without causing navigation)
  useEffect(() => {
    const currentTab = searchParams.get("tab") || "hotends";
    console.log("[Accessories] URL sync effect - currentTab from URL:", currentTab, "activeTab state:", activeTab);
    
    if (currentTab !== activeTab) {
      console.log("[Accessories] Syncing URL - calling setSearchParams with tab:", activeTab);
      if (activeTab === "hotends") {
        setSearchParams({}, { replace: true });
      } else {
        setSearchParams({ tab: activeTab }, { replace: true });
      }
      console.log("[Accessories] setSearchParams called");
    }
  }, [activeTab, searchParams, setSearchParams]);

  const handleTabChange = (value: string) => {
    console.log("[Accessories] TAB CLICKED - changing from", activeTab, "to", value);
    setActiveTab(value);
  };

  console.log("[Accessories] RENDER - activeTab:", activeTab, "location:", location.pathname + location.search);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Accessories</h1>
          <p className="text-muted-foreground">
            Browse hotends, build plates, and multi-material systems for your 3D printer
          </p>
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
