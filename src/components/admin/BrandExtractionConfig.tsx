import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CheckCircle, XCircle, AlertCircle, RefreshCw, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { BrandExtractionEditor } from "./BrandExtractionEditor";
import { ExtractionHealthOverview } from "./ExtractionHealthOverview";

interface BrandConfig {
  id: string;
  brand_name: string;
  brand_slug: string;
  base_url: string;
  extraction_method: string | null;
  price_extraction_config: Record<string, unknown> | null;
  test_product_url: string | null;
  last_extraction_test_at: string | null;
  extraction_working: boolean | null;
  extraction_success_rate: number | null;
  is_visible: boolean | null;
}

export function BrandExtractionConfig() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [editingBrand, setEditingBrand] = useState<BrandConfig | null>(null);

  const { data: brands, isLoading, refetch } = useQuery({
    queryKey: ['brand-extraction-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automated_brands')
        .select('id, brand_name, brand_slug, base_url, extraction_method, price_extraction_config, test_product_url, last_extraction_test_at, extraction_working, extraction_success_rate, is_visible')
        .eq('is_visible', true)
        .order('brand_name');
      
      if (error) throw error;
      return data as BrandConfig[];
    },
  });

  const filteredBrands = brands?.filter(brand => {
    const matchesSearch = brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         brand.brand_slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "working" && brand.extraction_working === true) ||
      (statusFilter === "failing" && brand.extraction_working === false) ||
      (statusFilter === "untested" && brand.extraction_working === null);
    
    const matchesMethod = methodFilter === "all" ||
      (methodFilter === "configured" && brand.extraction_method && brand.extraction_method !== 'auto') ||
      (methodFilter === "auto" && (!brand.extraction_method || brand.extraction_method === 'auto'));
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusIcon = (brand: BrandConfig) => {
    if (brand.extraction_working === null) {
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
    if (brand.extraction_working) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getMethodBadge = (method: string | null) => {
    if (!method || method === 'auto') {
      return <Badge variant="outline">Auto</Badge>;
    }
    if (method === 'firecrawl') {
      return <Badge variant="secondary">Firecrawl</Badge>;
    }
    if (method === 'shopify_json') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Shopify</Badge>;
    }
    return <Badge>{method}</Badge>;
  };

  const formatSuccessRate = (rate: number | null) => {
    if (rate === null) return "—";
    const color = rate >= 90 ? "text-green-600" : rate >= 70 ? "text-yellow-600" : "text-destructive";
    return <span className={color}>{rate.toFixed(1)}%</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ExtractionHealthOverview onEditBrand={(brand) => setEditingBrand(brand as BrandConfig)} />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Brand Extraction Configurations
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="working">Working</SelectItem>
                <SelectItem value="failing">Failing</SelectItem>
                <SelectItem value="untested">Untested</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="configured">Configured</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Success Rate</TableHead>
                  <TableHead>Last Test</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands?.map((brand) => (
                  <TableRow key={brand.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setEditingBrand(brand)}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{brand.brand_name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {brand.base_url}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getMethodBadge(brand.extraction_method)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatSuccessRate(brand.extraction_success_rate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {brand.last_extraction_test_at 
                        ? formatDistanceToNow(new Date(brand.last_extraction_test_at), { addSuffix: true })
                        : "Never"
                      }
                    </TableCell>
                    <TableCell>{getStatusIcon(brand)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingBrand(brand);
                        }}
                      >
                        Configure
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBrands?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No brands match your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredBrands?.length || 0} of {brands?.length || 0} brands
          </div>
        </CardContent>
      </Card>

      {editingBrand && (
        <BrandExtractionEditor
          brand={editingBrand}
          open={!!editingBrand}
          onClose={() => setEditingBrand(null)}
          onSave={() => {
            setEditingBrand(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
