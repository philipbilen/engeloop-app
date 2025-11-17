# Releases Dashboard Design

**Date**: 2025-11-17
**Status**: Approved
**Type**: Feature Design

## Overview

Design and implement a searchable, sortable releases dashboard at `/releases` route. This serves as the main entry point for finding and accessing releases in the catalog management system.

## Requirements

### Functional Requirements

- Display all releases in a searchable, sortable table
- Comprehensive search across: title, version, artist names, contributor names, catalog number
- Filter by release status
- Sort by: Release Date, Title, Status
- Click any row to navigate to detail/edit page
- Show release count
- Quick access to create new release

### Data Display

**Table Columns:**
1. **Release Date** - Stacked format (MMM DD / YYYY), nulls last
2. **Title / Artist** - Stacked format (title / artist display line)
3. **Type** - Single, EP, or Album
4. **UPC** - Show "—" if null
5. **Status** - Color-coded badge

**Artist Display Line:**
- Format: "Artist1 & Artist2" (2 artists), "Artist1, Artist2 & Artist3" (3+)
- Derived from `release_main_artists` ordered by `position`
- Maximum 4 artists (DSP standard)

**Status Values & Colors:**
- `planning` → Gray (neutral, "DRAFT" label)
- `signed` → Blue (informational)
- `in_progress` → Yellow/Amber (requires action)
- `ready_for_delivery` → Teal (internal success)
- `delivered` → Purple (in-flight with distributor)
- `released` → Bright Green (live)
- `archived` → Dark Gray (low emphasis)

### Sorting

**Sortable Columns:** Release Date, Title, Status

**Sort Options:**
- `release_date_desc` (default) - Newest first, nulls last
- `release_date_asc` - Oldest first, nulls last
- `title_asc` / `title_desc`
- `status_asc` / `status_desc`

**UX Behavior:**
- Click column header to toggle sort direction
- First click defaults: dates → desc, text → asc
- Visual indicator: arrow (↑/↓) on active column

### Search & Filter

**Search Implementation:**
- Debounced input (300ms)
- Case-insensitive partial matching
- Searches across multiple relations via database RPC

**Status Filters:**
- Filter chips: All, Planning, Signed, In Progress, etc.
- Single selection
- Updates URL search param

## Architecture

### Component Structure

```
app/
  (dashboard)/                    # Route group with shared layout
    layout.tsx                    # DashboardLayout wrapper
    releases/
      page.tsx                    # Server component - data fetching
      _components/
        releases-table.tsx        # Client - table with sorting
        releases-filters.tsx      # Client - status filter chips
        search-bar.tsx            # Client - search input

components/
  layout/
    dashboard-layout.tsx          # Sidebar + main content shell
  ui/
    badge.tsx                     # Reusable status badge
```

### Data Fetching Strategy

**Server Component Pattern:**
- `app/(dashboard)/releases/page.tsx` is a Server Component
- Reads search params for filtering/sorting state
- Fetches data with single optimized query
- Passes data to client components

**Base Query:**
```typescript
const { data } = await supabase
  .from('releases')
  .select(`
    id, title, version, release_date, type, upc, status, internal_catalog_id,
    release_main_artists(
      artist_profile:artist_profiles(stage_name),
      position
    )
  `)
```

**Search via RPC:**
```sql
CREATE OR REPLACE FUNCTION search_releases(query_text TEXT)
RETURNS TABLE (release_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT r.id
  FROM releases r
  LEFT JOIN release_main_artists rma ON r.id = rma.release_id
  LEFT JOIN artist_profiles ap_main ON rma.artist_profile_id = ap_main.id
  LEFT JOIN release_contributors rc ON r.id = rc.release_id
  LEFT JOIN artist_profiles ap_contrib ON rc.artist_profile_id = ap_contrib.id
  WHERE
    query_text IS NULL OR query_text = '' OR
    r.title ILIKE '%' || query_text || '%' OR
    r.version ILIKE '%' || query_text || '%' OR
    r.internal_catalog_id ILIKE '%' || query_text || '%' OR
    ap_main.stage_name ILIKE '%' || query_text || '%' OR
    ap_main.full_legal_name ILIKE '%' || query_text || '%' OR
    ap_contrib.stage_name ILIKE '%' || query_text || '%' OR
    ap_contrib.full_legal_name ILIKE '%' || query_text || '%';
END;
$$ LANGUAGE plpgsql STABLE;
```

