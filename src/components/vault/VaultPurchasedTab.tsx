import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import { VaultEmptyState } from "./VaultEmptyState";

export function VaultPurchasedTab() {
  const { user } = useAuth();

  const { data: purchases } = useQuery({
    queryKey: ["purchases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_purchases")
        .select("*, filaments(*)")
        .eq("user_id", user!.id)
        .order("purchase_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!purchases?.length) {
    return (
      <VaultEmptyState
        icon={ShoppingBag}
        title="No purchases recorded"
        description="Track your filament purchases to monitor spending and reorder easily."
        actionLabel="Browse Filaments"
        actionHref="/"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {purchases.map((purchase: any) => (
        <Card key={purchase.id} className="group hover:shadow-lg transition-all">
          <CardContent className="p-4">
            <Link to={`/filament/${purchase.filaments?.id}`} className="block">
              <div className="flex gap-4">
                {purchase.filaments?.featured_image && (
                  <img
                    src={purchase.filaments.featured_image}
                    alt={purchase.filaments.product_title}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{purchase.filaments?.product_title}</h3>
                  <p className="text-sm text-muted-foreground">{purchase.filaments?.vendor}</p>
                  <div className="flex gap-2 mt-2">
                    {purchase.filaments?.material && (
                      <Badge variant="secondary">{purchase.filaments.material}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
