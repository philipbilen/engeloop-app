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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      artist_memberships: {
        Row: {
          artist_profile_id: string
          contact_id: string
          created_at: string | null
        }
        Insert: {
          artist_profile_id: string
          contact_id: string
          created_at?: string | null
        }
        Update: {
          artist_profile_id?: string
          contact_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_memberships_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_memberships_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_search_index"
            referencedColumns: ["artist_profile_id"]
          },
          {
            foreignKeyName: "artist_memberships_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_profiles: {
        Row: {
          apple_music_url: string | null
          artist_name: string
          bio: string | null
          created_at: string | null
          id: string
          press_photo_url: string | null
          spotify_url: string | null
          updated_at: string | null
        }
        Insert: {
          apple_music_url?: string | null
          artist_name: string
          bio?: string | null
          created_at?: string | null
          id?: string
          press_photo_url?: string | null
          spotify_url?: string | null
          updated_at?: string | null
        }
        Update: {
          apple_music_url?: string | null
          artist_name?: string
          bio?: string | null
          created_at?: string | null
          id?: string
          press_photo_url?: string | null
          spotify_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      artist_users: {
        Row: {
          auth_id: string
          contact_id: string
          id: string
        }
        Insert: {
          auth_id: string
          contact_id: string
          id?: string
        }
        Update: {
          auth_id?: string
          contact_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_users_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          changed_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string
          full_legal_name: string
          full_postal_address: string | null
          id: string
          payout_info: Json | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email: string
          full_legal_name: string
          full_postal_address?: string | null
          id?: string
          payout_info?: Json | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_legal_name?: string
          full_postal_address?: string | null
          id?: string
          payout_info?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_releases: {
        Row: {
          contract_id: string
          created_at: string | null
          release_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          release_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          release_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_releases_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_releases_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_releases_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases_with_display_title"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signatories: {
        Row: {
          contact_id: string
          contract_id: string
          created_at: string | null
        }
        Insert: {
          contact_id: string
          contract_id: string
          created_at?: string | null
        }
        Update: {
          contact_id?: string
          contract_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatories_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_signatories_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          auto_renew_interval_years: number | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          contract_type_custom: string | null
          created_at: string | null
          document_url: string | null
          effective_at: string | null
          executed_at: string | null
          expires_at: string | null
          id: string
          label_share_percent: number | null
          licensor_pool_percent: number | null
          notes: string | null
          notice_period_days: number | null
          status: Database["public"]["Enums"]["contract_status"]
          term_type: Database["public"]["Enums"]["contract_term_type"] | null
          term_value_years: number | null
          territory: string | null
          updated_at: string | null
        }
        Insert: {
          auto_renew_interval_years?: number | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          contract_type_custom?: string | null
          created_at?: string | null
          document_url?: string | null
          effective_at?: string | null
          executed_at?: string | null
          expires_at?: string | null
          id?: string
          label_share_percent?: number | null
          licensor_pool_percent?: number | null
          notes?: string | null
          notice_period_days?: number | null
          status: Database["public"]["Enums"]["contract_status"]
          term_type?: Database["public"]["Enums"]["contract_term_type"] | null
          term_value_years?: number | null
          territory?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_renew_interval_years?: number | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          contract_type_custom?: string | null
          created_at?: string | null
          document_url?: string | null
          effective_at?: string | null
          executed_at?: string | null
          expires_at?: string | null
          id?: string
          label_share_percent?: number | null
          licensor_pool_percent?: number | null
          notes?: string | null
          notice_period_days?: number | null
          status?: Database["public"]["Enums"]["contract_status"]
          term_type?: Database["public"]["Enums"]["contract_term_type"] | null
          term_value_years?: number | null
          territory?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      licensor_shares: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          notes: string | null
          role_context: Database["public"]["Enums"]["share_role_context"]
          role_context_custom: string | null
          share_percent: number
          track_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          role_context: Database["public"]["Enums"]["share_role_context"]
          role_context_custom?: string | null
          share_percent: number
          track_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          role_context?: Database["public"]["Enums"]["share_role_context"]
          role_context_custom?: string | null
          share_percent?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "licensor_shares_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licensor_shares_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licensor_shares_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_display_title"
            referencedColumns: ["id"]
          },
        ]
      }
      release_contributors: {
        Row: {
          artist_profile_id: string
          created_at: string | null
          id: string
          release_id: string
          role: Database["public"]["Enums"]["credit_role"]
          role_custom: string | null
        }
        Insert: {
          artist_profile_id: string
          created_at?: string | null
          id?: string
          release_id: string
          role: Database["public"]["Enums"]["credit_role"]
          role_custom?: string | null
        }
        Update: {
          artist_profile_id?: string
          created_at?: string | null
          id?: string
          release_id?: string
          role?: Database["public"]["Enums"]["credit_role"]
          role_custom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "release_contributors_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_contributors_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_search_index"
            referencedColumns: ["artist_profile_id"]
          },
          {
            foreignKeyName: "release_contributors_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_contributors_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases_with_display_title"
            referencedColumns: ["id"]
          },
        ]
      }
      release_main_artists: {
        Row: {
          artist_profile_id: string
          position: number
          release_id: string
        }
        Insert: {
          artist_profile_id: string
          position: number
          release_id: string
        }
        Update: {
          artist_profile_id?: string
          position?: number
          release_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_main_artists_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_main_artists_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_search_index"
            referencedColumns: ["artist_profile_id"]
          },
          {
            foreignKeyName: "release_main_artists_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_main_artists_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases_with_display_title"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          cover_art_url: string | null
          created_at: string | null
          id: string
          internal_catalog_id: string
          primary_genre: string | null
          release_date: string | null
          search_vector: unknown
          status: Database["public"]["Enums"]["release_status"]
          title: string
          type: Database["public"]["Enums"]["release_type"]
          upc: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          cover_art_url?: string | null
          created_at?: string | null
          id?: string
          internal_catalog_id: string
          primary_genre?: string | null
          release_date?: string | null
          search_vector?: unknown
          status: Database["public"]["Enums"]["release_status"]
          title: string
          type: Database["public"]["Enums"]["release_type"]
          upc?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          cover_art_url?: string | null
          created_at?: string | null
          id?: string
          internal_catalog_id?: string
          primary_genre?: string | null
          release_date?: string | null
          search_vector?: unknown
          status?: Database["public"]["Enums"]["release_status"]
          title?: string
          type?: Database["public"]["Enums"]["release_type"]
          upc?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      track_contributors: {
        Row: {
          artist_profile_id: string
          created_at: string | null
          id: string
          inherited_from_release: boolean | null
          role: Database["public"]["Enums"]["credit_role"]
          role_custom: string | null
          track_id: string
        }
        Insert: {
          artist_profile_id: string
          created_at?: string | null
          id?: string
          inherited_from_release?: boolean | null
          role: Database["public"]["Enums"]["credit_role"]
          role_custom?: string | null
          track_id: string
        }
        Update: {
          artist_profile_id?: string
          created_at?: string | null
          id?: string
          inherited_from_release?: boolean | null
          role?: Database["public"]["Enums"]["credit_role"]
          role_custom?: string | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_contributors_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_contributors_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_search_index"
            referencedColumns: ["artist_profile_id"]
          },
          {
            foreignKeyName: "track_contributors_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_contributors_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_display_title"
            referencedColumns: ["id"]
          },
        ]
      }
      track_main_artists: {
        Row: {
          artist_profile_id: string
          inherited_from_release: boolean | null
          position: number
          track_id: string
        }
        Insert: {
          artist_profile_id: string
          inherited_from_release?: boolean | null
          position: number
          track_id: string
        }
        Update: {
          artist_profile_id?: string
          inherited_from_release?: boolean | null
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_main_artists_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_main_artists_artist_profile_id_fkey"
            columns: ["artist_profile_id"]
            isOneToOne: false
            referencedRelation: "artist_search_index"
            referencedColumns: ["artist_profile_id"]
          },
          {
            foreignKeyName: "track_main_artists_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_main_artists_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_display_title"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          created_at: string | null
          display_title: string | null
          duration_ms: number | null
          explicit: boolean | null
          id: string
          isrc: string | null
          language: string | null
          master_file_url: string | null
          position: number
          release_id: string
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          display_title?: string | null
          duration_ms?: number | null
          explicit?: boolean | null
          id?: string
          isrc?: string | null
          language?: string | null
          master_file_url?: string | null
          position?: number
          release_id: string
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          display_title?: string | null
          duration_ms?: number | null
          explicit?: boolean | null
          id?: string
          isrc?: string | null
          language?: string | null
          master_file_url?: string | null
          position?: number
          release_id?: string
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases_with_display_title"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      artist_search_index: {
        Row: {
          artist_name: string | null
          artist_profile_id: string | null
          associated_legal_names: string | null
        }
        Relationships: []
      }
      licensor_shares_with_contacts: {
        Row: {
          contact_id: string | null
          created_at: string | null
          email: string | null
          full_legal_name: string | null
          id: string | null
          notes: string | null
          role_context: Database["public"]["Enums"]["share_role_context"] | null
          role_context_custom: string | null
          share_percent: number | null
          track_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licensor_shares_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licensor_shares_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licensor_shares_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_display_title"
            referencedColumns: ["id"]
          },
        ]
      }
      releases_with_display_title: {
        Row: {
          display_title: string | null
          id: string | null
          title: string | null
          version: string | null
        }
        Insert: {
          display_title?: never
          id?: string | null
          title?: string | null
          version?: string | null
        }
        Update: {
          display_title?: never
          id?: string | null
          title?: string | null
          version?: string | null
        }
        Relationships: []
      }
      tracks_with_display_title: {
        Row: {
          display_title: string | null
          id: string | null
          release_id: string | null
          title: string | null
          version: string | null
        }
        Insert: {
          display_title?: never
          id?: string | null
          release_id?: string | null
          title?: string | null
          version?: string | null
        }
        Update: {
          display_title?: never
          id?: string | null
          release_id?: string | null
          title?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases_with_display_title"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_release_full:
        | {
            Args: {
              p_artist_ids: string[]
              p_release_date: string
              p_title: string
              p_type: Database["public"]["Enums"]["release_type"]
            }
            Returns: {
              catalog_id: string
              release_id: string
            }[]
          }
        | {
            Args: {
              p_artist_ids?: string[]
              p_contributors?: Json
              p_release_date: string
              p_title: string
              p_type: Database["public"]["Enums"]["release_type"]
            }
            Returns: {
              catalog_id: string
              release_id: string
            }[]
          }
      generate_catalog_number: {
        Args: { p_base_catalog_id?: string; p_release_date?: string }
        Returns: string
      }
      search_releases: {
        Args: { query_text: string }
        Returns: {
          release_id: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      validate_release_shares: {
        Args: { p_release_id: string }
        Returns: {
          all_valid: boolean
          invalid_tracks: Json
        }[]
      }
      validate_track_shares: {
        Args: { p_track_id: string }
        Returns: {
          final_ntc_sum: number
          has_flat_fees: boolean
          is_valid: boolean
          licensor_pool_percent: number
          pool_sum: number
        }[]
      }
    }
    Enums: {
      audit_action: "INSERT" | "UPDATE" | "DELETE"
      contract_status: "draft" | "sent" | "executed" | "archived"
      contract_term_type:
        | "fixed"
        | "perpetual"
        | "auto_renew"
        | "evergreen_with_notice"
      contract_type: "MLA" | "Release Schedule" | "Remix Agreement" | "Other"
      credit_role:
        | "Producer"
        | "Composer"
        | "Remixer"
        | "Featured Artist"
        | "Manager"
        | "Engineer (Mix)"
        | "Engineer (Master)"
        | "Engineer (Mix & Master)"
        | "Other"
      release_status:
        | "planning"
        | "signed"
        | "in_progress"
        | "delivered"
        | "released"
        | "archived"
        | "ready_for_delivery"
      release_type: "Single" | "EP" | "Album"
      share_role_context:
        | "Main Artist"
        | "Producer"
        | "Composer"
        | "Manager"
        | "Other"
        | "Featured Artist"
        | "Sample Clearance"
        | "Remix Rights"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      audit_action: ["INSERT", "UPDATE", "DELETE"],
      contract_status: ["draft", "sent", "executed", "archived"],
      contract_term_type: [
        "fixed",
        "perpetual",
        "auto_renew",
        "evergreen_with_notice",
      ],
      contract_type: ["MLA", "Release Schedule", "Remix Agreement", "Other"],
      credit_role: [
        "Producer",
        "Composer",
        "Remixer",
        "Featured Artist",
        "Manager",
        "Engineer (Mix)",
        "Engineer (Master)",
        "Engineer (Mix & Master)",
        "Other",
      ],
      release_status: [
        "planning",
        "signed",
        "in_progress",
        "delivered",
        "released",
        "archived",
        "ready_for_delivery",
      ],
      release_type: ["Single", "EP", "Album"],
      share_role_context: [
        "Main Artist",
        "Producer",
        "Composer",
        "Manager",
        "Other",
        "Featured Artist",
        "Sample Clearance",
        "Remix Rights",
      ],
    },
  },
} as const
