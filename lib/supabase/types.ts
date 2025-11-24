import { Database as DatabaseGenerated } from "./database.types";

export type Database = DatabaseGenerated;

export type ReleaseStatus = Database["public"]["Enums"]["release_status"];
export type ReleaseType = Database["public"]["Enums"]["release_type"];
export type ContractType = Database["public"]["Enums"]["contract_type"];
export type ContractStatus = Database["public"]["Enums"]["contract_status"];
export type ContractTermType =
  Database["public"]["Enums"]["contract_term_type"];
export type CreditRole = Database["public"]["Enums"]["credit_role"];
export type ShareRoleContext =
  Database["public"]["Enums"]["share_role_context"];

export type Json =
  Database["public"]["Tables"]["releases"]["Row"]["search_vector"]; // Fallback or generic Json

// Helper types for rows
export type ReleaseRow = Database["public"]["Tables"]["releases"]["Row"];
export type TrackRow = Database["public"]["Tables"]["tracks"]["Row"];
export type ArtistProfileRow =
  Database["public"]["Tables"]["artist_profiles"]["Row"];
export type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
export type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];
export type LicensorShareRow =
  Database["public"]["Tables"]["licensor_shares"]["Row"];
export type ReleaseContributorRow =
  Database["public"]["Tables"]["release_contributors"]["Row"];
export type TrackContributorRow =
  Database["public"]["Tables"]["track_contributors"]["Row"];
export type ReleaseMainArtistRow =
  Database["public"]["Tables"]["release_main_artists"]["Row"];
export type TrackMainArtistRow =
  Database["public"]["Tables"]["track_main_artists"]["Row"];
export type ContractReleaseRow =
  Database["public"]["Tables"]["contract_releases"]["Row"];
export type ContractSignatoryRow =
  Database["public"]["Tables"]["contract_signatories"]["Row"];
