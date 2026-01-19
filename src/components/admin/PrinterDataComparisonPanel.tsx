import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Eye, 
  FileSpreadsheet,
  Search,
  BarChart3,
  Filter,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define all CSV fields that were in the import
const CSV_FIELDS = [
  'printer_id', 'brand', 'model_name', 'series_name', 'variant_or_bundle_name',
  'printer_technology', 'sku', 'ean_upc', 'release_date', 'discontinued',
  'discontinued_date', 'firmware_family', 'firmware_open_source', 'official_product_url',
  'official_store_url', 'amazon_url_us', 'amazon_url_ca', 'amazon_url_uk',
  'other_retailer_urls', 'build_volume_x_mm', 'build_volume_y_mm', 'build_volume_z_mm',
  'build_volume_shape', 'max_build_height_with_ams_mm', 'machine_width_mm',
  'machine_depth_mm', 'machine_height_mm', 'machine_weight_kg', 'machine_style',
  'frame_material', 'has_enclosure', 'enclosure_type', 'enclosure_heated',
  'enclosure_max_temp_c', 'max_travel_speed_xy_mms', 'max_print_speed_mms',
  'recommended_quality_speed_mms', 'max_acceleration_xy_mmss', 'max_acceleration_z_mmss',
  'input_shaping_supported', 'linear_rails_on_axes', 'motion_system_notes',
  'extruder_count', 'extruder_type', 'extruder_drive_type', 'filament_diameter_mm',
  'max_nozzle_temp_c', 'sustained_nozzle_temp_c', 'hotend_type', 'hotend_brand_model',
  'stock_nozzle_diameter_mm', 'supported_nozzle_diameters_mm', 'nozzle_material',
  'max_flow_rate_mm3s', 'abrasive_filament_support', 'extruder_notes',
  'bed_size_x_mm', 'bed_size_y_mm', 'bed_type', 'bed_heated', 'bed_max_temp_c',
  'bed_heater_power_w', 'stock_plate_types', 'supported_plate_types',
  'auto_bed_leveling', 'abl_technique', 'auto_bed_leveling_method',
  'first_layer_assist_features', 'filter_type', 'internal_lighting', 'door_sensor',
  'smoke_sensor', 'temperature_sensors', 'official_supported_materials',
  'recommended_materials', 'abrasive_materials_supported', 'max_recommended_material_temp_c',
  'materials_notes', 'multi_material_supported', 'native_multi_material_system',
  'compatible_multi_material_systems', 'multi_material_max_spools',
  'multi_material_spool_chamber_max_temp_c', 'multi_material_drying_capability',
  'multi_material_limitations_notes', 'has_wifi', 'has_ethernet', 'has_bluetooth',
  'has_usb_a_port', 'has_usb_c_port', 'has_sd_card', 'has_micro_sd_card',
  'onboard_storage_gb', 'cloud_platforms', 'remote_monitoring_supported',
  'remote_control_supported', 'screen_type', 'screen_size_inch', 'screen_resolution',
  'control_knob', 'ui_language_options', 'assembly_required', 'average_assembly_time_min',
  'maintenance_interval_hours', 'nozzle_change_ease', 'belt_tensioning_method',
  'common_failure_points', 'recommended_upgrades', 'noise_level_printing_db',
  'noise_level_idle_db', 'power_input_voltage', 'rated_power_w', 'typical_power_pla_w',
  'typical_power_abs_w', 'power_supply_type', 'thermal_runaway_protection',
  'power_loss_recovery', 'safety_certifications', 'safety_notes', 'msrp_usd',
  'msrp_cad', 'msrp_eur', 'current_price_usd_store', 'current_price_usd_amazon',
  'price_tier', 'target_user_segment', 'marketing_tags', 'rating_community_overall',
  'rating_ease_of_use', 'rating_print_quality', 'rating_reliability',
  'rating_value_for_money', 'review_count_aggregated', 'community_popularity_score',
  'common_mods_tags', 'compatible_plate_types', 'default_plate_type',
  'printer_profile_slug_in_slicers', 'data_source_urls', 'data_source_priority',
  'data_quality_notes', 'last_verified_utc'
];

