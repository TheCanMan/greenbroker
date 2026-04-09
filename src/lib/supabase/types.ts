/**
 * Supabase Database type definitions.
 * In production, generate this from your actual schema with:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 *
 * This is a manually-maintained version for the MVP.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          role: "HOMEOWNER" | "CONTRACTOR" | "ADMIN";
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          role?: "HOMEOWNER" | "CONTRACTOR" | "ADMIN";
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      home_assessments: {
        Row: {
          id: string;
          profile_id: string | null;
          zip: string;
          square_footage: number;
          year_built: number;
          bedrooms: number;
          bathrooms: number | null;
          primary_heating_fuel: string;
          current_hvac_type: string;
          hvac_age: number | null;
          has_gas: boolean;
          electric_panel_amps: number | null;
          roof_orientation: string | null;
          roof_age: number | null;
          annual_kwh: number | null;
          annual_therms: number | null;
          household_income: number | null;
          ami_bracket: string | null;
          has_existing_solar: boolean;
          has_ev: boolean;
          urgency: string | null;
          notes: string | null;
          calc_annual_energy_cost: number | null;
          calc_savings_potential: number | null;
          calc_available_rebates: number | null;
          photo_urls: string[];
          utility_bill_urls: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["home_assessments"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string };
        Update: Partial<
          Database["public"]["Tables"]["home_assessments"]["Insert"]
        >;
      };
      contractors: {
        Row: {
          id: string;
          profile_id: string;
          business_name: string;
          tier: "VERIFIED" | "PREFERRED" | "ELITE";
          status: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED";
          categories: string[];
          service_zips: string[];
          bio: string | null;
          website: string | null;
          logo_url: string | null;
          mhic_license: string | null;
          mhic_verified: boolean;
          certifications: string[];
          mea_participating: boolean;
          insurance_verified: boolean;
          background_check_passed: boolean;
          rating: number;
          review_count: number;
          completed_projects: number;
          stripe_customer_id: string | null;
          subscription_id: string | null;
          subscription_tier: string | null;
          subscription_status: string | null;
          lead_credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["contractors"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["contractors"]["Insert"]>;
      };
      leads: {
        Row: {
          id: string;
          assessment_id: string;
          contractor_id: string;
          status: "NEW" | "CONTACTED" | "QUOTED" | "WON" | "LOST" | "DISPUTED";
          price_paid: number;
          stripe_payment_id: string | null;
          contacted_at: string | null;
          quoted_at: string | null;
          closed_at: string | null;
          closed_value: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["leads"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
