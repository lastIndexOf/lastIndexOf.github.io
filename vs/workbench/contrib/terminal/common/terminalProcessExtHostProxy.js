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
define(["require", "exports", "vs/base/common/event", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/extensions/common/extensions"], function (require, exports, event_1, terminal_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalProcessExtHostProxy = class TerminalProcessExtHostProxy {
        constructor(terminalId, shellLaunchConfig, activeWorkspaceRootUri, cols, rows, _terminalService, _extensionService) {
            this.terminalId = terminalId;
            this._terminalService = _terminalService;
            this._extensionService = _extensionService;
            this._disposables = [];
            this._onProcessData = new event_1.Emitter();
            this._onProcessExit = new event_1.Emitter();
            this._onProcessIdReady = new event_1.Emitter();
            this._onProcessTitleChanged = new event_1.Emitter();
            this._onInput = new event_1.Emitter();
            this._onResize = new event_1.Emitter();
            this._onShutdown = new event_1.Emitter();
            this._onRequestInitialCwd = new event_1.Emitter();
            this._onRequestCwd = new event_1.Emitter();
            this._pendingInitialCwdRequests = [];
            this._pendingCwdRequests = [];
            this._extensionService.whenInstalledExtensionsRegistered().then(() => {
                // TODO: MainThreadTerminalService is not ready at this point, fix this
                setTimeout(() => {
                    this._terminalService.requestExtHostProcess(this, shellLaunchConfig, activeWorkspaceRootUri, cols, rows);
                }, 0);
            });
        }
        get onProcessData() { return this._onProcessData.event; }
        get onProcessExit() { return this._onProcessExit.event; }
        get onProcessIdReady() { return this._onProcessIdReady.event; }
        get onProcessTitleChanged() { return this._onProcessTitleChanged.event; }
        get onInput() { return this._onInput.event; }
        get onResize() { return this._onResize.event; }
        get onShutdown() { return this._onShutdown.event; }
        get onRequestInitialCwd() { return this._onRequestInitialCwd.event; }
        get onRequestCwd() { return this._onRequestCwd.event; }
        dispose() {
            this._disposables.forEach(d => d.dispose());
            this._disposables.length = 0;
        }
        emitData(data) {
            this._onProcessData.fire(data);
        }
        emitTitle(title) {
            this._onProcessTitleChanged.fire(title);
        }
        emitPid(pid) {
            this._onProcessIdReady.fire(pid);
        }
        emitExit(exitCode) {
            this._onProcessExit.fire(exitCode);
            this.dispose();
        }
        emitInitialCwd(initialCwd) {
            while (this._pendingInitialCwdRequests.length > 0) {
                this._pendingInitialCwdRequests.pop()(initialCwd);
            }
        }
        emitCwd(cwd) {
            while (this._pendingCwdRequests.length > 0) {
                this._pendingCwdRequests.pop()(cwd);
            }
        }
        shutdown(immediate) {
            this._onShutdown.fire(immediate);
        }
        input(data) {
            this._onInput.fire(data);
        }
        resize(cols, rows) {
            this._onResize.fire({ cols, rows });
        }
        getInitialCwd() {
            return new Promise(resolve => {
                this._onRequestInitialCwd.fire();
                this._pendingInitialCwdRequests.push(resolve);
            });
        }
        getCwd() {
            return new Promise(resolve => {
                this._onRequestCwd.fire();
                this._pendingCwdRequests.push(resolve);
            });
        }
    };
    TerminalProcessExtHostProxy = __decorate([
        __param(5, terminal_1.ITerminalService),
        __param(6, extensions_1.IExtensionService)
    ], TerminalProcessExtHostProxy);
    exports.TerminalProcessExtHostProxy = TerminalProcessExtHostProxy;
});
//# sourceMappingURL=terminalProcessExtHostProxy.js.map