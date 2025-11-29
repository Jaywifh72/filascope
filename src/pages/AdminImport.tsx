import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, ArrowLeft, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";

const AdminImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, errors: 0 });
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You must be an admin to access this page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, loading, navigate, toast]);

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
    // Proper CSV parsing that handles quoted fields
    const lines: string[] = [];
    let currentLine = '';
    let insideQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentLine += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === '\n' && !insideQuotes) {
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
      } else if (char === '\r' && nextChar === '\n' && !insideQuotes) {
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
        i++; // Skip \n
      } else {
        currentLine += char;
      }
    }
    
    // Add last line if exists
    if (currentLine.trim()) {
      lines.push(currentLine);
    }
    
    if (lines.length === 0) return [];
    
    // Parse headers
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        row[header.trim()] = value === "" || value === undefined ? null : value;
      });
      
      data.push(row);
    }
    
    return data;
  };
  
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quotes
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress({ current: 0, total: 0, errors: 0 });
    setImportResults(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        toast({
          title: "Empty file",
          description: "The CSV file contains no data rows.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Log detected headers for debugging
      const sampleRow = rows[0];
      const detectedHeaders = Object.keys(sampleRow);
      console.log("Detected CSV headers:", detectedHeaders);
      console.log("Sample row:", sampleRow);

      setProgress({ current: 0, total: rows.length, errors: 0 });

      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Extract product_title with multiple variations
        const productTitle = row.product_title || row.Product_Title || row["Product Title"] || row.title;
        
        // Skip rows without product_title (required field)
        if (!productTitle || productTitle.trim() === "") {
          errors.push(`Row ${i + 2}: Missing required field 'product_title'`);
          setProgress(prev => ({ ...prev, current: i + 1, errors: prev.errors + 1 }));
          continue;
        }

        try {
          // Helper function to safely parse numbers with database constraint validation
          // Database NUMERIC(10,2) fields can have max value of 99,999,999.99
          const MAX_NUMERIC_VALUE = 99999999.99;
          
          const parseNumber = (value: any, fieldName?: string): number | null => {
            if (value === null || value === undefined || value === '') return null;
            const parsed = parseFloat(value);
            if (isNaN(parsed)) return null;
            
            // Check for overflow - log but return null to skip the field
            if (Math.abs(parsed) > MAX_NUMERIC_VALUE) {
              console.warn(`Row ${i + 2}: ${fieldName || 'numeric field'} value ${parsed} exceeds max (${MAX_NUMERIC_VALUE}), skipping field`);
              return null;
            }
            
            return parsed;
          };

          const parseInt = (value: any, fieldName?: string): number | null => {
            if (value === null || value === undefined || value === '') return null;
            const parsed = Number.parseInt(value);
            if (isNaN(parsed)) return null;
            
            // Check for overflow
            if (Math.abs(parsed) > MAX_NUMERIC_VALUE) {
              console.warn(`Row ${i + 2}: ${fieldName || 'integer field'} value ${parsed} exceeds max (${MAX_NUMERIC_VALUE}), skipping field`);
              return null;
            }
            
            return parsed;
          };

          const parseBool = (value: any): boolean | null => {
            if (value === null || value === undefined || value === '') return null;
            return value === 'true' || value === '1' || value === 'TRUE' || value === 'True';
          };

          const filamentData: any = {
            product_id: row.product_id || row.Product_ID || row["Product ID"] || null,
            product_title: productTitle.trim(),
            product_handle: row.product_handle || row.Product_Handle || row["Product Handle"] || null,
            vendor: row.vendor || row.Vendor || null,
            material: row.material || row.Material || null,
            featured_image: row.featured_image || row.Featured_Image || row["Featured Image"] || row.image || null,
            variant_sku: row.variant_sku || row.Variant_SKU || row["Variant SKU"] || null,
            product_url: row.product_url || row.Product_URL || row["Product URL"] || null,
            amazon_link_us: row.amazon_link_us || row.Amazon_Link_US || row["Amazon Link US"] || null,
            amazon_link_uk: row.amazon_link_uk || row.Amazon_Link_UK || row["Amazon Link UK"] || null,
            amazon_link_de: row.amazon_link_de || row.Amazon_Link_DE || row["Amazon Link DE"] || null,
            tds_url: row.tds_url || row.TDS_URL || row["TDS URL"] || null,
            
            // Numeric fields with safe parsing and overflow protection
            density_g_cm3: parseNumber(row.density_g_cm3 || row.Density_g_cm3, 'density_g_cm3'),
            tensile_strength_xy_mpa: parseNumber(row.tensile_strength_xy_mpa || row.Tensile_Strength_XY_MPa, 'tensile_strength_xy_mpa'),
            tensile_modulus_xy_mpa: parseNumber(row.tensile_modulus_xy_mpa || row.Tensile_Modulus_XY_MPa, 'tensile_modulus_xy_mpa'),
            elongation_break_xy_percent: parseNumber(row.elongation_break_xy_percent || row.Elongation_Break_XY_Percent, 'elongation_break_xy_percent'),
            flexural_strength_mpa: parseNumber(row.flexural_strength_mpa || row.Flexural_Strength_MPa, 'flexural_strength_mpa'),
            shore_hardness_d: parseNumber(row.shore_hardness_d || row.Shore_Hardness_D, 'shore_hardness_d'),
            tg_c: parseNumber(row.tg_c || row.Tg_C, 'tg_c'),
            melt_temp_c: parseNumber(row.melt_temp_c || row.Melt_Temp_C, 'melt_temp_c'),
            
            // Temperature settings
            nozzle_temp_min_c: parseInt(row.nozzle_temp_min_c || row.Nozzle_Temp_Min_C, 'nozzle_temp_min_c'),
            nozzle_temp_max_c: parseInt(row.nozzle_temp_max_c || row.Nozzle_Temp_Max_C, 'nozzle_temp_max_c'),
            nozzle_temp_sweetspot_c: parseInt(row.nozzle_temp_sweetspot_c || row.Nozzle_Temp_Sweetspot_C, 'nozzle_temp_sweetspot_c'),
            bed_temp_min_c: parseInt(row.bed_temp_min_c || row.Bed_Temp_Min_C, 'bed_temp_min_c'),
            bed_temp_max_c: parseInt(row.bed_temp_max_c || row.Bed_Temp_Max_C, 'bed_temp_max_c'),
            
            // Print settings
            print_speed_max_mms: parseInt(row.print_speed_max_mms || row.Print_Speed_Max_MMS, 'print_speed_max_mms'),
            fan_min_percent: parseInt(row.fan_min_percent || row.Fan_Min_Percent, 'fan_min_percent'),
            fan_max_percent: parseInt(row.fan_max_percent || row.Fan_Max_Percent, 'fan_max_percent'),
            
            // Physical properties
            diameter_nominal_mm: parseNumber(row.diameter_nominal_mm || row.Diameter_Nominal_MM, 'diameter_nominal_mm'),
            net_weight_g: parseInt(row.net_weight_g || row.Net_Weight_G, 'net_weight_g'),
            spool_outer_d_mm: parseNumber(row.spool_outer_d_mm || row.Spool_Outer_D_MM, 'spool_outer_d_mm'),
            spool_width_mm: parseNumber(row.spool_width_mm || row.Spool_Width_MM, 'spool_width_mm'),
            
            // Color properties
            color_hex: row.color_hex || row.Color_Hex || null,
            color_family: row.color_family || row.Color_Family || null,
            finish_type: row.finish_type || row.Finish_Type || null,
            
            // Care and compatibility
            recommended_nozzle_type: row.recommended_nozzle_type || row.Recommended_Nozzle_Type || null,
            moisture_sensitivity_level: row.moisture_sensitivity_level || row.Moisture_Sensitivity_Level || null,
            moisture_care: row.moisture_care || row.Moisture_Care || null,
            nozzle_care: row.nozzle_care || row.Nozzle_Care || null,
            drying_temp_c: parseInt(row.drying_temp_c || row.Drying_Temp_C, 'drying_temp_c'),
            drying_time_hours: parseInt(row.drying_time_hours || row.Drying_Time_Hours, 'drying_time_hours'),
            
            // Boolean flags with safe parsing
            is_nozzle_abrasive: parseBool(row.is_nozzle_abrasive || row.Is_Nozzle_Abrasive),
            spool_ams_fit: parseBool(row.spool_ams_fit || row.Spool_AMS_Fit),
            variant_available: row.variant_available !== 'false' && row.Variant_Available !== 'false',
            
            // Scores
            ease_of_printing_score: parseInt(row.ease_of_printing_score || row.Ease_of_Printing_Score, 'ease_of_printing_score'),
            dimensional_accuracy_score: parseInt(row.dimensional_accuracy_score || row.Dimensional_Accuracy_Score, 'dimensional_accuracy_score'),
            strength_index: parseNumber(row.strength_index || row.Strength_Index, 'strength_index'),
            printability_index: parseNumber(row.printability_index || row.Printability_Index, 'printability_index'),
            value_score: parseNumber(row.value_score || row.Value_Score, 'value_score'),
            
            // Price
            variant_price: parseNumber(row.variant_price || row.Variant_Price || row["Variant Price"], 'variant_price'),
            
            // Tags and arrays
            use_case_tags: row.use_case_tags ? (row.use_case_tags.split(';').map((t: string) => t.trim()).filter((t: string) => t)) : null,
            industry_tags: row.industry_tags ? (row.industry_tags.split(';').map((t: string) => t.trim()).filter((t: string) => t)) : null,
            
            // Other
            food_contact_rating: row.food_contact_rating || row.Food_Contact_Rating || null,
          };

          // Remove null/undefined values
          Object.keys(filamentData).forEach(key => {
            if (filamentData[key] === null || filamentData[key] === undefined || filamentData[key] === '') {
              delete filamentData[key];
            }
          });

          const { error } = await supabase
            .from("filaments")
            .upsert(filamentData, { onConflict: "product_id" });

          if (error) {
            // Log detailed error for debugging
            console.error(`Import error for row ${i + 2}:`, error);
            errors.push(`Row ${i + 2} (${productTitle}): ${error.message}${error.hint ? ` - ${error.hint}` : ''}`);
            setProgress(prev => ({ ...prev, current: i + 1, errors: prev.errors + 1 }));
          } else {
            successCount++;
            setProgress(prev => ({ ...prev, current: i + 1 }));
          }
        } catch (rowError: any) {
          errors.push(`Row ${i + 2}: ${rowError.message}`);
          setProgress(prev => ({ ...prev, current: i + 1, errors: prev.errors + 1 }));
        }
      }

      setImportResults({ success: successCount, errors });

      if (successCount > 0) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${successCount} filament(s). ${errors.length} error(s).`,
        });
      } else {
        toast({
          title: "Import failed",
          description: `No filaments were imported. Check the error details below.`,
          variant: "destructive",
        });
      }

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

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" asChild>
              <Link to="/admin/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">CSV Import</h1>
          </div>
          <p className="text-muted-foreground">
            Upload and manage filament data via CSV import
          </p>
        </div>

        <Card className="p-8 bg-card border-border">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {file ? (
                <div className="space-y-4">
                  <FileText className="h-12 w-12 text-primary mx-auto" />
                  <p className="font-medium text-foreground">{file.name}</p>
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
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? "Importing..." : "Import Data"}
                </Button>
              </div>
            )}

            {/* Progress Indicator */}
            {isUploading && progress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Processing rows: {progress.current} / {progress.total}</span>
                  <span className="text-destructive">{progress.errors} errors</span>
                </div>
                <Progress value={(progress.current / progress.total) * 100} />
              </div>
            )}

            {/* Import Results */}
            {importResults && (
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h3 className="font-semibold mb-2">Import Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Successfully imported:</span>
                      <span className="font-medium text-primary">{importResults.success}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Errors:</span>
                      <span className="font-medium text-destructive">{importResults.errors.length}</span>
                    </div>
                  </div>
                </div>

                {importResults.errors.length > 0 && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <h3 className="font-semibold mb-2 text-destructive">Error Details</h3>
                    <div className="max-h-64 overflow-y-auto space-y-1 text-sm">
                      {importResults.errors.map((error, idx) => (
                        <div key={idx} className="text-destructive/90">{error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminImport;
