#!/bin/bash

# Package extension for both legacy and modern GNOME Shell versions
# Creates two separate zip files for extensions.gnome.org submission

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

EXTENSION_UUID="restartinto@ishaan-dandekar.github.io"
BUILD_DIR="build"

echo -e "${BLUE}=== Packaging Extension for extensions.gnome.org ===${NC}"
echo

# Clean previous build
if [ -d "$BUILD_DIR" ]; then
    echo -e "${YELLOW}Cleaning previous build...${NC}"
    rm -rf "$BUILD_DIR"
fi

# Get version from metadata.json
VERSION=$(grep -oP '(?<="version": )[0-9.]+' metadata.json)

echo -e "${BLUE}Building version ${VERSION}${NC}"
echo

# ============================================
# Build Modern Version (GNOME 45+)
# ============================================
echo -e "${YELLOW}Building modern version (GNOME 45, 46, 47)...${NC}"

MODERN_DIR="$BUILD_DIR/modern/$EXTENSION_UUID"
mkdir -p "$MODERN_DIR/schemas"

# Copy modern files
cp extension.js "$MODERN_DIR/"
cp prefs.js "$MODERN_DIR/"
cp metadata.json "$MODERN_DIR/"
cp schemas/org.gnome.shell.extensions.restartinto.gschema.xml "$MODERN_DIR/schemas/"

# Compile schema
glib-compile-schemas "$MODERN_DIR/schemas/"

if [ ! -f "$MODERN_DIR/schemas/gschemas.compiled" ]; then
    echo -e "${RED}Error: Modern schema compilation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Modern schema compiled${NC}"

# Create modern zip
MODERN_ZIP="restartinto-modern-v${VERSION}.zip"
cd "$BUILD_DIR/modern"
zip -r "$MODERN_ZIP" "$EXTENSION_UUID/" -q
mv "$MODERN_ZIP" ..
cd ../..

echo -e "${GREEN}✓ Modern version packaged: $BUILD_DIR/$MODERN_ZIP${NC}"

# ============================================
# Build Legacy Version (GNOME 3.36 - 44)
# ============================================
echo -e "${YELLOW}Building legacy version (GNOME 3.36, 3.38, 40, 41, 42, 43, 44)...${NC}"

LEGACY_DIR="$BUILD_DIR/legacy/$EXTENSION_UUID"
mkdir -p "$LEGACY_DIR/schemas"

# Copy legacy files
cp legacy/extension.js "$LEGACY_DIR/"
cp legacy/prefs.js "$LEGACY_DIR/"
cp legacy/metadata.json "$LEGACY_DIR/"
cp schemas/org.gnome.shell.extensions.restartinto.gschema.xml "$LEGACY_DIR/schemas/"

# Compile schema
glib-compile-schemas "$LEGACY_DIR/schemas/"

if [ ! -f "$LEGACY_DIR/schemas/gschemas.compiled" ]; then
    echo -e "${RED}Error: Legacy schema compilation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Legacy schema compiled${NC}"

# Create legacy zip
LEGACY_ZIP="restartinto-legacy-v${VERSION}.zip"
cd "$BUILD_DIR/legacy"
zip -r "$LEGACY_ZIP" "$EXTENSION_UUID/" -q
mv "$LEGACY_ZIP" ..
cd ../..

echo -e "${GREEN}✓ Legacy version packaged: $BUILD_DIR/$LEGACY_ZIP${NC}"

# ============================================
# Summary
# ============================================
echo
echo -e "${GREEN}=== Packaging Complete! ===${NC}"
echo
echo -e "${BLUE}Two versions created:${NC}"
echo
echo -e "${YELLOW}1. Modern Version (GNOME 45+):${NC}"
echo "   File: $BUILD_DIR/$MODERN_ZIP"
echo "   Supports: GNOME Shell 45, 46, 47"
echo "   Uses: ESM (import/export)"
echo
echo -e "${YELLOW}2. Legacy Version (GNOME 3.36-44):${NC}"
echo "   File: $BUILD_DIR/$LEGACY_ZIP"
echo "   Supports: GNOME Shell 3.36, 3.38, 40, 41, 42, 43, 44"
echo "   Uses: Legacy imports"
echo

echo -e "${BLUE}Package contents:${NC}"
echo
echo "Modern version:"
unzip -l "$BUILD_DIR/$MODERN_ZIP"
echo
echo "Legacy version:"
unzip -l "$BUILD_DIR/$LEGACY_ZIP"

echo
echo -e "${YELLOW}Next steps:${NC}"
echo
echo "1. Test both packages locally:"
echo "   ${BLUE}Modern:${NC} gnome-extensions install $BUILD_DIR/$MODERN_ZIP"
echo "   ${BLUE}Legacy:${NC} gnome-extensions install $BUILD_DIR/$LEGACY_ZIP"
echo
echo "2. Upload to extensions.gnome.org:"
echo "   • Go to https://extensions.gnome.org/upload/"
echo "   • Upload the MODERN version first"
echo "   • After approval, upload the LEGACY version as an update"
echo "   • The website will automatically serve the correct version based on user's GNOME Shell version"
echo
echo -e "${GREEN}✓ Ready for submission!${NC}"
