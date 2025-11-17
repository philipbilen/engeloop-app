# Releases Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a searchable, sortable releases dashboard at `/releases` with comprehensive search, status filtering, and navigation to detail pages.

**Architecture:** Server Component at `app/(dashboard)/releases/page.tsx` fetches data using Supabase with RPC-based search. Client components handle interactive UI (search input, filters, sortable table headers). Shared DashboardLayout provides sidebar navigation.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase (PostgreSQL + RPC), Tailwind CSS, use-debounce

---

## Task 1: Install Dependencies

**Files:**
- Modify: `engeloop-app/package.json`

**Step 1: Install use-debounce package**

Run:
```bash
cd engeloop-app && npm install use-debounce
```

Expected: Package added to dependencies

**Step 2: Verify installation**

Run:
```bash
grep "use-debounce" engeloop-app/package.json
```

Expected: Shows `"use-debounce": "^10.0.0"` or similar

**Step 3: Commit**

```bash
git add engeloop-app/package.json engeloop-app/package-lock.json
git commit -m "chore: install use-debounce for search functionality"
```

---

## Task 2: Create Database Search Function

**Files:**
- Create: `engeloop-db/supabase/migrations/YYYYMMDDHHMMSS_create_search_releases_function.sql`

**Step 1: Create migration file**

Create file with timestamp:
```bash
cd engeloop-db/supabase/migrations
touch $(date +%Y%m%d%H%M%S)_create_search_releases_function.sql
```

**Step 2: Write the search_releases RPC function**

```sql
-- Create comprehensive search function for releases
CREATE OR REPLACE FUNCTION search_releases(query_text TEXT)
RETURNS TABLE (release_id UUID)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Return all release IDs if no search query
  IF query_text IS NULL OR query_text = '' THEN
    RETURN QUERY
    SELECT r.id FROM releases r;
  ELSE
    -- Search across releases, main artists, and contributors
    RETURN QUERY
    SELECT DISTINCT r.id
    FROM releases r
    LEFT JOIN release_main_artists rma ON r.id = rma.release_id
    LEFT JOIN artist_profiles ap_main ON rma.artist_profile_id = ap_main.id
    LEFT JOIN release_contributors rc ON r.id = rc.release_id
    LEFT JOIN artist_profiles ap_contrib ON rc.artist_profile_id = ap_contrib.id
    WHERE
      r.title ILIKE '%' || query_text || '%' OR
      COALESCE(r.version, '') ILIKE '%' || query_text || '%' OR
      COALESCE(r.internal_catalog_id, '') ILIKE '%' || query_text || '%' OR
      COALESCE(ap_main.stage_name, '') ILIKE '%' || query_text || '%' OR
      COALESCE(ap_main.full_legal_name, '') ILIKE '%' || query_text || '%' OR
      COALESCE(ap_contrib.stage_name, '') ILIKE '%' || query_text || '%' OR
      COALESCE(ap_contrib.full_legal_name, '') ILIKE '%' || query_text || '%';
  END IF;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION search_releases(TEXT) IS
'Searches releases by title, version, catalog number, and associated artist names (both main artists and contributors)';
```

**Step 3: Apply migration**

Run:
```bash
cd engeloop-db
npx supabase db reset
```

Expected: Migration applied successfully

**Step 4: Test the function manually**

Run in Supabase SQL editor or psql:
```sql
SELECT * FROM search_releases('Naarly');
```

Expected: Returns release IDs for releases featuring Naarly

**Step 5: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add search_releases RPC function

