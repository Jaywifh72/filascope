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
      filaments: {
        Row: {
          amazon_link_de: string | null
          amazon_link_uk: string | null
          amazon_link_us: string | null
          bed_temp_max_c: number | null
          bed_temp_min_c: number | null
          color_family: string | null
          color_hex: string | null
          created_at: string | null
          density_g_cm3: number | null
          diameter_nominal_mm: number | null
          dimensional_accuracy_score: number | null
          drying_temp_c: number | null
          drying_time_hours: number | null
          ease_of_printing_score: number | null
          elongation_break_xy_percent: number | null
          fan_max_percent: number | null
          fan_min_percent: number | null
          featured_image: string | null
          finish_type: string | null
          flexural_strength_mpa: number | null
          food_contact_rating: string | null
          id: string
          industry_tags: string[] | null
          is_nozzle_abrasive: boolean | null
          material: string | null
          melt_temp_c: number | null
          moisture_care: string | null
          moisture_sensitivity_level: string | null
          net_weight_g: number | null
          nozzle_care: string | null
          nozzle_temp_max_c: number | null
          nozzle_temp_min_c: number | null
          nozzle_temp_sweetspot_c: number | null
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
          spool_outer_d_mm: number | null
          spool_width_mm: number | null
          strength_index: number | null
          tds_url: string | null
          tensile_modulus_xy_mpa: number | null
          tensile_strength_xy_mpa: number | null
          tg_c: number | null
          updated_at: string | null
          use_case_tags: string[] | null
          value_score: number | null
          variant_available: boolean | null
          variant_price: number | null
          variant_sku: string | null
          vendor: string | null
        }
        Insert: {
          amazon_link_de?: string | null
          amazon_link_uk?: string | null
          amazon_link_us?: string | null
          bed_temp_max_c?: number | null
          bed_temp_min_c?: number | null
          color_family?: string | null
          color_hex?: string | null
          created_at?: string | null
          density_g_cm3?: number | null
          diameter_nominal_mm?: number | null
          dimensional_accuracy_score?: number | null
          drying_temp_c?: number | null
          drying_time_hours?: number | null
          ease_of_printing_score?: number | null
          elongation_break_xy_percent?: number | null
          fan_max_percent?: number | null
          fan_min_percent?: number | null
          featured_image?: string | null
          finish_type?: string | null
          flexural_strength_mpa?: number | null
          food_contact_rating?: string | null
          id?: string
          industry_tags?: string[] | null
          is_nozzle_abrasive?: boolean | null
          material?: string | null
          melt_temp_c?: number | null
          moisture_care?: string | null
          moisture_sensitivity_level?: string | null
          net_weight_g?: number | null
          nozzle_care?: string | null
          nozzle_temp_max_c?: number | null
          nozzle_temp_min_c?: number | null
          nozzle_temp_sweetspot_c?: number | null
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
          spool_outer_d_mm?: number | null
          spool_width_mm?: number | null
          strength_index?: number | null
          tds_url?: string | null
          tensile_modulus_xy_mpa?: number | null
          tensile_strength_xy_mpa?: number | null
          tg_c?: number | null
          updated_at?: string | null
          use_case_tags?: string[] | null
          value_score?: number | null
          variant_available?: boolean | null
          variant_price?: number | null
          variant_sku?: string | null
          vendor?: string | null
        }
        Update: {
          amazon_link_de?: string | null
          amazon_link_uk?: string | null
          amazon_link_us?: string | null
          bed_temp_max_c?: number | null
          bed_temp_min_c?: number | null
          color_family?: string | null
          color_hex?: string | null
          created_at?: string | null
          density_g_cm3?: number | null
          diameter_nominal_mm?: number | null
          dimensional_accuracy_score?: number | null
          drying_temp_c?: number | null
          drying_time_hours?: number | null
          ease_of_printing_score?: number | null
          elongation_break_xy_percent?: number | null
          fan_max_percent?: number | null
          fan_min_percent?: number | null
          featured_image?: string | null
          finish_type?: string | null
          flexural_strength_mpa?: number | null
          food_contact_rating?: string | null
          id?: string
          industry_tags?: string[] | null
          is_nozzle_abrasive?: boolean | null
          material?: string | null
          melt_temp_c?: number | null
          moisture_care?: string | null
          moisture_sensitivity_level?: string | null
          net_weight_g?: number | null
          nozzle_care?: string | null
          nozzle_temp_max_c?: number | null
          nozzle_temp_min_c?: number | null
          nozzle_temp_sweetspot_c?: number | null
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
          spool_outer_d_mm?: number | null
          spool_width_mm?: number | null
          strength_index?: number | null
          tds_url?: string | null
          tensile_modulus_xy_mpa?: number | null
          tensile_strength_xy_mpa?: number | null
          tg_c?: number | null
          updated_at?: string | null
          use_case_tags?: string[] | null
          value_score?: number | null
          variant_available?: boolean | null
          variant_price?: number | null
          variant_sku?: string | null
          vendor?: string | null
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
          {
            foreignKeyName: "printer_compatibility_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      printers: {
        Row: {
          brand: string
          created_at: string | null
          id: string
          model: string
        }
        Insert: {
          brand: string
          created_at?: string | null
          id?: string
          model: string
        }
        Update: {
          brand?: string
          created_at?: string | null
          id?: string
          model?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
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
