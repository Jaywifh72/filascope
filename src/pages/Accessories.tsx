import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleDot, Square, Layers } from "lucide-react";
import HotendList from "@/components/HotendList";
import BuildPlateList from "@/components/BuildPlateList";
import AMSList from "@/components/AMSList";

// Read tab from URL on initial load only
const getInitialTab = () => {
  if (typeof window === "undefined") return "hotends";
  const params = new URLSearchParams(window.location.search);
  return params.get("tab") || "hotends";
};

export default function Accessories() {
  const [activeTab, setActiveTab] = useState(getInitialTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without causing navigation - use requestAnimationFrame to ensure it happens after render
    requestAnimationFrame(() => {
      const url = value === "hotends" ? "/accessories" : `/accessories?tab=${value}`;
      window.history.replaceState({}, "", url);
    });
  };

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