- Searches across title, version, catalog number
- Includes main artists and contributors
- Case-insensitive partial matching"
```

---

## Task 3: Create Status Badge Component

**Files:**
- Create: `engeloop-app/components/ui/badge.tsx`

**Step 1: Write the Badge component**

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

export type ReleaseStatus =
  | "planning"
  | "signed"
  | "in_progress"
  | "ready_for_delivery"
  | "delivered"
  | "released"
  | "archived"

interface StatusBadgeProps {
  status: ReleaseStatus
  className?: string
}

const statusConfig: Record<ReleaseStatus, { label: string; className: string }> = {
  planning: {
    label: "DRAFT",
    className: "bg-gray-600/20 text-gray-400 border-gray-600",
  },
  signed: {
    label: "SIGNED",
    className: "bg-blue-600/20 text-blue-400 border-blue-600",
  },
  in_progress: {
    label: "IN PROGRESS",
    className: "bg-yellow-600/20 text-yellow-400 border-yellow-600",
  },
  ready_for_delivery: {
    label: "READY FOR DELIVERY",
    className: "bg-teal-600/20 text-teal-400 border-teal-600",
  },
  delivered: {
    label: "DELIVERED",
    className: "bg-purple-600/20 text-purple-400 border-purple-600",
  },
  released: {
    label: "RELEASED",
    className: "bg-green-600/20 text-green-400 border-green-600",
  },
  archived: {
    label: "ARCHIVED",
    className: "bg-gray-700/20 text-gray-500 border-gray-700",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide border-2 rounded",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
```

**Step 2: Export from index if needed**

If `components/ui/index.ts` exists, add:
```typescript
export * from "./badge"
```

**Step 3: Commit**

```bash
git add engeloop-app/components/ui/badge.tsx
git commit -m "feat(ui): add StatusBadge component

- Supports all 7 release statuses
- Color-coded per workflow stage
- Maps planning to DRAFT label"
```

---

## Task 4: Create DashboardLayout Component

**Files:**
- Create: `engeloop-app/components/layout/dashboard-layout.tsx`

**Step 1: Write the DashboardLayout component**

```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarLinkProps {
  href: string
  icon: string
  label: string
}

function SidebarLink({ href, icon, label }: SidebarLinkProps) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded transition-colors",
        isActive
          ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-l-4 border-[var(--accent-primary)]"
          : "text-[var(--text-dim)] hover:bg-[var(--bg-interactive)] hover:text-[var(--text-bright)]"
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium uppercase text-sm tracking-wide">{label}</span>
    </Link>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg-deep-dark)" }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex flex-col border-r-2"
        style={{
          backgroundColor: "var(--bg-main)",
          borderColor: "var(--border-primary)",
        }}
      >
        {/* Header */}
        <div
          className="p-6 border-b-2"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <h1
            className="text-xl font-bold uppercase tracking-wide"
            style={{ color: "var(--text-bright)" }}
          >
            ENGELOOP
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-dimmer)" }}>
            Catalog Manager
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <SidebarLink href="/releases" icon="📀" label="Releases" />
          <SidebarLink href="/people" icon="👥" label="People & Artists" />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add engeloop-app/components/layout/dashboard-layout.tsx
git commit -m "feat(layout): add DashboardLayout with sidebar navigation

- Fixed 240px sidebar with branding
- Active route highlighting
- Links to Releases and People sections"
```

---

## Task 5: Create Dashboard Route Group Layout

**Files:**
- Create: `engeloop-app/app/(dashboard)/layout.tsx`

**Step 1: Create (dashboard) directory**

```bash
mkdir -p engeloop-app/app/\(dashboard\)
```

**Step 2: Write the layout component**

```typescript
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
```

**Step 3: Commit**

```bash
git add engeloop-app/app/\(dashboard\)/layout.tsx
git commit -m "feat(app): add dashboard route group layout

- Wraps all /releases and future /people routes
- Provides consistent sidebar navigation"
```

---

## Task 6: Move Releases Routes to Dashboard Group

**Files:**
- Move: `engeloop-app/app/releases/` → `engeloop-app/app/(dashboard)/releases/`

**Step 1: Move the releases directory**

```bash
mv engeloop-app/app/releases engeloop-app/app/\(dashboard\)/releases
```

**Step 2: Test that existing release pages still work**

Run:
```bash
cd engeloop-app && npm run dev
```

Visit: `http://localhost:3000/releases/new` and verify it works

**Step 3: Commit**

```bash
git add engeloop-app/app/\(dashboard\)/releases
git rm -r engeloop-app/app/releases
git commit -m "refactor(app): move releases routes into dashboard group

- Enables shared sidebar layout
- No URL changes (route groups don't affect paths)"
```

---

## Task 7: Create Artist Display Line Utility

**Files:**
- Create: `engeloop-app/lib/utils/format-artists.ts`

**Step 1: Write the utility function**

