import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, ArrowLeft, Shield, AlertCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Validation schema for filament data
const isURL = (value: string | null): boolean => {
  if (!value) return false;
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('www.');
};

const filamentRowSchema = z.object({
  material: z.string().nullable().refine(
    (val) => !val || !isURL(val),
    { message: "Material field should not contain URLs. Please use the amazon_link fields for URLs." }
  ),
  finish_type: z.string().nullable().refine(
    (val) => !val || !isURL(val),
    { message: "Finish type field should not contain URLs." }
  ),
  color_family: z.string().nullable().refine(
    (val) => !val || !isURL(val),
    { message: "Color family field should not contain URLs." }
  ),
  amazon_link_us: z.string().nullable().refine(
    (val) => !val || isURL(val),
    { message: "Amazon US link must be a valid URL starting with http://, https://, or www." }
  ),
  amazon_link_uk: z.string().nullable().refine(
    (val) => !val || isURL(val),
    { message: "Amazon UK link must be a valid URL starting with http://, https://, or www." }
  ),
  amazon_link_de: z.string().nullable().refine(
    (val) => !val || isURL(val),
    { message: "Amazon DE link must be a valid URL starting with http://, https://, or www." }
  ),
  product_url: z.string().nullable().refine(
    (val) => !val || isURL(val),
    { message: "Product URL must be a valid URL starting with http://, https://, or www." }
  ),
  tds_url: z.string().nullable().refine(
    (val) => !val || isURL(val),
    { message: "TDS URL must be a valid URL starting with http://, https://, or www." }
  ),
  product_title: z.string().min(1, { message: "Product title is required" }).max(500, { message: "Product title must be less than 500 characters" }),
}).passthrough(); // Allow other fields to pass through

const AdminImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, errors: 0, warnings: 0 });
  const [importResults, setImportResults] = useState<{ success: number; errors: string[]; warnings: string[] } | null>(null);
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

  const downloadTemplate = () => {
    // CSV helper function to escape fields containing commas, quotes, or newlines
    const escapeCSVField = (field: string): string => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    // Define all column headers
    const headers = [
      'product_id',
      'product_title',
      'product_handle',
      'vendor',
      'material',
      'featured_image',
      'variant_sku',
      'product_url',
      'amazon_link_us',
      'amazon_link_uk',
      'amazon_link_de',
      'tds_url',
      'color_hex',
      'color_family',
      'finish_type',
      'diameter_nominal_mm',
      'net_weight_g',
      'variant_price',
      'density_g_cm3',
      'nozzle_temp_min_c',
      'nozzle_temp_max_c',
      'nozzle_temp_sweetspot_c',
      'bed_temp_min_c',
      'bed_temp_max_c',
      'print_speed_max_mms',
      'fan_min_percent',
      'fan_max_percent',
      'tensile_strength_xy_mpa',
      'tensile_modulus_xy_mpa',
      'elongation_break_xy_percent',
      'flexural_strength_mpa',
      'shore_hardness_d',
      'tg_c',
      'melt_temp_c',
      'spool_outer_d_mm',
      'spool_width_mm',
      'recommended_nozzle_type',
      'moisture_sensitivity_level',
      'moisture_care',
      'nozzle_care',
      'drying_temp_c',
      'drying_time_hours',
      'is_nozzle_abrasive',
      'spool_ams_fit',
      'variant_available',
      'ease_of_printing_score',
      'dimensional_accuracy_score',
      'strength_index',
      'printability_index',
      'value_score',
      'use_case_tags',
      'industry_tags',
      'food_contact_rating'
    ];

    // Example rows with proper data types
    const exampleRows = [
      [
        'PROD001',
        'Example PLA Filament 1.75mm White',
        'pla-white-1-75mm',
        'Example Manufacturer',
        'PLA',
        'https://example.com/images/pla-white.jpg',
        'SKU-PLA-WHT-175',
        'https://example.com/products/pla-white',
        'https://www.amazon.com/dp/EXAMPLE1',
        'https://www.amazon.co.uk/dp/EXAMPLE1',
        'https://www.amazon.de/dp/EXAMPLE1',
        'https://example.com/tds/pla-white.pdf',
        '#FFFFFF',
        'White',
        'Matte',
        '1.75',
        '1000',
        '19.99',
        '1.24',
        '190',
        '220',
        '205',
        '50',
        '60',
        '60',
        '0',
        '100',
        '50',
        '3500',
        '6',
        '45',
        '70',
        '60',
        '180',
        '200',
        '63',
        'Brass',
        'Low',
        'Store in sealed bag with desiccant',
        'Standard brass nozzle compatible',
        '50',
        '4',
        'false',
        'true',
        'true',
        '9',
        '8',
        '7.5',
        '8.5',
        '8.0',
        'Prototypes;Models;Decorative',
        'Education;Hobbyist;Professional',
        'not_rated'
      ],
      [
        'PROD002',
        'Example PETG Filament 1.75mm Black',
        'petg-black-1-75mm',
        'Example Manufacturer',
        'PETG',
        'https://example.com/images/petg-black.jpg',
        'SKU-PETG-BLK-175',
        'https://example.com/products/petg-black',
        'https://www.amazon.com/dp/EXAMPLE2',
        '',
        '',
        'https://example.com/tds/petg-black.pdf',
        '#000000',
        'Black',
        'Glossy',
        '1.75',
        '1000',
        '24.99',
        '1.27',
        '220',
        '250',
        '235',
        '70',
        '80',
        '50',
        '0',
        '100',
        '55',
        '4100',
        '53',
        '160',
        '51',
        '',
        '85',
        '230',
        '71',
        'Brass',
        'Medium',
        'Dry before use at 65C for 4 hours',
        'Brass nozzle recommended',
        '65',
        '4',
        'false',
        'true',
        'true',
        '7',
        '9',
        '8.5',
        '8.0',
        '7.5',
        'Functional Parts;Outdoor Use',
        'Professional;Industrial',
        'approved'
      ]
    ];

    // Build CSV content
    let csvContent = headers.map(escapeCSVField).join(',') + '\n';
    
    exampleRows.forEach(row => {
      csvContent += row.map(field => escapeCSVField(field.toString())).join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'filament_import_template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template downloaded",
      description: "CSV template downloaded successfully. Fill in your data and upload.",
    });
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

  // Helper function to download and upload image to storage
  const downloadAndUploadImage = async (imageUrl: string, productId: string): Promise<string | null> => {
    try {
      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) return null;
      
      const blob = await response.blob();
      
      // Generate a filename from the URL
      const urlParts = imageUrl.split('/');
      const originalFilename = urlParts[urlParts.length - 1].split('?')[0];
      const extension = originalFilename.split('.').pop() || 'jpg';
      const filename = `${productId}-${Date.now()}.${extension}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('filament-images')
        .upload(filename, blob, {
          contentType: blob.type,
          upsert: true
        });
      
      if (error) {
        console.error('Storage upload error:', error);
        return null;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('filament-images')
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error) {
      console.error('Image download error:', error);
      return null;
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress({ current: 0, total: 0, errors: 0, warnings: 0 });
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

      setProgress({ current: 0, total: rows.length, errors: 0, warnings: 0 });

      let successCount = 0;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Helper functions to safely parse numbers with database constraint validation
      const MAX_NUMERIC_VALUE = 99999999.99;
      
      const parseNumber = (value: any, fieldName?: string): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const parsed = parseFloat(value);
        if (isNaN(parsed)) return null;
        
        if (Math.abs(parsed) > MAX_NUMERIC_VALUE) {
          console.warn(`${fieldName || 'numeric field'} value ${parsed} exceeds max (${MAX_NUMERIC_VALUE}), skipping field`);
          return null;
        }
        
        return parsed;
      };

      const parseIntSafe = (value: any, fieldName?: string): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const parsed = Number.parseInt(value);
        if (isNaN(parsed)) return null;
        
        if (Math.abs(parsed) > MAX_NUMERIC_VALUE) {
          console.warn(`${fieldName || 'integer field'} value ${parsed} exceeds max (${MAX_NUMERIC_VALUE}), skipping field`);
          return null;
        }
        
        return parsed;
      };

      const parseBool = (value: any): boolean | null => {
        if (value === null || value === undefined || value === '') return null;
        return value === 'true' || value === '1' || value === 'TRUE' || value === 'True';
      };

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
          // Prepare validation data
          const validationData = {
            product_title: productTitle,
            material: row.material || row.Material || null,
            finish_type: row.finish_type || row.Finish_Type || null,
            color_family: row.color_family || row.Color_Family || null,
            amazon_link_us: row.amazon_link_us || row.Amazon_Link_US || row["Amazon Link US"] || null,
            amazon_link_uk: row.amazon_link_uk || row.Amazon_Link_UK || row["Amazon Link UK"] || null,
            amazon_link_de: row.amazon_link_de || row.Amazon_Link_DE || row["Amazon Link DE"] || null,
            product_url: row.product_url || row.Product_URL || row["Product URL"] || null,
            tds_url: row.tds_url || row.TDS_URL || row["TDS URL"] || null,
          };

          // Validate the row data
          const validationResult = filamentRowSchema.safeParse(validationData);
          
          if (!validationResult.success) {
            const validationErrors = validationResult.error.errors.map(err => 
              `${err.path.join('.')}: ${err.message}`
            ).join('; ');
            errors.push(`Row ${i + 2} (${productTitle}): Validation failed - ${validationErrors}`);
            setProgress(prev => ({ ...prev, current: i + 1, errors: prev.errors + 1 }));
            continue;
          }

          // Check for data quality issues and provide warnings
          let warningCount = 0;
          if (isURL(validationData.material)) {
            warnings.push(`Row ${i + 2} (${productTitle}): Material field contains URL "${validationData.material}" - moving to amazon_link_us`);
            warningCount++;
            // Auto-fix: move URL to correct field if amazon_link_us is empty
            if (!validationData.amazon_link_us) {
              validationData.amazon_link_us = validationData.material;
            }
            validationData.material = null;
          }
          
          if (isURL(validationData.finish_type)) {
            warnings.push(`Row ${i + 2} (${productTitle}): Finish type contains URL "${validationData.finish_type}" - removing`);
            warningCount++;
            validationData.finish_type = null;
          }
          
          if (isURL(validationData.color_family)) {
            warnings.push(`Row ${i + 2} (${productTitle}): Color family contains URL "${validationData.color_family}" - removing`);
            warningCount++;
            validationData.color_family = null;
          }
          
          // Update progress with warnings count
          if (warningCount > 0) {
            setProgress(prev => ({ ...prev, warnings: prev.warnings + warningCount }));
          }

          // Download and upload image if present
          const originalImageUrl = row.featured_image || row.Featured_Image || row["Featured Image"] || row.image || null;
          let storedImageUrl = originalImageUrl;
          
          if (originalImageUrl && originalImageUrl.startsWith('http')) {
            const productId = row.product_id || row.Product_ID || row["Product ID"] || `product-${i}`;
            const uploadedUrl = await downloadAndUploadImage(originalImageUrl, productId);
            if (uploadedUrl) {
              storedImageUrl = uploadedUrl;
            }
          }

          const filamentData: any = {
            product_id: row.product_id || row.Product_ID || row["Product ID"] || null,
            product_title: productTitle.trim(),
            product_handle: row.product_handle || row.Product_Handle || row["Product Handle"] || null,
            vendor: row.vendor || row.Vendor || null,
            material: validationData.material,
            featured_image: storedImageUrl,
            variant_sku: row.variant_sku || row.Variant_SKU || row["Variant SKU"] || null,
            product_url: validationData.product_url,
            amazon_link_us: validationData.amazon_link_us,
            amazon_link_uk: validationData.amazon_link_uk,
            amazon_link_de: validationData.amazon_link_de,
            tds_url: validationData.tds_url,
            
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
            nozzle_temp_min_c: parseIntSafe(row.nozzle_temp_min_c || row.Nozzle_Temp_Min_C, 'nozzle_temp_min_c'),
            nozzle_temp_max_c: parseIntSafe(row.nozzle_temp_max_c || row.Nozzle_Temp_Max_C, 'nozzle_temp_max_c'),
            nozzle_temp_sweetspot_c: parseIntSafe(row.nozzle_temp_sweetspot_c || row.Nozzle_Temp_Sweetspot_C, 'nozzle_temp_sweetspot_c'),
            bed_temp_min_c: parseIntSafe(row.bed_temp_min_c || row.Bed_Temp_Min_C, 'bed_temp_min_c'),
            bed_temp_max_c: parseIntSafe(row.bed_temp_max_c || row.Bed_Temp_Max_C, 'bed_temp_max_c'),
            
            // Print settings
            print_speed_max_mms: parseIntSafe(row.print_speed_max_mms || row.Print_Speed_Max_MMS, 'print_speed_max_mms'),
            fan_min_percent: parseIntSafe(row.fan_min_percent || row.Fan_Min_Percent, 'fan_min_percent'),
            fan_max_percent: parseIntSafe(row.fan_max_percent || row.Fan_Max_Percent, 'fan_max_percent'),
            
            // Physical properties
            diameter_nominal_mm: parseNumber(row.diameter_nominal_mm || row.Diameter_Nominal_MM, 'diameter_nominal_mm'),
            net_weight_g: parseIntSafe(row.net_weight_g || row.Net_Weight_G, 'net_weight_g'),
            spool_outer_d_mm: parseNumber(row.spool_outer_d_mm || row.Spool_Outer_D_MM, 'spool_outer_d_mm'),
            spool_width_mm: parseNumber(row.spool_width_mm || row.Spool_Width_MM, 'spool_width_mm'),
            
            // Color properties
            color_hex: row.color_hex || row.Color_Hex || null,
            color_family: validationData.color_family,
            finish_type: validationData.finish_type,
            
            // Care and compatibility
            recommended_nozzle_type: row.recommended_nozzle_type || row.Recommended_Nozzle_Type || null,
            moisture_sensitivity_level: row.moisture_sensitivity_level || row.Moisture_Sensitivity_Level || null,
            moisture_care: row.moisture_care || row.Moisture_Care || null,
            nozzle_care: row.nozzle_care || row.Nozzle_Care || null,
            drying_temp_c: parseIntSafe(row.drying_temp_c || row.Drying_Temp_C, 'drying_temp_c'),
            drying_time_hours: parseIntSafe(row.drying_time_hours || row.Drying_Time_Hours, 'drying_time_hours'),
            
            // Boolean flags with safe parsing
            is_nozzle_abrasive: parseBool(row.is_nozzle_abrasive || row.Is_Nozzle_Abrasive),
            spool_ams_fit: parseBool(row.spool_ams_fit || row.Spool_AMS_Fit),
            variant_available: row.variant_available !== 'false' && row.Variant_Available !== 'false',
            
            // Scores
            ease_of_printing_score: parseIntSafe(row.ease_of_printing_score || row.Ease_of_Printing_Score, 'ease_of_printing_score'),
            dimensional_accuracy_score: parseIntSafe(row.dimensional_accuracy_score || row.Dimensional_Accuracy_Score, 'dimensional_accuracy_score'),
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

      setImportResults({ success: successCount, errors, warnings });

      if (successCount > 0) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${successCount} filament(s). ${errors.length} error(s), ${warnings.length} warning(s).`,
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link to="/admin/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">CSV Import</h1>
            </div>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
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
                  <div className="flex gap-3">
                    {progress.warnings > 0 && (
                      <span className="text-yellow-600">{progress.warnings} warnings</span>
                    )}
                    <span className="text-destructive">{progress.errors} errors</span>
                  </div>
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
                    {importResults.warnings.length > 0 && (
                      <div className="flex justify-between">
                        <span>Warnings:</span>
                        <span className="font-medium text-yellow-600">{importResults.warnings.length}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Errors:</span>
                      <span className="font-medium text-destructive">{importResults.errors.length}</span>
                    </div>
                  </div>
                </div>

                {importResults.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Data Quality Warnings</AlertTitle>
                    <AlertDescription>
                      <div className="max-h-48 overflow-y-auto space-y-1 text-sm mt-2">
                        {importResults.warnings.map((warning, idx) => (
                          <div key={idx} className="text-muted-foreground">{warning}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

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
