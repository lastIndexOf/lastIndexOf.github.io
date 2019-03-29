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
define(["require", "exports", "../node/extHost.protocol", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/workbench/api/electron-browser/extHostCustomers"], function (require, exports, extHost_protocol_1, instantiation_1, extensions_1, event_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IHeapService = instantiation_1.createDecorator('heapService');
    class HeapService {
        constructor() {
            this._onGarbageCollection = new event_1.Emitter();
            this.onGarbageCollection = this._onGarbageCollection.event;
            this._activeSignals = new WeakMap();
            this._activeIds = new Set();
            //
        }
        dispose() {
            clearInterval(this._consumeHandle);
        }
        trackObject(obj) {
            if (!obj) {
                return;
            }
            const ident = obj.$ident;
            if (typeof ident !== 'number') {
                return;
            }
            if (this._activeIds.has(ident)) {
                return;
            }
            if (this._ctor) {
                // track and leave
                this._activeIds.add(ident);
                this._activeSignals.set(obj, new this._ctor(ident));
            }
            else {
                // make sure to load gc-signals, then track and leave
                if (!this._ctorInit) {
                    this._ctorInit = new Promise((resolve_1, reject_1) => { require(['gc-signals'], resolve_1, reject_1); }).then(({ GCSignal, consumeSignals }) => {
                        this._ctor = GCSignal;
                        this._consumeHandle = setInterval(() => {
                            const ids = consumeSignals();
                            if (ids.length > 0) {
                                // local book-keeping
                                for (const id of ids) {
                                    this._activeIds.delete(id);
                                }
                                // fire event
                                this._onGarbageCollection.fire(ids);
                            }
                        }, 15 * 1000);
                    });
                }
                this._ctorInit.then(() => {
                    this._activeIds.add(ident);
                    this._activeSignals.set(obj, new this._ctor(ident));
                });
            }
        }
    }
    exports.HeapService = HeapService;
    let MainThreadHeapService = class MainThreadHeapService {
        constructor(extHostContext, heapService) {
            const proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostHeapService);
            this._toDispose = heapService.onGarbageCollection((ids) => {
                // send to ext host
                proxy.$onGarbageCollection(ids);
            });
        }
        dispose() {
            this._toDispose.dispose();
        }
    };
    MainThreadHeapService = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, exports.IHeapService)
    ], MainThreadHeapService);
    exports.MainThreadHeapService = MainThreadHeapService;
    extensions_1.registerSingleton(exports.IHeapService, HeapService, true);
});
//# sourceMappingURL=mainThreadHeapService.js.map