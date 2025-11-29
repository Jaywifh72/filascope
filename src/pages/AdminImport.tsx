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
  product_title: z.string().min(1, { message: "Product title is required" }).max(500, { message: "Product title must be less than 500 characters" }),
}).passthrough();

const AdminImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, errors: 0, warnings: 0 });
  const [importResults, setImportResults] = useState<{ success: number; errors: string[]; warnings: string[] } | null>(null);
  const [logs, setLogs] = useState<Array<{ type: 'info' | 'success' | 'error' | 'warning'; message: string }>>([]);
  const [weightStats, setWeightStats] = useState<{ total: number; kg: number; g: number; unchanged: number } | null>(null);
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

  const addLog = (type: 'info' | 'success' | 'error' | 'warning', message: string) => {
    setLogs(prev => [...prev, { type, message }]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      // Reset previous results
      setImportResults(null);
      setProgress({ current: 0, total: 0, errors: 0, warnings: 0 });
      setLogs([]);
      setWeightStats(null);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'Product ID', 'Product Title', 'Vendor', 'Material', 'Featured Image', 
      'Variant SKU', 'Variant Price', 'Product URL', 'Amazon Link US', 
      'TDS URL', 'net_weight_g', 'diameter_nominal_mm'
    ];
    
    const exampleRow = [
      '20000001',
      'Example PLA Filament Black 1.75mm',
      'Example Brand',
      'PLA',
      'https://example.com/image.jpg',
      'SKU-001',
      '19.99',
      'https://example.com/product',
      'https://amazon.com/dp/EXAMPLE',
      'https://example.com/tds.pdf',
      '1000',
      '1.75'
    ];

    const csvContent = headers.join(',') + '\n' + exampleRow.join(',');
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
      description: "CSV template downloaded successfully.",
    });
  };

  const parseCSV = (text: string) => {
    const lines: string[] = [];
    let currentLine = '';
    let insideQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentLine += '"';
          i++;
        } else {
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
        i++;
      } else {
        currentLine += char;
      }
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine);
    }
    
    if (lines.length === 0) return [];
    
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
          current += '"';
          i++;
        } else {
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

  const downloadAndUploadImage = async (imageUrl: string, productId: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) return null;
      
      const blob = await response.blob();
      const urlParts = imageUrl.split('/');
      const originalFilename = urlParts[urlParts.length - 1].split('?')[0];
      const extension = originalFilename.split('.').pop() || 'jpg';
      const filename = `${productId}-${Date.now()}.${extension}`;
      
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
      
      const { data: { publicUrl } } = supabase.storage
        .from('filament-images')
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error) {
      console.error('Image download error:', error);
      return null;
    }
  };

  const parseNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return null;
    // Check for overflow - PostgreSQL numeric type can handle very large values
    if (!isFinite(parsed)) return null;
    return parsed;
  };

  const parseIntSafe = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseInt(value);
    if (isNaN(parsed)) return null;
    // PostgreSQL integer range: -2147483648 to 2147483647
    if (parsed < -2147483648 || parsed > 2147483647) {
      console.warn(`Integer overflow for value: ${value} (parsed as ${parsed})`);
      return null;
    }
    return parsed;
  };

  const parseBool = (value: any): boolean | null => {
    if (value === null || value === undefined || value === '') return null;
    const str = String(value).toLowerCase();
    return str === 'true' || str === '1' || str === 'yes';
  };

  // Normalize weight values: convert kg/g to numeric grams
  const normalizeWeight = (value: any): string => {
    if (value === null || value === undefined || value === '') return '';
    const str = String(value).trim().toLowerCase();
    
    // Handle kg values (multiply by 1000)
    if (str.endsWith('kg')) {
      const num = parseFloat(str.slice(0, -2));
      if (isNaN(num)) return '';
      return String(Math.round(num * 1000));
    }
    
    // Handle g values (strip the 'g')
    if (str.endsWith('g')) {
      const num = parseFloat(str.slice(0, -1));
      if (isNaN(num)) return '';
      return String(Math.round(num));
    }
    
    // Return as-is if no unit
    return str;
  };

  const parseWeight = (value: any, rowNum?: number): number | null => {
    // Silently return null for empty values (this is normal - not all products have weights)
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const str = String(value).trim();
    const parsed = parseIntSafe(str);
    if (parsed === null) {
      // Only log error if there was a value that failed to parse
      console.error(`❌ Row ${rowNum}: Failed to parse weight value: ${value}`);
    }
    return parsed;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress({ current: 0, total: 0, errors: 0, warnings: 0 });
    setImportResults(null);
    setLogs([]);
    setWeightStats(null);

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

      console.log(`🚀 Starting NEW import of ${rows.length} rows...`);
      addLog('info', `🚀 Starting import of ${rows.length} rows`);
      console.log("📋 CSV Headers:", Object.keys(rows[0]));
      addLog('info', `📋 CSV Headers: ${Object.keys(rows[0]).join(', ')}`);
      
      // Step 1: Normalize weight values across all rows
      console.log("\n" + "=".repeat(80));
      console.log("🔄 STEP 1: WEIGHT NORMALIZATION (kg/g → numeric grams)");
      console.log("=".repeat(80));
      addLog('info', '🔄 Step 1: Analyzing and normalizing weight values...');
      
      let kgCount = 0;
      let gCount = 0;
      let unchangedCount = 0;
      let totalWeights = 0;
      
      rows.forEach((row, idx) => {
        const originalWeight = row['Variant Weight Unit'];
        
        // Always normalize the field, even if empty
        if (originalWeight) {
          totalWeights++;
          const str = String(originalWeight).trim().toLowerCase();
          const normalizedWeight = normalizeWeight(originalWeight);
          
          if (str.endsWith('kg')) {
            kgCount++;
            if (idx < 10) {
              console.log(`  ✓ Row ${idx + 2}: "${originalWeight}" → "${normalizedWeight}" (kg conversion)`);
            }
          } else if (str.endsWith('g')) {
            gCount++;
            if (idx < 10) {
              console.log(`  ✓ Row ${idx + 2}: "${originalWeight}" → "${normalizedWeight}" (stripped 'g')`);
            }
          } else {
            unchangedCount++;
            if (idx < 10) {
              console.log(`  → Row ${idx + 2}: "${originalWeight}" (no change needed)`);
            }
          }
          
          row['Variant Weight Unit'] = normalizedWeight;
        } else {
          // Set empty/null weights to null explicitly so parseWeight handles them gracefully
          row['Variant Weight Unit'] = null;
        }
      });
      
      const weightStatsData = { total: totalWeights, kg: kgCount, g: gCount, unchanged: unchangedCount };
      setWeightStats(weightStatsData);
      
      console.log("\n📊 WEIGHT CONVERSION STATISTICS:");
      console.log(`   Total weight cells processed: ${totalWeights}`);
      console.log(`   ✓ Converted from kg: ${kgCount} cells`);
      console.log(`   ✓ Stripped 'g' suffix: ${gCount} cells`);
      console.log(`   → Unchanged (no unit): ${unchangedCount} cells`);
      console.log("=".repeat(80) + "\n");
      
      addLog('success', `✓ Weight normalization complete: ${totalWeights} cells processed`);
      addLog('info', `  • ${kgCount} converted from kg to grams`);
      addLog('info', `  • ${gCount} stripped 'g' suffix`);
      addLog('info', `  • ${unchangedCount} unchanged (numeric only)`);
      
      console.log("📝 Sample row after normalization:", {
        'Product Title': rows[0]['Product Title'],
        'Vendor': rows[0]['Vendor'],
        'Material': rows[0]['Material'],
        'Variant Weight Unit': rows[0]['Variant Weight Unit'],
        'Variant Price': rows[0]['Variant Price']
      });

      // Step 2: Validate weight values after preprocessing
      console.log("\n" + "=".repeat(80));
      console.log("🔍 STEP 2: VALIDATING WEIGHT VALUES");
      console.log("=".repeat(80));
      addLog('info', '🔍 Step 2: Validating preprocessed weight values...');
      
      let validWeights = 0;
      let nullWeights = 0;
      let invalidWeights = 0;
      const invalidWeightRows: Array<{ row: number; value: any }> = [];
      
      rows.forEach((row, idx) => {
        const weightValue = row['Variant Weight Unit'];
        const rowNum = idx + 2;
        
        if (weightValue === null || weightValue === undefined || weightValue === '') {
          nullWeights++;
        } else {
          const str = String(weightValue).trim().toLowerCase();
          
          // Check if value still contains units (should have been removed)
          if (str.endsWith('kg') || str.endsWith('g')) {
            invalidWeights++;
            invalidWeightRows.push({ row: rowNum, value: weightValue });
            console.error(`⚠️ Row ${rowNum}: Weight still contains units: "${weightValue}"`);
            if (invalidWeights <= 5) {
              addLog('error', `⚠️ Row ${rowNum}: Weight not preprocessed: "${weightValue}"`);
            }
          } else if (isNaN(parseFloat(str))) {
            invalidWeights++;
            invalidWeightRows.push({ row: rowNum, value: weightValue });
            console.error(`⚠️ Row ${rowNum}: Weight is not numeric: "${weightValue}"`);
            if (invalidWeights <= 5) {
              addLog('error', `⚠️ Row ${rowNum}: Weight not numeric: "${weightValue}"`);
            }
          } else {
            validWeights++;
          }
        }
      });
      
      console.log("\n📊 WEIGHT VALIDATION RESULTS:");
      console.log(`   ✓ Valid numeric weights: ${validWeights}`);
      console.log(`   ○ Null/empty weights (acceptable): ${nullWeights}`);
      console.log(`   ✗ Invalid weights: ${invalidWeights}`);
      
      if (invalidWeights > 0) {
        console.log(`\n⚠️ FIRST 10 INVALID WEIGHTS:`);
        invalidWeightRows.slice(0, 10).forEach(({ row, value }) => {
          console.log(`   Row ${row}: "${value}"`);
        });
        if (invalidWeightRows.length > 10) {
          console.log(`   ... and ${invalidWeightRows.length - 10} more`);
        }
      }
      console.log("=".repeat(80) + "\n");
      
      addLog(invalidWeights > 0 ? 'warning' : 'success', 
        `✓ Validation complete: ${validWeights} valid, ${nullWeights} empty, ${invalidWeights} invalid`);
      
      if (invalidWeights > 0) {
        addLog('warning', `⚠️ ${invalidWeights} rows have invalid weight values - these will be imported as NULL`);
      }

      // Step 3: Import to database
      console.log("\n" + "=".repeat(80));
      console.log("🔄 STEP 3: IMPORTING FILAMENT DATA");
      console.log("=".repeat(80));
      addLog('info', '🔄 Step 3: Starting database import...');

      setProgress({ current: 0, total: rows.length, errors: 0, warnings: 0 });

      let successCount = 0;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Process rows in batches
      const BATCH_SIZE = 50;
      for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, rows.length);
        const batch = rows.slice(batchStart, batchEnd);
        
        console.log(`\n📦 Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1} (rows ${batchStart + 2}-${batchEnd + 1})`);
        addLog('info', `📦 Batch ${Math.floor(batchStart / BATCH_SIZE) + 1}: Rows ${batchStart + 2}-${batchEnd + 1}`);

        for (let i = 0; i < batch.length; i++) {
          const rowIndex = batchStart + i;
          const row = batch[i];
          const rowNum = rowIndex + 2; // +2 for header and 1-indexed
          
          // Get product title - this is required
          const productTitle = row['Product Title'];
          if (!productTitle || productTitle.trim() === "") {
            const errorMsg = `Row ${rowNum}: Missing Product Title`;
            errors.push(errorMsg);
            addLog('error', `❌ ${errorMsg}`);
            setProgress(prev => ({ ...prev, current: rowIndex + 1, errors: prev.errors + 1 }));
            continue;
          }

          try {
            // Map CSV columns to database fields with detailed logging
            const filamentData: any = {
              product_id: row['Product ID'] || null,
              product_title: productTitle.trim(),
              product_handle: row['Product Handle'] || null,
              vendor: row['Vendor'] || null,
              material: row['Material'] || null,
              featured_image: row['Featured Image'] || null,
              variant_sku: row['Variant SKU'] || null,
              product_url: row['Product URL'] || null,
              amazon_link_us: row['Amazon Link US'] || null,
              amazon_link_uk: row['Amazon Link UK'] || null,
              amazon_link_de: row['Amazon Link DE'] || null,
              tds_url: row['TDS URL'] || null,
              
              // Physical properties
              density_g_cm3: parseNumber(row['density_g_cm3']),
              diameter_nominal_mm: parseNumber(row['diameter_nominal_mm']),
              net_weight_g: parseWeight(row['Variant Weight Unit'], rowNum),
              spool_outer_d_mm: parseNumber(row['spool_outer_d_mm']),
              spool_width_mm: parseNumber(row['spool_width_mm']),
              variant_price: parseNumber(row['Variant Price']),
              
              // Thermal properties
              tg_c: parseNumber(row['tg_c']),
              melt_temp_c: parseNumber(row['melt_temp_c']),
              nozzle_temp_min_c: parseIntSafe(row['nozzle_temp_min_c']),
              nozzle_temp_max_c: parseIntSafe(row['nozzle_temp_max_c']),
              nozzle_temp_sweetspot_c: parseIntSafe(row['nozzle_temp_sweetspot_c']),
              bed_temp_min_c: parseIntSafe(row['bed_temp_min_c']),
              bed_temp_max_c: parseIntSafe(row['bed_temp_max_c']),
              
              // Mechanical properties
              tensile_strength_xy_mpa: parseNumber(row['tensile_strength_xy_mpa']),
              tensile_modulus_xy_mpa: parseNumber(row['tensile_modulus_xy_mpa']),
              elongation_break_xy_percent: parseNumber(row['elongation_break_xy_percent']),
              flexural_strength_mpa: parseNumber(row['flexural_strength_mpa']),
              shore_hardness_d: parseNumber(row['shore_hardness_d']),
              
              // Print settings
              print_speed_max_mms: parseIntSafe(row['print_speed_max_mms']),
              fan_min_percent: parseIntSafe(row['fan_min_percent']),
              fan_max_percent: parseIntSafe(row['fan_max_percent']),
              
              // Color and appearance
              color_hex: row['color_hex'] || null,
              color_family: row['color_family'] || null,
              finish_type: row['finish_type'] || null,
              
              // Care and handling
              moisture_sensitivity_level: row['moisture_sensitivity_level'] || null,
              moisture_care: row['moisture_care'] || null,
              nozzle_care: row['nozzle_care'] || null,
              drying_temp_c: parseIntSafe(row['drying_temp_c']),
              drying_time_hours: parseIntSafe(row['drying_time_hours']),
              recommended_nozzle_type: row['recommended_nozzle_type'] || null,
              
              // Flags
              is_nozzle_abrasive: parseBool(row['is_nozzle_abrasive']),
              spool_ams_fit: parseBool(row['spool_ams_fit']),
              variant_available: parseBool(row['Variant Available']) !== false,
              
              // Scores
              ease_of_printing_score: parseIntSafe(row['ease_of_printing_score']),
              dimensional_accuracy_score: parseIntSafe(row['dimensional_accuracy_score']),
              strength_index: parseNumber(row['strength_index']),
              printability_index: parseNumber(row['printability_index']),
              value_score: parseNumber(row['value_score']),
              
              // Tags
              use_case_tags: row['use_case_tags'] ? row['use_case_tags'].split(',').map((t: string) => t.trim()).filter((t: string) => t) : null,
              industry_tags: row['industry_tags'] ? row['industry_tags'].split(',').map((t: string) => t.trim()).filter((t: string) => t) : null,
              
              // Other
              food_contact_rating: row['food_contact_rating'] || null,
            };

            // Log sample field values for debugging overflow issues
            if (rowNum <= 5 || rowNum % 500 === 0) {
              const debugFields = ['net_weight_g', 'variant_price', 'tensile_modulus_xy_mpa'];
              const debugInfo: any = {};
              debugFields.forEach(field => {
                const csvKey = field === 'variant_price' ? 'Variant Price' : field;
                debugInfo[field] = {
                  raw: row[csvKey],
                  parsed: filamentData[field]
                };
              });
              console.log(`Row ${rowNum} sample values:`, debugInfo);
            }

            // Remove null/undefined/empty values
            Object.keys(filamentData).forEach(key => {
              if (filamentData[key] === null || filamentData[key] === undefined || filamentData[key] === '') {
                delete filamentData[key];
              }
            });

            // Generate product_id if missing
            if (!filamentData.product_id) {
              const vendor = filamentData.vendor || 'unknown';
              const title = productTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
              filamentData.product_id = `${vendor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${title}-${Date.now()}-${rowIndex}`;
              console.log(`🔑 Generated product_id: ${filamentData.product_id}`);
            }

            // Download and upload image if it's an external URL
            if (filamentData.featured_image && filamentData.featured_image.startsWith('http')) {
              const uploadedUrl = await downloadAndUploadImage(filamentData.featured_image, filamentData.product_id);
              if (uploadedUrl) {
                filamentData.featured_image = uploadedUrl;
              }
            }

            // Insert/update in database
            const { error } = await supabase
              .from("filaments")
              .upsert(filamentData, { onConflict: "product_id" });

            if (error) {
              console.error(`❌ Row ${rowNum} (${productTitle}):`, {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
              });
              
              // Enhanced error message with field information
              let errorMsg = `Row ${rowNum} (${productTitle}): ${error.message}`;
              if (error.details) errorMsg += ` | Details: ${error.details}`;
              if (error.hint) errorMsg += ` | Hint: ${error.hint}`;
              
              errors.push(errorMsg);
              addLog('error', `❌ Row ${rowNum}: ${productTitle} - ${error.message}`);
              setProgress(prev => ({ ...prev, current: rowIndex + 1, errors: prev.errors + 1 }));
            } else {
              console.log(`✅ Row ${rowNum} (${productTitle}) imported successfully`);
              addLog('success', `✅ Row ${rowNum}: ${productTitle}`);
              successCount++;
              setProgress(prev => ({ ...prev, current: rowIndex + 1 }));
            }
          } catch (rowError: any) {
            console.error(`❌ Exception at row ${rowNum}:`, rowError);
            const errorMsg = `Row ${rowNum}: ${rowError.message}`;
            errors.push(errorMsg);
            addLog('error', `❌ ${errorMsg}`);
            setProgress(prev => ({ ...prev, current: rowIndex + 1, errors: prev.errors + 1 }));
          }
        }
      }

      console.log("\n" + "=".repeat(80));
      console.log(`✅ IMPORT COMPLETE`);
      console.log(`   Successful: ${successCount}`);
      console.log(`   Errors: ${errors.length}`);
      console.log(`   Warnings: ${warnings.length}`);
      console.log("=".repeat(80) + "\n");
      
      addLog('info', '');
      addLog('success', `✅ Import complete: ${successCount} successful, ${errors.length} errors, ${warnings.length} warnings`);

      setImportResults({ success: successCount, errors, warnings });

      if (successCount > 0) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${successCount} filament(s). ${errors.length} error(s).`,
        });
      } else {
        toast({
          title: "Import failed",
          description: `No filaments were imported. Check error details below.`,
          variant: "destructive",
        });
      }

      setFile(null);
    } catch (error: any) {
      console.error("Import error:", error);
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
            Upload filament data via CSV - new standardized format
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
                  onClick={() => {
                    setFile(null);
                    setImportResults(null);
                    setProgress({ current: 0, total: 0, errors: 0, warnings: 0 });
                    setLogs([]);
                    setWeightStats(null);
                  }}
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

            {isUploading && progress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Processing: {progress.current} / {progress.total}</span>
                  <span className="text-destructive">{progress.errors} errors</span>
                </div>
                <Progress value={(progress.current / progress.total) * 100} />
              </div>
            )}

            {weightStats && (
              <div className="rounded-lg border bg-blue-500/10 border-blue-500/20 p-4">
                <h3 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">Weight Conversion Statistics</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total weight cells processed:</span>
                    <span className="font-medium">{weightStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Converted from kg (× 1000):</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{weightStats.kg} cells</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stripped 'g' suffix:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{weightStats.g} cells</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unchanged (numeric only):</span>
                    <span className="font-medium text-muted-foreground">{weightStats.unchanged} cells</span>
                  </div>
                </div>
              </div>
            )}

            {logs.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <h3 className="font-semibold mb-2">Import Log</h3>
                <div className="max-h-96 overflow-y-auto space-y-0.5 text-xs font-mono">
                  {logs.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={`
                        ${log.type === 'success' ? 'text-green-600 dark:text-green-400' : ''}
                        ${log.type === 'error' ? 'text-red-600 dark:text-red-400' : ''}
                        ${log.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : ''}
                        ${log.type === 'info' ? 'text-foreground/70' : ''}
                      `}
                    >
                      {log.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    <h3 className="font-semibold mb-2 text-destructive">Error Details (first 50)</h3>
                    <div className="max-h-64 overflow-y-auto space-y-1 text-sm">
                      {importResults.errors.slice(0, 50).map((error, idx) => (
                        <div key={idx} className="text-destructive/90">{error}</div>
                      ))}
                      {importResults.errors.length > 50 && (
                        <div className="text-destructive/70 italic">... and {importResults.errors.length - 50} more errors</div>
                      )}
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
