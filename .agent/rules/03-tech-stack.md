---
trigger: always_on
---

# Technical Architecture

## Core Stack
* **Framework:** Next.js 16 (App Router).
* **Language:** TypeScript (Strict Mode).
* **Database:** Supabase (PostgreSQL 15+) with Row Level Security (RLS).
* **Styling:** Tailwind CSS v4.

## Key Implementation Patterns
1.  **Server Components:** Default to Server Components for data fetching. Use `createClient` from `@/lib/supabase/server`.
2.  **Server Actions:** Use Server Actions (in `@/lib/actions/`) for all data mutations. Do NOT create Next.js API routes (`app/api/`) unless absolutely necessary.
3.  **RPC Functions:** For complex searches or validations, use Supabase RPC functions (e.g., `search_releases`, `validate_track_shares`) instead of complex client-side filtering.
4.  **Autosave:** Use the custom `useAutosave` hook for form editing to prevent data loss.

## File Structure
* `app/(dashboard)/`: Protected routes containing the shared Sidebar layout.
* `components/ui/`: Reusable, atomic components styled with Nord variables.