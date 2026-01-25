# Restart Into... - GNOME Shell Extension

A simple GNOME Shell extension that adds a **"Restart to [OS Name]"** button to the restart dialog, making dual-boot switching effortless.

![Extension Demo](https://img.shields.io/badge/GNOME-Shell-blue?logo=gnome&logoColor=white)
![Version](https://img.shields.io/badge/version-1.1-green)
![Compatibility](https://img.shields.io/badge/GNOME-3.36--47+-blue)
![License](https://img.shields.io/badge/license-GPL--3.0-blue)

## Features

- 🚀 **One-click restart to another OS** - Skips BIOS/GRUB menu navigation
- 🛡️ **Secure** - Uses system-standard PolicyKit (`pkexec`) for privilege elevation
- 🌐 **Universal Support** - Compatible with GNOME Shell 3.36 through 47+ (Automatic ESM/Legacy detection)
- 🔍 **Boot entry detection** - Built-in scanner to find your OS installations
- 🎨 **Customizable** - Personalize the button label and target boot entry
- 🔒 **Privacy-focused** - Fully offline, no data collection

## Installation

### E.G.O

[<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="100" align="middle">][EGO]

### Manual Installation

The easiest way to install is via the provided script:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ishaan-dandekar/restartinto.git
   cd restartinto
   ```

2. **Run the installer**:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
   *The script will automatically detect your GNOME version and install the correct files.*

3. **Restart GNOME Shell**:
   - **X11**: Press `Alt+F2`, type `r`, and hit `Enter`.
   - **Wayland**: Log out and log back in.

4. **Enable the extension**:
   ```bash
   gnome-extensions enable restartinto@ishaan-dandekar.github.io
   ```

### extensions.gnome.org (Recommended for browser users)

Once approved, search for **"Restart Into..."** on the [GNOME Extensions](https://extensions.gnome.org/) website.

## Configuration

1. **Open Preferences**: `gnome-extensions prefs restartinto@ishaan-dandekar.github.io`
2. **Scan for Boot Entries**: Click the scan button to see available EFI IDs.
3. **Set your Boot ID**: Enter the 4-digit hexadecimal ID (e.g., `0000` for Windows).
4. **Customize Text**: Set the button label to whatever you like (e.g., "Gaming Mode").

## Troubleshooting

### Windows Fast Startup
It is highly recommended to **disable Fast Startup in Windows**. If enabled, it can lead to hardware detection issues (like Wi-Fi not appearing) when rebooting back into Linux.

### Authentication
Since this extension modifies the EFI `BootNext` variable, it requires administrative privileges. You will be prompted for your password via a standard system dialog each time you use the button. This is much more secure than modifying `sudoers` files.

## License

This project is licensed under the **GPL-3.0 License**.

## Author

**Ishaan Dandekar**
- GitHub: [@ishaan-dandekar](https://github.com/ishaan-dandekar)
