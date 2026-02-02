# Dealigence Quick Upload - Product Requirements Document (PRD)

## Document Info
- **Version**: 2.0 (Post-mortem rebuild)
- **Status**: Planning / Technical Design
- **Created**: 2026-02-02
- **Feature**: Extract company data from Dealigence.vc and upload to Sevanta CRM

---

## 1. EXECUTIVE SUMMARY

### 1.1 Problem Statement
VC associates spend 5+ minutes manually entering company data from Dealigence.vc into Sevanta CRM. This is repetitive, error-prone, and interrupts their research workflow.

### 1.2 Solution
A "Quick Upload" feature in the Sevanta Uploader Chrome extension that:
1. Detects when user is on a Dealigence company page
2. Extracts company data from the DOM
3. Validates data against URL (prevents stale data bug)
4. Allows one-click upload to CRM with optional editing

### 1.3 Target Outcome
- **Time savings**: 5 minutes → 30 seconds per company
- **Accuracy**: 95%+ field mapping accuracy
- **Reliability**: 0% stale data incidents (critical fix from v1)

### 1.4 Previous Attempt (FAILED)
A v1 implementation was built and **removed** due to critical bug #44 (SPA navigation shows stale data). This PRD documents the correct approach based on post-mortem analysis.

---

## 2. HISTORY & LESSONS LEARNED

### 2.1 What Happened

1. **Feature built**: Dealigence Quick Upload with content script extraction
2. **Bug discovered**: SPA navigation showed data from previous company
3. **Root cause**: URL updates before DOM in React SPAs (race condition)
4. **Fix attempted**: Compare extracted name against previous name (delta)
5. **Fix failed**: Delta comparison is wrong; validated against previous state, not ground truth
6. **Feature removed**: Entire Dealigence integration deleted from codebase

### 2.2 Why the Fix Failed

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|------------------|
| Compared name vs previous name | Delta comparison, not ground truth | Compare name vs URL slug |
| Returned data after max retries | User sees confident-looking wrong data | Return error: "Page still loading" |
| Silent retries | User didn't know extraction was happening | Show loading spinner with retry count |
| Skipped existing docs | Bug analysis had correct solution | Always check bugs/ and docs/ first |

### 2.3 Rules for This Feature

1. **Validate against URL slug** (ground truth), never previous state
2. **Never return unvalidated data** - error state > wrong data
3. **Show loading states** during retries
4. **Test all navigation patterns**: A→B, A→B→A, rapid clicks, back button
5. **Read existing documentation** before implementing

---

## 3. USER EXPERIENCE DESIGN

### 3.1 User Flow

```
User browses Dealigence company page
    ↓
Opens Sevanta extension sidepanel
    ↓
Extension detects Dealigence page → shows Quick Upload mode
    ↓
"Extracting..." spinner (with retry count if needed)
    ↓
Preview card shows extracted data
    ├─ Company name, description, website, sector, stage
    ├─ Founder info (if available)
    └─ Duplicate warning (if similar company in CRM)
    ↓
User reviews → clicks [Edit] or [Upload]
    ↓
Confirmation modal (dry-run preview)
    ↓
Upload → Success with [View in CRM] link
```

### 3.2 Key Screens

**1. Extracting State**
```
┌────────────────────────────────────────┐
│ QUICK UPLOAD FROM DEALIGENCE           │
│                                        │
│     ⟳ (spinning)                       │
│                                        │
│   Extracting company data...           │
│   [Attempt 2/5, validating...]         │
│                                        │
│   This may take a few seconds if the   │
│   page is still loading.               │
│                                        │
│   [Cancel]                             │
└────────────────────────────────────────┘
```

**2. Preview State**
```
┌────────────────────────────────────────┐
│ QUICK UPLOAD FROM DEALIGENCE           │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Eyecuracy (EXTRACTED ✓)            │ │
│ │                                    │ │
│ │ AI-powered OCT software platform   │ │
│ │ for enhanced eye disease detection │ │
│ │                                    │ │
│ │ ⚠ Possible Duplicate (1 found)     │ │
│ │                                    │ │
│ │ Company Details                    │ │
│ │ • Website: eyecuracy.com           │ │
│ │ • Sector: Healthcare               │ │
│ │ • Stage: Fundraising               │ │
│ │ • Founder: Avery Owens             │ │
│ │                                    │ │
│ │ [Edit] [More Options ▼]            │ │
│ └────────────────────────────────────┘ │
│                                        │
│ [Review & Upload]                      │
│                                        │
│ This will create 1 deal + 1 contact    │
└────────────────────────────────────────┘
```

