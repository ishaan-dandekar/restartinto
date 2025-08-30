import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import * as EndSessionDialog from 'resource:///org/gnome/shell/ui/endSessionDialog.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class RestartIntoExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this.originalUpdateButtons = null;
        this.settings = null;
    }
    
    enable() {
        this.settings = this.getSettings('org.gnome.shell.extensions.restartinto');
        this.originalUpdateButtons = EndSessionDialog.EndSessionDialog.prototype._updateButtons;
        let extension = this;
        
        EndSessionDialog.EndSessionDialog.prototype._updateButtons = function () {
            extension.originalUpdateButtons.call(this);
            
            if (this._type === 2) { // RESTART_TYPE
                const bootId = extension.settings.get_string('boot-id');
                const buttonText = extension.settings.get_string('button-text');
                const debugMode = extension.settings.get_boolean('debug-mode');
                
                // Check if pkexec wrapper script exists and is executable
                if (extension._checkPkexecScript()) {
                    this.addButton({
                        action: () => {
                            this.close();
                            extension._restartInto(bootId, debugMode);
                        },
                        label: buttonText,
                        key: 1
                    });
                } else if (debugMode) {
                    console.log('RestartInto: pkexec wrapper script not found or not executable');
                }
            }
        };
    }
    
    _checkPkexecScript() {
        // Check if the pkexec wrapper script exists and is executable
        const scriptPath = GLib.get_home_dir() + '/.local/bin/restartinto-helper';
        const file = Gio.File.new_for_path(scriptPath);
        
        try {
            const fileInfo = file.query_info('standard::type,access::can-execute', 
                                            Gio.FileQueryInfoFlags.NONE, null);
            return fileInfo.get_file_type() === Gio.FileType.REGULAR && 
                   fileInfo.get_attribute_boolean('access::can-execute');
        } catch (e) {
            return false;
        }
    }
    
    _restartInto(bootId, debugMode) {
        if (debugMode) {
            console.log(`RestartInto: Attempting to restart to OS with boot ID: ${bootId}`);
        }
        
        // Use pkexec to execute a helper script with elevated privileges
        const scriptPath = GLib.get_home_dir() + '/.local/bin/restartinto-helper';
        const command = ['pkexec', scriptPath, bootId];
        
        if (debugMode) {
            console.log(`RestartInto: Executing command: ${command.join(' ')}`);
        }
        
        try {
            const proc = Gio.Subprocess.new(
                command,
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
            
            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    const [, stdout, stderr] = proc.communicate_utf8_finish(res);
                    if (debugMode) {
                        if (stdout) console.log(`RestartInto stdout: ${stdout}`);
                        if (stderr) console.log(`RestartInto stderr: ${stderr}`);
                    }
                } catch (e) {
                    if (debugMode) {
                        console.error('RestartInto: Failed to execute restart command:', e);
                    }
                }
            });
        } catch (e) {
            if (debugMode) {
                console.error('RestartInto: Failed to create subprocess:', e);
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