```typescript
/**
 * Formats an array of artist names into a display line following DSP conventions
 * Examples:
 * - 1 artist: "Naarly"
 * - 2 artists: "Naarly & OOVA"
 * - 3+ artists: "Naarly, OOVA & Dawda"
 *
 * @param artists - Array of artist stage names, ordered by position
 * @param maxArtists - Maximum artists to show (default: 4, DSP standard)
 * @returns Formatted artist display string
 */
export function formatArtistDisplayLine(
  artists: Array<{ stage_name: string }>,
  maxArtists: number = 4
): string {
  if (!artists || artists.length === 0) {
    return "—"
  }

  // Take only up to maxArtists
  const displayArtists = artists.slice(0, maxArtists)
  const names = displayArtists.map(a => a.stage_name)

  if (names.length === 1) {
    return names[0]
  }

  if (names.length === 2) {
    return `${names[0]} & ${names[1]}`
  }

  // 3+ artists: "Artist1, Artist2 & Artist3"
  const allButLast = names.slice(0, -1).join(", ")
  const last = names[names.length - 1]
  return `${allButLast} & ${last}`
}
```

**Step 2: Add test file (optional but recommended)**

Create: `engeloop-app/lib/utils/format-artists.test.ts`

```typescript
import { formatArtistDisplayLine } from "./format-artists"

describe("formatArtistDisplayLine", () => {
  it("returns — for empty array", () => {
    expect(formatArtistDisplayLine([])).toBe("—")
  })

  it("formats single artist", () => {
    expect(formatArtistDisplayLine([{ stage_name: "Naarly" }])).toBe("Naarly")
  })

  it("formats two artists with &", () => {
    expect(
      formatArtistDisplayLine([
        { stage_name: "Naarly" },
        { stage_name: "OOVA" },
      ])
    ).toBe("Naarly & OOVA")
  })

  it("formats three artists with comma and &", () => {
    expect(
      formatArtistDisplayLine([
        { stage_name: "Naarly" },
        { stage_name: "OOVA" },
        { stage_name: "Dawda" },
      ])
    ).toBe("Naarly, OOVA & Dawda")
  })

  it("respects maxArtists limit", () => {
    expect(
      formatArtistDisplayLine(
        [
          { stage_name: "A" },
          { stage_name: "B" },
          { stage_name: "C" },
          { stage_name: "D" },
          { stage_name: "E" },
        ],
        3
      )
    ).toBe("A, B & C")
  })
})
```

**Step 3: Commit**

```bash
git add engeloop-app/lib/utils/format-artists.ts
git commit -m "feat(utils): add formatArtistDisplayLine utility

- Formats 1-4 artists per DSP convention
- Handles comma and ampersand placement
- Returns — for no artists"
```

---

## Task 8: Create Search Bar Component

**Files:**
- Create: `engeloop-app/app/(dashboard)/releases/_components/search-bar.tsx`

**Step 1: Create _components directory**

```bash
mkdir -p engeloop-app/app/\(dashboard\)/releases/_components
```

**Step 2: Write SearchBar component**

```typescript
"use client"

import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get("q") || ""

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (term) {
      params.set("q", term)
    } else {
      params.delete("q")
    }

    // Preserve other params (status, sort)
    router.replace(`/releases?${params.toString()}`)
  }, 300)

  return (
    <div>
      <Input
        type="search"
        placeholder="Search by title, artist, catalog number..."
        defaultValue={currentQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full"
        style={{
          backgroundColor: "var(--bg-main)",
          borderColor: "var(--border-primary)",
          color: "var(--text-bright)",
        }}
      />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add engeloop-app/app/\(dashboard\)/releases/_components/search-bar.tsx
git commit -m "feat(releases): add SearchBar component

- 300ms debounced search input
- Updates URL search params
- Preserves existing filters"
```

---

## Task 9: Create Status Filters Component

**Files:**
- Create: `engeloop-app/app/(dashboard)/releases/_components/status-filters.tsx`

**Step 1: Write StatusFilters component**

