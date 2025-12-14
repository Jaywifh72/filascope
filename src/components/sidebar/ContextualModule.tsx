import { Sparkles, TrendingUp, Printer, Calendar } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserPersonalization } from "@/hooks/useUserPersonalization";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarModule } from "./SidebarModule";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSeasonalRecommendations } from "@/lib/personalizationService";

export function ContextualModule() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentMaterial = searchParams.get("material");
  const { topMaterials, selectedPrinter, hasPrinterContext } = useUserPersonalization();

  // Get seasonal recommendations
  const seasonal = getSeasonalRecommendations();

  // Fetch new filaments in user's interest areas
  const { data: newInInterests } = useQuery({
    queryKey: ["new-in-interests", topMaterials],
    queryFn: async () => {
      if (!topMaterials.length) return [];
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("filaments")
        .select("id, product_title, material, vendor")
        .in("material", topMaterials)
        .gte("created_at", sevenDaysAgo.toISOString())
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: topMaterials.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  // Determine what contextual content to show
  const showMaterialContext = currentMaterial && currentMaterial !== "All";
  const showPrinterContext = hasPrinterContext;
  const showNewInInterests = newInInterests && newInInterests.length > 0;
  const showSeasonal = !showMaterialContext && !showNewInInterests;

  // Don't show if nothing to display
  if (!showMaterialContext && !showPrinterContext && !showNewInInterests && !showSeasonal) {
    return null;
  }

  return (
    <SidebarModule
      title="For You"
      moduleName="contextual"
      icon={<Sparkles className="h-4 w-4" />}
    >
      <div className="space-y-3">
        {/* Current material context */}
        {showMaterialContext && (
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Browsing {currentMaterial}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => navigate(`/deals?material=${currentMaterial}`)}
              >
                {currentMaterial} Deals
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => navigate(`/materials/compare?materials=${currentMaterial}`)}
              >
                Compare Materials
              </Button>
            </div>
          </div>
        )}

        {/* Printer context */}
        {showPrinterContext && selectedPrinter && (
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Printer className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">
                For your {selectedPrinter.model_name}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">
              Showing compatible materials only
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => navigate(`/printers/${selectedPrinter.id}`)}
            >
              View printer details →
            </Button>
          </div>
        )}

        {/* New in user's interest areas */}
        {showNewInInterests && (
          <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">
                New in {topMaterials[0]}
              </span>
              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                {newInInterests.length} new
              </Badge>
            </div>
            <div className="space-y-1">
              {newInInterests.slice(0, 2).map((f) => (
                <button
                  key={f.id}
                  onClick={() => navigate(`/filament/${f.id}`)}
                  className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
                >
                  {f.product_title}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-0 mt-1"
              onClick={() => navigate(`/?material=${topMaterials[0]}`)}
            >
              Explore new {topMaterials[0]} →
            </Button>
          </div>
        )}

        {/* Seasonal recommendations */}
        {showSeasonal && (
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium">{seasonal.message}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {seasonal.materials.slice(0, 3).map((material) => (
                <Button
                  key={material}
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => navigate(`/?material=${material}`)}
                >
                  {material}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </SidebarModule>
  );
}
