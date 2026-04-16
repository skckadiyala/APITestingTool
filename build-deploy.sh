#!/usr/bin/env bash

# ============================================
#  API Testing Tool - Build & Deploy Script
#  Linux/macOS Shell Script
# ============================================

set -e  # Exit on any error

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"

echo "============================================"
echo " API Testing Tool - Build and Package"
echo "============================================"
echo ""

# --- Clean previous deploy folder ---
if [ -d "$DEPLOY_DIR" ]; then
    echo "Cleaning previous deploy folder..."
    rm -rf "$DEPLOY_DIR"
fi

# ============================================
#  Step 1: Build Backend
# ============================================
echo ""
echo "[1/6] Building Backend..."
echo "----------------------------------------"
cd "$ROOT_DIR/backend"

npm install --production=false
npm run build

echo "Backend build complete."

# ============================================
#  Step 2: Build Frontend
# ============================================
echo ""
echo "[2/6] Building Frontend..."
echo "----------------------------------------"
cd "$ROOT_DIR/frontend"

npm install --production=false
npm run build

echo "Frontend build complete."

# ============================================
#  Step 3: Create deploy folder structure
# ============================================
echo ""
echo "[3/6] Creating deploy folder structure..."
echo "----------------------------------------"
mkdir -p "$DEPLOY_DIR/backend/uploads/data-files"
mkdir -p "$DEPLOY_DIR/backend/prisma"
mkdir -p "$DEPLOY_DIR/frontend"

# ============================================
#  Step 4: Copy Frontend files
# ============================================
echo ""
echo "[4/6] Copying Frontend files..."
echo "----------------------------------------"
cp -r "$ROOT_DIR/frontend/dist" "$DEPLOY_DIR/frontend/dist"
cp "$ROOT_DIR/frontend/serve-frontend.js" "$DEPLOY_DIR/frontend/serve-frontend.js"
cp "$ROOT_DIR/frontend/package.json" "$DEPLOY_DIR/frontend/package.json"

echo "Frontend files copied."

# ============================================
#  Step 5: Copy Backend files
# ============================================
echo ""
echo "[5/6] Copying Backend files..."
echo "----------------------------------------"

# Copy compiled JS
cp -r "$ROOT_DIR/backend/dist" "$DEPLOY_DIR/backend/dist"

# Copy package files for production install
cp "$ROOT_DIR/backend/package.json" "$DEPLOY_DIR/backend/package.json"
cp "$ROOT_DIR/backend/package-lock.json" "$DEPLOY_DIR/backend/package-lock.json"

# Copy Prisma schema (needed by @prisma/client at runtime)
cp "$ROOT_DIR/backend/prisma/schema.prisma" "$DEPLOY_DIR/backend/prisma/schema.prisma"

# Install production-only dependencies
echo "Installing production dependencies..."
cd "$DEPLOY_DIR/backend"
npm install --production

# Generate Prisma client in deploy context
npx prisma generate

echo "Backend files copied."

# ============================================
#  Step 6: Zip the deploy folder
# ============================================
echo ""
echo "[6/6] Creating zip archive..."
echo "----------------------------------------"
cd "$ROOT_DIR"

# Remove old zip if exists
rm -f deploy.zip

# Create zip (excluding node_modules)
if command -v zip &> /dev/null; then
    cd "$DEPLOY_DIR"
    zip -r "$ROOT_DIR/deploy.zip" . -q -x '*/node_modules/*'
    cd "$ROOT_DIR"
else
    # Fallback to tar if zip is not available
    tar -czf deploy.tar.gz -C "$DEPLOY_DIR" --exclude='node_modules' .
    echo "Note: 'zip' not found, created deploy.tar.gz instead"
fi

echo ""
echo "============================================"
echo " Build and Package Complete!"
echo "============================================"
echo ""
echo " Deploy folder: $DEPLOY_DIR"
if [ -f "$ROOT_DIR/deploy.zip" ]; then
    echo " Zip archive:   $ROOT_DIR/deploy.zip"
else
    echo " Archive:        $ROOT_DIR/deploy.tar.gz"
fi
echo ""
echo " To deploy:"
echo "   1. Extract archive to target machine"
echo "   2. Copy backend/.env, frontend/.env, and ecosystem.config.js"
echo "   3. cd backend && npm install --production && npx prisma generate"
echo "   4. Run: pm2 start ecosystem.config.js"
echo "============================================"