```typescript
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import type { ReleaseStatus } from "@/components/ui/badge"

const statusOptions: Array<{ value: "all" | ReleaseStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "planning", label: "Planning" },
  { value: "signed", label: "Signed" },
  { value: "in_progress", label: "In Progress" },
  { value: "ready_for_delivery", label: "Ready for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "released", label: "Released" },
  { value: "archived", label: "Archived" },
]

export function StatusFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get("status") || "all"

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (status === "all") {
      params.delete("status")
    } else {
      params.set("status", status)
    }

    router.replace(`/releases?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {statusOptions.map((option) => {
        const isActive = currentStatus === option.value

        return (
          <button
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium uppercase tracking-wide rounded transition-colors border-2",
              isActive
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                : "border-[var(--border-primary)] text-[var(--text-dim)] hover:border-[var(--accent-primary)]/50 hover:text-[var(--text-bright)]"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add engeloop-app/app/\(dashboard\)/releases/_components/status-filters.tsx
git commit -m "feat(releases): add StatusFilters component

- Filter chips for all release statuses
- Updates URL search params
- Visual active state"
```

---

## Task 10: Create Sortable Table Header Component

**Files:**
- Create: `engeloop-app/app/(dashboard)/releases/_components/sortable-header.tsx`

**Step 1: Write SortableHeader component**

```typescript
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

export type SortColumn = "release_date" | "title" | "status"
export type SortDirection = "asc" | "desc"
export type SortOption = `${SortColumn}_${SortDirection}`

interface SortableHeaderProps {
  column: SortColumn
  label: string
  className?: string
}

export function SortableHeader({ column, label, className }: SortableHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = (searchParams.get("sort") || "release_date_desc") as SortOption

  // Parse current sort
  const [activeColumn, direction] = currentSort.split("_") as [SortColumn, SortDirection]
  const isActive = activeColumn === column
  const isAsc = direction === "asc"

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString())

    let newSort: SortOption
    if (isActive) {
      // Toggle direction
      newSort = `${column}_${isAsc ? "desc" : "asc"}`
    } else {
      // First click: dates desc, text asc
      newSort = column === "release_date" ? `${column}_desc` : `${column}_asc`
    }

    params.set("sort", newSort)
    router.replace(`/releases?${params.toString()}`)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "font-semibold uppercase tracking-wide text-xs transition-colors hover:text-[var(--accent-primary)] text-left",
        isActive ? "text-[var(--text-bright)]" : "text-[var(--text-dimmer)]",
        className
      )}
    >
      {label}
      {isActive && (
        <span className="ml-1 text-[var(--accent-primary)]">
          {isAsc ? "↑" : "↓"}
        </span>
      )}
    </button>
  )
}
```

**Step 2: Commit**

```bash
git add engeloop-app/app/\(dashboard\)/releases/_components/sortable-header.tsx
git commit -m "feat(releases): add SortableHeader component

- Toggle sort direction on click
- Smart defaults (dates desc, text asc)
- Visual active indicator with arrow"
```

---

## Task 11: Create Releases Table Component

**Files:**
- Create: `engeloop-app/app/(dashboard)/releases/_components/releases-table.tsx`

**Step 1: Write ReleasesTable component**

```typescript
"use client"

import Link from "next/link"
import { StatusBadge } from "@/components/ui/badge"
import { SortableHeader } from "./sortable-header"
import type { ReleaseStatus } from "@/components/ui/badge"

interface Artist {
  stage_name: string
}

interface ReleaseRow {
  id: string
  title: string
  version: string | null
  release_date: string | null
  type: string
  upc: string | null
  status: ReleaseStatus
  artist_display: string
}

interface ReleasesTableProps {
  releases: ReleaseRow[]
}

function formatReleaseDate(dateString: string | null) {
  if (!dateString) return { line1: "—", line2: "" }

  const date = new Date(dateString)
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
  const day = date.getDate().toString().padStart(2, "0")
  const year = date.getFullYear()

  return {
    line1: `${month} ${day}`,
    line2: year.toString(),
  }
}

