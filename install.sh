#!/bin/bash

# Restart to Windows GNOME Extension Installer
# Author: Ishaan

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

echo -e "${BLUE}=== Restart Into Windows GNOME Extension Installer ===${NC}"
echo

# Check if GNOME Shell is running
if ! command -v gnome-shell &> /dev/null; then
    echo -e "${RED}Error: GNOME Shell not found. This extension only works with GNOME.${NC}"
    exit 1
fi

# Get current user
CURRENT_USER=$(whoami)

echo -e "${YELLOW}Step 1: Setting up passwordless sudo for restart commands${NC}"
echo "This will allow the extension to restart into Windows without prompting for password."

# Create sudoers rule
echo "${CURRENT_USER} ALL=(root) NOPASSWD: /usr/bin/efibootmgr -n *, /usr/sbin/reboot" | sudo tee /etc/sudoers.d/restartinto > /dev/null

echo -e "${GREEN}✓ Sudoers configuration created${NC}"

echo
echo -e "${YELLOW}Step 2: Finding Windows Boot Manager entry${NC}"

# Check if efibootmgr is available
if ! command -v efibootmgr &> /dev/null; then
    echo -e "${RED}Error: efibootmgr not found. Please install it first:${NC}"
    echo "  sudo apt install efibootmgr    # Ubuntu/Debian"
    echo "  sudo dnf install efibootmgr    # Fedora"
    echo "  sudo pacman -S efibootmgr      # Arch"
    exit 1
fi

# Show current boot entries
echo "Current EFI boot entries:"
sudo efibootmgr | grep -E "Boot[0-9]+"

echo
echo -e "${YELLOW}Please find your Windows Boot Manager entry ID from the list above.${NC}"
echo "It's usually labeled as 'Windows Boot Manager' and has an ID like Boot0000, Boot0001, etc."
echo -n "Enter the boot ID (numbers only, e.g., 0000): "
read BOOT_ID

# Validate boot ID format
if [[ ! "$BOOT_ID" =~ ^[0-9A-Fa-f]{4}$ ]]; then
    echo -e "${RED}Error: Invalid boot ID format. Please enter 4 hexadecimal digits (e.g., 0000).${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Using boot ID: $BOOT_ID${NC}"

echo
echo -e "${YELLOW}Step 3: Installing extension${NC}"

# Create extension directory
mkdir -p "$EXTENSION_DIR"
mkdir -p "$EXTENSION_DIR/schemas"

# Copy extension files
cp extension.js "$EXTENSION_DIR/"
cp metadata.json "$EXTENSION_DIR/"
cp prefs.js "$EXTENSION_DIR/"
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
        echo "Trying alternative compilation method..."
        # Alternative method
        cd "$EXTENSION_DIR/schemas/"
        glib-compile-schemas .
        cd - > /dev/null
    fi
else
    echo -e "${RED}Error: glib-compile-schemas not found${NC}"
    echo "Please install glib development tools:"
    echo "  sudo apt install libglib2.0-dev    # Ubuntu/Debian"
    echo "  sudo dnf install glib2-devel       # Fedora"
    echo "  sudo pacman -S glib2               # Arch"
    exit 1
fi

# Set the boot ID in the compiled schema
gsettings --schemadir "$EXTENSION_DIR/schemas/" set org.gnome.shell.extensions.restartinto boot-id "$BOOT_ID"

echo -e "${GREEN}✓ Extension files copied to $EXTENSION_DIR${NC}"

echo
echo -e "${YELLOW}Step 4: Finalizing installation${NC}"

# Check if we're on X11 or Wayland
if [ "$XDG_SESSION_TYPE" = "x11" ]; then
    echo "Detected X11 session. Attempting to restart GNOME Shell..."
    
    # Try to restart GNOME Shell on X11
    if command -v busctl &> /dev/null; then
        busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting…")' &> /dev/null
        sleep 3
    fi
    
    # Try alternative method
    if command -v gdbus &> /dev/null; then
        gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval 'Meta.restart("Restarting…")' &> /dev/null
        sleep 3
    fi
    
    # Enable the extension after restart attempt
    gnome-extensions enable "$EXTENSION_UUID" &> /dev/null
    
    if gnome-extensions list --enabled | grep -q "$EXTENSION_UUID"; then
        echo -e "${GREEN}✓ Extension enabled successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Extension installed but not enabled yet${NC}"
        echo -e "${YELLOW}Please restart GNOME Shell manually: Alt+F2 → type 'r' → Enter${NC}"
    fi
    
else
    echo "Detected Wayland session. Extension installed successfully."
    echo -e "${YELLOW}⚠ Please log out and log back in to enable the extension.${NC}"
fi

echo
echo -e "${GREEN}=== Installation Complete! ===${NC}"
echo
echo -e "${BLUE}Extension Status:${NC}"
if gnome-extensions list --enabled | grep -q "$EXTENSION_UUID"; then
    echo -e "${GREEN}✓ Extension is enabled and ready to use${NC}"
    echo
    echo -e "${BLUE}Usage:${NC}"
    echo "1. Press Alt+F4 or go to Activities > Power Off/Log Out > Restart"
    echo "2. You should now see a 'Restart to Windows' button in the restart dialog"
    echo "3. Click it to restart directly into Windows"
else
    echo -e "${YELLOW}⚠ Extension needs GNOME Shell restart to activate${NC}"
    echo
    echo -e "${BLUE}To activate:${NC}"
    if [ "$XDG_SESSION_TYPE" = "x11" ]; then
        echo "• Press Alt+F2, type 'r', and press Enter"
        echo "• Or log out and log back in"
    else
        echo "• Log out and log back in (required for Wayland)"
    fi
    echo
    echo -e "${BLUE}After restart:${NC}"
    echo "1. Press Alt+F4 or go to Activities > Power Off/Log Out > Restart"
    echo "2. You should now see a 'Restart to Windows' button in the restart dialog"
    echo "3. Click it to restart directly into Windows"
fi

echo
echo -e "${YELLOW}To configure:${NC} Run gnome-extensions prefs $EXTENSION_UUID"
echo -e "${YELLOW}To uninstall:${NC} Run gnome-extensions disable $EXTENSION_UUID"
