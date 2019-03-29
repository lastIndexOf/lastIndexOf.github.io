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
define(["require", "exports", "vs/nls", "vs/base/common/errorMessage", "vs/base/common/lifecycle", "vs/base/browser/ui/octiconLabel/octiconLabel", "vs/platform/registry/common/platform", "vs/platform/commands/common/commands", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/part", "vs/workbench/browser/parts/statusbar/statusbar", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/statusbar/common/statusbar", "vs/platform/contextview/browser/contextView", "vs/base/common/actions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/workspace/common/workspace", "vs/platform/theme/common/colorRegistry", "vs/editor/common/editorCommon", "vs/base/common/color", "vs/base/browser/dom", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/extensions", "vs/css!./media/statusbarpart"], function (require, exports, nls, errorMessage_1, lifecycle_1, octiconLabel_1, platform_1, commands_1, editorService_1, part_1, statusbar_1, instantiation_1, telemetry_1, statusbar_2, contextView_1, actions_1, themeService_1, theme_1, workspace_1, colorRegistry_1, editorCommon_1, color_1, dom_1, notification_1, storage_1, layoutService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let StatusbarPart = class StatusbarPart extends part_1.Part {
        constructor(instantiationService, themeService, contextService, storageService, layoutService) {
            super("workbench.parts.statusbar" /* STATUSBAR_PART */, { hasTitle: false }, themeService, storageService, layoutService);
            this.instantiationService = instantiationService;
            this.contextService = contextService;
            //#region IView
            this.minimumWidth = 0;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 22;
            this.maximumHeight = 22;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateStyles()));
        }
        addEntry(entry, alignment, priority = 0) {
            // Render entry in status bar
            const el = this.doCreateStatusItem(alignment, priority, entry.showBeak ? 'has-beak' : undefined);
            const item = this.instantiationService.createInstance(StatusBarEntryItem, entry);
            const toDispose = item.render(el);
            // Insert according to priority
            const container = this.element;
            const neighbours = this.getEntries(alignment);
            let inserted = false;
            for (const neighbour of neighbours) {
                const nPriority = Number(neighbour.getAttribute(StatusbarPart.PRIORITY_PROP));
                if (alignment === 0 /* LEFT */ && nPriority < priority ||
                    alignment === 1 /* RIGHT */ && nPriority > priority) {
                    container.insertBefore(el, neighbour);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                container.appendChild(el);
            }
            return lifecycle_1.toDisposable(() => {
                el.remove();
                if (toDispose) {
                    toDispose.dispose();
                }
            });
        }
        getEntries(alignment) {
            const entries = [];
            const container = this.element;
            const children = container.children;
            for (let i = 0; i < children.length; i++) {
                const childElement = children.item(i);
                if (Number(childElement.getAttribute(StatusbarPart.ALIGNMENT_PROP)) === alignment) {
                    entries.push(childElement);
                }
            }
            return entries;
        }
        createContentArea(parent) {
            this.element = parent;
            // Fill in initial items that were contributed from the registry
            const registry = platform_1.Registry.as(statusbar_1.Extensions.Statusbar);
            const descriptors = registry.items.slice().sort((a, b) => {
                if (a.alignment === b.alignment) {
                    if (a.alignment === 0 /* LEFT */) {
                        return b.priority - a.priority;
                    }
                    else {
                        return a.priority - b.priority;
                    }
                }
                else if (a.alignment === 0 /* LEFT */) {
                    return 1;
                }
                else if (a.alignment === 1 /* RIGHT */) {
                    return -1;
                }
                else {
                    return 0;
                }
            });
            for (const descriptor of descriptors) {
                const item = this.instantiationService.createInstance(descriptor.syncDescriptor);
                const el = this.doCreateStatusItem(descriptor.alignment, descriptor.priority);
                this._register(item.render(el));
                this.element.appendChild(el);
            }
            return this.element;
        }
        updateStyles() {
            super.updateStyles();
            const container = this.getContainer();
            // Background colors
            const backgroundColor = this.getColor(this.contextService.getWorkbenchState() !== 1 /* EMPTY */ ? theme_1.STATUS_BAR_BACKGROUND : theme_1.STATUS_BAR_NO_FOLDER_BACKGROUND);
            container.style.backgroundColor = backgroundColor;
            container.style.color = this.getColor(this.contextService.getWorkbenchState() !== 1 /* EMPTY */ ? theme_1.STATUS_BAR_FOREGROUND : theme_1.STATUS_BAR_NO_FOLDER_FOREGROUND);
            // Border color
            const borderColor = this.getColor(this.contextService.getWorkbenchState() !== 1 /* EMPTY */ ? theme_1.STATUS_BAR_BORDER : theme_1.STATUS_BAR_NO_FOLDER_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
            container.style.borderTopWidth = borderColor ? '1px' : null;
            container.style.borderTopStyle = borderColor ? 'solid' : null;
            container.style.borderTopColor = borderColor;
            // Notification Beak
            if (!this.styleElement) {
                this.styleElement = dom_1.createStyleSheet(container);
            }
            this.styleElement.innerHTML = `.monaco-workbench .part.statusbar > .statusbar-item.has-beak:before { border-bottom-color: ${backgroundColor}; }`;
        }
        doCreateStatusItem(alignment, priority = 0, extraClass) {
            const el = document.createElement('div');
            dom_1.addClass(el, 'statusbar-item');
            if (extraClass) {
                dom_1.addClass(el, extraClass);
            }
            if (alignment === 1 /* RIGHT */) {
                dom_1.addClass(el, 'right');
            }
            else {
                dom_1.addClass(el, 'left');
            }
            el.setAttribute(StatusbarPart.PRIORITY_PROP, String(priority));
            el.setAttribute(StatusbarPart.ALIGNMENT_PROP, String(alignment));
            return el;
        }
        setStatusMessage(message, autoDisposeAfter = -1, delayBy = 0) {
            if (this.statusMsgDispose) {
                this.statusMsgDispose.dispose(); // dismiss any previous
            }
            // Create new
            let statusDispose;
            let showHandle = setTimeout(() => {
                statusDispose = this.addEntry({ text: message }, 0 /* LEFT */, -Number.MAX_VALUE /* far right on left hand side */);
                showHandle = null;
            }, delayBy);
            let hideHandle;
            // Dispose function takes care of timeouts and actual entry
            const dispose = {
                dispose: () => {
                    if (showHandle) {
                        clearTimeout(showHandle);
                    }
                    if (hideHandle) {
                        clearTimeout(hideHandle);
                    }
                    if (statusDispose) {
                        statusDispose.dispose();
                    }
                }
            };
            this.statusMsgDispose = dispose;
            if (typeof autoDisposeAfter === 'number' && autoDisposeAfter > 0) {
                hideHandle = setTimeout(() => dispose.dispose(), autoDisposeAfter);
            }
            return dispose;
        }
        layout(width, height) {
            super.layoutContents(width, height);
        }
        toJSON() {
            return {
                type: "workbench.parts.statusbar" /* STATUSBAR_PART */
            };
        }
    };
    StatusbarPart.PRIORITY_PROP = 'statusbar-entry-priority';
    StatusbarPart.ALIGNMENT_PROP = 'statusbar-entry-alignment';
    StatusbarPart = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, themeService_1.IThemeService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, layoutService_1.IWorkbenchLayoutService)
    ], StatusbarPart);
    exports.StatusbarPart = StatusbarPart;
    let manageExtensionAction;
    let StatusBarEntryItem = class StatusBarEntryItem {
        constructor(entry, commandService, instantiationService, notificationService, telemetryService, contextMenuService, editorService, themeService) {
            this.entry = entry;
            this.commandService = commandService;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.contextMenuService = contextMenuService;
            this.editorService = editorService;
            this.themeService = themeService;
            this.entry = entry;
            if (!manageExtensionAction) {
                manageExtensionAction = this.instantiationService.createInstance(ManageExtensionAction);
            }
        }
        render(el) {
            let toDispose = [];
            dom_1.addClass(el, 'statusbar-entry');
            // Text Container
            let textContainer;
            if (this.entry.command) {
                textContainer = document.createElement('a');
                toDispose.push(dom_1.addDisposableListener(textContainer, 'click', () => this.executeCommand(this.entry.command, this.entry.arguments)));
            }
            else {
                textContainer = document.createElement('span');
            }
            // Label
            new octiconLabel_1.OcticonLabel(textContainer).text = this.entry.text;
            // Tooltip
            if (this.entry.tooltip) {
                textContainer.title = this.entry.tooltip;
            }
            // Color
            let color = this.entry.color;
            if (color) {
                if (editorCommon_1.isThemeColor(color)) {
                    let colorId = color.id;
                    color = (this.themeService.getTheme().getColor(colorId) || color_1.Color.transparent).toString();
                    toDispose.push(this.themeService.onThemeChange(theme => {
                        let colorValue = (this.themeService.getTheme().getColor(colorId) || color_1.Color.transparent).toString();
                        textContainer.style.color = colorValue;
                    }));
                }
                textContainer.style.color = color;
            }
            // Context Menu
            if (this.entry.extensionId) {
                toDispose.push(dom_1.addDisposableListener(textContainer, 'contextmenu', e => {
                    dom_1.EventHelper.stop(e, true);
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => el,
                        getActionsContext: () => this.entry.extensionId.value,
                        getActions: () => [manageExtensionAction]
                    });
                }));
            }
            el.appendChild(textContainer);
            return {
                dispose: () => {
                    toDispose = lifecycle_1.dispose(toDispose);
                }
            };
        }
        executeCommand(id, args) {
            args = args || [];
            // Maintain old behaviour of always focusing the editor here
            const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
            if (activeTextEditorWidget) {
                activeTextEditorWidget.focus();
            }
            /* __GDPR__
                "workbenchActionExecuted" : {
                    "id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "from": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this.telemetryService.publicLog('workbenchActionExecuted', { id, from: 'status bar' });
            this.commandService.executeCommand(id, ...args).then(undefined, err => this.notificationService.error(errorMessage_1.toErrorMessage(err)));
        }
    };
    StatusBarEntryItem = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, notification_1.INotificationService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, editorService_1.IEditorService),
        __param(7, themeService_1.IThemeService)
    ], StatusBarEntryItem);
    let ManageExtensionAction = class ManageExtensionAction extends actions_1.Action {
        constructor(commandService) {
            super('statusbar.manage.extension', nls.localize('manageExtension', "Manage Extension"));
            this.commandService = commandService;
        }
        run(extensionId) {
            return this.commandService.executeCommand('_extensions.manage', extensionId);
        }
    };
    ManageExtensionAction = __decorate([
        __param(0, commands_1.ICommandService)
    ], ManageExtensionAction);
    themeService_1.registerThemingParticipant((theme, collector) => {
        const statusBarItemHoverBackground = theme.getColor(theme_1.STATUS_BAR_ITEM_HOVER_BACKGROUND);
        if (statusBarItemHoverBackground) {
            collector.addRule(`.monaco-workbench .part.statusbar > .statusbar-item a:hover { background-color: ${statusBarItemHoverBackground}; }`);
        }
        const statusBarItemActiveBackground = theme.getColor(theme_1.STATUS_BAR_ITEM_ACTIVE_BACKGROUND);
        if (statusBarItemActiveBackground) {
            collector.addRule(`.monaco-workbench .part.statusbar > .statusbar-item a:active { background-color: ${statusBarItemActiveBackground}; }`);
        }
        const statusBarProminentItemBackground = theme.getColor(theme_1.STATUS_BAR_PROMINENT_ITEM_BACKGROUND);
        if (statusBarProminentItemBackground) {
            collector.addRule(`.monaco-workbench .part.statusbar > .statusbar-item .status-bar-info { background-color: ${statusBarProminentItemBackground}; }`);
        }
        const statusBarProminentItemHoverBackground = theme.getColor(theme_1.STATUS_BAR_PROMINENT_ITEM_HOVER_BACKGROUND);
        if (statusBarProminentItemHoverBackground) {
            collector.addRule(`.monaco-workbench .part.statusbar > .statusbar-item a.status-bar-info:hover { background-color: ${statusBarProminentItemHoverBackground}; }`);
        }
    });
    extensions_1.registerSingleton(statusbar_2.IStatusbarService, StatusbarPart);
});
//# sourceMappingURL=statusbarPart.js.map