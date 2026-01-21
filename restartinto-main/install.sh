#!/bin/bash

# Restart Into... - GNOME Extension Installer
# This script automatically detects your GNOME version and installs the correct files.
# It is compliant with extensions.gnome.org policies (no system modifications).

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Extension details
EXTENSION_UUID="restartinto@ishaan-dandekar.github.io"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo -e "${BLUE}=== Restart Into... GNOME Extension Installer ===${NC}"
echo

# Check if GNOME Shell is running and get version
if ! command -v gnome-shell &> /dev/null; then
    echo -e "${RED}Error: GNOME Shell not found. This extension only works with GNOME.${NC}"
    exit 1
fi

SHELL_VERSION=$(gnome-shell --version | cut -d ' ' -f 3)
MAJOR_VERSION=$(echo $SHELL_VERSION | cut -d '.' -f 1)

echo -e "Detected GNOME Shell version: ${GREEN}$SHELL_VERSION${NC}"

# Check if efibootmgr is available
if ! command -v efibootmgr &> /dev/null; then
    echo -e "${YELLOW}Warning: efibootmgr not found.${NC}"
    echo "The extension requires efibootmgr to function. Please install it:"
    echo "  sudo apt install efibootmgr    # Ubuntu/Debian"
    echo "  sudo dnf install efibootmgr    # Fedora"
    echo "  sudo pacman -S efibootmgr      # Arch"
    echo
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${YELLOW}Step 1: Finding Other OS Boot Manager entry${NC}"
echo

# Show current boot entries if efibootmgr is available
if command -v efibootmgr &> /dev/null; then
    echo "Current EFI boot entries:"
    efibootmgr 2>/dev/null | grep -E "Boot[0-9]+" || echo "Unable to read boot entries (may require sudo)"
    echo
fi

echo -e "${YELLOW}Please find your Other OS Boot Manager entry ID from the list above.${NC}"
echo "For Windows, it's usually labeled as 'Windows Boot Manager' and has an ID like Boot0000, Boot0001, etc."
echo -n "Enter the boot ID (numbers only, e.g., 0000): "
read BOOT_ID

# Validate boot ID format
if [[ ! "$BOOT_ID" =~ ^[0-9A-Fa-f]{4}$ ]]; then
    echo -e "${RED}Error: Invalid boot ID format. Please enter 4 hexadecimal digits (e.g., 0000).${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Using boot ID: $BOOT_ID${NC}"
echo

echo -e "${YELLOW}Step 2: Installing extension files${NC}"

# Create extension directory
mkdir -p "$EXTENSION_DIR"
mkdir -p "$EXTENSION_DIR/schemas"

# Determine which version to copy
if [ "$MAJOR_VERSION" -ge 45 ]; then
    echo "Installing Modern (ESM) version for GNOME 45+"
    cp extension.js "$EXTENSION_DIR/"
    cp metadata.json "$EXTENSION_DIR/"
    cp prefs.js "$EXTENSION_DIR/"
else
    echo "Installing Legacy version for GNOME $SHELL_VERSION"
    cp legacy/extension.js "$EXTENSION_DIR/"
    cp legacy/metadata.json "$EXTENSION_DIR/"
    cp legacy/prefs.js "$EXTENSION_DIR/"
fi

# Copy shared schema
cp schemas/org.gnome.shell.extensions.restartinto.gschema.xml "$EXTENSION_DIR/schemas/"

# Compile GSettings schema
echo "Compiling GSettings schema..."
if command -v glib-compile-schemas &> /dev/null; then
    glib-compile-schemas "$EXTENSION_DIR/schemas/"
    
    # Verify compilation was successful
    if [ -f "$EXTENSION_DIR/schemas/gschemas.compiled" ]; then
        echo -e "${GREEN}✓ GSettings schema compiled successfully${NC}"
    else
        echo -e "${RED}✗ Schema compilation failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: glib-compile-schemas not found. Please install glib development tools.${NC}"
    exit 1
fi

# Set the boot ID in the settings
gsettings --schemadir "$EXTENSION_DIR/schemas/" set org.gnome.shell.extensions.restartinto boot-id "$BOOT_ID"

echo -e "${GREEN}✓ Extension successfully installed to $EXTENSION_DIR${NC}"
echo

echo -e "${GREEN}=== Installation Complete! ===${NC}"
echo
echo -e "${BLUE}⚠️  IMPORTANT: Extension requires GNOME Shell restart to activate${NC}"
echo

# Provide session-specific instructions
if [ "$XDG_SESSION_TYPE" = "x11" ]; then
    echo -e "${YELLOW}For X11 session - Choose one:${NC}"
    echo "  1. Press Alt+F2, type 'r', press Enter (Quick restart)"
    echo "  2. Log out and log back in (Guaranteed to work)"
else
    echo -e "${YELLOW}For Wayland session:${NC}"
    echo "  • Log out and log back in (Required - no quick restart available)"
fi

echo
echo -e "${BLUE}After restarting GNOME Shell:${NC}"
echo "1. Enable the extension:"
echo "   gnome-extensions enable $EXTENSION_UUID"
echo
echo "2. Test it works:"
echo "   • Power Off/Log Out > Restart" 
echo "   • Look for the new button in the restart dialog"
echo "   • You'll be prompted for your password when clicking the button"
echo

echo -e "${YELLOW}Useful commands:${NC}"
echo "• Configure: gnome-extensions prefs $EXTENSION_UUID"  
echo "• Disable: gnome-extensions disable $EXTENSION_UUID"

echo
echo -e "${GREEN}🚀 Ready! Just restart GNOME Shell and enable the extension!${NC}"
echo
echo -e "${BLUE}Note: This extension uses pkexec for privilege elevation.${NC}"
echo -e "${BLUE}You will be prompted for your password each time you use it.${NC}"
echo -e "${RED}For Windows: It is advised to disable Windows Fast Startup${NC}"
