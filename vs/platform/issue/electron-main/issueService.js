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
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/platform/environment/node/argv", "electron", "vs/platform/launch/electron-main/launchService", "vs/platform/diagnostics/electron-main/diagnosticsService", "vs/platform/environment/common/environment", "vs/base/common/platform", "vs/platform/log/common/log", "vs/platform/windows/common/windows"], function (require, exports, nls_1, objects, argv_1, electron_1, launchService_1, diagnosticsService_1, environment_1, platform_1, log_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const DEFAULT_BACKGROUND_COLOR = '#1E1E1E';
    let IssueService = class IssueService {
        constructor(machineId, userEnv, environmentService, launchService, logService, diagnosticsService, windowsService) {
            this.machineId = machineId;
            this.userEnv = userEnv;
            this.environmentService = environmentService;
            this.launchService = launchService;
            this.logService = logService;
            this.diagnosticsService = diagnosticsService;
            this.windowsService = windowsService;
            this.registerListeners();
        }
        registerListeners() {
            electron_1.ipcMain.on('vscode:issueSystemInfoRequest', (event) => {
                this.getSystemInformation().then(msg => {
                    event.sender.send('vscode:issueSystemInfoResponse', msg);
                });
            });
            electron_1.ipcMain.on('vscode:issuePerformanceInfoRequest', (event) => {
                this.getPerformanceInfo().then(msg => {
                    event.sender.send('vscode:issuePerformanceInfoResponse', msg);
                });
            });
            electron_1.ipcMain.on('vscode:issueReporterConfirmClose', (_) => {
                const messageOptions = {
                    message: nls_1.localize('confirmCloseIssueReporter', "Your input will not be saved. Are you sure you want to close this window?"),
                    type: 'warning',
                    buttons: [
                        nls_1.localize('yes', "Yes"),
                        nls_1.localize('cancel', "Cancel")
                    ]
                };
                if (this._issueWindow) {
                    electron_1.dialog.showMessageBox(this._issueWindow, messageOptions, (response) => {
                        if (response === 0) {
                            if (this._issueWindow) {
                                this._issueWindow.destroy();
                                this._issueWindow = null;
                            }
                        }
                    });
                }
            });
            electron_1.ipcMain.on('vscode:workbenchCommand', (_, commandInfo) => {
                const { id, from, args } = commandInfo;
                let parentWindow;
                switch (from) {
                    case 'issueReporter':
                        parentWindow = this._issueParentWindow;
                        break;
                    case 'processExplorer':
                        parentWindow = this._processExplorerParentWindow;
                        break;
                    default:
                        throw new Error(`Unexpected command source: ${from}`);
                }
                if (parentWindow) {
                    parentWindow.webContents.send('vscode:runAction', { id, from, args });
                }
            });
            electron_1.ipcMain.on('vscode:openExternal', (_, arg) => {
                this.windowsService.openExternal(arg);
            });
            electron_1.ipcMain.on('vscode:closeIssueReporter', (event) => {
                if (this._issueWindow) {
                    this._issueWindow.close();
                }
            });
            electron_1.ipcMain.on('windowsInfoRequest', (event) => {
                this.launchService.getMainProcessInfo().then(info => {
                    event.sender.send('vscode:windowsInfoResponse', info.windows);
                });
            });
        }
        openReporter(data) {
            return new Promise(_ => {
                if (!this._issueWindow) {
                    this._issueParentWindow = electron_1.BrowserWindow.getFocusedWindow();
                    if (this._issueParentWindow) {
                        const position = this.getWindowPosition(this._issueParentWindow, 700, 800);
                        this._issueWindow = new electron_1.BrowserWindow({
                            fullscreen: false,
                            width: position.width,
                            height: position.height,
                            minWidth: 300,
                            minHeight: 200,
                            x: position.x,
                            y: position.y,
                            title: nls_1.localize('issueReporter', "Issue Reporter"),
                            backgroundColor: data.styles.backgroundColor || DEFAULT_BACKGROUND_COLOR
                        });
                        this._issueWindow.setMenuBarVisibility(false); // workaround for now, until a menu is implemented
                        // Modified when testing UI
                        const features = {};
                        this.logService.trace('issueService#openReporter: opening issue reporter');
                        this._issueWindow.loadURL(this.getIssueReporterPath(data, features));
                        this._issueWindow.on('close', () => this._issueWindow = null);
                        this._issueParentWindow.on('closed', () => {
                            if (this._issueWindow) {
                                this._issueWindow.close();
                                this._issueWindow = null;
                            }
                        });
                    }
                }
                if (this._issueWindow) {
                    this._issueWindow.focus();
                }
            });
        }
        openProcessExplorer(data) {
            return new Promise(_ => {
                // Create as singleton
                if (!this._processExplorerWindow) {
                    this._processExplorerParentWindow = electron_1.BrowserWindow.getFocusedWindow();
                    if (this._processExplorerParentWindow) {
                        const position = this.getWindowPosition(this._processExplorerParentWindow, 800, 300);
                        this._processExplorerWindow = new electron_1.BrowserWindow({
                            skipTaskbar: true,
                            resizable: true,
                            fullscreen: false,
                            width: position.width,
                            height: position.height,
                            minWidth: 300,
                            minHeight: 200,
                            x: position.x,
                            y: position.y,
                            backgroundColor: data.styles.backgroundColor,
                            title: nls_1.localize('processExplorer', "Process Explorer")
                        });
                        this._processExplorerWindow.setMenuBarVisibility(false);
                        const windowConfiguration = {
                            appRoot: this.environmentService.appRoot,
                            nodeCachedDataDir: this.environmentService.nodeCachedDataDir,
                            windowId: this._processExplorerWindow.id,
                            userEnv: this.userEnv,
                            machineId: this.machineId,
                            data
                        };
                        const environment = argv_1.parseArgs(process.argv);
                        const config = objects.assign(environment, windowConfiguration);
                        for (let key in config) {
                            if (config[key] === undefined || config[key] === null || config[key] === '') {
                                delete config[key]; // only send over properties that have a true value
                            }
                        }
                        this._processExplorerWindow.loadURL(`${require.toUrl('vs/code/electron-browser/processExplorer/processExplorer.html')}?config=${encodeURIComponent(JSON.stringify(config))}`);
                        this._processExplorerWindow.on('close', () => this._processExplorerWindow = null);
                        this._processExplorerParentWindow.on('close', () => {
                            if (this._processExplorerWindow) {
                                this._processExplorerWindow.close();
                                this._processExplorerWindow = null;
                            }
                        });
                    }
                }
                // Focus
                if (this._processExplorerWindow) {
                    this._processExplorerWindow.focus();
                }
            });
        }
        getWindowPosition(parentWindow, defaultWidth, defaultHeight) {
            // We want the new window to open on the same display that the parent is in
            let displayToUse;
            const displays = electron_1.screen.getAllDisplays();
            // Single Display
            if (displays.length === 1) {
                displayToUse = displays[0];
            }
            // Multi Display
            else {
                // on mac there is 1 menu per window so we need to use the monitor where the cursor currently is
                if (platform_1.isMacintosh) {
                    const cursorPoint = electron_1.screen.getCursorScreenPoint();
                    displayToUse = electron_1.screen.getDisplayNearestPoint(cursorPoint);
                }
                // if we have a last active window, use that display for the new window
                if (!displayToUse && parentWindow) {
                    displayToUse = electron_1.screen.getDisplayMatching(parentWindow.getBounds());
                }
                // fallback to primary display or first display
                if (!displayToUse) {
                    displayToUse = electron_1.screen.getPrimaryDisplay() || displays[0];
                }
            }
            const state = {
                width: defaultWidth,
                height: defaultHeight
            };
            const displayBounds = displayToUse.bounds;
            state.x = displayBounds.x + (displayBounds.width / 2) - (state.width / 2);
            state.y = displayBounds.y + (displayBounds.height / 2) - (state.height / 2);
            if (displayBounds.width > 0 && displayBounds.height > 0 /* Linux X11 sessions sometimes report wrong display bounds */) {
                if (state.x < displayBounds.x) {
                    state.x = displayBounds.x; // prevent window from falling out of the screen to the left
                }
                if (state.y < displayBounds.y) {
                    state.y = displayBounds.y; // prevent window from falling out of the screen to the top
                }
                if (state.x > (displayBounds.x + displayBounds.width)) {
                    state.x = displayBounds.x; // prevent window from falling out of the screen to the right
                }
                if (state.y > (displayBounds.y + displayBounds.height)) {
                    state.y = displayBounds.y; // prevent window from falling out of the screen to the bottom
                }
                if (state.width > displayBounds.width) {
                    state.width = displayBounds.width; // prevent window from exceeding display bounds width
                }
                if (state.height > displayBounds.height) {
                    state.height = displayBounds.height; // prevent window from exceeding display bounds height
                }
            }
            return state;
        }
        getSystemInformation() {
            return new Promise((resolve, reject) => {
                this.launchService.getMainProcessInfo().then(info => {
                    resolve(this.diagnosticsService.getSystemInfo(info));
                });
            });
        }
        getPerformanceInfo() {
            return new Promise((resolve, reject) => {
                this.launchService.getMainProcessInfo().then(info => {
                    this.diagnosticsService.getPerformanceInfo(info)
                        .then(diagnosticInfo => {
                        resolve(diagnosticInfo);
                    })
                        .catch(err => {
                        this.logService.warn('issueService#getPerformanceInfo ', err.message);
                        reject(err);
                    });
                });
            });
        }
        getIssueReporterPath(data, features) {
            if (!this._issueWindow) {
                throw new Error('Issue window has been disposed');
            }
            const windowConfiguration = {
                appRoot: this.environmentService.appRoot,
                nodeCachedDataDir: this.environmentService.nodeCachedDataDir,
                windowId: this._issueWindow.id,
                machineId: this.machineId,
                userEnv: this.userEnv,
                data,
                features
            };
            const environment = argv_1.parseArgs(process.argv);
            const config = objects.assign(environment, windowConfiguration);
            for (let key in config) {
                if (config[key] === undefined || config[key] === null || config[key] === '') {
                    delete config[key]; // only send over properties that have a true value
                }
            }
            return `${require.toUrl('vs/code/electron-browser/issue/issueReporter.html')}?config=${encodeURIComponent(JSON.stringify(config))}`;
        }
    };
    IssueService = __decorate([
        __param(2, environment_1.IEnvironmentService),
        __param(3, launchService_1.ILaunchService),
        __param(4, log_1.ILogService),
        __param(5, diagnosticsService_1.IDiagnosticsService),
        __param(6, windows_1.IWindowsService)
    ], IssueService);
    exports.IssueService = IssueService;
});
//# sourceMappingURL=issueService.js.map