#!/bin/bash

echo "📦 Preparing to push your work..."

# Step 1: Add all changes
git add .

# Step 2: Ask for a commit message
read -p "📝 Commit message (press Enter to auto-generate): " msg

# Step 3: Use timestamped default if no message entered
if [ -z "$msg" ]; then
  msg="Update on $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Step 4: Commit and push
git commit -m "$msg"
git push origin main

# Step 5: Log the push
echo "$(date '+%Y-%m-%d %H:%M:%S') | $msg" >> git-push-log.txt

echo "✅ Push complete. Your work is now on GitHub!"
