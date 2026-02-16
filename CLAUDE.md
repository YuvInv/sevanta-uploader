# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sevanta Uploader is a Chrome Extension for bulk uploading companies to Sevanta Dealflow CRM. It validates required fields, checks for duplicates, and provides an editable interface before upload.

**Key Benefit**: Uses browser session cookies for authentication - no API key needed.

## Git Workflow (IMPORTANT)

**NEVER push directly to main.** All changes must go through a PR:

1. Create a feature branch from main
2. Make changes and commit
3. **Bump version**: Run `npm run bump` (patch), `npm run bump:minor`, or `npm run bump:major`
4. Commit the version bump
5. Push branch and create PR
6. Wait for CI to pass
7. Get user approval before merging

**Version appears in**: `package.json`, `package-lock.json`, `public/manifest.json` (all updated automatically by bump script).

**Git tags**: Created automatically when PR is merged to main via GitHub Action.

This applies to ALL changes, including small fixes, documentation updates, and config changes.

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Avoid over-engineering.
- **No Laziness**: Find root causes, maintain senior developer standards. Don't take shortcuts.
- **Minimal Impact**: Only touch what's necessary. Avoid introducing bugs in unrelated areas.

## Workflow Orchestration

### Plan Mode Default
Enter plan mode for any task with 3+ steps. If things go sideways during implementation, stop and re-plan rather than continuing down a broken path.

### Pre-Implementation Requirements

**CRITICAL: Observation Before Hypothesis (Bug Debugging)**

This rule exists because of 4+ failed attempts on Issue #54. Every failure followed the same pattern: theorize → implement → fail → repeat.

**Before writing ANY hypothesis about a bug's cause:**
1. **OBSERVE** actual behavior using browser MCP tools or DevTools
2. **CAPTURE** console logs, network requests, message passing during reproduction
3. **REPRODUCE** the exact failure scenario while watching
4. **DOCUMENT** what you actually SAW, not what you think happened

**Banned phrases until observation is complete:**
- "This appears to be..."
- "The root cause is..."
- "This is likely..."
- "I think the issue is..."

**Required phrase before proposing fixes:**
- "I observed [specific thing] in [console/network/DOM]"

**Why:** Theoretical analysis of async/SPA/timing bugs is unreliable. The code looks like it should work. The bug exists because something unexpected happens at runtime. Only observation reveals what that is.

**Before Writing Code for Bug Fixes:**
1. Check for existing analysis: `docs/bugs/bug-*.md`, `docs/`, or issue comments
2. Read linked documentation fully - don't re-derive existing research
3. **OBSERVE actual behavior first** - use `systematic-debugging` skill
4. Validate proposed solution addresses root cause, not symptoms

**For Timing-Sensitive Features (SPA, async, race conditions):**
1. **OBSERVE first** - don't theorize about race conditions
2. Validate against ground truth (URL, API response) - never previous/cached state
3. Never return unvalidated data - error state > wrong data
4. Show loading states during async operations
5. Test edge cases: A→B, A→B→A, rapid navigation, back button

### Subagent Strategy
Use subagents liberally for parallel work. One focused task per subagent - don't overload them with multiple concerns.

### Self-Improvement Loop
After receiving corrections or discovering gotchas, update `docs/lessons.md`. Write rules to prevent the same mistakes from recurring.

### Verification Before Done
Never mark a task complete without proving it works. Run tests, check the build, verify the feature manually if needed.

### Demand Elegance (Balanced)
Ask "is there a more elegant way?" for significant implementations. Skip this for simple fixes - don't over-optimize trivial changes.

### Autonomous Bug Fixing
When you encounter bugs, just fix them. Don't ask for permission or hand-hold through obvious fixes. Fix failing CI tests proactively.

### Destructive Actions Require Confirmation
Before deleting files, closing issues, removing documentation, or any irreversible action:
1. **Ask what specifically** - vague requests ("clean up") need clarification
2. **List what will be affected** - show the user exactly what will change
3. **Wait for explicit approval** - especially for docs, issues, or anything with history

Documentation for removed features is valuable - it exists for when the feature returns.

## Tech Stack

- Vite + CRXJS (Chrome Extension bundling)
- React 18 + TypeScript
- TailwindCSS for styling
- Papa Parse for CSV parsing
- chrome.storage.local for caching

## Project Structure

