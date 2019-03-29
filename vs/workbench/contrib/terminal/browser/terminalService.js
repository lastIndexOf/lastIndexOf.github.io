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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalService", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/layout/browser/layoutService", "vs/platform/lifecycle/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/workbench/contrib/terminal/browser/terminalTab", "vs/platform/instantiation/common/instantiation", "vs/platform/windows/common/windows", "vs/workbench/services/extensions/common/extensions", "vs/platform/files/common/files", "vs/workbench/contrib/terminal/browser/terminalInstance"], function (require, exports, nls, platform, terminal_1, terminalService_1, contextkey_1, panelService_1, layoutService_1, lifecycle_1, storage_1, dialogs_1, notification_1, terminalTab_1, instantiation_1, windows_1, extensions_1, files_1, terminalInstance_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalService = class TerminalService extends terminalService_1.TerminalService {
        constructor(contextKeyService, panelService, _layoutService, lifecycleService, storageService, notificationService, dialogService, _instantiationService, _windowService, extensionService, fileService) {
            super(contextKeyService, panelService, lifecycleService, storageService, notificationService, dialogService, extensionService, fileService);
            this._layoutService = _layoutService;
            this._instantiationService = _instantiationService;
            this._windowService = _windowService;
        }
        createInstance(terminalFocusContextKey, configHelper, container, shellLaunchConfig, doCreateProcess) {
            const instance = this._instantiationService.createInstance(terminalInstance_1.TerminalInstance, terminalFocusContextKey, configHelper, container, shellLaunchConfig);
            this._onInstanceCreated.fire(instance);
            return instance;
        }
        createTerminal(shell = {}, wasNewTerminalAction) {
            const terminalTab = this._instantiationService.createInstance(terminalTab_1.TerminalTab, this._terminalFocusContextKey, this.configHelper, this._terminalContainer, shell);
            this._terminalTabs.push(terminalTab);
            const instance = terminalTab.terminalInstances[0];
            terminalTab.addDisposable(terminalTab.onDisposed(this._onTabDisposed.fire, this._onTabDisposed));
            terminalTab.addDisposable(terminalTab.onInstancesChanged(this._onInstancesChanged.fire, this._onInstancesChanged));
            this._initInstanceListeners(instance);
            if (this.terminalInstances.length === 1) {
                // It's the first instance so it should be made active automatically
                this.setActiveInstanceByIndex(0);
            }
            this._onInstancesChanged.fire();
            this._suggestShellChange(wasNewTerminalAction);
            return instance;
        }
        _suggestShellChange(wasNewTerminalAction) {
            // Only suggest on Windows since $SHELL works great for macOS/Linux
            if (!platform.isWindows) {
                return;
            }
            if (this._windowService.getConfiguration().remoteAuthority) {
                // Don't suggest if the opened workspace is remote
                return;
            }
            // Only suggest when the terminal instance is being created by an explicit user action to
            // launch a terminal, as opposed to something like tasks, debug, panel restore, etc.
            if (!wasNewTerminalAction) {
                return;
            }
            if (this._windowService.getConfiguration().remoteAuthority) {
                // Don't suggest if the opened workspace is remote
                return;
            }
            // Don't suggest if the user has explicitly opted out
            const neverSuggest = this._storageService.getBoolean(terminal_1.NEVER_SUGGEST_SELECT_WINDOWS_SHELL_STORAGE_KEY, 0 /* GLOBAL */, false);
            if (neverSuggest) {
                return;
            }
            // Never suggest if the setting is non-default already (ie. they set the setting manually)
            if (this.configHelper.config.shell.windows !== this._getDefaultShell(3 /* Windows */)) {
                this._storageService.store(terminal_1.NEVER_SUGGEST_SELECT_WINDOWS_SHELL_STORAGE_KEY, true, 0 /* GLOBAL */);
                return;
            }
            this._notificationService.prompt(notification_1.Severity.Info, nls.localize('terminal.integrated.chooseWindowsShellInfo', "You can change the default terminal shell by selecting the customize button."), [{
                    label: nls.localize('customize', "Customize"),
                    run: () => {
                        this.selectDefaultWindowsShell().then(shell => {
                            if (!shell) {
                                return Promise.resolve(null);
                            }
                            // Launch a new instance with the newly selected shell
                            const instance = this.createTerminal({
                                executable: shell,
                                args: this.configHelper.config.shellArgs.windows
                            });
                            if (instance) {
                                this.setActiveInstance(instance);
                            }
                            return Promise.resolve(null);
                        });
                    }
                },
                {
                    label: nls.localize('never again', "Don't Show Again"),
                    isSecondary: true,
                    run: () => this._storageService.store(terminal_1.NEVER_SUGGEST_SELECT_WINDOWS_SHELL_STORAGE_KEY, true, 0 /* GLOBAL */)
                }]);
        }
        focusFindWidget() {
            return this.showPanel(false).then(() => {
                const panel = this._panelService.getActivePanel();
                panel.focusFindWidget();
                this._findWidgetVisible.set(true);
            });
        }
        hideFindWidget() {
            const panel = this._panelService.getActivePanel();
            if (panel && panel.getId() === terminal_1.TERMINAL_PANEL_ID) {
                panel.hideFindWidget();
                this._findWidgetVisible.reset();
                panel.focus();
            }
        }
        findNext() {
            const panel = this._panelService.getActivePanel();
            if (panel && panel.getId() === terminal_1.TERMINAL_PANEL_ID) {
                panel.showFindWidget();
                panel.getFindWidget().find(false);
            }
        }
        findPrevious() {
            const panel = this._panelService.getActivePanel();
            if (panel && panel.getId() === terminal_1.TERMINAL_PANEL_ID) {
                panel.showFindWidget();
                panel.getFindWidget().find(true);
            }
        }
        setContainers(panelContainer, terminalContainer) {
            this._configHelper.panelContainer = panelContainer;
            this._terminalContainer = terminalContainer;
            this._terminalTabs.forEach(tab => tab.attachToElement(this._terminalContainer));
        }
        hidePanel() {
            const panel = this._panelService.getActivePanel();
            if (panel && panel.getId() === terminal_1.TERMINAL_PANEL_ID) {
                this._layoutService.setPanelHidden(true);
            }
        }
    };
    TerminalService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, panelService_1.IPanelService),
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, lifecycle_1.ILifecycleService),
        __param(4, storage_1.IStorageService),
        __param(5, notification_1.INotificationService),
        __param(6, dialogs_1.IDialogService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, windows_1.IWindowService),
        __param(9, extensions_1.IExtensionService),
        __param(10, files_1.IFileService)
    ], TerminalService);
    exports.TerminalService = TerminalService;
});
//# sourceMappingURL=terminalService.js.map