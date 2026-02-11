# Branch Protection Setup

## Current Safeguards

### 1. Git Pre-Push Hook ✅

A pre-push hook is installed that **blocks direct pushes to main branch**.

**Installation:**
```bash
./scripts/setup-git-hooks.sh
```

This hook will prevent accidental direct pushes and remind you to follow the proper PR workflow.

### 2. GitHub Branch Protection ❌ (Requires GitHub Pro)

GitHub branch protection rules require either:
- GitHub Pro subscription
- Public repository

**Recommended settings when available:**
- Require pull request reviews before merging (1 approval)
- Dismiss stale pull request approvals when new commits are pushed
- Require status checks to pass before merging
- Require linear history
- Do not allow force pushes
- Do not allow deletions

**To enable (when available):**
```bash
# Make repository public, OR upgrade to GitHub Pro, then run:
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/YuvInv/sevanta-uploader/branches/main/protection \
  -f required_status_checks='{"strict":true,"contexts":[]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":1}' \
  -f restrictions=null \
  -f allow_force_pushes=false \
  -f allow_deletions=false
```

## Workflow Enforcement

All changes MUST follow this workflow (see CLAUDE.md):

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit
3. Push branch: `git push -u origin feature/your-feature`
4. Create Pull Request on GitHub
5. Wait for CI to pass
6. Get approval
7. Merge PR

**NO direct pushes to main are allowed.**

## For Claude Code / AI Assistants

The pre-push hook will block you from pushing to main. This is intentional.

Always create a feature branch and PR, even for:
- Bug fixes
- Documentation updates
- Workflow changes
- Configuration changes

No exceptions.
