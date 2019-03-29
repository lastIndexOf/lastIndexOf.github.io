/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/platform", "vs/base/node/processes", "vs/base/node/pfs", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, os, platform, processes, pfs_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getDefaultShell(p) {
        if (p === 3 /* Windows */) {
            if (platform.isWindows) {
                return getTerminalDefaultShellWindows();
            }
            // Don't detect Windows shell when not on Windows
            return processes.getWindowsShell();
        }
        // Only use $SHELL for the current OS
        if (platform.isLinux && p === 1 /* Mac */ || platform.isMacintosh && p === 2 /* Linux */) {
            return '/bin/bash';
        }
        return getTerminalDefaultShellUnixLike();
    }
    exports.getDefaultShell = getDefaultShell;
    let _TERMINAL_DEFAULT_SHELL_UNIX_LIKE = null;
    function getTerminalDefaultShellUnixLike() {
        if (!_TERMINAL_DEFAULT_SHELL_UNIX_LIKE) {
            let unixLikeTerminal = 'sh';
            if (!platform.isWindows && process.env.SHELL) {
                unixLikeTerminal = process.env.SHELL;
                // Some systems have $SHELL set to /bin/false which breaks the terminal
                if (unixLikeTerminal === '/bin/false') {
                    unixLikeTerminal = '/bin/bash';
                }
            }
            if (platform.isWindows) {
                unixLikeTerminal = '/bin/bash'; // for WSL
            }
            _TERMINAL_DEFAULT_SHELL_UNIX_LIKE = unixLikeTerminal;
        }
        return _TERMINAL_DEFAULT_SHELL_UNIX_LIKE;
    }
    let _TERMINAL_DEFAULT_SHELL_WINDOWS = null;
    function getTerminalDefaultShellWindows() {
        if (!_TERMINAL_DEFAULT_SHELL_WINDOWS) {
            const isAtLeastWindows10 = platform.isWindows && parseFloat(os.release()) >= 10;
            const is32ProcessOn64Windows = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
            const powerShellPath = `${process.env.windir}\\${is32ProcessOn64Windows ? 'Sysnative' : 'System32'}\\WindowsPowerShell\\v1.0\\powershell.exe`;
            _TERMINAL_DEFAULT_SHELL_WINDOWS = isAtLeastWindows10 ? powerShellPath : processes.getWindowsShell();
        }
        return _TERMINAL_DEFAULT_SHELL_WINDOWS;
    }
    let detectedDistro = terminal_1.LinuxDistro.Unknown;
    if (platform.isLinux) {
        const file = '/etc/os-release';
        pfs_1.fileExists(file).then(exists => {
            if (!exists) {
                return;
            }
            pfs_1.readFile(file).then(b => {
                const contents = b.toString();
                if (/NAME="?Fedora"?/.test(contents)) {
                    detectedDistro = terminal_1.LinuxDistro.Fedora;
                }
                else if (/NAME="?Ubuntu"?/.test(contents)) {
                    detectedDistro = terminal_1.LinuxDistro.Ubuntu;
                }
            });
        });
    }
    exports.linuxDistro = detectedDistro;
    function getWindowsBuildNumber() {
        const osVersion = (/(\d+)\.(\d+)\.(\d+)/g).exec(os.release());
        let buildNumber = 0;
        if (osVersion && osVersion.length === 4) {
            buildNumber = parseInt(osVersion[3]);
        }
        return buildNumber;
    }
    exports.getWindowsBuildNumber = getWindowsBuildNumber;
});
//# sourceMappingURL=terminal.js.map