**3. Error State**
```
┌────────────────────────────────────────┐
│ QUICK UPLOAD FROM DEALIGENCE           │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ ⚠ Page Still Loading               │ │
│ │                                    │ │
│ │ The company data is taking longer  │ │
│ │ than usual to load.                │ │
│ │                                    │ │
│ │ [Try Again] [Go Back]              │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### 3.3 State Machine

```
IDLE
  ↓ (Dealigence URL detected)
EXTRACTING
  ↓ (content script responds)
VALIDATING
  ├─→ name matches URL slug → SUCCESS (show preview)
  └─→ name doesn't match → RETRYING (exponential backoff)
       ↓ (max 5 attempts)
       ├─→ eventually matches → SUCCESS
       └─→ still invalid → ERROR (show "Page still loading")
```

### 3.4 Accessibility Requirements

- **Font size**: 16px+ base (60+ year old users)
- **Touch targets**: 44px+ minimum height
- **Color contrast**: WCAG AAA (8.5:1 ratio)
- **Focus visible**: 4px ring on all interactive elements
- **No hover-only content**: Everything visible at rest
- **Keyboard navigation**: Tab through all controls

---

## 4. TECHNICAL ARCHITECTURE

### 4.1 Core Principle: URL Slug Validation

The **URL is ground truth**. User navigates to `/company/leafix-medical`, so extracted data MUST match "leafix-medical" before returning.

```typescript
// Ground truth validation
const urlSlug = extractSlugFromUrl(currentUrl);  // "leafix-medical"
const extractedName = data.companyName;          // "LeaFix Medical"
const normalized = normalizeToSlug(extractedName); // "leafix-medical"

if (normalized !== urlSlug && !urlSlug.includes(normalized)) {
  // DATA IS STALE - retry or return error
}
```

### 4.2 Extraction Flow with Retry

```
Background receives EXTRACT_DEALIGENCE_DATA message
    ↓
Get URL slug from tab.url (ground truth)
    ↓
Send message to content script → extract DOM
    ↓
Validate: does companyName match URL slug?
    ├─→ YES: Return success with data
    └─→ NO: Data is stale
         ├─→ attempt < 5: sleep(exponentialBackoff), retry
         └─→ attempt >= 5: Return error "Page still loading"
```

### 4.3 Exponential Backoff Schedule

```
Attempt 1: immediate
Attempt 2: +200ms
Attempt 3: +300ms (1.5x)
Attempt 4: +450ms (1.5x)
Attempt 5: +675ms (1.5x)
Total max wait: ~2.6 seconds
```

### 4.4 Message Types

```typescript
// Popup → Background
{
  type: 'EXTRACT_DEALIGENCE_DATA',
  tabId: number,
  expectedSlug?: string  // Derived from URL if not provided
}

// Background → Content Script
{
  type: 'EXTRACT_COMPANY_DATA'
}

// Content Script → Background
{
  success: boolean,
  data?: DealigenceCompanyData,
  error?: string
}

