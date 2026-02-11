#!/bin/bash

# Setup script to install git hooks that prevent direct pushes to main

HOOK_DIR=".git/hooks"
HOOK_FILE="$HOOK_DIR/pre-push"

echo "Installing git hooks..."

# Create pre-push hook
cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash

# Git hook to prevent direct pushes to main branch
# This ensures all changes go through the PR workflow

protected_branch='main'

while read local_ref local_sha remote_ref remote_sha
do
    if [ "$remote_ref" = "refs/heads/$protected_branch" ]; then
        echo ""
        echo "❌ ERROR: Direct push to '$protected_branch' branch is FORBIDDEN"
        echo ""
        echo "Please follow the proper workflow:"
        echo "  1. Create a feature branch: git checkout -b feature/your-feature"
        echo "  2. Make your changes and commit"
        echo "  3. Push your branch: git push -u origin feature/your-feature"
        echo "  4. Create a Pull Request on GitHub"
        echo "  5. Wait for approval and merge"
        echo ""
        echo "See CLAUDE.md for full workflow documentation"
        echo ""
        exit 1
    fi
done

exit 0
EOF

chmod +x "$HOOK_FILE"

echo "✅ Git hooks installed successfully"
echo ""
echo "The pre-push hook will prevent direct pushes to main branch."
echo "All changes must go through the PR workflow."
