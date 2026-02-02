# Sevanta Uploader - TODO

> All tasks are tracked in [GitHub Issues](https://github.com/YuvInv/sevanta-uploader/issues)

---

## High Priority
- [ ] **IVC Integration** ([#3](https://github.com/YuvInv/sevanta-uploader/issues/3)) - Extract companies from IVC database

---

## Dealigence Quick Upload - Known Issues

The Dealigence Quick Upload feature is now implemented but has the following known bugs and improvements needed:

### Bugs
1. **SPA Navigation Data Stale** - When navigating to 2nd+ company page, the first company's data still shows (extraction doesn't re-trigger properly after first company)
2. **Website URL Extraction Fails** - Company URL/website fails to extract most of the time

### Missing Features
3. **Funding → PastInvestments Mapping** - Funding amount isn't being filled into the PastInvestments CRM field
4. **UX Inconsistency** - No alignment between Quick Upload, CSV Upload, and Lookup modes - edit fields functionality looks different across modes
5. **Preview Shows Unused Data** - Quick Upload preview shows data not sent to CRM (e.g., Categories) - should only show data that will be uploaded
6. **Unmapped Data to Comments** - Data that can't be mapped to a CRM field should be summarized and added to company comments section



---

### AI Features
- [ ] **Company Enrichment** ([#6](https://github.com/YuvInv/sevanta-uploader/issues/6)) - Perplexity integration for auto-enrichment
- [ ] **News Auto-Updates** ([#5](https://github.com/YuvInv/sevanta-uploader/issues/5)) - Crawl news for funding/company updates

---

## Completed

- [x] **Bulk Contact Lookup** ([#14](https://github.com/YuvInv/sevanta-uploader/issues/14)) - Contact lookup with match detection (PR #41)
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
