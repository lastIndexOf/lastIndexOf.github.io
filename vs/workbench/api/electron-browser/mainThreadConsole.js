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
define(["require", "exports", "vs/workbench/api/electron-browser/extHostCustomers", "vs/workbench/api/node/extHost.protocol", "vs/platform/environment/common/environment", "vs/base/node/console", "vs/workbench/services/extensions/electron-browser/extensionHost", "vs/platform/windows/common/windows", "vs/workbench/services/broadcast/electron-browser/broadcastService", "vs/platform/extensions/common/extensionHost"], function (require, exports, extHostCustomers_1, extHost_protocol_1, environment_1, console_1, extensionHost_1, windows_1, broadcastService_1, extensionHost_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadConsole = class MainThreadConsole {
        constructor(extHostContext, _environmentService, _windowsService, _broadcastService) {
            this._environmentService = _environmentService;
            this._windowsService = _windowsService;
            this._broadcastService = _broadcastService;
            const devOpts = extensionHost_1.parseExtensionDevOptions(this._environmentService);
            this._isExtensionDevHost = devOpts.isExtensionDevHost;
            this._isExtensionDevTestFromCli = devOpts.isExtensionDevTestFromCli;
        }
        dispose() {
            //
        }
        $logExtensionHostMessage(entry) {
            // Send to local console unless we run tests from cli
            if (!this._isExtensionDevTestFromCli) {
                console_1.log(entry, 'Extension Host');
            }
            // Log on main side if running tests from cli
            if (this._isExtensionDevTestFromCli) {
                this._windowsService.log(entry.severity, ...console_1.parse(entry).args);
            }
            // Broadcast to other windows if we are in development mode
            else if (!this._environmentService.isBuilt || this._isExtensionDevHost) {
                this._broadcastService.broadcast({
                    channel: extensionHost_2.EXTENSION_LOG_BROADCAST_CHANNEL,
                    payload: {
                        logEntry: entry,
                        debugId: this._environmentService.debugExtensionHost.debugId
                    }
                });
            }
        }
    };
    MainThreadConsole = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadConsole),
        __param(1, environment_1.IEnvironmentService),
        __param(2, windows_1.IWindowsService),
        __param(3, broadcastService_1.IBroadcastService)
    ], MainThreadConsole);
    exports.MainThreadConsole = MainThreadConsole;
});
//# sourceMappingURL=mainThreadConsole.js.map