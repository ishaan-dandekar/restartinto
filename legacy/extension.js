// Restart Into... Extension for GNOME Shell 3.36 - 44 (Legacy)
// Uses legacy imports system (pre-ESM)

const { GLib, Gio } = imports.gi;
const EndSessionDialog = imports.ui.endSessionDialog;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

class RestartIntoExtension {
    constructor() {
        this._originalUpdateButtons = null;
        this._settings = null;
    }

    enable() {
        this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.restartinto');
        this._originalUpdateButtons = EndSessionDialog.EndSessionDialog.prototype._updateButtons;
        let extension = this;

        EndSessionDialog.EndSessionDialog.prototype._updateButtons = function () {
            extension._originalUpdateButtons.call(this);

            if (this._type === 2) { // RESTART_TYPE
                const bootId = extension._settings.get_string('boot-id');
                const buttonText = extension._settings.get_string('button-text');
                const debugMode = extension._settings.get_boolean('debug-mode');

                // Check if efibootmgr is available
                if (extension._checkEfibootmgr()) {
                    this.addButton({
                        action: () => {
                            this.close();
                            extension._restartInto(bootId, debugMode);
                        },
                        label: buttonText,
                        key: 1
                    });
                } else if (debugMode) {
                    log('RestartInto: efibootmgr not found in PATH');
                }
            }
        };
    }

    _checkEfibootmgr() {
        // Check if efibootmgr is available on the system
        try {
            const [success] = GLib.find_program_in_path('efibootmgr');
            return success !== null;
        } catch (e) {
            return false;
        }
    }

    _restartInto(bootId, debugMode) {
        if (debugMode) {
            log(`RestartInto: Attempting to restart to OS with boot ID: ${bootId}`);
        }

        // Use pkexec to execute efibootmgr directly with elevated privileges
        // This approach doesn't require any sudoers modifications
        const command = [
            'pkexec',
            'sh',
            '-c',
            `/usr/bin/efibootmgr -n ${bootId} && /usr/sbin/reboot`
        ];

        if (debugMode) {
            log(`RestartInto: Executing command: ${command.join(' ')}`);
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
                        if (stdout) log(`RestartInto stdout: ${stdout}`);
                        if (stderr) log(`RestartInto stderr: ${stderr}`);
                    }
                } catch (e) {
                    if (debugMode) {
                        logError(e, 'RestartInto: Failed to execute restart command');
                    }
                }
            });
        } catch (e) {
            if (debugMode) {
                logError(e, 'RestartInto: Failed to create subprocess');
            }
        }
    }

    disable() {
        if (this._originalUpdateButtons) {
            EndSessionDialog.EndSessionDialog.prototype._updateButtons = this._originalUpdateButtons;
            this._originalUpdateButtons = null;
        }
        this._settings = null;
    }
}

function init() {
    return new RestartIntoExtension();
}
