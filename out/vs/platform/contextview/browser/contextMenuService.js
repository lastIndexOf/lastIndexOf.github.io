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
define(["require", "exports", "./contextMenuHandler", "./contextView", "vs/platform/telemetry/common/telemetry", "vs/base/common/event", "vs/platform/notification/common/notification", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding", "vs/base/common/lifecycle", "vs/platform/layout/browser/layoutService"], function (require, exports, contextMenuHandler_1, contextView_1, telemetry_1, event_1, notification_1, themeService_1, keybinding_1, lifecycle_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ContextMenuService = class ContextMenuService extends lifecycle_1.Disposable {
        constructor(layoutService, telemetryService, notificationService, contextViewService, keybindingService, themeService) {
            super();
            this._onDidContextMenu = this._register(new event_1.Emitter());
            this.contextMenuHandler = this._register(new contextMenuHandler_1.ContextMenuHandler(layoutService, contextViewService, telemetryService, notificationService, keybindingService, themeService));
        }
        get onDidContextMenu() { return this._onDidContextMenu.event; }
        dispose() {
            this.contextMenuHandler.dispose();
        }
        setContainer(container) {
            this.contextMenuHandler.setContainer(container);
        }
        // ContextMenu
        showContextMenu(delegate) {
            this.contextMenuHandler.showContextMenu(delegate);
            this._onDidContextMenu.fire();
        }
    };
    ContextMenuService = __decorate([
        __param(0, layoutService_1.ILayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, notification_1.INotificationService),
        __param(3, contextView_1.IContextViewService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, themeService_1.IThemeService)
    ], ContextMenuService);
    exports.ContextMenuService = ContextMenuService;
});
//# sourceMappingURL=contextMenuService.js.map