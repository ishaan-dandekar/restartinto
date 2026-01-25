# Restart Into… — GNOME Shell Extension

Restart directly into another operating system without touching BIOS or GRUB menus. EFI systems only.

![Restart Into — restart dialog with OS selector](https://github.com/user-attachments/assets/651fe828-1be4-46ce-9ed8-1fc09fbde52f)

![GNOME Shell](https://img.shields.io/badge/GNOME-Shell-blue?logo=gnome\&logoColor=white)
![Version](https://img.shields.io/badge/version-1.1-green)
![Compatibility](https://img.shields.io/badge/GNOME-3.36--47+-blue)
![License](https://img.shields.io/badge/license-GPL--3.0-blue)

## What it does

Adds a **“Restart to <OS>”** button to the GNOME restart dialog. Clicking it sets the next EFI boot target and immediately restarts — no firmware menus, no GRUB timeout games.

Designed primarily for **dual‑boot systems** (Linux + Windows), but works with any EFI boot entry.

## Features

* **One‑click OS switching** using EFI `BootNext`
* **Secure by design** — uses PolicyKit (`pkexec`), no `sudoers` hacks
* **Wide GNOME support** — GNOME Shell **3.36 → 47+**
* **Automatic boot entry detection** (EFI scanner)
* **Customizable label** for the restart button
* **Offline & private** — no network access, no telemetry

## Installation

### GNOME Extensions (Recommended)

[<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="100" align="middle">][EGO]

Search for **“Restart Into…”** on extensions.gnome.org and install it directly from your browser.

### Manual Installation

```bash
git clone https://github.com/ishaan-dandekar/restartinto.git
cd restartinto
chmod +x install.sh
./install.sh
```

The installer automatically detects your GNOME Shell version and installs the correct files.

After installation:

* **X11**: `Alt + F2` → `r` → Enter
* **Wayland**: Log out and log back in

Enable the extension:

```bash
gnome-extensions enable restartinto@ishaan-dandekar.github.io
```

## Configuration

1. Open preferences:

   ```bash
   gnome-extensions prefs restartinto@ishaan-dandekar.github.io
   ```
2. Scan for EFI boot entries
3. Select or enter the **4‑digit hexadecimal Boot ID** (e.g. `0000` for Windows)
4. Customize the button label if desired

## Notes & Caveats

### Windows Fast Startup

Disable **Fast Startup** in Windows. Leaving it enabled can cause hardware issues (Wi‑Fi, Bluetooth, disks) when rebooting back into Linux.

### Authentication

The extension modifies the EFI `BootNext` variable. You will be prompted for your password via a standard PolicyKit dialog **each time** you use the button. This is intentional and safer than persistent privilege escalation.

To avoid the password, and for a seamless experience, create a PolicyKit rule to allow passwordless execution of:
'''
/usr/bin/efibootmgr
/usr/sbin/reboot
'''

## License

Licensed under the **GPL‑3.0**.

## Author

**Ishaan Dandekar**
GitHub: [https://github.com/ishaan-dandekar](https://github.com/ishaan-dandekar)

[EGO]: https://extensions.gnome.org/extension/8506/restart-into/
