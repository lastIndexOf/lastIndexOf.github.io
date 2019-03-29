/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/css!./iPadShowKeyboard"], function (require, exports, browser, dom, lifecycle_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class IPadShowKeyboard {
        constructor(editor) {
            this.editor = editor;
            this.toDispose = [];
            if (browser.isIPad) {
                this.toDispose.push(editor.onDidChangeConfiguration(() => this.update()));
                this.update();
            }
        }
        update() {
            const shouldHaveWidget = (!this.editor.getConfiguration().readOnly);
            if (!this.widget && shouldHaveWidget) {
                this.widget = new ShowKeyboardWidget(this.editor);
            }
            else if (this.widget && !shouldHaveWidget) {
                this.widget.dispose();
                this.widget = null;
            }
        }
        getId() {
            return IPadShowKeyboard.ID;
        }
        dispose() {
            this.toDispose = lifecycle_1.dispose(this.toDispose);
            if (this.widget) {
                this.widget.dispose();
                this.widget = null;
            }
        }
    }
    IPadShowKeyboard.ID = 'editor.contrib.iPadShowKeyboard';
    exports.IPadShowKeyboard = IPadShowKeyboard;
    class ShowKeyboardWidget {
        constructor(editor) {
            this.editor = editor;
            this._domNode = document.createElement('textarea');
            this._domNode.className = 'iPadShowKeyboard';
            this._toDispose = [];
            this._toDispose.push(dom.addDisposableListener(this._domNode, 'touchstart', (e) => {
                this.editor.focus();
            }));
            this._toDispose.push(dom.addDisposableListener(this._domNode, 'focus', (e) => {
                this.editor.focus();
            }));
            this.editor.addOverlayWidget(this);
        }
        dispose() {
            this.editor.removeOverlayWidget(this);
            this._toDispose = lifecycle_1.dispose(this._toDispose);
        }
        // ----- IOverlayWidget API
        getId() {
            return ShowKeyboardWidget.ID;
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return {
                preference: 1 /* BOTTOM_RIGHT_CORNER */
            };
        }
    }
    ShowKeyboardWidget.ID = 'editor.contrib.ShowKeyboardWidget';
    editorExtensions_1.registerEditorContribution(IPadShowKeyboard);
});
//# sourceMappingURL=iPadShowKeyboard.js.map