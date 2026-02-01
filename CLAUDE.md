# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sevanta Uploader is a Chrome Extension for bulk uploading companies to Sevanta Dealflow CRM. It validates required fields, checks for duplicates, and provides an editable interface before upload.

**Key Benefit**: Uses browser session cookies for authentication - no API key needed.

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
│   │   ├── index.html      # HTML entry
│   │   ├── main.tsx        # React entry (uses popup/App)
│   │   └── styles.css      # Side panel styles
│   ├── popup/              # Shared UI components (React)
│   │   ├── App.tsx         # Main app component
│   │   ├── components/     # React components
│   │   └── hooks/          # Custom React hooks
│   ├── background/         # Service Worker
│   │   └── index.ts        # Message handling & API calls
│   └── lib/                # Shared utilities
│       ├── api.ts          # Sevanta API client
│       ├── validation.ts   # Field validation
│       ├── csv.ts          # CSV parsing & templates
│       └── types.ts        # TypeScript types
├── public/
│   ├── manifest.json       # Extension manifest
│   └── icons/              # Extension icons
└── scripts/
    └── generate-icons.js   # Icon generation script
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

## Core Features

1. **Connection Check**: Verify user is logged into Sevanta
2. **CSV Upload**: Drag-and-drop or file select
3. **Column Mapping**: Map CSV columns to CRM fields
4. **Validation**: Required fields, dropdown values, data types
5. **Duplicate Detection**: Match by CompanyName/Website
6. **Review/Edit**: Editable table with inline editing
7. **Upload**: Sequential upload with progress tracking

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
```

## Loading the Extension

1. Run `npm run build`
2. Open Chrome → `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder
6. Click the extension icon to open the side panel

## Task Management

All tasks, features, and roadmap items are tracked in **two places**:
- `TODO.md` - Local reference in the repo
- [GitHub Issues](https://github.com/YuvInv/sevanta-uploader/issues) - For tracking and collaboration

When adding new tasks, update both locations to keep them in sync.

## api examples
the folder .schema_examples/ contains example JSON responses from various API endpoints for reference when working with the Sevanta Dealflow API. you can use these files to understand the structure of API responses and to test your code against real data formats.


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
