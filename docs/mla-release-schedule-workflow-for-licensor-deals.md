---
type: workflow-design
status: review
tools: []
---

suggested title: mla-release-schedule-workflow-for-licensor-deals

## Purpose
- Business objective
- Create a stable, scalable workflow for using one `Master Licence Agreement` plus per-release `Release Schedules` that supports catalog stability, clean licensor data capture, and low-friction deal execution while keeping artists protected.
- User needs addressed
- Label needs a repeatable way to:
  - Capture licensor legal identity details confirmed by the licensor
  - Lock in perpetual exploitation rights with clear reversion safety valves
  - Separate standard terms from deal specific economics and publishing
  - Feed clean data into Loudkult, ADA, and the internal catalog database
- Licensors need:
  - A clear, readable contract structure that explains what is fixed and what is negotiable
  - Confidence that their data is correct and under their control
  - Explicit information about rights granted, term, reversion, and money

## Process Flow
### Stage 1: Input
- **Trigger**: What initiates
- New track is accepted for release (`demo → A&R approval`) and there is at least one licensor who does not yet have an executed MLA with the label, or an existing licensor is entering into a new deal that requires a fresh Release Schedule.
- **Requirements**: Prerequisites
- Confirm who the licensor is for the master(s) (individual, company, or group)
- Confirm that the licensor accepts the high level business terms (perpetual licence with reversion, royalty model expectations, no recoupment by default)
- Decide whether Engeloop Publishing is involved for this release or not
- Decide whether this release requires advances or recoupable marketing
- Have a working internal `Catalog Number` plan for the release family (radio / extended configurations)
- **Validation**: Quality checks
- Check that licensor email is valid and active
- Check that licensor understands they will type their own legal name, PKA, and postal address in the MLA
- Check that splits and licensors for the master are internally consistent and sum to 100 percent at master level
- Check that this is the correct licensor to be paid by Loudkult (no missing bandmate or rights holder)

### Stage 2: Processing
- **Actions**: Steps taken
- MLA path
- 1. Generate MLA PDF from LaTeX template with:
  - Label party block hard coded for `Algorhythm Ltd. trading as Engeloop Records`
  - Licensor party block rendered as blank form style lines for legal name, PKA, postal address, contact email, licensor type, and optional company contact person
- 2. Upload MLA to e signing system and:
  - Place required text fields on each licensor line
  - Place radio buttons for `Licensor type: Individual / Company`
  - Attach signature fields for label and licensor
- 3. Send MLA for signature to licensor
- 4. After execution, extract licensor details and create or update:
  - `People` record (legal name, address, email)
  - `Artist` record(s) tied to PKA if needed
  - `Licensor` record linked to this MLA
- Release Schedule path
- 5. For the specific release, build a Release Schedule draft with:
  - Reference to the licensor and MLA date
  - List of Recordings (radio edit, extended mix, other Associated Versions)
  - Planned Term and Territory
  - Royalty structure (label share and licensor pool, or direct split)
  - Any advances or recoupable costs
  - Any publishing involvement by Engeloop Publishing
- 6. If publishing is involved, attach or reference a publishing split sheet that includes legal names, IPIs, and PROs
- 7. Generate Release Schedule PDF from template
- 8. Send Release Schedule for signature to licensor (and any other licensors if there is a multi licensor pool)
- 9. After execution, create an `Agreement` record in the database that links:
  - MLA
  - Release Schedule
  - Recordings (masters)
  - Catalog Number(s)
  - Splits, advances, publishing data
- 10. Once the Agreement exists, proceed to create the release in ADA, using the internal Catalog Number as the link to the Release Schedule
- **Decision Points**: Logic branches
- Is there an existing MLA for this licensor
  - Yes: skip MLA generation and only create a new Release Schedule
  - No: send MLA first, then Release Schedule
- Is the licensor an individual or a company
  - Individual: no contact person block required
  - Company: require contact person name and role
- Are there multiple masters and configurations (radio, extended, alternative version) that share the same licensors and splits
  - Yes: group them under one Release Schedule with multiple Recordings entries and multiple Catalog Numbers where appropriate
  - No: keep a single Recording row
- Is Engeloop Publishing involved
  - No: apply standard “no publishing administration” language
  - Yes: include publishing section and attach split sheet
- Are advances or recoupable costs used
  - No: use zero advance and “no recoupable costs” defaults
  - Yes: specify exact amounts, sources of recoupment, and cross collateralisation logic
- **Error Handling**: Failure modes
- MLA or Release Schedule not signed
  - Automatic reminders from e sign tool after defined periods
  - Manual follow up by label if no response