```
sevanta-uploader/
├── src/
│   ├── sidepanel/          # Side Panel UI entry point
│   │   ├── index.html      # HTML entry (includes Google Fonts)
│   │   ├── main.tsx        # React entry (uses popup/App)
│   │   └── styles.css      # Side panel styles + CSS variables
│   ├── popup/              # Shared UI components (React)
│   │   ├── App.tsx         # Main app with tab navigation
│   │   ├── components/
│   │   │   ├── ContactLookup/  # Contact lookup feature
│   │   │   │   ├── ContactLookup.tsx
│   │   │   │   ├── ContactInput.tsx
│   │   │   │   ├── ContactLookupProgress.tsx
│   │   │   │   ├── ContactLookupTable.tsx
│   │   │   │   └── MatchBadge.tsx
│   │   │   ├── ColumnMapper.tsx      # CSV column mapping
│   │   │   ├── CompanyEditorModal.tsx # Inline company editor
│   │   │   ├── CompanyTable.tsx      # Main company list table
│   │   │   ├── ConnectionStatus.tsx  # Sevanta connection check
│   │   │   ├── CsvUpload.tsx         # Drag-and-drop CSV upload
│   │   │   ├── DuplicateCheckProgress.tsx
│   │   │   ├── ErrorBoundary.tsx     # React error boundary
│   │   │   ├── TabNav.tsx            # Tab navigation
│   │   │   ├── UploadPreview.tsx     # Pre-upload review
│   │   │   └── UploadProgress.tsx    # Upload progress indicator
│   │   └── hooks/
│   │       ├── useContactLookup.ts   # Contact lookup logic
│   │       ├── useDuplicateCheck.ts  # Duplicate detection
│   │       ├── useSevantaApi.ts      # API connection hook
│   │       ├── useUploadWorkflow.ts  # Upload state machine
│   │       └── useValidation.ts      # Field validation hook
│   ├── background/         # Service Worker
│   │   └── index.ts        # Message handling & API calls
│   └── lib/                # Shared utilities
│       ├── api.ts          # Sevanta API client
│       ├── constants.ts    # App-wide constants
│       ├── contactExport.ts # CSV export for lookups
│       ├── contactLookup.ts # Contact parsing logic
│       ├── csv.ts          # CSV parsing & templates
│       ├── defaults.ts     # Default field values
│       ├── types.ts        # TypeScript types
│       └── validation.ts   # Field validation
├── public/
│   ├── manifest.json       # Extension manifest
│   └── icons/              # Extension icons
└── scripts/
    ├── generate-icons.js   # Icon generation script
    └── version-bump.js     # Version bump automation
```

## Sevanta Dealflow API

Base URL: `https://run.mydealflow.com/inv/api`

### Authentication
- **This extension**: Uses browser session cookies (`credentials: 'include'`)
- **OAuth2**: `Authorization: Bearer ACCESS_TOKEN` (tokens expire every 3 months)
- **API Keys**: `Authorization: API-Key API_KEY` (keys expire after 1 year)

### Rate Limit
100 requests per minute. Returns 429 error if exceeded. Consistent exceeding may lead to IP block.

### Schema Endpoints
```
GET /schema/deals     - Get all deal fields
GET /schema/contacts  - Get all contact fields
```
Response contains field definitions with `dbname` (internal name), `label` (display name), `type`, and `optionlist` (for dropdowns).

### Deal Endpoints
```
GET  /deal/{id}              - Get single deal by ID
GET  /deal/list?filter       - List/search deals
POST /deal/add               - Create deal (CompanyName required, form-urlencoded)
POST /deal/{id}/addComment   - Add comment (POST param: 'comment')
```

**Deal List Filters:**
- `filter[FieldName]=value` - Filter by field (use dbname)
- `_text=string` - Search all text fields
- `_ss=string` - Semantic search (returns top 20 matches with semantic_score)
- `RangeStageID=Portfolio` - Range filter example
- `_x[]=FieldName` - Include field in response (otherwise returns only IDs)
- `_x[]=contacts` - Include linked contacts
- `_x[]=tasks` - Include associated tasks
- `_x[]=emails` - Include associated emails (without body)
- `_x[]=files` - Include associated files (without content)
- `_offset=N` - Pagination (100 records per page when using _x[])

**No filter default**: Returns deals edited today only.