// Fields that are displayed in the UI (PrinterDetail page and SpecsDrawerSection)
const UI_DISPLAYED_FIELDS = [
  // Hero section
  'model_name', 'brand', 'msrp_usd', 'current_price_usd_store', 'current_price_usd_amazon',
  'rating_community_overall', 'review_count_aggregated',
  
  // Key specs bar
  'build_volume_x_mm', 'build_volume_y_mm', 'build_volume_z_mm',
  'max_print_speed_mms', 'max_nozzle_temp_c',
  
  // Build Volume & Dimensions drawer
  'has_enclosure', 'enclosure_type', 'enclosure_heated', 'enclosure_max_temp_c',
  'internal_lighting', 'door_sensor',
  
  // Print Capabilities drawer
  'max_travel_speed_xy_mms', 'recommended_quality_speed_mms',
  'max_acceleration_xy_mmss', 'max_acceleration_z_mmss', 'input_shaping_supported',
  'linear_rails_on_axes', 'extruder_count', 'extruder_type', 'extruder_drive_type',
  'filament_diameter_mm', 'sustained_nozzle_temp_c', 'hotend_type', 'hotend_brand_model',
  'stock_nozzle_diameter_mm', 'supported_nozzle_diameters_mm', 'nozzle_material',
  'max_flow_rate_mm3s', 'bed_size_x_mm', 'bed_size_y_mm', 'bed_type', 'bed_heated',
  'bed_max_temp_c', 'bed_heater_power_w', 'stock_plate_types', 'supported_plate_types',
  'auto_bed_leveling', 'auto_bed_leveling_method',
  
  // Materials & Features drawer
  'official_supported_materials', 'recommended_materials', 'abrasive_materials_supported',
  'max_recommended_material_temp_c', 'multi_material_supported', 'native_multi_material_system',
  'multi_material_max_spools', 'multi_material_spool_chamber_max_temp_c',
  'multi_material_drying_capability', 'compatible_multi_material_systems',
  
  // Connectivity drawer
  'has_wifi', 'has_ethernet', 'has_bluetooth', 'has_usb_a_port', 'has_usb_c_port',
  'has_sd_card', 'has_micro_sd_card', 'onboard_storage_gb', 'cloud_platforms',
  'remote_monitoring_supported', 'remote_control_supported', 'screen_type',
  'screen_size_inch', 'screen_resolution', 'control_knob', 'ui_language_options',
  
  // Power & Construction drawer
  'power_input_voltage', 'rated_power_w', 'typical_power_pla_w', 'typical_power_abs_w',
  'power_supply_type', 'thermal_runaway_protection', 'power_loss_recovery',
  'safety_certifications', 'smoke_sensor', 'filter_type', 'temperature_sensors',
  'assembly_required', 'average_assembly_time_min', 'maintenance_interval_hours',
  'nozzle_change_ease', 'noise_level_printing_db', 'noise_level_idle_db',
  
  // Other visible fields
  'official_product_url', 'official_store_url', 'amazon_url_us', 'amazon_url_ca',
  'amazon_url_uk', 'price_tier', 'target_user_segment', 'series_name', 'variant_or_bundle_name'
];

