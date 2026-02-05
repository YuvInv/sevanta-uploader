# Issue #54: Quick Upload Data Load Inconsistency

## Investigation Summary

**Date**: 2026-02-05
**Status**: Concluded - Approach Deprecated
**Postmortem**: [dealigence-extraction-postmortem.md](../dealigence-extraction-postmortem.md)

---

## Final Resolution

After extensive investigation, we discovered a **fundamental architectural incompatibility** with Dealigence's data availability. The current extraction approach cannot be fixed; it requires a complete redesign.

**Key Finding**: Complete company data (including founders) is only available from JSON-LD, which is server-rendered and **never updated during SPA navigation**. There is no accessible data source that provides complete data during client-side navigation.

See the [postmortem](../dealigence-extraction-postmortem.md) for full technical analysis and redesign options.

---

## Problem Statement

Two failure modes when navigating Dealigence pages:
1. **Flow 1**: Extension open → navigate to company → nothing happens
2. **Flow 2**: Company A → navigate away → Company B → "Extraction Failed" / incomplete data

## Root Cause Analysis

### Observation Phase (Console Logs)

We added instrumentation to observe actual behavior:

1. **Background script** (`src/background/index.ts`):
   - `chrome.webNavigation.onHistoryStateUpdated` fires correctly
   - `DEALIGENCE_URL_CHANGED` messages are broadcast successfully
   - `handleExtractDealigenceData` receives correct tab info

2. **Sidepanel hook** (`src/popup/hooks/useDealigenceExtraction.ts`):
   - Messages are received correctly
   - State transitions work (idle → extracting → success/error)
   - Auto-extract effect triggers appropriately

3. **Content script** (`src/content/dealigence/extractor.ts`):
   - **KEY FINDING**: JSON-LD is NOT updated during SPA navigation
   - JSON-LD contains stale data from previously viewed company
   - Example: Navigating from Wiz → Pantera, JSON-LD still says "Wiz"

### Root Cause Identified

**Dealigence's SPA does not update the `<script type="application/ld+json">` tag during client-side navigation.**

- JSON-LD is server-rendered for SEO purposes
- When SPA navigates, visible DOM updates but JSON-LD stays stale
- Our extractor prioritized JSON-LD (most reliable when fresh)
- Result: Extraction returned wrong company's data

## Fix Implemented (Partial)

### Change 1: Validate JSON-LD against URL slug

**File**: `src/content/dealigence/extractor.ts`

Before using JSON-LD data, we now validate that the company name matches the current URL slug:

```javascript
// CRITICAL: Validate JSON-LD against URL slug
let isJsonLdValid = false;
if (jsonLdData?.companyName && urlSlug) {
  isJsonLdValid = doesCompanyMatchSlug(jsonLdData.companyName, urlSlug);
  if (!isJsonLdValid) {
    console.log(`[Sevanta] JSON-LD stale: "${jsonLdData.companyName}" doesn't match URL slug "${urlSlug}"`);
  }
}
```

If JSON-LD is stale, we fall back to DOM extraction.

### Result After Fix

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| Fresh page load | ✅ Works | ✅ Works |
| SPA navigation (same company) | ❌ Wrong data | ✅ Works |
| SPA navigation (different company) | ❌ Wrong data | ⚠️ Partial data |

## Remaining Issue

**DOM extraction doesn't capture all fields** (especially founders):

```
// With JSON-LD (fresh page):
{companyName: 'Attestable', foundersCount: 3, hasJsonLd: true}

// With DOM fallback (SPA nav):
{companyName: 'Wiz', foundersCount: 0, hasJsonLd: false}
```

The DOM selectors for founders don't match Dealigence's actual structure:
```javascript
founderCard: '[class*="person"], [class*="member"], [class*="founder"]'
```

## Browser Investigation Results

### Data Flow Discovery

Using browser MCP tools, we traced how Dealigence loads company data:

1. **`__NEXT_DATA__`** - Contains basic info only (name, logoUrl, description)
2. **`_next/data/{buildId}/company/{slug}.json`** - Same basic info
3. **JSON-LD** - Contains full data including founders, BUT:
   - Only generated during server-side rendering
   - **NOT updated during SPA navigation** (stays stale)
4. **DOM Stakeholders section** - Contains full stakeholder list, IS updated during SPA navigation

### Key Finding

The detailed company data (stakeholders, funding) IS in the DOM after SPA navigation - our selectors just weren't matching Dealigence's CSS Modules class names.

Actual class names:
```
Person-module-scss-module__eMYvaG__personContainer
Person-module-scss-module__eMYvaG__personDetails
```

Our old selectors like `[class*="founder"]` don't match these.

## Solution Implemented

### Fix 1: Validate JSON-LD against URL (already done)
When JSON-LD company name doesn't match URL slug, fall back to DOM extraction.

### Fix 2: Update DOM selectors for Dealigence's CSS Modules

Updated `src/content/dealigence/selectors.ts`:
```javascript
founderCard: '[class*="personContainer"], [class*="person"], [class*="member"]',
founderDetails: '[class*="personDetails"]',
```

Updated `extractFounders()` in `extractor.ts`:
- Find Stakeholders section by h4 heading
- Extract from `personDetails > div` structure
- Include board members and directors (not just founders)

### Result

Before fix: `foundersCount: 0` during SPA navigation
After fix: `foundersCount: 10` (board members, advisors extracted)

## Remaining Considerations

1. **Founders vs Stakeholders**: Dealigence's "Stakeholders & Advisors" section contains board members and advisors, not necessarily the original founders. The JSON-LD `founders` field has the actual founding team.

2. **Trade-off**: During SPA navigation, we now get stakeholders from DOM (board/advisors) instead of founders from JSON-LD. This is better than nothing, but not identical to fresh page load data.

## Files Modified

- `src/content/dealigence/extractor.ts` - JSON-LD validation, updated extractFounders()
- `src/content/dealigence/selectors.ts` - Updated selectors for CSS Modules
- `src/popup/hooks/useDealigenceExtraction.ts` - Minor cleanup
- `src/background/index.ts` - Minor cleanup

## Testing Checklist

- [ ] Fresh page load → All data including founders from JSON-LD
- [ ] SPA navigation to company page → Data loads (stakeholders from DOM)
- [ ] SPA navigation away then back → Data loads correctly
- [ ] "Try Again" button works
- [ ] Rapid navigation between companies → No stale data shown
