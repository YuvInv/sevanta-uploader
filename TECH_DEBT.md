# Tech Debt Remediation Tracker

This document tracks the progress of the comprehensive tech debt remediation for the Sevanta Uploader Chrome Extension.

**Started:** 2026-02-01
**GitHub Issues:** [tech-debt label](https://github.com/YuvInv/sevanta-uploader/labels/tech-debt)

---

## Phase 1: Critical Fixes - COMPLETED

**GitHub Issue:** [#17](https://github.com/YuvInv/sevanta-uploader/issues/17) (Closed)
**PR:** [#23](https://github.com/YuvInv/sevanta-uploader/pull/23) (Merged)

- [x] Fix malformed URLs in api.ts
- [x] Create ErrorBoundary component
- [x] Remove console.logs from production code

---

## Phase 2: Code Quality - COMPLETED

**GitHub Issue:** [#18](https://github.com/YuvInv/sevanta-uploader/issues/18) (Closed)
**PR:** [#24](https://github.com/YuvInv/sevanta-uploader/pull/24) (Merged)

- [x] Refactor App.tsx (218 lines, extracted useUploadWorkflow hook)
- [x] Consolidate duplicated API functions
- [x] Add test suite (56 tests for validation.ts and csv.ts)

---

## Phase 3: Documentation - COMPLETED

**GitHub Issue:** [#19](https://github.com/YuvInv/sevanta-uploader/issues/19) (Closed)
**PR:** [#26](https://github.com/YuvInv/sevanta-uploader/pull/26) (Merged)

- [x] README.md with overview, installation, usage, badges
- [x] GitHub templates (bug, feature, PR)
- [x] Closed stale Issue #4, synced TODO.md, deleted Myideas.md

---

## Phase 4: Claude Ecosystem - COMPLETED

**GitHub Issue:** [#20](https://github.com/YuvInv/sevanta-uploader/issues/20) (Closed)
**PR:** [#27](https://github.com/YuvInv/sevanta-uploader/pull/27)

- [x] Created `/sync-todos` skill (`~/.claude/skills/sync-todos.md`)
- [x] Created `/build-extension` skill (`~/.claude/skills/build-extension.md`)
- [x] Created `extension-dev` subagent (`~/.claude/agents/extension-dev.md`)
- [x] Populated KNOWLEDGE_GRAPH.md with 15+ entries

---

## Phase 5: Hardening - COMPLETED

**GitHub Issue:** [#21](https://github.com/YuvInv/sevanta-uploader/issues/21)
**Branch:** `fix/tech-debt-phase-5`

- [x] Created `src/lib/constants.ts` with all centralized values
- [x] Added Chrome API guards in hooks
- [x] Added 10MB file size limit for CSV uploads
- [x] Improved rate limiter with timeout, queue overflow protection
- [x] Fixed email regex to reject invalid emails like `a@b.c`

---

## Phase 6: UX & Performance Improvements

**GitHub Issue:** [#25](https://github.com/YuvInv/sevanta-uploader/issues/25)
**Branch:** `fix/ux-performance-improvements`
**Priority:** High (user-reported issues)

### Task 6.1: Debug Duplicate Check Performance (CRITICAL)
**Problem:** "Continue to Review" button takes extremely long (45+ second timeout)
**Evidence:** Console error: `cURL Error#: Operation timed out after 45001 milliseconds with 0 bytes received`
**Location:** `useDuplicateCheck.ts`, `api.ts` (checkDuplicate function)

- [ ] Debug the duplicate checking API calls - identify bottleneck
- [ ] Profile which API calls are slow (text search vs semantic search)
- [ ] Consider batching or parallelizing duplicate checks
- [ ] Add timeout handling with graceful degradation
- [ ] Consider caching previous duplicate check results

### Task 6.2: Add Loading UX During Duplicate Check
**Problem:** No visual feedback while system checks for existing companies in CRM
**Impact:** Users think the app is frozen

- [ ] Add loading screen/spinner when "Continue to Review" is clicked
- [ ] Display explanatory text: "Checking for existing companies in CRM..."
- [ ] Show progress indicator (e.g., "Checking 5 of 20 companies...")
- [ ] Consider a progress bar or animated state

### Task 6.3: Auto-Discard Duplicates
**Problem:** When duplicate is found, user must manually click "discard" - tedious
**Expected behavior:** System should auto-discard duplicates and explain to user

- [ ] Auto-set `skipped: true` for companies with `duplicate.isDuplicate === true`
- [ ] Show notification/summary: "X companies were auto-discarded (already exist in CRM)"
- [ ] Add option to "Review discarded" if user wants to override
- [ ] Update UI to clearly show which companies were auto-discarded vs manually discarded

---

## Session Notes

### 2026-02-01: Phase 1 & 2 Completed
- Created TECH_DEBT.md tracking file
- Created GitHub issues for each phase (#17-#21, #25)
- Phase 1: Fixed URLs, added ErrorBoundary, removed console.logs (PR #23 merged)
- Phase 2: Refactored App.tsx, consolidated API, added 56 tests (PR #24)

### 2026-02-01: Phase 3 & 4 Completed
- Created GitHub issue/PR templates (PR #26 merged)
- Synced TODO.md with GitHub Issues
- Closed stale Issue #4 (CI/CD complete)
- Deleted Myideas.md (migrated to issues)
- Added Phase 6 for UX/performance issues (#25)
- Created /sync-todos and /build-extension skills
- Created extension-dev subagent
- Populated KNOWLEDGE_GRAPH.md

### 2026-02-01: Phase 5 Completed
- Created src/lib/constants.ts for centralized configuration
- Added Chrome API availability guards in hooks
- Added 10MB file size limit for CSV uploads
- Improved rate limiter with timeout and queue overflow protection
- Fixed email validation to require proper TLD (2+ chars)