export function ReleasesTable({ releases }: ReleasesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead
          className="border-b-2"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <tr>
            <th className="px-4 py-3 text-left w-32">
              <SortableHeader column="release_date" label="Release Date" />
            </th>
            <th className="px-4 py-3 text-left">
              <SortableHeader column="title" label="Title / Artist" />
            </th>
            <th className="px-4 py-3 text-left w-24">
              <span className="font-semibold uppercase tracking-wide text-xs text-[var(--text-dimmer)]">
                Type
              </span>
            </th>
            <th className="px-4 py-3 text-left w-40">
              <span className="font-semibold uppercase tracking-wide text-xs text-[var(--text-dimmer)]">
                UPC
              </span>
            </th>
            <th className="px-4 py-3 text-left w-44">
              <SortableHeader column="status" label="Status" />
            </th>
          </tr>
        </thead>
        <tbody>
          {releases.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-12 text-center text-[var(--text-dimmer)]"
              >
                No releases found
              </td>
            </tr>
          ) : (
            releases.map((release) => {
              const date = formatReleaseDate(release.release_date)

              return (
                <tr
                  key={release.id}
                  className="border-b transition-colors hover:bg-[var(--bg-interactive)] cursor-pointer"
                  style={{ borderColor: "var(--border-primary)" }}
                  onClick={() => window.location.href = `/releases/${release.id}/edit`}
                >
                  {/* Release Date - Stacked */}
                  <td className="px-4 py-4">
                    <div className="text-[var(--text-bright)] font-medium text-sm">
                      {date.line1}
                    </div>
                    {date.line2 && (
                      <div className="text-[var(--text-dimmer)] text-xs">
                        {date.line2}
                      </div>
                    )}
                  </td>

                  {/* Title / Artist - Stacked */}
                  <td className="px-4 py-4">
                    <div className="text-[var(--text-bright)] font-semibold">
                      {release.title}
                      {release.version && (
                        <span className="text-[var(--text-dim)] font-normal">
                          {" "}({release.version})
                        </span>
                      )}
                    </div>
                    <div className="text-[var(--text-dim)] text-sm mt-1">
                      {release.artist_display}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-4 text-[var(--text-dim)] text-sm">
                    {release.type}
                  </td>

                  {/* UPC */}
                  <td className="px-4 py-4 text-[var(--text-dim)] text-sm font-mono">
                    {release.upc || "—"}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <StatusBadge status={release.status} />
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add engeloop-app/app/\(dashboard\)/releases/_components/releases-table.tsx
git commit -m "feat(releases): add ReleasesTable component

- Sortable date, title, status columns
- Stacked date and title/artist formatting
- Clickable rows navigate to edit page
- Empty state handling"
```

---

## Task 12: Create Main Releases Page

**Files:**
- Create: `engeloop-app/app/(dashboard)/releases/page.tsx`

**Step 1: Write the page component**

```typescript
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SearchBar } from "./_components/search-bar"
import { StatusFilters } from "./_components/status-filters"
import { ReleasesTable } from "./_components/releases-table"
import { formatArtistDisplayLine } from "@/lib/utils/format-artists"
import type { ReleaseStatus } from "@/components/ui/badge"
import type { SortOption } from "./_components/sortable-header"

interface PageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    sort?: string
  }>
}

export default async function ReleasesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = createServerClient()

  // Start building query
  let query = supabase
    .from("releases")
    .select(`
      id,
      title,
      version,
      release_date,
      type,
      upc,
      status,
      internal_catalog_id,
      release_main_artists(
        position,
        artist_profile:artist_profiles(stage_name)
      )
    `)

  // Apply search filter via RPC
  if (params.q) {
    const { data: matchingIds } = await supabase.rpc("search_releases", {
      query_text: params.q,
    })

    if (matchingIds && matchingIds.length > 0) {
      const ids = matchingIds.map((r) => r.release_id)
      query = query.in("id", ids)
    } else {
      // No matches - return empty result
      query = query.eq("id", "00000000-0000-0000-0000-000000000000") // Non-existent ID
    }
  }

  // Apply status filter
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  // Apply sorting
  const sortBy = (params.sort || "release_date_desc") as SortOption
  const [column, direction] = sortBy.split("_") as [string, "asc" | "desc"]

  switch (column) {
    case "release_date":
      query = query.order("release_date", {
        ascending: direction === "asc",
        nullsLast: true,
      })
      break
    case "title":
      query = query.order("title", { ascending: direction === "asc" })
      break
    case "status":
      query = query.order("status", { ascending: direction === "asc" })
      break
  }

  const { data: releases } = await query

  // Transform data for table
  const tableData =
    releases?.map((release) => {
      // Extract and sort artists by position
      const artists =
        release.release_main_artists
          ?.sort((a, b) => a.position - b.position)
          .map((link) => link.artist_profile)
          .filter(Boolean) || []

      return {
        id: release.id,
        title: release.title,
        version: release.version,
        release_date: release.release_date,
        type: release.type,
        upc: release.upc,
        status: release.status as ReleaseStatus,
        artist_display: formatArtistDisplayLine(artists),
      }
    }) || []

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-deep-dark)" }}>
      {/* Header */}
      <div
        className="border-b-2 p-8"
        style={{
          backgroundColor: "var(--bg-main)",
          borderColor: "var(--border-primary)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-bright)" }}
            >
              RELEASES
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
              {tableData.length} total release{tableData.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button asChild>
            <Link href="/releases/new">+ NEW RELEASE</Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <SearchBar />
          <StatusFilters />
        </div>
      </div>

      {/* Table */}
      <div className="p-8">
        <ReleasesTable releases={tableData} />
      </div>
    </div>
  )
}
```

**Step 2: Test the page**

Run:
```bash
cd engeloop-app && npm run dev
```

Visit: `http://localhost:3000/releases`

