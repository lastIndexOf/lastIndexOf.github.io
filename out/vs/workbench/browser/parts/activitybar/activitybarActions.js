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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/compositeBarActions", "vs/workbench/common/actions", "vs/workbench/common/theme", "vs/workbench/services/activityBar/browser/activityBarService", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/viewlet/browser/viewlet", "vs/css!./media/activityaction"], function (require, exports, nls, DOM, keyboardEvent_1, touch_1, actions_1, lifecycle_1, actions_2, contextView_1, platform_1, telemetry_1, colorRegistry_1, themeService_1, compositeBarActions_1, actions_3, theme_1, activityBarService_1, layoutService_1, viewlet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ViewletActivityAction = class ViewletActivityAction extends compositeBarActions_1.ActivityAction {
        constructor(activity, viewletService, layoutService, telemetryService) {
            super(activity);
            this.viewletService = viewletService;
            this.layoutService = layoutService;
            this.telemetryService = telemetryService;
            this.lastRun = 0;
        }
        run(event) {
            if (event instanceof MouseEvent && event.button === 2) {
                return Promise.resolve(false); // do not run on right click
            }
            // prevent accident trigger on a doubleclick (to help nervous people)
            const now = Date.now();
            if (now > this.lastRun /* https://github.com/Microsoft/vscode/issues/25830 */ && now - this.lastRun < ViewletActivityAction.preventDoubleClickDelay) {
                return Promise.resolve(true);
            }
            this.lastRun = now;
            const sideBarVisible = this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */);
            const activeViewlet = this.viewletService.getActiveViewlet();
            // Hide sidebar if selected viewlet already visible
            if (sideBarVisible && activeViewlet && activeViewlet.getId() === this.activity.id) {
                this.logAction('hide');
                this.layoutService.setSideBarHidden(true);
                return Promise.resolve();
            }
            this.logAction('show');
            return this.viewletService.openViewlet(this.activity.id, true).then(() => this.activate());
        }
        logAction(action) {
            /* __GDPR__
                "activityBarAction" : {
                    "viewletId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "action": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this.telemetryService.publicLog('activityBarAction', { viewletId: this.activity.id, action });
        }
    };
    ViewletActivityAction.preventDoubleClickDelay = 300;
    ViewletActivityAction = __decorate([
        __param(1, viewlet_1.IViewletService),
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, telemetry_1.ITelemetryService)
    ], ViewletActivityAction);
    exports.ViewletActivityAction = ViewletActivityAction;
    let ToggleViewletAction = class ToggleViewletAction extends actions_1.Action {
        constructor(_viewlet, layoutService, viewletService) {
            super(_viewlet.id, _viewlet.name);
            this._viewlet = _viewlet;
            this.layoutService = layoutService;
            this.viewletService = viewletService;
        }
        run() {
            const sideBarVisible = this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */);
            const activeViewlet = this.viewletService.getActiveViewlet();
            // Hide sidebar if selected viewlet already visible
            if (sideBarVisible && activeViewlet && activeViewlet.getId() === this._viewlet.id) {
                this.layoutService.setSideBarHidden(true);
                return Promise.resolve();
            }
            return this.viewletService.openViewlet(this._viewlet.id, true);
        }
    };
    ToggleViewletAction = __decorate([
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, viewlet_1.IViewletService)
    ], ToggleViewletAction);
    exports.ToggleViewletAction = ToggleViewletAction;
    class GlobalActivityAction extends compositeBarActions_1.ActivityAction {
        constructor(activity) {
            super(activity);
        }
    }
    exports.GlobalActivityAction = GlobalActivityAction;
    let GlobalActivityActionItem = class GlobalActivityActionItem extends compositeBarActions_1.ActivityActionItem {
        constructor(action, colors, themeService, contextMenuService) {
            super(action, { draggable: false, colors, icon: true }, themeService);
            this.contextMenuService = contextMenuService;
        }
        render(container) {
            super.render(container);
            // Context menus are triggered on mouse down so that an item can be picked
            // and executed with releasing the mouse over it
            this._register(DOM.addDisposableListener(this.container, DOM.EventType.MOUSE_DOWN, (e) => {
                DOM.EventHelper.stop(e, true);
                this.showContextMenu();
            }));
            this._register(DOM.addDisposableListener(this.container, DOM.EventType.KEY_UP, (e) => {
                let event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* Enter */) || event.equals(10 /* Space */)) {
                    DOM.EventHelper.stop(e, true);
                    this.showContextMenu();
                }
            }));
            this._register(DOM.addDisposableListener(this.container, touch_1.EventType.Tap, (e) => {
                DOM.EventHelper.stop(e, true);
                this.showContextMenu();
            }));
        }
        showContextMenu() {
            const globalAction = this._action;
            const activity = globalAction.activity;
            const actions = activity.getActions();
            const containerPosition = DOM.getDomNodePagePosition(this.container);
            const location = { x: containerPosition.left + containerPosition.width / 2, y: containerPosition.top };
            this.contextMenuService.showContextMenu({
                getAnchor: () => location,
                getActions: () => actions,
                onHide: () => lifecycle_1.dispose(actions)
            });
        }
    };
    GlobalActivityActionItem = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, contextView_1.IContextMenuService)
    ], GlobalActivityActionItem);
    exports.GlobalActivityActionItem = GlobalActivityActionItem;
    let PlaceHolderViewletActivityAction = class PlaceHolderViewletActivityAction extends ViewletActivityAction {
        constructor(id, iconUrl, viewletService, layoutService, telemetryService) {
            super({ id, name: id, cssClass: `extensionViewlet-placeholder-${id.replace(/\./g, '-')}` }, viewletService, layoutService, telemetryService);
            const iconClass = `.monaco-workbench .activitybar .monaco-action-bar .action-label.${this.class}`; // Generate Placeholder CSS to show the icon in the activity bar
            DOM.createCSSRule(iconClass, `-webkit-mask: url('${iconUrl || ''}') no-repeat 50% 50%`);
        }
        setActivity(activity) {
            this.activity = activity;
        }
    };
    PlaceHolderViewletActivityAction = __decorate([
        __param(2, viewlet_1.IViewletService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, telemetry_1.ITelemetryService)
    ], PlaceHolderViewletActivityAction);
    exports.PlaceHolderViewletActivityAction = PlaceHolderViewletActivityAction;
    class PlaceHolderToggleCompositePinnedAction extends compositeBarActions_1.ToggleCompositePinnedAction {
        constructor(id, compositeBar) {
            super({ id, name: id, cssClass: undefined }, compositeBar);
        }
        setActivity(activity) {
            this.label = activity.name;
        }
    }
    exports.PlaceHolderToggleCompositePinnedAction = PlaceHolderToggleCompositePinnedAction;
    let SwitchSideBarViewAction = class SwitchSideBarViewAction extends actions_1.Action {
        constructor(id, name, viewletService, activityBarService) {
            super(id, name);
            this.viewletService = viewletService;
            this.activityBarService = activityBarService;
        }
        run(offset) {
            const pinnedViewletIds = this.activityBarService.getPinnedViewletIds();
            const activeViewlet = this.viewletService.getActiveViewlet();
            if (!activeViewlet) {
                return Promise.resolve();
            }
            let targetViewletId;
            for (let i = 0; i < pinnedViewletIds.length; i++) {
                if (pinnedViewletIds[i] === activeViewlet.getId()) {
                    targetViewletId = pinnedViewletIds[(i + pinnedViewletIds.length + offset) % pinnedViewletIds.length];
                    break;
                }
            }
            return this.viewletService.openViewlet(targetViewletId, true);
        }
    };
    SwitchSideBarViewAction = __decorate([
        __param(2, viewlet_1.IViewletService),
        __param(3, activityBarService_1.IActivityBarService)
    ], SwitchSideBarViewAction);
    let PreviousSideBarViewAction = class PreviousSideBarViewAction extends SwitchSideBarViewAction {
        constructor(id, name, viewletService, activityBarService) {
            super(id, name, viewletService, activityBarService);
        }
        run() {
            return super.run(-1);
        }
    };
    PreviousSideBarViewAction.ID = 'workbench.action.previousSideBarView';
    PreviousSideBarViewAction.LABEL = nls.localize('previousSideBarView', 'Previous Side Bar View');
    PreviousSideBarViewAction = __decorate([
        __param(2, viewlet_1.IViewletService),
        __param(3, activityBarService_1.IActivityBarService)
    ], PreviousSideBarViewAction);
    exports.PreviousSideBarViewAction = PreviousSideBarViewAction;
    let NextSideBarViewAction = class NextSideBarViewAction extends SwitchSideBarViewAction {
        constructor(id, name, viewletService, activityBarService) {
            super(id, name, viewletService, activityBarService);
        }
        run() {
            return super.run(1);
        }
    };
    NextSideBarViewAction.ID = 'workbench.action.nextSideBarView';
    NextSideBarViewAction.LABEL = nls.localize('nextSideBarView', 'Next Side Bar View');
    NextSideBarViewAction = __decorate([
        __param(2, viewlet_1.IViewletService),
        __param(3, activityBarService_1.IActivityBarService)
    ], NextSideBarViewAction);
    exports.NextSideBarViewAction = NextSideBarViewAction;
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(PreviousSideBarViewAction, PreviousSideBarViewAction.ID, PreviousSideBarViewAction.LABEL), 'View: Open Previous Side Bar View', nls.localize('view', "View"));
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(NextSideBarViewAction, NextSideBarViewAction.ID, NextSideBarViewAction.LABEL), 'View: Open Next Side Bar View', nls.localize('view', "View"));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const activeForegroundColor = theme.getColor(theme_1.ACTIVITY_BAR_FOREGROUND);
        if (activeForegroundColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item.active .action-label,
			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item:focus .action-label,
			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item:hover .action-label {
				background-color: ${activeForegroundColor} !important;
			}
		`);
        }
        // Styling with Outline color (e.g. high contrast theme)
        const outline = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (outline) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item:before {
				content: "";
				position: absolute;
				top: 9px;
				left: 9px;
				height: 32px;
				width: 32px;
			}

			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item.active:before,
			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item.active:hover:before,
			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item.checked:before,
			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item.checked:hover:before {
				outline: 1px solid;
			}

			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item:hover:before {
				outline: 1px dashed;
			}

			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item:focus:before {
				border-left-color: ${outline};
			}

			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item.active:before,
			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item.active:hover:before,
			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item.checked:before,
			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item.checked:hover:before,
			.monaco-workbench .activitybar > .content .monaco-action-bar .action-item:hover:before {
				outline-color: ${outline};
			}
		`);
        }
        // Styling without outline color
        else {
            const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
            if (focusBorderColor) {
                collector.addRule(`
					.monaco-workbench .activitybar > .content .monaco-action-bar .action-item:focus:before {
						border-left-color: ${focusBorderColor};
					}
				`);
            }
        }
    });
});
//# sourceMappingURL=activitybarActions.js.map