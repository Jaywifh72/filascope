import { useState, useMemo } from 'react';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database, 
  Download, 
  Search,
  ArrowUpDown,
  ExternalLink,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DatasetSchema, FAQSection } from '@/components/seo';
import { NoscriptFallback } from '@/components/NoscriptFallback';

interface TDFilament {
  id: string;
  product_title: string | null;
  vendor: string | null;
  material: string | null;
  color_family: string | null;
  color_hex: string | null;
  transmission_distance: number | null;
  product_handle: string | null;
}

const tdFaqs = [
  {
    question: 'What is the FilaScope TD Database?',
    answer: 'The FilaScope TD Database is a comprehensive collection of Transmission Distance values for 3D printing filaments. TD values are essential for HueForge, lithophane printing, and any application where light transmission through printed layers matters.',
  },
  {
    question: 'How can I use this TD data?',
    answer: 'Use the TD values when setting up HueForge projects, creating lithophanes, or designing multicolor prints. You can export the data as CSV to use in your own tools or reference directly when slicing.',
  },
  {
    question: 'Are these TD values verified?',
    answer: 'Yes. TD values come from manufacturer Technical Data Sheets (highest accuracy) or community measurements following standardized testing methodology. Each entry shows its source.',
  },
];

type SortField = 'vendor' | 'material' | 'transmission_distance' | 'color_family';
type SortDirection = 'asc' | 'desc';