Expected: Releases dashboard loads with sidebar, search, filters, and table

**Step 3: Commit**

```bash
git add engeloop-app/app/\(dashboard\)/releases/page.tsx
git commit -m "feat(releases): add main releases dashboard page

- Server-side data fetching with Supabase
- RPC-based search integration
- Status filtering and sorting
- Artist display line formatting"
```

---

## Task 13: Update Home Page Redirect

**Files:**
- Modify: `engeloop-app/app/page.tsx`

**Step 1: Replace home page with redirect**

```typescript
import { redirect } from "next/navigation"

export default function HomePage() {
  redirect("/releases")
}
```

**Step 2: Test redirect**

Visit: `http://localhost:3000/`

Expected: Redirects to `/releases`

**Step 3: Commit**

```bash
git add engeloop-app/app/page.tsx
git commit -m "feat(app): redirect home page to releases dashboard"
```

---

## Task 14: Add Database Indexes (Performance)

**Files:**
- Create: `engeloop-db/supabase/migrations/YYYYMMDDHHMMSS_add_search_indexes.sql`

**Step 1: Create migration file**

```bash
cd engeloop-db/supabase/migrations
touch $(date +%Y%m%d%H%M%S)_add_search_indexes.sql
```

**Step 2: Add indexes for search performance**

```sql
-- Add indexes to improve search_releases performance

-- Index for release_main_artists lookups
CREATE INDEX IF NOT EXISTS idx_release_main_artists_release_id
ON release_main_artists(release_id);

CREATE INDEX IF NOT EXISTS idx_release_main_artists_artist_profile_id
ON release_main_artists(artist_profile_id);

-- Index for release_contributors lookups
CREATE INDEX IF NOT EXISTS idx_release_contributors_release_id
ON release_contributors(release_id);

CREATE INDEX IF NOT EXISTS idx_release_contributors_artist_profile_id
ON release_contributors(artist_profile_id);

-- Index for artist_profiles text search
CREATE INDEX IF NOT EXISTS idx_artist_profiles_stage_name_trgm
ON artist_profiles USING gin (stage_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_artist_profiles_legal_name_trgm
ON artist_profiles USING gin (full_legal_name gin_trgm_ops);

-- Index for releases text search
CREATE INDEX IF NOT EXISTS idx_releases_title_trgm
ON releases USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_releases_catalog_id
ON releases(internal_catalog_id);

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add comments
COMMENT ON INDEX idx_release_main_artists_release_id IS 'Improve release artist joins';
COMMENT ON INDEX idx_release_contributors_release_id IS 'Improve release contributor joins';
COMMENT ON INDEX idx_artist_profiles_stage_name_trgm IS 'Enable fast ILIKE search on artist names';
```

**Step 3: Apply migration**

```bash
cd engeloop-db
npx supabase db reset
```

**Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "perf(db): add indexes for search performance