// Field categories for organization
const FIELD_CATEGORIES: Record<string, string[]> = {
  'Identity': ['printer_id', 'brand', 'model_name', 'series_name', 'variant_or_bundle_name', 'printer_technology', 'sku', 'ean_upc'],
  'Dates & Status': ['release_date', 'discontinued', 'discontinued_date', 'last_verified_utc'],
  'Firmware': ['firmware_family', 'firmware_open_source'],
  'URLs': ['official_product_url', 'official_store_url', 'amazon_url_us', 'amazon_url_ca', 'amazon_url_uk', 'other_retailer_urls'],
  'Build Volume': ['build_volume_x_mm', 'build_volume_y_mm', 'build_volume_z_mm', 'build_volume_shape', 'max_build_height_with_ams_mm'],
  'Machine Dimensions': ['machine_width_mm', 'machine_depth_mm', 'machine_height_mm', 'machine_weight_kg', 'machine_style', 'frame_material'],
  'Enclosure': ['has_enclosure', 'enclosure_type', 'enclosure_heated', 'enclosure_max_temp_c'],
  'Motion': ['max_travel_speed_xy_mms', 'max_print_speed_mms', 'recommended_quality_speed_mms', 'max_acceleration_xy_mmss', 'max_acceleration_z_mmss', 'input_shaping_supported', 'linear_rails_on_axes', 'motion_system_notes'],
  'Extruder': ['extruder_count', 'extruder_type', 'extruder_drive_type', 'filament_diameter_mm', 'extruder_notes'],
  'Hotend': ['max_nozzle_temp_c', 'sustained_nozzle_temp_c', 'hotend_type', 'hotend_brand_model', 'stock_nozzle_diameter_mm', 'supported_nozzle_diameters_mm', 'nozzle_material', 'max_flow_rate_mm3s', 'abrasive_filament_support'],
  'Bed': ['bed_size_x_mm', 'bed_size_y_mm', 'bed_type', 'bed_heated', 'bed_max_temp_c', 'bed_heater_power_w', 'stock_plate_types', 'supported_plate_types', 'compatible_plate_types', 'default_plate_type'],
  'Leveling': ['auto_bed_leveling', 'abl_technique', 'auto_bed_leveling_method', 'first_layer_assist_features'],
  'Sensors': ['internal_lighting', 'door_sensor', 'smoke_sensor', 'temperature_sensors', 'filter_type'],
  'Materials': ['official_supported_materials', 'recommended_materials', 'abrasive_materials_supported', 'max_recommended_material_temp_c', 'materials_notes'],
  'Multi-Material': ['multi_material_supported', 'native_multi_material_system', 'compatible_multi_material_systems', 'multi_material_max_spools', 'multi_material_spool_chamber_max_temp_c', 'multi_material_drying_capability', 'multi_material_limitations_notes'],
  'Connectivity': ['has_wifi', 'has_ethernet', 'has_bluetooth', 'has_usb_a_port', 'has_usb_c_port', 'has_sd_card', 'has_micro_sd_card', 'onboard_storage_gb', 'cloud_platforms', 'remote_monitoring_supported', 'remote_control_supported'],
  'Display': ['screen_type', 'screen_size_inch', 'screen_resolution', 'control_knob', 'ui_language_options'],
  'Assembly & Maintenance': ['assembly_required', 'average_assembly_time_min', 'maintenance_interval_hours', 'nozzle_change_ease', 'belt_tensioning_method', 'common_failure_points', 'recommended_upgrades'],
  'Noise': ['noise_level_printing_db', 'noise_level_idle_db'],
  'Power': ['power_input_voltage', 'rated_power_w', 'typical_power_pla_w', 'typical_power_abs_w', 'power_supply_type'],
  'Safety': ['thermal_runaway_protection', 'power_loss_recovery', 'safety_certifications', 'safety_notes'],
  'Pricing': ['msrp_usd', 'msrp_cad', 'msrp_eur', 'current_price_usd_store', 'current_price_usd_amazon', 'price_tier'],
  'Target & Marketing': ['target_user_segment', 'marketing_tags'],
  'Ratings': ['rating_community_overall', 'rating_ease_of_use', 'rating_print_quality', 'rating_reliability', 'rating_value_for_money', 'review_count_aggregated', 'community_popularity_score'],
  'Mods & Slicers': ['common_mods_tags', 'printer_profile_slug_in_slicers'],
  'Data Quality': ['data_source_urls', 'data_source_priority', 'data_quality_notes'],
};

