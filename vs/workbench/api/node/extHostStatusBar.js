/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHostTypes", "./extHost.protocol"], function (require, exports, extHostTypes_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostStatusBarEntry {
        constructor(proxy, extensionId, alignment = extHostTypes_1.StatusBarAlignment.Left, priority) {
            this._id = ExtHostStatusBarEntry.ID_GEN++;
            this._proxy = proxy;
            this._alignment = alignment;
            this._priority = priority;
            this._extensionId = extensionId;
        }
        get id() {
            return this._id;
        }
        get alignment() {
            return this._alignment;
        }
        get priority() {
            return this._priority;
        }
        get text() {
            return this._text;
        }
        get tooltip() {
            return this._tooltip;
        }
        get color() {
            return this._color;
        }
        get command() {
            return this._command;
        }
        set text(text) {
            this._text = text;
            this.update();
        }
        set tooltip(tooltip) {
            this._tooltip = tooltip;
            this.update();
        }
        set color(color) {
            this._color = color;
            this.update();
        }
        set command(command) {
            this._command = command;
            this.update();
        }
        show() {
            this._visible = true;
            this.update();
        }
        hide() {
            clearTimeout(this._timeoutHandle);
            this._visible = false;
            this._proxy.$dispose(this.id);
        }
        update() {
            if (this._disposed || !this._visible) {
                return;
            }
            clearTimeout(this._timeoutHandle);
            // Defer the update so that multiple changes to setters dont cause a redraw each
            this._timeoutHandle = setTimeout(() => {
                this._timeoutHandle = undefined;
                // Set to status bar
                this._proxy.$setEntry(this.id, this._extensionId, this.text, this.tooltip, this.command, this.color, this._alignment === extHostTypes_1.StatusBarAlignment.Left ? 0 /* LEFT */ : 1 /* RIGHT */, this._priority);
            }, 0);
        }
        dispose() {
            this.hide();
            this._disposed = true;
        }
    }
    ExtHostStatusBarEntry.ID_GEN = 0;
    exports.ExtHostStatusBarEntry = ExtHostStatusBarEntry;
    class StatusBarMessage {
        constructor(statusBar) {
            this._messages = [];
            this._item = statusBar.createStatusBarEntry(undefined, extHostTypes_1.StatusBarAlignment.Left, Number.MIN_VALUE);
        }
        dispose() {
            this._messages.length = 0;
            this._item.dispose();
        }
        setMessage(message) {
            const data = { message }; // use object to not confuse equal strings
            this._messages.unshift(data);
            this._update();
            return new extHostTypes_1.Disposable(() => {
                const idx = this._messages.indexOf(data);
                if (idx >= 0) {
                    this._messages.splice(idx, 1);
                    this._update();
                }
            });
        }
        _update() {
            if (this._messages.length > 0) {
                this._item.text = this._messages[0].message;
                this._item.show();
            }
            else {
                this._item.hide();
            }
        }
    }
    class ExtHostStatusBar {
        constructor(mainContext) {
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadStatusBar);
            this._statusMessage = new StatusBarMessage(this);
        }
        createStatusBarEntry(extensionId, alignment, priority) {
            return new ExtHostStatusBarEntry(this._proxy, extensionId, alignment, priority);
        }
        setStatusBarMessage(text, timeoutOrThenable) {
            const d = this._statusMessage.setMessage(text);
            let handle;
            if (typeof timeoutOrThenable === 'number') {
                handle = setTimeout(() => d.dispose(), timeoutOrThenable);
            }
            else if (typeof timeoutOrThenable !== 'undefined') {
                timeoutOrThenable.then(() => d.dispose(), () => d.dispose());
            }
            return new extHostTypes_1.Disposable(() => {
                d.dispose();
                clearTimeout(handle);
            });
        }
    }
    exports.ExtHostStatusBar = ExtHostStatusBar;
});
//# sourceMappingURL=extHostStatusBar.js.map