- Add trigram indexes for ILIKE queries
- Index foreign key relationships
- Enable pg_trgm extension"
```

---

## Task 15: Manual Testing & Verification

**Files:**
- None (testing only)

**Step 1: Test search functionality**

1. Navigate to `/releases`
2. Type "Naarly" in search box
3. Verify results filter correctly after 300ms
4. Clear search and verify all releases return

**Step 2: Test status filters**

1. Click "Planning" filter
2. Verify only planning/draft releases show
3. Click "All" to reset
4. Verify all releases return

**Step 3: Test sorting**

1. Click "Release Date" header
2. Verify sort toggles asc/desc with arrow indicator
3. Click "Title" header
4. Verify alphabetical sort
5. Click "Status" header
6. Verify status-based grouping

**Step 4: Test navigation**

1. Click any release row
2. Verify navigates to `/releases/[id]/edit`
3. Use browser back button
4. Verify returns to releases list with filters preserved

**Step 5: Test sidebar navigation**

1. Verify "Releases" link is highlighted
2. Verify sidebar appears on all pages
3. Click release detail → verify sidebar persists

**Step 6: Document any issues**

Create issues in tracker for any bugs found

---

## Task 16: Update Session Notes

**Files:**
- Modify: `engeloop-app/docs/session-notes.md`

**Step 1: Add Phase 5 section**

Append to the end of session-notes.md:

```markdown

#### Phase 5: Releases Dashboard

This phase implemented the main releases list view, providing a searchable, sortable, filterable dashboard as the primary entry point for the catalog management system.

*   **Dashboard Layout:** Created a shared `DashboardLayout` component with a fixed sidebar containing branding and navigation links. Implemented a route group pattern at `app/(dashboard)/` to apply the layout to all main sections.
*   **Releases List Page:** Built the core dashboard at `/releases` with a server component that fetches all releases via Supabase with optimized queries.
*   **Comprehensive Search:** Implemented database-level search using a PostgreSQL RPC function (`search_releases`) that searches across release title, version, catalog number, main artist names, and contributor names with case-insensitive partial matching.
*   **Status Filtering:** Added filter chips for all 7 release statuses (planning, signed, in_progress, ready_for_delivery, delivered, released, archived) with visual active states.
*   **Column Sorting:** Implemented sortable columns for Release Date, Title, and Status with smart defaults (dates descending, text ascending) and visual indicators.
*   **Artist Display Formatting:** Created a utility function to format artist names following DSP conventions (e.g., "Artist1 & Artist2" or "Artist1, Artist2 & Artist3").
*   **Status Badges:** Built a reusable `StatusBadge` component with color-coded states following the release lifecycle workflow (gray → blue → yellow → teal → purple → green → dark gray).
*   **Interactive Table:** Implemented clickable table rows that navigate to the release detail page, with hover states and smooth transitions.
*   **Performance Optimization:** Added database indexes on foreign keys and implemented trigram indexes for fast ILIKE text search.
*   **URL State Management:** All search, filter, and sort state is managed via URL search params, enabling shareable URLs and proper browser navigation.

#### Current Status

The application now features a complete releases management workflow with a professional dashboard interface. Users can efficiently find releases through comprehensive search, filter by workflow status, sort by key columns, and seamlessly navigate to detailed editing interfaces. The system is optimized for performance with database-level search and proper indexing.
```

**Step 2: Commit**

```bash
git add engeloop-app/docs/session-notes.md
git commit -m "docs: update session notes with Phase 5 dashboard implementation"
```

---

## Summary

This plan implements a complete releases dashboard with:

- **Database**: RPC function for multi-table search with performance indexes
- **Components**: Reusable UI (StatusBadge, SearchBar, StatusFilters, SortableHeader, ReleasesTable)
- **Layout**: Shared DashboardLayout with sidebar navigation
- **Features**: Search, filter, sort, clickable rows
- **Performance**: Server-side rendering, debounced search, optimized queries
- **State**: URL-based state management for shareability

**Total Tasks**: 16 tasks
**Estimated Time**: 2-3 hours for experienced developer with zero context
**Tech Debt**: None - follows established patterns, properly indexed, tested

**Testing Coverage**:
- Manual testing steps provided in Task 15
- Optional unit test for format utility in Task 7
- Integration testing via manual verification

**Future Enhancements** (not in this plan):
- Pagination for large catalogs
- Bulk actions
- Export functionality
- Advanced date range filters
- Column visibility toggles
