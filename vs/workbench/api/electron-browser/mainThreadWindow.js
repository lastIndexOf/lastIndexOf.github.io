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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/windows/common/windows", "vs/workbench/api/electron-browser/extHostCustomers", "../node/extHost.protocol"], function (require, exports, event_1, lifecycle_1, uri_1, windows_1, extHostCustomers_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadWindow = class MainThreadWindow {
        constructor(extHostContext, windowService, windowsService) {
            this.windowService = windowService;
            this.windowsService = windowsService;
            this.disposables = [];
            this.proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostWindow);
            event_1.Event.latch(windowService.onDidChangeFocus)(this.proxy.$onDidChangeWindowFocus, this.proxy, this.disposables);
        }
        dispose() {
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
        $getWindowVisibility() {
            return this.windowService.isFocused();
        }
        $openUri(uri) {
            return this.windowsService.openExternal(uri_1.URI.revive(uri).toString(true));
        }
    };
    MainThreadWindow = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadWindow),
        __param(1, windows_1.IWindowService),
        __param(2, windows_1.IWindowsService)
    ], MainThreadWindow);
    exports.MainThreadWindow = MainThreadWindow;
});
//# sourceMappingURL=mainThreadWindow.js.map