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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/contextkey/common/contextkey", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/panel/common/panelService", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/storage/common/storage", "vs/base/common/uri", "vs/editor/contrib/find/findState", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/extensions/common/extensions", "vs/platform/files/common/files", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/base/common/platform", "vs/base/common/path"], function (require, exports, nls, event_1, contextkey_1, lifecycle_1, panelService_1, terminal_1, storage_1, uri_1, findState_1, notification_1, dialogs_1, extensions_1, files_1, terminalEnvironment_1, platform_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalService = class TerminalService {
        constructor(_contextKeyService, _panelService, lifecycleService, _storageService, _notificationService, _dialogService, _extensionService, _fileService) {
            this._contextKeyService = _contextKeyService;
            this._panelService = _panelService;
            this._storageService = _storageService;
            this._notificationService = _notificationService;
            this._dialogService = _dialogService;
            this._extensionService = _extensionService;
            this._fileService = _fileService;
            this._terminalTabs = [];
            this._onActiveTabChanged = new event_1.Emitter();
            this._onInstanceCreated = new event_1.Emitter();
            this._onInstanceDisposed = new event_1.Emitter();
            this._onInstanceProcessIdReady = new event_1.Emitter();
            this._onInstanceRequestExtHostProcess = new event_1.Emitter();
            this._onInstanceDimensionsChanged = new event_1.Emitter();
            this._onInstancesChanged = new event_1.Emitter();
            this._onInstanceTitleChanged = new event_1.Emitter();
            this._onActiveInstanceChanged = new event_1.Emitter();
            this._onTabDisposed = new event_1.Emitter();
            this._activeTabIndex = 0;
            this._isShuttingDown = false;
            this._findState = new findState_1.FindReplaceState();
            lifecycleService.onBeforeShutdown(event => event.veto(this._onBeforeShutdown()));
            lifecycleService.onShutdown(() => this._onShutdown());
            this._terminalFocusContextKey = terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS.bindTo(this._contextKeyService);
            this._findWidgetVisible = terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_VISIBLE.bindTo(this._contextKeyService);
            this.onTabDisposed(tab => this._removeTab(tab));
            this.onActiveTabChanged(() => {
                const instance = this.getActiveInstance();
                this._onActiveInstanceChanged.fire(instance ? instance : undefined);
            });
            this._handleContextKeys();
        }
        get _terminalInstances() {
            return this._terminalTabs.reduce((p, c) => p.concat(c.terminalInstances), []);
        }
        get activeTabIndex() { return this._activeTabIndex; }
        get terminalInstances() { return this._terminalInstances; }
        get terminalTabs() { return this._terminalTabs; }
        get onActiveTabChanged() { return this._onActiveTabChanged.event; }
        get onInstanceCreated() { return this._onInstanceCreated.event; }
        get onInstanceDisposed() { return this._onInstanceDisposed.event; }
        get onInstanceProcessIdReady() { return this._onInstanceProcessIdReady.event; }
        get onInstanceRequestExtHostProcess() { return this._onInstanceRequestExtHostProcess.event; }
        get onInstanceDimensionsChanged() { return this._onInstanceDimensionsChanged.event; }
        get onInstancesChanged() { return this._onInstancesChanged.event; }
        get onInstanceTitleChanged() { return this._onInstanceTitleChanged.event; }
        get onActiveInstanceChanged() { return this._onActiveInstanceChanged.event; }
        get onTabDisposed() { return this._onTabDisposed.event; }
        _handleContextKeys() {
            const terminalIsOpenContext = terminal_1.KEYBINDING_CONTEXT_TERMINAL_IS_OPEN.bindTo(this._contextKeyService);
            const updateTerminalContextKeys = () => {
                terminalIsOpenContext.set(this.terminalInstances.length > 0);
            };
            this.onInstancesChanged(() => updateTerminalContextKeys());
        }
        createTerminalRenderer(name) {
            return this.createTerminal({ name, isRendererOnly: true });
        }
        getActiveOrCreateInstance(wasNewTerminalAction) {
            const activeInstance = this.getActiveInstance();
            return activeInstance ? activeInstance : this.createTerminal(undefined, wasNewTerminalAction);
        }
        requestExtHostProcess(proxy, shellLaunchConfig, activeWorkspaceRootUri, cols, rows) {
            // Ensure extension host is ready before requesting a process
            this._extensionService.whenInstalledExtensionsRegistered().then(() => {
                // TODO: MainThreadTerminalService is not ready at this point, fix this
                setTimeout(() => {
                    this._onInstanceRequestExtHostProcess.fire({ proxy, shellLaunchConfig, activeWorkspaceRootUri, cols, rows });
                }, 500);
            });
        }
        _onBeforeShutdown() {
            if (this.terminalInstances.length === 0) {
                // No terminal instances, don't veto
                return false;
            }
            if (this.configHelper.config.confirmOnExit) {
                // veto if configured to show confirmation and the user choosed not to exit
                return this._showTerminalCloseConfirmation().then(veto => {
                    if (!veto) {
                        this._isShuttingDown = true;
                    }
                    return veto;
                });
            }
            this._isShuttingDown = true;
            return false;
        }
        _onShutdown() {
            // Dispose of all instances
            this.terminalInstances.forEach(instance => instance.dispose(true));
        }
        getTabLabels() {
            return this._terminalTabs.filter(tab => tab.terminalInstances.length > 0).map((tab, index) => `${index + 1}: ${tab.title ? tab.title : ''}`);
        }
        getFindState() {
            return this._findState;
        }
        _removeTab(tab) {
            // Get the index of the tab and remove it from the list
            const index = this._terminalTabs.indexOf(tab);
            const wasActiveTab = tab === this.getActiveTab();
            if (index !== -1) {
                this._terminalTabs.splice(index, 1);
            }
            // Adjust focus if the tab was active
            if (wasActiveTab && this._terminalTabs.length > 0) {
                // TODO: Only focus the new tab if the removed tab had focus?
                // const hasFocusOnExit = tab.activeInstance.hadFocusOnExit;
                const newIndex = index < this._terminalTabs.length ? index : this._terminalTabs.length - 1;
                this.setActiveTabByIndex(newIndex);
                const activeInstance = this.getActiveInstance();
                if (activeInstance) {
                    activeInstance.focus(true);
                }
            }
            // Hide the panel if there are no more instances, provided that VS Code is not shutting
            // down. When shutting down the panel is locked in place so that it is restored upon next
            // launch.
            if (this._terminalTabs.length === 0 && !this._isShuttingDown) {
                this.hidePanel();
                this._onActiveInstanceChanged.fire(undefined);
            }
            // Fire events
            this._onInstancesChanged.fire();
            if (wasActiveTab) {
                this._onActiveTabChanged.fire();
            }
        }
        getActiveTab() {
            if (this._activeTabIndex < 0 || this._activeTabIndex >= this._terminalTabs.length) {
                return null;
            }
            return this._terminalTabs[this._activeTabIndex];
        }
        getActiveInstance() {
            const tab = this.getActiveTab();
            if (!tab) {
                return null;
            }
            return tab.activeInstance;
        }
        getInstanceFromId(terminalId) {
            return this.terminalInstances[this._getIndexFromId(terminalId)];
        }
        getInstanceFromIndex(terminalIndex) {
            return this.terminalInstances[terminalIndex];
        }
        setActiveInstance(terminalInstance) {
            this.setActiveInstanceByIndex(this._getIndexFromId(terminalInstance.id));
        }
        setActiveTabByIndex(tabIndex) {
            if (tabIndex >= this._terminalTabs.length) {
                return;
            }
            const didTabChange = this._activeTabIndex !== tabIndex;
            this._activeTabIndex = tabIndex;
            this._terminalTabs.forEach((t, i) => t.setVisible(i === this._activeTabIndex));
            if (didTabChange) {
                this._onActiveTabChanged.fire();
            }
        }
        _getInstanceFromGlobalInstanceIndex(index) {
            let currentTabIndex = 0;
            while (index >= 0 && currentTabIndex < this._terminalTabs.length) {
                const tab = this._terminalTabs[currentTabIndex];
                const count = tab.terminalInstances.length;
                if (index < count) {
                    return {
                        tab,
                        tabIndex: currentTabIndex,
                        instance: tab.terminalInstances[index],
                        localInstanceIndex: index
                    };
                }
                index -= count;
                currentTabIndex++;
            }
            return null;
        }
        setActiveInstanceByIndex(terminalIndex) {
            const query = this._getInstanceFromGlobalInstanceIndex(terminalIndex);
            if (!query) {
                return;
            }
            query.tab.setActiveInstanceByIndex(query.localInstanceIndex);
            const didTabChange = this._activeTabIndex !== query.tabIndex;
            this._activeTabIndex = query.tabIndex;
            this._terminalTabs.forEach((t, i) => t.setVisible(i === query.tabIndex));
            // Only fire the event if there was a change
            if (didTabChange) {
                this._onActiveTabChanged.fire();
            }
        }
        setActiveTabToNext() {
            if (this._terminalTabs.length <= 1) {
                return;
            }
            let newIndex = this._activeTabIndex + 1;
            if (newIndex >= this._terminalTabs.length) {
                newIndex = 0;
            }
            this.setActiveTabByIndex(newIndex);
        }
        setActiveTabToPrevious() {
            if (this._terminalTabs.length <= 1) {
                return;
            }
            let newIndex = this._activeTabIndex - 1;
            if (newIndex < 0) {
                newIndex = this._terminalTabs.length - 1;
            }
            this.setActiveTabByIndex(newIndex);
        }
        splitInstance(instanceToSplit, shellLaunchConfig = {}) {
            const tab = this._getTabForInstance(instanceToSplit);
            if (!tab) {
                return null;
            }
            const instance = tab.split(this._terminalFocusContextKey, this.configHelper, shellLaunchConfig);
            if (!instance) {
                this._showNotEnoughSpaceToast();
                return null;
            }
            this._initInstanceListeners(instance);
            this._onInstancesChanged.fire();
            this._terminalTabs.forEach((t, i) => t.setVisible(i === this._activeTabIndex));
            return instance;
        }
        _initInstanceListeners(instance) {
            instance.addDisposable(instance.onDisposed(this._onInstanceDisposed.fire, this._onInstanceDisposed));
            instance.addDisposable(instance.onTitleChanged(this._onInstanceTitleChanged.fire, this._onInstanceTitleChanged));
            instance.addDisposable(instance.onProcessIdReady(this._onInstanceProcessIdReady.fire, this._onInstanceProcessIdReady));
            instance.addDisposable(instance.onDimensionsChanged(() => this._onInstanceDimensionsChanged.fire(instance)));
            instance.addDisposable(instance.onFocus(this._onActiveInstanceChanged.fire, this._onActiveInstanceChanged));
        }
        _getTabForInstance(instance) {
            for (const tab of this._terminalTabs) {
                if (tab.terminalInstances.indexOf(instance) !== -1) {
                    return tab;
                }
            }
            return null;
        }
        showPanel(focus) {
            return new Promise((complete) => {
                const panel = this._panelService.getActivePanel();
                if (!panel || panel.getId() !== terminal_1.TERMINAL_PANEL_ID) {
                    this._panelService.openPanel(terminal_1.TERMINAL_PANEL_ID, focus);
                    if (focus) {
                        // Do the focus call asynchronously as going through the
                        // command palette will force editor focus
                        setTimeout(() => {
                            const instance = this.getActiveInstance();
                            if (instance) {
                                instance.focusWhenReady(true).then(() => complete(undefined));
                            }
                            else {
                                complete(undefined);
                            }
                        }, 0);
                    }
                    else {
                        complete(undefined);
                    }
                }
                else {
                    if (focus) {
                        // Do the focus call asynchronously as going through the
                        // command palette will force editor focus
                        setTimeout(() => {
                            const instance = this.getActiveInstance();
                            if (instance) {
                                instance.focusWhenReady(true).then(() => complete(undefined));
                            }
                            else {
                                complete(undefined);
                            }
                        }, 0);
                    }
                    else {
                        complete(undefined);
                    }
                }
                return undefined;
            });
        }
        _getIndexFromId(terminalId) {
            let terminalIndex = -1;
            this.terminalInstances.forEach((terminalInstance, i) => {
                if (terminalInstance.id === terminalId) {
                    terminalIndex = i;
                }
            });
            if (terminalIndex === -1) {
                throw new Error(`Terminal with ID ${terminalId} does not exist (has it already been disposed?)`);
            }
            return terminalIndex;
        }
        setWorkspaceShellAllowed(isAllowed) {
            this.configHelper.setWorkspaceShellAllowed(isAllowed);
        }
        _showTerminalCloseConfirmation() {
            let message;
            if (this.terminalInstances.length === 1) {
                message = nls.localize('terminalService.terminalCloseConfirmationSingular', "There is an active terminal session, do you want to kill it?");
            }
            else {
                message = nls.localize('terminalService.terminalCloseConfirmationPlural', "There are {0} active terminal sessions, do you want to kill them?", this.terminalInstances.length);
            }
            return this._dialogService.confirm({
                message,
                type: 'warning',
            }).then(res => !res.confirmed);
        }
        _showNotEnoughSpaceToast() {
            this._notificationService.info(nls.localize('terminal.minWidth', "Not enough space to split terminal."));
        }
        _validateShellPaths(label, potentialPaths) {
            if (potentialPaths.length === 0) {
                return Promise.resolve(null);
            }
            const current = potentialPaths.shift();
            return this._fileService.existsFile(uri_1.URI.file(current)).then(exists => {
                if (!exists) {
                    return this._validateShellPaths(label, potentialPaths);
                }
                return [label, current];
            });
        }
        preparePathForTerminalAsync(originalPath, executable, title) {
            return new Promise(c => {
                const exe = executable;
                if (!exe) {
                    c(originalPath);
                    return;
                }
                const hasSpace = originalPath.indexOf(' ') !== -1;
                const pathBasename = path_1.basename(exe, '.exe');
                const isPowerShell = pathBasename === 'pwsh' ||
                    title === 'pwsh' ||
                    pathBasename === 'powershell' ||
                    title === 'powershell';
                if (isPowerShell && (hasSpace || originalPath.indexOf('\'') !== -1)) {
                    c(`& '${originalPath.replace(/'/g, '\'\'')}'`);
                    return;
                }
                if (platform_1.isWindows) {
                    // 17063 is the build number where wsl path was introduced.
                    // Update Windows uriPath to be executed in WSL.
                    if (((exe.indexOf('wsl') !== -1) || ((exe.indexOf('bash.exe') !== -1) && (exe.indexOf('git') === -1))) && (this._getWindowsBuildNumber() >= 17063)) {
                        c(this._getWslPath(originalPath));
                        return;
                    }
                    else if (hasSpace) {
                        c('"' + originalPath + '"');
                    }
                    else {
                        c(originalPath);
                    }
                    return;
                }
                c(terminalEnvironment_1.escapeNonWindowsPath(originalPath));
            });
        }
    };
    TerminalService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, panelService_1.IPanelService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, storage_1.IStorageService),
        __param(4, notification_1.INotificationService),
        __param(5, dialogs_1.IDialogService),
        __param(6, extensions_1.IExtensionService),
        __param(7, files_1.IFileService)
    ], TerminalService);
    exports.TerminalService = TerminalService;
});
//# sourceMappingURL=terminalService.js.map