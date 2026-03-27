#!/usr/bin/env bash
# VIBRIA Website Build + Deploy Script
# Usage: ./deploy.sh [--build-only] [--ftp-host=...] [--ftp-user=...] [--ftp-pass=...]

set -e

BUILD_ONLY=false
FTP_HOST=""
FTP_USER=""
FTP_PASS=""

for arg in "$@"; do
  case $arg in
    --build-only) BUILD_ONLY=true ;;
    --ftp-host=*) FTP_HOST="${arg#*=}" ;;
    --ftp-user=*) FTP_USER="${arg#*=}" ;;
    --ftp-pass=*) FTP_PASS="${arg#*=}" ;;
  esac
done

echo "=== VIBRIA Deploy Script ==="
echo ""

# 1. Build Frontend
echo "--- Building React frontend..."
npm run build
echo "✓ Frontend built to dist/"

# 2. Check PHP Composer
if [ -d "api/vendor" ]; then
  echo "--- PHP vendor directory exists, skipping install."
else
  echo "--- Installing PHP dependencies..."
  cd api && composer install --no-dev --optimize-autoloader && cd ..
  echo "✓ PHP dependencies installed"
fi

# 3. Copy .htaccess to dist
cp .htaccess dist/.htaccess
echo "✓ .htaccess copied to dist/"

# 4. Create upload directories placeholder
mkdir -p dist-deploy
echo "✓ Upload directories will be created on server"

if $BUILD_ONLY; then
  echo ""
  echo "=== Build complete (build-only mode) ==="
  echo ""
  echo "Files to upload:"
  echo "  dist/*  ->  webspace root"
  echo "  api/    ->  webspace /api"
  echo "  public/images/ -> webspace /images"
  exit 0
fi

# 5. FTP Deploy (requires lftp)
if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
  echo ""
  echo "=== Build complete ==="
  echo "No FTP credentials provided. Manual upload required:"
  echo ""
  echo "  1. dist/*         -> webspace root"
  echo "  2. api/           -> webspace root/api"
  echo "     (run: cd api && composer install --no-dev --optimize-autoloader)"
  echo "  3. public/images/ -> webspace root/images"
  echo "  4. Create uploads/ directory on server with subdirs:"
  echo "     uploads/events/, uploads/artists/, uploads/board/"
  echo "     uploads/gallery/, uploads/story/, uploads/home/"
  exit 0
fi

echo "--- Uploading via FTP..."
lftp -c "
open -u $FTP_USER,$FTP_PASS ftp://$FTP_HOST
mirror --reverse --delete --exclude='.git/' dist/ /
mirror --reverse --no-recursion api/ /api/
mirror --reverse public/images/ /images/
bye
"
echo "✓ Files uploaded"
echo ""
echo "=== Deploy complete! ==="
