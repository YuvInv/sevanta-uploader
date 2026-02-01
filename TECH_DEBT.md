# Tech Debt Remediation Tracker

This document tracks the progress of the comprehensive tech debt remediation for the Sevanta Uploader Chrome Extension.

**Started:** 2026-02-01
**GitHub Issues:** [tech-debt label](https://github.com/YuvInv/sevanta-uploader/labels/tech-debt)

---

## Phase 1: Critical Fixes

**GitHub Issue:** [#17](https://github.com/YuvInv/sevanta-uploader/issues/17)
**Branch:** `fix/tech-debt-phase-1`

### Task 1.1: Fix Malformed URLs in api.ts
- [ ] Verify URLs at lines 32, 221, 241, 258, 363, 431 have space issues
- [ ] Remove all spaces from URL constructions
- [ ] Test API calls work correctly

### Task 1.2: Add React Error Boundary
- [ ] Create `src/popup/components/ErrorBoundary.tsx`
- [ ] Wrap main App component
- [ ] Add friendly error UI with retry option

### Task 1.3: Remove Console.logs
- [ ] Remove 8 console.logs from `api.ts`
- [ ] Remove 3 console.logs from `background/index.ts`
- [ ] Remove 18 console.logs from `App.tsx`
- [ ] Consider adding proper logging utility

---

## Phase 2: Code Quality

**GitHub Issue:** [#18](https://github.com/YuvInv/sevanta-uploader/issues/18)
**Branch:** `refactor/tech-debt-phase-2`

### Task 2.1: Refactor App.tsx
- [ ] Extract `ConnectionStatus.tsx` component
- [ ] Extract `CsvUploadStep.tsx` component
- [ ] Extract `ColumnMappingStep.tsx` component
- [ ] Extract `ReviewStep.tsx` component
- [ ] Extract `UploadStep.tsx` component
- [ ] Create `useUploadWorkflow.ts` hook
- [ ] Reduce App.tsx to < 200 lines

### Task 2.2: Consolidate Duplicated API Functions
- [ ] Create generic `fetchSchema<T>(endpoint)` function
- [ ] Create generic `searchDeals(type, query)` function
- [ ] Remove duplicated schema fetchers (lines 94-136 vs 168-203)
- [ ] Remove duplicated search functions (lines 219-269)

### Task 2.3: Fix Contact Creation Error Handling
- [ ] Surface contact errors to user (App.tsx:265-268)
- [ ] Add `contactError` state to Company type
- [ ] Display warning badge on companies with failed contacts

### Task 2.4: Add Test Suite
- [ ] Set up Vitest configuration
- [ ] Write tests for `validation.ts`
- [ ] Write tests for `csv.ts`
- [ ] Write tests for `useDuplicateCheck.ts`
- [ ] Target 80% coverage on critical paths

---

## Phase 3: Documentation

**GitHub Issue:** [#19](https://github.com/YuvInv/sevanta-uploader/issues/19)
**Branch:** `docs/tech-debt-phase-3`

### Task 3.1: Create README.md
- [ ] Project overview
- [ ] Installation instructions
- [ ] Usage guide with screenshots
- [ ] Development setup

### Task 3.2: Create GitHub Templates
- [ ] `.github/ISSUE_TEMPLATE/bug.md`
- [ ] `.github/ISSUE_TEMPLATE/feature.md`
- [ ] `.github/pull_request_template.md`

### Task 3.3: Clean Up GitHub Issues
- [ ] Close Issue #4 (CI/CD already implemented)
- [ ] Sync TODO.md with GitHub Issues
- [ ] Update any stale issues

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

## Completed Items

<!-- Move completed items here with date stamps -->

---

## Session Notes

### 2026-02-01: Initial Setup
- Created TECH_DEBT.md tracking file
- Created 5 GitHub issues for each phase
- Updated KNOWLEDGE_GRAPH.md with user preferences and project entry

---

## References

- **Plan Document:** See original remediation plan in Claude conversation
- **Transcript:** `/Users/yuvalnaor/.claude/projects/-Users-yuvalnaor-repos-sevanta-uploader/4c233823-58ad-4f79-bd57-0511857cb9f5.jsonl`
