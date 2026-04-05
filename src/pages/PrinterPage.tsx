import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, ArrowLeft, Search, Filter, SlidersHorizontal } from "lucide-react";
import { FilamentCard } from "@/components/FilamentCard";
import { FilamentCardSkeleton } from "@/components/FilamentCardSkeleton";
import { MaterialBadge } from "@/components/MaterialBadge";
import type { Printer as PrinterType } from "@/types/printer";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

export default function PrinterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  // Fetch printer details
  const { data: printer, isLoading: printerLoading } = useQuery({
    queryKey: ["printer", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printers")
        .select(`
          *,
          brand:printer_brands(brand)
        `)
        .eq("printer_id", id)
        .single();

      if (error) throw error;
      return data as PrinterType & { brand: { brand: string } | null };
    },
    enabled: !!id,
  });

  // Fetch compatible filaments
  const { data: filaments, isLoading: filamentsLoading } = useQuery({
    queryKey: ["printer-filaments", id, searchTerm, selectedMaterial, sortBy, currentPage, priceRange],
    queryFn: async () => {
      if (!id) return { filaments: [], totalCount: 0 };

      let query = supabase
        .from("filaments")
        .select(`
          *,
          brand:filament_brands(brand),
          material:materials(name)
        `, { count: "exact" })
        .eq("published", true)
        .order("created_at", { ascending: false });

      // Apply material filter
      if (selectedMaterial !== "all") {
        query = query.eq("material", selectedMaterial);
      }

      // Apply price filter
      query = query.gte("price_usd", priceRange[0]).lte("price_usd", priceRange[1]);

      // Apply search
      if (searchTerm) {
        query = query.ilike("product_title", `%${searchTerm}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case "price_asc":
          query = query.order("price_usd", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price_usd", { ascending: false });
          break;
        case "name":
        default:
          query = query.order("product_title", { ascending: true });
          break;
      }

      // Apply pagination
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return { filaments: data || [], totalCount: count || 0 };
    },
    enabled: !!id && !printerLoading,
  });

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, selectedMaterial, sortBy, priceRange]);

  // Fetch material options
  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("name")
        .order("name");
      if (error) throw error;
      return data.map((m) => m.name);
    },
  });

  const totalPages = Math.ceil((filaments?.totalCount || 0) / PAGE_SIZE);

  if (printerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-muted rounded mb-4" />
            <div className="h-32 bg-muted rounded mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-96 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!printer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Printer className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Printer Not Found</h1>
          <p className="text-muted-foreground mb-4">The printer you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title={`Filaments for ${printer.brand?.brand} ${printer.model_name} - ${filaments?.totalCount || 0} Compatible Filaments | FilaScope`}
        description={`Browse ${filaments?.totalCount || 0} 3D printer filaments compatible with ${printer.brand?.brand} ${printer.model_name}. Live prices, detailed specs, and HueForge TD values.`}
        canonical={`https://filascope.com/printers/${id}`}
      />
      <Helmet>
        <title>Filaments for {printer.brand?.brand} {printer.model_name} - {filaments?.totalCount || 0} Compatible Filaments | FilaScope</title>
        <meta
          name="description"
          content={`Browse ${filaments?.totalCount || 0} 3D printer filaments compatible with ${printer.brand?.brand} ${printer.model_name}. Live prices, detailed specs, and HueForge TD values.`}
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="flex items-start gap-6">
            {/* Printer Image */}
            <div className="w-48 h-48 rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0">
              {printer.image_url ? (
                <img
                  src={printer.image_url}
                  alt={printer.model_name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Printer className="h-16 w-16 text-muted-foreground/50" />
              )}
            </div>

            {/* Printer Info */}
            <div className="flex-1">
              <Badge variant="secondary" className="mb-2">
                {printer.brand?.brand}
              </Badge>
              <h1 className="text-3xl font-bold mb-2">{printer.model_name}</h1>
              <p className="text-muted-foreground mb-4">
                {filaments?.totalCount || 0} compatible filaments available
              </p>

              {/* Printer Specs */}
              <div className="flex flex-wrap gap-4 text-sm">
                {printer.stock_nozzle_diameter_mm && (
                  <div>
                    <span className="text-muted-foreground">Nozzle:</span>{" "}
                    <span className="font-medium">{printer.stock_nozzle_diameter_mm}mm</span>
                  </div>
                )}
                {printer.max_nozzle_temp_c && (
                  <div>
                    <span className="text-muted-foreground">Max Temp:</span>{" "}
                    <span className="font-medium">{printer.max_nozzle_temp_c}°C</span>
                  </div>
                )}
                {printer.bed_max_temp_c && (
                  <div>
                    <span className="text-muted-foreground">Bed Temp:</span>{" "}
                    <span className="font-medium">{printer.bed_max_temp_c}°C</span>
                  </div>
                )}
                {printer.has_enclosure && (
                  <Badge variant="outline">Enclosed</Badge>
                )}
                {printer.multi_material_supported && printer.multi_material_max_spools && (
                  <Badge variant="outline">
                    {printer.multi_material_max_spools}-Color
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search filaments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Material Filter */}
            <div className="w-full md:w-48">
              <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                <SelectTrigger>
                  <SelectValue placeholder="Material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  {materials?.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="w-full md:w-48">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="price_asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price_desc">Price (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        {filamentsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <FilamentCardSkeleton key={i} />
            ))}
          </div>
        ) : filaments?.filaments && filaments.filaments.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filaments.filaments.map((filament) => (
                <FilamentCard key={filament.id} filament={filament as Record<string, unknown>} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Printer className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Compatible Filaments Found</h2>
            <p className="text-muted-foreground">
              Try adjusting your filters or search terms.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedMaterial("all");
                setSortBy("name");
                setPriceRange([0, 100]);
              }}
              className="mt-4"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
