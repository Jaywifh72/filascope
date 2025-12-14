export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accessory_price_history: {
        Row: {
          accessory_id: string | null
          currency: string
          id: string
          price: number
          recorded_at: string | null
          source: string | null
        }
        Insert: {
          accessory_id?: string | null
          currency?: string
          id?: string
          price: number
          recorded_at?: string | null
          source?: string | null
        }
        Update: {
          accessory_id?: string | null
          currency?: string
          id?: string
          price?: number
          recorded_at?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accessory_price_history_accessory_id_fkey"
            columns: ["accessory_id"]
            isOneToOne: false
            referencedRelation: "printer_accessories"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activity_log: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_configs: {
        Row: {
          affiliate_url_pattern: string | null
          amazon_de_tag: string | null
          amazon_uk_tag: string | null
          amazon_us_tag: string | null
          created_at: string | null
          id: string
          notes: string | null
          updated_at: string | null
          vendor_name: string
        }
        Insert: {
          affiliate_url_pattern?: string | null
          amazon_de_tag?: string | null
          amazon_uk_tag?: string | null
          amazon_us_tag?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          vendor_name: string
        }
        Update: {
          affiliate_url_pattern?: string | null
          amazon_de_tag?: string | null
          amazon_uk_tag?: string | null
          amazon_us_tag?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          vendor_name?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          affiliate_link: string | null
          created_at: string | null
          deal_price: number
          end_date: string | null
          filament_id: string | null
          id: string
          original_price: number | null
          region: string
          start_date: string | null
        }
        Insert: {
          affiliate_link?: string | null
          created_at?: string | null
          deal_price: number
          end_date?: string | null
          filament_id?: string | null
          id?: string
          original_price?: number | null
          region: string
          start_date?: string | null
        }
        Update: {
          affiliate_link?: string | null
          created_at?: string | null
          deal_price?: number
          end_date?: string | null
          filament_id?: string | null
          id?: string
          original_price?: number | null
          region?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_models: {
        Row: {
          created_at: string | null
          discovered_at: string
          discovery_run_id: string
          id: string
          model_name: string
          printer_id: string | null
          was_new: boolean | null
        }
        Insert: {
          created_at?: string | null
          discovered_at?: string
          discovery_run_id: string
          id?: string
          model_name: string
          printer_id?: string | null
          was_new?: boolean | null
        }
        Update: {
          created_at?: string | null
          discovered_at?: string
          discovery_run_id?: string
          id?: string
          model_name?: string
          printer_id?: string | null
          was_new?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_models_discovery_run_id_fkey"
            columns: ["discovery_run_id"]
            isOneToOne: false
            referencedRelation: "discovery_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_models_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_runs: {
        Row: {
          brand_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          models_added: number | null
          models_found: number | null
          started_at: string
          status: string
        }
        Insert: {
          brand_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          models_added?: number | null
          models_found?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          brand_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          models_added?: number | null
          models_found?: number | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_runs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "printer_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_candidates: {
        Row: {
          confidence: string
          created_at: string | null
          entity_id_a: string
          entity_id_b: string
          entity_type: string
          id: string
          match_reason: string | null
          resolution: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          confidence: string
          created_at?: string | null
          entity_id_a: string
          entity_id_b: string
          entity_type: string
          id?: string
          match_reason?: string | null
          resolution?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          confidence?: string
          created_at?: string | null
          entity_id_a?: string
          entity_id_b?: string
          entity_type?: string
          id?: string
          match_reason?: string | null
          resolution?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: []
      }
      filament_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          filament_id: string
          id: string
          is_private: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          filament_id: string
          id?: string
          is_private?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          filament_id?: string
          id?: string
          is_private?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filament_comments_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filament_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      filaments: {
        Row: {
          amazon_link_de: string | null
          amazon_link_uk: string | null
          amazon_link_us: string | null
          bed_temp_max_c: number | null
          bed_temp_min_c: number | null
          carbon_fiber_percentage: number | null
          color_family: string | null
          color_hex: string | null
          created_at: string | null
          density_g_cm3: number | null
          diameter_nominal_mm: number | null
          dimensional_accuracy_score: number | null
          drying_temp_c: number | null
          drying_time_hours: number | null
          ean: string | null
          ease_of_printing_score: number | null
          elongation_break_xy_percent: number | null
          fan_max_percent: number | null
          fan_min_percent: number | null
          featured_image: string | null
          finish_type: string | null
          flexural_strength_mpa: number | null
          food_contact_rating: string | null
          glass_fiber_percentage: number | null
          gtin: string | null
          high_speed_capable: boolean | null
          id: string
          industry_tags: string[] | null
          is_nozzle_abrasive: boolean | null
          material: string | null
          melt_temp_c: number | null
          moisture_care: string | null
          moisture_sensitivity_level: string | null
          mpn: string | null
          net_weight_g: number | null
          nozzle_care: string | null
          nozzle_temp_max_c: number | null
          nozzle_temp_min_c: number | null
          nozzle_temp_sweetspot_c: number | null
          pack_quantity: number | null
          print_speed_max_mms: number | null
          printability_index: number | null
          product_handle: string | null
          product_id: string | null
          product_title: string
          product_url: string | null
          published_at: string | null
          recommended_nozzle_type: string | null
          shore_hardness_d: number | null
          spool_ams_fit: boolean | null
          spool_material: string | null
          spool_outer_d_mm: number | null
          spool_width_mm: number | null
          strength_index: number | null
          tds_url: string | null
          tensile_modulus_xy_mpa: number | null
          tensile_strength_xy_mpa: number | null
          tg_c: number | null
          transmission_distance: number | null
          upc: string | null
          updated_at: string | null
          use_case_tags: string[] | null
          value_score: number | null
          variant_available: boolean | null
          variant_price: number | null
          variant_sku: string | null
          vendor: string | null
          wood_fiber_length_mm: number | null
          wood_particle_size_microns: number | null
          wood_powder_percentage: number | null
          wood_scent_level: string | null
          wood_type: string | null
        }
        Insert: {
          amazon_link_de?: string | null
          amazon_link_uk?: string | null
          amazon_link_us?: string | null
          bed_temp_max_c?: number | null
          bed_temp_min_c?: number | null
          carbon_fiber_percentage?: number | null
          color_family?: string | null
          color_hex?: string | null
          created_at?: string | null
          density_g_cm3?: number | null
          diameter_nominal_mm?: number | null
          dimensional_accuracy_score?: number | null
          drying_temp_c?: number | null
          drying_time_hours?: number | null
          ean?: string | null
          ease_of_printing_score?: number | null
          elongation_break_xy_percent?: number | null
          fan_max_percent?: number | null
          fan_min_percent?: number | null
          featured_image?: string | null
          finish_type?: string | null
          flexural_strength_mpa?: number | null
          food_contact_rating?: string | null
          glass_fiber_percentage?: number | null
          gtin?: string | null
          high_speed_capable?: boolean | null
          id?: string
          industry_tags?: string[] | null
          is_nozzle_abrasive?: boolean | null
          material?: string | null
          melt_temp_c?: number | null
          moisture_care?: string | null
          moisture_sensitivity_level?: string | null
          mpn?: string | null
          net_weight_g?: number | null
          nozzle_care?: string | null
          nozzle_temp_max_c?: number | null
          nozzle_temp_min_c?: number | null
          nozzle_temp_sweetspot_c?: number | null
          pack_quantity?: number | null
          print_speed_max_mms?: number | null
          printability_index?: number | null
          product_handle?: string | null
          product_id?: string | null
          product_title: string
          product_url?: string | null
          published_at?: string | null
          recommended_nozzle_type?: string | null
          shore_hardness_d?: number | null
          spool_ams_fit?: boolean | null
          spool_material?: string | null
          spool_outer_d_mm?: number | null
          spool_width_mm?: number | null
          strength_index?: number | null
          tds_url?: string | null
          tensile_modulus_xy_mpa?: number | null
          tensile_strength_xy_mpa?: number | null
          tg_c?: number | null
          transmission_distance?: number | null
          upc?: string | null
          updated_at?: string | null
          use_case_tags?: string[] | null
          value_score?: number | null
          variant_available?: boolean | null
          variant_price?: number | null
          variant_sku?: string | null
          vendor?: string | null
          wood_fiber_length_mm?: number | null
          wood_particle_size_microns?: number | null
          wood_powder_percentage?: number | null
          wood_scent_level?: string | null
          wood_type?: string | null
        }
        Update: {
          amazon_link_de?: string | null
          amazon_link_uk?: string | null
          amazon_link_us?: string | null
          bed_temp_max_c?: number | null
          bed_temp_min_c?: number | null
          carbon_fiber_percentage?: number | null
          color_family?: string | null
          color_hex?: string | null
          created_at?: string | null
          density_g_cm3?: number | null
          diameter_nominal_mm?: number | null
          dimensional_accuracy_score?: number | null
          drying_temp_c?: number | null
          drying_time_hours?: number | null
          ean?: string | null
          ease_of_printing_score?: number | null
          elongation_break_xy_percent?: number | null
          fan_max_percent?: number | null
          fan_min_percent?: number | null
          featured_image?: string | null
          finish_type?: string | null
          flexural_strength_mpa?: number | null
          food_contact_rating?: string | null
          glass_fiber_percentage?: number | null
          gtin?: string | null
          high_speed_capable?: boolean | null
          id?: string
          industry_tags?: string[] | null
          is_nozzle_abrasive?: boolean | null
          material?: string | null
          melt_temp_c?: number | null
          moisture_care?: string | null
          moisture_sensitivity_level?: string | null
          mpn?: string | null
          net_weight_g?: number | null
          nozzle_care?: string | null
          nozzle_temp_max_c?: number | null
          nozzle_temp_min_c?: number | null
          nozzle_temp_sweetspot_c?: number | null
          pack_quantity?: number | null
          print_speed_max_mms?: number | null
          printability_index?: number | null
          product_handle?: string | null
          product_id?: string | null
          product_title?: string
          product_url?: string | null
          published_at?: string | null
          recommended_nozzle_type?: string | null
          shore_hardness_d?: number | null
          spool_ams_fit?: boolean | null
          spool_material?: string | null
          spool_outer_d_mm?: number | null
          spool_width_mm?: number | null
          strength_index?: number | null
          tds_url?: string | null
          tensile_modulus_xy_mpa?: number | null
          tensile_strength_xy_mpa?: number | null
          tg_c?: number | null
          transmission_distance?: number | null
          upc?: string | null
          updated_at?: string | null
          use_case_tags?: string[] | null
          value_score?: number | null
          variant_available?: boolean | null
          variant_price?: number | null
          variant_sku?: string | null
          vendor?: string | null
          wood_fiber_length_mm?: number | null
          wood_particle_size_microns?: number | null
          wood_powder_percentage?: number | null
          wood_scent_level?: string | null
          wood_type?: string | null
        }
        Relationships: []
      }
      price_history: {
        Row: {
          filament_id: string | null
          id: string
          price: number
          recorded_at: string | null
          region: string
        }
        Insert: {
          filament_id?: string | null
          id?: string
          price: number
          recorded_at?: string | null
          region: string
        }
        Update: {
          filament_id?: string | null
          id?: string
          price?: number
          recorded_at?: string | null
          region?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_accessories: {
        Row: {
          accessory_type: string
          brand: string | null
          compatible_hotend_types: string[] | null
          compatible_printer_brands: string[] | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          last_price_check: string | null
          model: string | null
          name: string
          price: number | null
          price_change_percent: number | null
          printer_id: string | null
          product_url: string | null
          specs: Json | null
          tds_url: string | null
          updated_at: string | null
        }
        Insert: {
          accessory_type: string
          brand?: string | null
          compatible_hotend_types?: string[] | null
          compatible_printer_brands?: string[] | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_price_check?: string | null
          model?: string | null
          name: string
          price?: number | null
          price_change_percent?: number | null
          printer_id?: string | null
          product_url?: string | null
          specs?: Json | null
          tds_url?: string | null
          updated_at?: string | null
        }
        Update: {
          accessory_type?: string
          brand?: string | null
          compatible_hotend_types?: string[] | null
          compatible_printer_brands?: string[] | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_price_check?: string | null
          model?: string | null
          name?: string
          price?: number | null
          price_change_percent?: number | null
          printer_id?: string | null
          product_url?: string | null
          specs?: Json | null
          tds_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printer_accessories_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_brands: {
        Row: {
          brand: string
          created_at: string | null
          id: string
          last_discovery_run_at: string | null
          new_models_found_count: number | null
          scrape_config: Json | null
          updated_at: string | null
        }
        Insert: {
          brand: string
          created_at?: string | null
          id?: string
          last_discovery_run_at?: string | null
          new_models_found_count?: number | null
          scrape_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          brand?: string
          created_at?: string | null
          id?: string
          last_discovery_run_at?: string | null
          new_models_found_count?: number | null
          scrape_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      printer_compatibility: {
        Row: {
          ams_fit: boolean | null
          brass_safe: boolean | null
          created_at: string | null
          filament_id: string | null
          id: string
          notes: string | null
          printer_id: string | null
        }
        Insert: {
          ams_fit?: boolean | null
          brass_safe?: boolean | null
          created_at?: string | null
          filament_id?: string | null
          id?: string
          notes?: string | null
          printer_id?: string | null
        }
        Update: {
          ams_fit?: boolean | null
          brass_safe?: boolean | null
          created_at?: string | null
          filament_id?: string | null
          id?: string
          notes?: string | null
          printer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printer_compatibility_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_firmware: {
        Row: {
          changelog: string | null
          created_at: string | null
          download_url: string | null
          file_size_mb: number | null
          id: string
          is_latest: boolean | null
          known_issues: string | null
          printer_id: string | null
          release_date: string | null
          release_notes: string | null
          source_url: string | null
          updated_at: string | null
          version: string
        }
        Insert: {
          changelog?: string | null
          created_at?: string | null
          download_url?: string | null
          file_size_mb?: number | null
          id?: string
          is_latest?: boolean | null
          known_issues?: string | null
          printer_id?: string | null
          release_date?: string | null
          release_notes?: string | null
          source_url?: string | null
          updated_at?: string | null
          version: string
        }
        Update: {
          changelog?: string | null
          created_at?: string | null
          download_url?: string | null
          file_size_mb?: number | null
          id?: string
          is_latest?: boolean | null
          known_issues?: string | null
          printer_id?: string | null
          release_date?: string | null
          release_notes?: string | null
          source_url?: string | null
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "printer_firmware_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_price_history: {
        Row: {
          currency: string
          id: string
          price: number
          price_type: string
          printer_id: string | null
          recorded_at: string | null
          source: string | null
        }
        Insert: {
          currency?: string
          id?: string
          price: number
          price_type?: string
          printer_id?: string | null
          recorded_at?: string | null
          source?: string | null
        }
        Update: {
          currency?: string
          id?: string
          price?: number
          price_type?: string
          printer_id?: string | null
          recorded_at?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printer_price_history_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_series: {
        Row: {
          brand_id: string | null
          created_at: string | null
          id: string
          series_name: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          series_name: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          series_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "printer_series_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "printer_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_software: {
        Row: {
          app_store_url: string | null
          changelog: string | null
          created_at: string | null
          download_url: string | null
          download_url_linux: string | null
          download_url_mac: string | null
          download_url_windows: string | null
          google_play_url: string | null
          id: string
          is_latest: boolean | null
          is_mobile_app: boolean | null
          printer_id: string | null
          release_date: string | null
          release_notes: string | null
          software_name: string
          software_type: string
          source_url: string | null
          supported_platforms: string[] | null
          updated_at: string | null
          version: string
        }
        Insert: {
          app_store_url?: string | null
          changelog?: string | null
          created_at?: string | null
          download_url?: string | null
          download_url_linux?: string | null
          download_url_mac?: string | null
          download_url_windows?: string | null
          google_play_url?: string | null
          id?: string
          is_latest?: boolean | null
          is_mobile_app?: boolean | null
          printer_id?: string | null
          release_date?: string | null
          release_notes?: string | null
          software_name: string
          software_type: string
          source_url?: string | null
          supported_platforms?: string[] | null
          updated_at?: string | null
          version: string
        }
        Update: {
          app_store_url?: string | null
          changelog?: string | null
          created_at?: string | null
          download_url?: string | null
          download_url_linux?: string | null
          download_url_mac?: string | null
          download_url_windows?: string | null
          google_play_url?: string | null
          id?: string
          is_latest?: boolean | null
          is_mobile_app?: boolean | null
          printer_id?: string | null
          release_date?: string | null
          release_notes?: string | null
          software_name?: string
          software_type?: string
          source_url?: string | null
          supported_platforms?: string[] | null
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "printer_software_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      printers: {
        Row: {
          abl_technique: string | null
          abrasive_filament_support: boolean | null
          abrasive_materials_supported: boolean | null
          ai_spaghetti_detection: boolean | null
          amazon_url_au: string | null
          amazon_url_ca: string | null
          amazon_url_de: string | null
          amazon_url_jp: string | null
          amazon_url_uk: string | null
          amazon_url_us: string | null
          area_leveling_supported: boolean | null
          assembly_required: boolean | null
          auto_bed_leveling: boolean | null
          auto_bed_leveling_method: string | null
          average_assembly_time_min: number | null
          bed_heated: boolean | null
          bed_heater_power_w: number | null
          bed_max_temp_c: number | null
          bed_size_x_mm: number | null
          bed_size_y_mm: number | null
          bed_type: string | null
          belt_tensioning_method: string | null
          brand_id: string | null
          build_volume_shape: string | null
          build_volume_x_mm: number | null
          build_volume_y_mm: number | null
          build_volume_z_mm: number | null
          cloud_platforms: string | null
          common_failure_points: string | null
          common_mods_tags: string | null
          community_popularity_score: number | null
          compatible_multi_material_systems: string | null
          compatible_plate_types: string | null
          control_knob: boolean | null
          created_at: string | null
          current_price_aud_amazon: number | null
          current_price_aud_store: number | null
          current_price_cad_amazon: number | null
          current_price_cad_store: number | null
          current_price_eur_amazon: number | null
          current_price_eur_store: number | null
          current_price_gbp_amazon: number | null
          current_price_gbp_store: number | null
          current_price_jpy_amazon: number | null
          current_price_jpy_store: number | null
          current_price_usd_amazon: number | null
          current_price_usd_store: number | null
          data_quality_notes: string | null
          data_source_priority: string | null
          data_source_urls: string | null
          default_plate_type: string | null
          discontinued: boolean | null
          discontinued_date: string | null
          door_sensor: boolean | null
          ean_upc: string | null
          enclosure_heated: boolean | null
          enclosure_max_temp_c: number | null
          enclosure_type: string | null
          extruder_count: number | null
          extruder_drive_type: string | null
          extruder_notes: string | null
          extruder_type: string | null
          filament_diameter_mm: number | null
          filament_entanglement_detection: boolean | null
          filament_runout_detection: boolean | null
          filter_type: string | null
          firmware_family: string | null
          firmware_open_source: boolean | null
          firmware_url: string | null
          first_layer_assist_features: string | null
          flow_calibration_supported: boolean | null
          frame_material: string | null
          has_bluetooth: boolean | null
          has_enclosure: boolean | null
          has_ethernet: boolean | null
          has_micro_sd_card: boolean | null
          has_sd_card: boolean | null
          has_usb_a_port: boolean | null
          has_usb_c_port: boolean | null
          has_wifi: boolean | null
          hotend_brand_model: string | null
          hotend_material_composition: string | null
          hotend_type: string | null
          id: string
          input_shaping_supported: boolean | null
          internal_lighting: boolean | null
          last_verified_utc: string | null
          linear_rails_on_axes: string | null
          machine_depth_mm: number | null
          machine_height_mm: number | null
          machine_style: string | null
          machine_weight_kg: number | null
          machine_width_mm: number | null
          maintenance_interval_hours: number | null
          marketing_tags: string | null
          materials_notes: string | null
          max_acceleration_xy_mmss: number | null
          max_acceleration_z_mmss: number | null
          max_build_height_with_ams_mm: number | null
          max_flow_rate_mm3s: number | null
          max_nozzle_temp_c: number | null
          max_print_speed_mms: number | null
          max_recommended_material_temp_c: number | null
          max_travel_speed_xy_mms: number | null
          model_name: string
          motion_system_notes: string | null
          msrp_cad: number | null
          msrp_eur: number | null
          msrp_usd: number | null
          multi_material_drying_capability: boolean | null
          multi_material_limitations_notes: string | null
          multi_material_max_spools: number | null
          multi_material_spool_chamber_max_temp_c: number | null
          multi_material_supported: boolean | null
          native_multi_material_system: boolean | null
          noise_level_idle_db: number | null
          noise_level_printing_db: number | null
          nozzle_change_ease: string | null
          nozzle_material: string | null
          object_skip_supported: boolean | null
          official_product_url: string | null
          official_store_url: string | null
          official_store_url_au: string | null
          official_store_url_ca: string | null
          official_store_url_eu: string | null
          official_store_url_jp: string | null
          official_store_url_uk: string | null
          official_supported_materials: string | null
          onboard_storage_gb: number | null
          other_retailer_urls: string | null
          package_depth_mm: number | null
          package_height_mm: number | null
          package_weight_kg: number | null
          package_width_mm: number | null
          power_input_voltage: string | null
          power_loss_recovery: boolean | null
          power_supply_type: string | null
          pressure_advance_supported: boolean | null
          price_tier: string | null
          prices_last_updated_at: string | null
          printer_id: string
          printer_profile_slug_in_slicers: string | null
          printer_technology: string | null
          quick_release_hotend: boolean | null
          rated_power_w: number | null
          rating_community_overall: number | null
          rating_ease_of_use: number | null
          rating_print_quality: number | null
          rating_reliability: number | null
          rating_value_for_money: number | null
          recommended_materials: string | null
          recommended_quality_speed_mms: number | null
          recommended_upgrades: string | null
          release_date: string | null
          remote_control_supported: boolean | null
          remote_monitoring_supported: boolean | null
          review_count_aggregated: number | null
          safety_certifications: string | null
          safety_notes: string | null
          scrape_completed_at: string | null
          scrape_error: string | null
          scrape_status: string | null
          scraped_data: Json | null
          screen_resolution: string | null
          screen_size_inch: number | null
          screen_type: string | null
          series_id: string | null
          sku: string | null
          smoke_sensor: boolean | null
          status: string | null
          stock_nozzle_diameter_mm: number | null
          stock_plate_types: string | null
          supported_nozzle_diameters_mm: string | null
          supported_plate_types: string | null
          sustained_nozzle_temp_c: number | null
          target_user_segment: string | null
          temperature_sensors: string | null
          thermal_runaway_protection: boolean | null
          typical_power_abs_w: number | null
          typical_power_pla_w: number | null
          ui_language_options: string | null
          updated_at: string | null
          variant_or_bundle_name: string | null
          z_offset_supported: boolean | null
        }
        Insert: {
          abl_technique?: string | null
          abrasive_filament_support?: boolean | null
          abrasive_materials_supported?: boolean | null
          ai_spaghetti_detection?: boolean | null
          amazon_url_au?: string | null
          amazon_url_ca?: string | null
          amazon_url_de?: string | null
          amazon_url_jp?: string | null
          amazon_url_uk?: string | null
          amazon_url_us?: string | null
          area_leveling_supported?: boolean | null
          assembly_required?: boolean | null
          auto_bed_leveling?: boolean | null
          auto_bed_leveling_method?: string | null
          average_assembly_time_min?: number | null
          bed_heated?: boolean | null
          bed_heater_power_w?: number | null
          bed_max_temp_c?: number | null
          bed_size_x_mm?: number | null
          bed_size_y_mm?: number | null
          bed_type?: string | null
          belt_tensioning_method?: string | null
          brand_id?: string | null
          build_volume_shape?: string | null
          build_volume_x_mm?: number | null
          build_volume_y_mm?: number | null
          build_volume_z_mm?: number | null
          cloud_platforms?: string | null
          common_failure_points?: string | null
          common_mods_tags?: string | null
          community_popularity_score?: number | null
          compatible_multi_material_systems?: string | null
          compatible_plate_types?: string | null
          control_knob?: boolean | null
          created_at?: string | null
          current_price_aud_amazon?: number | null
          current_price_aud_store?: number | null
          current_price_cad_amazon?: number | null
          current_price_cad_store?: number | null
          current_price_eur_amazon?: number | null
          current_price_eur_store?: number | null
          current_price_gbp_amazon?: number | null
          current_price_gbp_store?: number | null
          current_price_jpy_amazon?: number | null
          current_price_jpy_store?: number | null
          current_price_usd_amazon?: number | null
          current_price_usd_store?: number | null
          data_quality_notes?: string | null
          data_source_priority?: string | null
          data_source_urls?: string | null
          default_plate_type?: string | null
          discontinued?: boolean | null
          discontinued_date?: string | null
          door_sensor?: boolean | null
          ean_upc?: string | null
          enclosure_heated?: boolean | null
          enclosure_max_temp_c?: number | null
          enclosure_type?: string | null
          extruder_count?: number | null
          extruder_drive_type?: string | null
          extruder_notes?: string | null
          extruder_type?: string | null
          filament_diameter_mm?: number | null
          filament_entanglement_detection?: boolean | null
          filament_runout_detection?: boolean | null
          filter_type?: string | null
          firmware_family?: string | null
          firmware_open_source?: boolean | null
          firmware_url?: string | null
          first_layer_assist_features?: string | null
          flow_calibration_supported?: boolean | null
          frame_material?: string | null
          has_bluetooth?: boolean | null
          has_enclosure?: boolean | null
          has_ethernet?: boolean | null
          has_micro_sd_card?: boolean | null
          has_sd_card?: boolean | null
          has_usb_a_port?: boolean | null
          has_usb_c_port?: boolean | null
          has_wifi?: boolean | null
          hotend_brand_model?: string | null
          hotend_material_composition?: string | null
          hotend_type?: string | null
          id?: string
          input_shaping_supported?: boolean | null
          internal_lighting?: boolean | null
          last_verified_utc?: string | null
          linear_rails_on_axes?: string | null
          machine_depth_mm?: number | null
          machine_height_mm?: number | null
          machine_style?: string | null
          machine_weight_kg?: number | null
          machine_width_mm?: number | null
          maintenance_interval_hours?: number | null
          marketing_tags?: string | null
          materials_notes?: string | null
          max_acceleration_xy_mmss?: number | null
          max_acceleration_z_mmss?: number | null
          max_build_height_with_ams_mm?: number | null
          max_flow_rate_mm3s?: number | null
          max_nozzle_temp_c?: number | null
          max_print_speed_mms?: number | null
          max_recommended_material_temp_c?: number | null
          max_travel_speed_xy_mms?: number | null
          model_name: string
          motion_system_notes?: string | null
          msrp_cad?: number | null
          msrp_eur?: number | null
          msrp_usd?: number | null
          multi_material_drying_capability?: boolean | null
          multi_material_limitations_notes?: string | null
          multi_material_max_spools?: number | null
          multi_material_spool_chamber_max_temp_c?: number | null
          multi_material_supported?: boolean | null
          native_multi_material_system?: boolean | null
          noise_level_idle_db?: number | null
          noise_level_printing_db?: number | null
          nozzle_change_ease?: string | null
          nozzle_material?: string | null
          object_skip_supported?: boolean | null
          official_product_url?: string | null
          official_store_url?: string | null
          official_store_url_au?: string | null
          official_store_url_ca?: string | null
          official_store_url_eu?: string | null
          official_store_url_jp?: string | null
          official_store_url_uk?: string | null
          official_supported_materials?: string | null
          onboard_storage_gb?: number | null
          other_retailer_urls?: string | null
          package_depth_mm?: number | null
          package_height_mm?: number | null
          package_weight_kg?: number | null
          package_width_mm?: number | null
          power_input_voltage?: string | null
          power_loss_recovery?: boolean | null
          power_supply_type?: string | null
          pressure_advance_supported?: boolean | null
          price_tier?: string | null
          prices_last_updated_at?: string | null
          printer_id: string
          printer_profile_slug_in_slicers?: string | null
          printer_technology?: string | null
          quick_release_hotend?: boolean | null
          rated_power_w?: number | null
          rating_community_overall?: number | null
          rating_ease_of_use?: number | null
          rating_print_quality?: number | null
          rating_reliability?: number | null
          rating_value_for_money?: number | null
          recommended_materials?: string | null
          recommended_quality_speed_mms?: number | null
          recommended_upgrades?: string | null
          release_date?: string | null
          remote_control_supported?: boolean | null
          remote_monitoring_supported?: boolean | null
          review_count_aggregated?: number | null
          safety_certifications?: string | null
          safety_notes?: string | null
          scrape_completed_at?: string | null
          scrape_error?: string | null
          scrape_status?: string | null
          scraped_data?: Json | null
          screen_resolution?: string | null
          screen_size_inch?: number | null
          screen_type?: string | null
          series_id?: string | null
          sku?: string | null
          smoke_sensor?: boolean | null
          status?: string | null
          stock_nozzle_diameter_mm?: number | null
          stock_plate_types?: string | null
          supported_nozzle_diameters_mm?: string | null
          supported_plate_types?: string | null
          sustained_nozzle_temp_c?: number | null
          target_user_segment?: string | null
          temperature_sensors?: string | null
          thermal_runaway_protection?: boolean | null
          typical_power_abs_w?: number | null
          typical_power_pla_w?: number | null
          ui_language_options?: string | null
          updated_at?: string | null
          variant_or_bundle_name?: string | null
          z_offset_supported?: boolean | null
        }
        Update: {
          abl_technique?: string | null
          abrasive_filament_support?: boolean | null
          abrasive_materials_supported?: boolean | null
          ai_spaghetti_detection?: boolean | null
          amazon_url_au?: string | null
          amazon_url_ca?: string | null
          amazon_url_de?: string | null
          amazon_url_jp?: string | null
          amazon_url_uk?: string | null
          amazon_url_us?: string | null
          area_leveling_supported?: boolean | null
          assembly_required?: boolean | null
          auto_bed_leveling?: boolean | null
          auto_bed_leveling_method?: string | null
          average_assembly_time_min?: number | null
          bed_heated?: boolean | null
          bed_heater_power_w?: number | null
          bed_max_temp_c?: number | null
          bed_size_x_mm?: number | null
          bed_size_y_mm?: number | null
          bed_type?: string | null
          belt_tensioning_method?: string | null
          brand_id?: string | null
          build_volume_shape?: string | null
          build_volume_x_mm?: number | null
          build_volume_y_mm?: number | null
          build_volume_z_mm?: number | null
          cloud_platforms?: string | null
          common_failure_points?: string | null
          common_mods_tags?: string | null
          community_popularity_score?: number | null
          compatible_multi_material_systems?: string | null
          compatible_plate_types?: string | null
          control_knob?: boolean | null
          created_at?: string | null
          current_price_aud_amazon?: number | null
          current_price_aud_store?: number | null
          current_price_cad_amazon?: number | null
          current_price_cad_store?: number | null
          current_price_eur_amazon?: number | null
          current_price_eur_store?: number | null
          current_price_gbp_amazon?: number | null
          current_price_gbp_store?: number | null
          current_price_jpy_amazon?: number | null
          current_price_jpy_store?: number | null
          current_price_usd_amazon?: number | null
          current_price_usd_store?: number | null
          data_quality_notes?: string | null
          data_source_priority?: string | null
          data_source_urls?: string | null
          default_plate_type?: string | null
          discontinued?: boolean | null
          discontinued_date?: string | null
          door_sensor?: boolean | null
          ean_upc?: string | null
          enclosure_heated?: boolean | null
          enclosure_max_temp_c?: number | null
          enclosure_type?: string | null
          extruder_count?: number | null
          extruder_drive_type?: string | null
          extruder_notes?: string | null
          extruder_type?: string | null
          filament_diameter_mm?: number | null
          filament_entanglement_detection?: boolean | null
          filament_runout_detection?: boolean | null
          filter_type?: string | null
          firmware_family?: string | null
          firmware_open_source?: boolean | null
          firmware_url?: string | null
          first_layer_assist_features?: string | null
          flow_calibration_supported?: boolean | null
          frame_material?: string | null
          has_bluetooth?: boolean | null
          has_enclosure?: boolean | null
          has_ethernet?: boolean | null
          has_micro_sd_card?: boolean | null
          has_sd_card?: boolean | null
          has_usb_a_port?: boolean | null
          has_usb_c_port?: boolean | null
          has_wifi?: boolean | null
          hotend_brand_model?: string | null
          hotend_material_composition?: string | null
          hotend_type?: string | null
          id?: string
          input_shaping_supported?: boolean | null
          internal_lighting?: boolean | null
          last_verified_utc?: string | null
          linear_rails_on_axes?: string | null
          machine_depth_mm?: number | null
          machine_height_mm?: number | null
          machine_style?: string | null
          machine_weight_kg?: number | null
          machine_width_mm?: number | null
          maintenance_interval_hours?: number | null
          marketing_tags?: string | null
          materials_notes?: string | null
          max_acceleration_xy_mmss?: number | null
          max_acceleration_z_mmss?: number | null
          max_build_height_with_ams_mm?: number | null
          max_flow_rate_mm3s?: number | null
          max_nozzle_temp_c?: number | null
          max_print_speed_mms?: number | null
          max_recommended_material_temp_c?: number | null
          max_travel_speed_xy_mms?: number | null
          model_name?: string
          motion_system_notes?: string | null
          msrp_cad?: number | null
          msrp_eur?: number | null
          msrp_usd?: number | null
          multi_material_drying_capability?: boolean | null
          multi_material_limitations_notes?: string | null
          multi_material_max_spools?: number | null
          multi_material_spool_chamber_max_temp_c?: number | null
          multi_material_supported?: boolean | null
          native_multi_material_system?: boolean | null
          noise_level_idle_db?: number | null
          noise_level_printing_db?: number | null
          nozzle_change_ease?: string | null
          nozzle_material?: string | null
          object_skip_supported?: boolean | null
          official_product_url?: string | null
          official_store_url?: string | null
          official_store_url_au?: string | null
          official_store_url_ca?: string | null
          official_store_url_eu?: string | null
          official_store_url_jp?: string | null
          official_store_url_uk?: string | null
          official_supported_materials?: string | null
          onboard_storage_gb?: number | null
          other_retailer_urls?: string | null
          package_depth_mm?: number | null
          package_height_mm?: number | null
          package_weight_kg?: number | null
          package_width_mm?: number | null
          power_input_voltage?: string | null
          power_loss_recovery?: boolean | null
          power_supply_type?: string | null
          pressure_advance_supported?: boolean | null
          price_tier?: string | null
          prices_last_updated_at?: string | null
          printer_id?: string
          printer_profile_slug_in_slicers?: string | null
          printer_technology?: string | null
          quick_release_hotend?: boolean | null
          rated_power_w?: number | null
          rating_community_overall?: number | null
          rating_ease_of_use?: number | null
          rating_print_quality?: number | null
          rating_reliability?: number | null
          rating_value_for_money?: number | null
          recommended_materials?: string | null
          recommended_quality_speed_mms?: number | null
          recommended_upgrades?: string | null
          release_date?: string | null
          remote_control_supported?: boolean | null
          remote_monitoring_supported?: boolean | null
          review_count_aggregated?: number | null
          safety_certifications?: string | null
          safety_notes?: string | null
          scrape_completed_at?: string | null
          scrape_error?: string | null
          scrape_status?: string | null
          scraped_data?: Json | null
          screen_resolution?: string | null
          screen_size_inch?: number | null
          screen_type?: string | null
          series_id?: string | null
          sku?: string | null
          smoke_sensor?: boolean | null
          status?: string | null
          stock_nozzle_diameter_mm?: number | null
          stock_plate_types?: string | null
          supported_nozzle_diameters_mm?: string | null
          supported_plate_types?: string | null
          sustained_nozzle_temp_c?: number | null
          target_user_segment?: string | null
          temperature_sensors?: string | null
          thermal_runaway_protection?: boolean | null
          typical_power_abs_w?: number | null
          typical_power_pla_w?: number | null
          ui_language_options?: string | null
          updated_at?: string | null
          variant_or_bundle_name?: string | null
          z_offset_supported?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "printers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "printer_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printers_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "printer_series"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          preferred_currency: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          preferred_currency?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          preferred_currency?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_filaments: {
        Row: {
          added_at: string | null
          filament_id: string
          id: string
          project_id: string
        }
        Insert: {
          added_at?: string | null
          filament_id: string
          id?: string
          project_id: string
        }
        Update: {
          added_at?: string | null
          filament_id?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_filaments_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_filaments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_tips: {
        Row: {
          article_url: string | null
          created_at: string | null
          detail_text: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          material_filter: string | null
          related_material: string | null
          tip_text: string
        }
        Insert: {
          article_url?: string | null
          created_at?: string | null
          detail_text?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          material_filter?: string | null
          related_material?: string | null
          tip_text: string
        }
        Update: {
          article_url?: string | null
          created_at?: string | null
          detail_text?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          material_filter?: string | null
          related_material?: string | null
          tip_text?: string
        }
        Relationships: []
      }
      safety_alerts: {
        Row: {
          affected_timeframe: string | null
          batch_info: string | null
          brand: string
          created_at: string | null
          details_url: string | null
          expires_at: string | null
          filament_id: string | null
          headline: string
          id: string
          is_active: boolean | null
          material: string
          priority: string | null
          reason: string
        }
        Insert: {
          affected_timeframe?: string | null
          batch_info?: string | null
          brand: string
          created_at?: string | null
          details_url?: string | null
          expires_at?: string | null
          filament_id?: string | null
          headline: string
          id?: string
          is_active?: boolean | null
          material: string
          priority?: string | null
          reason: string
        }
        Update: {
          affected_timeframe?: string | null
          batch_info?: string | null
          brand?: string
          created_at?: string | null
          details_url?: string | null
          expires_at?: string | null
          filament_id?: string | null
          headline?: string
          id?: string
          is_active?: boolean | null
          material?: string
          priority?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_alerts_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_task_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_log: string | null
          id: string
          items_failed: number | null
          items_processed: number | null
          started_at: string
          status: string
          task_name: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: string | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          started_at?: string
          status?: string
          task_name: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: string | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          started_at?: string
          status?: string
          task_name?: string
        }
        Relationships: []
      }
      trend_upvotes: {
        Row: {
          anonymous_id: string | null
          created_at: string | null
          id: string
          trend_id: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string | null
          id?: string
          trend_id?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string | null
          id?: string
          trend_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trend_upvotes_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "trending_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_materials: {
        Row: {
          article_url: string | null
          context: string | null
          created_at: string | null
          description: string | null
          extended_context: string | null
          id: string
          is_active: boolean | null
          is_prediction: boolean | null
          material_filter: string | null
          position: number | null
          prediction_reason: string | null
          related_content_count: number | null
          related_content_url: string | null
          search_increase_percent: number | null
          sparkline_data: Json | null
          title: string
          trend_velocity: string | null
          updated_at: string | null
          upvote_count: number | null
          week_of: string | null
          why_now: string | null
        }
        Insert: {
          article_url?: string | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          extended_context?: string | null
          id?: string
          is_active?: boolean | null
          is_prediction?: boolean | null
          material_filter?: string | null
          position?: number | null
          prediction_reason?: string | null
          related_content_count?: number | null
          related_content_url?: string | null
          search_increase_percent?: number | null
          sparkline_data?: Json | null
          title: string
          trend_velocity?: string | null
          updated_at?: string | null
          upvote_count?: number | null
          week_of?: string | null
          why_now?: string | null
        }
        Update: {
          article_url?: string | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          extended_context?: string | null
          id?: string
          is_active?: boolean | null
          is_prediction?: boolean | null
          material_filter?: string | null
          position?: number | null
          prediction_reason?: string | null
          related_content_count?: number | null
          related_content_url?: string | null
          search_increase_percent?: number | null
          sparkline_data?: Json | null
          title?: string
          trend_velocity?: string | null
          updated_at?: string | null
          upvote_count?: number | null
          week_of?: string | null
          why_now?: string | null
        }
        Relationships: []
      }
      url_validation_results: {
        Row: {
          checked_at: string | null
          entity_id: string
          entity_type: string
          id: string
          manually_verified: boolean | null
          redirect_url: string | null
          status: string
          status_code: number | null
          url: string
          url_field: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          checked_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          manually_verified?: boolean | null
          redirect_url?: string | null
          status: string
          status_code?: number | null
          url: string
          url_field: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          checked_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          manually_verified?: boolean | null
          redirect_url?: string | null
          status?: string
          status_code?: number | null
          url?: string
          url_field?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          filament_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filament_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filament_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_purchases: {
        Row: {
          created_at: string | null
          filament_id: string
          id: string
          notes: string | null
          purchase_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filament_id: string
          id?: string
          notes?: string | null
          purchase_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filament_id?: string
          id?: string
          notes?: string | null
          purchase_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin"],
    },
  },
} as const
