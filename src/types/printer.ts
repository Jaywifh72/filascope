export interface Printer {
  id: string;
  printer_id: string;
  model_name: string;
  brand: string;
  brand_id?: string;
  image_url?: string;
  status?: string;
  display_name?: string;
  slug?: string;
  compatible_count?: number;
  max_nozzle_temp_c?: number | null;
  bed_max_temp_c?: number | null;
  stock_nozzle_diameter_mm?: number | null;
  has_enclosure?: boolean | null;
  multi_material_supported?: boolean | null;
  multi_material_max_spools?: number | null;
}

export interface PrinterOption {
  printer_id: string;
  model_name: string;
  brand: string;
  brand_id: string;
  image_url?: string | null;
  compatible_count?: number;
}

export interface PrinterGroup {
  brand: string;
  printers: PrinterOption[];
}
