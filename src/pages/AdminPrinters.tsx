import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, ArrowLeft, Database, Search, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

/**
 * Admin page for importing printer data from CSV
 * 
 * Usage:
 * 1. Upload printers_master_standardized.csv file
 * 2. Click "Import Printers" to process
 * 3. Review import statistics
 * 
 * The CSV will be parsed and upserted into the database:
 * - Brands and series are automatically created/updated
 * - Printers are upserted based on printer_id
 * - All columns from CSV are preserved
 */
export default function AdminPrinters() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [discovering, setDiscovering] = useState(false);

  // Fetch printer brands
  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ["printer-brands-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_brands")
        .select("*")
        .order("brand");
      
      if (error) throw error;
      return data;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStats(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      
      // Read file as text
      const csvData = await file.text();
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke("import-printers", {
        body: { csvData },
      });

      if (error) throw error;

      if (data.success) {
        setStats(data.stats);
        toast({
          title: "Import successful",
          description: `Imported ${data.stats.printers_created} new printers, updated ${data.stats.printers_updated}`,
        });
      } else {
        throw new Error("Import failed");
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error.message || "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDiscoverModels = async () => {
    if (!selectedBrand) {
      toast({
        title: "No brand selected",
        description: "Please select a brand to discover models for",
        variant: "destructive",
      });
      return;
    }

    try {
      setDiscovering(true);
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke("discover-printer-models", {
        body: { brand_id: selectedBrand },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Discovery started",
          description: `Model discovery for ${data.brand} has been started in the background. Check back in a few minutes.`,
        });
      } else {
        throw new Error(data.error || "Discovery failed");
      }
    } catch (error: any) {
      console.error("Discovery error:", error);
      toast({
        title: "Discovery failed",
        description: error.message || "An error occurred during discovery",
        variant: "destructive",
      });
    } finally {
      setDiscovering(false);
    }
  };

  const selectedBrandData = brands?.find(b => b.id === selectedBrand);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Manage Printers</h1>
          <p className="text-muted-foreground">
            Import printer data from CSV or discover new models from brand websites
          </p>
        </div>

        {/* Model Discovery Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Discover New Models
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Automatically discover new printer models from brand websites. Select a brand and click discover to scrape their product pages for new models.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Brand</label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a brand..." />
                  </SelectTrigger>
                  <SelectContent>
                    {brandsLoading ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Loading brands...
                      </div>
                    ) : brands && brands.length > 0 ? (
                      brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.brand}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No brands found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <Button
                  onClick={handleDiscoverModels}
                  disabled={!selectedBrand || discovering || brandsLoading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {discovering ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Discover New Models
                    </>
                  )}
                </Button>
              </div>
            </div>

            {selectedBrandData && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Discovery Run:</span>
                  <span className="font-medium">
                    {selectedBrandData.last_discovery_run_at 
                      ? new Date(selectedBrandData.last_discovery_run_at).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">New Models Found:</span>
                  <span className="font-medium">
                    {selectedBrandData.new_models_found_count || 0}
                  </span>
                </div>
                {!selectedBrandData.scrape_config && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription className="text-xs">
                      No scrape configuration found for this brand. Add scrape_config to the brand record first.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* CSV Import Section */}

        {/* Instructions */}
        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 mt-0.5 text-primary" />
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold">How to import printers</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Select the <code className="bg-muted px-1 py-0.5 rounded">printers_master_standardized.csv</code> file</li>
                <li>Click "Import Printers" to begin processing</li>
                <li>The import will upsert data based on <code className="bg-muted px-1 py-0.5 rounded">printer_id</code></li>
                <li>Brands and series are automatically created if they don't exist</li>
                <li>Existing printers are updated with new data</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Upload Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Choose CSV File</span>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {file && (
                <div className="flex-1 text-sm text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">{file.name}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full"
              size="lg"
            >
              {importing ? "Importing..." : "Import Printers"}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {stats && (
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Import Results</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.brands_created}
                </div>
                <div className="text-sm text-muted-foreground">Brands Created</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.brands_updated}
                </div>
                <div className="text-sm text-muted-foreground">Brands Updated</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.printers_created}
                </div>
                <div className="text-sm text-muted-foreground">Printers Created</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.printers_updated}
                </div>
                <div className="text-sm text-muted-foreground">Printers Updated</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.series_created}
                </div>
                <div className="text-sm text-muted-foreground">Series Created</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.errors.length}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>

            {stats.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="font-semibold mb-2">Errors occurred during import:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                    {stats.errors.slice(0, 10).map((error: string, i: number) => (
                      <li key={i}>{error}</li>
                    ))}
                    {stats.errors.length > 10 && (
                      <li className="font-semibold">
                        ... and {stats.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}