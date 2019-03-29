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
define(["require", "exports", "electron", "vs/workbench/api/electron-browser/extHostCustomers", "../node/extHost.protocol"], function (require, exports, electron_1, extHostCustomers_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadCommands = class MainThreadCommands {
        dispose() {
            // nothing
        }
        $readText() {
            return Promise.resolve(electron_1.clipboard.readText());
        }
        $writeText(value) {
            electron_1.clipboard.writeText(value);
            return Promise.resolve();
        }
    };
    MainThreadCommands = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadClipboard)
    ], MainThreadCommands);
    exports.MainThreadCommands = MainThreadCommands;
});
//# sourceMappingURL=mainThreadClipboard.js.map