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
define(["require", "exports", "vs/nls", "vs/base/node/pfs", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/layout/browser/layoutService", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/browser/terminalService", "vs/workbench/contrib/terminal/browser/terminalConfigHelper", "vs/platform/storage/common/storage", "vs/workbench/contrib/terminal/node/terminal", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "electron", "vs/platform/windows/common/windows", "vs/workbench/services/extensions/common/extensions", "vs/platform/quickinput/common/quickInput", "vs/base/common/arrays", "vs/platform/files/common/files", "vs/workbench/contrib/terminal/common/terminalEnvironment", "child_process"], function (require, exports, nls, pfs, contextkey_1, instantiation_1, lifecycle_1, panelService_1, layoutService_1, configuration_1, terminalService_1, terminalConfigHelper_1, storage_1, terminal_1, dialogs_1, notification_1, electron_1, windows_1, extensions_1, quickInput_1, arrays_1, files_1, terminalEnvironment_1, child_process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalService = class TerminalService extends terminalService_1.TerminalService {
        constructor(contextKeyService, panelService, layoutService, storageService, lifecycleService, _configurationService, instantiationService, _quickInputService, notificationService, dialogService, extensionService, windowService, fileService) {
            super(contextKeyService, panelService, layoutService, lifecycleService, storageService, notificationService, dialogService, instantiationService, windowService, extensionService, fileService);
            this._configurationService = _configurationService;
            this._quickInputService = _quickInputService;
            this._configHelper = this._instantiationService.createInstance(terminalConfigHelper_1.TerminalConfigHelper, terminal_1.linuxDistro);
            electron_1.ipcRenderer.on('vscode:openFiles', (_event, request) => {
                // if the request to open files is coming in from the integrated terminal (identified though
                // the termProgram variable) and we are instructed to wait for editors close, wait for the
                // marker file to get deleted and then focus back to the integrated terminal.
                if (request.termProgram === 'vscode' && request.filesToWait) {
                    pfs.whenDeleted(request.filesToWait.waitMarkerFilePath).then(() => {
                        if (this.terminalInstances.length > 0) {
                            const terminal = this.getActiveInstance();
                            if (terminal) {
                                terminal.focus();
                            }
                        }
                    });
                }
            });
            electron_1.ipcRenderer.on('vscode:osResume', () => {
                const activeTab = this.getActiveTab();
                if (!activeTab) {
                    return;
                }
                activeTab.terminalInstances.forEach(instance => instance.forceRedraw());
            });
        }
        get configHelper() { return this._configHelper; }
        _getDefaultShell(p) {
            return terminal_1.getDefaultShell(p);
        }
        selectDefaultWindowsShell() {
            return this._detectWindowsShells().then(shells => {
                const options = {
                    placeHolder: nls.localize('terminal.integrated.chooseWindowsShell', "Select your preferred terminal shell, you can change this later in your settings")
                };
                return this._quickInputService.pick(shells, options).then(value => {
                    if (!value) {
                        return undefined;
                    }
                    const shell = value.description;
                    return this._configurationService.updateValue('terminal.integrated.shell.windows', shell, 1 /* USER */).then(() => shell);
                });
            });
        }
        _detectWindowsShells() {
            // Determine the correct System32 path. We want to point to Sysnative
            // when the 32-bit version of VS Code is running on a 64-bit machine.
            // The reason for this is because PowerShell's important PSReadline
            // module doesn't work if this is not the case. See #27915.
            const is32ProcessOn64Windows = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
            const system32Path = `${process.env['windir']}\\${is32ProcessOn64Windows ? 'Sysnative' : 'System32'}`;
            let useWSLexe = false;
            if (terminal_1.getWindowsBuildNumber() >= 16299) {
                useWSLexe = true;
            }
            const expectedLocations = {
                'Command Prompt': [`${system32Path}\\cmd.exe`],
                PowerShell: [`${system32Path}\\WindowsPowerShell\\v1.0\\powershell.exe`],
                'WSL Bash': [`${system32Path}\\${useWSLexe ? 'wsl.exe' : 'bash.exe'}`],
                'Git Bash': [
                    `${process.env['ProgramW6432']}\\Git\\bin\\bash.exe`,
                    `${process.env['ProgramW6432']}\\Git\\usr\\bin\\bash.exe`,
                    `${process.env['ProgramFiles']}\\Git\\bin\\bash.exe`,
                    `${process.env['ProgramFiles']}\\Git\\usr\\bin\\bash.exe`,
                    `${process.env['LocalAppData']}\\Programs\\Git\\bin\\bash.exe`,
                ]
            };
            const promises = [];
            Object.keys(expectedLocations).forEach(key => promises.push(this._validateShellPaths(key, expectedLocations[key])));
            return Promise.all(promises)
                .then(arrays_1.coalesce)
                .then(results => {
                return results.map(result => {
                    return {
                        label: result[0],
                        description: result[1]
                    };
                });
            });
        }
        _getWindowsBuildNumber() {
            return terminal_1.getWindowsBuildNumber();
        }
        /**
         * Converts a path to a path on WSL using the wslpath utility.
         * @param path The original path.
         */
        _getWslPath(path) {
            if (terminal_1.getWindowsBuildNumber() < 17063) {
                throw new Error('wslpath does not exist on Windows build < 17063');
            }
            return new Promise(c => {
                child_process_1.execFile('bash.exe', ['-c', 'echo $(wslpath ' + terminalEnvironment_1.escapeNonWindowsPath(path) + ')'], {}, (error, stdout, stderr) => {
                    c(terminalEnvironment_1.escapeNonWindowsPath(stdout.trim()));
                });
            });
        }
    };
    TerminalService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, panelService_1.IPanelService),
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, storage_1.IStorageService),
        __param(4, lifecycle_1.ILifecycleService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, quickInput_1.IQuickInputService),
        __param(8, notification_1.INotificationService),
        __param(9, dialogs_1.IDialogService),
        __param(10, extensions_1.IExtensionService),
        __param(11, windows_1.IWindowService),
        __param(12, files_1.IFileService)
    ], TerminalService);
    exports.TerminalService = TerminalService;
});
//# sourceMappingURL=terminalService.js.map