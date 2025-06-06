#!/usr/bin/env bash
set -euo pipefail

# === CONFIG ===
REPO_URL="https://github.com/ybotman/ai-guild.git"
SPARSE_PATH="Claude/3.7 with code/AI-Guild"
TARGET_DIR="AI-Guild"
BRANCH="main"

# 1. Go into public/, verifying it exists
if [[ ! -d "public" ]]; then
  echo "❌ 'public/' directory not found. Please run from your Next.js app root."
  exit 1
fi
cd public

# 2. Backup existing target dir if it exists
if [[ -d "$TARGET_DIR" ]]; then
  timestamp=$(date +"%Y%m%d-%H%M%S")
  backup_dir="${TARGET_DIR}-backup-$timestamp"
  echo "📦 Backing up existing '$TARGET_DIR' to '$backup_dir'"
  mv "$TARGET_DIR" "$backup_dir"
fi

# 3. Create fresh target dir and enter it
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

# 4. Init & configure sparse-checkout
git init
git remote add origin "$REPO_URL"
git config core.sparseCheckout true

# 5. Specify the subfolder to pull
mkdir -p .git/info
echo "$SPARSE_PATH/**" > .git/info/sparse-checkout

# 6. Pull only that path
git fetch origin "$BRANCH" --depth=1
git checkout -B "$BRANCH" "origin/$BRANCH"

# 7. Flatten the structure
echo "⚙️ Flattening '$SPARSE_PATH' into '$TARGET_DIR/'"
mv "$SPARSE_PATH"/* .
top_dir="${SPARSE_PATH%%/*}"
rm -rf "$top_dir"

# Optional cleanup: remove .git metadata
rm -rf .git

echo "✅ '$SPARSE_PATH' imported into public/$TARGET_DIR/, previous version backed up as $backup_dir"