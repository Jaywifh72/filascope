import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDot, Square, Layers } from "lucide-react";
import HotendList from "@/components/HotendList";
import BuildPlateList from "@/components/BuildPlateList";
import AMSList from "@/components/AMSList";

const categories = [
  {
    id: "hotends",
    title: "Hotends",
    description: "Nozzles, hotend assemblies, and heating components for precise filament extrusion",
    icon: CircleDot,
    gradient: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-500",
  },
  {
    id: "build-plates",
    title: "Build Plates",
    description: "Print beds, magnetic surfaces, and textured plates for optimal first layer adhesion",
    icon: Square,
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    id: "ams",
    title: "AMS/MMU",
    description: "Automatic Material Systems and Multi-Material Units for multi-color printing",
    icon: Layers,
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500",
  },
];

export default function Accessories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleCategoryClick = (categoryId: string) => {
    setSearchParams({ tab: categoryId });
  };

  // If no tab selected, show category cards
  if (!activeTab) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1800px] mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold tracking-tight">Accessories</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upgrade and customize your 3D printer with hotends, build plates, and multi-material systems
            </p>
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-border/50 bg-gradient-to-br ${category.gradient} backdrop-blur-sm`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <CardHeader className="pb-4">
                    <div className={`w-14 h-14 rounded-xl bg-background/80 flex items-center justify-center mb-4 ${category.iconColor}`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <CardTitle className="text-2xl">{category.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-primary font-medium">
                      Browse {category.title}
                      <span className="ml-2">→</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // If tab is selected, show the tabbed view
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
