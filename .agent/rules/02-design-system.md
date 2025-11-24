---
trigger: always_on
---

# Design System: Nord Industrial

## Aesthetic Goal
**"Pro Audio Workstation, not Marketing Dashboard."**
Think Ableton Live or a coding IDE. Dark, dense, sharp, and utilitarian.

## Color Palette (Nord Theme)
Strictly use the CSS variables defined in `globals.css`:
* **Backgrounds:** `var(--bg-page)` (Nord0), `var(--bg-deep-dark)` (Nord1) for panels.
* **Accents:** `var(--frost-blue)` and `var(--frost-cyan)` for primary actions.
* **Status Colors:**
    * *Draft/Planning:* `var(--nord3)` (Grey)
    * *Issues:* `var(--aurora-red)`
    * *Success/Released:* `var(--aurora-green)`.

## Structural Rules
1.  **No Floating Cards:** Avoid drop shadows and floating white boxes. Use full-height panels, split-panes, and 1px borders (`var(--border-primary)`) to define space.
2.  **Sharp Edges:** Border radius should be `sm` (2px) or `none`. Avoid large rounded corners.
3.  **High Density:** Minimize padding (`py-1` or `py-2`). Data tables should be compact to show maximum rows.
4.  **Zebra Striping:** Use `even:bg-white/5` for table rows instead of horizontal grid lines to reduce visual noise.

## Typography
* **UI / Prose:** `Inter` (Sans-Serif). Use for Release Titles and Artist Names.
* **Data / Identifiers:** `Geist Mono` or `JetBrains Mono`. **MANDATORY** for: Catalog IDs, ISRCs, UPCs, and Financial Percentages.