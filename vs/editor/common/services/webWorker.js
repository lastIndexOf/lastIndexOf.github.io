/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/services/editorWorkerServiceImpl"], function (require, exports, editorWorkerServiceImpl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Create a new web worker that has model syncing capabilities built in.
     * Specify an AMD module to load that will `create` an object that will be proxied.
     */
    function createWebWorker(modelService, opts) {
        return new MonacoWebWorkerImpl(modelService, opts);
    }
    exports.createWebWorker = createWebWorker;
    class MonacoWebWorkerImpl extends editorWorkerServiceImpl_1.EditorWorkerClient {
        constructor(modelService, opts) {
            super(modelService, opts.label);
            this._foreignModuleId = opts.moduleId;
            this._foreignModuleCreateData = opts.createData || null;
            this._foreignProxy = null;
        }
        _getForeignProxy() {
            if (!this._foreignProxy) {
                this._foreignProxy = this._getProxy().then((proxy) => {
                    return proxy.loadForeignModule(this._foreignModuleId, this._foreignModuleCreateData).then((foreignMethods) => {
                        this._foreignModuleCreateData = null;
                        const proxyMethodRequest = (method, args) => {
                            return proxy.fmr(method, args);
                        };
                        const createProxyMethod = (method, proxyMethodRequest) => {
                            return function () {
                                const args = Array.prototype.slice.call(arguments, 0);
                                return proxyMethodRequest(method, args);
                            };
                        };
                        let foreignProxy = {};
                        for (const foreignMethod of foreignMethods) {
                            foreignProxy[foreignMethod] = createProxyMethod(foreignMethod, proxyMethodRequest);
                        }
                        return foreignProxy;
                    });
                });
            }
            return this._foreignProxy;
        }
        getProxy() {
            return this._getForeignProxy();
        }
        withSyncedResources(resources) {
            return this._withSyncedResources(resources).then(_ => this.getProxy());
        }
    }
});
//# sourceMappingURL=webWorker.js.map