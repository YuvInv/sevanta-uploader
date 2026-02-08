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
   - `docs/bugs/bug-44-spa-stale-data.md` had complete, correct solution
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
   - Look in `docs/bugs/`, `docs/`, issue comments
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

---

## 2026-02-05: Issue #54 - Four Failed Fix Attempts

### What Happened

Bug: Quick Upload data doesn't load consistently during navigation. After 4+ attempts to fix it, all failed. Each attempt followed the same broken pattern.

### The Broken Pattern

1. Read code
2. Theorize: "This appears to be a race condition with..."
3. Implement fix based on theory
4. Fix doesn't work
5. Repeat with new theory

### Why Every Attempt Failed

**Never observed actual behavior.** Every "root cause analysis" was speculation dressed as analysis. Phrases like "This appears to be..." and "The issue is likely..." are red flags - they indicate guessing, not observing.

### Specific Failed Approaches

1. Added `chrome.tabs.onUpdated` listener (theory: initial navigation not detected)
2. Moved `sourceUrl` capture to start of extraction (theory: URL captured too late)
3. Added hyphen-stripped name matching (theory: "UnitySCM" vs "unity-scm" mismatch)
4. Added 100ms delay before extraction (theory: SPA needs stabilization time)

All reverted. None were based on observed evidence.

### The Rule

**OBSERVATION BEFORE HYPOTHESIS**

Before writing any statement about a bug's cause:
1. Use browser DevTools or MCP tools to observe actual behavior
2. Capture console logs during reproduction
3. See what messages are sent/received
4. Document what was OBSERVED, not theorized

Banned until observation: "appears to be", "likely", "probably", "I think"
Required: "I observed [X] in [console/network/DOM]"

---

---

## 2026-02-05: Dealigence Extraction - Architectural Incompatibility

### What We Discovered

After Issue #54's failed fixes, proper browser investigation revealed a **fundamental architectural problem**, not a fixable bug.

### The Architecture

| Data Source | When Available | Contains |
|-------------|---------------|----------|
| JSON-LD | Full page load only | Complete data (founders) |
| DOM Stakeholders | Always | Board/advisors (NOT founders) |

**The trap**: JSON-LD has the best data but is NEVER updated during SPA navigation. We kept trying to "fix" code that couldn't access data that simply wasn't there.

### Why Patches Failed

All fixes addressed symptoms, not root cause:
- URL validation → Correctly detected staleness, but fallback data was incomplete
- Better selectors → Extracted stakeholders, but stakeholders ≠ founders
- Timing fixes → DOM updates fine; JSON-LD never updates

### The Lesson

**Patches can't fix architecture.**

Before attempting multiple fix iterations:
1. Map all data sources completely
2. Verify the data you need is actually accessible
3. If it's not accessible, no code change will help

### Decision

Approach deprecated. Full postmortem: `docs/dealigence-extraction-postmortem.md`

---

## 2026-02-08: IVC Quick Upload - Broke Working Feature, Zero Browser Testing

### What Happened

Implemented a large refactor (IVC Quick Upload + unified multi-site architecture) that:
1. **Broke the working Dealigence Quick Upload** - renamed message types (`DEALIGENCE_URL_CHANGED` → `QUICK_UPLOAD_URL_CHANGED`), changed `handleGetActiveTabInfo` return shape (`isDealigenceCompanyPage` → `site`), renamed AppMode from `'dealigence'` → `'quickUpload'`. These breaking changes cascaded through the entire flow.
2. **Built IVC extraction based on guessed DOM selectors** - wrote selectors (`.cc_header_stickyMain`, `.cc_box_header`, `.divTag`) without ever loading an actual IVC page in the browser to verify they exist and work correctly.
3. **Never tested in the browser** - built the feature, ran `npm run build` + `npm run check`, and declared it done. Zero browser testing.

### Every Rule Violated

1. **"Verification Before Done"** (CLAUDE.md): "Never mark a task complete without proving it works. Run tests, check the build, verify the feature manually if needed." - I only ran build/lint, never loaded the extension.

2. **"Observation Before Hypothesis"** (CLAUDE.md, MEMORY.md): The IVC selectors were pure guesswork. I never opened an IVC page to observe the actual DOM structure. Even though I had browser MCP tools available.

3. **"Test in browser, not just build"** (lessons.md, line 79): This exact rule already existed from a previous failure. I ignored it.

4. **Plan mode systematic-debugging skill**: Available and listed. Never used.

5. **"Minimal Impact"** (CLAUDE.md): "Only touch what's necessary. Avoid introducing bugs in unrelated areas." - Renamed working message types and broke the existing Dealigence feature.

### Root Cause: Rushing Through Implementation

I treated this as a code-generation task: read the plan → write all the files → build → done. The plan was detailed enough that I trusted it would work without verification. This is the same mistake as theorizing without observing, just applied to feature development instead of debugging.

### Rules (Additive to Existing)

1. **Never rename working message types / interfaces in a multi-site refactor** - Add new ones, keep old ones working, migrate incrementally. Breaking renames break existing features.

2. **For new site integrations**: FIRST observe the real page DOM with browser MCP tools, THEN write selectors. Never guess selectors from documentation or assumptions.

3. **For any feature that involves Chrome Extension content scripts**: Load the extension, navigate to the target page, verify the content script loads and extracts data correctly. `npm run build` passing is necessary but NOT sufficient.

4. **Incremental delivery > big-bang refactor**: Should have added IVC as a second parallel path first (keeping Dealigence untouched), verified IVC works, THEN refactored to unified architecture.

### What Should Have Happened

1. Open IVC company page in browser
2. Use MCP tools to observe actual DOM structure
3. Write selectors based on observed DOM
4. Add IVC support WITHOUT changing any Dealigence code
5. Build, load extension, test IVC extraction in browser
6. Only THEN refactor to unified architecture
7. Re-test Dealigence after refactor

---

## Links

- [Bug #44 Analysis](./bugs/bug-44-spa-stale-data.md) - Contains correct solution (never implemented)
- [GitHub Issue #44](https://github.com/YuvInv/sevanta-uploader/issues/44)
- [Notion Issue #54](NOTION_URL_REDACTED) - Quick Upload reliability bug
- [Dealigence Postmortem](./dealigence-extraction-postmortem.md) - Full technical analysis
