# Lessons Learned

This file documents mistakes, gotchas, and rules discovered while working on this project. The goal is to prevent repeating the same mistakes.

---

## 2026-02-02: Failed Dealigence Quick Upload Feature (Issue #44)

### What Happened

Built an entire "Dealigence Quick Upload" feature that extracts company data from dealigence.vc pages. The feature had a critical SPA navigation bug where stale data was shown after navigating between companies.

Attempted to fix the bug with a "previous name comparison" approach, which was fundamentally wrong.

**The entire feature was removed.**

### Why the Fix Failed

1. **Validated against delta, not ground truth**
   - Compared extracted name against previous name
   - Should have validated against URL slug (the source of truth)
   - Navigation A → B → A would break the delta comparison

2. **Returned stale data after max retries**
   - After 5 retries, returned whatever it had
   - User saw confident-looking WRONG data
   - Should have returned error: "Page still loading"

3. **No loading UX during retries**
   - Retries happened silently in background
   - User saw instant (stale) data

4. **Didn't read existing documentation**
   - `bugs/bug-44-spa-stale-data.md` had complete, correct solution
   - Skipped it and implemented wrong approach

### The Correct Approach (Never Implemented)

```typescript
// Validate against URL slug (ground truth)
const urlSlug = extractSlugFromUrl(url);
if (!doesCompanyMatchSlug(data.companyName, urlSlug)) {
  // Retry - data is stale
}

// Never return unvalidated data
if (stillStaleAfterRetries) {
  return { error: "Page still loading. Please try again." };
}
```

### Files Removed

- `src/popup/components/DealigenceQuickUpload.tsx`
- `src/popup/components/DealigencePreview.tsx`
- `src/popup/hooks/useDealigenceUpload.ts`
- `src/content/dealigence/` (entire directory)
- Dealigence-related code from App.tsx, TabNav.tsx, background/index.ts, types.ts
- Content script and host permissions from manifest.json

### Rules to Follow

1. **Always check for existing docs before implementing**
   - Look in `bugs/`, `docs/`, issue comments
   - Someone may have already analyzed the problem correctly

2. **Validate against ground truth, not deltas**
   - URL is ground truth (user's intent)
   - Previous state is just a delta

3. **Never return unvalidated data**
   - Error state is better than wrong data
   - User can retry; they can't un-see wrong data

4. **Show loading states during async operations**
   - User needs feedback that something is happening

5. **Test in browser, not just build**
   - `npm run build` passing doesn't mean feature works

6. **For timing-sensitive features (SPA, race conditions)**
   - Observe actual behavior with DevTools before implementing
   - Plan for network delays, DOM update delays
   - Consider all navigation patterns (A→B, A→B→A, back button, rapid clicks)

---

## General Rules

### Chrome Extension Development

- Content scripts run in page context - DOM may not be ready
- SPA navigation fires `onHistoryStateUpdated` before DOM updates
- URL updates are instant; DOM updates are async
- Always validate extracted data against known-good source

### Timing-Sensitive Features

- Race conditions need ground truth validation, not delta comparison
- Exponential backoff doesn't fix wrong validation logic
- Show loading UX during retries
- Set reasonable max attempts and fail explicitly

### Documentation

- Read existing analysis before implementing
- Update lessons when mistakes are made
- Link to related docs (bug files, issues)

---

## Links

- [Bug #44 Analysis](../bugs/bug-44-spa-stale-data.md) - Contains correct solution (never implemented)
- [GitHub Issue #44](https://github.com/YuvInv/sevanta-uploader/issues/44)
