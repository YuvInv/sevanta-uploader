# Dealigence Data Extraction: Technical Postmortem

**Date**: 2026-02-05
**Status**: Approach Deprecated
**Related**: [Bug Investigation](./bugs/bug-54-investigation.md), [Lessons Learned](./lessons.md)

---

## Executive Summary

The Dealigence Quick Upload feature attempted to extract company data from dealigence.vc pages for bulk upload to Sevanta CRM. After multiple fix iterations, we discovered a fundamental architectural incompatibility: Dealigence's Next.js SPA only exposes complete company data (including founders) during full page loads. During SPA navigation, the complete data is inaccessible from any source our Chrome Extension can reach. This makes reliable extraction impossible with the current approach.

---

## Problem Statement

### Original Goal
Allow users to navigate dealigence.vc company pages and automatically extract:
- Company name
- Description
- Website
- Founders (names and roles)
- Source URL

### Observed Failures

| Scenario | Expected | Actual |
|----------|----------|--------|
| Fresh page load | Complete data | Complete data (works) |
| Navigate Company A → B | Company B data | Company A data (stale) |
| Navigate A → B → A | Company A data | Random stale data |
| Rapid navigation | Current company | Race condition failures |

---

## Investigation Methodology

### Tools Used
- Browser MCP tools (`mcp__claude-in-chrome__read_console_messages`, `mcp__claude-in-chrome__read_page`)
- Chrome DevTools Network tab
- Strategic console.log instrumentation in content scripts
- DOM inspection during SPA navigation

### Process
1. Added logging to extraction functions
2. Navigated between company pages while watching console
3. Inspected DOM state, JSON-LD content, and network requests at each step
4. Documented actual values vs expected values

---

## Technical Findings

### Dealigence Architecture

Dealigence uses Next.js with:
- Server-side rendering (SSR) for initial page load
- Client-side SPA navigation between pages
- CSS Modules with hashed class names (e.g., `Person-module-scss-module__eMYvaG__personContainer`)

### Data Sources Analysis

| Source | Availability | Data Completeness | Notes |
|--------|--------------|-------------------|-------|
| **JSON-LD** (`<script type="application/ld+json">`) | Full page load only | Complete (name, founders, description) | **Stale during SPA navigation** - not updated by Next.js |
| **`__NEXT_DATA__`** | Full page load only | Basic (name, logoUrl, description) | Same staleness issue as JSON-LD |
| **`_next/data/{buildId}/company/{slug}.json`** | SPA navigation | Basic only | Missing founders, funding, stakeholders |
| **DOM "Stakeholders" section** | Always updated | Investors, board, advisors | **NOT founders** - different people! |
| **`deploy.dealigence.vc/companies/{slug}`** | Requires auth | Unknown | Returns 401 from extension context |

### Key Finding: JSON-LD Staleness

**Observed behavior:**
```
1. Navigate to dealigence.vc/company/wiz (full load)
   → JSON-LD: { name: "Wiz", founders: [...] }  ✓

2. Click link to /company/pantera (SPA nav)
   → URL changes to /company/pantera
   → DOM updates to show Pantera
   → JSON-LD: { name: "Wiz", founders: [...] }  ✗ STALE!
```

The `<script type="application/ld+json">` tag is:
- Server-rendered for SEO
- Never updated by client-side JavaScript
- Contains the most complete data
- Becomes a trap during SPA navigation

### Key Finding: Stakeholders ≠ Founders

The DOM "Stakeholders & Advisors" section contains:
- Board members
- Investors
- Advisors

It does **not** contain the original founding team. The JSON-LD `founders` array has different people than the DOM stakeholders section.

**Example (Attestable):**
- JSON-LD founders: 3 people (actual co-founders)
- DOM stakeholders: 10 people (board, investors, advisors)

---

## Attempted Fixes and Results

### Fix 1: `chrome.tabs.onUpdated` Listener
**Theory**: Initial navigation not detected
**Result**: Didn't help - detection was working fine

### Fix 2: URL Capture Timing
**Theory**: URL captured too late in extraction
**Result**: URL was correct; data was stale

### Fix 3: Hyphen-Stripped Name Matching
**Theory**: "UnitySCM" vs "unity-scm" mismatch
**Result**: Matching logic wasn't the issue

### Fix 4: Delay Before Extraction
**Theory**: SPA needs stabilization time
**Result**: DOM updates fast; JSON-LD never updates

