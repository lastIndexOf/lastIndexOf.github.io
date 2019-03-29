/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/mouseEvent", "vs/base/common/actions", "vs/base/browser/ui/menu/menu", "vs/base/browser/dom", "vs/platform/theme/common/styler", "vs/base/browser/event", "vs/css!./contextMenuHandler"], function (require, exports, lifecycle_1, mouseEvent_1, actions_1, menu_1, dom_1, styler_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ContextMenuHandler {
        constructor(layoutService, contextViewService, telemetryService, notificationService, keybindingService, themeService) {
            this.layoutService = layoutService;
            this.contextViewService = contextViewService;
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.keybindingService = keybindingService;
            this.themeService = themeService;
            this.setContainer(this.layoutService.container);
        }
        setContainer(container) {
            if (this.element) {
                this.elementDisposable = lifecycle_1.dispose(this.elementDisposable);
                this.element = null;
            }
            if (container) {
                this.element = container;
                this.elementDisposable = dom_1.addDisposableListener(this.element, dom_1.EventType.MOUSE_DOWN, (e) => this.onMouseDown(e));
            }
        }
        showContextMenu(delegate) {
            const actions = delegate.getActions();
            if (!actions.length) {
                return; // Don't render an empty context menu
            }
            this.focusToReturn = document.activeElement;
            let menu;
            this.contextViewService.showContextView({
                getAnchor: () => delegate.getAnchor(),
                canRelayout: false,
                anchorAlignment: delegate.anchorAlignment,
                render: (container) => {
                    this.menuContainerElement = container;
                    let className = delegate.getMenuClassName ? delegate.getMenuClassName() : '';
                    if (className) {
                        container.className += ' ' + className;
                    }
                    // Render invisible div to block mouse interaction in the rest of the UI
                    if (this.layoutService.hasWorkbench) {
                        this.block = container.appendChild(dom_1.$('.context-view-block'));
                    }
                    const menuDisposables = [];
                    const actionRunner = delegate.actionRunner || new actions_1.ActionRunner();
                    actionRunner.onDidBeforeRun(this.onActionRun, this, menuDisposables);
                    actionRunner.onDidRun(this.onDidActionRun, this, menuDisposables);
                    menu = new menu_1.Menu(container, actions, {
                        actionItemProvider: delegate.getActionItem,
                        context: delegate.getActionsContext ? delegate.getActionsContext() : null,
                        actionRunner,
                        getKeyBinding: delegate.getKeyBinding ? delegate.getKeyBinding : action => this.keybindingService.lookupKeybinding(action.id)
                    });
                    menuDisposables.push(styler_1.attachMenuStyler(menu, this.themeService));
                    menu.onDidCancel(() => this.contextViewService.hideContextView(true), null, menuDisposables);
                    menu.onDidBlur(() => this.contextViewService.hideContextView(true), null, menuDisposables);
                    event_1.domEvent(window, dom_1.EventType.BLUR)(() => { this.contextViewService.hideContextView(true); }, null, menuDisposables);
                    return lifecycle_1.combinedDisposable([...menuDisposables, menu]);
                },
                focus: () => {
                    if (menu) {
                        menu.focus(!!delegate.autoSelectFirstItem);
                    }
                },
                onHide: (didCancel) => {
                    if (delegate.onHide) {
                        delegate.onHide(!!didCancel);
                    }
                    if (this.block) {
                        dom_1.removeNode(this.block);
                        this.block = null;
                    }
                    if (this.focusToReturn) {
                        this.focusToReturn.focus();
                    }
                    this.menuContainerElement = null;
                }
            });
        }
        onActionRun(e) {
            if (this.telemetryService) {
                /* __GDPR__
                    "workbenchActionExecuted" : {
                        "id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "from": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                this.telemetryService.publicLog('workbenchActionExecuted', { id: e.action.id, from: 'contextMenu' });
            }
            this.contextViewService.hideContextView(false);
            // Restore focus here
            if (this.focusToReturn) {
                this.focusToReturn.focus();
            }
        }
        onDidActionRun(e) {
            if (e.error && this.notificationService) {
                this.notificationService.error(e.error);
            }
        }
        onMouseDown(e) {
            if (!this.menuContainerElement) {
                return;
            }
            let event = new mouseEvent_1.StandardMouseEvent(e);
            let element = event.target;
            while (element) {
                if (element === this.menuContainerElement) {
                    return;
                }
                element = element.parentElement;
            }
            this.contextViewService.hideContextView();
        }
        dispose() {
            this.setContainer(null);
        }
    }
    exports.ContextMenuHandler = ContextMenuHandler;
});
//# sourceMappingURL=contextMenuHandler.js.map