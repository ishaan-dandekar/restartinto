const { Gio, Gtk, GLib } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

function init() {
}

function buildPrefsWidget() {
    const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.restartinto');
    
    // Create main container
    const widget = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 20,
        margin_top: 20,
        margin_bottom: 20,
        margin_start: 20,
        margin_end: 20,
    });

    // Boot ID Section
    const bootFrame = new Gtk.Frame({
        label: 'Boot Configuration',
        margin_bottom: 20,
    });
    
    const bootBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 10,
        margin_top: 10,
        margin_bottom: 10,
        margin_start: 10,
        margin_end: 10,
    });
    
    const bootLabel = new Gtk.Label({
        label: 'Windows Boot Entry ID (4 hex digits, e.g. 0000):',
        halign: Gtk.Align.START,
    });
    
    const bootEntry = new Gtk.Entry({
        text: settings.get_string('boot-id'),
        max_length: 4,
    });
    
    bootEntry.connect('changed', () => {
        const text = bootEntry.get_text();
        if (text.length === 4 && /^[0-9A-Fa-f]{4}$/.test(text)) {
            settings.set_string('boot-id', text);
        }
    });
    
    bootBox.append(bootLabel);
    bootBox.append(bootEntry);
    bootFrame.set_child(bootBox);
    widget.append(bootFrame);

    // Button Text Section
    const buttonFrame = new Gtk.Frame({
        label: 'Button Settings',
        margin_bottom: 20,
    });
    
    const buttonBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 10,
        margin_top: 10,
        margin_bottom: 10,
        margin_start: 10,
        margin_end: 10,
    });
    
    const buttonTextLabel = new Gtk.Label({
        label: 'Button Text:',
        halign: Gtk.Align.START,
    });
    
    const buttonTextEntry = new Gtk.Entry({
        text: settings.get_string('button-text'),
    });
    
    buttonTextEntry.connect('changed', () => {
        settings.set_string('button-text', buttonTextEntry.get_text());
    });
    
    buttonBox.append(buttonTextLabel);
    buttonBox.append(buttonTextEntry);
    buttonFrame.set_child(buttonBox);
    widget.append(buttonFrame);

    // Options Section
    const optionsFrame = new Gtk.Frame({
        label: 'Options',
        margin_bottom: 20,
    });
    
    const optionsBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 10,
        margin_top: 10,
        margin_bottom: 10,
        margin_start: 10,
        margin_end: 10,
    });
    
    // Debug mode checkbox
    const debugCheck = new Gtk.CheckButton({
        label: 'Enable debug logging',
        active: settings.get_boolean('debug-mode'),
    });
    
    debugCheck.connect('toggled', () => {
        settings.set_boolean('debug-mode', debugCheck.get_active());
    });
    
    optionsBox.append(debugCheck);
    optionsFrame.set_child(optionsBox);
    widget.append(optionsFrame);

    // Boot entries detection section
    const detectionFrame = new Gtk.Frame({
        label: 'Boot Entry Detection',
    });
    
    const detectionBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 10,
        margin_top: 10,
        margin_bottom: 10,
        margin_start: 10,
        margin_end: 10,
    });
    
    const detectionLabel = new Gtk.Label({
        label: 'Click to scan for Windows boot entries:',
        halign: Gtk.Align.START,
    });
    
    const scanButton = new Gtk.Button({
        label: 'Scan Boot Entries',
    });
    
    const resultLabel = new Gtk.Label({
        label: '',
        halign: Gtk.Align.START,
        wrap: true,
        selectable: true,
    });
    
    scanButton.connect('clicked', () => {
        try {
            const [success, stdout, stderr] = GLib.spawn_command_line_sync('efibootmgr');
            if (success) {
                const lines = new TextDecoder().decode(stdout).split('\n');
                const bootEntries = [];
                
                lines.forEach(line => {
                    const match = line.match(/Boot([0-9A-Fa-f]{4})\*?\s+(.+)/);
                    if (match && (match[2].toLowerCase().includes('windows') || 
                               match[2].toLowerCase().includes('microsoft') ||
                               match[2].toLowerCase().includes('boot manager'))) {
                        bootEntries.push(`${match[1]}: ${match[2]}`);
                    }
                });
                
                if (bootEntries.length > 0) {
                    resultLabel.set_text('Found Windows entries:\n' + bootEntries.join('\n'));
                } else {
                    resultLabel.set_text('No Windows boot entries found');
                }
            } else {
                resultLabel.set_text('Error: Could not run efibootmgr');
            }
        } catch (e) {
            resultLabel.set_text('Error: ' + e.message);
        }
    });
    
    detectionBox.append(detectionLabel);
    detectionBox.append(scanButton);
    detectionBox.append(resultLabel);
    detectionFrame.set_child(detectionBox);
    widget.append(detectionFrame);

    widget.show_all ? widget.show_all() : widget.show();
    return widget;
}
