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
define(["require", "exports", "vs/platform/progress/common/progress", "../node/extHost.protocol", "vs/workbench/api/electron-browser/extHostCustomers"], function (require, exports, progress_1, extHost_protocol_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MainThreadProgress = class MainThreadProgress {
        constructor(extHostContext, progressService) {
            this._progress = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostProgress);
            this._progressService = progressService;
        }
        dispose() {
            this._progress.forEach(handle => handle.resolve());
            this._progress.clear();
        }
        $startProgress(handle, options) {
            const task = this._createTask(handle);
            this._progressService.withProgress(options, task, () => this._proxy.$acceptProgressCanceled(handle));
        }
        $progressReport(handle, message) {
            const entry = this._progress.get(handle);
            if (entry) {
                entry.progress.report(message);
            }
        }
        $progressEnd(handle) {
            const entry = this._progress.get(handle);
            if (entry) {
                entry.resolve();
                this._progress.delete(handle);
            }
        }
        _createTask(handle) {
            return (progress) => {
                return new Promise(resolve => {
                    this._progress.set(handle, { resolve, progress });
                });
            };
        }
    };
    MainThreadProgress = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadProgress),
        __param(1, progress_1.IProgressService2)
    ], MainThreadProgress);
    exports.MainThreadProgress = MainThreadProgress;
});
//# sourceMappingURL=mainThreadProgress.js.map