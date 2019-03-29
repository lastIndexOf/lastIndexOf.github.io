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
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/base/common/platform", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/actions/workspaceActions", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/views/panelViewlet", "vs/workbench/browser/dnd", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme"], function (require, exports, nls, errors, env, DOM, button_1, instantiation_1, workspaceActions_1, styler_1, themeService_1, keybinding_1, contextView_1, workspace_1, configuration_1, panelViewlet_1, dnd_1, colorRegistry_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let EmptyView = class EmptyView extends panelViewlet_1.ViewletPanel {
        constructor(options, themeService, instantiationService, keybindingService, contextMenuService, contextService, configurationService) {
            super(Object.assign({}, options, { ariaHeaderLabel: nls.localize('explorerSection', "Files Explorer Section") }), keybindingService, contextMenuService, configurationService);
            this.themeService = themeService;
            this.instantiationService = instantiationService;
            this.contextService = contextService;
            this.contextService.onDidChangeWorkbenchState(() => this.setLabels());
        }
        renderHeader(container) {
            const titleContainer = document.createElement('div');
            DOM.addClass(titleContainer, 'title');
            container.appendChild(titleContainer);
            this.titleElement = document.createElement('span');
            this.titleElement.textContent = name;
            titleContainer.appendChild(this.titleElement);
        }
        renderBody(container) {
            DOM.addClass(container, 'explorer-empty-view');
            container.tabIndex = 0;
            const messageContainer = document.createElement('div');
            DOM.addClass(messageContainer, 'section');
            container.appendChild(messageContainer);
            this.messageElement = document.createElement('p');
            messageContainer.appendChild(this.messageElement);
            this.button = new button_1.Button(messageContainer);
            styler_1.attachButtonStyler(this.button, this.themeService);
            this.disposables.push(this.button.onDidClick(() => {
                if (!this.actionRunner) {
                    return;
                }
                const actionClass = this.contextService.getWorkbenchState() === 3 /* WORKSPACE */ ? workspaceActions_1.AddRootFolderAction : env.isMacintosh ? workspaceActions_1.OpenFileFolderAction : workspaceActions_1.OpenFolderAction;
                const action = this.instantiationService.createInstance(actionClass, actionClass.ID, actionClass.LABEL);
                this.actionRunner.run(action).then(() => {
                    action.dispose();
                }, err => {
                    action.dispose();
                    errors.onUnexpectedError(err);
                });
            }));
            this.disposables.push(new dnd_1.DragAndDropObserver(container, {
                onDrop: e => {
                    const color = this.themeService.getTheme().getColor(theme_1.SIDE_BAR_BACKGROUND);
                    container.style.backgroundColor = color ? color.toString() : '';
                    const dropHandler = this.instantiationService.createInstance(dnd_1.ResourcesDropHandler, { allowWorkspaceOpen: true });
                    dropHandler.handleDrop(e, () => undefined, targetGroup => undefined);
                },
                onDragEnter: (e) => {
                    const color = this.themeService.getTheme().getColor(colorRegistry_1.listDropBackground);
                    container.style.backgroundColor = color ? color.toString() : '';
                },
                onDragEnd: () => {
                    const color = this.themeService.getTheme().getColor(theme_1.SIDE_BAR_BACKGROUND);
                    container.style.backgroundColor = color ? color.toString() : '';
                },
                onDragLeave: () => {
                    const color = this.themeService.getTheme().getColor(theme_1.SIDE_BAR_BACKGROUND);
                    container.style.backgroundColor = color ? color.toString() : '';
                },
                onDragOver: e => {
                    e.dataTransfer.dropEffect = 'copy';
                }
            }));
            this.setLabels();
        }
        setLabels() {
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                this.messageElement.textContent = nls.localize('noWorkspaceHelp', "You have not yet added a folder to the workspace.");
                if (this.button) {
                    this.button.label = nls.localize('addFolder', "Add Folder");
                }
                this.titleElement.textContent = EmptyView.NAME;
            }
            else {
                this.messageElement.textContent = nls.localize('noFolderHelp', "You have not yet opened a folder.");
                if (this.button) {
                    this.button.label = nls.localize('openFolder', "Open Folder");
                }
                this.titleElement.textContent = this.title;
            }
        }
        layoutBody(size) {
            // no-op
        }
        focusBody() {
            if (this.button) {
                this.button.element.focus();
            }
        }
    };
    EmptyView.ID = 'workbench.explorer.emptyView';
    EmptyView.NAME = nls.localize('noWorkspace', "No Folder Opened");
    EmptyView = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, configuration_1.IConfigurationService)
    ], EmptyView);
    exports.EmptyView = EmptyView;
});
//# sourceMappingURL=emptyView.js.map