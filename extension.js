const { GLib, Gio } = imports.gi;
const EndSessionDialog = imports.ui.endSessionDialog;
const ExtensionUtils = imports.misc.extensionUtils;

class Extension {
    constructor() {
        this.originalUpdateButtons = null;
        this.settings = null;
    }
    
    enable() {
        this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.restartinto');
        this.originalUpdateButtons = EndSessionDialog.EndSessionDialog.prototype._updateButtons;
        let extension = this;
        
        EndSessionDialog.EndSessionDialog.prototype._updateButtons = function () {
            extension.originalUpdateButtons.call(this);
            
            if (this._type === 2) { // RESTART_TYPE
                const bootId = extension.settings.get_string('boot-id');
                const buttonText = extension.settings.get_string('button-text');
                const debugMode = extension.settings.get_boolean('debug-mode');
                
                this.addButton({
                    action: () => {
                        this.close();
                        extension._restartToWindows(bootId, debugMode);
                    },
                    label: buttonText,
                    key: 1
                });
            }
        };
    }
    
    _restartToWindows(bootId, debugMode) {
        if (debugMode) {
            console.log(`Restarting to Windows with boot ID: ${bootId}`);
        }
        
        const command = `bash -c "sudo efibootmgr -n ${bootId} && sudo reboot"`;
        
        if (debugMode) {
            console.log(`Executing command: ${command}`);
        }
        
        try {
            GLib.spawn_command_line_async(command);
        } catch (e) {
            if (debugMode) {
                console.error('Failed to execute restart command:', e);
            }
        }
    }
    
    disable() {
        if (this.originalUpdateButtons) {
            EndSessionDialog.EndSessionDialog.prototype._updateButtons = this.originalUpdateButtons;
            this.originalUpdateButtons = null;
        }
        this.settings = null;
    }
}

function init() {
    return new Extension();
}
