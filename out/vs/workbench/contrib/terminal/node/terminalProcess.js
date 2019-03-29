/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/path", "vs/base/common/platform", "node-pty", "fs", "vs/base/common/event", "vs/workbench/contrib/terminal/node/terminal", "child_process"], function (require, exports, os, path, platform, pty, fs, event_1, terminal_1, child_process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TerminalProcess {
        constructor(shellLaunchConfig, cwd, cols, rows, env, windowsEnableConpty) {
            this._currentTitle = '';
            this._isDisposed = false;
            this._titleInterval = null;
            this._onProcessData = new event_1.Emitter();
            this._onProcessExit = new event_1.Emitter();
            this._onProcessIdReady = new event_1.Emitter();
            this._onProcessTitleChanged = new event_1.Emitter();
            let shellName;
            if (os.platform() === 'win32') {
                shellName = path.basename(shellLaunchConfig.executable || '');
            }
            else {
                // Using 'xterm-256color' here helps ensure that the majority of Linux distributions will use a
                // color prompt as defined in the default ~/.bashrc file.
                shellName = 'xterm-256color';
            }
            this._initialCwd = cwd;
            const useConpty = windowsEnableConpty && process.platform === 'win32' && terminal_1.getWindowsBuildNumber() >= 18309;
            const options = {
                name: shellName,
                cwd,
                env,
                cols,
                rows,
                experimentalUseConpty: useConpty
            };
            try {
                this._ptyProcess = pty.spawn(shellLaunchConfig.executable, shellLaunchConfig.args || [], options);
                this._processStartupComplete = new Promise(c => {
                    this.onProcessIdReady((pid) => {
                        c();
                    });
                });
            }
            catch (error) {
                // The only time this is expected to happen is when the file specified to launch with does not exist.
                this._exitCode = 2;
                this._queueProcessExit();
                this._processStartupComplete = Promise.resolve(undefined);
                return;
            }
            this._ptyProcess.on('data', (data) => {
                this._onProcessData.fire(data);
                if (this._closeTimeout) {
                    clearTimeout(this._closeTimeout);
                    this._queueProcessExit();
                }
            });
            this._ptyProcess.on('exit', (code) => {
                this._exitCode = code;
                this._queueProcessExit();
            });
            // TODO: We should no longer need to delay this since pty.spawn is sync
            setTimeout(() => {
                this._sendProcessId();
            }, 500);
            this._setupTitlePolling();
        }
        get onProcessData() { return this._onProcessData.event; }
        get onProcessExit() { return this._onProcessExit.event; }
        get onProcessIdReady() { return this._onProcessIdReady.event; }
        get onProcessTitleChanged() { return this._onProcessTitleChanged.event; }
        dispose() {
            this._isDisposed = true;
            if (this._titleInterval) {
                clearInterval(this._titleInterval);
            }
            this._titleInterval = null;
            this._onProcessData.dispose();
            this._onProcessExit.dispose();
            this._onProcessIdReady.dispose();
            this._onProcessTitleChanged.dispose();
        }
        _setupTitlePolling() {
            // Send initial timeout async to give event listeners a chance to init
            setTimeout(() => {
                this._sendProcessTitle();
            }, 0);
            // Setup polling
            this._titleInterval = setInterval(() => {
                if (this._currentTitle !== this._ptyProcess.process) {
                    this._sendProcessTitle();
                }
            }, 200);
        }
        // Allow any trailing data events to be sent before the exit event is sent.
        // See https://github.com/Tyriar/node-pty/issues/72
        _queueProcessExit() {
            if (this._closeTimeout) {
                clearTimeout(this._closeTimeout);
            }
            this._closeTimeout = setTimeout(() => this._kill(), 250);
        }
        _kill() {
            // Wait to kill to process until the start up code has run. This prevents us from firing a process exit before a
            // process start.
            this._processStartupComplete.then(() => {
                if (this._isDisposed) {
                    return;
                }
                // Attempt to kill the pty, it may have already been killed at this
                // point but we want to make sure
                try {
                    this._ptyProcess.kill();
                }
                catch (ex) {
                    // Swallow, the pty has already been killed
                }
                this._onProcessExit.fire(this._exitCode);
                this.dispose();
            });
        }
        _sendProcessId() {
            this._onProcessIdReady.fire(this._ptyProcess.pid);
        }
        _sendProcessTitle() {
            if (this._isDisposed) {
                return;
            }
            this._currentTitle = this._ptyProcess.process;
            this._onProcessTitleChanged.fire(this._currentTitle);
        }
        shutdown(immediate) {
            if (immediate) {
                this._kill();
            }
            else {
                this._queueProcessExit();
            }
        }
        input(data) {
            if (this._isDisposed) {
                return;
            }
            this._ptyProcess.write(data);
        }
        resize(cols, rows) {
            if (this._isDisposed) {
                return;
            }
            // Ensure that cols and rows are always >= 1, this prevents a native
            // exception in winpty.
            this._ptyProcess.resize(Math.max(cols, 1), Math.max(rows, 1));
        }
        getInitialCwd() {
            return Promise.resolve(this._initialCwd);
        }
        getCwd() {
            if (platform.isMacintosh) {
                return new Promise(resolve => {
                    child_process_1.exec('lsof -p ' + this._ptyProcess.pid + ' | grep cwd', (error, stdout, stderr) => {
                        if (stdout !== '') {
                            resolve(stdout.substring(stdout.indexOf('/'), stdout.length - 1));
                        }
                    });
                });
            }
            if (platform.isLinux) {
                return new Promise(resolve => {
                    fs.readlink('/proc/' + this._ptyProcess.pid + '/cwd', (err, linkedstr) => {
                        if (err) {
                            resolve(this._initialCwd);
                        }
                        resolve(linkedstr);
                    });
                });
            }
            return new Promise(resolve => {
                resolve(this._initialCwd);
            });
        }
    }
    exports.TerminalProcess = TerminalProcess;
});
//# sourceMappingURL=terminalProcess.js.map