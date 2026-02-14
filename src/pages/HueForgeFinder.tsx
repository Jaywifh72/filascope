import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Lightbulb, 
  ArrowUpDown, 
  Filter, 
  Search,
  ExternalLink,
  BookOpen,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import { ItemListSchema, FAQSchema } from '@/components/seo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const hueforgeFaqs = [
  {
    question: 'What is HueForge and why does TD matter?',
    answer: 'HueForge is software for creating multicolor 3D prints using a single-color printer. TD (Transmission Distance) determines how light passes through filament layers, which is crucial for achieving the correct color blending and lithophane effects.',
  },
  {
    question: 'What TD value should I use for HueForge?',
    answer: 'Most HueForge projects work best with TD values between 3-5. Lower TD (1-3) creates more opaque layers for vivid colors, while higher TD (5+) is better for translucent effects and lithophanes.',
  },
  {
    question: 'How do I measure TD for filaments not in the database?',
    answer: 'Print a test swatch at your normal layer height, backlight it, and count how many layers are needed before light no longer passes through. This layer count multiplied by layer height gives you the TD value in mm.',
  },
];

export default function HueForgeFinder() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'td-asc' | 'td-desc' | 'name' | 'price'>('td-asc');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const { formatPrice } = useCurrency();

  // Fetch filaments with TD values
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['hueforge-filaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, material, color_family, color_hex, transmission_distance, variant_price, net_weight_g, featured_image, product_handle')
        .not('transmission_distance', 'is', null)
        .or('net_weight_g.is.null,net_weight_g.gte.300') // Exclude small/sample spools
        .order('transmission_distance', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Get unique materials for filter
  const materials = useMemo(() => {
    if (!filaments) return [];
    const uniqueMaterials = [...new Set(filaments.map(f => f.material).filter(Boolean))];
    return uniqueMaterials.sort();
  }, [filaments]);

  // Filter and sort filaments
  const filteredFilaments = useMemo(() => {
    if (!filaments) return [];
    
    let result = [...filaments];
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.product_title?.toLowerCase().includes(search) ||
        f.vendor?.toLowerCase().includes(search) ||
        f.color_family?.toLowerCase().includes(search)
      );
    }
    
    // Material filter
    if (materialFilter !== 'all') {
      result = result.filter(f => f.material === materialFilter);
    }
    
    // Sort
    switch (sortBy) {
      case 'td-asc':
        result.sort((a, b) => (a.transmission_distance || 0) - (b.transmission_distance || 0));
        break;
      case 'td-desc':
        result.sort((a, b) => (b.transmission_distance || 0) - (a.transmission_distance || 0));
        break;
      case 'name':
        result.sort((a, b) => (a.product_title || '').localeCompare(b.product_title || ''));
        break;
      case 'price':
        result.sort((a, b) => (a.variant_price || 999) - (b.variant_price || 999));
        break;
    }
    
    return result;
  }, [filaments, searchTerm, materialFilter, sortBy]);

  // Calculate price per kg
  const getPricePerKg = (price: number | null, weightG: number | null) => {
    if (!price || !weightG) return null;
    return price / (weightG / 1000);
  };

  // Get TD category badge
  const getTdBadge = (td: number) => {
    if (td <= 2) return { label: 'Opaque', variant: 'default' as const, color: 'bg-orange-500' };
    if (td <= 4) return { label: 'Balanced', variant: 'secondary' as const, color: 'bg-green-500' };
    return { label: 'Translucent', variant: 'outline' as const, color: 'bg-blue-500' };
  };

  // Build ItemList schema data
  const schemaItems = useMemo(() => {
    return filteredFilaments.slice(0, 20).map((f, i) => ({
      name: `${f.vendor} ${f.product_title} - TD ${f.transmission_distance}`,
      url: `https://filascope.com/filament/${f.product_handle || f.id}`,
      image: f.featured_image || undefined,
      description: `HueForge compatible filament with Transmission Distance of ${f.transmission_distance}`,
      position: i + 1,
    }));
  }, [filteredFilaments]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Helmet>
        <title>HueForge Filament Finder — TD Values & Color Match | FilaScope</title>
        <meta 
          name="description" 
          content={`Find the best filaments for HueForge by TD value and color. The world's largest transmissivity database for lithophane printing. Search ${filaments?.length || 300}+ filaments.`}
        />
        <meta property="og:title" content="HueForge Filament Finder — TD Values & Color Match | FilaScope" />
        <meta property="og:description" content={`Find the best filaments for HueForge by TD value and color. The world's largest transmissivity database for lithophane printing. Search ${filaments?.length || 300}+ filaments.`} />
        <meta name="keywords" content="HueForge, TD value, Transmission Distance, filament database, lithophane, multicolor printing, 3D printing filament" />
        <link rel="canonical" href="https://filascope.com/hueforge-filaments" />
      </Helmet>
      
      <ItemListSchema
        name="HueForge Compatible Filaments"
        description="Filaments with verified Transmission Distance (TD) values for HueForge multicolor printing"
        items={schemaItems}
      />
      
      <FAQSchema faqs={hueforgeFaqs} />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-sm">
            <Lightbulb className="w-3 h-3 mr-1" />
            HueForge Compatible
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            HueForge Filament Finder
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Find the perfect filament for your HueForge project with our comprehensive TD value database
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{filaments?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Filaments with TD</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{materials.length}</div>
              <div className="text-sm text-muted-foreground">Material Types</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {filaments ? [...new Set(filaments.map(f => f.vendor))].length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Brands</div>
            </div>
          </div>
          
          <div className="flex justify-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/reference/methodology">
                <BookOpen className="w-4 h-4 mr-2" />
                How We Test TD
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://www.hueforge.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                About HueForge
              </a>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by brand, name, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-3">
                <Select value={materialFilter} onValueChange={setMaterialFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Materials</SelectItem>
                    {materials.map(m => (
                      <SelectItem key={m} value={m || ''}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-40">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="td-asc">TD: Low to High</SelectItem>
                    <SelectItem value="td-desc">TD: High to Low</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="price">Price: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TD Legend */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>Opaque (TD 1-2)</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Best for vivid solid colors, fewer layers needed
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Balanced (TD 2-4)</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Ideal for most HueForge projects
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Translucent (TD 4+)</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Best for lithophanes and light-diffusing prints
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              Showing {filteredFilaments.length} filaments with TD values
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFilaments.map((filament) => {
                const tdBadge = getTdBadge(filament.transmission_distance!);
                const pricePerKg = getPricePerKg(filament.variant_price, filament.net_weight_g);
                
                return (
                  <Link 
                    key={filament.id} 
                    to={`/filament/${filament.product_handle || filament.id}`}
                    className="block"
                  >
                    <Card className="h-full hover:border-primary/50 transition-colors group">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {filament.color_hex && (
                              <div 
                                className="w-6 h-6 rounded-full border shrink-0"
                                style={{ backgroundColor: filament.color_hex }}
                              />
                            )}
                            <div>
                              <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                                {filament.product_title}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {filament.vendor}
                              </CardDescription>
                            </div>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${tdBadge.color}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {filament.material}
                            </Badge>
                            <Badge variant={tdBadge.variant} className="text-xs">
                              {tdBadge.label}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-end justify-between mt-4">
                          <div>
                            <div className="text-2xl font-bold text-primary">
                              TD {filament.transmission_distance}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Transmission Distance
                            </div>
                          </div>
                          {pricePerKg && (
                            <div className="text-right">
                              <div className="font-semibold">
                                {formatPrice(pricePerKg)}/kg
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* FAQ Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-center">HueForge FAQ</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {hueforgeFaqs.map((faq, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