Page component calls RPC when `searchParams.q` exists and filters results by returned IDs.

### State Management

**URL Search Params:**
- `?q=searchTerm` - Search query
- `?status=planning` - Status filter
- `?sort=release_date_desc` - Sort option

**Why Search Params:**
- Server-side filtering/sorting
- Shareable URLs
- Browser back/forward works naturally
- No client state synchronization issues

**Client Components:**
- Use `useRouter()` and `useSearchParams()` hooks
- Update params via `router.replace()`
- Trigger server re-render automatically

## Visual Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar       │  Main Content                           │
│ (240px fixed) │                                          │
│               │  Header: RELEASES + count + NEW btn     │
│ ENGELOOP      │  Search bar + Status filters            │
│ Catalog Mgr   │  ┌──────────────────────────────────┐   │
│               │  │ Releases Table                    │   │
│ [📀] Releases │  │ (sortable, clickable rows)        │   │
│ [ ] People    │  └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Sidebar (`DashboardLayout`)

- Fixed width: 240px
- Dark background
- Header: "ENGELOOP" (bold) + "Catalog Manager" (muted)
- Navigation links with icons
- Active state highlighting

### Table Styling

**Column Widths:**
- Release Date: ~120px (fixed)
- Title/Artist: flex-1 (grows)
- Type: ~100px (fixed)
- UPC: ~140px (fixed)
- Status: ~120px (fixed)

**Row States:**
- Default: clean, readable
- Hover: background color shift, cursor pointer
- Entire row clickable via Link wrapper

**Status Badge:**
```tsx
<span className="
  inline-block px-3 py-1 text-xs font-semibold uppercase
  border-2 rounded tracking-wide
  [color-specific-classes]
">
  {displayLabel}
</span>
```

### Typography

- Page title: Uppercase, bold, large
- Table headers: Uppercase, medium weight, muted
- Release title: Bold, primary text
- Artist line: Regular, secondary text
- Dates: Stacked, upper line larger

## Implementation Notes

### Dependencies

- `use-debounce` package for search debouncing
- Existing UI components: Button, Input, Select
- Supabase client (server-side)

### Database Changes Required

1. Create `search_releases()` RPC function
2. Verify `release_main_artists` has proper indexes on `release_id` and `position`
3. Verify `release_contributors` has index on `release_id`

### Accessibility

- Semantic HTML: `<table>`, `<thead>`, `<tbody>`
- Sortable headers: button elements with clear aria labels
- Search input: proper label and placeholder
- Keyboard navigation: all interactive elements focusable

### Performance Considerations

- Server-side rendering (instant first paint)
- Single query with joins (minimize round trips)
- RPC search moves complexity to database (faster than multiple queries)
- Debounced search prevents excessive requests

### Future Enhancements

- Pagination (when catalog > 100 releases)
- Bulk actions (select multiple, change status)
- Export to CSV
- Advanced filters (date range, type, has UPC, etc.)
- Column visibility toggles
- Saved filter presets

## Success Criteria

- All releases visible and searchable
- Search finds releases by any artist/contributor name
- Sorting works for all three designated columns
- Status filter correctly filters results
- Click row → navigate to edit page
- Visual design matches provided mockup
- Page loads in < 1s with 50+ releases
- Mobile responsive (table scrolls horizontally if needed)

## Open Questions

None - design is fully approved and ready for implementation.
