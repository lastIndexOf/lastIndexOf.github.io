/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "native-keymap", "vs/base/common/event"], function (require, exports, nativeKeymap, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class KeyboardLayoutMonitor {
        constructor() {
            this._emitter = new event_1.Emitter();
            this._registered = false;
        }
        onDidChangeKeyboardLayout(callback) {
            if (!this._registered) {
                this._registered = true;
                nativeKeymap.onDidChangeKeyboardLayout(() => {
                    this._emitter.fire();
                });
            }
            return this._emitter.event(callback);
        }
    }
    KeyboardLayoutMonitor.INSTANCE = new KeyboardLayoutMonitor();
    exports.KeyboardLayoutMonitor = KeyboardLayoutMonitor;
});
//# sourceMappingURL=keyboard.js.map