### Fix 5: Validate JSON-LD Against URL
**Implementation**: Check if JSON-LD company name matches URL slug
**Result**: Correctly detects staleness, but fallback to DOM gives incomplete data

### Fix 6: Improved DOM Selectors
**Implementation**: Updated selectors for CSS Modules (`[class*="personContainer"]`)
**Result**: Correctly extracts stakeholders, but stakeholders ≠ founders

---

## Root Cause

### Fundamental Architectural Incompatibility

Dealigence's data architecture creates an impossible situation:

```
Full Page Load:  JSON-LD has founders → Complete data ✓
SPA Navigation:  JSON-LD is stale, DOM has stakeholders only → Incomplete data ✗
```

There is **no accessible source** that provides complete company data (including founders) during SPA navigation. The options are:

1. **Use JSON-LD**: Stale during SPA nav → wrong company
2. **Use DOM**: Updated during SPA nav → missing founders
3. **Use _next/data API**: Updated during SPA nav → missing founders
4. **Use deploy.dealigence.vc API**: Requires auth → 401 error

### Why This Can't Be Fixed (Current Approach)

The data we need simply isn't exposed to the browser during SPA navigation. No amount of:
- Timing adjustments
- Retry logic
- Better selectors
- Message passing improvements

...can access data that isn't there.

---

## Lessons Learned

### 1. Observe Before Theorizing

Four failed attempts followed the same pattern: theorize → implement → fail.

**Rule**: Before writing "the issue is..." or "this appears to be...", use browser tools to observe actual behavior and capture evidence.

### 2. Understand Data Architecture First

We didn't fully map Dealigence's data sources until investigation #5. Earlier mapping would have revealed the fundamental limitation sooner.

### 3. SPA Sites Are Architecturally Complex

Client-side navigation creates timing windows where different data sources are in different states:
- URL: Updated immediately
- DOM: Updated within ~100ms
- JSON-LD/SSR content: Never updated

### 4. Founders vs Stakeholders Semantic Difference

These are different business concepts with different people. Can't substitute one for the other.

### 5. Patches Can't Fix Architecture

When the underlying data isn't accessible, no patch will help. Recognize when an approach is fundamentally incompatible.

---

## Recommendations for Redesign

### Option 1: Force Full Page Loads
- Intercept SPA navigation and force full page reload
- Pros: JSON-LD always fresh
- Cons: Poor UX, breaks Dealigence's navigation

### Option 2: API Integration
- If Dealigence has a public/partner API, use that
- Pros: Reliable, complete data
- Cons: Requires API access, may need auth flow

### Option 3: Manual Extraction Mode
- User clicks "Extract" only on full page loads
- Show warning if SPA navigation detected
- Pros: Works with current architecture
- Cons: Requires user awareness of limitation

### Option 4: Hybrid Approach
- Extract what's available (name, description from DOM)
- Indicate which fields couldn't be extracted
- Let user manually add founders
- Pros: Graceful degradation
- Cons: Not fully automated

### Option 5: Abandon Dealigence Extraction
- Focus on CSV upload workflow (which works reliably)
- User exports from Dealigence manually
- Pros: Eliminates complexity
- Cons: More manual work for user

---

## Files Affected

### Current State (Feature Partial)
- `src/content/dealigence/extractor.ts` - Extraction logic with URL validation
- `src/content/dealigence/selectors.ts` - DOM selectors (updated for CSS Modules)
- `src/popup/components/DealigenceQuickUpload/` - UI components
- `src/popup/hooks/useDealigenceExtraction.ts` - React hook
- `src/background/index.ts` - Message handling

### What Works
- Detection of dealigence.vc pages
- Extraction on full page load (complete data)
- Extraction during SPA navigation (partial data - name/description only)
- Quick Upload tab UI, preview, and upload flow

### What Doesn't Work
- Founder extraction during SPA navigation
- Reliable complete data in all navigation scenarios

---

## Conclusion

The Dealigence extraction approach is fundamentally limited by Dealigence's data architecture. Complete data (founders) is only accessible during full page loads. For reliable automation, a different approach is needed - either forcing full loads, using an API, or accepting partial extraction with manual completion.

The Quick Upload UI, upload flow, and Sevanta integration remain functional and valuable. Only the Dealigence data extraction portion is unreliable.
