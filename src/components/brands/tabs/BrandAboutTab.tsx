import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Calendar, Users, Building2, TrendingUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrandInfo {
  summary?: string;
  location?: string;
  headquarters?: string;
  founded?: string;
  employees?: string;
  website?: string;
  companyType?: string;
  founder?: string;
  ceo?: string;
  president?: string;
  parentCompany?: string;
  subsidiaries?: string[];
  stockTicker?: string;
  stockExchange?: string;
  revenue?: string;
}

interface BrandAboutTabProps {
  brandName: string;
  brandInfo: BrandInfo | null;
  productCount: number;
  materialsCount: number;
}

export function BrandAboutTab({
  brandName,
  brandInfo,
  productCount,
  materialsCount,
}: BrandAboutTabProps) {
  if (!brandInfo) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-8 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">About {brandName}</h3>
          <p className="text-muted-foreground">
            Detailed information about {brandName} is coming soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Brand Description */}
      {brandInfo.summary && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">About {brandName}</h3>
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {brandInfo.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Company Information Grid */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Company Information</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brandInfo.headquarters && (
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Headquarters
                  </div>
                  <div className="text-sm font-medium">{brandInfo.headquarters}</div>
                </div>
              </div>
            )}

            {brandInfo.location && !brandInfo.headquarters && (
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Location
                  </div>
                  <div className="text-sm font-medium">{brandInfo.location}</div>
                </div>
              </div>
            )}

            {brandInfo.founded && (
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Founded
                  </div>
                  <div className="text-sm font-medium">{brandInfo.founded}</div>
                </div>
              </div>
            )}

            {brandInfo.employees && (
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Employees
                  </div>
                  <div className="text-sm font-medium">{brandInfo.employees}</div>
                </div>
              </div>
            )}

            {(brandInfo.ceo || brandInfo.president || brandInfo.founder) && (
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <Building2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {brandInfo.ceo ? "CEO" : brandInfo.president ? "President" : "Founder"}
                  </div>
                  <div className="text-sm font-medium">
                    {brandInfo.ceo || brandInfo.president || brandInfo.founder}
                  </div>
                </div>
              </div>
            )}

            {brandInfo.parentCompany && (
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <Building2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Parent Company
                  </div>
                  <div className="text-sm font-medium">{brandInfo.parentCompany}</div>
                </div>
              </div>
            )}

            {brandInfo.stockTicker && brandInfo.stockExchange && (
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Stock
                  </div>
                  <div className="text-sm font-medium">
                    {brandInfo.stockTicker} ({brandInfo.stockExchange})
                  </div>
                </div>
              </div>
            )}

            {brandInfo.revenue && (
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Revenue
                  </div>
                  <div className="text-sm font-medium">{brandInfo.revenue}</div>
                </div>
              </div>
            )}
          </div>

          {brandInfo.subsidiaries && brandInfo.subsidiaries.length > 0 && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Subsidiaries
              </div>
              <div className="flex flex-wrap gap-2">
                {brandInfo.subsidiaries.map((sub, idx) => (
                  <Badge key={idx} variant="secondary">
                    {sub}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Catalog Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold text-primary">{productCount}</div>
              <div className="text-sm text-muted-foreground">Products</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold text-primary">{materialsCount}</div>
              <div className="text-sm text-muted-foreground">Material Types</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Website Link */}
      {brandInfo.website && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Contact & Links</h3>
            <Button asChild variant="outline">
              <a href={brandInfo.website} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-2" />
                Visit Official Website
                <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
