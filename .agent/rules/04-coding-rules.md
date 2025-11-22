---
trigger: always_on
---

# Business Logic & Coding Rules

## Financial Logic (The "Two-Level" Split)
Financials are calculated in two stages. Do not simplify this:
1.  **Contract Level:** Defines the `licensor_pool_percent` (e.g., 50% of Net Receipts).
2.  **Track Level:** Defines the `share_percent` for a specific contact within that pool.
* **Calculation:** `Effective % = (Licensor Share % * Licensor Pool %) / 100`.
* **Validation:** The sum of `share_percent` for all licensors on a track MUST equal 100% of the pool.

## Catalog Numbers
* Format: `ENG-YYYY-NNN` (e.g., ENG-2025-001).
* Variants: `ENG-YYYY-NNNA` (e.g., ENG-2025-001A).
* Use the database function `generate_catalog_number()` to create these; do not generate them in client-side JS.

## UI Component Rules
* **Search Bars:** Input backgrounds must be **Dark** (`var(--bg-deep-dark)` or `var(--nord1)`), never white, to avoid optical glare in dark mode.
* **Right-Align Numbers:** All monetary values, percentages, and dates in tables must be right-aligned and monospaced.