// Background → Popup
{
  success: boolean,
  data?: DealigenceCompanyData,
  error?: string,
  retryCount?: number
}
```

### 4.5 File Structure

```
src/
├── lib/
│   └── dealigence/
│       ├── urlUtils.ts      # extractSlugFromUrl, normalizeToSlug, doesCompanyMatchSlug
│       ├── types.ts         # DealigenceCompanyData, ExtractionState
│       └── transformers.ts  # mapToCrmDeal, mapToCrmContact
├── background/
│   └── index.ts             # Add handleExtractDealigenceData with validation+retry
├── content/
│   └── dealigence/
│       └── index.ts         # DOM extraction (selectors, no validation)
├── popup/
│   ├── components/
│   │   ├── DealigenceQuickUpload.tsx  # Main container
│   │   └── DealigencePreview.tsx      # Preview card
│   └── hooks/
│       └── useDealigenceExtraction.ts # State machine hook
└── manifest.json            # content_scripts, host_permissions
```

---

## 5. FIELD MAPPING (DOM → CRM)

### 5.1 Extraction Sources (Dealigence DOM)

Based on live research of 4 Dealigence company pages:

| Field | DOM Location | Selector Strategy | Notes |
|-------|--------------|-------------------|-------|
| Company Name | Page header | First `h2` in main | Always present, reliable |
| Description | After company name | First long paragraph (~300 chars) | Usually present |
| Business Tags | Tag row section | `.tags-module-scss-module__tagsRow > div` | B2B, B2B2C, Healthcare, etc. |
| Employees | Metrics grid | Text before "Employees" label | Variable, may be missing |
| Funding Status | Metrics grid | Text near "Funding Status" | "Need Funding", "Fundraising", "Funded" |
| Established | Metrics grid | Text near "Established" | Format: "March 2022" |
| Total Funding | Metrics grid | Text near "Total Funding" | Format: "$1m", "$5.2m", "Undisclosed" |
| Founders | Founders section | Avatar/profile cards | Names may be hidden |
| Advisors | Stakeholders section | Name + title cards | "Advisory Board Member", etc. |
| Website | External links | Non-Dealigence, non-LinkedIn links | Often not visible |
| Company LinkedIn | Social links | `a[href*="linkedin.com/company"]` | Usually present |

### 5.2 CRM Field Mapping

| Priority | Dealigence Field | CRM Field (dbname) | CRM Label | Transformation |
|----------|------------------|-------------------|-----------|----------------|
| **P0** | Company Name | `CompanyName` | Deal Name | Direct (required) |
| **P0** | Description | `DescriptionShort` | Description | Truncate to 5000 chars |
| **P0** | Total Funding | `Num01` | Past Investment ($M) | Parse "$1m" → 1.0 |
| **P1** | Website | `URL` | Website | Clean URL (remove params) |
| **P1** | Business Tags (first) | `IndustryID` | Industry | Map to dropdown value |
| **P1** | Funding Status | `LifeStageID` | Round | Map: "Fundraising"→"0" (Seed), etc. |
| **P1** | All metadata | `Source` | Source Notes | Formatted text block |
| **P1** | Dealigence URL | (stored in Source) | - | Include in Source Notes |
| **P2** | Established Date | (stored in Source) | - | Parse "March 2022" → date |
| **P2** | Employees | (stored in Source) | - | For context only |
| **P2** | Business Tags (all) | `Tag` | Tags | Comma-separated |

### 5.3 Contact Field Mapping (Founders)

| Dealigence Field | CRM Field (dbname) | CRM Label | Notes |
|------------------|-------------------|-----------|-------|
| Founder Name | `Name` | Contact Name | Required |
| Title | `Title` | Title | "Founder", "Co-Founder" |
| LinkedIn URL | `Notes` | Notes | No dedicated LinkedIn field |
| - | `ContactTypeID` | Relationship | Set to "MGT" (Management) |
| - | `CompanyID` | Company | Set after deal created |

### 5.4 Funding Status → Round Mapping

```typescript
const FUNDING_STATUS_MAP: Record<string, string> = {
  'Need Funding': '0',      // Seed
  'Fundraising': '0',       // Seed
  'Funded': 'PS',           // Post-seed
  'Bootstrapped': 'O',      // Other
  'Seed': '0',              // Seed
  'Series A': 'A',          // Series A
  'Series B': 'B',          // Series B
  'Series C': 'C',          // Series C
};
```

### 5.5 Industry Tag → IndustryID Mapping

```typescript
const INDUSTRY_MAP: Record<string, string> = {
  'Healthcare': 'Health',
  'Medical Devices': 'Assi',
  'SaaS': 'IT',
  'AI': 'IT',
  'Manufacturing': 'IND4',
  'Fintech': 'Fintech',
  'Computer Vision': 'IT',
  'Connected Device': 'IOT',
  // ... more mappings
};
```

### 5.6 Source Notes Template

```typescript
function formatSourceNotes(data: DealigenceCompanyData, url: string): string {
  return `=== IMPORTED FROM DEALIGENCE ===
Source: ${url}
Import Date: ${new Date().toISOString()}

Funding Status: ${data.fundingStatus || 'N/A'}
Total Funding: ${data.totalFunding || 'N/A'}
Established: ${data.established || 'N/A'}
Employees: ${data.employees || 'N/A'}
Categories: ${data.categories.join(', ')}

${data.stakeholders.length > 0 ? `
Stakeholders & Advisors:
${data.stakeholders.map(s => `- ${s.name} (${s.role})`).join('\n')}
` : ''}`;
}
```

---

## 6. TESTING REQUIREMENTS

### 6.1 Critical Test Cases

| Test | Steps | Expected Result |
|------|-------|-----------------|
| **Basic A→B** | Navigate Company A → Company B | Extension shows B data, not A |
| **A→B→A** | Navigate A→B, then back to A | Extension shows A data |
| **Rapid navigation** | Click through 4 companies quickly | Final state shows last company only |
| **Back button** | Use browser back button | Extension updates to previous company |
| **Slow network** | Throttle to 3G | Shows retrying, eventually succeeds |
| **Very slow** | Throttle to 4s+ latency | Shows "Page still loading" error |
| **Tab closed** | Close tab during extraction | Shows error, doesn't crash |

### 6.2 Validation Test Cases

| Test | Input | Expected |
|------|-------|----------|
| Exact slug match | "LeaFix Medical" vs "leafix-medical" | Valid |
| Suffix handling | "Acme Inc." vs "acme" | Valid |
| Clear mismatch | "Wild Moose" vs "leafix-medical" | Invalid (stale) |
| Partial match | "LeaFix" vs "leafix-medical" | Valid (contains) |

### 6.3 Browser Testing Matrix

- Chrome 120+ (primary)
- Extension sidepanel mode
- Network: Fast 3G, Slow 3G, Offline
- DevTools: Console for debug logs

---

## 7. IMPLEMENTATION PLAN

### Phase 1: Core Infrastructure
- [ ] Create `src/lib/dealigence/urlUtils.ts`
- [ ] Create `src/lib/dealigence/types.ts`
- [ ] Update `src/lib/types.ts` with message types
- [ ] Update `manifest.json` (content script, permissions)

### Phase 2: Content Script
- [ ] Create `src/content/dealigence/index.ts`
- [ ] Implement DOM selectors
- [ ] Add error handling for missing elements
- [ ] Update `vite.config.ts` for content script build

### Phase 3: Background Handler
- [ ] Add `handleExtractDealigenceData()` to background/index.ts
- [ ] Implement URL slug validation
- [ ] Implement exponential backoff retry
- [ ] Add console logging for debugging

### Phase 4: UI Components
- [ ] Create `useDealigenceExtraction.ts` hook
- [ ] Create `DealigenceQuickUpload.tsx` component
- [ ] Create `DealigencePreview.tsx` component
- [ ] Update `App.tsx` with detection logic
- [ ] Update `TabNav.tsx` with new mode

### Phase 5: Testing & Polish
- [ ] Manual testing: all navigation patterns
- [ ] Manual testing: network conditions
- [ ] Accessibility audit
- [ ] Console logging cleanup

---

## 8. FILES TO CONSOLIDATE/REMOVE

After PRD approval, consolidate documentation:

**Keep (as reference):**
- `bugs/bug-44-spa-stale-data.md` - Root cause analysis
- `tasks/lessons.md` - Lessons learned

**Update:**
- `tasks_design/Dealigence_integration/2.DEALIGENCE_FIELD_MAPPING.md` - Update with live DOM research findings

**Remove (replaced by this PRD):**
- `tasks_design/Dealigence_integration/1.TECHNICAL_SPECIFICATION.md` - Old spec, doesn't include SPA fix

**Create:**
- This PRD becomes the single source of truth for implementation

---

## 9. SUCCESS CRITERIA

### Must Have (MVP)
- [ ] Extract company name, description from Dealigence
- [ ] Validate against URL slug (prevents stale data)
- [ ] Show loading state during extraction
- [ ] Show error state after max retries
- [ ] Upload to CRM with one click
- [ ] Duplicate detection before upload

### Should Have
- [ ] Edit extracted data before upload
- [ ] **Auto-create founder contact if found** (user decided: auto-include, removable in edit)
- [ ] Cache briefly for back/forward navigation
- [ ] Map funding status to Round field

### Nice to Have
- [ ] Map all business tags to Tags field
- [ ] Parse funding amounts to Num01
- [ ] Auto-detect sector from categories

---

## 10. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Dealigence changes DOM | Extraction breaks | Use flexible selectors, monitor for changes |
| SPA timing varies | Some pages slow | Exponential backoff handles variable timing |
| No website URL | Missing data | Accept gracefully, user can edit |
| Duplicate detection false positives | User confusion | Allow user to proceed anyway |

---

## APPROVAL

This PRD is ready for review. Implementation should follow the architecture exactly as specified to prevent the SPA navigation bug from recurring.

**Key principle to remember**: Validate against URL slug (ground truth), never return unvalidated data.
