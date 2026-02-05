# Dealigence Data Architecture - Complete Map

**Date**: 2026-02-05
**Status**: Phase 2 - Consolidated exploration findings
**Purpose**: Inform redesign of Quick Upload extraction

---

## Executive Summary

Dealigence has significantly changed its data architecture since our last investigation. **JSON-LD structured data has been completely removed** from the site. The page now loads data asynchronously from `deploy.dealigence.vc` API, making DOM-based extraction unreliable until the page fully loads.

---

## Data Sources Found

| Source | Exists? | Full Page Load | SPA Navigation | Has Founders? | Notes |
|--------|---------|----------------|----------------|---------------|-------|
| **JSON-LD** (`<script type="application/ld+json">`) | **NO - REMOVED** | N/A | N/A | N/A | Zero tags found. Entire previous approach is obsolete. |
| **`__NEXT_DATA__`** | Yes | name, logoUrl, description only | Stale | No | Extremely minimal data |
| **`deploy.dealigence.vc/companies/{slug}`** | Yes (POST) | Called by page | Called by page | **Unknown - likely yes** | CORS-blocked from page JS; extension background can bypass |
| **DOM "Founders" section** | Yes | Loads async ("loading...") | Loads async | Eventually yes | `dataPointValue` element populates after API call |
| **DOM "Stakeholders & Advisors"** | Yes | Loads async | Loads async | No (different people) | Board members, advisors - NOT founders |
| **DOM basic info** | Yes | Available | Available | No | Company name (h2), description, funding, workforce |

## Network Endpoints Discovered

### `deploy.dealigence.vc` API (Authenticated)

| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/companies/{slug}` | POST | 200 | **Company data** - likely complete including founders |
| `/company_activity/get_metadata` | POST | 200 | Activity metadata |
| `/scoring_models/{id}/execute` | POST | 200 | Scoring model execution |
| `/workflows/group_workflow_templates` | GET | 200 | Workflow templates |
| `/workflows/workflow_templates` | GET | 200 | Workflow templates |
| `/insights/{id}` | GET | 200 | Company insights |

### Key observations:
- These API calls only appear when user is **logged into Dealigence**
- CORS blocks direct fetch from `dealigence.vc` page context
- Chrome Extension background script can bypass CORS with `host_permissions`
- API uses browser session/cookies for auth

### Other Network Traffic

| Pattern | Method | When | Notes |
|---------|--------|------|-------|
| `dealigence.vc/company/{slug}` | GET | Full page load | HTML page with SSR |
| `dealigence.vc/_next/static/**` | GET | Full page load | JS/CSS chunks, build manifest |
| `storage.googleapis.com/dealigence-*` | GET | Page load | Company logo images |
| `edge.fullstory.com/*` | GET/POST | Page load | FullStory analytics |
| `static.cloudflareinsights.com/*` | GET | Page load | Cloudflare analytics |

**NOT found**: No `_next/data/{buildId}/company/{slug}.json` endpoint observed (may have been removed with architecture changes).

## DOM/JS State

### Window Objects
- `window.__NEXT_DATA__`: Present but minimal (name, logoUrl, description only)
- No Redux, Zustand, Apollo, or Relay stores
- No React fiber tree accessible on `#__next`
- No custom window globals with company data

### DOM Structure (Company Page)

```
main
  └── div (CompanyPage container)
      ├── h2: "Wiz" (company name - always available)
      ├── div.baseDatapoints
      │   ├── div.dataPointContainer
      │   │   ├── div.dataPointLabel: "Founders"
      │   │   └── div.dataPointValue: "loading..." → eventually populated
      │   └── div.dataPointContainer
      │       ├── div.dataPointLabel: "Notable Customers"
      │       └── div.dataPointValue: ...
      ├── h4: "Insights" → loading...
      ├── h4: "Funding"
      ├── h4: "Workforce"
      └── section: "Stakeholders & Advisors"
          └── buttons with name + role text
```

### CSS Module Pattern
```
DataPoint-module-scss-module__ysqGXW__dataPointLabel
DataPoint-module-scss-module__ysqGXW__dataPointValue
CompanyPage-module-scss-module__-UnLTG__baseDatapoints
Person-module-scss-module__eMYvaG__personContainer
```

### Key DOM Observations
1. **Founders appear as `dataPointValue`** not as person cards - they're text, not structured
2. **Stakeholders appear as person cards** (buttons with name/role divs)
3. **Data loads asynchronously** - many elements show "loading..." initially
4. **CSS Modules use stable partial class names** like `dataPointLabel`, `dataPointValue`, `personContainer`

## What Changed Since Last Investigation

| Aspect | Before (Postmortem) | Now |
|--------|---------------------|-----|
| JSON-LD | Present with full data including founders | **COMPLETELY REMOVED** |
| `_next/data` API | Available with basic data | Not observed |
| `__NEXT_DATA__` | name, logoUrl, description | Same (minimal) |
| Founders source | JSON-LD (on full load) | `deploy.dealigence.vc` API → DOM `dataPointValue` |
| Page loading | Fast (SSR complete) | Slow (many async API calls) |
| Authentication | Unclear | Required for `deploy.dealigence.vc` API |

---

## Recommended Approach

### Primary: Direct API Call from Extension Background Script

**How it works:**
1. Add `deploy.dealigence.vc` to extension's `host_permissions`
2. When user is on a Dealigence company page, extract the slug from URL
3. Background script calls `POST deploy.dealigence.vc/companies/{slug}` with user's cookies
4. Parse response to extract company name, description, website, founders
5. Pass data to sidepanel for preview/upload

**Why this is best:**
- Bypasses CORS (extension background scripts aren't subject to CORS)
- Gets complete data including founders
- Works for both full page load AND SPA navigation (we call the API ourselves)
- No dependency on DOM loading state

**Unknowns to validate:**
- Exact response format of `/companies/{slug}` endpoint
- Whether the endpoint requires specific auth headers beyond cookies
- Rate limiting

### Fallback: DOM Extraction (Wait for Load)

**How it works:**
1. Detect Dealigence company page
2. Wait for `dataPointValue` elements to stop showing "loading..."
3. Extract from DOM:
   - Company name: `h2` heading
   - Description: DOM paragraph/description section
   - Founders: `[class*="dataPointValue"]` next to "Founders" label
   - Stakeholders: `[class*="personContainer"]` elements
   - Funding, Workforce: corresponding `dataPointValue` elements

**When to use:**
- If API approach fails (auth issues, CORS still blocks)
- As additional data source to merge with API data

### Emergency Fallback: Force Page Reload

**How it works:**
1. Detect SPA navigation
2. Call `chrome.tabs.update(tabId, {url: currentUrl})` or inject `location.reload()`
3. Wait for full SSR page load
4. Extract from DOM

**When to use:**
- Only if both API and DOM extraction fail
- UX trade-off: visible page reload

---

## Next Steps

1. **Validate API response**: Call `deploy.dealigence.vc/companies/wiz` from extension background script and inspect full response
2. **Design extraction strategy** based on API response content
3. **Implement with graceful degradation**: API → DOM wait → Force reload → Error
