# Sevanta Uploader - TODO

> All tasks are tracked in [GitHub Issues](https://github.com/YuvInv/sevanta-uploader/issues)

---

## High Priority

- [ ] **IVC Integration** ([#3](https://github.com/YuvInv/sevanta-uploader/issues/3)) - Extract companies from IVC database

---

## Dealigence Quick Upload - Known Issues

The Dealigence Quick Upload feature is implemented but has the following known bugs and improvements needed:

### Bugs (High Priority)
- [ ] **Duplicate Check Before Upload** ([#52](https://github.com/YuvInv/sevanta-uploader/issues/52)) - Check CRM for duplicates and alert user (MOST important!)
- [ ] **Stage/Employees Extraction Broken** ([#57](https://github.com/YuvInv/sevanta-uploader/issues/57)) - Extraction logic isn't right
- [ ] **Website Not Extracted** ([#58](https://github.com/YuvInv/sevanta-uploader/issues/58)) - Website URL extraction fails
- [ ] **Inconsistent Data on Reload vs Back** ([#61](https://github.com/YuvInv/sevanta-uploader/issues/61)) - Different data depending on navigation method
- [ ] **SPA Navigation Data Stale** ([#44](https://github.com/YuvInv/sevanta-uploader/issues/44)) - 2nd+ company shows stale data (partial fix in PR #43)

### Bugs (Medium Priority)
- [ ] **Company Name Uses URL Not Page** ([#56](https://github.com/YuvInv/sevanta-uploader/issues/56)) - Should use page source code
- [ ] **Total Funding Logic Wrong** ([#59](https://github.com/YuvInv/sevanta-uploader/issues/59)) - Value extraction wrong in some cases
- [ ] **Hide Quick Upload When Not on Company** ([#60](https://github.com/YuvInv/sevanta-uploader/issues/60)) - Only show basic 2 tabs when not on company page

### Missing Features
- [ ] **Add More Fields to Upload** ([#53](https://github.com/YuvInv/sevanta-uploader/issues/53)) - Additional fields through Dealigence
- [ ] **Auto-Set CRM Fields** ([#54](https://github.com/YuvInv/sevanta-uploader/issues/54)) - Set some fields automatically on every upload
- [ ] **Preview All Uploaded Data** ([#55](https://github.com/YuvInv/sevanta-uploader/issues/55)) - Increase preview with all added fields
- [ ] **UX Consistency** ([#47](https://github.com/YuvInv/sevanta-uploader/issues/47)) - Align edit fields across modes

---

### AI Features
- [ ] **Company Enrichment** ([#6](https://github.com/YuvInv/sevanta-uploader/issues/6)) - Perplexity integration for auto-enrichment
- [ ] **News Auto-Updates** ([#5](https://github.com/YuvInv/sevanta-uploader/issues/5)) - Crawl news for funding/company updates

---

## Completed

- [x] **Funding → PastInvestments** ([#46](https://github.com/YuvInv/sevanta-uploader/issues/46)) - Map funding to CRM field
- [x] **Website URL Extraction** ([#45](https://github.com/YuvInv/sevanta-uploader/issues/45)) - DOM fallback for URL extraction (PR #43)
- [x] **Preview Shows Mapped Data** ([#48](https://github.com/YuvInv/sevanta-uploader/issues/48)) - Redesigned preview UX (PR #43)
- [x] **Unmapped Data to Comments** ([#49](https://github.com/YuvInv/sevanta-uploader/issues/49)) - Extra data added as comments (PR #43)
- [x] **Dealigence Integration** ([#2](https://github.com/YuvInv/sevanta-uploader/issues/2)) - Quick Upload from Dealigence pages (PR #43)
- [x] **Dealigence Auto-Detection** ([#42](https://github.com/YuvInv/sevanta-uploader/issues/42)) - Auto-detect Dealigence pages (PR #43)
- [x] **Bulk Contact Lookup** ([#14](https://github.com/YuvInv/sevanta-uploader/issues/14)) - Contact lookup with match detection (PR #43)
- [x] **Duplicate Check Too Slow** ([#35](https://github.com/YuvInv/sevanta-uploader/issues/35)) - Fixed with optimized API calls (PR #39)
- [x] **Progress Doesn't Update** ([#36](https://github.com/YuvInv/sevanta-uploader/issues/36)) - Fixed progress indicator (PR #39)
- [x] **Table Layout Issues** ([#37](https://github.com/YuvInv/sevanta-uploader/issues/37)) - Fixed column widths (PR #39)
- [x] **Redesign Editor** ([#38](https://github.com/YuvInv/sevanta-uploader/issues/38)) - Complete redesign with Warm Professional theme (PR #41)
- [x] **Phase 6: UX & Performance** ([#25](https://github.com/YuvInv/sevanta-uploader/issues/25)) - Duplicate check speed, loading UX, auto-discard
- [x] **Fix Failing Lint Test in GitHub Actions** ([#30](https://github.com/YuvInv/sevanta-uploader/issues/30)) - CI lint check is failing
- [x] **Tech Debt Phase 5: Hardening** ([#21](https://github.com/YuvInv/sevanta-uploader/issues/21)) - Constants, validation, rate limiter
- [x] **Tech Debt Phase 4: Claude Ecosystem** ([#20](https://github.com/YuvInv/sevanta-uploader/issues/20)) - Skills, subagents, knowledge graph
- [x] **Tech Debt Phase 3: Documentation** ([#19](https://github.com/YuvInv/sevanta-uploader/issues/19)) - README, templates, cleanup
- [x] **Tech Debt Phase 2: Code Quality** ([#18](https://github.com/YuvInv/sevanta-uploader/issues/18)) - App refactor, API consolidation, tests
- [x] **Tech Debt Phase 1: Critical Fixes** ([#17](https://github.com/YuvInv/sevanta-uploader/issues/17)) - URLs, ErrorBoundary, console.logs
- [x] **CI/CD Pipeline** ([#4](https://github.com/YuvInv/sevanta-uploader/issues/4)) - GitHub Actions for build/release
- [x] **Discard Rows** ([#9](https://github.com/YuvInv/sevanta-uploader/issues/9)) - Allow discarding duplicate rows
- [x] **Fix Contacts Upload** ([#10](https://github.com/YuvInv/sevanta-uploader/issues/10)) - Contact creation and linking
- [x] **Automatic Default Fields** ([#8](https://github.com/YuvInv/sevanta-uploader/issues/8)) - Source Notes, DealTypes, SourceType
- [x] **Remove View Schema** ([#7](https://github.com/YuvInv/sevanta-uploader/issues/7)) - Removed debug feature
- [x] **Simplified CSV Template** ([#1](https://github.com/YuvInv/sevanta-uploader/issues/1)) - Common fields only
- [x] **Duplicate Check** - Using `_text=` and `_ss=` search
- [x] **Contacts/Founders Upload** - CSV with founder columns
- [x] **CSV Template Download** - Field descriptions included
- [x] **Side Panel UI** - Modern interface