- Licensor data entered incorrectly (obviously invalid postcode, missing country, clearly mismatched email)
  - Internal pre filing check before data entry into database
  - Request written correction from licensor before creating ADA product
- Conflicting splits across documents
  - System flags when splits in Release Schedule do not sum to 100 percent for the licensor pool
  - Manual review of Release Schedule vs internal deal notes
- ADA configuration mismatch
  - If ADA product configuration does not match Recordings list (missing extended mix, wrong artist line), flag before final delivery
  - Correct ADA metadata and re align with Agreement record

### Stage 3: Output
- Executed MLA per licensor stored in a structured way and easily referenced in future deals
- Executed Release Schedule per Agreement that clearly identifies Recordings, Term, Territory, financial structure, and any publishing
- Clean licensor identity data saved to the database, explicitly supplied by the licensor
- Agreement level object in the database linking licensor, masters, catalog numbers, splits, and publishing
- ADA release created with internal Catalog Number that ties back to the Release Schedule and Agreement
- Correct licensor details and splits available for Loudkult onboarding and royalty processing

## Core Concepts
- **Automation Points**: Where and why
- Template based MLA and Release Schedule generation from canonical text (LaTeX or equivalent)
- Automatic population of label data in MLA, leaving licensor fields blank for signer input
- Post signature parsing of licensor fields into structured database entries
- Release Schedule generation from internal deal form that already knows:
  - Recordings list
  - licensors and splits
  - planned Term, Territory, and publishing status
- Basic validation scripts in the app to:
  - Ensure splits sum to 100 percent
  - Check required fields are present before export
- Automated creation of ADA ready internal metadata from Agreement data, including final Catalog Numbers
- **Human Touchpoints**: Critical reviews
- A&R or label manager validates that the licensor identified matches the real world rights holder
- Label reviews high level business terms with the licensor before sending MLA and Release Schedule (to avoid surprise over perpetuity, reversion, or royalty model)
- Legal or label manager sanity checks Release Schedule before signature for:
  - Scope of rights vs comfort level
  - Publishing involvement accuracy
  - Advances and recoupment wording
- Manual review of first statement(s) from Loudkult for each new licensor to confirm that the licensor data pipeline is working as intended

## Integration Points
- Systems connected
- Obsidian
  - Stores template notes, reasoning, and playbooks for MLA and Release Schedule workflow
- LaTeX toolchain or document generator
  - Renders MLA and Release Schedule PDFs from canonical templates driven by structured data
- E signing platform (DocuSign, Adobe Sign, or similar)
  - Collects licensor entered legal name, PKA, address, and email
  - Collects signatures for MLA and Release Schedules
- Internal catalog database or app
  - Holds People, Artists, Licensors, Agreements, Recordings, Releases, Catalog Numbers, and splits
- Loudkult systems
  - Receive licensor name, email, postal address, and splits for royalty onboarding
- ADA distribution platform
  - Receives release metadata, including internal Catalog Number, track list, artist line, and rights data
- Data flows
- Licensor enters identity data into e signed MLA → label exports that data into `People` / `Licensor` tables
- Internal app uses licensor record plus deal inputs to generate Release Schedule → e signing platform collects signatures
- Internal app stores Agreement object linking MLA, Release Schedule, Recordings, and Catalog Numbers
- Agreement data (licensee, licensor splits, Catalog Number) used to populate ADA and to prepare the Loudkult onboarding information
- Royalty statements from Loudkult feed back into the system to confirm that the licensor mapping is correct

## Optimization Opportunities
- Bottlenecks identified
- Manual creation and layout edit of MLA and Release Schedule PDFs each time
- Re entering licensor data from signed PDFs into the database
- Confusion when licensor names, PKAs, or band names are inconsistent across emails, metadata, and contracts
- Back and forth email threads to clarify basic deal parameters before sending documents
- Manual verification that ADA product configurations match the Recordings defined in the Release Schedule
- Future improvements
- Build or refine an internal app that:
  - Holds the MLA and Release Schedule templates as code or structured text
  - Uses a form based UI to generate Release Schedules from internal deal entries
  - Imports licensor fields automatically from the e signing platform where API access is available
- Create a standardized pre deal summary one pager for licensors that:
  - Explains perpetual licence, reversion, catalog stability, and royalty model in plain language
  - Reduces objections and misunderstandings before the legal documents arrive
- Add validation layers that:
  - Compare artist and licensor names across contract, internal database, and ADA metadata
  - Warn when Recordings or artists in ADA do not match the Agreement
- Explore direct integration with Loudkult if their systems allow:
  - Push licensor details and splits directly instead of manual spreadsheets
  - Pull back licensor IDs to keep your internal records aligned over time