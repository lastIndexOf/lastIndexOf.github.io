/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/node/extHost.protocol", "vs/workbench/api/node/extHostTypes"], function (require, exports, uri_1, extHost_protocol_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostDecorations {
        constructor(mainContext) {
            this._provider = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadDecorations);
        }
        registerDecorationProvider(provider, extensionId) {
            const handle = ExtHostDecorations._handlePool++;
            this._provider.set(handle, { provider, extensionId });
            this._proxy.$registerDecorationProvider(handle, extensionId.value);
            const listener = provider.onDidChangeDecorations(e => {
                this._proxy.$onDidChange(handle, !e ? null : Array.isArray(e) ? e : [e]);
            });
            return new extHostTypes_1.Disposable(() => {
                listener.dispose();
                this._proxy.$unregisterDecorationProvider(handle);
                this._provider.delete(handle);
            });
        }
        $provideDecorations(requests, token) {
            const result = Object.create(null);
            return Promise.all(requests.map(request => {
                const { handle, uri, id } = request;
                const entry = this._provider.get(handle);
                if (!entry) {
                    // might have been unregistered in the meantime
                    return undefined;
                }
                const { provider, extensionId } = entry;
                return Promise.resolve(provider.provideDecoration(uri_1.URI.revive(uri), token)).then(data => {
                    if (data && data.letter && data.letter.length !== 1) {
                        console.warn(`INVALID decoration from extension '${extensionId.value}'. The 'letter' must be set and be one character, not '${data.letter}'.`);
                    }
                    if (data) {
                        result[id] = [data.priority, data.bubble, data.title, data.letter, data.color, data.source];
                    }
                }, err => {
                    console.error(err);
                });
            })).then(() => {
                return result;
            });
        }
    }
    ExtHostDecorations._handlePool = 0;
    exports.ExtHostDecorations = ExtHostDecorations;
});
//# sourceMappingURL=extHostDecorations.js.map