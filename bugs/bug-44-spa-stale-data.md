# Bug #44: SPA Navigation Shows Stale Data

**Status**: Open
**Severity**: Critical
**Reported**: 2026-02-02

## Problem

When navigating between Dealigence company pages (SPA navigation), the extension shows stale data from the **previous** company.

### Evidence

Screenshot shows:
- Page displays "LeaFix Medical"
- Extension sidepanel shows "Wild Moose" data
- sourceUrl is CORRECT: `https://dealigence.vc/company/leafix-medical`
- But company name, description, founders are all from previous page (Wild Moose)

### Reproduction Steps

1. Open extension sidepanel
2. Navigate to a Dealigence company page (e.g., Wild Moose)
3. Wait for extraction to complete
4. Click an internal link to another company (e.g., LeaFix Medical)
5. **Bug**: Extension still shows Wild Moose data even though URL changed

---

## Root Cause Analysis

### The Race Condition

This is a **race condition** where URL detection is faster than DOM rendering:

1. User navigates from Company A → Company B (SPA navigation via History API)
2. URL updates **immediately** via `history.pushState()`
3. Chrome's `onHistoryStateUpdated` event fires
4. App.tsx detects the event and waits 500ms before extraction
5. But Dealigence takes **longer than 500ms** to re-render the DOM with new company data
6. Content script extracts from DOM that still contains Company A's data
7. Result: `sourceUrl` is correct (Company B) but all extracted data is stale (Company A)

### Why This Happens

Dealigence is a React SPA that:
- Updates URL immediately via History API
- Fetches new company data asynchronously
- Re-renders the DOM after data arrives

The 500ms delay in our code isn't sufficient for Dealigence to complete its render cycle.

### Code Flow

```
App.tsx: onHistoryStateUpdated
    ↓
    500ms delay (not enough!)
    ↓
App.tsx: checkForDealigence() → updates dealigenceUrl
    ↓
DealigenceQuickUpload: detects URL change → reset() → extractData()
    ↓
background/index.ts: EXTRACT_DEALIGENCE_DATA → sends message to content script
    ↓
content/dealigence/extractor.ts: extractCompanyData()
    ↓
    Reads DOM that still has OLD company data
    ↓
    Returns { companyName: "Wild Moose", sourceUrl: "leafix-medical", ... }
```

---

## Proposed Solution

### URL-Validated Extraction with Retry

**Core Principle**: Never return extracted data unless company name matches URL slug.

### Implementation

#### 1. Create URL Utilities (NEW FILE)

**File**: `src/lib/dealigence/urlUtils.ts`

```typescript
/**
 * Extract company slug from Dealigence URL
 * "https://dealigence.vc/company/leafix-medical" → "leafix-medical"
 */
export function extractSlugFromUrl(url: string): string | null {
  try {
    const match = new URL(url).pathname.match(/\/company\/([^\/]+)/);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Normalize company name to slug format
 * "LeaFix Medical" → "leafix-medical"
 */
export function normalizeToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if company name matches URL slug (fuzzy)
 */
export function doesCompanyMatchSlug(companyName: string, urlSlug: string): boolean {
  const normalized = normalizeToSlug(companyName);
  const slug = urlSlug.toLowerCase();

  // Exact match
  if (normalized === slug) return true;

  // One contains the other
  if (normalized.includes(slug) || slug.includes(normalized)) return true;

  // Remove common suffixes and compare
  const suffixes = ['ltd', 'inc', 'llc', 'corp', 'co', 'technologies', 'tech'];
  const removeSuffixes = (s: string) => {
    let result = s;
    for (const suffix of suffixes) {
      result = result.replace(new RegExp(`-${suffix}$`), '');
    }
    return result;
  };

  return removeSuffixes(normalized) === removeSuffixes(slug);
}
```

#### 2. Update Message Types

**File**: `src/lib/types.ts`

```typescript
| { type: 'EXTRACT_DEALIGENCE_DATA'; tabId: number; expectedSlug?: string }
```

#### 3. Update Background Script with Retry Logic

**File**: `src/background/index.ts`

Replace `handleExtractDealigenceData` with validation + retry:

