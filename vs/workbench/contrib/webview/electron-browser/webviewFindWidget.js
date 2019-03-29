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
define(["require", "exports", "vs/editor/contrib/find/simpleFindWidget", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey"], function (require, exports, simpleFindWidget_1, contextView_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WebviewFindWidget = class WebviewFindWidget extends simpleFindWidget_1.SimpleFindWidget {
        constructor(_webview, contextViewService, contextKeyService) {
            super(contextViewService, contextKeyService);
            this._webview = _webview;
        }
        dispose() {
            this._webview = undefined;
            super.dispose();
        }
        find(previous) {
            if (!this._webview) {
                return;
            }
            const val = this.inputValue;
            if (val) {
                this._webview.find(val, { findNext: true, forward: !previous });
            }
        }
        hide() {
            super.hide();
            if (this._webview) {
                this._webview.stopFind(true);
                this._webview.focus();
            }
        }
        onInputChanged() {
            if (!this._webview) {
                return;
            }
            const val = this.inputValue;
            if (val) {
                this._webview.startFind(val);
            }
            else {
                this._webview.stopFind(false);
            }
        }
        onFocusTrackerFocus() { }
        onFocusTrackerBlur() { }
        onFindInputFocusTrackerFocus() { }
        onFindInputFocusTrackerBlur() { }
    };
    WebviewFindWidget = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, contextkey_1.IContextKeyService)
    ], WebviewFindWidget);
    exports.WebviewFindWidget = WebviewFindWidget;
});
//# sourceMappingURL=webviewFindWidget.js.map