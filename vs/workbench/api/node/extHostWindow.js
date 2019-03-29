/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "./extHost.protocol", "vs/base/common/network", "vs/base/common/strings"], function (require, exports, event_1, extHost_protocol_1, network_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostWindow {
        constructor(mainContext) {
            this._onDidChangeWindowState = new event_1.Emitter();
            this.onDidChangeWindowState = this._onDidChangeWindowState.event;
            this._state = ExtHostWindow.InitialState;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadWindow);
            this._proxy.$getWindowVisibility().then(isFocused => this.$onDidChangeWindowFocus(isFocused));
        }
        get state() { return this._state; }
        $onDidChangeWindowFocus(focused) {
            if (focused === this._state.focused) {
                return;
            }
            this._state = Object.assign({}, this._state, { focused });
            this._onDidChangeWindowState.fire(this._state);
        }
        openUri(uri) {
            if (strings_1.isFalsyOrWhitespace(uri.scheme)) {
                return Promise.reject('Invalid scheme - cannot be empty');
            }
            else if (uri.scheme === network_1.Schemas.command) {
                return Promise.reject(`Invalid scheme '${uri.scheme}'`);
            }
            return this._proxy.$openUri(uri);
        }
    }
    ExtHostWindow.InitialState = {
        focused: true
    };
    exports.ExtHostWindow = ExtHostWindow;
});
//# sourceMappingURL=extHostWindow.js.map