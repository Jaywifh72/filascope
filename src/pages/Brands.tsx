import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

const Brands = () => {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands?.map((brand) => (
              <Card key={brand.name} className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    {brand.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{brand.count} filaments</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Brands;
