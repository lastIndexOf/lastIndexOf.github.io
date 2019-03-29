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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/platform/windows/common/windows", "vs/workbench/common/editor", "vs/workbench/common/contextkeys", "vs/base/browser/dom", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/workbench/services/editor/common/editorService", "vs/platform/workspace/common/workspace", "vs/workbench/common/viewlet", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/viewlet/browser/viewlet"], function (require, exports, event_1, lifecycle_1, contextkey_1, contextkeys_1, windows_1, editor_1, contextkeys_2, dom_1, editorGroupsService_1, configuration_1, environment_1, editorService_1, workspace_1, viewlet_1, layoutService_1, viewlet_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WorkbenchContextKeysHandler = class WorkbenchContextKeysHandler extends lifecycle_1.Disposable {
        constructor(contextKeyService, contextService, configurationService, environmentService, windowService, editorService, editorGroupService, layoutService, viewletService) {
            super();
            this.contextKeyService = contextKeyService;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.windowService = windowService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.layoutService = layoutService;
            this.viewletService = viewletService;
            this.initContextKeys();
            this.registerListeners();
        }
        registerListeners() {
            this.editorGroupService.whenRestored.then(() => this.updateEditorContextKeys());
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateEditorContextKeys()));
            this._register(this.editorService.onDidVisibleEditorsChange(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidAddGroup(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidRemoveGroup(() => this.updateEditorContextKeys()));
            this._register(dom_1.addDisposableListener(window, dom_1.EventType.FOCUS_IN, () => this.updateInputContextKeys(), true));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateWorkbenchStateContextKey()));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.updateWorkspaceFolderCountContextKey()));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.editor.openSideBySideDirection')) {
                    this.updateSplitEditorsVerticallyContext();
                }
            }));
            this._register(this.layoutService.onZenModeChange(enabled => this.inZenModeContext.set(enabled)));
            this._register(this.viewletService.onDidViewletClose(() => this.updateSideBarContextKeys()));
            this._register(this.viewletService.onDidViewletOpen(() => this.updateSideBarContextKeys()));
        }
        initContextKeys() {
            // Platform
            contextkeys_2.IsMacContext.bindTo(this.contextKeyService);
            contextkeys_2.IsLinuxContext.bindTo(this.contextKeyService);
            contextkeys_2.IsWindowsContext.bindTo(this.contextKeyService);
            // macOS Native Tabs
            const windowConfig = this.configurationService.getValue();
            contextkeys_2.HasMacNativeTabsContext.bindTo(this.contextKeyService).set(windowConfig && windowConfig.window && windowConfig.window.nativeTabs);
            // Development
            contextkeys_2.IsDevelopmentContext.bindTo(this.contextKeyService).set(!this.environmentService.isBuilt || this.environmentService.isExtensionDevelopment);
            // File Pickers
            contextkeys_2.SupportsWorkspacesContext.bindTo(this.contextKeyService);
            contextkeys_2.SupportsOpenFileFolderContext.bindTo(this.contextKeyService).set(!!this.windowService.getConfiguration().remoteAuthority);
            // Editors
            this.activeEditorContext = editor_1.ActiveEditorContext.bindTo(this.contextKeyService);
            this.editorsVisibleContext = editor_1.EditorsVisibleContext.bindTo(this.contextKeyService);
            this.textCompareEditorVisibleContext = editor_1.TextCompareEditorVisibleContext.bindTo(this.contextKeyService);
            this.textCompareEditorActiveContext = editor_1.TextCompareEditorActiveContext.bindTo(this.contextKeyService);
            this.activeEditorGroupEmpty = editor_1.ActiveEditorGroupEmptyContext.bindTo(this.contextKeyService);
            this.multipleEditorGroupsContext = editor_1.MultipleEditorGroupsContext.bindTo(this.contextKeyService);
            // Inputs
            this.inputFocusedContext = contextkeys_1.InputFocusedContext.bindTo(this.contextKeyService);
            // Workbench State
            this.workbenchStateContext = contextkeys_2.WorkbenchStateContext.bindTo(this.contextKeyService);
            this.updateWorkbenchStateContextKey();
            // Workspace Folder Count
            this.workspaceFolderCountContext = contextkeys_2.WorkspaceFolderCountContext.bindTo(this.contextKeyService);
            this.updateWorkspaceFolderCountContextKey();
            // Editor Layout
            this.splitEditorsVerticallyContext = editor_1.SplitEditorsVertically.bindTo(this.contextKeyService);
            this.updateSplitEditorsVerticallyContext();
            // Zen Mode
            this.inZenModeContext = editor_1.InEditorZenModeContext.bindTo(this.contextKeyService);
            // Sidebar
            this.sideBarVisibleContext = viewlet_1.SideBarVisibleContext.bindTo(this.contextKeyService);
            this.sidebarVisibleContext = viewlet_1.SidebarVisibleContext.bindTo(this.contextKeyService);
        }
        updateEditorContextKeys() {
            const activeControl = this.editorService.activeControl;
            const visibleEditors = this.editorService.visibleControls;
            this.textCompareEditorActiveContext.set(!!activeControl && activeControl.getId() === editor_1.TEXT_DIFF_EDITOR_ID);
            this.textCompareEditorVisibleContext.set(visibleEditors.some(control => control.getId() === editor_1.TEXT_DIFF_EDITOR_ID));
            if (visibleEditors.length > 0) {
                this.editorsVisibleContext.set(true);
            }
            else {
                this.editorsVisibleContext.reset();
            }
            if (!this.editorService.activeEditor) {
                this.activeEditorGroupEmpty.set(true);
            }
            else {
                this.activeEditorGroupEmpty.reset();
            }
            if (this.editorGroupService.count > 1) {
                this.multipleEditorGroupsContext.set(true);
            }
            else {
                this.multipleEditorGroupsContext.reset();
            }
            if (activeControl) {
                this.activeEditorContext.set(activeControl.getId());
            }
            else {
                this.activeEditorContext.reset();
            }
        }
        updateInputContextKeys() {
            function activeElementIsInput() {
                return !!document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
            }
            const isInputFocused = activeElementIsInput();
            this.inputFocusedContext.set(isInputFocused);
            if (isInputFocused) {
                const tracker = dom_1.trackFocus(document.activeElement);
                event_1.Event.once(tracker.onDidBlur)(() => {
                    this.inputFocusedContext.set(activeElementIsInput());
                    tracker.dispose();
                });
            }
        }
        updateWorkbenchStateContextKey() {
            this.workbenchStateContext.set(this.getWorkbenchStateString());
        }
        updateWorkspaceFolderCountContextKey() {
            this.workspaceFolderCountContext.set(this.contextService.getWorkspace().folders.length);
        }
        updateSplitEditorsVerticallyContext() {
            const direction = editorGroupsService_1.preferredSideBySideGroupDirection(this.configurationService);
            this.splitEditorsVerticallyContext.set(direction === 1 /* DOWN */);
        }
        getWorkbenchStateString() {
            switch (this.contextService.getWorkbenchState()) {
                case 1 /* EMPTY */: return 'empty';
                case 2 /* FOLDER */: return 'folder';
                case 3 /* WORKSPACE */: return 'workspace';
            }
        }
        updateSideBarContextKeys() {
            this.sideBarVisibleContext.set(this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */));
            this.sidebarVisibleContext.set(this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */));
        }
    };
    WorkbenchContextKeysHandler = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, windows_1.IWindowService),
        __param(5, editorService_1.IEditorService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, layoutService_1.IWorkbenchLayoutService),
        __param(8, viewlet_2.IViewletService)
    ], WorkbenchContextKeysHandler);
    exports.WorkbenchContextKeysHandler = WorkbenchContextKeysHandler;
});
//# sourceMappingURL=contextkeys.js.map