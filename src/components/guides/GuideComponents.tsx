import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  ExternalLink, 
  ShoppingCart,
  Star
} from 'lucide-react';

// Type for related product recommendations
export interface RelatedProduct {
  id: string;
  name: string;
  brand: string;
  material: string;
  pricePerKg?: number;
  rating?: number;
  image?: string;
  affiliateUrl?: string;
  badge?: string; // e.g., "Editor's Pick", "Best Value"
}

interface GuideRelatedProductsProps {
  title?: string;
  products: RelatedProduct[];
}

export function GuideRelatedProducts({ 
  title = "Shop Our Top Picks", 
  products 
}: GuideRelatedProductsProps) {
  if (products.length === 0) return null;
  
  return (
    <section className="my-12 p-6 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl border border-primary/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">{title}</h3>
        <Link 
          to="/" 
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View All Materials
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="bg-card/80 border-border hover:border-primary/50 transition-colors group">
            <CardContent className="p-4">
              {/* Badge */}
              {product.badge && (
                <Badge className="mb-3 bg-amber-500/10 text-amber-400 border-amber-500/20">
                  <Star className="w-3 h-3 mr-1" />
                  {product.badge}
                </Badge>
              )}
              
              {/* Product Info */}
              <div className="flex gap-3">
                {product.image && (
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {product.material}
                  </p>
                </div>
              </div>
              
              {/* Price & CTA */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                {product.pricePerKg && (
                  <div>
                    <span className="font-bold text-lg">${product.pricePerKg.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">/kg</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/filament/${product.id}`}>
                      Details
                    </Link>
                  </Button>
                  {product.affiliateUrl && (
                    <Button size="sm" className="gap-1" asChild>
                      <a href={product.affiliateUrl} target="_blank" rel="nofollow sponsored noopener noreferrer">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Buy
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

// Related guides section
interface RelatedGuide {
  slug: string;
  title: string;
  category: string;
  readTime: number;
}

interface GuideReadNextProps {
  guides: RelatedGuide[];
}

export function GuideReadNext({ guides }: GuideReadNextProps) {
  if (guides.length === 0) return null;
  
  return (
    <section className="my-12">
      <h3 className="text-xl font-bold mb-6">Read Next</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {guides.map((guide) => (
          <Link 
            key={guide.slug}
            to={`/guides/${guide.slug}`}
            className="group"
          >
            <Card className="bg-card/50 border-border hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-5">
                <Badge variant="outline" className="mb-3 text-xs">
                  {guide.category}
                </Badge>
                <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {guide.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {guide.readTime} min read
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
