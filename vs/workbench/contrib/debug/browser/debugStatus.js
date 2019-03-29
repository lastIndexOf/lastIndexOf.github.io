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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/platform/quickOpen/common/quickOpen", "vs/platform/theme/common/themeService", "vs/workbench/contrib/debug/common/debug", "vs/workbench/common/theme", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/debug/browser/statusbarColorProvider"], function (require, exports, nls, dom, quickOpen_1, themeService_1, debug_1, theme_1, configuration_1, statusbarColorProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    let DebugStatus = class DebugStatus extends theme_1.Themable {
        constructor(quickOpenService, debugService, themeService, configurationService) {
            super(themeService);
            this.quickOpenService = quickOpenService;
            this.debugService = debugService;
            this._register(this.debugService.getConfigurationManager().onDidSelectConfiguration(e => {
                this.setLabel();
            }));
            this._register(this.debugService.onDidChangeState(state => {
                if (state !== 0 /* Inactive */ && this.showInStatusBar === 'onFirstSessionStart') {
                    this.doRender();
                }
            }));
            this.showInStatusBar = configurationService.getValue('debug').showInStatusBar;
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug.showInStatusBar')) {
                    this.showInStatusBar = configurationService.getValue('debug').showInStatusBar;
                    if (this.showInStatusBar === 'always') {
                        this.doRender();
                    }
                    if (this.statusBarItem) {
                        dom.toggleClass(this.statusBarItem, 'hidden', this.showInStatusBar === 'never');
                    }
                }
            }));
        }
        updateStyles() {
            super.updateStyles();
            if (this.icon) {
                if (statusbarColorProvider_1.isStatusbarInDebugMode(this.debugService)) {
                    this.icon.style.backgroundColor = this.getColor(statusbarColorProvider_1.STATUS_BAR_DEBUGGING_FOREGROUND);
                }
                else {
                    this.icon.style.backgroundColor = this.getColor(theme_1.STATUS_BAR_FOREGROUND);
                }
            }
        }
        render(container) {
            this.container = container;
            if (this.showInStatusBar === 'always') {
                this.doRender();
            }
            // noop, we render when we decide is best
            return this;
        }
        doRender() {
            if (!this.statusBarItem && this.container) {
                this.statusBarItem = dom.append(this.container, $('.debug-statusbar-item'));
                this._register(dom.addDisposableListener(this.statusBarItem, 'click', () => this.quickOpenService.show('debug ')));
                this.statusBarItem.title = nls.localize('selectAndStartDebug', "Select and start debug configuration");
                const a = dom.append(this.statusBarItem, $('a'));
                this.icon = dom.append(a, $('.icon'));
                this.label = dom.append(a, $('span.label'));
                this.setLabel();
            }
            this.updateStyles();
        }
        setLabel() {
            if (this.label && this.statusBarItem) {
                const manager = this.debugService.getConfigurationManager();
                const name = manager.selectedConfiguration.name || '';
                const nameAndLaunchPresent = name && manager.selectedConfiguration.launch;
                dom.toggleClass(this.statusBarItem, 'hidden', this.showInStatusBar === 'never' || !nameAndLaunchPresent);
                if (nameAndLaunchPresent) {
                    this.label.textContent = manager.getLaunches().length > 1 ? `${name} (${manager.selectedConfiguration.launch.name})` : name;
                }
            }
        }
    };
    DebugStatus = __decorate([
        __param(0, quickOpen_1.IQuickOpenService),
        __param(1, debug_1.IDebugService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService)
    ], DebugStatus);
    exports.DebugStatus = DebugStatus;
});
//# sourceMappingURL=debugStatus.js.map