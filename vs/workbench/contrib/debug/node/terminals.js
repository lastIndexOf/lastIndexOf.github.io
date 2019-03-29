/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/nls", "vs/base/common/platform", "vs/base/node/pfs", "vs/base/common/objects", "vs/base/common/amd"], function (require, exports, cp, nls, env, pfs, objects_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const TERMINAL_TITLE = nls.localize('console.title', "VS Code Console");
    let terminalLauncher = undefined;
    function getTerminalLauncher() {
        if (!terminalLauncher) {
            if (env.isWindows) {
                terminalLauncher = new WinTerminalService();
            }
            else if (env.isMacintosh) {
                terminalLauncher = new MacTerminalService();
            }
            else if (env.isLinux) {
                terminalLauncher = new LinuxTerminalService();
            }
        }
        return terminalLauncher;
    }
    exports.getTerminalLauncher = getTerminalLauncher;
    let _DEFAULT_TERMINAL_LINUX_READY = null;
    function getDefaultTerminalLinuxReady() {
        if (!_DEFAULT_TERMINAL_LINUX_READY) {
            _DEFAULT_TERMINAL_LINUX_READY = new Promise(c => {
                if (env.isLinux) {
                    Promise.all([pfs.exists('/etc/debian_version'), process.lazyEnv]).then(([isDebian]) => {
                        if (isDebian) {
                            c('x-terminal-emulator');
                        }
                        else if (process.env.DESKTOP_SESSION === 'gnome' || process.env.DESKTOP_SESSION === 'gnome-classic') {
                            c('gnome-terminal');
                        }
                        else if (process.env.DESKTOP_SESSION === 'kde-plasma') {
                            c('konsole');
                        }
                        else if (process.env.COLORTERM) {
                            c(process.env.COLORTERM);
                        }
                        else if (process.env.TERM) {
                            c(process.env.TERM);
                        }
                        else {
                            c('xterm');
                        }
                    });
                    return;
                }
                c('xterm');
            });
        }
        return _DEFAULT_TERMINAL_LINUX_READY;
    }
    exports.getDefaultTerminalLinuxReady = getDefaultTerminalLinuxReady;
    let _DEFAULT_TERMINAL_WINDOWS = null;
    function getDefaultTerminalWindows() {
        if (!_DEFAULT_TERMINAL_WINDOWS) {
            const isWoW64 = !!process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
            _DEFAULT_TERMINAL_WINDOWS = `${process.env.windir ? process.env.windir : 'C:\\Windows'}\\${isWoW64 ? 'Sysnative' : 'System32'}\\cmd.exe`;
        }
        return _DEFAULT_TERMINAL_WINDOWS;
    }
    exports.getDefaultTerminalWindows = getDefaultTerminalWindows;
    class TerminalLauncher {
        runInTerminal(args, config) {
            return this.runInTerminal0(args.title, args.cwd, args.args, args.env || {}, config);
        }
    }
    class WinTerminalService extends TerminalLauncher {
        runInTerminal0(title, dir, args, envVars, configuration) {
            const exec = configuration.external.windowsExec || getDefaultTerminalWindows();
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
                const cmd = cp.spawn(WinTerminalService.CMD, cmdArgs, options);
                cmd.on('error', e);
                c(undefined);
            });
        }
    }
    WinTerminalService.CMD = 'cmd.exe';
    class MacTerminalService extends TerminalLauncher {
        runInTerminal0(title, dir, args, envVars, configuration) {
            const terminalApp = configuration.external.osxExec || MacTerminalService.DEFAULT_TERMINAL_OSX;
            return new Promise((c, e) => {
                if (terminalApp === MacTerminalService.DEFAULT_TERMINAL_OSX || terminalApp === 'iTerm.app') {
                    // On OS X we launch an AppleScript that creates (or reuses) a Terminal window
                    // and then launches the program inside that window.
                    const script = terminalApp === MacTerminalService.DEFAULT_TERMINAL_OSX ? 'TerminalHelper' : 'iTermHelper';
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
                    const osa = cp.spawn(MacTerminalService.OSASCRIPT, osaArgs);
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
    }
    MacTerminalService.DEFAULT_TERMINAL_OSX = 'Terminal.app';
    MacTerminalService.OSASCRIPT = '/usr/bin/osascript'; // osascript is the AppleScript interpreter on OS X
    class LinuxTerminalService extends TerminalLauncher {
        runInTerminal0(title, dir, args, envVars, configuration) {
            const terminalConfig = configuration.external;
            const execThenable = terminalConfig.linuxExec ? Promise.resolve(terminalConfig.linuxExec) : getDefaultTerminalLinuxReady();
            return new Promise((c, e) => {
                let termArgs = [];
                //termArgs.push('--title');
                //termArgs.push(`"${TERMINAL_TITLE}"`);
                execThenable.then(exec => {
                    if (exec.indexOf('gnome-terminal') >= 0) {
                        termArgs.push('-x');
                    }
                    else {
                        termArgs.push('-e');
                    }
                    termArgs.push('bash');
                    termArgs.push('-c');
                    const bashCommand = `${quote(args)}; echo; read -p "${LinuxTerminalService.WAIT_MESSAGE}" -n1;`;
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
    }
    LinuxTerminalService.WAIT_MESSAGE = nls.localize('press.any.key', "Press any key to continue...");
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
    function hasChildProcesses(processId) {
        if (processId) {
            try {
                // if shell has at least one child process, assume that shell is busy
                if (env.isWindows) {
                    const result = cp.spawnSync('wmic', ['process', 'get', 'ParentProcessId']);
                    if (result.stdout) {
                        const pids = result.stdout.toString().split('\r\n');
                        if (!pids.some(p => parseInt(p) === processId)) {
                            return false;
                        }
                    }
                }
                else {
                    const result = cp.spawnSync('/usr/bin/pgrep', ['-lP', String(processId)]);
                    if (result.stdout) {
                        const r = result.stdout.toString().trim();
                        if (r.length === 0 || r.indexOf(' tmux') >= 0) { // ignore 'tmux'; see #43683
                            return false;
                        }
                    }
                }
            }
            catch (e) {
                // silently ignore
            }
        }
        // fall back to safe side
        return true;
    }
    exports.hasChildProcesses = hasChildProcesses;
    var ShellType;
    (function (ShellType) {
        ShellType[ShellType["cmd"] = 0] = "cmd";
        ShellType[ShellType["powershell"] = 1] = "powershell";
        ShellType[ShellType["bash"] = 2] = "bash";
    })(ShellType || (ShellType = {}));
    function prepareCommand(args, config) {
        let shellType;
        // get the shell configuration for the current platform
        let shell;
        const shell_config = config.integrated.shell;
        if (env.isWindows) {
            shell = shell_config.windows;
            shellType = 0 /* cmd */;
        }
        else if (env.isLinux) {
            shell = shell_config.linux;
            shellType = 2 /* bash */;
        }
        else if (env.isMacintosh) {
            shell = shell_config.osx;
            shellType = 2 /* bash */;
        }
        else {
            throw new Error('Unknown platform');
        }
        // try to determine the shell type
        shell = shell.trim().toLowerCase();
        if (shell.indexOf('powershell') >= 0 || shell.indexOf('pwsh') >= 0) {
            shellType = 1 /* powershell */;
        }
        else if (shell.indexOf('cmd.exe') >= 0) {
            shellType = 0 /* cmd */;
        }
        else if (shell.indexOf('bash') >= 0) {
            shellType = 2 /* bash */;
        }
        else if (shell.indexOf('git\\bin\\bash.exe') >= 0) {
            shellType = 2 /* bash */;
        }
        let quote;
        let command = '';
        switch (shellType) {
            case 1 /* powershell */:
                quote = (s) => {
                    s = s.replace(/\'/g, '\'\'');
                    return `'${s}'`;
                    //return s.indexOf(' ') >= 0 || s.indexOf('\'') >= 0 || s.indexOf('"') >= 0 ? `'${s}'` : s;
                };
                if (args.cwd) {
                    command += `cd '${args.cwd}'; `;
                }
                if (args.env) {
                    for (let key in args.env) {
                        const value = args.env[key];
                        if (value === null) {
                            command += `Remove-Item env:${key}; `;
                        }
                        else {
                            command += `\${env:${key}}='${value}'; `;
                        }
                    }
                }
                if (args.args && args.args.length > 0) {
                    const cmd = quote(args.args.shift());
                    command += (cmd[0] === '\'') ? `& ${cmd} ` : `${cmd} `;
                    for (let a of args.args) {
                        command += `${quote(a)} `;
                    }
                }
                break;
            case 0 /* cmd */:
                quote = (s) => {
                    s = s.replace(/\"/g, '""');
                    return (s.indexOf(' ') >= 0 || s.indexOf('"') >= 0) ? `"${s}"` : s;
                };
                if (args.cwd) {
                    command += `cd ${quote(args.cwd)} && `;
                }
                if (args.env) {
                    command += 'cmd /C "';
                    for (let key in args.env) {
                        let value = args.env[key];
                        if (value === null) {
                            command += `set "${key}=" && `;
                        }
                        else {
                            value = value.replace(/[\^\&]/g, s => `^${s}`);
                            command += `set "${key}=${value}" && `;
                        }
                    }
                }
                for (let a of args.args) {
                    command += `${quote(a)} `;
                }
                if (args.env) {
                    command += '"';
                }
                break;
            case 2 /* bash */:
                quote = (s) => {
                    s = s.replace(/\"/g, '\\"');
                    return (s.indexOf(' ') >= 0 || s.indexOf('\\') >= 0) ? `"${s}"` : s;
                };
                const hardQuote = (s) => {
                    return /[^\w@%\/+=,.:^-]/.test(s) ? `'${s.replace(/'/g, '\'\\\'\'')}'` : s;
                };
                if (args.cwd) {
                    command += `cd ${quote(args.cwd)} ; `;
                }
                if (args.env) {
                    command += 'env';
                    for (let key in args.env) {
                        const value = args.env[key];
                        if (value === null) {
                            command += ` -u ${hardQuote(key)}`;
                        }
                        else {
                            command += ` ${hardQuote(`${key}=${value}`)}`;
                        }
                    }
                    command += ' ';
                }
                for (let a of args.args) {
                    command += `${quote(a)} `;
                }
                break;
        }
        return command;
    }
    exports.prepareCommand = prepareCommand;
});
//# sourceMappingURL=terminals.js.map