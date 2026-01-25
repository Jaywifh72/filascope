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
      ab_test_assignments: {
        Row: {
          assigned_at: string | null
          id: string
          session_id: string | null
          test_name: string
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          session_id?: string | null
          test_name: string
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          id?: string
          session_id?: string | null
          test_name?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_assignments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "ab_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_test_conversions: {
        Row: {
          conversion_type: string
          conversion_value: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          session_id: string | null
          test_name: string
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          conversion_type: string
          conversion_value?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string | null
          test_name: string
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          conversion_type?: string
          conversion_value?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string | null
          test_name?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_conversions_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "ab_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_test_variants: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_control: boolean | null
          test_name: string
          updated_at: string | null
          variant_name: string
          weight: number | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_control?: boolean | null
          test_name: string
          updated_at?: string | null
          variant_name: string
          weight?: number | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_control?: boolean | null
          test_name?: string
          updated_at?: string | null
          variant_name?: string
          weight?: number | null
        }
        Relationships: []
      }
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
          affiliate_id: string | null
          affiliate_network: string | null
          affiliate_url_pattern: string | null
          amazon_au_tag: string | null
          amazon_ca_tag: string | null
          amazon_de_tag: string | null
          amazon_jp_tag: string | null
          amazon_uk_tag: string | null
          amazon_us_tag: string | null
          awin_advertiser_id: string | null
          awin_affiliate_id: string | null
          brand_id: string | null
          commission_rate: number | null
          cookie_duration_days: number | null
          created_at: string | null
          id: string
          impact_media_partner_id: string | null
          impact_program_id: string | null
          is_active: boolean | null
          notes: string | null
          signup_url: string | null
          tracking_url_template: string | null
          updated_at: string | null
          vendor_name: string
        }
        Insert: {
          affiliate_id?: string | null
          affiliate_network?: string | null
          affiliate_url_pattern?: string | null
          amazon_au_tag?: string | null
          amazon_ca_tag?: string | null
          amazon_de_tag?: string | null
          amazon_jp_tag?: string | null
          amazon_uk_tag?: string | null
          amazon_us_tag?: string | null
          awin_advertiser_id?: string | null
          awin_affiliate_id?: string | null
          brand_id?: string | null
          commission_rate?: number | null
          cookie_duration_days?: number | null
          created_at?: string | null
          id?: string
          impact_media_partner_id?: string | null
          impact_program_id?: string | null
          is_active?: boolean | null
          notes?: string | null
          signup_url?: string | null
          tracking_url_template?: string | null
          updated_at?: string | null
          vendor_name: string
        }
        Update: {
          affiliate_id?: string | null
          affiliate_network?: string | null
          affiliate_url_pattern?: string | null
          amazon_au_tag?: string | null
          amazon_ca_tag?: string | null
          amazon_de_tag?: string | null
          amazon_jp_tag?: string | null
          amazon_uk_tag?: string | null
          amazon_us_tag?: string | null
          awin_advertiser_id?: string | null
          awin_affiliate_id?: string | null
          brand_id?: string | null
          commission_rate?: number | null
          cookie_duration_days?: number | null
          created_at?: string | null
          id?: string
          impact_media_partner_id?: string | null
          impact_program_id?: string | null
          is_active?: boolean | null
          notes?: string | null
          signup_url?: string | null
          tracking_url_template?: string | null
          updated_at?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_configs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "automated_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_configs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_active_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_configs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brands_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_configs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_public_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      answer_helpful_votes: {
        Row: {
          answer_id: string
          created_at: string | null
          id: string
          is_helpful: boolean
          user_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string | null
          id?: string
          is_helpful: boolean
          user_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_helpful_votes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "product_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      automated_brands: {
        Row: {
          active_product_count: number | null
          amazon_last_scrape_at: string | null
          amazon_store_url: string | null
          api_endpoint: string | null
          auth_type: string | null
          auto_create_products: boolean | null
          availability_selectors: Json | null
          avg_scrape_duration_seconds: number | null
          base_url: string
          batch_size: number | null
          brand_name: string
          brand_slug: string
          color_primary: string | null
          color_secondary: string | null
          color_selectors: Json | null
          created_at: string
          created_by: string | null
          default_currency: string | null
          description: string | null
          diameter_selectors: Json | null
          display_name: string
          display_order: number | null
          extraction_method: string | null
          extraction_success_rate: number | null
          extraction_working: boolean | null
          failed_scrapes: number | null
          featured: boolean | null
          has_amazon_store: boolean | null
          has_api: boolean | null
          id: string
          image_selectors: Json | null
          is_visible: boolean | null
          last_error: string | null
          last_error_at: string | null
          last_extraction_test_at: string | null
          last_scrape_at: string | null
          logo_url: string | null
          material_selectors: Json | null
          max_pages: number | null
          max_retries: number | null
          next_scrape_at: string | null
          notes: string | null
          pagination_enabled: boolean | null
          platform_type: string
          price_extraction_config: Json | null
          price_selectors: Json | null
          product_count: number | null
          product_list_selector: string | null
          product_url_pattern: string | null
          products_created: number | null
          products_updated: number | null
          products_url: string | null
          products_with_amazon_links: number | null
          products_with_amazon_prices: number | null
          products_with_codes: number | null
          products_with_color_hex: number | null
          products_with_images: number | null
          products_with_mpn: number | null
          products_with_prices: number | null
          products_with_tds: number | null
          products_with_urls: number | null
          rate_limit_ms: number | null
          requires_auth: boolean | null
          requires_currency_conversion: boolean | null
          scrape_frequency_hours: number | null
          scrape_schedule: string | null
          scrape_timeout_at: string | null
          scraping_active: boolean | null
          scraping_enabled: boolean | null
          successful_scrapes: number | null
          supported_regions: string[] | null
          test_product_url: string | null
          timeout_ms: number | null
          title_selectors: Json | null
          total_scrapes: number | null
          updated_at: string
          website_url: string | null
          weight_selectors: Json | null
        }
        Insert: {
          active_product_count?: number | null
          amazon_last_scrape_at?: string | null
          amazon_store_url?: string | null
          api_endpoint?: string | null
          auth_type?: string | null
          auto_create_products?: boolean | null
          availability_selectors?: Json | null
          avg_scrape_duration_seconds?: number | null
          base_url: string
          batch_size?: number | null
          brand_name: string
          brand_slug: string
          color_primary?: string | null
          color_secondary?: string | null
          color_selectors?: Json | null
          created_at?: string
          created_by?: string | null
          default_currency?: string | null
          description?: string | null
          diameter_selectors?: Json | null
          display_name: string
          display_order?: number | null
          extraction_method?: string | null
          extraction_success_rate?: number | null
          extraction_working?: boolean | null
          failed_scrapes?: number | null
          featured?: boolean | null
          has_amazon_store?: boolean | null
          has_api?: boolean | null
          id?: string
          image_selectors?: Json | null
          is_visible?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_extraction_test_at?: string | null
          last_scrape_at?: string | null
          logo_url?: string | null
          material_selectors?: Json | null
          max_pages?: number | null
          max_retries?: number | null
          next_scrape_at?: string | null
          notes?: string | null
          pagination_enabled?: boolean | null
          platform_type: string
          price_extraction_config?: Json | null
          price_selectors?: Json | null
          product_count?: number | null
          product_list_selector?: string | null
          product_url_pattern?: string | null
          products_created?: number | null
          products_updated?: number | null
          products_url?: string | null
          products_with_amazon_links?: number | null
          products_with_amazon_prices?: number | null
          products_with_codes?: number | null
          products_with_color_hex?: number | null
          products_with_images?: number | null
          products_with_mpn?: number | null
          products_with_prices?: number | null
          products_with_tds?: number | null
          products_with_urls?: number | null
          rate_limit_ms?: number | null
          requires_auth?: boolean | null
          requires_currency_conversion?: boolean | null
          scrape_frequency_hours?: number | null
          scrape_schedule?: string | null
          scrape_timeout_at?: string | null
          scraping_active?: boolean | null
          scraping_enabled?: boolean | null
          successful_scrapes?: number | null
          supported_regions?: string[] | null
          test_product_url?: string | null
          timeout_ms?: number | null
          title_selectors?: Json | null
          total_scrapes?: number | null
          updated_at?: string
          website_url?: string | null
          weight_selectors?: Json | null
        }
        Update: {
          active_product_count?: number | null
          amazon_last_scrape_at?: string | null
          amazon_store_url?: string | null
          api_endpoint?: string | null
          auth_type?: string | null
          auto_create_products?: boolean | null
          availability_selectors?: Json | null
          avg_scrape_duration_seconds?: number | null
          base_url?: string
          batch_size?: number | null
          brand_name?: string
          brand_slug?: string
          color_primary?: string | null
          color_secondary?: string | null
          color_selectors?: Json | null
          created_at?: string
          created_by?: string | null
          default_currency?: string | null
          description?: string | null
          diameter_selectors?: Json | null
          display_name?: string
          display_order?: number | null
          extraction_method?: string | null
          extraction_success_rate?: number | null
          extraction_working?: boolean | null
          failed_scrapes?: number | null
          featured?: boolean | null
          has_amazon_store?: boolean | null
          has_api?: boolean | null
          id?: string
          image_selectors?: Json | null
          is_visible?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          last_extraction_test_at?: string | null
          last_scrape_at?: string | null
          logo_url?: string | null
          material_selectors?: Json | null
          max_pages?: number | null
          max_retries?: number | null
          next_scrape_at?: string | null
          notes?: string | null
          pagination_enabled?: boolean | null
          platform_type?: string
          price_extraction_config?: Json | null
          price_selectors?: Json | null
          product_count?: number | null
          product_list_selector?: string | null
          product_url_pattern?: string | null
          products_created?: number | null
          products_updated?: number | null
          products_url?: string | null
          products_with_amazon_links?: number | null
          products_with_amazon_prices?: number | null
          products_with_codes?: number | null
          products_with_color_hex?: number | null
          products_with_images?: number | null
          products_with_mpn?: number | null
          products_with_prices?: number | null
          products_with_tds?: number | null
          products_with_urls?: number | null
          rate_limit_ms?: number | null
          requires_auth?: boolean | null
          requires_currency_conversion?: boolean | null
          scrape_frequency_hours?: number | null
          scrape_schedule?: string | null
          scrape_timeout_at?: string | null
          scraping_active?: boolean | null
          scraping_enabled?: boolean | null
          successful_scrapes?: number | null
          supported_regions?: string[] | null
          test_product_url?: string | null
          timeout_ms?: number | null
          title_selectors?: Json | null
          total_scrapes?: number | null
          updated_at?: string
          website_url?: string | null
          weight_selectors?: Json | null
        }
        Relationships: []
      }
      brand_regional_stores: {
        Row: {
          base_url: string
          brand_id: string
          created_at: string
          currency_code: string
          estimated_shipping_days: number | null
          free_shipping_threshold: number | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          notes: string | null
          product_url_pattern: string | null
          region_code: string
          ships_from_country: string | null
          store_name: string
          updated_at: string
        }
        Insert: {
          base_url: string
          brand_id: string
          created_at?: string
          currency_code: string
          estimated_shipping_days?: number | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          notes?: string | null
          product_url_pattern?: string | null
          region_code: string
          ships_from_country?: string | null
          store_name: string
          updated_at?: string
        }
        Update: {
          base_url?: string
          brand_id?: string
          created_at?: string
          currency_code?: string
          estimated_shipping_days?: number | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          notes?: string | null
          product_url_pattern?: string | null
          region_code?: string
          ships_from_country?: string | null
          store_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_regional_stores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "automated_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_regional_stores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_active_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_regional_stores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brands_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_regional_stores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_public_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_representatives: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          role: string | null
          status: string | null
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          id?: string
          role?: string | null
          status?: string | null
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          role?: string | null
          status?: string | null
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_representatives_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "automated_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_representatives_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_active_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_representatives_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brands_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_representatives_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_public_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_scraper_profiles: {
        Row: {
          analysis_confidence: number | null
          analysis_notes: string | null
          brand_id: string | null
          brand_slug: string
          color_extraction_rules: Json | null
          color_hex_mappings: Json | null
          created_at: string | null
          created_by: string | null
          discovered_colors: Json | null
          discovered_product_lines: Json | null
          id: string
          last_analyzed_at: string | null
          last_updated_by: string | null
          material_patterns: Json | null
          price_interpretation: string | null
          product_line_extraction_rules: Json | null
          product_line_synonyms: Json | null
          product_structure: string | null
          sample_products: Json | null
          special_cases: Json | null
          swatch_type: string | null
          title_format_pattern: string | null
          updated_at: string | null
          variant_schema: Json | null
        }
        Insert: {
          analysis_confidence?: number | null
          analysis_notes?: string | null
          brand_id?: string | null
          brand_slug: string
          color_extraction_rules?: Json | null
          color_hex_mappings?: Json | null
          created_at?: string | null
          created_by?: string | null
          discovered_colors?: Json | null
          discovered_product_lines?: Json | null
          id?: string
          last_analyzed_at?: string | null
          last_updated_by?: string | null
          material_patterns?: Json | null
          price_interpretation?: string | null
          product_line_extraction_rules?: Json | null
          product_line_synonyms?: Json | null
          product_structure?: string | null
          sample_products?: Json | null
          special_cases?: Json | null
          swatch_type?: string | null
          title_format_pattern?: string | null
          updated_at?: string | null
          variant_schema?: Json | null
        }
        Update: {
          analysis_confidence?: number | null
          analysis_notes?: string | null
          brand_id?: string | null
          brand_slug?: string
          color_extraction_rules?: Json | null
          color_hex_mappings?: Json | null
          created_at?: string | null
          created_by?: string | null
          discovered_colors?: Json | null
          discovered_product_lines?: Json | null
          id?: string
          last_analyzed_at?: string | null
          last_updated_by?: string | null
          material_patterns?: Json | null
          price_interpretation?: string | null
          product_line_extraction_rules?: Json | null
          product_line_synonyms?: Json | null
          product_structure?: string | null
          sample_products?: Json | null
          special_cases?: Json | null
          swatch_type?: string | null
          title_format_pattern?: string | null
          updated_at?: string | null
          variant_schema?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_scraper_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "automated_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_scraper_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_active_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_scraper_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brands_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_scraper_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_public_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_sync_logs: {
        Row: {
          brand_id: string | null
          brand_slug: string
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_details: Json | null
          id: string
          notes: string | null
          price_changes: number | null
          products_created: number | null
          products_discovered: number | null
          products_failed: number | null
          products_processed: Json | null
          products_updated: number | null
          started_at: string
          status: string
          success_details: Json | null
          sync_type: string
          triggered_by: string | null
          triggered_by_user: string | null
        }
        Insert: {
          brand_id?: string | null
          brand_slug: string
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          id?: string
          notes?: string | null
          price_changes?: number | null
          products_created?: number | null
          products_discovered?: number | null
          products_failed?: number | null
          products_processed?: Json | null
          products_updated?: number | null
          started_at?: string
          status: string
          success_details?: Json | null
          sync_type: string
          triggered_by?: string | null
          triggered_by_user?: string | null
        }
        Update: {
          brand_id?: string | null
          brand_slug?: string
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          id?: string
          notes?: string | null
          price_changes?: number | null
          products_created?: number | null
          products_discovered?: number | null
          products_failed?: number | null
          products_processed?: Json | null
          products_updated?: number | null
          started_at?: string
          status?: string
          success_details?: Json | null
          sync_type?: string
          triggered_by?: string | null
          triggered_by_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_sync_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "automated_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_sync_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_active_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_sync_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brands_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_sync_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_public_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      broken_product_urls: {
        Row: {
          created_at: string | null
          detected_at: string | null
          detection_count: number | null
          error_type: string
          id: string
          last_detected_at: string | null
          new_url: string | null
          notes: string | null
          product_url: string
          resolved_at: string | null
          store_domain: string
        }
        Insert: {
          created_at?: string | null
          detected_at?: string | null
          detection_count?: number | null
          error_type: string
          id?: string
          last_detected_at?: string | null
          new_url?: string | null
          notes?: string | null
          product_url: string
          resolved_at?: string | null
          store_domain: string
        }
        Update: {
          created_at?: string | null
          detected_at?: string | null
          detection_count?: number | null
          error_type?: string
          id?: string
          last_detected_at?: string | null
          new_url?: string | null
          notes?: string | null
          product_url?: string
          resolved_at?: string | null
          store_domain?: string
        }
        Relationships: []
      }
      color_audit_logs: {
        Row: {
          audit_run_id: string | null
          created_at: string | null
          database_count: number
          discrepancy: number | null
          error_message: string | null
          id: string
          notes: string | null
          product_line_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          sample_product_title: string | null
          sample_product_url: string | null
          scraped_at: string | null
          status: string
          vendor: string
          website_count: number | null
        }
        Insert: {
          audit_run_id?: string | null
          created_at?: string | null
          database_count: number
          discrepancy?: number | null
          error_message?: string | null
          id?: string
          notes?: string | null
          product_line_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_product_title?: string | null
          sample_product_url?: string | null
          scraped_at?: string | null
          status: string
          vendor: string
          website_count?: number | null
        }
        Update: {
          audit_run_id?: string | null
          created_at?: string | null
          database_count?: number
          discrepancy?: number | null
          error_message?: string | null
          id?: string
          notes?: string | null
          product_line_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_product_title?: string | null
          sample_product_url?: string | null
          scraped_at?: string | null
          status?: string
          vendor?: string
          website_count?: number | null
        }
        Relationships: []
      }
      color_families: {
        Row: {
          aliases: string[] | null
          created_at: string | null
          display_order: number | null
          hex_default: string | null
          id: string
          name: string
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string | null
          display_order?: number | null
          hex_default?: string | null
          id?: string
          name: string
        }
        Update: {
          aliases?: string[] | null
          created_at?: string | null
          display_order?: number | null
          hex_default?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      community_report_upvotes: {
        Row: {
          created_at: string | null
          id: string
          report_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          report_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_report_upvotes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "community_safety_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      community_safety_reports: {
        Row: {
          admin_notes: string | null
          batch_number: string | null
          brand: string
          created_at: string | null
          description: string
          filament_id: string | null
          id: string
          issue_type: string
          material: string
          severity: string | null
          status: string | null
          upvote_count: number | null
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          batch_number?: string | null
          brand: string
          created_at?: string | null
          description: string
          filament_id?: string | null
          id?: string
          issue_type: string
          material: string
          severity?: string | null
          status?: string | null
          upvote_count?: number | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          batch_number?: string | null
          brand?: string
          created_at?: string | null
          description?: string
          filament_id?: string | null
          id?: string
          issue_type?: string
          material?: string
          severity?: string | null
          status?: string | null
          upvote_count?: number | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_safety_reports_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "community_safety_reports_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_safety_reports_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "community_safety_reports_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "community_safety_reports_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_exchange_rates: {
        Row: {
          base_currency: string
          created_at: string
          fetched_at: string
          id: string
          inverse_rate: number
          rate: number
          source: string | null
          target_currency: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          fetched_at?: string
          id?: string
          inverse_rate: number
          rate: number
          source?: string | null
          target_currency: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          fetched_at?: string
          id?: string
          inverse_rate?: number
          rate?: number
          source?: string | null
          target_currency?: string
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
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "deals_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "deals_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "deals_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
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
      error_logs: {
        Row: {
          component_stack: string | null
          created_at: string
          device_type: string | null
          error_id: string
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          metadata: Json | null
          page_url: string | null
          route: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string
          device_type?: string | null
          error_id: string
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          route?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string
          device_type?: string | null
          error_id?: string
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          route?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      featured_content: {
        Row: {
          content_type: string
          created_at: string | null
          created_by: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          end_at: string | null
          entity_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          module_name: string
          priority: number | null
          start_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          end_at?: string | null
          entity_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          module_name: string
          priority?: number | null
          start_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          end_at?: string | null
          entity_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          module_name?: string
          priority?: number | null
          start_at?: string | null
          title?: string
          updated_at?: string | null
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
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_comments_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filament_comments_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_comments_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_comments_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
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
      filament_inventory: {
        Row: {
          currency: string | null
          estimated_ship_days: number | null
          filament_id: string
          id: string
          last_checked: string | null
          price: number | null
          product_url: string | null
          retailer_id: string
          stock_quantity: number | null
          stock_status: string
        }
        Insert: {
          currency?: string | null
          estimated_ship_days?: number | null
          filament_id: string
          id?: string
          last_checked?: string | null
          price?: number | null
          product_url?: string | null
          retailer_id: string
          stock_quantity?: number | null
          stock_status?: string
        }
        Update: {
          currency?: string | null
          estimated_ship_days?: number | null
          filament_id?: string
          id?: string
          last_checked?: string | null
          price?: number | null
          product_url?: string | null
          retailer_id?: string
          stock_quantity?: number | null
          stock_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "filament_inventory_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_inventory_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filament_inventory_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_inventory_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_inventory_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filament_inventory_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      filament_listings: {
        Row: {
          affiliate_url: string | null
          available: boolean | null
          compare_at_price: number | null
          created_at: string | null
          currency: string
          current_price: number | null
          display_order: number | null
          filament_id: string
          id: string
          is_primary: boolean | null
          last_scraped_at: string | null
          price_confidence: string | null
          price_source: string | null
          product_url: string
          region: string
          retailer_id: string
          scrape_source: string | null
          scrape_status: string | null
          ships_from: string | null
          sku: string | null
          stock_level: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_url?: string | null
          available?: boolean | null
          compare_at_price?: number | null
          created_at?: string | null
          currency?: string
          current_price?: number | null
          display_order?: number | null
          filament_id: string
          id?: string
          is_primary?: boolean | null
          last_scraped_at?: string | null
          price_confidence?: string | null
          price_source?: string | null
          product_url: string
          region?: string
          retailer_id: string
          scrape_source?: string | null
          scrape_status?: string | null
          ships_from?: string | null
          sku?: string | null
          stock_level?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_url?: string | null
          available?: boolean | null
          compare_at_price?: number | null
          created_at?: string | null
          currency?: string
          current_price?: number | null
          display_order?: number | null
          filament_id?: string
          id?: string
          is_primary?: boolean | null
          last_scraped_at?: string | null
          price_confidence?: string | null
          price_source?: string | null
          product_url?: string
          region?: string
          retailer_id?: string
          scrape_source?: string | null
          scrape_status?: string | null
          ships_from?: string | null
          sku?: string | null
          stock_level?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "filament_listings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_listings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filament_listings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_listings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_listings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filament_listings_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      filament_reviews: {
        Row: {
          created_at: string | null
          filament_id: string
          helpful_count: number | null
          id: string
          printer_id: string | null
          rating: number
          review_text: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          verified_purchase: boolean | null
          would_recommend: boolean | null
        }
        Insert: {
          created_at?: string | null
          filament_id: string
          helpful_count?: number | null
          id?: string
          printer_id?: string | null
          rating: number
          review_text?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          verified_purchase?: boolean | null
          would_recommend?: boolean | null
        }
        Update: {
          created_at?: string | null
          filament_id?: string
          helpful_count?: number | null
          id?: string
          printer_id?: string | null
          rating?: number
          review_text?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verified_purchase?: boolean | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "filament_reviews_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_reviews_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filament_reviews_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_reviews_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_reviews_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filament_reviews_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      filament_score_history: {
        Row: {
          change_reason: string | null
          created_at: string | null
          filament_id: string
          id: string
          recorded_at: string
          score: number
          score_type: string
        }
        Insert: {
          change_reason?: string | null
          created_at?: string | null
          filament_id: string
          id?: string
          recorded_at?: string
          score: number
          score_type: string
        }
        Update: {
          change_reason?: string | null
          created_at?: string | null
          filament_id?: string
          id?: string
          recorded_at?: string
          score?: number
          score_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "filament_score_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_score_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filament_score_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_score_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_score_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      filament_user_ratings: {
        Row: {
          created_at: string | null
          filament_id: string
          id: string
          issues: string[] | null
          printer_id: string | null
          rating: number
          review_text: string | null
          score_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filament_id: string
          id?: string
          issues?: string[] | null
          printer_id?: string | null
          rating: number
          review_text?: string | null
          score_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filament_id?: string
          id?: string
          issues?: string[] | null
          printer_id?: string | null
          rating?: number
          review_text?: string | null
          score_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filament_user_ratings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_user_ratings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filament_user_ratings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_user_ratings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_user_ratings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filament_user_ratings_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      filaments: {
        Row: {
          amazon_link_de: string | null
          amazon_link_uk: string | null
          amazon_link_us: string | null
          amazon_match_confidence: number | null
          amazon_price_usd: number | null
          amazon_prices_last_updated_at: string | null
          annealing_temp_c: number | null
          annealing_time_hours: number | null
          auto_created: boolean | null
          auto_updated: boolean | null
          available_regions: string[] | null
          bed_temp_max_c: number | null
          bed_temp_min_c: number | null
          bending_modulus_mpa: number | null
          bending_strength_mpa: number | null
          brand_id: string | null
          carbon_fiber_percentage: number | null
          chemical_resistance: Json | null
          color_family: string | null
          color_family_id: string | null
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
          elongation_break_z_percent: number | null
          external_data_hash: string | null
          fan_max_percent: number | null
          fan_min_percent: number | null
          featured_image: string | null
          finish_type: string | null
          finish_type_id: string | null
          flexural_strength_mpa: number | null
          food_contact_rating: string | null
          glass_fiber_percentage: number | null
          gtin: string | null
          hardness_shore_a: number | null
          haze_percent: number | null
          hdt_045_mpa_c: number | null
          hdt_18_mpa_c: number | null
          high_speed_capable: boolean | null
          id: string
          impact_strength_kj_m2: number | null
          industry_tags: string[] | null
          is_nozzle_abrasive: boolean | null
          last_external_sync_at: string | null
          last_scraped_at: string | null
          light_transmission_percent: number | null
          material: string | null
          material_id: string | null
          max_bridging_length_mm: number | null
          max_overhang_angle_deg: number | null
          melt_index_g_10min: number | null
          melt_temp_c: number | null
          moisture_care: string | null
          moisture_level_id: string | null
          moisture_sensitivity_level: string | null
          mpn: string | null
          net_weight_g: number | null
          next_scrape_at: string | null
          notched_izod_j_m: number | null
          nozzle_care: string | null
          nozzle_temp_max_c: number | null
          nozzle_temp_min_c: number | null
          nozzle_temp_sweetspot_c: number | null
          pack_quantity: number | null
          poissons_ratio: number | null
          price_aud: number | null
          price_cad: number | null
          price_confidence: string | null
          price_eur: number | null
          price_gbp: number | null
          price_jpy: number | null
          price_source: string | null
          print_speed_max_mms: number | null
          printability_index: number | null
          product_handle: string | null
          product_id: string | null
          product_line_id: string | null
          product_title: string
          product_url: string | null
          product_url_au: string | null
          product_url_ca: string | null
          product_url_eu: string | null
          product_url_jp: string | null
          product_url_uk: string | null
          published_at: string | null
          recommended_nozzle_type: string | null
          regional_prices_updated_at: string | null
          retraction_length_mm: number | null
          retraction_speed_mms: number | null
          scrape_frequency_hours: number | null
          shore_hardness_d: number | null
          shrinkage_annealed_percent: number | null
          spool_ams_fit: boolean | null
          spool_material: string | null
          spool_outer_d_mm: number | null
          spool_width_mm: number | null
          strength_index: number | null
          surface_resistivity_ohm: number | null
          sync_status: string | null
          tds_url: string | null
          tensile_modulus_xy_mpa: number | null
          tensile_modulus_z_mpa: number | null
          tensile_strength_xy_mpa: number | null
          tensile_strength_z_mpa: number | null
          tg_c: number | null
          transmission_distance: number | null
          upc: string | null
          updated_at: string | null
          url_validated_at: string | null
          url_validation_status: string | null
          use_case_tags: string[] | null
          user_override_fields: string[] | null
          value_score: number | null
          variant_available: boolean | null
          variant_compare_at_price: number | null
          variant_price: number | null
          variant_sku: string | null
          vendor: string | null
          vicat_softening_temp_c: number | null
          volume_resistivity_ohm_cm: number | null
          water_absorption_percent: number | null
          wood_fiber_length_mm: number | null
          wood_particle_size_microns: number | null
          wood_powder_percentage: number | null
          wood_scent_level: string | null
          wood_type: string | null
          youngs_modulus_mpa: number | null
        }
        Insert: {
          amazon_link_de?: string | null
          amazon_link_uk?: string | null
          amazon_link_us?: string | null
          amazon_match_confidence?: number | null
          amazon_price_usd?: number | null
          amazon_prices_last_updated_at?: string | null
          annealing_temp_c?: number | null
          annealing_time_hours?: number | null
          auto_created?: boolean | null
          auto_updated?: boolean | null
          available_regions?: string[] | null
          bed_temp_max_c?: number | null
          bed_temp_min_c?: number | null
          bending_modulus_mpa?: number | null
          bending_strength_mpa?: number | null
          brand_id?: string | null
          carbon_fiber_percentage?: number | null
          chemical_resistance?: Json | null
          color_family?: string | null
          color_family_id?: string | null
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
          elongation_break_z_percent?: number | null
          external_data_hash?: string | null
          fan_max_percent?: number | null
          fan_min_percent?: number | null
          featured_image?: string | null
          finish_type?: string | null
          finish_type_id?: string | null
          flexural_strength_mpa?: number | null
          food_contact_rating?: string | null
          glass_fiber_percentage?: number | null
          gtin?: string | null
          hardness_shore_a?: number | null
          haze_percent?: number | null
          hdt_045_mpa_c?: number | null
          hdt_18_mpa_c?: number | null
          high_speed_capable?: boolean | null
          id?: string
          impact_strength_kj_m2?: number | null
          industry_tags?: string[] | null
          is_nozzle_abrasive?: boolean | null
          last_external_sync_at?: string | null
          last_scraped_at?: string | null
          light_transmission_percent?: number | null
          material?: string | null
          material_id?: string | null
          max_bridging_length_mm?: number | null
          max_overhang_angle_deg?: number | null
          melt_index_g_10min?: number | null
          melt_temp_c?: number | null
          moisture_care?: string | null
          moisture_level_id?: string | null
          moisture_sensitivity_level?: string | null
          mpn?: string | null
          net_weight_g?: number | null
          next_scrape_at?: string | null
          notched_izod_j_m?: number | null
          nozzle_care?: string | null
          nozzle_temp_max_c?: number | null
          nozzle_temp_min_c?: number | null
          nozzle_temp_sweetspot_c?: number | null
          pack_quantity?: number | null
          poissons_ratio?: number | null
          price_aud?: number | null
          price_cad?: number | null
          price_confidence?: string | null
          price_eur?: number | null
          price_gbp?: number | null
          price_jpy?: number | null
          price_source?: string | null
          print_speed_max_mms?: number | null
          printability_index?: number | null
          product_handle?: string | null
          product_id?: string | null
          product_line_id?: string | null
          product_title: string
          product_url?: string | null
          product_url_au?: string | null
          product_url_ca?: string | null
          product_url_eu?: string | null
          product_url_jp?: string | null
          product_url_uk?: string | null
          published_at?: string | null
          recommended_nozzle_type?: string | null
          regional_prices_updated_at?: string | null
          retraction_length_mm?: number | null
          retraction_speed_mms?: number | null
          scrape_frequency_hours?: number | null
          shore_hardness_d?: number | null
          shrinkage_annealed_percent?: number | null
          spool_ams_fit?: boolean | null
          spool_material?: string | null
          spool_outer_d_mm?: number | null
          spool_width_mm?: number | null
          strength_index?: number | null
          surface_resistivity_ohm?: number | null
          sync_status?: string | null
          tds_url?: string | null
          tensile_modulus_xy_mpa?: number | null
          tensile_modulus_z_mpa?: number | null
          tensile_strength_xy_mpa?: number | null
          tensile_strength_z_mpa?: number | null
          tg_c?: number | null
          transmission_distance?: number | null
          upc?: string | null
          updated_at?: string | null
          url_validated_at?: string | null
          url_validation_status?: string | null
          use_case_tags?: string[] | null
          user_override_fields?: string[] | null
          value_score?: number | null
          variant_available?: boolean | null
          variant_compare_at_price?: number | null
          variant_price?: number | null
          variant_sku?: string | null
          vendor?: string | null
          vicat_softening_temp_c?: number | null
          volume_resistivity_ohm_cm?: number | null
          water_absorption_percent?: number | null
          wood_fiber_length_mm?: number | null
          wood_particle_size_microns?: number | null
          wood_powder_percentage?: number | null
          wood_scent_level?: string | null
          wood_type?: string | null
          youngs_modulus_mpa?: number | null
        }
        Update: {
          amazon_link_de?: string | null
          amazon_link_uk?: string | null
          amazon_link_us?: string | null
          amazon_match_confidence?: number | null
          amazon_price_usd?: number | null
          amazon_prices_last_updated_at?: string | null
          annealing_temp_c?: number | null
          annealing_time_hours?: number | null
          auto_created?: boolean | null
          auto_updated?: boolean | null
          available_regions?: string[] | null
          bed_temp_max_c?: number | null
          bed_temp_min_c?: number | null
          bending_modulus_mpa?: number | null
          bending_strength_mpa?: number | null
          brand_id?: string | null
          carbon_fiber_percentage?: number | null
          chemical_resistance?: Json | null
          color_family?: string | null
          color_family_id?: string | null
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
          elongation_break_z_percent?: number | null
          external_data_hash?: string | null
          fan_max_percent?: number | null
          fan_min_percent?: number | null
          featured_image?: string | null
          finish_type?: string | null
          finish_type_id?: string | null
          flexural_strength_mpa?: number | null
          food_contact_rating?: string | null
          glass_fiber_percentage?: number | null
          gtin?: string | null
          hardness_shore_a?: number | null
          haze_percent?: number | null
          hdt_045_mpa_c?: number | null
          hdt_18_mpa_c?: number | null
          high_speed_capable?: boolean | null
          id?: string
          impact_strength_kj_m2?: number | null
          industry_tags?: string[] | null
          is_nozzle_abrasive?: boolean | null
          last_external_sync_at?: string | null
          last_scraped_at?: string | null
          light_transmission_percent?: number | null
          material?: string | null
          material_id?: string | null
          max_bridging_length_mm?: number | null
          max_overhang_angle_deg?: number | null
          melt_index_g_10min?: number | null
          melt_temp_c?: number | null
          moisture_care?: string | null
          moisture_level_id?: string | null
          moisture_sensitivity_level?: string | null
          mpn?: string | null
          net_weight_g?: number | null
          next_scrape_at?: string | null
          notched_izod_j_m?: number | null
          nozzle_care?: string | null
          nozzle_temp_max_c?: number | null
          nozzle_temp_min_c?: number | null
          nozzle_temp_sweetspot_c?: number | null
          pack_quantity?: number | null
          poissons_ratio?: number | null
          price_aud?: number | null
          price_cad?: number | null
          price_confidence?: string | null
          price_eur?: number | null
          price_gbp?: number | null
          price_jpy?: number | null
          price_source?: string | null
          print_speed_max_mms?: number | null
          printability_index?: number | null
          product_handle?: string | null
          product_id?: string | null
          product_line_id?: string | null
          product_title?: string
          product_url?: string | null
          product_url_au?: string | null
          product_url_ca?: string | null
          product_url_eu?: string | null
          product_url_jp?: string | null
          product_url_uk?: string | null
          published_at?: string | null
          recommended_nozzle_type?: string | null
          regional_prices_updated_at?: string | null
          retraction_length_mm?: number | null
          retraction_speed_mms?: number | null
          scrape_frequency_hours?: number | null
          shore_hardness_d?: number | null
          shrinkage_annealed_percent?: number | null
          spool_ams_fit?: boolean | null
          spool_material?: string | null
          spool_outer_d_mm?: number | null
          spool_width_mm?: number | null
          strength_index?: number | null
          surface_resistivity_ohm?: number | null
          sync_status?: string | null
          tds_url?: string | null
          tensile_modulus_xy_mpa?: number | null
          tensile_modulus_z_mpa?: number | null
          tensile_strength_xy_mpa?: number | null
          tensile_strength_z_mpa?: number | null
          tg_c?: number | null
          transmission_distance?: number | null
          upc?: string | null
          updated_at?: string | null
          url_validated_at?: string | null
          url_validation_status?: string | null
          use_case_tags?: string[] | null
          user_override_fields?: string[] | null
          value_score?: number | null
          variant_available?: boolean | null
          variant_compare_at_price?: number | null
          variant_price?: number | null
          variant_sku?: string | null
          vendor?: string | null
          vicat_softening_temp_c?: number | null
          volume_resistivity_ohm_cm?: number | null
          water_absorption_percent?: number | null
          wood_fiber_length_mm?: number | null
          wood_particle_size_microns?: number | null
          wood_powder_percentage?: number | null
          wood_scent_level?: string | null
          wood_type?: string | null
          youngs_modulus_mpa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "filaments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "automated_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filaments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_active_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filaments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brands_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filaments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_public_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filaments_color_family_id_fkey"
            columns: ["color_family_id"]
            isOneToOne: false
            referencedRelation: "color_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filaments_finish_type_id_fkey"
            columns: ["finish_type_id"]
            isOneToOne: false
            referencedRelation: "finish_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filaments_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filaments_moisture_level_id_fkey"
            columns: ["moisture_level_id"]
            isOneToOne: false
            referencedRelation: "moisture_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_analytics: {
        Row: {
          action: string
          created_at: string
          filter_type: string
          filter_value: string
          id: string
          page: string
          result_count: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          filter_type: string
          filter_value: string
          id?: string
          page: string
          result_count?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          filter_type?: string
          filter_value?: string
          id?: string
          page?: string
          result_count?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      finish_types: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      funnel_events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          funnel_type: string
          id: string
          metadata: Json | null
          page_url: string | null
          previous_step: string | null
          referrer: string | null
          session_id: string
          step_name: string
          step_order: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          funnel_type: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          previous_step?: string | null
          referrer?: string | null
          session_id: string
          step_name: string
          step_order?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          funnel_type?: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          previous_step?: string | null
          referrer?: string | null
          session_id?: string
          step_name?: string
          step_order?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      listing_price_history: {
        Row: {
          available: boolean | null
          compare_at_price: number | null
          currency: string
          id: string
          listing_id: string
          price: number
          recorded_at: string | null
          source: string | null
        }
        Insert: {
          available?: boolean | null
          compare_at_price?: number | null
          currency?: string
          id?: string
          listing_id: string
          price: number
          recorded_at?: string | null
          source?: string | null
        }
        Update: {
          available?: boolean | null
          compare_at_price?: number | null
          currency?: string
          id?: string
          listing_id?: string
          price?: number
          recorded_at?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "filament_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_filament_listings"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      materials: {
        Row: {
          base_type: string
          composite_additive: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_composite: boolean | null
          name: string
          requires_enclosure: boolean | null
          requires_hardened_nozzle: boolean | null
          typical_bed_temp_max: number | null
          typical_bed_temp_min: number | null
          typical_nozzle_temp_max: number | null
          typical_nozzle_temp_min: number | null
        }
        Insert: {
          base_type: string
          composite_additive?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_composite?: boolean | null
          name: string
          requires_enclosure?: boolean | null
          requires_hardened_nozzle?: boolean | null
          typical_bed_temp_max?: number | null
          typical_bed_temp_min?: number | null
          typical_nozzle_temp_max?: number | null
          typical_nozzle_temp_min?: number | null
        }
        Update: {
          base_type?: string
          composite_additive?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_composite?: boolean | null
          name?: string
          requires_enclosure?: boolean | null
          requires_hardened_nozzle?: boolean | null
          typical_bed_temp_max?: number | null
          typical_bed_temp_min?: number | null
          typical_nozzle_temp_max?: number | null
          typical_nozzle_temp_min?: number | null
        }
        Relationships: []
      }
      module_engagement_metrics: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          module_name: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          module_name: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          module_name?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      module_performance_daily: {
        Row: {
          avg_time_spent_ms: number | null
          click_through_rate: number | null
          conversion_value: number | null
          conversions: number | null
          created_at: string | null
          cta_clicks: number | null
          date: string
          engagement_score: number | null
          id: string
          module_name: string
          scroll_past_count: number | null
          total_clicks: number | null
          total_views: number | null
          unique_users: number | null
        }
        Insert: {
          avg_time_spent_ms?: number | null
          click_through_rate?: number | null
          conversion_value?: number | null
          conversions?: number | null
          created_at?: string | null
          cta_clicks?: number | null
          date: string
          engagement_score?: number | null
          id?: string
          module_name: string
          scroll_past_count?: number | null
          total_clicks?: number | null
          total_views?: number | null
          unique_users?: number | null
        }
        Update: {
          avg_time_spent_ms?: number | null
          click_through_rate?: number | null
          conversion_value?: number | null
          conversions?: number | null
          created_at?: string | null
          cta_clicks?: number | null
          date?: string
          engagement_score?: number | null
          id?: string
          module_name?: string
          scroll_past_count?: number | null
          total_clicks?: number | null
          total_views?: number | null
          unique_users?: number | null
        }
        Relationships: []
      }
      moisture_levels: {
        Row: {
          created_at: string | null
          description: string | null
          drying_recommended: boolean | null
          id: string
          max_humidity_percent: number | null
          name: string
          severity_rank: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          drying_recommended?: boolean | null
          id?: string
          max_humidity_percent?: number | null
          name: string
          severity_rank: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          drying_recommended?: boolean | null
          id?: string
          max_humidity_percent?: number | null
          name?: string
          severity_rank?: number
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          connection_type: string | null
          created_at: string
          device_type: string
          id: string
          metric_name: string
          metric_value: number
          page_url: string
          rating: string
          recorded_at: string
          route: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          connection_type?: string | null
          created_at?: string
          device_type: string
          id?: string
          metric_name: string
          metric_value: number
          page_url: string
          rating: string
          recorded_at?: string
          route: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          connection_type?: string | null
          created_at?: string
          device_type?: string
          id?: string
          metric_name?: string
          metric_value?: number
          page_url?: string
          rating?: string
          recorded_at?: string
          route?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          created_at: string
          current_price_when_set: number | null
          email_notifications: boolean | null
          filament_id: string
          id: string
          is_active: boolean | null
          target_price: number
          triggered_at: string | null
          triggered_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_price_when_set?: number | null
          email_notifications?: boolean | null
          filament_id: string
          id?: string
          is_active?: boolean | null
          target_price: number
          triggered_at?: string | null
          triggered_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_price_when_set?: number | null
          email_notifications?: boolean | null
          filament_id?: string
          id?: string
          is_active?: boolean | null
          target_price?: number
          triggered_at?: string | null
          triggered_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "price_alerts_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_alerts_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "price_alerts_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "price_alerts_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      price_extraction_logs: {
        Row: {
          brand_id: string | null
          brand_slug: string | null
          created_at: string | null
          currency: string | null
          error_message: string | null
          extracted_price: number | null
          extraction_method: string
          id: string
          product_url: string
          raw_content_sample: string | null
          response_time_ms: number | null
          success: boolean
        }
        Insert: {
          brand_id?: string | null
          brand_slug?: string | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          extracted_price?: number | null
          extraction_method: string
          id?: string
          product_url: string
          raw_content_sample?: string | null
          response_time_ms?: number | null
          success: boolean
        }
        Update: {
          brand_id?: string | null
          brand_slug?: string | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          extracted_price?: number | null
          extraction_method?: string
          id?: string
          product_url?: string
          raw_content_sample?: string | null
          response_time_ms?: number | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "price_extraction_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "automated_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_extraction_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_active_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_extraction_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brands_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_extraction_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_public_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          available: boolean | null
          compare_at_price: number | null
          currency: string | null
          filament_id: string | null
          id: string
          notes: string | null
          price: number
          recorded_at: string | null
          region: string
          source: string | null
          variant_id: string | null
        }
        Insert: {
          available?: boolean | null
          compare_at_price?: number | null
          currency?: string | null
          filament_id?: string | null
          id?: string
          notes?: string | null
          price: number
          recorded_at?: string | null
          region: string
          source?: string | null
          variant_id?: string | null
        }
        Update: {
          available?: boolean | null
          compare_at_price?: number | null
          currency?: string | null
          filament_id?: string | null
          id?: string
          notes?: string | null
          price?: number
          recorded_at?: string | null
          region?: string
          source?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "price_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "price_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "price_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      print_result_likes: {
        Row: {
          created_at: string | null
          id: string
          print_result_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          print_result_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          print_result_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_result_likes_print_result_id_fkey"
            columns: ["print_result_id"]
            isOneToOne: false
            referencedRelation: "print_results"
            referencedColumns: ["id"]
          },
        ]
      }
      print_results: {
        Row: {
          caption: string | null
          created_at: string | null
          filament_id: string
          id: string
          image_url: string
          likes_count: number | null
          print_settings: Json | null
          printer_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          filament_id: string
          id?: string
          image_url: string
          likes_count?: number | null
          print_settings?: Json | null
          printer_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          filament_id?: string
          id?: string
          image_url?: string
          likes_count?: number | null
          print_settings?: Json | null
          printer_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_results_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "print_results_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_results_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "print_results_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "print_results_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_results_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
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
      printer_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          printer_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          printer_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          printer_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printer_analytics_printer_id_fkey"
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
          free_shipping_threshold: number | null
          has_expert_support: boolean | null
          id: string
          last_discovery_run_at: string | null
          new_models_found_count: number | null
          return_policy_days: number | null
          scrape_config: Json | null
          updated_at: string | null
          warranty_coverage: string | null
          warranty_years: number | null
        }
        Insert: {
          brand: string
          created_at?: string | null
          free_shipping_threshold?: number | null
          has_expert_support?: boolean | null
          id?: string
          last_discovery_run_at?: string | null
          new_models_found_count?: number | null
          return_policy_days?: number | null
          scrape_config?: Json | null
          updated_at?: string | null
          warranty_coverage?: string | null
          warranty_years?: number | null
        }
        Update: {
          brand?: string
          created_at?: string | null
          free_shipping_threshold?: number | null
          has_expert_support?: boolean | null
          id?: string
          last_discovery_run_at?: string | null
          new_models_found_count?: number | null
          return_policy_days?: number | null
          scrape_config?: Json | null
          updated_at?: string | null
          warranty_coverage?: string | null
          warranty_years?: number | null
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
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "printer_compatibility_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_compatibility_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "printer_compatibility_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "printer_compatibility_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
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
      printer_inventory: {
        Row: {
          created_at: string | null
          currency: string | null
          estimated_ship_days: number | null
          id: string
          last_checked: string | null
          price: number | null
          printer_id: string
          product_url: string | null
          retailer_id: string
          stock_quantity: number | null
          stock_status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          estimated_ship_days?: number | null
          id?: string
          last_checked?: string | null
          price?: number | null
          printer_id: string
          product_url?: string | null
          retailer_id: string
          stock_quantity?: number | null
          stock_status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          estimated_ship_days?: number | null
          id?: string
          last_checked?: string | null
          price?: number | null
          printer_id?: string
          product_url?: string | null
          retailer_id?: string
          stock_quantity?: number | null
          stock_status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printer_inventory_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_inventory_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
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
          ai_camera_features: string | null
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
          camera_count: number | null
          camera_resolution: string | null
          camera_type: string | null
          cloud_platforms: string | null
          coming_soon: boolean | null
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
          layer_height_default_um: number | null
          layer_height_max_um: number | null
          layer_height_min_um: number | null
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
          price_confidence: string | null
          price_source: string | null
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
          repeatability_um: number | null
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
          timelapse_supported: boolean | null
          typical_power_abs_w: number | null
          typical_power_pla_w: number | null
          ui_language_options: string | null
          updated_at: string | null
          variant_or_bundle_name: string | null
          warranty_coverage: string | null
          warranty_years: number | null
          xy_positioning_accuracy_um: number | null
          z_offset_supported: boolean | null
          z_positioning_accuracy_um: number | null
        }
        Insert: {
          abl_technique?: string | null
          abrasive_filament_support?: boolean | null
          abrasive_materials_supported?: boolean | null
          ai_camera_features?: string | null
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
          camera_count?: number | null
          camera_resolution?: string | null
          camera_type?: string | null
          cloud_platforms?: string | null
          coming_soon?: boolean | null
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
          layer_height_default_um?: number | null
          layer_height_max_um?: number | null
          layer_height_min_um?: number | null
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
          price_confidence?: string | null
          price_source?: string | null
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
          repeatability_um?: number | null
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
          timelapse_supported?: boolean | null
          typical_power_abs_w?: number | null
          typical_power_pla_w?: number | null
          ui_language_options?: string | null
          updated_at?: string | null
          variant_or_bundle_name?: string | null
          warranty_coverage?: string | null
          warranty_years?: number | null
          xy_positioning_accuracy_um?: number | null
          z_offset_supported?: boolean | null
          z_positioning_accuracy_um?: number | null
        }
        Update: {
          abl_technique?: string | null
          abrasive_filament_support?: boolean | null
          abrasive_materials_supported?: boolean | null
          ai_camera_features?: string | null
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
          camera_count?: number | null
          camera_resolution?: string | null
          camera_type?: string | null
          cloud_platforms?: string | null
          coming_soon?: boolean | null
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
          layer_height_default_um?: number | null
          layer_height_max_um?: number | null
          layer_height_min_um?: number | null
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
          price_confidence?: string | null
          price_source?: string | null
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
          repeatability_um?: number | null
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
          timelapse_supported?: boolean | null
          typical_power_abs_w?: number | null
          typical_power_pla_w?: number | null
          ui_language_options?: string | null
          updated_at?: string | null
          variant_or_bundle_name?: string | null
          warranty_coverage?: string | null
          warranty_years?: number | null
          xy_positioning_accuracy_um?: number | null
          z_offset_supported?: boolean | null
          z_positioning_accuracy_um?: number | null
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
      product_answers: {
        Row: {
          answer_text: string
          created_at: string | null
          helpful_count: number | null
          id: string
          is_accepted: boolean | null
          is_brand_verified: boolean | null
          question_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_accepted?: boolean | null
          is_brand_verified?: boolean | null
          question_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_accepted?: boolean | null
          is_brand_verified?: boolean | null
          question_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "product_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_discovery_queue: {
        Row: {
          attempts: number | null
          brand_id: string | null
          brand_slug: string
          created_at: string | null
          discovered_at: string | null
          discovery_method: string | null
          error_message: string | null
          filament_id: string | null
          id: string
          last_attempt_at: string | null
          max_attempts: number | null
          next_attempt_at: string | null
          priority: number | null
          product_handle: string | null
          product_title: string | null
          product_url: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          brand_id?: string | null
          brand_slug: string
          created_at?: string | null
          discovered_at?: string | null
          discovery_method?: string | null
          error_message?: string | null
          filament_id?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          next_attempt_at?: string | null
          priority?: number | null
          product_handle?: string | null
          product_title?: string | null
          product_url: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          brand_id?: string | null
          brand_slug?: string
          created_at?: string | null
          discovered_at?: string | null
          discovery_method?: string | null
          error_message?: string | null
          filament_id?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          next_attempt_at?: string | null
          priority?: number | null
          product_handle?: string | null
          product_title?: string | null
          product_url?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_discovery_queue_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "automated_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_discovery_queue_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_active_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_discovery_queue_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brands_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_discovery_queue_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_public_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      product_questions: {
        Row: {
          answer_count: number | null
          created_at: string | null
          filament_id: string
          helpful_count: number | null
          id: string
          question_text: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_count?: number | null
          created_at?: string | null
          filament_id: string
          helpful_count?: number | null
          id?: string
          question_text: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_count?: number | null
          created_at?: string | null
          filament_id?: string
          helpful_count?: number | null
          id?: string
          question_text?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_questions_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "product_questions_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_questions_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "product_questions_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "product_questions_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      product_regional_slugs: {
        Row: {
          created_at: string | null
          filament_id: string
          http_status: number | null
          id: string
          region_code: string
          slug: string
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          filament_id: string
          http_status?: number | null
          id?: string
          region_code: string
          slug: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          filament_id?: string
          http_status?: number | null
          id?: string
          region_code?: string
          slug?: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_regional_slugs_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "product_regional_slugs_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_regional_slugs_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "product_regional_slugs_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "product_regional_slugs_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          amazon_prime_member: boolean | null
          avatar_url: string | null
          completed_tutorials: Json | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          preferred_currency: string | null
          preferred_slicer: string | null
          retailer_memberships: Json | null
          settings_visibility: string | null
          shipping_country: string | null
          shipping_zip_code: string | null
          skill_level: string | null
          updated_at: string | null
          wishlist_email_digest: boolean | null
          wishlist_price_alerts: boolean | null
          wishlist_restock_alerts: boolean | null
        }
        Insert: {
          amazon_prime_member?: boolean | null
          avatar_url?: string | null
          completed_tutorials?: Json | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          preferred_currency?: string | null
          preferred_slicer?: string | null
          retailer_memberships?: Json | null
          settings_visibility?: string | null
          shipping_country?: string | null
          shipping_zip_code?: string | null
          skill_level?: string | null
          updated_at?: string | null
          wishlist_email_digest?: boolean | null
          wishlist_price_alerts?: boolean | null
          wishlist_restock_alerts?: boolean | null
        }
        Update: {
          amazon_prime_member?: boolean | null
          avatar_url?: string | null
          completed_tutorials?: Json | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          preferred_currency?: string | null
          preferred_slicer?: string | null
          retailer_memberships?: Json | null
          settings_visibility?: string | null
          shipping_country?: string | null
          shipping_zip_code?: string | null
          skill_level?: string | null
          updated_at?: string | null
          wishlist_email_digest?: boolean | null
          wishlist_price_alerts?: boolean | null
          wishlist_restock_alerts?: boolean | null
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
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "project_filaments_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_filaments_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "project_filaments_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "project_filaments_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
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
      retailers: {
        Row: {
          created_at: string | null
          customer_service_rating: number | null
          flat_rate_shipping: number | null
          free_shipping_threshold: number | null
          id: string
          logo_url: string | null
          membership_program: string | null
          name: string
          regions_served: string[] | null
          restocking_fee_percent: number | null
          return_policy_days: number | null
          return_policy_type: string | null
          shipping_speed_rating: number | null
          slug: string
          trust_score: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          customer_service_rating?: number | null
          flat_rate_shipping?: number | null
          free_shipping_threshold?: number | null
          id?: string
          logo_url?: string | null
          membership_program?: string | null
          name: string
          regions_served?: string[] | null
          restocking_fee_percent?: number | null
          return_policy_days?: number | null
          return_policy_type?: string | null
          shipping_speed_rating?: number | null
          slug: string
          trust_score?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          customer_service_rating?: number | null
          flat_rate_shipping?: number | null
          free_shipping_threshold?: number | null
          id?: string
          logo_url?: string | null
          membership_program?: string | null
          name?: string
          regions_served?: string[] | null
          restocking_fee_percent?: number | null
          return_policy_days?: number | null
          return_policy_type?: string | null
          shipping_speed_rating?: number | null
          slug?: string
          trust_score?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      revenue_attribution: {
        Row: {
          conversion_type: string
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          revenue_amount: number | null
          session_id: string | null
          source_entity_id: string | null
          source_entity_type: string | null
          source_module: string
          user_id: string | null
        }
        Insert: {
          conversion_type: string
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          revenue_amount?: number | null
          session_id?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_module: string
          user_id?: string | null
        }
        Update: {
          conversion_type?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          revenue_amount?: number | null
          session_id?: string | null
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_module?: string
          user_id?: string | null
        }
        Relationships: []
      }
      review_helpful_votes: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "filament_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_alert_subscriptions: {
        Row: {
          alert_levels: string[] | null
          brand_filters: string[] | null
          created_at: string | null
          email: string
          email_enabled: boolean | null
          id: string
          phone: string | null
          sms_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_levels?: string[] | null
          brand_filters?: string[] | null
          created_at?: string | null
          email: string
          email_enabled?: boolean | null
          id?: string
          phone?: string | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_levels?: string[] | null
          brand_filters?: string[] | null
          created_at?: string | null
          email?: string
          email_enabled?: boolean | null
          id?: string
          phone?: string | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      safety_alerts: {
        Row: {
          affected_batches: Json | null
          affected_timeframe: string | null
          batch_info: string | null
          brand: string
          community_report_count: number | null
          created_at: string | null
          details_url: string | null
          disposal_instructions: string | null
          expires_at: string | null
          filament_id: string | null
          headline: string
          id: string
          is_active: boolean | null
          manufacturer_contact: string | null
          manufacturer_statement: string | null
          material: string
          priority: string | null
          reason: string
          recall_url: string | null
          replacement_process: string | null
          resolution_notes: string | null
          resolution_status: string | null
          resolved_at: string | null
          verified_at: string | null
        }
        Insert: {
          affected_batches?: Json | null
          affected_timeframe?: string | null
          batch_info?: string | null
          brand: string
          community_report_count?: number | null
          created_at?: string | null
          details_url?: string | null
          disposal_instructions?: string | null
          expires_at?: string | null
          filament_id?: string | null
          headline: string
          id?: string
          is_active?: boolean | null
          manufacturer_contact?: string | null
          manufacturer_statement?: string | null
          material: string
          priority?: string | null
          reason: string
          recall_url?: string | null
          replacement_process?: string | null
          resolution_notes?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          verified_at?: string | null
        }
        Update: {
          affected_batches?: Json | null
          affected_timeframe?: string | null
          batch_info?: string | null
          brand?: string
          community_report_count?: number | null
          created_at?: string | null
          details_url?: string | null
          disposal_instructions?: string | null
          expires_at?: string | null
          filament_id?: string | null
          headline?: string
          id?: string
          is_active?: boolean | null
          manufacturer_contact?: string | null
          manufacturer_statement?: string | null
          material?: string
          priority?: string | null
          reason?: string
          recall_url?: string | null
          replacement_process?: string | null
          resolution_notes?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_alerts_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "safety_alerts_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_alerts_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "safety_alerts_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "safety_alerts_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
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
      scrape_decision_logs: {
        Row: {
          brand_slug: string
          created_at: string | null
          decision_reason: string | null
          decision_type: string
          id: string
          input_data: Json | null
          output_data: Json | null
          product_id: string | null
          product_title: string | null
          success: boolean | null
          sync_log_id: string | null
        }
        Insert: {
          brand_slug: string
          created_at?: string | null
          decision_reason?: string | null
          decision_type: string
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          product_id?: string | null
          product_title?: string | null
          success?: boolean | null
          sync_log_id?: string | null
        }
        Update: {
          brand_slug?: string
          created_at?: string | null
          decision_reason?: string | null
          decision_type?: string
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          product_id?: string | null
          product_title?: string | null
          success?: boolean | null
          sync_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scrape_decision_logs_sync_log_id_fkey"
            columns: ["sync_log_id"]
            isOneToOne: false
            referencedRelation: "brand_sync_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrape_decision_logs_sync_log_id_fkey"
            columns: ["sync_log_id"]
            isOneToOne: false
            referencedRelation: "v_recent_syncs"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_job_logs: {
        Row: {
          created_at: string | null
          id: string
          job_id: string | null
          level: string
          message: string
          metadata: Json | null
          stage: string | null
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          level: string
          message: string
          metadata?: Json | null
          stage?: string | null
          timestamp?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          level?: string
          message?: string
          metadata?: Json | null
          stage?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_job_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scrape_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_jobs: {
        Row: {
          ai_summary: Json | null
          completed_at: string | null
          created_at: string | null
          dry_run: boolean | null
          error: string | null
          id: string
          job_type: string
          materials: string[]
          products: string[] | null
          progress: Json | null
          request_id: string | null
          results: Json | null
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          ai_summary?: Json | null
          completed_at?: string | null
          created_at?: string | null
          dry_run?: boolean | null
          error?: string | null
          id?: string
          job_type: string
          materials?: string[]
          products?: string[] | null
          progress?: Json | null
          request_id?: string | null
          results?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          ai_summary?: Json | null
          completed_at?: string | null
          created_at?: string | null
          dry_run?: boolean | null
          error?: string | null
          id?: string
          job_type?: string
          materials?: string[]
          products?: string[] | null
          progress?: Json | null
          request_id?: string | null
          results?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          created_at: string
          filters_applied: string[] | null
          has_results: boolean
          id: string
          query: string
          result_count: number
          session_id: string | null
          time_to_results_ms: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          filters_applied?: string[] | null
          has_results: boolean
          id?: string
          query: string
          result_count: number
          session_id?: string | null
          time_to_results_ms?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          filters_applied?: string[] | null
          has_results?: boolean
          id?: string
          query?: string
          result_count?: number
          session_id?: string | null
          time_to_results_ms?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      shared_settings: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          filament_id: string | null
          id: string
          printer_id: string | null
          settings: Json
          short_code: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          filament_id?: string | null
          id?: string
          printer_id?: string | null
          settings: Json
          short_code: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          filament_id?: string | null
          id?: string
          printer_id?: string | null
          settings?: Json
          short_code?: string
          view_count?: number | null
        }
        Relationships: []
      }
      shared_wishlists: {
        Row: {
          collection_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          share_code: string
          title: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          share_code: string
          title?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          share_code?: string
          title?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_wishlists_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "wishlist_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_estimates: {
        Row: {
          carrier: string | null
          dest_country: string
          dest_zip_prefix: string | null
          id: string
          max_days: number | null
          min_days: number | null
          origin_region: string
          retailer_id: string
          shipping_cost: number | null
          shipping_currency: string | null
          updated_at: string | null
        }
        Insert: {
          carrier?: string | null
          dest_country: string
          dest_zip_prefix?: string | null
          id?: string
          max_days?: number | null
          min_days?: number | null
          origin_region: string
          retailer_id: string
          shipping_cost?: number | null
          shipping_currency?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier?: string | null
          dest_country?: string
          dest_zip_prefix?: string | null
          id?: string
          max_days?: number | null
          min_days?: number | null
          origin_region?: string
          retailer_id?: string
          shipping_cost?: number | null
          shipping_currency?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_estimates_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      sync_activity_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          job_id: string
          level: string
          phase: string
          product_id: string | null
          product_title: string | null
          region: string | null
          timestamp: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          job_id: string
          level?: string
          phase: string
          product_id?: string | null
          product_title?: string | null
          region?: string | null
          timestamp?: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          job_id?: string
          level?: string
          phase?: string
          product_id?: string | null
          product_title?: string | null
          region?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_activity_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scrape_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_activity_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "sync_activity_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_activity_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "sync_activity_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "sync_activity_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          data_source: string
          duration_seconds: number | null
          error_message: string | null
          id: string
          records_failed: number | null
          records_fetched: number | null
          records_updated: number | null
          started_at: string | null
          status: string | null
          success_details: Json | null
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          data_source: string
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          records_failed?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string | null
          success_details?: Json | null
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          data_source?: string
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          records_failed?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string | null
          success_details?: Json | null
          sync_type?: string
        }
        Relationships: []
      }
      tds_review_queue: {
        Row: {
          created_at: string | null
          extraction_attempt: Json | null
          filament_id: string | null
          id: string
          notes: string | null
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          tds_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          extraction_attempt?: Json | null
          filament_id?: string | null
          id?: string
          notes?: string | null
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tds_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          extraction_attempt?: Json | null
          filament_id?: string | null
          id?: string
          notes?: string | null
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tds_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tds_review_queue_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "tds_review_queue_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tds_review_queue_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "tds_review_queue_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "tds_review_queue_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
        ]
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
      url_validation_cache: {
        Row: {
          check_count: number | null
          consecutive_failures: number | null
          created_at: string
          id: string
          last_checked: string
          redirect_url: string | null
          status: string
          status_code: number | null
          url: string
        }
        Insert: {
          check_count?: number | null
          consecutive_failures?: number | null
          created_at?: string
          id?: string
          last_checked?: string
          redirect_url?: string | null
          status: string
          status_code?: number | null
          url: string
        }
        Update: {
          check_count?: number | null
          consecutive_failures?: number | null
          created_at?: string
          id?: string
          last_checked?: string
          redirect_url?: string | null
          status?: string
          status_code?: number | null
          url?: string
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
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: Json | null
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: Json | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: Json | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          entity_value: string | null
          id: string
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          entity_value?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          entity_value?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_browse_history: {
        Row: {
          filament_id: string | null
          id: string
          session_id: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          filament_id?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          filament_id?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_browse_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "user_browse_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_browse_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "user_browse_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "user_browse_history_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          collection_id: string | null
          created_at: string | null
          filament_id: string | null
          id: string
          last_notified_at: string | null
          notes: string | null
          price_when_added: number | null
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          filament_id?: string | null
          id?: string
          last_notified_at?: string | null
          notes?: string | null
          price_when_added?: number | null
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          filament_id?: string | null
          id?: string
          last_notified_at?: string | null
          notes?: string | null
          price_when_added?: number | null
          tags?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "wishlist_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "user_favorites_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "user_favorites_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "user_favorites_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
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
      user_material_interests: {
        Row: {
          id: string
          interest_score: number | null
          last_interaction: string | null
          material: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          interest_score?: number | null
          last_interaction?: string | null
          material: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          interest_score?: number | null
          last_interaction?: string | null
          material?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_printer_preferences: {
        Row: {
          auto_filter: boolean | null
          bed_temp_max: number | null
          created_at: string
          has_enclosure: boolean | null
          id: string
          nozzle_temp_max: number | null
          printer_id: string | null
          printer_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_filter?: boolean | null
          bed_temp_max?: number | null
          created_at?: string
          has_enclosure?: boolean | null
          id?: string
          nozzle_temp_max?: number | null
          printer_id?: string | null
          printer_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_filter?: boolean | null
          bed_temp_max?: number | null
          created_at?: string
          has_enclosure?: boolean | null
          id?: string
          nozzle_temp_max?: number | null
          printer_id?: string | null
          printer_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_printer_preferences_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_printers: {
        Row: {
          created_at: string
          hardware_config: Json | null
          id: string
          is_primary: boolean | null
          nickname: string | null
          printer_id: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          hardware_config?: Json | null
          id?: string
          is_primary?: boolean | null
          nickname?: string | null
          printer_id: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          hardware_config?: Json | null
          id?: string
          is_primary?: boolean | null
          nickname?: string | null
          printer_id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_printing_stats: {
        Row: {
          comparisons_made: number | null
          glossary_lookups: number | null
          id: string
          materials_explored: number | null
          printers_configured: number | null
          settings_exported: number | null
          tutorials_watched: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comparisons_made?: number | null
          glossary_lookups?: number | null
          id?: string
          materials_explored?: number | null
          printers_configured?: number | null
          settings_exported?: number | null
          tutorials_watched?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comparisons_made?: number | null
          glossary_lookups?: number | null
          id?: string
          materials_explored?: number | null
          printers_configured?: number | null
          settings_exported?: number | null
          tutorials_watched?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "user_purchases_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchases_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "user_purchases_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "user_purchases_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
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
      user_region_preferences: {
        Row: {
          created_at: string
          currency_code: string
          detected_method: string | null
          id: string
          region_code: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency_code: string
          detected_method?: string | null
          id?: string
          region_code: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency_code?: string
          detected_method?: string | null
          id?: string
          region_code?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
      user_settings_history: {
        Row: {
          created_at: string | null
          filament_id: string
          id: string
          notes: string | null
          printer_id: string | null
          session_id: string | null
          settings: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filament_id: string
          id?: string
          notes?: string | null
          printer_id?: string | null
          session_id?: string | null
          settings: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filament_id?: string
          id?: string
          notes?: string | null
          printer_id?: string | null
          session_id?: string | null
          settings?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      user_sidebar_preferences: {
        Row: {
          hidden_modules: string[] | null
          id: string
          module_engagement: Json | null
          module_order: Json | null
          price_sensitivity: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          hidden_modules?: string[] | null
          id?: string
          module_engagement?: Json | null
          module_order?: Json | null
          price_sensitivity?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          hidden_modules?: string[] | null
          id?: string
          module_engagement?: Json | null
          module_order?: Json | null
          price_sensitivity?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_slicer_profiles: {
        Row: {
          created_at: string | null
          custom_notes: string | null
          filament_id: string
          id: string
          is_custom: boolean | null
          profile_data: Json
          profile_name: string
          slicer_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_notes?: string | null
          filament_id: string
          id?: string
          is_custom?: boolean | null
          profile_data: Json
          profile_name: string
          slicer_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_notes?: string | null
          filament_id?: string
          id?: string
          is_custom?: boolean | null
          profile_data?: Json
          profile_name?: string
          slicer_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_slicer_profiles_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "user_slicer_profiles_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_slicer_profiles_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "user_slicer_profiles_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "user_slicer_profiles_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_collections: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      all_time_low_prices: {
        Row: {
          all_time_low: number | null
          current_price: number | null
          difference: number | null
          filament_id: string | null
          percent_above_low: number | null
          product_id: string | null
          product_title: string | null
          product_url: string | null
          vendor: string | null
        }
        Relationships: []
      }
      price_trends_90d: {
        Row: {
          avg_price_90d: number | null
          current_price: number | null
          days_tracked: number | null
          filament_id: string | null
          max_price_90d: number | null
          min_price_90d: number | null
          price_samples: number | null
          price_volatility: number | null
          product_id: string | null
          product_title: string | null
          vendor: string | null
        }
        Relationships: []
      }
      recent_price_drops: {
        Row: {
          current_price: number | null
          filament_id: string | null
          material: string | null
          old_price: number | null
          percent_change: number | null
          previous_price_date: string | null
          price_change: number | null
          product_id: string | null
          product_title: string | null
          product_url: string | null
          vendor: string | null
        }
        Relationships: []
      }
      v_active_brands: {
        Row: {
          actual_product_count: number | null
          actual_products_with_urls: number | null
          avg_product_price: number | null
          brand_name: string | null
          brand_slug: string | null
          color_primary: string | null
          display_name: string | null
          display_order: number | null
          featured: boolean | null
          id: string | null
          last_product_sync: string | null
          last_scrape_at: string | null
          logo_url: string | null
          platform_type: string | null
          product_count: number | null
          products_with_prices: number | null
          scraping_active: boolean | null
          scraping_enabled: boolean | null
          website_url: string | null
        }
        Relationships: []
      }
      v_brand_scraping_stats: {
        Row: {
          avg_scrape_duration_seconds: number | null
          brand_name: string | null
          brand_slug: string | null
          failed_scrapes: number | null
          last_error: string | null
          last_error_at: string | null
          last_scrape_at: string | null
          next_scrape_at: string | null
          platform_type: string | null
          scraping_active: boolean | null
          scraping_enabled: boolean | null
          success_rate_percent: number | null
          successful_scrapes: number | null
          total_scrapes: number | null
        }
        Insert: {
          avg_scrape_duration_seconds?: number | null
          brand_name?: string | null
          brand_slug?: string | null
          failed_scrapes?: number | null
          last_error?: string | null
          last_error_at?: string | null
          last_scrape_at?: string | null
          next_scrape_at?: string | null
          platform_type?: string | null
          scraping_active?: boolean | null
          scraping_enabled?: boolean | null
          success_rate_percent?: never
          successful_scrapes?: number | null
          total_scrapes?: number | null
        }
        Update: {
          avg_scrape_duration_seconds?: number | null
          brand_name?: string | null
          brand_slug?: string | null
          failed_scrapes?: number | null
          last_error?: string | null
          last_error_at?: string | null
          last_scrape_at?: string | null
          next_scrape_at?: string | null
          platform_type?: string | null
          scraping_active?: boolean | null
          scraping_enabled?: boolean | null
          success_rate_percent?: never
          successful_scrapes?: number | null
          total_scrapes?: number | null
        }
        Relationships: []
      }
      v_brands_overview: {
        Row: {
          active_product_count: number | null
          auto_create_products: boolean | null
          avg_scrape_duration_seconds: number | null
          brand_name: string | null
          brand_slug: string | null
          display_name: string | null
          failed_scrapes: number | null
          id: string | null
          last_error: string | null
          last_error_at: string | null
          last_scrape_at: string | null
          next_scrape_at: string | null
          platform_type: string | null
          product_count: number | null
          products_created: number | null
          products_updated: number | null
          products_with_prices: number | null
          products_with_urls: number | null
          scraping_active: boolean | null
          scraping_enabled: boolean | null
          success_rate_percent: number | null
          successful_scrapes: number | null
          total_scrapes: number | null
        }
        Insert: {
          active_product_count?: number | null
          auto_create_products?: boolean | null
          avg_scrape_duration_seconds?: number | null
          brand_name?: string | null
          brand_slug?: string | null
          display_name?: string | null
          failed_scrapes?: number | null
          id?: string | null
          last_error?: string | null
          last_error_at?: string | null
          last_scrape_at?: string | null
          next_scrape_at?: string | null
          platform_type?: string | null
          product_count?: number | null
          products_created?: number | null
          products_updated?: number | null
          products_with_prices?: number | null
          products_with_urls?: number | null
          scraping_active?: boolean | null
          scraping_enabled?: boolean | null
          success_rate_percent?: never
          successful_scrapes?: number | null
          total_scrapes?: number | null
        }
        Update: {
          active_product_count?: number | null
          auto_create_products?: boolean | null
          avg_scrape_duration_seconds?: number | null
          brand_name?: string | null
          brand_slug?: string | null
          display_name?: string | null
          failed_scrapes?: number | null
          id?: string | null
          last_error?: string | null
          last_error_at?: string | null
          last_scrape_at?: string | null
          next_scrape_at?: string | null
          platform_type?: string | null
          product_count?: number | null
          products_created?: number | null
          products_updated?: number | null
          products_with_prices?: number | null
          products_with_urls?: number | null
          scraping_active?: boolean | null
          scraping_enabled?: boolean | null
          success_rate_percent?: never
          successful_scrapes?: number | null
          total_scrapes?: number | null
        }
        Relationships: []
      }
      v_filament_listings: {
        Row: {
          affiliate_url: string | null
          available: boolean | null
          brand: string | null
          color_hex: string | null
          compare_at_price: number | null
          currency: string | null
          current_price: number | null
          filament_id: string | null
          is_primary: boolean | null
          last_scraped_at: string | null
          listing_id: string | null
          material: string | null
          net_weight_g: number | null
          price_per_kg: number | null
          product_title: string | null
          product_url: string | null
          region: string | null
          retailer_id: string | null
          retailer_logo: string | null
          retailer_name: string | null
          retailer_slug: string | null
          retailer_trust_score: number | null
          scrape_status: string | null
          stock_level: string | null
          transmission_distance: number | null
        }
        Relationships: [
          {
            foreignKeyName: "filament_listings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "all_time_low_prices"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_listings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filament_listings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "price_trends_90d"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_listings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "recent_price_drops"
            referencedColumns: ["filament_id"]
          },
          {
            foreignKeyName: "filament_listings_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "v_filaments_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filament_listings_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      v_filaments_normalized: {
        Row: {
          bed_temp_max_c: number | null
          bed_temp_min_c: number | null
          brand_display_name: string | null
          brand_logo: string | null
          brand_name: string | null
          color_family_hex: string | null
          color_family_name: string | null
          color_hex: string | null
          created_at: string | null
          diameter_nominal_mm: number | null
          featured_image: string | null
          finish_type_name: string | null
          id: string | null
          material_base_type: string | null
          material_is_composite: boolean | null
          material_name: string | null
          moisture_level_name: string | null
          moisture_severity: number | null
          net_weight_g: number | null
          nozzle_temp_max_c: number | null
          nozzle_temp_min_c: number | null
          product_handle: string | null
          product_id: string | null
          product_line_id: string | null
          product_title: string | null
          product_url: string | null
          requires_hardened_nozzle: boolean | null
          tds_url: string | null
          updated_at: string | null
          variant_available: boolean | null
          variant_price: number | null
          vendor: string | null
        }
        Relationships: []
      }
      v_pending_discoveries: {
        Row: {
          attempts: number | null
          brand_display_name: string | null
          brand_slug: string | null
          discovered_at: string | null
          error_message: string | null
          id: string | null
          last_attempt_at: string | null
          priority: number | null
          product_title: string | null
          product_url: string | null
          status: string | null
        }
        Relationships: []
      }
      v_public_brands: {
        Row: {
          active_product_count: number | null
          brand_name: string | null
          brand_slug: string | null
          color_primary: string | null
          color_secondary: string | null
          description: string | null
          display_name: string | null
          display_order: number | null
          featured: boolean | null
          id: string | null
          is_visible: boolean | null
          logo_url: string | null
          product_count: number | null
          website_url: string | null
        }
        Insert: {
          active_product_count?: number | null
          brand_name?: string | null
          brand_slug?: string | null
          color_primary?: string | null
          color_secondary?: string | null
          description?: string | null
          display_name?: string | null
          display_order?: number | null
          featured?: boolean | null
          id?: string | null
          is_visible?: boolean | null
          logo_url?: string | null
          product_count?: number | null
          website_url?: string | null
        }
        Update: {
          active_product_count?: number | null
          brand_name?: string | null
          brand_slug?: string | null
          color_primary?: string | null
          color_secondary?: string | null
          description?: string | null
          display_name?: string | null
          display_order?: number | null
          featured?: boolean | null
          id?: string | null
          is_visible?: boolean | null
          logo_url?: string | null
          product_count?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      v_recent_syncs: {
        Row: {
          brand_slug: string | null
          completed_at: string | null
          display_name: string | null
          duration_seconds: number | null
          error_details: Json | null
          id: string | null
          platform_type: string | null
          price_changes: number | null
          products_created: number | null
          products_discovered: number | null
          products_failed: number | null
          products_updated: number | null
          started_at: string | null
          status: string | null
          sync_type: string | null
          triggered_by: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      batch_upsert_filaments: {
        Args: { p_brand_id?: string; p_products: Json; p_vendor: string }
        Returns: Json
      }
      cleanup_old_price_history: { Args: never; Returns: number }
      cleanup_old_scrape_logs: { Args: never; Returns: number }
      cleanup_stuck_scrapes: {
        Args: never
        Returns: {
          brands_reset: number
          logs_fixed: number
        }[]
      }
      complete_brand_scrape: {
        Args: {
          p_error_message?: string
          p_price_changes?: number
          p_products_created?: number
          p_products_discovered?: number
          p_products_failed?: number
          p_products_updated?: number
          p_success: boolean
          p_sync_log_id: string
        }
        Returns: undefined
      }
      create_brand_sync_log: {
        Args: {
          p_brand_slug: string
          p_sync_type?: string
          p_triggered_by?: string
        }
        Returns: string
      }
      find_duplicate_hexes: {
        Args: { p_vendor: string }
        Returns: {
          color_hex: string
          duplicate_count: number
          id: string
          product_line_id: string
          product_title: string
        }[]
      }
      get_best_listing: {
        Args: { _currency?: string; _filament_id: string; _region?: string }
        Returns: {
          available: boolean
          current_price: number
          listing_id: string
          product_url: string
          retailer_name: string
          retailer_slug: string
        }[]
      }
      get_brands_needing_scrape: {
        Args: never
        Returns: {
          brand_name: string
          brand_slug: string
          last_scrape_at: string
          platform_type: string
          scrape_frequency_hours: number
        }[]
      }
      get_deal_alerts: {
        Args: { min_discount_percent?: number }
        Returns: {
          filament_id: string
          new_price: number
          old_price: number
          percent_off: number
          product_id: string
          product_title: string
          product_url: string
          savings: number
          vendor: string
        }[]
      }
      get_filament_price_history: {
        Args: { days_back?: number; p_filament_id: string }
        Returns: {
          available: boolean
          compare_at_price: number
          price: number
          recorded_at: string
          source: string
        }[]
      }
      get_filament_price_stats: {
        Args: { p_filament_id: string }
        Returns: Json
      }
      get_price_confidence: { Args: { last_verified: string }; Returns: string }
      get_printer_activity_stats: {
        Args: { p_printer_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_at_all_time_low: { Args: { p_filament_id: string }; Returns: boolean }
      link_filaments_to_brands: { Args: never; Returns: undefined }
      record_scrape_result: {
        Args: {
          p_brand_slug: string
          p_duration_seconds: number
          p_error_message?: string
          p_products_processed?: number
          p_products_updated?: number
          p_success: boolean
        }
        Returns: undefined
      }
      start_brand_scrape: { Args: { p_brand_slug: string }; Returns: boolean }
      update_brand_enrichment_counts: {
        Args: { p_brand_slug: string }
        Returns: undefined
      }
      update_brand_product_counts: {
        Args: { p_brand_slug?: string }
        Returns: undefined
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