// Expected types for normalization validation
const FIELD_TYPES: Record<string, 'boolean' | 'number' | 'date' | 'text' | 'url'> = {
  // Booleans
  discontinued: 'boolean', firmware_open_source: 'boolean', has_enclosure: 'boolean',
  enclosure_heated: 'boolean', input_shaping_supported: 'boolean', bed_heated: 'boolean',
  auto_bed_leveling: 'boolean', internal_lighting: 'boolean', door_sensor: 'boolean',
  smoke_sensor: 'boolean', abrasive_materials_supported: 'boolean', abrasive_filament_support: 'boolean',
  multi_material_supported: 'boolean', native_multi_material_system: 'boolean',
  multi_material_drying_capability: 'boolean', has_wifi: 'boolean', has_ethernet: 'boolean',
  has_bluetooth: 'boolean', has_usb_a_port: 'boolean', has_usb_c_port: 'boolean',
  has_sd_card: 'boolean', has_micro_sd_card: 'boolean', remote_monitoring_supported: 'boolean',
  remote_control_supported: 'boolean', control_knob: 'boolean', assembly_required: 'boolean',
  thermal_runaway_protection: 'boolean', power_loss_recovery: 'boolean',
  
  // Numbers
  build_volume_x_mm: 'number', build_volume_y_mm: 'number', build_volume_z_mm: 'number',
  max_build_height_with_ams_mm: 'number', machine_width_mm: 'number', machine_depth_mm: 'number',
  machine_height_mm: 'number', machine_weight_kg: 'number', enclosure_max_temp_c: 'number',
  max_travel_speed_xy_mms: 'number', max_print_speed_mms: 'number', recommended_quality_speed_mms: 'number',
  max_acceleration_xy_mmss: 'number', max_acceleration_z_mmss: 'number', extruder_count: 'number',
  filament_diameter_mm: 'number', max_nozzle_temp_c: 'number', sustained_nozzle_temp_c: 'number',
  stock_nozzle_diameter_mm: 'number', max_flow_rate_mm3s: 'number', bed_size_x_mm: 'number',
  bed_size_y_mm: 'number', bed_max_temp_c: 'number', bed_heater_power_w: 'number',
  max_recommended_material_temp_c: 'number', multi_material_max_spools: 'number',
  multi_material_spool_chamber_max_temp_c: 'number', onboard_storage_gb: 'number',
  screen_size_inch: 'number', average_assembly_time_min: 'number', maintenance_interval_hours: 'number',
  noise_level_printing_db: 'number', noise_level_idle_db: 'number', rated_power_w: 'number',
  typical_power_pla_w: 'number', typical_power_abs_w: 'number', msrp_usd: 'number',
  msrp_cad: 'number', msrp_eur: 'number', current_price_usd_store: 'number',
  current_price_usd_amazon: 'number', rating_community_overall: 'number', rating_ease_of_use: 'number',
  rating_print_quality: 'number', rating_reliability: 'number', rating_value_for_money: 'number',
  review_count_aggregated: 'number', community_popularity_score: 'number',
  
  // Dates
  release_date: 'date', discontinued_date: 'date', last_verified_utc: 'date',
  
  // URLs
  official_product_url: 'url', official_store_url: 'url', amazon_url_us: 'url',
  amazon_url_ca: 'url', amazon_url_uk: 'url',
};

interface PrinterDataComparisonPanelProps {
  className?: string;
}

