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
define(["require", "exports", "vs/workbench/api/electron-browser/extHostCustomers", "vs/workbench/api/node/extHost.protocol", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/electron-browser/extensionService"], function (require, exports, extHostCustomers_1, extHost_protocol_1, extensions_1, extensionService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadExtensionService = class MainThreadExtensionService {
        constructor(extHostContext, extensionService) {
            if (extensionService instanceof extensionService_1.ExtensionService) {
                this._extensionService = extensionService;
            }
        }
        dispose() {
        }
        $localShowMessage(severity, msg) {
            this._extensionService._logOrShowMessage(severity, msg);
        }
        $activateExtension(extensionId, activationEvent) {
            return this._extensionService._activateById(extensionId, activationEvent);
        }
        $onWillActivateExtension(extensionId) {
            this._extensionService._onWillActivateExtension(extensionId);
        }
        $onDidActivateExtension(extensionId, startup, codeLoadingTime, activateCallTime, activateResolvedTime, activationEvent) {
            this._extensionService._onDidActivateExtension(extensionId, startup, codeLoadingTime, activateCallTime, activateResolvedTime, activationEvent);
        }
        $onExtensionRuntimeError(extensionId, data) {
            const error = new Error();
            error.name = data.name;
            error.message = data.message;
            error.stack = data.stack;
            this._extensionService._onExtensionRuntimeError(extensionId, error);
            console.error(`[${extensionId}]${error.message}`);
            console.error(error.stack);
        }
        $onExtensionActivationFailed(extensionId) {
        }
        $addMessage(extensionId, severity, message) {
            this._extensionService._addMessage(extensionId, severity, message);
        }
    };
    MainThreadExtensionService = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadExtensionService),
        __param(1, extensions_1.IExtensionService)
    ], MainThreadExtensionService);
    exports.MainThreadExtensionService = MainThreadExtensionService;
});
//# sourceMappingURL=mainThreadExtensionService.js.map