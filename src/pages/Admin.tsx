import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split("\n");
    const headers = lines[0].split(",");
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "") continue;
      
      const values = lines[i].split(",");
      const row: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        row[header.trim()] = value === "" || value === undefined ? null : value;
      });
      
      data.push(row);
    }

    return data;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      let successCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        try {
          const filamentData = {
            product_id: row["Product ID"],
            product_title: row["Product Title"],
            product_handle: row["Product Handle"],
            vendor: row["Vendor"],
            material: row["Material"],
            variant_sku: row["Variant SKU"],
            variant_price: row["Variant Price"] ? parseFloat(row["Variant Price"]) : null,
            variant_available: row["Variant Available"] === "true",
            product_url: row["Product URL"],
            amazon_link_us: row["Amazon Link US"],
            amazon_link_uk: row["Amazon Link UK"],
            amazon_link_de: row["Amazon Link DE"],
            featured_image: row["Featured Image"],
            tds_url: row["TDS URL"],
            
            // Mechanical properties
            density_g_cm3: row["density_g_cm3"] ? parseFloat(row["density_g_cm3"]) : null,
            tensile_strength_xy_mpa: row["tensile_strength_xy_mpa"] ? parseFloat(row["tensile_strength_xy_mpa"]) : null,
            tensile_modulus_xy_mpa: row["tensile_modulus_xy_mpa"] ? parseFloat(row["tensile_modulus_xy_mpa"]) : null,
            elongation_break_xy_percent: row["elongation_break_xy_percent"] ? parseFloat(row["elongation_break_xy_percent"]) : null,
            flexural_strength_mpa: row["flexural_strength_mpa"] ? parseFloat(row["flexural_strength_mpa"]) : null,
            shore_hardness_d: row["shore_hardness_d"] ? parseFloat(row["shore_hardness_d"]) : null,
            
            // Thermal properties
            tg_c: row["tg_c"] ? parseFloat(row["tg_c"]) : null,
            melt_temp_c: row["melt_temp_c"] ? parseFloat(row["melt_temp_c"]) : null,
            nozzle_temp_min_c: row["nozzle_temp_min_c"] ? parseInt(row["nozzle_temp_min_c"]) : null,
            nozzle_temp_max_c: row["nozzle_temp_max_c"] ? parseInt(row["nozzle_temp_max_c"]) : null,
            nozzle_temp_sweetspot_c: row["nozzle_temp_sweetspot_c"] ? parseInt(row["nozzle_temp_sweetspot_c"]) : null,
            bed_temp_min_c: row["bed_temp_min_c"] ? parseInt(row["bed_temp_min_c"]) : null,
            bed_temp_max_c: row["bed_temp_max_c"] ? parseInt(row["bed_temp_max_c"]) : null,
            
            // Print settings
            print_speed_max_mms: row["print_speed_max_mms"] ? parseInt(row["print_speed_max_mms"]) : null,
            fan_min_percent: row["fan_min_percent"] ? parseInt(row["fan_min_percent"]) : null,
            fan_max_percent: row["fan_max_percent"] ? parseInt(row["fan_max_percent"]) : null,
            
            // Physical properties
            diameter_nominal_mm: row["diameter_nominal_mm"] ? parseFloat(row["diameter_nominal_mm"]) : null,
            net_weight_g: row["net_weight_g"] ? parseInt(row["net_weight_g"]) : null,
            spool_outer_d_mm: row["spool_outer_d_mm"] ? parseFloat(row["spool_outer_d_mm"]) : null,
            spool_width_mm: row["spool_width_mm"] ? parseFloat(row["spool_width_mm"]) : null,
            
            // Appearance
            color_hex: row["color_hex"],
            color_family: row["color_family"],
            finish_type: row["finish_type"],
            
            // Compatibility
            is_nozzle_abrasive: row["is_nozzle_abrasive"] === "true",
            recommended_nozzle_type: row["recommended_nozzle_type"],
            spool_ams_fit: row["spool_ams_fit"] === "true",
            
            // Ratings
            ease_of_printing_score: row["ease_of_printing_score"] ? parseInt(row["ease_of_printing_score"]) : null,
            dimensional_accuracy_score: row["dimensional_accuracy_score"] ? parseInt(row["dimensional_accuracy_score"]) : null,
            strength_index: row["strength_index"] ? parseFloat(row["strength_index"]) : null,
            printability_index: row["printability_index"] ? parseFloat(row["printability_index"]) : null,
            value_score: row["value_score"] ? parseFloat(row["value_score"]) : null,
            
            // Care
            moisture_sensitivity_level: row["moisture_sensitivity_level"],
            drying_temp_c: row["drying_temp_c"] ? parseInt(row["drying_temp_c"]) : null,
            drying_time_hours: row["drying_time_hours"] ? parseInt(row["drying_time_hours"]) : null,
            nozzle_care: row["nozzle_care"],
            moisture_care: row["moisture_care"],
            
            // Use cases
            use_case_tags: row["use_case_tags"] ? row["use_case_tags"].split(";") : null,
            industry_tags: row["industry_tags"] ? row["industry_tags"].split(";") : null,
            food_contact_rating: row["food_contact_rating"],
          };

          const { error } = await supabase
            .from("filaments")
            .upsert(filamentData, { onConflict: "product_id" });

          if (error) {
            console.error("Error inserting row:", error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error("Error processing row:", error);
          errorCount++;
        }
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} filaments. ${errorCount} errors.`,
      });

      setFile(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import CSV",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">
              Upload CSV file to import filament data
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {file ? (
                <div className="space-y-4">
                  <FileText className="h-12 w-12 text-primary mx-auto" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <span className="text-primary hover:underline">Choose a CSV file</span>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {file && (
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setFile(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? "Uploading..." : "Import Data"}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
