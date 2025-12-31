import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag, ExternalLink } from "lucide-react";

const Deals = () => {
  const { data: deals, isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, filament:filaments(*)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Tag className="w-8 h-8 text-red-400" />
            Filament Deals
          </h1>
          <p className="text-muted-foreground">Current sales and discounts on filaments</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading deals...</div>
        ) : deals && deals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals
              .filter((deal) => !deal.filament?.net_weight_g || deal.filament.net_weight_g >= 300) // Exclude small/sample spools
              .map((deal) => {
              const discount = deal.original_price 
                ? Math.round(((deal.original_price - deal.deal_price) / deal.original_price) * 100)
                : 0;

              return (
                <Card key={deal.id} className="bg-card border-border hover:border-red-400/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{deal.filament?.product_title || "Unknown Filament"}</CardTitle>
                      {discount > 0 && (
                        <Badge className="bg-red-500 text-white">-{discount}%</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{deal.filament?.vendor}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-red-400">${deal.deal_price} <span className="text-sm font-medium">USD</span></span>
                        {deal.original_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${deal.original_price} USD
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>Region: {deal.region}</p>
                      </div>
                      {deal.affiliate_link && (
                        <Button className="w-full bg-red-500 hover:bg-red-600" asChild>
                          <a href={deal.affiliate_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Deal
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No active deals at the moment</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon for new deals!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Deals;
