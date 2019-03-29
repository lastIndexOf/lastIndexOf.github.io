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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "electron", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/windows/common/windows"], function (require, exports, instantiation_1, event_1, electron_1, log_1, lifecycle_1, extensions_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IBroadcastService = instantiation_1.createDecorator('broadcastService');
    let BroadcastService = class BroadcastService extends lifecycle_1.Disposable {
        constructor(windowService, logService) {
            super();
            this.windowService = windowService;
            this.logService = logService;
            this._onBroadcast = this._register(new event_1.Emitter());
            this.windowId = windowService.getCurrentWindowId();
            this.registerListeners();
        }
        get onBroadcast() { return this._onBroadcast.event; }
        registerListeners() {
            electron_1.ipcRenderer.on('vscode:broadcast', (event, b) => {
                this.logService.trace(`Received broadcast from main in window ${this.windowId}: `, b);
                this._onBroadcast.fire(b);
            });
        }
        broadcast(b) {
            this.logService.trace(`Sending broadcast to main from window ${this.windowId}: `, b);
            electron_1.ipcRenderer.send('vscode:broadcast', this.windowId, {
                channel: b.channel,
                payload: b.payload
            });
        }
    };
    BroadcastService = __decorate([
        __param(0, windows_1.IWindowService),
        __param(1, log_1.ILogService)
    ], BroadcastService);
    exports.BroadcastService = BroadcastService;
    extensions_1.registerSingleton(exports.IBroadcastService, BroadcastService, true);
});
//# sourceMappingURL=broadcastService.js.map