import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tag, TrendingDown, ArrowRight, Clock, Percent, Sparkles, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";
import Navbar from "@/components/Navbar";

interface DealFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  featured_image: string | null;
  variant_price: number | null;
  variant_compare_at_price: number | null;
  product_url: string | null;
  net_weight_g: number | null;
}

const Deals = () => {
  const { formatPrice } = useCurrency();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["deals-page"],
    queryFn: async () => {
      // Fetch filaments where compare_at_price > variant_price (on sale)
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, material, featured_image, variant_price, variant_compare_at_price, product_url, net_weight_g')
        .not('variant_compare_at_price', 'is', null)
        .not('variant_price', 'is', null)
        .gt('variant_compare_at_price', 0)
        .or('net_weight_g.is.null,net_weight_g.gte.300') // Exclude small/sample spools
        .order('variant_compare_at_price', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Filter to only show items where compare_at_price > variant_price
      const onSaleItems = (data || []).filter(
        (item): item is DealFilament => 
          item.variant_compare_at_price !== null && 
          item.variant_price !== null && 
          item.variant_compare_at_price > item.variant_price
      );

      // Sort by discount percentage
      return onSaleItems.sort((a, b) => {
        const discountA = ((a.variant_compare_at_price! - a.variant_price!) / a.variant_compare_at_price!) * 100;
        const discountB = ((b.variant_compare_at_price! - b.variant_price!) / b.variant_compare_at_price!) * 100;
        return discountB - discountA;
      });
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  const calculateDiscount = (price: number, compareAt: number) => {
    return Math.round(((compareAt - price) / compareAt) * 100);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-20 px-6 md:px-10">
          <div className="max-w-[1600px] mx-auto">
            {/* Badge */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/5">
                <Tag className="h-4 w-4 text-green-400" />
                <span className="font-mono text-xs uppercase tracking-wider text-green-400">
                  Today's Deals
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-4">
              Best Prices <span className="text-green-400">Right Now</span>
            </h1>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">
              Discounted filaments from top brands. Prices updated daily from 15+ retailers.
            </p>

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-green-400" />
                <span><span className="text-foreground font-medium">{deals.length}</span> active deals</span>
              </div>
              <span className="text-gray-600">•</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Updated hourly</span>
              </div>
            </div>
          </div>
        </section>

        {/* Deals Grid */}
        <section className="px-6 md:px-10 pb-16">
          <div className="max-w-[1600px] mx-auto">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="h-80 animate-pulse bg-gray-800/50" />
                ))}
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-16">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Active Deals</h2>
                <p className="text-muted-foreground mb-6">
                  Check back soon! New deals are added daily.
                </p>
                <Button asChild>
                  <Link to="/finder">Browse All Filaments</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {deals.map((deal) => {
                  const discount = calculateDiscount(deal.variant_price!, deal.variant_compare_at_price!);
                  const savings = deal.variant_compare_at_price! - deal.variant_price!;
                  
                  return (
                    <Link
                      key={deal.id}
                      to={`/filament/${deal.id}`}
                      className="group"
                    >
                      <Card className="relative h-full overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/10 hover:border-green-500/50">
                        {/* Discount Badge */}
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-background text-xs font-bold">
                          <TrendingDown className="h-3 w-3" />
                          {discount}% OFF
                        </div>

                        {/* Image */}
                        <div className="relative h-40 bg-gray-800/50 flex items-center justify-center overflow-hidden">
                          {deal.featured_image ? (
                            <img
                              src={deal.featured_image}
                              alt={deal.product_title}
                              className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="text-4xl text-muted-foreground">📦</div>
                          )}
                        </div>

                        {/* Content */}
                        <CardContent className="p-4">
                          <div className="text-xs text-muted-foreground mb-1">{deal.vendor}</div>
                          <h3 className="font-medium text-sm mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                            {deal.product_title}
                          </h3>

                          {/* Price */}
                          <div className="flex items-end gap-2 mb-2">
                            <span className="text-xl font-bold text-green-400">
                              {formatPrice(deal.variant_price!)}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(deal.variant_compare_at_price!)}
                            </span>
                          </div>

                          {/* Savings */}
                          <div className="text-xs text-green-400">
                            Save {formatPrice(savings)}
                          </div>

                          {/* Material Badge */}
                          {deal.material && (
                            <Badge variant="secondary" className="mt-3 text-xs">
                              {deal.material}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* CTA */}
            {deals.length > 0 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg" asChild>
                  <Link to="/finder" className="gap-2">
                    Browse All Filaments
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Deals;
