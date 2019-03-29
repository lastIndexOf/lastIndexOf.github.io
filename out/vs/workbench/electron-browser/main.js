/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "crypto", "vs/base/common/performance", "vs/workbench/browser/workbench", "vs/workbench/electron-browser/window", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/errors", "vs/base/common/platform", "vs/base/common/uri", "vs/workbench/services/configuration/node/configurationService", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/serviceCollection", "vs/base/node/pfs", "vs/platform/environment/node/environmentService", "vs/workbench/services/keybinding/electron-browser/keybindingService", "vs/platform/windows/common/windows", "vs/platform/windows/electron-browser/windowService", "vs/platform/environment/common/environment", "electron", "vs/platform/workspaces/common/workspaces", "vs/platform/log/node/spdlogService", "vs/platform/log/common/log", "vs/platform/storage/node/storageService", "vs/platform/log/node/logIpc", "vs/base/common/network", "vs/base/node/extfs", "vs/base/common/path", "vs/platform/storage/node/storageIpc", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/base/common/lifecycle", "vs/platform/driver/electron-browser/driver", "vs/platform/ipc/electron-browser/mainProcessService"], function (require, exports, crypto_1, performance_1, workbench_1, window_1, browser_1, dom_1, errors_1, platform_1, uri_1, configurationService_1, descriptors_1, serviceCollection_1, pfs_1, environmentService_1, keybindingService_1, windows_1, windowService_1, environment_1, electron_1, workspaces_1, spdlogService_1, log_1, storageService_1, logIpc_1, network_1, extfs_1, path_1, storageIpc_1, workspace_1, configuration_1, storage_1, lifecycle_1, driver_1, mainProcessService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CodeRendererMain extends lifecycle_1.Disposable {
        constructor(configuration) {
            super();
            this.configuration = configuration;
            this.init();
        }
        init() {
            // Enable gracefulFs
            // gracefulFs.gracefulify(fs);
            // Massage configuration file URIs
            this.reviveUris();
            // Setup perf
            performance_1.importEntries(this.configuration.perfEntries);
            // Browser config
            browser_1.setZoomFactor(electron_1.webFrame.getZoomFactor()); // Ensure others can listen to zoom level changes
            browser_1.setZoomLevel(electron_1.webFrame.getZoomLevel(), true /* isTrusted */); // Can be trusted because we are not setting it ourselves (https://github.com/Microsoft/vscode/issues/26151)
            browser_1.setFullscreen(!!this.configuration.fullscreen);
            // Keyboard support
            keybindingService_1.KeyboardMapperFactory.INSTANCE._onKeyboardLayoutChanged();
        }
        reviveUris() {
            if (this.configuration.folderUri) {
                this.configuration.folderUri = uri_1.URI.revive(this.configuration.folderUri);
            }
            if (this.configuration.workspace) {
                this.configuration.workspace = workspaces_1.reviveWorkspaceIdentifier(this.configuration.workspace);
            }
            const filesToWaitPaths = this.configuration.filesToWait && this.configuration.filesToWait.paths;
            [filesToWaitPaths, this.configuration.filesToOpen, this.configuration.filesToCreate, this.configuration.filesToDiff].forEach(paths => {
                if (Array.isArray(paths)) {
                    paths.forEach(path => {
                        if (path.fileUri) {
                            path.fileUri = uri_1.URI.revive(path.fileUri);
                        }
                    });
                }
            });
        }
        open() {
            return this.initServices().then(services => {
                return dom_1.domContentLoaded().then(() => {
                    performance_1.mark('willStartWorkbench');
                    // Create Workbench
                    this.workbench = new workbench_1.Workbench(document.body, services.serviceCollection, services.logService);
                    // Layout
                    this._register(dom_1.addDisposableListener(window, dom_1.EventType.RESIZE, e => this.onWindowResize(e, true)));
                    // Workbench Lifecycle
                    this._register(this.workbench.onShutdown(() => this.dispose()));
                    this._register(this.workbench.onWillShutdown(event => event.join(services.storageService.close())));
                    // Startup
                    const instantiationService = this.workbench.startup();
                    // Window
                    this._register(instantiationService.createInstance(window_1.ElectronWindow));
                    // Driver
                    if (this.configuration.driver) {
                        instantiationService.invokeFunction(accessor => driver_1.registerWindowDriver(accessor).then(disposable => this._register(disposable)));
                    }
                    // Config Exporter
                    if (this.configuration['export-default-configuration']) {
                        instantiationService.createInstance(configurationService_1.DefaultConfigurationExportHelper);
                    }
                    // Logging
                    services.logService.trace('workbench configuration', JSON.stringify(this.configuration));
                });
            });
        }
        onWindowResize(e, retry) {
            if (e.target === window) {
                if (window.document && window.document.body && window.document.body.clientWidth === 0) {
                    // TODO@Ben this is an electron issue on macOS when simple fullscreen is enabled
                    // where for some reason the window clientWidth is reported as 0 when switching
                    // between simple fullscreen and normal screen. In that case we schedule the layout
                    // call at the next animation frame once, in the hope that the dimensions are
                    // proper then.
                    if (retry) {
                        dom_1.scheduleAtNextAnimationFrame(() => this.onWindowResize(e, false));
                    }
                    return;
                }
                this.workbench.layout();
            }
        }
        initServices() {
            const serviceCollection = new serviceCollection_1.ServiceCollection();
            // Main Process
            const mainProcessService = this._register(new mainProcessService_1.MainProcessService(this.configuration.windowId));
            serviceCollection.set(mainProcessService_1.IMainProcessService, mainProcessService);
            // Window
            serviceCollection.set(windows_1.IWindowService, new descriptors_1.SyncDescriptor(windowService_1.WindowService, [this.configuration]));
            // Environment
            const environmentService = new environmentService_1.EnvironmentService(this.configuration, this.configuration.execPath);
            serviceCollection.set(environment_1.IEnvironmentService, environmentService);
            // Log
            const logService = this._register(this.createLogService(mainProcessService, environmentService));
            serviceCollection.set(log_1.ILogService, logService);
            return this.resolveWorkspaceInitializationPayload(environmentService).then(payload => Promise.all([
                this.createWorkspaceService(payload, environmentService, logService).then(service => {
                    // Workspace
                    serviceCollection.set(workspace_1.IWorkspaceContextService, service);
                    // Configuration
                    serviceCollection.set(configuration_1.IConfigurationService, service);
                    return service;
                }),
                this.createStorageService(payload, environmentService, logService, mainProcessService).then(service => {
                    // Storage
                    serviceCollection.set(storage_1.IStorageService, service);
                    return service;
                })
            ]).then(services => ({ serviceCollection, logService, storageService: services[1] })));
        }
        resolveWorkspaceInitializationPayload(environmentService) {
            // Multi-root workspace
            if (this.configuration.workspace) {
                return Promise.resolve(this.configuration.workspace);
            }
            // Single-folder workspace
            let workspaceInitializationPayload = Promise.resolve(undefined);
            if (this.configuration.folderUri) {
                workspaceInitializationPayload = this.resolveSingleFolderWorkspaceInitializationPayload(this.configuration.folderUri);
            }
            return workspaceInitializationPayload.then(payload => {
                // Fallback to empty workspace if we have no payload yet.
                if (!payload) {
                    let id;
                    if (this.configuration.backupPath) {
                        id = path_1.basename(this.configuration.backupPath); // we know the backupPath must be a unique path so we leverage its name as workspace ID
                    }
                    else if (environmentService.isExtensionDevelopment) {
                        id = 'ext-dev'; // extension development window never stores backups and is a singleton
                    }
                    else {
                        return Promise.reject(new Error('Unexpected window configuration without backupPath'));
                    }
                    payload = { id };
                }
                return payload;
            });
        }
        resolveSingleFolderWorkspaceInitializationPayload(folderUri) {
            // Return early the folder is not local
            if (folderUri.scheme !== network_1.Schemas.file) {
                return Promise.resolve({ id: crypto_1.createHash('md5').update(folderUri.toString()).digest('hex'), folder: folderUri });
            }
            function computeLocalDiskFolderId(folder, stat) {
                let ctime;
                if (platform_1.isLinux) {
                    ctime = stat.ino; // Linux: birthtime is ctime, so we cannot use it! We use the ino instead!
                }
                else if (platform_1.isMacintosh) {
                    ctime = stat.birthtime.getTime(); // macOS: birthtime is fine to use as is
                }
                else if (platform_1.isWindows) {
                    if (typeof stat.birthtimeMs === 'number') {
                        ctime = Math.floor(stat.birthtimeMs); // Windows: fix precision issue in node.js 8.x to get 7.x results (see https://github.com/nodejs/node/issues/19897)
                    }
                    else {
                        ctime = stat.birthtime.getTime();
                    }
                }
                // we use the ctime as extra salt to the ID so that we catch the case of a folder getting
                // deleted and recreated. in that case we do not want to carry over previous state
                return crypto_1.createHash('md5').update(folder.fsPath).update(ctime ? String(ctime) : '').digest('hex');
            }
            // For local: ensure path is absolute and exists
            const sanitizedFolderPath = extfs_1.sanitizeFilePath(folderUri.fsPath, process.env['VSCODE_CWD'] || process.cwd());
            return pfs_1.stat(sanitizedFolderPath).then(stat => {
                const sanitizedFolderUri = uri_1.URI.file(sanitizedFolderPath);
                return {
                    id: computeLocalDiskFolderId(sanitizedFolderUri, stat),
                    folder: sanitizedFolderUri
                };
            }, error => errors_1.onUnexpectedError(error));
        }
        createWorkspaceService(payload, environmentService, logService) {
            const workspaceService = new configurationService_1.WorkspaceService(environmentService);
            return workspaceService.initialize(payload).then(() => workspaceService, error => {
                errors_1.onUnexpectedError(error);
                logService.error(error);
                return workspaceService;
            });
        }
        createStorageService(payload, environmentService, logService, mainProcessService) {
            const storageChannel = mainProcessService.getChannel('storage');
            const globalStorageDatabase = new storageIpc_1.GlobalStorageDatabaseChannelClient(storageChannel);
            const storageService = new storageService_1.StorageService(globalStorageDatabase, logService, environmentService);
            return storageService.initialize(payload).then(() => storageService, error => {
                errors_1.onUnexpectedError(error);
                logService.error(error);
                return storageService;
            });
        }
        createLogService(mainProcessService, environmentService) {
            const spdlogService = spdlogService_1.createSpdLogService(`renderer${this.configuration.windowId}`, this.configuration.logLevel, environmentService.logsPath);
            const consoleLogService = new log_1.ConsoleLogService(this.configuration.logLevel);
            const logService = new log_1.MultiplexLogService([consoleLogService, spdlogService]);
            const logLevelClient = new logIpc_1.LogLevelSetterChannelClient(mainProcessService.getChannel('loglevel'));
            return new logIpc_1.FollowerLogService(logLevelClient, logService);
        }
    }
    function main(configuration) {
        const renderer = new CodeRendererMain(configuration);
        console.log(configuration);
        return renderer.open();
    }
    exports.main = main;
});
//# sourceMappingURL=main.js.map