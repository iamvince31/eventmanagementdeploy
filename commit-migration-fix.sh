#!/bin/bash

echo "========================================="
echo "  Committing Migration Fix"
echo "========================================="
echo ""

echo "Adding migration fix..."
git add backend/database/migrations/2026_05_27_135713_add_indexes_for_performance_optimization.php
git add MIGRATION_FIX_APPLIED.md

echo ""
echo "Committing..."
git commit -m "fix: Make index migration idempotent to prevent duplicate key errors

- Added index existence checks before creation
- Prevents 'Duplicate key name' errors
- Migration now safe to run multiple times
- Added DB facade import
- Applied same logic to down() method

Fixes deployment error on Render where some indexes already existed."

if [ $? -ne 0 ]; then
    echo "✗ Commit failed!"
    exit 1
fi

echo "✓ Committed successfully"
echo ""

read -p "Push to origin main? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing to remote..."
    git push origin main
    if [ $? -ne 0 ]; then
        echo "✗ Push failed!"
        exit 1
    fi
    echo "✓ Pushed successfully"
    echo ""
    echo "========================================="
    echo "  Fix Deployed!"
    echo "========================================="
    echo ""
    echo "Render will now automatically redeploy."
    echo "The migration should complete successfully."
    echo ""
    echo "Monitor deployment at:"
    echo "https://dashboard.render.com"
else
    echo "Skipped pushing to remote."
fi

echo ""
