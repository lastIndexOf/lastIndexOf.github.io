/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "child_process", "vs/base/common/path", "vs/base/node/processes", "vs/nls", "vs/base/common/objects", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/externalTerminal/electron-browser/externalTerminal", "vs/base/common/amd"], function (require, exports, cp, path, processes, nls, objects_1, configuration_1, externalTerminal_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const TERMINAL_TITLE = nls.localize('console.title', "VS Code Console");
    var WinSpawnType;
    (function (WinSpawnType) {
        WinSpawnType[WinSpawnType["CMD"] = 0] = "CMD";
        WinSpawnType[WinSpawnType["CMDER"] = 1] = "CMDER";
    })(WinSpawnType || (WinSpawnType = {}));
    let WindowsExternalTerminalService = class WindowsExternalTerminalService {
        constructor(_configurationService) {
            this._configurationService = _configurationService;
        }
        openTerminal(cwd) {
            const configuration = this._configurationService.getValue();
            this.spawnTerminal(cp, configuration, processes.getWindowsShell(), cwd);
        }
        runInTerminal(title, dir, args, envVars) {
            const configuration = this._configurationService.getValue();
            const terminalConfig = configuration.terminal.external;
            const exec = terminalConfig.windowsExec || externalTerminal_1.getDefaultTerminalWindows();
            return new Promise((c, e) => {
                const title = `"${dir} - ${TERMINAL_TITLE}"`;
                const command = `""${args.join('" "')}" & pause"`; // use '|' to only pause on non-zero exit code
                const cmdArgs = [
                    '/c', 'start', title, '/wait', exec, '/c', command
                ];
                // merge environment variables into a copy of the process.env
                const env = objects_1.assign({}, process.env, envVars);
                // delete environment variables that have a null value
                Object.keys(env).filter(v => env[v] === null).forEach(key => delete env[key]);
                const options = {
                    cwd: dir,
                    env: env,
                    windowsVerbatimArguments: true
                };
                const cmd = cp.spawn(WindowsExternalTerminalService.CMD, cmdArgs, options);
                cmd.on('error', e);
                c(undefined);
            });
        }
        spawnTerminal(spawner, configuration, command, cwd) {
            const terminalConfig = configuration.terminal.external;
            const exec = terminalConfig.windowsExec || externalTerminal_1.getDefaultTerminalWindows();
            const spawnType = this.getSpawnType(exec);
            // Make the drive letter uppercase on Windows (see #9448)
            if (cwd && cwd[1] === ':') {
                cwd = cwd[0].toUpperCase() + cwd.substr(1);
            }
            // cmder ignores the environment cwd and instead opts to always open in %USERPROFILE%
            // unless otherwise specified
            if (spawnType === WinSpawnType.CMDER) {
                spawner.spawn(exec, [cwd]);
                return Promise.resolve(undefined);
            }
            const cmdArgs = ['/c', 'start', '/wait'];
            if (exec.indexOf(' ') >= 0) {
                // The "" argument is the window title. Without this, exec doesn't work when the path
                // contains spaces
                cmdArgs.push('""');
            }
            cmdArgs.push(exec);
            return new Promise((c, e) => {
                const env = cwd ? { cwd: cwd } : undefined;
                const child = spawner.spawn(command, cmdArgs, env);
                child.on('error', e);
                child.on('exit', () => c());
            });
        }
        getSpawnType(exec) {
            const basename = path.basename(exec).toLowerCase();
            if (basename === 'cmder' || basename === 'cmder.exe') {
                return WinSpawnType.CMDER;
            }
            return WinSpawnType.CMD;
        }
    };
    WindowsExternalTerminalService.CMD = 'cmd.exe';
    WindowsExternalTerminalService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], WindowsExternalTerminalService);
    exports.WindowsExternalTerminalService = WindowsExternalTerminalService;
    let MacExternalTerminalService = class MacExternalTerminalService {
        constructor(_configurationService) {
            this._configurationService = _configurationService;
        }
        openTerminal(cwd) {
            const configuration = this._configurationService.getValue();
            this.spawnTerminal(cp, configuration, cwd);
        }
        runInTerminal(title, dir, args, envVars) {
            const configuration = this._configurationService.getValue();
            const terminalConfig = configuration.terminal.external;
            const terminalApp = terminalConfig.osxExec || externalTerminal_1.DEFAULT_TERMINAL_OSX;
            return new Promise((c, e) => {
                if (terminalApp === externalTerminal_1.DEFAULT_TERMINAL_OSX || terminalApp === 'iTerm.app') {
                    // On OS X we launch an AppleScript that creates (or reuses) a Terminal window
                    // and then launches the program inside that window.
                    const script = terminalApp === externalTerminal_1.DEFAULT_TERMINAL_OSX ? 'TerminalHelper' : 'iTermHelper';
                    const scriptpath = amd_1.getPathFromAmdModule(require, `vs/workbench/contrib/externalTerminal/electron-browser/${script}.scpt`);
                    const osaArgs = [
                        scriptpath,
                        '-t', title || TERMINAL_TITLE,
                        '-w', dir,
                    ];
                    for (let a of args) {
                        osaArgs.push('-a');
                        osaArgs.push(a);
                    }
                    if (envVars) {
                        for (let key in envVars) {
                            const value = envVars[key];
                            if (value === null) {
                                osaArgs.push('-u');
                                osaArgs.push(key);
                            }
                            else {
                                osaArgs.push('-e');
                                osaArgs.push(`${key}=${value}`);
                            }
                        }
                    }
                    let stderr = '';
                    const osa = cp.spawn(MacExternalTerminalService.OSASCRIPT, osaArgs);
                    osa.on('error', e);
                    osa.stderr.on('data', (data) => {
                        stderr += data.toString();
                    });
                    osa.on('exit', (code) => {
                        if (code === 0) { // OK
                            c(undefined);
                        }
                        else {
                            if (stderr) {
                                const lines = stderr.split('\n', 1);
                                e(new Error(lines[0]));
                            }
                            else {
                                e(new Error(nls.localize('mac.terminal.script.failed', "Script '{0}' failed with exit code {1}", script, code)));
                            }
                        }
                    });
                }
                else {
                    e(new Error(nls.localize('mac.terminal.type.not.supported', "'{0}' not supported", terminalApp)));
                }
            });
        }
        spawnTerminal(spawner, configuration, cwd) {
            const terminalConfig = configuration.terminal.external;
            const terminalApp = terminalConfig.osxExec || externalTerminal_1.DEFAULT_TERMINAL_OSX;
            return new Promise((c, e) => {
                const child = spawner.spawn('/usr/bin/open', ['-a', terminalApp, cwd]);
                child.on('error', e);
                child.on('exit', () => c());
            });
        }
    };
    MacExternalTerminalService.OSASCRIPT = '/usr/bin/osascript'; // osascript is the AppleScript interpreter on OS X
    MacExternalTerminalService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], MacExternalTerminalService);
    exports.MacExternalTerminalService = MacExternalTerminalService;
    let LinuxExternalTerminalService = class LinuxExternalTerminalService {
        constructor(_configurationService) {
            this._configurationService = _configurationService;
        }
        openTerminal(cwd) {
            const configuration = this._configurationService.getValue();
            this.spawnTerminal(cp, configuration, cwd);
        }
        runInTerminal(title, dir, args, envVars) {
            const configuration = this._configurationService.getValue();
            const terminalConfig = configuration.terminal.external;
            const execPromise = terminalConfig.linuxExec ? Promise.resolve(terminalConfig.linuxExec) : externalTerminal_1.getDefaultTerminalLinuxReady();
            return new Promise((c, e) => {
                let termArgs = [];
                //termArgs.push('--title');
                //termArgs.push(`"${TERMINAL_TITLE}"`);
                execPromise.then(exec => {
                    if (exec.indexOf('gnome-terminal') >= 0) {
                        termArgs.push('-x');
                    }
                    else {
                        termArgs.push('-e');
                    }
                    termArgs.push('bash');
                    termArgs.push('-c');
                    const bashCommand = `${quote(args)}; echo; read -p "${LinuxExternalTerminalService.WAIT_MESSAGE}" -n1;`;
                    termArgs.push(`''${bashCommand}''`); // wrapping argument in two sets of ' because node is so "friendly" that it removes one set...
                    // merge environment variables into a copy of the process.env
                    const env = objects_1.assign({}, process.env, envVars);
                    // delete environment variables that have a null value
                    Object.keys(env).filter(v => env[v] === null).forEach(key => delete env[key]);
                    const options = {
                        cwd: dir,
                        env: env
                    };
                    let stderr = '';
                    const cmd = cp.spawn(exec, termArgs, options);
                    cmd.on('error', e);
                    cmd.stderr.on('data', (data) => {
                        stderr += data.toString();
                    });
                    cmd.on('exit', (code) => {
                        if (code === 0) { // OK
                            c(undefined);
                        }
                        else {
                            if (stderr) {
                                const lines = stderr.split('\n', 1);
                                e(new Error(lines[0]));
                            }
                            else {
                                e(new Error(nls.localize('linux.term.failed', "'{0}' failed with exit code {1}", exec, code)));
                            }
                        }
                    });
                });
            });
        }
        spawnTerminal(spawner, configuration, cwd) {
            const terminalConfig = configuration.terminal.external;
            const execPromise = terminalConfig.linuxExec ? Promise.resolve(terminalConfig.linuxExec) : externalTerminal_1.getDefaultTerminalLinuxReady();
            const env = cwd ? { cwd: cwd } : undefined;
            return new Promise((c, e) => {
                execPromise.then(exec => {
                    const child = spawner.spawn(exec, [], env);
                    child.on('error', e);
                    child.on('exit', () => c());
                });
            });
        }
    };
    LinuxExternalTerminalService.WAIT_MESSAGE = nls.localize('press.any.key', "Press any key to continue...");
    LinuxExternalTerminalService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], LinuxExternalTerminalService);
    exports.LinuxExternalTerminalService = LinuxExternalTerminalService;
    /**
     * Quote args if necessary and combine into a space separated string.
     */
    function quote(args) {
        let r = '';
        for (let a of args) {
            if (a.indexOf(' ') >= 0) {
                r += '"' + a + '"';
            }
            else {
                r += a;
            }
            r += ' ';
        }
        return r;
    }
});
//# sourceMappingURL=externalTerminalService.js.map