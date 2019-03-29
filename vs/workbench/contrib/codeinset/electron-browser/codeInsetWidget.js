/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/css!./codeInsetWidget"], function (require, exports, range_1, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CodeInsetHelper {
        constructor() {
            this._removeDecorations = [];
            this._addDecorations = [];
            this._addDecorationsCallbacks = [];
        }
        addDecoration(decoration, callback) {
            this._addDecorations.push(decoration);
            this._addDecorationsCallbacks.push(callback);
        }
        removeDecoration(decorationId) {
            this._removeDecorations.push(decorationId);
        }
        commit(changeAccessor) {
            let resultingDecorations = changeAccessor.deltaDecorations(this._removeDecorations, this._addDecorations);
            for (let i = 0, len = resultingDecorations.length; i < len; i++) {
                this._addDecorationsCallbacks[i](resultingDecorations[i]);
            }
        }
    }
    exports.CodeInsetHelper = CodeInsetHelper;
    class CodeInsetWidget {
        constructor(data, // all the insets on the same line (often just one)
        editor, helper) {
            this._viewZoneId = undefined;
            this._editor = editor;
            this._data = data;
            this._decorationIds = new Array(this._data.length);
            this._data.forEach((codeInsetData, i) => {
                helper.addDecoration({
                    range: codeInsetData.symbol.range,
                    options: textModel_1.ModelDecorationOptions.EMPTY
                }, id => this._decorationIds[i] = id);
                // the range contains all insets on this line
                if (!this._range) {
                    this._range = range_1.Range.lift(codeInsetData.symbol.range);
                }
                else {
                    this._range = range_1.Range.plusRange(this._range, codeInsetData.symbol.range);
                }
            });
        }
        dispose(helper, viewZoneChangeAccessor) {
            while (this._decorationIds.length) {
                const decoration = this._decorationIds.pop();
                if (decoration) {
                    helper.removeDecoration(decoration);
                }
            }
            if (viewZoneChangeAccessor) {
                if (typeof this._viewZoneId !== 'undefined') {
                    viewZoneChangeAccessor.removeZone(this._viewZoneId);
                }
                this._viewZone = undefined;
            }
            if (this._webview) {
                this._webview.dispose();
            }
        }
        isValid() {
            return this._editor.hasModel() && this._decorationIds.some((id, i) => {
                const range = this._editor.getModel().getDecorationRange(id);
                const symbol = this._data[i].symbol;
                return !!range && range_1.Range.isEmpty(symbol.range) === range.isEmpty();
            });
        }
        updateCodeInsetSymbols(data, helper) {
            while (this._decorationIds.length) {
                const decoration = this._decorationIds.pop();
                if (decoration) {
                    helper.removeDecoration(decoration);
                }
            }
            this._data = data;
            this._decorationIds = new Array(this._data.length);
            this._data.forEach((codeInsetData, i) => {
                helper.addDecoration({
                    range: codeInsetData.symbol.range,
                    options: textModel_1.ModelDecorationOptions.EMPTY
                }, id => this._decorationIds[i] = id);
            });
        }
        computeIfNecessary(model) {
            // Read editor current state
            for (let i = 0; i < this._decorationIds.length; i++) {
                const range = model.getDecorationRange(this._decorationIds[i]);
                if (range) {
                    this._data[i].symbol.range = range;
                }
            }
            return this._data;
        }
        getLineNumber() {
            if (this._editor.hasModel()) {
                const range = this._editor.getModel().getDecorationRange(this._decorationIds[0]);
                if (range) {
                    return range.startLineNumber;
                }
            }
            return -1;
        }
        adoptWebview(webview) {
            const lineNumber = this._range.endLineNumber;
            this._editor.changeViewZones(accessor => {
                if (this._viewZoneId) {
                    accessor.removeZone(this._viewZoneId);
                    this._webview.dispose();
                }
                const div = document.createElement('div');
                webview.mountTo(div);
                webview.onMessage((e) => {
                    // The webview contents can use a "size-info" message to report its size.
                    if (e && e.type === 'size-info') {
                        const margin = e.payload.height > 0 ? 5 : 0;
                        this._viewZone.heightInPx = e.payload.height + margin;
                        this._editor.changeViewZones(accessor => {
                            if (this._viewZoneId) {
                                accessor.layoutZone(this._viewZoneId);
                            }
                        });
                    }
                });
                this._viewZone = {
                    afterLineNumber: lineNumber,
                    heightInPx: 50,
                    domNode: div
                };
                this._viewZoneId = accessor.addZone(this._viewZone);
                this._webview = webview;
            });
        }
        reposition(viewZoneChangeAccessor) {
            if (this.isValid() && this._editor.hasModel()) {
                const range = this._editor.getModel().getDecorationRange(this._decorationIds[0]);
                if (range) {
                    this._viewZone.afterLineNumber = range.endLineNumber;
                }
                if (this._viewZoneId) {
                    viewZoneChangeAccessor.layoutZone(this._viewZoneId);
                }
            }
        }
    }
    exports.CodeInsetWidget = CodeInsetWidget;
});
//# sourceMappingURL=codeInsetWidget.js.map