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

## Phase 3: Documentation - IN PROGRESS

**GitHub Issue:** [#19](https://github.com/YuvInv/sevanta-uploader/issues/19)
**Branch:** `docs/tech-debt-phase-3`

### Task 3.1: README.md
- [x] Project overview
- [x] Installation instructions
- [x] Usage guide
- [x] Tech stack badges

### Task 3.2: Create GitHub Templates
- [x] `.github/ISSUE_TEMPLATE/bug.md`
- [x] `.github/ISSUE_TEMPLATE/feature.md`
- [x] `.github/pull_request_template.md`

### Task 3.3: Clean Up GitHub Issues
- [x] Close Issue #4 (CI/CD already implemented)
- [x] Sync TODO.md with GitHub Issues
- [x] Delete Myideas.md (content migrated to issues)

---

## Phase 4: Claude Ecosystem

**GitHub Issue:** [#20](https://github.com/YuvInv/sevanta-uploader/issues/20)
**Branch:** `chore/tech-debt-phase-4`

### Task 4.1: Create /sync-todos Skill
- [ ] Create `~/.claude/skills/sync-todos.md`
- [ ] Implement bidirectional sync logic
- [ ] Test with TODO.md and GitHub Issues

### Task 4.2: Create /build-extension Skill
- [ ] Create `~/.claude/skills/build-extension.md`
- [ ] Automate npm build + Chrome load instructions

### Task 4.3: Create Extension-Dev Subagent
- [ ] Create `~/.claude/agents/extension-dev.md`
- [ ] Specialize for Chrome Extension patterns

### Task 4.4: Populate KNOWLEDGE_GRAPH.md
- [ ] Add Sevanta API quirks (dbname vs label)
- [ ] Add project patterns and conventions
- [ ] Add user preferences learned
- [ ] Target 10+ meaningful entries

---

## Phase 5: Hardening

**GitHub Issue:** [#21](https://github.com/YuvInv/sevanta-uploader/issues/21)
**Branch:** `fix/tech-debt-phase-5`

### Task 5.1: Create Constants File
- [ ] Create `src/lib/constants.ts`
- [ ] Extract `600ms` delay value
- [ ] Extract `0.8` similarity threshold
- [ ] Extract `3600000ms` cache TTL
- [ ] Extract other hardcoded values

### Task 5.2: Add Input Validation
- [ ] Add null checks in `useDuplicateCheck.ts`
- [ ] Add null checks in `useSevantaApi.ts`
- [ ] Add chrome API availability guards
- [ ] Add file size limits to CSV upload (10MB max)

### Task 5.3: Fix Rate Limiter
- [ ] Add promise rejection handling (api.ts:6-26)
- [ ] Add timeout mechanism
- [ ] Add queue overflow protection

### Task 5.4: Fix Email Validation
- [ ] Improve regex at `validation.ts:104`
- [ ] Reject invalid emails like `a@b.c`

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

### 2026-02-01: Phase 3 Progress
- Created GitHub issue/PR templates
- Synced TODO.md with GitHub Issues
- Closed stale Issue #4 (CI/CD complete)
- Deleted Myideas.md (migrated to issues)
- Added Phase 6 for UX/performance issues (#25)