export default function TDDatabase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('transmission_distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Fetch filaments with TD values
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['td-database-filaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, material, color_family, color_hex, transmission_distance, product_handle')
        .not('transmission_distance', 'is', null)
        .order('transmission_distance', { ascending: true });
      
      if (error) throw error;
      return data as TDFilament[];
    },
  });

  // Get unique values for filters
  const { materials, brands } = useMemo(() => {
    if (!filaments) return { materials: [], brands: [] };
    return {
      materials: [...new Set(filaments.map(f => f.material).filter(Boolean))].sort() as string[],
      brands: [...new Set(filaments.map(f => f.vendor).filter(Boolean))].sort() as string[],
    };
  }, [filaments]);

  // Filter and sort
  const filteredData = useMemo(() => {
    if (!filaments) return [];
    
    let result = [...filaments];
    
    // Search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.product_title?.toLowerCase().includes(search) ||
        f.vendor?.toLowerCase().includes(search) ||
        f.color_family?.toLowerCase().includes(search) ||
        f.material?.toLowerCase().includes(search)
      );
    }
    
    // Material filter
    if (materialFilter !== 'all') {
      result = result.filter(f => f.material === materialFilter);
    }
    
    // Brand filter
    if (brandFilter !== 'all') {
      result = result.filter(f => f.vendor === brandFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [filaments, searchTerm, materialFilter, brandFilter, sortField, sortDirection]);

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export to CSV
  const exportCSV = () => {
    if (!filteredData.length) return;
    
    const headers = ['Brand', 'Product', 'Material', 'Color', 'TD Value'];
    const rows = filteredData.map(f => [
      f.vendor || '',
      f.product_title || '',
      f.material || '',
      f.color_family || '',
      f.transmission_distance?.toString() || '',
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filascope-td-database-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sort indicator
  const SortIndicator = ({ field }: { field: SortField }) => (
    <ArrowUpDown 
      className={`w-4 h-4 inline ml-1 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} 
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <DocumentHead
        title="HueForge TD Database — 537+ Filament TD Values | FilaScope"
        description="The largest TD value database for HueForge & lithophanes. 537+ measured Transmission Distance values, searchable & exportable to CSV. Free."
        ogTitle="TD Value Database — Transmission Distance for 3D Printing Filaments | FilaScope"
        ogDescription="Complete database of 537+ Transmission Distance (TD) values for 3D printing filaments. Essential data for HueForge, lithophanes, and multicolor printing."
        keywords="TD database, Transmission Distance, filament data, HueForge values, lithophane filament, 3D printing data, HueForge TD"
      />
      
      <DatasetSchema
        name="FilaScope TD Value Database"
        description="Comprehensive database of Transmission Distance (TD) values for 3D printing filaments, used for HueForge and lithophane printing"
        url="https://filascope.com/td-database"
        keywords={['TD value', 'Transmission Distance', 'HueForge', 'filament database', '3D printing', 'lithophane']}
        creator={{ '@type': 'Organization', name: 'FilaScope', url: 'https://filascope.com' }}
        recordCount={filaments?.length}
        isAccessibleForFree={true}
      />
      
      <FAQSection faqs={tdFaqs} />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-sm">
            <Database className="w-3 h-3 mr-1" />
            Open Data
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            TD Value Database
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Searchable, exportable Transmission Distance data for HueForge and lithophane printing
          </p>
          <p className="mb-6">
            <Link to="/hueforge-td-database" className="text-primary hover:underline text-sm font-medium">
              Learn about HueForge &amp; TD Values →
            </Link>
          </p>
          
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{filaments?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{brands.length}</div>
              <div className="text-sm text-muted-foreground">Brands</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{materials.length}</div>
              <div className="text-sm text-muted-foreground">Materials</div>
            </div>
          </div>
          
          <Button onClick={exportCSV} disabled={!filteredData.length}>
            <Download className="w-4 h-4 mr-2" />
            Export to CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search filaments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-3">
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={materialFilter} onValueChange={setMaterialFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Materials</SelectItem>
                    {materials.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="text-sm text-muted-foreground mb-4">
          Showing {filteredData.length} of {filaments?.length || 0} records
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Color</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('vendor')}
                  >
                    Brand <SortIndicator field="vendor" />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('material')}
                  >
                    Material <SortIndicator field="material" />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('color_family')}
                  >
                    Color <SortIndicator field="color_family" />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('transmission_distance')}
                  >
                    TD Value <SortIndicator field="transmission_distance" />
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.slice(0, 100).map((filament) => (
                  <TableRow key={filament.id}>
                    <TableCell>
                      {filament.color_hex ? (
                        <div 
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: filament.color_hex }}
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full border bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{filament.vendor}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {filament.product_title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{filament.material}</Badge>
                    </TableCell>
                    <TableCell>{filament.color_family}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">
                      {filament.transmission_distance}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/filament/${filament.product_handle || filament.id}`}>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredData.length > 100 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t">
                Showing 100 of {filteredData.length} results. Use filters to narrow down or export full dataset.
              </div>
            )}
          </div>
        )}

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-center">About the TD Database</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {tdFaqs.map((faq, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Noscript fallback for SEO and AI crawlers */}
        <NoscriptFallback
          title="HueForge TD Database - FilaScope"
          description="The largest database of HueForge Transmission Distance (TD) values for 3D printing filaments. Search 500+ TD values to find the perfect filament for lithophane prints."
        >
          <h2>What is HueForge TD Value?</h2>
          <p>HueForge Transmission Distance (TD) measures how much light passes through a 3D printed filament layer, expressed in millimeters. Higher TD values mean more light transmission, creating brighter colors in HueForge lithophane prints.</p>

          <h2>FilaScope HueForge TD Database</h2>
          <p>FilaScope maintains the largest database of measured TD values across 21,000+ filaments from 50+ brands. Currently showing {filaments?.length || 0} filaments with verified TD values.</p>

          <h2>How to Use TD Values</h2>
          <ul>
            <li><strong>High TD (3.0mm+):</strong> Best for bright, saturated lithophanes</li>
            <li><strong>Medium TD (1.5-3.0mm):</strong> Balanced for most prints</li>
            <li><strong>Low TD (under 1.5mm):</strong> Best for subtle, artistic effects</li>
          </ul>

          <p>Visit <a href="/">FilaScope.com</a> to search and compare filaments by TD value, or <a href="/filaments">browse all filaments</a>.</p>
        </NoscriptFallback>
      </div>
    </div>
  );
}