### Contact Endpoints
```
GET  /contact/{id}           - Get single contact by ID
GET  /contact/list?filter    - List/search contacts
POST /contact/add            - Create contact (Name required)
POST /contact/{id}/addNote   - Add note (POST param: 'note')
```

**Create Contact with Deal Link:**
- Include `CompanyID` parameter (the deal's ID)
- Optional `ContactTypeID` (e.g., "MGT" for management, "SRC" for source)

### Task Endpoints
```
GET  /task/{id}        - Get task by ID
GET  /task/list?filter - List tasks (default: Pending only)
POST /task/add         - Create task (TaskDescription required)
```

### Other Endpoints
```
GET /email/{id}        - Get email with body content
GET /activity/?filter  - Activity log (25 per page, newest first)
GET /user/{id}         - Get user by ID (initials)
GET /user/list         - Get all users
```

**Activity Filters:** `s` (search text), `sDate0`/`eDate0` (date range), `UserID`, `CompanyID`, `ContactID`, `minID` (pagination)

### Response Format Notes
- Schema: `{ status: "ok", data: { FieldName: { dbname, label, type, optionlist }, ... } }`
- List with _x[]: `{ status: "ok", data: [...], count_returned: N, count_total: N }`
- List without _x[]: Returns array of IDs only
- Create success: `{ status: "ok", CompanyID: N }` or includes created object
- Error: `{ error: "Error message" }`

### Field Name Quirks (IMPORTANT)
- **Schema** returns `dbname` (e.g., "CompanyName") and `label` (e.g., "Deal Name")
- **List responses** return data with LABELS as keys (e.g., `"Deal Name": "Acme"`)
- **Create/POST** expects DBNAMES (e.g., `CompanyName=Acme`)
- **Filters** use DBNAMES (e.g., `filter[CompanyName]=Acme`)

### Search Quirks (IMPORTANT)
- **`filter[FieldName]` may not work reliably** for some fields (e.g., `filter[Email]` doesn't always find exact matches)
- **Prefer `_text=` search** for finding records - it searches across all text fields and is more reliable
- When searching by email, use `_text=email@example.com` then filter results client-side for exact match

### CRM URL Formats
When linking to CRM records, use these URL patterns:
- **Contacts**: `https://run.mydealflow.com/inv/#/Contact.php?ContactID={id}`
- **Companies/Deals**: `https://run.mydealflow.com/inv/#/Company.php?CompanyID={id}`
- **Tasks**: `https://run.mydealflow.com/inv/#/Task.php?TaskID={id}`

Note: URLs use `#/` hash routing, NOT `/inv/contact/{id}` REST-style paths.

## Core Features

### Company Upload Flow
1. **Connection Check**: Verify user is logged into Sevanta
2. **CSV Upload**: Drag-and-drop or file select
3. **Column Mapping**: Map CSV columns to CRM fields
4. **Validation**: Required fields, dropdown values, data types
5. **Duplicate Detection**: Match by CompanyName/Website
6. **Review/Edit**: Editable table with inline editing
7. **Upload**: Sequential upload with progress tracking

### Contact Lookup
- Paste contacts (name + email) in various formats
- Searches CRM using `_text` API for reliability
- **Strong match**: Email matches exactly (green)
- **Possible match**: Name matches (amber)
- **No match**: Not found (gray)
- Results sorted by match strength (strong first)
- Export results to CSV

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run check        # Run lint + prettier check (use before pushing!)
npm run format       # Auto-fix prettier formatting issues
npm run test         # Run tests
npm run bump         # Bump patch version (1.0.1 -> 1.0.2)
npm run bump:minor   # Bump minor version (1.0.1 -> 1.1.0)
npm run bump:major   # Bump major version (1.0.1 -> 2.0.0)
```

## Loading the Extension

1. Run `npm run build`
2. Open Chrome → `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder
6. Click the extension icon to open the side panel

## Task Management

### Tracking Locations
- **Notion Kanban Board** - PRIMARY source of truth for all tasks, features, bugs, and backlog
- `docs/lessons.md` - Learnings and rules from past mistakes
- GitHub Issues - DEPRECATED (migrated to Notion)

### Notion Database Structure
The Kanban board has three status columns:
- **📋 Backlog** - Open issues, planned features, identified bugs
- **🚧 In Progress** - Currently being worked on
- **✅ Done** - Completed tasks

Each task includes:
- Issue # (for historical GitHub reference)
- Priority (High/Medium/Low)
- Labels (bug, enhancement, feature request, tech-debt)
- GitHub URL (for historical context)
- Full description and acceptance criteria

### Workflow Checklist
1. **Plan First**: Enter plan mode or outline steps before starting
2. **Check Notion**: Review Kanban board for current priorities and context
3. **Verify Plan**: Check in with user before starting implementation
4. **Track Progress**: Update Notion task status (Backlog → In Progress → Done)
5. **Explain Changes**: Provide high-level summary at each step
6. **Document Results**: Update Notion task with implementation notes
7. **Capture Lessons**: Update `docs/lessons.md` after corrections or discoveries

### Syncing with Notion
Use the `/sync-todos` skill to:
- Create new Notion tasks from completed work
- Update task statuses based on progress

## Field Reference (Commonly Used)

| DB Name | Label | Type |
|---------|-------|------|
| `CompanyName` | Deal Name | string (required) |
| `Description` | Description | textarea |
| `Website` | Website | url |
| `SourceTypeID` | Source Type | dropdown |
| `SourceNotes` | Source Notes | textarea |
| `PastInvestments` | Past Investments | textarea |
| `StageID` | Stage | dropdown |
| `SectorID` | Sector | dropdown |

## Design System

The UI uses a "Warm Professional" design with accessibility focus (60+ users):

### Colors (Tailwind)
- **warm-{50-900}**: Warm neutral grays (backgrounds, text, borders)
- **accent-{50-700}**: Teal accent (buttons, links, highlights)
- **success-{50-700}**: Green (valid, uploaded, strong match)
- **caution-{50-700}**: Amber (warnings, duplicates, possible match)
- **danger-{50-700}**: Red (errors, invalid, failed)

### Typography
- **Fonts**: DM Sans (body), Fraunces (display headings)
- **Sizes**: Larger than default (15px base) for accessibility
- Use `font-display` class for headings

### Components
- Rounded corners: `rounded-xl` (buttons), `rounded-2xl` (cards)
- Shadows: Subtle warm shadows (`shadow-sm`, `shadow-md`)
- Transitions: `transition-all duration-200`
- Focus states: `focus:ring-4 focus:ring-accent-500/10`

## Session Reflection

After significant work on this project, reflect on:

1. **Project-Specific Learnings**: Update this CLAUDE.md with new patterns, gotchas, or conventions discovered
2. **API Quirks**: Document any new API behavior or edge cases encountered
3. **Component Patterns**: Note reusable patterns in the React/Chrome Extension architecture
4. **Notion Sync**: Update Notion Kanban board with completed tasks and new discoveries

Keep this file current - it's the primary context for future sessions.

## Known Debugging Failures (Learn From These)

### Issue #54: Quick Upload Reliability - 4+ Failed Attempts

**What kept failing:** Theoretical analysis of SPA race conditions without observing actual behavior.

**Failed approaches (do not repeat):**
1. Adding `chrome.tabs.onUpdated` listener
2. Moving `sourceUrl` capture to start of extraction
3. Adding hyphen-stripped name matching
4. Adding delays before extraction

**Why they failed:** All were based on "I think the issue is..." without ever observing:
- What console logs appear during reproduction
- What messages are actually sent/received
- What the DOM state is at extraction time
- Whether content script even receives requests

**The fix:** Use browser MCP tools (`mcp__claude-in-chrome__read_console_messages`, etc.) to OBSERVE actual behavior during reproduction BEFORE proposing any fix.

See: `docs/lessons.md` for full history.

## Dealigence Extraction Limitations (Architectural)

**Status**: Current approach deprecated - see `docs/dealigence-extraction-postmortem.md`

### Data Source Architecture

| Source | Availability | Contains |
|--------|--------------|----------|
| JSON-LD | Full page load only | Complete data (founders) |
| `__NEXT_DATA__` | Full page load only | Basic data only |
| `_next/data` API | SPA navigation | Basic data only |
| DOM Stakeholders | Always | Board/advisors (NOT founders) |

### The Core Problem

- **Full page load**: JSON-LD has complete data including founders
- **SPA navigation**: JSON-LD is STALE, DOM has different people (stakeholders ≠ founders)
- **No fix possible**: The complete data simply isn't accessible during SPA navigation

### Implication for Future Work

Any Dealigence integration must either:
1. Force full page loads (poor UX)
2. Use an API (if available)
3. Accept partial data with manual completion
4. Abandon automated extraction
