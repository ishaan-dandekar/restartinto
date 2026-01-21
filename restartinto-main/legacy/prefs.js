// Restart Into... Preferences for GNOME Shell 3.36 - 44 (Legacy)
// Uses legacy imports and GTK3/GTK4 without Adwaita

const { Gio, Gtk, GLib } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function init() {
}

function buildPrefsWidget() {
    const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.restartinto');

    // Create main widget
    const prefsWidget = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 20,
        margin_top: 20,
        margin_bottom: 20,
        margin_start: 20,
        margin_end: 20,
    });

    // Boot Configuration Section
    const bootFrame = new Gtk.Frame({
        label: 'Boot Configuration',
        margin_bottom: 10,
    });
    const bootBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 10,
        margin_top: 10,
        margin_bottom: 10,
        margin_start: 10,
        margin_end: 10,
    });

    // Boot ID Entry
    const bootIdBox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 10,
    });
    const bootIdLabel = new Gtk.Label({
        label: 'Boot Entry ID:',
        xalign: 0,
        hexpand: true,
    });
    const bootIdEntry = new Gtk.Entry({
        text: settings.get_string('boot-id'),
        max_length: 4,
        width_chars: 6,
    });
    bootIdEntry.connect('changed', () => {
        const text = bootIdEntry.get_text().toUpperCase();
        if (text.length <= 4 && /^[0-9A-Fa-f]*$/.test(text)) {
            settings.set_string('boot-id', text);
        }
    });
    bootIdBox.append(bootIdLabel);
    bootIdBox.append(bootIdEntry);
    bootBox.append(bootIdBox);

    bootFrame.set_child(bootBox);
    prefsWidget.append(bootFrame);

    // Button Settings Section
    const buttonFrame = new Gtk.Frame({
        label: 'Button Settings',
        margin_bottom: 10,
    });
    const buttonBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 10,
        margin_top: 10,
        margin_bottom: 10,
        margin_start: 10,
        margin_end: 10,
    });

    // Button Text Entry
    const buttonTextBox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 10,
    });
    const buttonTextLabel = new Gtk.Label({
        label: 'Button Text:',
        xalign: 0,
        hexpand: true,
    });
    const buttonTextEntry = new Gtk.Entry({
        text: settings.get_string('button-text'),
        hexpand: true,
    });
    buttonTextEntry.connect('changed', () => {
        settings.set_string('button-text', buttonTextEntry.get_text());
    });
    buttonTextBox.append(buttonTextLabel);
    buttonTextBox.append(buttonTextEntry);
    buttonBox.append(buttonTextBox);

    buttonFrame.set_child(buttonBox);
    prefsWidget.append(buttonFrame);

    // Options Section
    const optionsFrame = new Gtk.Frame({
        label: 'Options',
        margin_bottom: 10,
    });
    const optionsBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 10,
        margin_top: 10,
        margin_bottom: 10,
        margin_start: 10,
        margin_end: 10,
    });

    // Debug Mode Switch
    const debugBox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 10,
    });
    const debugLabel = new Gtk.Label({
        label: 'Debug Mode:',
        xalign: 0,
        hexpand: true,
    });
    const debugSwitch = new Gtk.Switch({
        active: settings.get_boolean('debug-mode'),
        halign: Gtk.Align.END,
    });
    debugSwitch.connect('notify::active', () => {
        settings.set_boolean('debug-mode', debugSwitch.active);
    });
    debugBox.append(debugLabel);
    debugBox.append(debugSwitch);
    optionsBox.append(debugBox);

    optionsFrame.set_child(optionsBox);
    prefsWidget.append(optionsFrame);

    // Boot Entry Scanner Section
    const scanFrame = new Gtk.Frame({
        label: 'Boot Entry Detection',
        margin_bottom: 10,
    });
    const scanBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 10,
        margin_top: 10,
        margin_bottom: 10,
        margin_start: 10,
        margin_end: 10,
    });

    const scanButton = new Gtk.Button({
        label: 'Scan Boot Entries',
    });
    scanButton.connect('clicked', () => {
        _scanBootEntries(settings, prefsWidget);
    });
    scanBox.append(scanButton);

    scanFrame.set_child(scanBox);
    prefsWidget.append(scanFrame);

    // Instructions Section
    const instructionsFrame = new Gtk.Frame({
        label: 'Setup Instructions',
    });
    const instructionsBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 10,
        margin_top: 10,
        margin_bottom: 10,
        margin_start: 10,
        margin_end: 10,
    });

    const instructionsLabel = new Gtk.Label({
        label: 'This extension uses pkexec for privilege elevation.\nYou will be prompted for your password when using the restart button.\n\nRequirements:\n• efibootmgr must be installed\n• UEFI system with dual-boot setup',
        xalign: 0,
        wrap: true,
    });
    instructionsBox.append(instructionsLabel);

    instructionsFrame.set_child(instructionsBox);
    prefsWidget.append(instructionsFrame);

    return prefsWidget;
}

function _scanBootEntries(settings, parent) {
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

                    _showBootEntriesDialog(parent, bootEntries.join('\n'));
                } else {
                    _showErrorDialog(parent, 'No output from efibootmgr');
                }
            } catch (e) {
                _showErrorDialog(parent, e.message);
            }
        });
    } catch (e) {
        _showErrorDialog(parent, 'Could not run efibootmgr: ' + e.message);
    }
}

function _showBootEntriesDialog(parent, message) {
    const dialog = new Gtk.MessageDialog({
        transient_for: parent.get_root(),
        modal: true,
        buttons: Gtk.ButtonsType.OK,
        message_type: Gtk.MessageType.INFO,
        text: 'Available Boot Entries',
        secondary_text: message,
    });

    dialog.connect('response', () => {
        dialog.destroy();
    });

    dialog.show();
}

function _showErrorDialog(parent, message) {
    const dialog = new Gtk.MessageDialog({
        transient_for: parent.get_root(),
        modal: true,
        buttons: Gtk.ButtonsType.OK,
        message_type: Gtk.MessageType.ERROR,
        text: 'Error',
        secondary_text: message,
    });

    dialog.connect('response', () => {
        dialog.destroy();
    });

    dialog.show();
}