```typescript
import { extractSlugFromUrl, doesCompanyMatchSlug } from '../lib/dealigence/urlUtils';

async function handleExtractDealigenceData(
  tabId: number,
  expectedSlug?: string
): Promise<MessageResponse<DealigenceCompanyData>> {
  const MAX_RETRIES = 5;
  const INITIAL_DELAY = 200;
  const MAX_DELAY = 2000;

  // Get expected slug from URL if not provided
  let urlSlug = expectedSlug;
  if (!urlSlug) {
    try {
      const tab = await chrome.tabs.get(tabId);
      urlSlug = tab.url ? extractSlugFromUrl(tab.url) : undefined;
    } catch { /* tab may be closed */ }
  }

  const tryExtract = async (): Promise<{
    data?: DealigenceCompanyData;
    error?: string;
    isStale?: boolean;
  }> => {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'EXTRACT_DEALIGENCE_DATA'
      });

      if (!response?.success || !response.data) {
        return { error: response?.error || 'Extraction failed' };
      }

      const data = response.data as DealigenceCompanyData;

      // CRITICAL: Validate company matches URL
      if (urlSlug && data.companyName) {
        if (!doesCompanyMatchSlug(data.companyName, urlSlug)) {
          console.log(`[Sevanta] Stale: got "${data.companyName}" but URL is "${urlSlug}"`);
          return { isStale: true };
        }
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed' };
    }
  };

  // Initial attempt
  let result = await tryExtract();

  // Retry with exponential backoff if stale
  let attempt = 1;
  let delay = INITIAL_DELAY;

  while ((result.isStale || result.error) && attempt <= MAX_RETRIES) {
    await new Promise(r => setTimeout(r, delay));
    result = await tryExtract();

    if (result.data) {
      return { success: true, data: result.data };
    }

    delay = Math.min(delay * 1.5, MAX_DELAY);
    attempt++;
  }

  if (result.isStale) {
    return { success: false, error: 'Page still loading. Please try again.' };
  }

  return { success: false, error: result.error || 'Extraction failed' };
}
```

#### 4. Update Switch Case Handler

**File**: `src/background/index.ts`

```typescript
case 'EXTRACT_DEALIGENCE_DATA':
  return handleExtractDealigenceData(message.tabId, message.expectedSlug);
```

#### 5. Update DealigenceQuickUpload to Pass Slug

**File**: `src/popup/components/DealigenceQuickUpload.tsx`

```typescript
import { extractSlugFromUrl } from '../../lib/dealigence/urlUtils';

// Update extractData to pass expected slug:
const extractData = useCallback(
  async (tid: number, currentUrl?: string) => {
    setLoading();
    const expectedSlug = currentUrl ? extractSlugFromUrl(currentUrl) : undefined;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXTRACT_DEALIGENCE_DATA',
        tabId: tid,
        expectedSlug,
      });
      // ... rest unchanged
    }
  },
  [setLoading, initializeFromData, setExtractionError]
);

// Update useEffect to pass url:
useEffect(() => {
  if (tabId && state.step === 'idle') {
    extractData(tabId, url || undefined);
  }
}, [tabId, url, state.step, extractData]);
```

#### 6. Reduce Initial Delay (Optional)

**File**: `src/popup/App.tsx` (line 94)

Since retry logic handles timing, reduce delay from 500ms to 200ms:
```typescript
setTimeout(() => checkForDealigence(true), 200);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/dealigence/urlUtils.ts` | NEW - slug extraction & matching |
| `src/lib/types.ts` | Add `expectedSlug` to message type |
| `src/background/index.ts` | Validation + retry logic |
| `src/popup/components/DealigenceQuickUpload.tsx` | Pass expected slug |
| `src/popup/App.tsx` | Reduce delay (optional) |

---

## Verification Plan

### Test Case 1: Basic SPA Navigation
1. Open Dealigence company page A (e.g., Wild Moose)
2. Click internal link to company B (e.g., LeaFix Medical)
3. **Expected**: Extension shows Company B data (not A)
4. Verify sourceUrl matches displayed company name

### Test Case 2: Rapid Navigation
1. Open company A
2. Quickly click to company B, then C, then D
3. **Expected**: Final state shows Company D data
4. No remnants from earlier pages

### Test Case 3: Back Button
1. Navigate A → B → C
2. Press browser back button
3. **Expected**: Extension updates to show previous company

### Test Case 4: Slow Network
1. Throttle network in DevTools (Slow 3G)
2. Navigate between companies
3. **Expected**: "Extracting..." shows while retrying, then correct data

### Test Case 5: Console Validation
1. Open DevTools console
2. Navigate between companies
3. **Expected**: See retry logs when stale data detected:
   ```
   [Sevanta] Stale: got "Wild Moose" but URL is "leafix-medical"
   [Sevanta] Extraction attempt 1/5, waiting 200ms...
   [Sevanta] Extraction succeeded on attempt 2
   ```
