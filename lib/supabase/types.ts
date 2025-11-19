export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ReleaseType = 'Single' | 'EP' | 'Album'
export type ReleaseStatus = 'planning' | 'signed' | 'in_progress' | 'delivered' | 'released' | 'archived'
export type ContractType = 'MLA' | 'Release Schedule' | 'Remix Agreement' | 'Other'
export type ContractStatus = 'draft' | 'sent' | 'executed' | 'archived'
export type ContractTermType = 'fixed' | 'perpetual' | 'auto_renew' | 'evergreen_with_notice'
export type CreditRole = 'Producer' | 'Composer' | 'Remixer' | 'Featured Artist' | 'Mixer' | 'Engineer' | 'Other'
export type ShareRoleContext = 'Master Owner' | 'Producer' | 'Songwriter' | 'Featured Artist' | 'Sample Clearance' | 'Remix Rights' | 'Other'

export interface Database {
  public: {
    Tables: {
      releases: {
        Row: {
          id: string
          title: string
          version: string | null
          type: ReleaseType
          internal_catalog_id: string
          upc: string | null
          release_date: string | null
          primary_genre: string | null
          cover_art_url: string | null
          status: ReleaseStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          version?: string | null
          type: ReleaseType
          internal_catalog_id: string
          upc?: string | null
          release_date?: string | null
          primary_genre?: string | null
          cover_art_url?: string | null
          status?: ReleaseStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          version?: string | null
          type?: ReleaseType
          internal_catalog_id?: string
          upc?: string | null
          release_date?: string | null
          primary_genre?: string | null
          cover_art_url?: string | null
          status?: ReleaseStatus
          created_at?: string
          updated_at?: string
        }
      }
      tracks: {
        Row: {
          id: string
          release_id: string
          title: string
          version: string | null
          isrc: string | null
          duration_ms: number | null
          explicit: boolean
          language: string | null
          master_file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          release_id: string
          title: string
          version?: string | null
          isrc?: string | null
          duration_ms?: number | null
          explicit?: boolean
          language?: string | null
          master_file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          release_id?: string
          title?: string
          version?: string | null
          isrc?: string | null
          duration_ms?: number | null
          explicit?: boolean
          language?: string | null
          master_file_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      artist_profiles: {
        Row: {
          id: string
          artist_name: string
          spotify_id: string | null
          apple_music_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_name: string
          spotify_id?: string | null
          apple_music_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_name?: string
          spotify_id?: string | null
          apple_music_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          legal_name: string
          email: string | null
          phone: string | null
          address: string | null
          tax_id: string | null
          payment_info: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          legal_name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          tax_id?: string | null
          payment_info?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          legal_name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          tax_id?: string | null
          payment_info?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          contract_type: ContractType
          contract_type_custom: string | null
          status: ContractStatus
          document_url: string | null
          executed_at: string | null
          notes: string | null
          label_share_percent: number
          licensor_pool_percent: number
          term_type: ContractTermType | null
          term_value_years: number | null
          auto_renew_interval_years: number | null
          notice_period_days: number | null
          effective_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_type: ContractType
          contract_type_custom?: string | null
          status?: ContractStatus
          document_url?: string | null
          executed_at?: string | null
          notes?: string | null
          label_share_percent?: number
          licensor_pool_percent?: number
          term_type?: ContractTermType | null
          term_value_years?: number | null
          auto_renew_interval_years?: number | null
          notice_period_days?: number | null
          effective_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_type?: ContractType
          contract_type_custom?: string | null
          status?: ContractStatus
          document_url?: string | null
          executed_at?: string | null
          notes?: string | null
          label_share_percent?: number
          licensor_pool_percent?: number
          term_type?: ContractTermType | null
          term_value_years?: number | null
          auto_renew_interval_years?: number | null
          notice_period_days?: number | null
          effective_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      release_main_artists: {
        Row: {
          release_id: string
          artist_profile_id: string
          position: number
        }
        Insert: {
          release_id: string
          artist_profile_id: string
          position: number
        }
        Update: {
          release_id?: string
          artist_profile_id?: string
          position?: number
        }
      }
      licensor_shares: {
        Row: {
          id: string
          track_id: string
          contact_id: string
          share_percent: number
          role_context: ShareRoleContext
          role_context_custom: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          track_id: string
          contact_id: string
          share_percent: number
          role_context: ShareRoleContext
          role_context_custom?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          track_id?: string
          contact_id?: string
          share_percent?: number
          role_context?: ShareRoleContext
          role_context_custom?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      contract_releases: {
        Row: {
          contract_id: string
          release_id: string
          created_at: string
        }
        Insert: {
          contract_id: string
          release_id: string
          created_at?: string
        }
        Update: {
          contract_id?: string
          release_id?: string
          created_at?: string
        }
      }
      contract_signatories: {
        Row: {
          contract_id: string
          contact_id: string
          created_at: string
        }
        Insert: {
          contract_id: string
          contact_id: string
          created_at?: string
        }
        Update: {
          contract_id?: string
          contact_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_catalog_number: {
        Args: {
          p_release_date?: string | null
          p_base_catalog_id?: string | null
        }
        Returns: string
      }
      validate_track_shares: {
        Args: {
          p_track_id: string
        }
        Returns: {
          is_valid: boolean
          pool_sum: number
          final_ntc_sum: number
          licensor_pool_percent: number
          has_flat_fees: boolean
        }[]
      }
      validate_release_shares: {
        Args: {
          p_release_id: string
        }
        Returns: {
          all_valid: boolean
          invalid_tracks: Json
        }[]
      }
    }
    Enums: {
      release_type: ReleaseType
      release_status: ReleaseStatus
      contract_type: ContractType
      contract_status: ContractStatus
      contract_term_type: ContractTermType
      credit_role: CreditRole
      share_role_context: ShareRoleContext
    }
  }
}
