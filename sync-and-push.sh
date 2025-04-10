#!/bin/bash

echo "🔁 Starting full sync and push..."

# Step 1: Save local changes temporarily
git stash push -m "autosave before sync"

# Step 2: Make sure you're on the main branch
git checkout main

# Step 3: Pull latest changes from GitHub
git pull origin main

# Step 4: Re-apply local stashed changes
git stash pop

# Step 5: Add all changes
git add .

# Step 6: Prompt for commit message
read -p "📝 Commit message (press Enter to auto-generate): " msg
if [ -z "$msg" ]; then
  msg="Update on $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Step 7: Commit and push
git commit -m "$msg"
git push origin main

# Step 8: Log the push
echo "$(date '+%Y-%m-%d %H:%M:%S') | $msg" >> git-push-log.txt

echo "✅ All synced and pushed!"

