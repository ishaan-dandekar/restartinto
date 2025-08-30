import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class RestartIntoPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings('org.gnome.shell.extensions.restartinto');

        // Create preferences page
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        // Boot Configuration Group
        const bootGroup = new Adw.PreferencesGroup({
            title: _('Boot Configuration'),
            description: _('Configure the target OS boot entry'),
        });
        page.add(bootGroup);

        // Boot ID Row
        const bootRow = new Adw.EntryRow({
            title: _('Boot Entry ID'),
            text: settings.get_string('boot-id'),
            input_purpose: Gtk.InputPurpose.DIGITS,
        });
        bootRow.set_input_hints(Gtk.InputHints.UPPERCASE_CHARS);
        bootRow.connect('changed', () => {
            const text = bootRow.get_text();
            if (text.length <= 4 && /^[0-9A-Fa-f]*$/.test(text)) {
                settings.set_string('boot-id', text.toUpperCase());
            }
        });
        bootGroup.add(bootRow);

        // Button Settings Group
        const buttonGroup = new Adw.PreferencesGroup({
            title: _('Button Settings'),
            description: _('Customize the restart button appearance'),
        });
        page.add(buttonGroup);

        // Button Text Row
        const buttonTextRow = new Adw.EntryRow({
            title: _('Button Text'),
            text: settings.get_string('button-text'),
        });
        buttonTextRow.connect('changed', () => {
            settings.set_string('button-text', buttonTextRow.get_text());
        });
        buttonGroup.add(buttonTextRow);

        // Options Group
        const optionsGroup = new Adw.PreferencesGroup({
            title: _('Options'),
        });
        page.add(optionsGroup);

        // Debug Mode Row
        const debugRow = new Adw.SwitchRow({
            title: _('Debug Mode'),
            subtitle: _('Enable debug logging to system journal'),
            active: settings.get_boolean('debug-mode'),
        });
        debugRow.connect('notify::active', () => {
            settings.set_boolean('debug-mode', debugRow.active);
        });
        optionsGroup.add(debugRow);

        // Boot Entry Detection Group
        const detectionGroup = new Adw.PreferencesGroup({
            title: _('Boot Entry Detection'),
            description: _('Find available EFI boot entries'),
        });
        page.add(detectionGroup);

        // Scan Button Row
        const scanRow = new Adw.ActionRow({
            title: _('Scan Boot Entries'),
            subtitle: _('Click to detect all available boot entries'),
        });

        const scanButton = new Gtk.Button({
            label: _('Scan'),
            valign: Gtk.Align.CENTER,
            css_classes: ['suggested-action'],
        });

        scanButton.connect('clicked', () => {
            this._scanBootEntries(window, settings);
        });

        scanRow.add_suffix(scanButton);
        detectionGroup.add(scanRow);

        // Setup Instructions Group
        const setupGroup = new Adw.PreferencesGroup({
            title: _('Setup Instructions'),
            description: _('Required setup for the extension to work'),
        });
        page.add(setupGroup);

        const setupRow = new Adw.ActionRow({
            title: _('Helper Script Required'),
            subtitle: _('This extension requires a helper script with pkexec privileges'),
        });

        const helpButton = new Gtk.Button({
            label: _('Show Instructions'),
            valign: Gtk.Align.CENTER,
            css_classes: ['accent'],
        });

        helpButton.connect('clicked', () => {
            this._showSetupInstructions(window);
        });

        setupRow.add_suffix(helpButton);
        setupGroup.add(setupRow);
    }

    _scanBootEntries(window, settings) {
        try {
            const proc = Gio.Subprocess.new(
                ['efibootmgr'],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );

            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    const [, stdout, stderr] = proc.communicate_utf8_finish(res);
                    
                    if (stdout) {
                        const lines = stdout.split('\n');
                        const bootEntries = [];
                        
                        lines.forEach(line => {
                            const match = line.match(/Boot([0-9A-Fa-f]{4})\*?\s+(.+)/);
                            if (match) {
                                const bootId = match[1];
                                const bootName = match[2];
                                bootEntries.push(`${bootId}: ${bootName}`);
                            }
                        });

                        this._showBootEntriesDialog(window, bootEntries);
                    } else {
                        this._showErrorDialog(window, _('No output from efibootmgr'));
                    }
                } catch (e) {
                    this._showErrorDialog(window, e.message);
                }
            });
        } catch (e) {
            this._showErrorDialog(window, _('Could not run efibootmgr: ') + e.message);
        }
    }

    _showBootEntriesDialog(window, bootEntries) {
        const dialog = new Adw.AlertDialog({
            heading: _('Available Boot Entries'),
            body: bootEntries.length > 0 ? bootEntries.join('\n') : _('No boot entries found'),
        });

        dialog.add_response('close', _('Close'));
        dialog.present(window);
    }

    _showErrorDialog(window, message) {
        const dialog = new Adw.AlertDialog({
            heading: _('Error'),
            body: message,
        });

        dialog.add_response('close', _('Close'));
        dialog.present(window);
    }

    _showSetupInstructions(window) {
        const instructions = `To use this extension, you need to create a helper script:

1. Create the directory:
   mkdir -p ~/.local/bin

2. Create the script ~/.local/bin/restartinto-helper:
   #!/bin/bash
   if [ "$#" -ne 1 ]; then
       echo "Usage: $0 <boot_id>"
       exit 1
   fi
   
   BOOT_ID="$1"
   
   if [[ ! "$BOOT_ID" =~ ^[0-9A-Fa-f]{4}$ ]]; then
       echo "Error: Invalid boot ID format"
       exit 1
   fi
   
   efibootmgr -n "$BOOT_ID" && reboot

3. Make it executable:
   chmod +x ~/.local/bin/restartinto-helper

4. Create a pkexec policy file at:
   /usr/share/polkit-1/actions/org.gnome.shell.extensions.restartinto.policy

   (You'll need to create this manually with appropriate PolicyKit configuration)

Note: This extension requires administrative privileges to modify boot entries.`;

        const dialog = new Adw.AlertDialog({
            heading: _('Setup Instructions'),
            body: instructions,
        });

        dialog.add_response('close', _('Close'));
        dialog.present(window);
    }
}
