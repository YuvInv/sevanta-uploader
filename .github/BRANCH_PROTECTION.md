# Branch Protection - Git Pre-Push Hook

## ✅ Active Protection

A **pre-push git hook** is installed that blocks ALL direct pushes to the main branch.

## How It Works

When you try to push to main, the hook intercepts and shows:

```
❌ ERROR: Direct push to 'main' branch is FORBIDDEN

Please follow the proper workflow:
  1. Create a feature branch: git checkout -b feature/your-feature
  2. Make your changes and commit
  3. Push your branch: git push -u origin feature/your-feature
  4. Create a Pull Request on GitHub
  5. Wait for approval and merge
```

## Installation

The hook is installed automatically when you run:
```bash
npm install
```

Or manually:
```bash
./scripts/setup-git-hooks.sh
```

## Tested & Verified

This hook has been tested and successfully blocks:
- Direct pushes to main
- Accidental commits going to main
- Works for both humans and AI assistants (Claude Code)

## For Claude Code / AI Assistants

**You CANNOT push to main.** The hook will block you.

Always use feature branches and PRs. No exceptions.
