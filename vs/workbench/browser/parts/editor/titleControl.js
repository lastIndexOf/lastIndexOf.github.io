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
define(["require", "exports", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/actions/browser/menuItemActionItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/quickOpen/common/quickOpen", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/actions", "vs/workbench/browser/dnd", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/workbench/browser/parts/editor/breadcrumbsControl", "vs/workbench/browser/parts/editor/editor", "vs/workbench/common/editor", "vs/workbench/common/resources", "vs/workbench/common/theme", "vs/workbench/services/extensions/common/extensions", "vs/platform/files/common/files", "vs/base/common/types", "vs/css!./media/titlecontrol"], function (require, exports, dnd_1, dom_1, mouseEvent_1, toolbar_1, arrays, lifecycle_1, editorBrowser_1, nls_1, menuItemActionItem_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, notification_1, quickOpen_1, telemetry_1, colorRegistry_1, themeService_1, actions_2, dnd_2, baseEditor_1, breadcrumbs_1, breadcrumbsControl_1, editor_1, editor_2, resources_1, theme_1, extensions_1, files_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TitleControl = class TitleControl extends theme_1.Themable {
        constructor(parent, accessor, group, contextMenuService, instantiationService, contextKeyService, keybindingService, telemetryService, notificationService, menuService, quickOpenService, themeService, extensionService, configurationService, fileService) {
            super(themeService);
            this.accessor = accessor;
            this.group = group;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.keybindingService = keybindingService;
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.menuService = menuService;
            this.quickOpenService = quickOpenService;
            this.extensionService = extensionService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.groupTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.editorTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.currentPrimaryEditorActionIds = [];
            this.currentSecondaryEditorActionIds = [];
            this.editorToolBarMenuDisposables = [];
            this.resourceContext = this._register(instantiationService.createInstance(resources_1.ResourceContextKey));
            this.contextMenu = this._register(this.menuService.createMenu(9 /* EditorTitleContext */, this.contextKeyService));
            this.create(parent);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.extensionService.onDidRegisterExtensions(() => this.updateEditorActionsToolbar()));
        }
        createBreadcrumbsControl(container, options) {
            const config = this._register(breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(this.configurationService));
            this._register(config.onDidChange(() => {
                const value = config.getValue();
                if (!value && this.breadcrumbsControl) {
                    this.breadcrumbsControl.dispose();
                    this.breadcrumbsControl = undefined;
                    this.handleBreadcrumbsEnablementChange();
                }
                else if (value && !this.breadcrumbsControl) {
                    this.breadcrumbsControl = this.instantiationService.createInstance(breadcrumbsControl_1.BreadcrumbsControl, container, options, this.group);
                    this.breadcrumbsControl.update();
                    this.handleBreadcrumbsEnablementChange();
                }
            }));
            if (config.getValue()) {
                this.breadcrumbsControl = this.instantiationService.createInstance(breadcrumbsControl_1.BreadcrumbsControl, container, options, this.group);
            }
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(() => {
                if (this.breadcrumbsControl && this.breadcrumbsControl.update()) {
                    this.handleBreadcrumbsEnablementChange();
                }
            }));
        }
        createEditorActionsToolBar(container) {
            const context = { groupId: this.group.id };
            this.editorActionsToolbar = this._register(new toolbar_1.ToolBar(container, this.contextMenuService, {
                actionItemProvider: action => this.actionItemProvider(action),
                orientation: 0 /* HORIZONTAL */,
                ariaLabel: nls_1.localize('araLabelEditorActions', "Editor actions"),
                getKeyBinding: action => this.getKeybinding(action),
                actionRunner: this._register(new editor_2.EditorCommandsContextActionRunner(context)),
                anchorAlignmentProvider: () => 1 /* RIGHT */
            }));
            // Context
            this.editorActionsToolbar.context = context;
            // Action Run Handling
            this._register(this.editorActionsToolbar.actionRunner.onDidRun((e) => {
                // Notify for Error
                this.notificationService.error(e.error);
                // Log in telemetry
                if (this.telemetryService) {
                    /* __GDPR__
                        "workbenchActionExecuted" : {
                            "id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                            "from": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                        }
                    */
                    this.telemetryService.publicLog('workbenchActionExecuted', { id: e.action.id, from: 'editorPart' });
                }
            }));
        }
        actionItemProvider(action) {
            const activeControl = this.group.activeControl;
            // Check Active Editor
            let actionItem = null;
            if (activeControl instanceof baseEditor_1.BaseEditor) {
                actionItem = activeControl.getActionItem(action);
            }
            // Check extensions
            if (!actionItem) {
                actionItem = types_1.withUndefinedAsNull(menuItemActionItem_1.createActionItem(action, this.keybindingService, this.notificationService, this.contextMenuService));
            }
            return actionItem;
        }
        updateEditorActionsToolbar() {
            // Update Editor Actions Toolbar
            const { primaryEditorActions, secondaryEditorActions } = this.prepareEditorActions(this.getEditorActions());
            // Only update if something actually has changed
            const primaryEditorActionIds = primaryEditorActions.map(a => a.id);
            const secondaryEditorActionIds = secondaryEditorActions.map(a => a.id);
            if (!arrays.equals(primaryEditorActionIds, this.currentPrimaryEditorActionIds) ||
                !arrays.equals(secondaryEditorActionIds, this.currentSecondaryEditorActionIds) ||
                primaryEditorActions.some(action => action instanceof actions_1.ExecuteCommandAction) || // execute command actions can have the same ID but different arguments
                secondaryEditorActions.some(action => action instanceof actions_1.ExecuteCommandAction) // see also https://github.com/Microsoft/vscode/issues/16298
            ) {
                this.editorActionsToolbar.setActions(primaryEditorActions, secondaryEditorActions)();
                this.currentPrimaryEditorActionIds = primaryEditorActionIds;
                this.currentSecondaryEditorActionIds = secondaryEditorActionIds;
            }
        }
        prepareEditorActions(editorActions) {
            let primaryEditorActions;
            let secondaryEditorActions;
            // Primary actions only for the active group
            if (this.accessor.activeGroup === this.group) {
                primaryEditorActions = actions_2.prepareActions(editorActions.primary);
            }
            else {
                primaryEditorActions = [];
            }
            // Secondary actions for all groups
            secondaryEditorActions = actions_2.prepareActions(editorActions.secondary);
            return { primaryEditorActions, secondaryEditorActions };
        }
        getEditorActions() {
            const primary = [];
            const secondary = [];
            // Dispose previous listeners
            this.editorToolBarMenuDisposables = lifecycle_1.dispose(this.editorToolBarMenuDisposables);
            // Update the resource context
            this.resourceContext.set(this.group.activeEditor ? editor_2.toResource(this.group.activeEditor, { supportSideBySide: true }) : null);
            // Editor actions require the editor control to be there, so we retrieve it via service
            const activeControl = this.group.activeControl;
            if (activeControl instanceof baseEditor_1.BaseEditor) {
                const codeEditor = editorBrowser_1.getCodeEditor(activeControl.getControl());
                const scopedContextKeyService = codeEditor && codeEditor.invokeWithinContext(accessor => accessor.get(contextkey_1.IContextKeyService)) || this.contextKeyService;
                const titleBarMenu = this.menuService.createMenu(8 /* EditorTitle */, scopedContextKeyService);
                this.editorToolBarMenuDisposables.push(titleBarMenu);
                this.editorToolBarMenuDisposables.push(titleBarMenu.onDidChange(() => {
                    this.updateEditorActionsToolbar(); // Update editor toolbar whenever contributed actions change
                }));
                menuItemActionItem_1.fillInActionBarActions(titleBarMenu, { arg: this.resourceContext.get(), shouldForwardArgs: true }, { primary, secondary });
            }
            return { primary, secondary };
        }
        clearEditorActionsToolbar() {
            this.editorActionsToolbar.setActions([], [])();
            this.currentPrimaryEditorActionIds = [];
            this.currentSecondaryEditorActionIds = [];
        }
        enableGroupDragging(element) {
            // Drag start
            this._register(dom_1.addDisposableListener(element, dom_1.EventType.DRAG_START, (e) => {
                if (e.target !== element) {
                    return; // only if originating from tabs container
                }
                // Set editor group as transfer
                this.groupTransfer.setData([new dnd_2.DraggedEditorGroupIdentifier(this.group.id)], dnd_2.DraggedEditorGroupIdentifier.prototype);
                e.dataTransfer.effectAllowed = 'copyMove';
                // If tabs are disabled, treat dragging as if an editor tab was dragged
                if (!this.accessor.partOptions.showTabs) {
                    const resource = this.group.activeEditor ? editor_2.toResource(this.group.activeEditor, { supportSideBySide: true }) : null;
                    if (resource) {
                        this.instantiationService.invokeFunction(dnd_2.fillResourceDataTransfers, [resource], e);
                    }
                }
                // Drag Image
                if (this.group.activeEditor) {
                    let label = this.group.activeEditor.getName();
                    if (this.accessor.partOptions.showTabs && this.group.count > 1) {
                        label = nls_1.localize('draggedEditorGroup', "{0} (+{1})", label, this.group.count - 1);
                    }
                    dnd_1.applyDragImage(e, label, 'monaco-editor-group-drag-image');
                }
            }));
            // Drag end
            this._register(dom_1.addDisposableListener(element, dom_1.EventType.DRAG_END, () => {
                this.groupTransfer.clearData(dnd_2.DraggedEditorGroupIdentifier.prototype);
            }));
        }
        onContextMenu(editor, e, node) {
            // Update the resource context
            const currentContext = this.resourceContext.get();
            this.resourceContext.set(editor_2.toResource(editor, { supportSideBySide: true }));
            // Find target anchor
            let anchor = node;
            if (e instanceof MouseEvent) {
                const event = new mouseEvent_1.StandardMouseEvent(e);
                anchor = { x: event.posx, y: event.posy };
            }
            // Fill in contributed actions
            const actions = [];
            menuItemActionItem_1.fillInContextMenuActions(this.contextMenu, { shouldForwardArgs: true, arg: this.resourceContext.get() }, actions, this.contextMenuService);
            // Show it
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                getActionsContext: () => ({ groupId: this.group.id, editorIndex: this.group.getIndexOfEditor(editor) }),
                getKeyBinding: (action) => this.getKeybinding(action),
                onHide: () => {
                    // restore previous context
                    this.resourceContext.set(currentContext || null);
                    // restore focus to active group
                    this.accessor.activeGroup.focus();
                }
            });
        }
        getKeybinding(action) {
            return this.keybindingService.lookupKeybinding(action.id);
        }
        getKeybindingLabel(action) {
            const keybinding = this.getKeybinding(action);
            return keybinding ? keybinding.getLabel() || undefined : undefined;
        }
        layout(dimension) {
            if (this.breadcrumbsControl) {
                this.breadcrumbsControl.layout(undefined);
            }
        }
        getPreferredHeight() {
            return editor_1.EDITOR_TITLE_HEIGHT + (this.breadcrumbsControl && !this.breadcrumbsControl.isHidden() ? breadcrumbsControl_1.BreadcrumbsControl.HEIGHT : 0);
        }
        dispose() {
            lifecycle_1.dispose(this.breadcrumbsControl);
            this.breadcrumbsControl = undefined;
            this.editorToolBarMenuDisposables = lifecycle_1.dispose(this.editorToolBarMenuDisposables);
            super.dispose();
        }
    };
    TitleControl = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, notification_1.INotificationService),
        __param(9, actions_1.IMenuService),
        __param(10, quickOpen_1.IQuickOpenService),
        __param(11, themeService_1.IThemeService),
        __param(12, extensions_1.IExtensionService),
        __param(13, configuration_1.IConfigurationService),
        __param(14, files_1.IFileService)
    ], TitleControl);
    exports.TitleControl = TitleControl;
    themeService_1.registerThemingParticipant((theme, collector) => {
        // Drag Feedback
        const dragImageBackground = theme.getColor(colorRegistry_1.listActiveSelectionBackground);
        const dragImageForeground = theme.getColor(colorRegistry_1.listActiveSelectionForeground);
        collector.addRule(`
		.monaco-editor-group-drag-image {
			background: ${dragImageBackground};
			color: ${dragImageForeground};
		}
	`);
    });
});
//# sourceMappingURL=titleControl.js.map