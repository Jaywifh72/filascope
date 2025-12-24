import { MapPin, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface RegionNotAvailableProps {
  productTitle: string;
  vendor: string | null;
  material: string | null;
  regionName: string;
}

export function RegionNotAvailable({
  productTitle,
  vendor,
  material,
  regionName,
}: RegionNotAvailableProps) {
  // Build a search URL for similar products in the finder
  const searchParams = new URLSearchParams();
  if (material) {
    searchParams.set('material', material);
  }
  if (vendor) {
    searchParams.set('brand', vendor);
  }
  const finderUrl = `/finder?${searchParams.toString()}`;

  return (
    <Card className="bg-gradient-to-br from-destructive/5 via-card to-card border-destructive/20">
      <CardContent className="p-8 lg:p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-destructive" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Not Available in {regionName}
        </h2>
        
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          <span className="font-medium text-foreground">{productTitle}</span> is not available for purchase in your region. 
          This product may be sold through a different regional store.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={finderUrl}>
            <Button size="lg" className="gap-2">
              <Search className="w-4 h-4" />
              Find Similar Products
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          
          <Link to="/finder">
            <Button variant="outline" size="lg">
              Browse All Filaments
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Tip: You can change your region by selecting a different currency in the header.
        </p>
      </CardContent>
    </Card>
  );
}