export default function PrinterDataComparisonPanel({ className }: PrinterDataComparisonPanelProps) {
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch all printers
  const { data: printers, isLoading: printersLoading } = useQuery({
    queryKey: ['admin-printers-comparison'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printers')
        .select('*, printer_brands(brand)')
        .order('model_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch brands for dropdown
  const { data: brands } = useQuery({
    queryKey: ['printer-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printer_brands')
        .select('*')
        .order('brand');
      if (error) throw error;
      return data;
    },
  });

  // Get selected printer data
  const selectedPrinterData = useMemo(() => {
    if (!selectedPrinter || !printers) return null;
    return printers.find(p => p.id === selectedPrinter);
  }, [selectedPrinter, printers]);

  // Calculate field statistics
  const fieldStats = useMemo(() => {
    if (!printers || printers.length === 0) return null;

    const stats: Record<string, { 
      populated: number; 
      total: number; 
      normalized: number;
      displayedInUI: boolean;
      category: string;
    }> = {};

    CSV_FIELDS.forEach(field => {
      const category = Object.entries(FIELD_CATEGORIES).find(([_, fields]) => 
        fields.includes(field)
      )?.[0] || 'Other';

      stats[field] = {
        populated: 0,
        total: printers.length,
        normalized: 0,
        displayedInUI: UI_DISPLAYED_FIELDS.includes(field),
        category,
      };
    });

    printers.forEach(printer => {
      CSV_FIELDS.forEach(field => {
        // Skip brand as it's in a joined table
        if (field === 'brand') {
          const brandValue = (printer as any).printer_brands?.brand;
          if (brandValue) {
            stats[field].populated++;
            stats[field].normalized++;
          }
          return;
        }

        const value = (printer as any)[field];
        const expectedType = FIELD_TYPES[field];
        
        if (value !== null && value !== undefined && value !== '') {
          stats[field].populated++;
          
          // Check if properly normalized
          let isNormalized = true;
          if (expectedType === 'boolean') {
            isNormalized = typeof value === 'boolean';
          } else if (expectedType === 'number') {
            isNormalized = typeof value === 'number' && !isNaN(value);
          } else if (expectedType === 'date') {
            isNormalized = !isNaN(new Date(value).getTime());
          } else if (expectedType === 'url') {
            isNormalized = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
          }
          
          if (isNormalized) {
            stats[field].normalized++;
          }
        }
      });
    });

    return stats;
  }, [printers]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!fieldStats) return null;

    const totalFields = CSV_FIELDS.length;
    const fieldsWithData = Object.values(fieldStats).filter(s => s.populated > 0).length;
    const fieldsFullyPopulated = Object.values(fieldStats).filter(s => s.populated === s.total).length;
    const uiFields = Object.values(fieldStats).filter(s => s.displayedInUI).length;
    const uiFieldsWithData = Object.values(fieldStats).filter(s => s.displayedInUI && s.populated > 0).length;
    
    const totalDataPoints = Object.values(fieldStats).reduce((sum, s) => sum + s.total, 0);
    const populatedDataPoints = Object.values(fieldStats).reduce((sum, s) => sum + s.populated, 0);
    const normalizedDataPoints = Object.values(fieldStats).reduce((sum, s) => sum + s.normalized, 0);

    return {
      totalFields,
      fieldsWithData,
      fieldsFullyPopulated,
      uiFields,
      uiFieldsWithData,
      totalDataPoints,
      populatedDataPoints,
      normalizedDataPoints,
      completionRate: (populatedDataPoints / totalDataPoints) * 100,
      normalizationRate: populatedDataPoints > 0 ? (normalizedDataPoints / populatedDataPoints) * 100 : 0,
      uiCoverage: (uiFieldsWithData / uiFields) * 100,
    };
  }, [fieldStats]);

  // Filter fields for display
  const filteredFields = useMemo(() => {
    if (!fieldStats) return [];

    return CSV_FIELDS.filter(field => {
      const stats = fieldStats[field];
      
      // Search filter
      if (searchQuery && !field.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (categoryFilter !== 'all' && stats.category !== categoryFilter) {
        return false;
      }
      
      // Status filter
      if (statusFilter === 'populated' && stats.populated === 0) return false;
      if (statusFilter === 'empty' && stats.populated > 0) return false;
      if (statusFilter === 'partial' && (stats.populated === 0 || stats.populated === stats.total)) return false;
      if (statusFilter === 'ui-only' && !stats.displayedInUI) return false;
      if (statusFilter === 'not-in-ui' && stats.displayedInUI) return false;
      
      return true;
    });
  }, [fieldStats, searchQuery, categoryFilter, statusFilter]);

  // Export comparison data as CSV
  const handleExportCSV = () => {
    if (!fieldStats || !printers) return;

    const headers = ['Field', 'Category', 'Displayed in UI', 'Populated Count', 'Total Printers', 'Population %', 'Normalized %', 'Expected Type'];
    const rows = CSV_FIELDS.map(field => {
      const stats = fieldStats[field];
      return [
        field,
        stats.category,
        stats.displayedInUI ? 'Yes' : 'No',
        stats.populated,
        stats.total,
        ((stats.populated / stats.total) * 100).toFixed(1) + '%',
        stats.populated > 0 ? ((stats.normalized / stats.populated) * 100).toFixed(1) + '%' : 'N/A',
        FIELD_TYPES[field] || 'text',
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `printer-data-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (printersLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Printer Data Comparison
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        {summaryStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg space-y-1">
              <div className="text-2xl font-bold">{printers?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Printers</div>
            </div>
            <div className="p-4 bg-muted rounded-lg space-y-1">
              <div className="text-2xl font-bold">{summaryStats.totalFields}</div>
              <div className="text-sm text-muted-foreground">CSV Fields</div>
            </div>
            <div className="p-4 bg-muted rounded-lg space-y-1">
              <div className="text-2xl font-bold text-green-600">{summaryStats.uiFields}</div>
              <div className="text-sm text-muted-foreground">Displayed in UI</div>
            </div>
            <div className="p-4 bg-muted rounded-lg space-y-1">
              <div className="text-2xl font-bold text-orange-600">
                {summaryStats.totalFields - summaryStats.uiFields}
              </div>
              <div className="text-sm text-muted-foreground">Not in UI</div>
            </div>
          </div>
        )}

        {/* Progress Bars */}
        {summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Data Completion</span>
                <span className="font-medium">{summaryStats.completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={summaryStats.completionRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Normalization Rate</span>
                <span className="font-medium">{summaryStats.normalizationRate.toFixed(1)}%</span>
              </div>
              <Progress value={summaryStats.normalizationRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>UI Field Coverage</span>
                <span className="font-medium">{summaryStats.uiCoverage.toFixed(1)}%</span>
              </div>
              <Progress value={summaryStats.uiCoverage} className="h-2" />
            </div>
          </div>
        )}

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Field Overview</TabsTrigger>
            <TabsTrigger value="printer">Single Printer</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search fields..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.keys(FIELD_CATEGORIES).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="populated">Has Data</SelectItem>
                  <SelectItem value="empty">Empty</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="ui-only">In UI</SelectItem>
                  <SelectItem value="not-in-ui">Not in UI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fields Table */}
            <ScrollArea className="h-[500px] border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">In UI</TableHead>
                    <TableHead className="text-center">Population</TableHead>
                    <TableHead className="text-center">Normalized</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFields.map(field => {
                    const stats = fieldStats?.[field];
                    if (!stats) return null;
                    
                    const populationPct = (stats.populated / stats.total) * 100;
                    const normPct = stats.populated > 0 ? (stats.normalized / stats.populated) * 100 : 0;
                    
                    return (
                      <TableRow key={field}>
                        <TableCell className="font-mono text-sm">{field}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {stats.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {stats.displayedInUI ? (
                            <Eye className="h-4 w-4 text-green-600 inline" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full",
                                  populationPct === 100 ? "bg-green-500" :
                                  populationPct >= 50 ? "bg-yellow-500" :
                                  populationPct > 0 ? "bg-orange-500" : "bg-red-500"
                                )}
                                style={{ width: `${populationPct}%` }}
                              />
                            </div>
                            <span className="text-xs w-16 text-right">
                              {stats.populated}/{stats.total}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {stats.populated > 0 ? (
                            normPct === 100 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 inline" />
                            ) : (
                              <span className="text-xs text-orange-600">{normPct.toFixed(0)}%</span>
                            )
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {FIELD_TYPES[field] || 'text'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="printer" className="space-y-4">
            {/* Printer selector */}
            <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
              <SelectTrigger>
                <SelectValue placeholder="Select a printer to inspect..." />
              </SelectTrigger>
              <SelectContent>
                {printers?.map(printer => (
                  <SelectItem key={printer.id} value={printer.id}>
                    {(printer as any).printer_brands?.brand} - {printer.model_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPrinterData && (
              <ScrollArea className="h-[500px] border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="text-center">In UI</TableHead>
                      <TableHead className="text-center">Valid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {CSV_FIELDS.map(field => {
                      const value = field === 'brand' 
                        ? (selectedPrinterData as any).printer_brands?.brand
                        : (selectedPrinterData as any)[field];
                      const isInUI = UI_DISPLAYED_FIELDS.includes(field);
                      const expectedType = FIELD_TYPES[field];
                      
                      let isValid = true;
                      if (value !== null && value !== undefined && value !== '') {
                        if (expectedType === 'boolean') {
                          isValid = typeof value === 'boolean';
                        } else if (expectedType === 'number') {
                          isValid = typeof value === 'number' && !isNaN(value);
                        } else if (expectedType === 'date') {
                          isValid = !isNaN(new Date(value).getTime());
                        } else if (expectedType === 'url') {
                          isValid = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
                        }
                      }
                      
                      return (
                        <TableRow key={field} className={!value ? 'opacity-50' : ''}>
                          <TableCell className="font-mono text-sm">{field}</TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {value === null || value === undefined ? (
                              <span className="text-muted-foreground italic">null</span>
                            ) : value === '' ? (
                              <span className="text-muted-foreground italic">empty</span>
                            ) : typeof value === 'boolean' ? (
                              value ? <Badge variant="default">true</Badge> : <Badge variant="secondary">false</Badge>
                            ) : typeof value === 'string' && value.startsWith('http') ? (
                              <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                {value.substring(0, 50)}...
                              </a>
                            ) : (
                              String(value)
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isInUI ? (
                              <Eye className="h-4 w-4 text-green-600 inline" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {value !== null && value !== undefined && value !== '' ? (
                              isValid ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 inline" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-orange-500 inline" />
                              )
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            {fieldStats && (
              <div className="space-y-6">
                {/* Fields displayed in UI but empty */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    UI Fields with No Data
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {CSV_FIELDS.filter(f => 
                      fieldStats[f].displayedInUI && fieldStats[f].populated === 0
                    ).map(field => (
                      <Badge key={field} variant="destructive" className="font-mono text-xs">
                        {field}
                      </Badge>
                    ))}
                    {CSV_FIELDS.filter(f => 
                      fieldStats[f].displayedInUI && fieldStats[f].populated === 0
                    ).length === 0 && (
                      <span className="text-sm text-muted-foreground">No issues found</span>
                    )}
                  </div>
                </div>

                {/* Fields with partial data that are in UI */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    UI Fields with Partial Data (&lt;50%)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {CSV_FIELDS.filter(f => {
                      const stats = fieldStats[f];
                      const pct = (stats.populated / stats.total) * 100;
                      return stats.displayedInUI && pct > 0 && pct < 50;
                    }).map(field => (
                      <Badge key={field} variant="secondary" className="font-mono text-xs">
                        {field} ({((fieldStats[field].populated / fieldStats[field].total) * 100).toFixed(0)}%)
                      </Badge>
                    ))}
                    {CSV_FIELDS.filter(f => {
                      const stats = fieldStats[f];
                      const pct = (stats.populated / stats.total) * 100;
                      return stats.displayedInUI && pct > 0 && pct < 50;
                    }).length === 0 && (
                      <span className="text-sm text-muted-foreground">No issues found</span>
                    )}
                  </div>
                </div>

                {/* Fields with normalization issues */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Fields with Normalization Issues
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {CSV_FIELDS.filter(f => {
                      const stats = fieldStats[f];
                      return stats.populated > 0 && stats.normalized < stats.populated;
                    }).map(field => {
                      const stats = fieldStats[field];
                      const normPct = (stats.normalized / stats.populated) * 100;
                      return (
                        <Badge key={field} variant="outline" className="font-mono text-xs border-yellow-500">
                          {field} ({normPct.toFixed(0)}% valid)
                        </Badge>
                      );
                    })}
                    {CSV_FIELDS.filter(f => {
                      const stats = fieldStats[f];
                      return stats.populated > 0 && stats.normalized < stats.populated;
                    }).length === 0 && (
                      <span className="text-sm text-green-600">All populated data is properly normalized!</span>
                    )}
                  </div>
                </div>

                {/* CSV fields not displayed in UI */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    CSV Fields Not Displayed in UI (with data)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {CSV_FIELDS.filter(f => 
                      !fieldStats[f].displayedInUI && fieldStats[f].populated > 0
                    ).map(field => (
                      <Badge key={field} variant="outline" className="font-mono text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
