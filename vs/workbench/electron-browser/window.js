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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/errors", "vs/base/common/objects", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/platform/files/common/files", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/platform/telemetry/common/telemetry", "vs/platform/windows/common/windows", "vs/platform/contextview/browser/contextView", "vs/workbench/services/title/common/titleService", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/browser/browser", "vs/platform/commands/common/commands", "vs/workbench/services/keybinding/electron-browser/keybindingService", "electron", "vs/workbench/services/workspace/common/workspaceEditing", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/browser/menuItemActionItem", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/integrity/common/integrity", "vs/base/common/platform", "vs/platform/product/node/product", "vs/platform/product/node/package", "vs/platform/notification/common/notification", "vs/platform/keybinding/common/keybinding", "vs/platform/environment/common/environment", "vs/platform/accessibility/common/accessibility", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/platform/configuration/common/configuration"], function (require, exports, nls, uri_1, errors, objects_1, DOM, actionbar_1, actions_1, files_1, editor_1, editorService_1, telemetry_1, windows_1, contextView_1, titleService_1, workbenchThemeService_1, browser, commands_1, keybindingService_1, electron_1, workspaceEditing_1, actions_2, contextkey_1, menuItemActionItem_1, async_1, lifecycle_1, lifecycle_2, integrity_1, platform_1, product_1, package_1, notification_1, keybinding_1, environment_1, accessibility_1, workspace_1, arrays_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const TextInputActions = [
        new actions_1.Action('undo', nls.localize('undo', "Undo"), undefined, true, () => Promise.resolve(document.execCommand('undo'))),
        new actions_1.Action('redo', nls.localize('redo', "Redo"), undefined, true, () => Promise.resolve(document.execCommand('redo'))),
        new actionbar_1.Separator(),
        new actions_1.Action('editor.action.clipboardCutAction', nls.localize('cut', "Cut"), undefined, true, () => Promise.resolve(document.execCommand('cut'))),
        new actions_1.Action('editor.action.clipboardCopyAction', nls.localize('copy', "Copy"), undefined, true, () => Promise.resolve(document.execCommand('copy'))),
        new actions_1.Action('editor.action.clipboardPasteAction', nls.localize('paste', "Paste"), undefined, true, () => Promise.resolve(document.execCommand('paste'))),
        new actionbar_1.Separator(),
        new actions_1.Action('editor.action.selectAll', nls.localize('selectAll', "Select All"), undefined, true, () => Promise.resolve(document.execCommand('selectAll')))
    ];
    let ElectronWindow = class ElectronWindow extends lifecycle_1.Disposable {
        constructor(editorService, windowsService, windowService, configurationService, titleService, themeService, notificationService, commandService, keybindingService, contextMenuService, telemetryService, workspaceEditingService, fileService, menuService, lifecycleService, integrityService, environmentService, accessibilityService, contextService) {
            super();
            this.editorService = editorService;
            this.windowsService = windowsService;
            this.windowService = windowService;
            this.configurationService = configurationService;
            this.titleService = titleService;
            this.themeService = themeService;
            this.notificationService = notificationService;
            this.commandService = commandService;
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.telemetryService = telemetryService;
            this.workspaceEditingService = workspaceEditingService;
            this.fileService = fileService;
            this.menuService = menuService;
            this.lifecycleService = lifecycleService;
            this.integrityService = integrityService;
            this.environmentService = environmentService;
            this.accessibilityService = accessibilityService;
            this.contextService = contextService;
            this.closeEmptyWindowScheduler = this._register(new async_1.RunOnceScheduler(() => this.onAllEditorsClosed(), 50));
            this.touchBarDisposables = [];
            this.pendingFoldersToAdd = [];
            this.addFoldersScheduler = this._register(new async_1.RunOnceScheduler(() => this.doAddFolders(), 100));
            this.registerListeners();
            this.create();
        }
        registerListeners() {
            // React to editor input changes
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateTouchbarMenu()));
            // prevent opening a real URL inside the shell
            [DOM.EventType.DRAG_OVER, DOM.EventType.DROP].forEach(event => {
                window.document.body.addEventListener(event, (e) => {
                    DOM.EventHelper.stop(e);
                });
            });
            // Support runAction event
            electron_1.ipcRenderer.on('vscode:runAction', (event, request) => {
                const args = request.args || [];
                // If we run an action from the touchbar, we fill in the currently active resource
                // as payload because the touch bar items are context aware depending on the editor
                if (request.from === 'touchbar') {
                    const activeEditor = this.editorService.activeEditor;
                    if (activeEditor) {
                        const resource = editor_1.toResource(activeEditor, { supportSideBySide: true });
                        if (resource) {
                            args.push(resource);
                        }
                    }
                }
                else {
                    args.push({ from: request.from }); // TODO@telemetry this is a bit weird to send this to every action?
                }
                this.commandService.executeCommand(request.id, ...args).then(_ => {
                    /* __GDPR__
                        "commandExecuted" : {
                            "id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                            "from": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                        }
                    */
                    this.telemetryService.publicLog('commandExecuted', { id: request.id, from: request.from });
                }, err => {
                    this.notificationService.error(err);
                });
            });
            // Support runKeybinding event
            electron_1.ipcRenderer.on('vscode:runKeybinding', (event, request) => {
                if (document.activeElement) {
                    this.keybindingService.dispatchByUserSettingsLabel(request.userSettingsLabel, document.activeElement);
                }
            });
            // Error reporting from main
            electron_1.ipcRenderer.on('vscode:reportError', (event, error) => {
                if (error) {
                    errors.onUnexpectedError(JSON.parse(error));
                }
            });
            // Support openFiles event for existing and new files
            electron_1.ipcRenderer.on('vscode:openFiles', (event, request) => this.onOpenFiles(request));
            // Support addFolders event if we have a workspace opened
            electron_1.ipcRenderer.on('vscode:addFolders', (event, request) => this.onAddFoldersRequest(request));
            // Message support
            electron_1.ipcRenderer.on('vscode:showInfoMessage', (event, message) => {
                this.notificationService.info(message);
            });
            // Fullscreen Events
            electron_1.ipcRenderer.on('vscode:enterFullScreen', () => {
                this.lifecycleService.when(2 /* Ready */).then(() => {
                    browser.setFullscreen(true);
                });
            });
            electron_1.ipcRenderer.on('vscode:leaveFullScreen', () => {
                this.lifecycleService.when(2 /* Ready */).then(() => {
                    browser.setFullscreen(false);
                });
            });
            // High Contrast Events
            electron_1.ipcRenderer.on('vscode:enterHighContrast', () => {
                const windowConfig = this.configurationService.getValue('window');
                if (windowConfig && windowConfig.autoDetectHighContrast) {
                    this.lifecycleService.when(2 /* Ready */).then(() => {
                        this.themeService.setColorTheme(workbenchThemeService_1.VS_HC_THEME, undefined);
                    });
                }
            });
            electron_1.ipcRenderer.on('vscode:leaveHighContrast', () => {
                const windowConfig = this.configurationService.getValue('window');
                if (windowConfig && windowConfig.autoDetectHighContrast) {
                    this.lifecycleService.when(2 /* Ready */).then(() => {
                        this.themeService.restoreColorTheme();
                    });
                }
            });
            // keyboard layout changed event
            electron_1.ipcRenderer.on('vscode:keyboardLayoutChanged', () => {
                keybindingService_1.KeyboardMapperFactory.INSTANCE._onKeyboardLayoutChanged();
            });
            // keyboard layout changed event
            electron_1.ipcRenderer.on('vscode:accessibilitySupportChanged', (event, accessibilitySupportEnabled) => {
                this.accessibilityService.setAccessibilitySupport(accessibilitySupportEnabled ? 2 /* Enabled */ : 1 /* Disabled */);
            });
            // Zoom level changes
            this.updateWindowZoomLevel();
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.zoomLevel')) {
                    this.updateWindowZoomLevel();
                }
            }));
            // Context menu support in input/textarea
            window.document.addEventListener('contextmenu', e => this.onContextMenu(e));
            // Listen to visible editor changes
            this._register(this.editorService.onDidVisibleEditorsChange(() => this.onDidVisibleEditorsChange()));
            // Listen to editor closing (if we run with --wait)
            const filesToWait = this.windowService.getConfiguration().filesToWait;
            if (filesToWait) {
                const resourcesToWaitFor = arrays_1.coalesce(filesToWait.paths.map(p => p.fileUri));
                const waitMarkerFile = uri_1.URI.file(filesToWait.waitMarkerFilePath);
                const listenerDispose = this.editorService.onDidCloseEditor(() => this.onEditorClosed(listenerDispose, resourcesToWaitFor, waitMarkerFile));
                this._register(listenerDispose);
            }
        }
        onDidVisibleEditorsChange() {
            // Close when empty: check if we should close the window based on the setting
            // Overruled by: window has a workspace opened or this window is for extension development
            // or setting is disabled. Also enabled when running with --wait from the command line.
            const visibleEditors = this.editorService.visibleControls;
            if (visibleEditors.length === 0 && this.contextService.getWorkbenchState() === 1 /* EMPTY */ && !this.environmentService.isExtensionDevelopment) {
                const closeWhenEmpty = this.configurationService.getValue('window.closeWhenEmpty');
                if (closeWhenEmpty || this.environmentService.args.wait) {
                    this.closeEmptyWindowScheduler.schedule();
                }
            }
        }
        onAllEditorsClosed() {
            const visibleEditors = this.editorService.visibleControls.length;
            if (visibleEditors === 0) {
                this.windowService.closeWindow();
            }
        }
        onEditorClosed(listenerDispose, resourcesToWaitFor, waitMarkerFile) {
            // In wait mode, listen to changes to the editors and wait until the files
            // are closed that the user wants to wait for. When this happens we delete
            // the wait marker file to signal to the outside that editing is done.
            if (resourcesToWaitFor.every(resource => !this.editorService.isOpen({ resource }))) {
                listenerDispose.dispose();
                this.fileService.del(waitMarkerFile);
            }
        }
        onContextMenu(e) {
            if (e.target instanceof HTMLElement) {
                const target = e.target;
                if (target.nodeName && (target.nodeName.toLowerCase() === 'input' || target.nodeName.toLowerCase() === 'textarea')) {
                    DOM.EventHelper.stop(e, true);
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => e,
                        getActions: () => TextInputActions,
                        onHide: () => target.focus() // fixes https://github.com/Microsoft/vscode/issues/52948
                    });
                }
            }
        }
        updateWindowZoomLevel() {
            const windowConfig = this.configurationService.getValue();
            let newZoomLevel = 0;
            if (windowConfig.window && typeof windowConfig.window.zoomLevel === 'number') {
                newZoomLevel = windowConfig.window.zoomLevel;
                // Leave early if the configured zoom level did not change (https://github.com/Microsoft/vscode/issues/1536)
                if (this.previousConfiguredZoomLevel === newZoomLevel) {
                    return;
                }
                this.previousConfiguredZoomLevel = newZoomLevel;
            }
            if (electron_1.webFrame.getZoomLevel() !== newZoomLevel) {
                electron_1.webFrame.setZoomLevel(newZoomLevel);
                browser.setZoomFactor(electron_1.webFrame.getZoomFactor());
                // See https://github.com/Microsoft/vscode/issues/26151
                // Cannot be trusted because the webFrame might take some time
                // until it really applies the new zoom level
                browser.setZoomLevel(electron_1.webFrame.getZoomLevel(), /*isTrusted*/ false);
            }
        }
        create() {
            // Handle window.open() calls
            const $this = this;
            window.open = function (url, target, features, replace) {
                $this.windowsService.openExternal(url);
                return null;
            };
            // Emit event when vscode is ready
            this.lifecycleService.when(2 /* Ready */).then(() => {
                electron_1.ipcRenderer.send('vscode:workbenchReady', this.windowService.getCurrentWindowId());
            });
            // Integrity warning
            this.integrityService.isPure().then(res => this.titleService.updateProperties({ isPure: res.isPure }));
            // Root warning
            this.lifecycleService.when(3 /* Restored */).then(() => {
                let isAdminPromise;
                if (platform_1.isWindows) {
                    isAdminPromise = new Promise((resolve_1, reject_1) => { require(['native-is-elevated'], resolve_1, reject_1); }).then(isElevated => isElevated());
                }
                else {
                    isAdminPromise = Promise.resolve(platform_1.isRootUser());
                }
                return isAdminPromise.then(isAdmin => {
                    // Update title
                    this.titleService.updateProperties({ isAdmin });
                    // Show warning message (unix only)
                    if (isAdmin && !platform_1.isWindows) {
                        this.notificationService.warn(nls.localize('runningAsRoot', "It is not recommended to run {0} as root user.", product_1.default.nameShort));
                    }
                });
            });
            // Touchbar menu (if enabled)
            this.updateTouchbarMenu();
            // Crash reporter (if enabled)
            if (!this.environmentService.disableCrashReporter && product_1.default.crashReporter && product_1.default.hockeyApp && this.configurationService.getValue('telemetry.enableCrashReporter')) {
                this.setupCrashReporter();
            }
        }
        updateTouchbarMenu() {
            if (!platform_1.isMacintosh || // macOS only
                !this.configurationService.getValue('keyboard.touchbar.enabled') // disabled via setting
            ) {
                return;
            }
            // Dispose old
            this.touchBarDisposables = lifecycle_1.dispose(this.touchBarDisposables);
            this.touchBarMenu = undefined;
            // Create new (delayed)
            this.touchBarUpdater = new async_1.RunOnceScheduler(() => this.doUpdateTouchbarMenu(), 300);
            this.touchBarDisposables.push(this.touchBarUpdater);
            this.touchBarUpdater.schedule();
        }
        doUpdateTouchbarMenu() {
            if (!this.touchBarMenu) {
                this.touchBarMenu = this.editorService.invokeWithinEditorContext(accessor => this.menuService.createMenu(35 /* TouchBarContext */, accessor.get(contextkey_1.IContextKeyService)));
                this.touchBarDisposables.push(this.touchBarMenu);
                this.touchBarDisposables.push(this.touchBarMenu.onDidChange(() => this.touchBarUpdater.schedule()));
            }
            const actions = [];
            // Fill actions into groups respecting order
            menuItemActionItem_1.fillInActionBarActions(this.touchBarMenu, undefined, actions);
            // Convert into command action multi array
            const items = [];
            let group = [];
            for (const action of actions) {
                // Command
                if (action instanceof actions_2.MenuItemAction) {
                    group.push(action.item);
                }
                // Separator
                else if (action instanceof actionbar_1.Separator) {
                    if (group.length) {
                        items.push(group);
                    }
                    group = [];
                }
            }
            if (group.length) {
                items.push(group);
            }
            // Only update if the actions have changed
            if (!objects_1.equals(this.lastInstalledTouchedBar, items)) {
                this.lastInstalledTouchedBar = items;
                this.windowService.updateTouchBar(items);
            }
        }
        setupCrashReporter() {
            // base options with product info
            const options = {
                companyName: product_1.default.crashReporter.companyName,
                productName: product_1.default.crashReporter.productName,
                submitURL: platform_1.isWindows ? product_1.default.hockeyApp[`win32-${process.arch}`] : platform_1.isLinux ? product_1.default.hockeyApp[`linux-${process.arch}`] : product_1.default.hockeyApp.darwin,
                extra: {
                    vscode_version: package_1.default.version,
                    vscode_commit: product_1.default.commit
                }
            };
            // mixin telemetry info
            this.telemetryService.getTelemetryInfo()
                .then(info => {
                objects_1.assign(options.extra, {
                    vscode_sessionId: info.sessionId
                });
                // start crash reporter right here
                electron_1.crashReporter.start(objects_1.deepClone(options));
                // start crash reporter in the main process
                return this.windowsService.startCrashReporter(options);
            });
        }
        onAddFoldersRequest(request) {
            // Buffer all pending requests
            this.pendingFoldersToAdd.push(...request.foldersToAdd.map(f => uri_1.URI.revive(f)));
            // Delay the adding of folders a bit to buffer in case more requests are coming
            if (!this.addFoldersScheduler.isScheduled()) {
                this.addFoldersScheduler.schedule();
            }
        }
        doAddFolders() {
            const foldersToAdd = [];
            this.pendingFoldersToAdd.forEach(folder => {
                foldersToAdd.push(({ uri: folder }));
            });
            this.pendingFoldersToAdd = [];
            this.workspaceEditingService.addFolders(foldersToAdd);
        }
        onOpenFiles(request) {
            const inputs = [];
            const diffMode = !!(request.filesToDiff && (request.filesToDiff.length === 2));
            if (!diffMode && request.filesToOpen) {
                inputs.push(...this.toInputs(request.filesToOpen, false));
            }
            if (!diffMode && request.filesToCreate) {
                inputs.push(...this.toInputs(request.filesToCreate, true));
            }
            if (diffMode && request.filesToDiff) {
                inputs.push(...this.toInputs(request.filesToDiff, false));
            }
            if (inputs.length) {
                this.openResources(inputs, diffMode);
            }
            if (request.filesToWait && inputs.length) {
                // In wait mode, listen to changes to the editors and wait until the files
                // are closed that the user wants to wait for. When this happens we delete
                // the wait marker file to signal to the outside that editing is done.
                const resourcesToWaitFor = request.filesToWait.paths.map(p => uri_1.URI.revive(p.fileUri));
                const waitMarkerFile = uri_1.URI.file(request.filesToWait.waitMarkerFilePath);
                const unbind = this.editorService.onDidCloseEditor(() => {
                    if (resourcesToWaitFor.every(resource => !this.editorService.isOpen({ resource }))) {
                        unbind.dispose();
                        this.fileService.del(waitMarkerFile);
                    }
                });
            }
        }
        openResources(resources, diffMode) {
            this.lifecycleService.when(2 /* Ready */).then(() => {
                // In diffMode we open 2 resources as diff
                if (diffMode && resources.length === 2) {
                    return this.editorService.openEditor({ leftResource: resources[0].resource, rightResource: resources[1].resource, options: { pinned: true } });
                }
                // For one file, just put it into the current active editor
                if (resources.length === 1) {
                    return this.editorService.openEditor(resources[0]);
                }
                // Otherwise open all
                return this.editorService.openEditors(resources);
            });
        }
        toInputs(paths, isNew) {
            return paths.map(p => {
                const resource = uri_1.URI.revive(p.fileUri);
                let input;
                if (isNew) {
                    input = { filePath: resource.fsPath, options: { pinned: true } };
                }
                else {
                    input = { resource, options: { pinned: true } };
                }
                if (!isNew && typeof p.lineNumber === 'number' && typeof p.columnNumber === 'number') {
                    input.options.selection = {
                        startLineNumber: p.lineNumber,
                        startColumn: p.columnNumber
                    };
                }
                return input;
            });
        }
        dispose() {
            this.touchBarDisposables = lifecycle_1.dispose(this.touchBarDisposables);
            super.dispose();
        }
    };
    ElectronWindow = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, windows_1.IWindowsService),
        __param(2, windows_1.IWindowService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, titleService_1.ITitleService),
        __param(5, workbenchThemeService_1.IWorkbenchThemeService),
        __param(6, notification_1.INotificationService),
        __param(7, commands_1.ICommandService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, workspaceEditing_1.IWorkspaceEditingService),
        __param(12, files_1.IFileService),
        __param(13, actions_2.IMenuService),
        __param(14, lifecycle_2.ILifecycleService),
        __param(15, integrity_1.IIntegrityService),
        __param(16, environment_1.IEnvironmentService),
        __param(17, accessibility_1.IAccessibilityService),
        __param(18, workspace_1.IWorkspaceContextService)
    ], ElectronWindow);
    exports.ElectronWindow = ElectronWindow;
});
//# sourceMappingURL=window.js.map