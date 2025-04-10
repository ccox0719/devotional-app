#!/bin/bash

echo "🔄 Syncing with GitHub..."

# Step 1: Save local changes (if any)
git stash push -m "autosave before sync"

# Step 2: Make sure you're on main
git checkout main

# Step 3: Pull the latest changes from GitHub
git pull origin main

# Step 4: Re-apply your local changes (if any)
git stash pop

echo "✅ Sync complete. You're ready to work!"
