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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/workbench/browser/parts/views/viewsViewlet", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/browser/debugActions", "vs/workbench/contrib/debug/browser/debugActionItems", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "vs/platform/progress/common/progress", "vs/platform/workspace/common/workspace", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/decorators", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/debug/browser/debugToolbar", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/browser/menuItemActionItem", "vs/platform/notification/common/notification", "vs/css!./media/debugViewlet"], function (require, exports, nls, DOM, viewsViewlet_1, debug_1, debugActions_1, debugActionItems_1, instantiation_1, extensions_1, progress_1, workspace_1, telemetry_1, storage_1, themeService_1, contextView_1, lifecycle_1, layoutService_1, decorators_1, configuration_1, debugToolbar_1, keybinding_1, actions_1, contextkey_1, menuItemActionItem_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DebugViewlet = class DebugViewlet extends viewsViewlet_1.ViewContainerViewlet {
        constructor(layoutService, telemetryService, progressService, debugService, instantiationService, contextService, storageService, themeService, contextMenuService, extensionService, configurationService, keybindingService, contextViewService, menuService, contextKeyService, notificationService) {
            super(debug_1.VIEWLET_ID, `${debug_1.VIEWLET_ID}.state`, false, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
            this.progressService = progressService;
            this.debugService = debugService;
            this.keybindingService = keybindingService;
            this.contextViewService = contextViewService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.notificationService = notificationService;
            this.panelListeners = new Map();
            this.allActions = [];
            this._register(this.debugService.onDidChangeState(state => this.onDebugServiceStateChange(state)));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateTitleArea()));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug.toolBarLocation')) {
                    this.updateTitleArea();
                }
            }));
        }
        create(parent) {
            super.create(parent);
            DOM.addClass(parent, 'debug-viewlet');
        }
        focus() {
            super.focus();
            if (this.startDebugActionItem) {
                this.startDebugActionItem.focus();
            }
        }
        get startAction() {
            return this._register(this.instantiationService.createInstance(debugActions_1.StartAction, debugActions_1.StartAction.ID, debugActions_1.StartAction.LABEL));
        }
        get configureAction() {
            return this._register(this.instantiationService.createInstance(debugActions_1.ConfigureAction, debugActions_1.ConfigureAction.ID, debugActions_1.ConfigureAction.LABEL));
        }
        get toggleReplAction() {
            return this._register(this.instantiationService.createInstance(debugActions_1.ToggleReplAction, debugActions_1.ToggleReplAction.ID, debugActions_1.ToggleReplAction.LABEL));
        }
        get selectAndStartAction() {
            return this._register(this.instantiationService.createInstance(debugActions_1.SelectAndStartAction, debugActions_1.SelectAndStartAction.ID, nls.localize('startAdditionalSession', "Start Additional Session")));
        }
        getActions() {
            if (this.showInitialDebugActions) {
                return [this.startAction, this.configureAction, this.toggleReplAction];
            }
            if (!this.debugToolbarMenu) {
                this.debugToolbarMenu = this.menuService.createMenu(6 /* DebugToolbar */, this.contextKeyService);
                this.toDispose.push(this.debugToolbarMenu);
            }
            return debugToolbar_1.DebugToolbar.getActions(this.debugToolbarMenu, this.allActions, this.toDispose, this.debugService, this.keybindingService, this.instantiationService);
        }
        get showInitialDebugActions() {
            const state = this.debugService.state;
            return state === 0 /* Inactive */ || this.configurationService.getValue('debug').toolBarLocation !== 'docked';
        }
        getSecondaryActions() {
            if (this.showInitialDebugActions) {
                return [];
            }
            return [this.selectAndStartAction, this.configureAction, this.toggleReplAction];
        }
        getActionItem(action) {
            if (action.id === debugActions_1.StartAction.ID) {
                this.startDebugActionItem = this.instantiationService.createInstance(debugActionItems_1.StartDebugActionItem, null, action);
                return this.startDebugActionItem;
            }
            if (action.id === debugActions_1.FocusSessionAction.ID) {
                return new debugActionItems_1.FocusSessionActionItem(action, this.debugService, this.themeService, this.contextViewService);
            }
            if (action instanceof actions_1.MenuItemAction) {
                return new menuItemActionItem_1.MenuItemActionItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
            }
            return null;
        }
        focusView(id) {
            const view = this.getView(id);
            if (view) {
                view.focus();
            }
        }
        onDebugServiceStateChange(state) {
            if (this.progressRunner) {
                this.progressRunner.done();
            }
            if (state === 1 /* Initializing */) {
                this.progressRunner = this.progressService.show(true);
            }
            if (this.configurationService.getValue('debug').toolBarLocation === 'docked') {
                this.updateTitleArea();
            }
        }
        addPanels(panels) {
            super.addPanels(panels);
            for (const { panel } of panels) {
                // attach event listener to
                if (panel.id === debug_1.BREAKPOINTS_VIEW_ID) {
                    this.breakpointView = panel;
                    this.updateBreakpointsMaxSize();
                }
                else {
                    this.panelListeners.set(panel.id, panel.onDidChange(() => this.updateBreakpointsMaxSize()));
                }
            }
        }
        removePanels(panels) {
            super.removePanels(panels);
            for (const panel of panels) {
                lifecycle_1.dispose(this.panelListeners.get(panel.id));
                this.panelListeners.delete(panel.id);
            }
        }
        updateBreakpointsMaxSize() {
            if (this.breakpointView) {
                // We need to update the breakpoints view since all other views are collapsed #25384
                const allOtherCollapsed = this.panels.every(view => !view.isExpanded() || view === this.breakpointView);
                this.breakpointView.maximumBodySize = allOtherCollapsed ? Number.POSITIVE_INFINITY : this.breakpointView.minimumBodySize;
            }
        }
    };
    __decorate([
        decorators_1.memoize
    ], DebugViewlet.prototype, "startAction", null);
    __decorate([
        decorators_1.memoize
    ], DebugViewlet.prototype, "configureAction", null);
    __decorate([
        decorators_1.memoize
    ], DebugViewlet.prototype, "toggleReplAction", null);
    __decorate([
        decorators_1.memoize
    ], DebugViewlet.prototype, "selectAndStartAction", null);
    DebugViewlet = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, progress_1.IProgressService),
        __param(3, debug_1.IDebugService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, storage_1.IStorageService),
        __param(7, themeService_1.IThemeService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, extensions_1.IExtensionService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, keybinding_1.IKeybindingService),
        __param(12, contextView_1.IContextViewService),
        __param(13, actions_1.IMenuService),
        __param(14, contextkey_1.IContextKeyService),
        __param(15, notification_1.INotificationService)
    ], DebugViewlet);
    exports.DebugViewlet = DebugViewlet;
});
//# sourceMappingURL=debugViewlet.js.map