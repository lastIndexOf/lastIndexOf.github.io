/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/globalMouseMoveMonitor", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/model/textModel", "./codeActionModel", "vs/css!./lightBulbWidget"], function (require, exports, dom, globalMouseMoveMonitor_1, cancellation_1, event_1, lifecycle_1, textModel_1, codeActionModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LightBulbWidget extends lifecycle_1.Disposable {
        constructor(editor) {
            super();
            this._onClick = this._register(new event_1.Emitter());
            this.onClick = this._onClick.event;
            this._state = codeActionModel_1.CodeActionsState.Empty;
            this._futureFixes = new cancellation_1.CancellationTokenSource();
            this._domNode = document.createElement('div');
            this._domNode.className = 'lightbulb-glyph';
            this._editor = editor;
            this._editor.addContentWidget(this);
            this._register(this._editor.onDidChangeModel(_ => this._futureFixes.cancel()));
            this._register(this._editor.onDidChangeModelLanguage(_ => this._futureFixes.cancel()));
            this._register(this._editor.onDidChangeModelContent(_ => {
                // cancel when the line in question has been removed
                const editorModel = this._editor.getModel();
                if (this._state.type !== 1 /* Triggered */ || !editorModel || this._state.position.lineNumber >= editorModel.getLineCount()) {
                    this._futureFixes.cancel();
                }
            }));
            this._register(dom.addStandardDisposableListener(this._domNode, 'click', e => {
                if (this._state.type !== 1 /* Triggered */) {
                    return;
                }
                // Make sure that focus / cursor location is not lost when clicking widget icon
                this._editor.focus();
                // a bit of extra work to make sure the menu
                // doesn't cover the line-text
                const { top, height } = dom.getDomNodePagePosition(this._domNode);
                const { lineHeight } = this._editor.getConfiguration();
                let pad = Math.floor(lineHeight / 3);
                if (this._position && this._position.position !== null && this._position.position.lineNumber < this._state.position.lineNumber) {
                    pad += lineHeight;
                }
                this._onClick.fire({
                    x: e.posx,
                    y: top + height + pad,
                    state: this._state
                });
            }));
            this._register(dom.addDisposableListener(this._domNode, 'mouseenter', (e) => {
                if ((e.buttons & 1) !== 1) {
                    return;
                }
                // mouse enters lightbulb while the primary/left button
                // is being pressed -> hide the lightbulb and block future
                // showings until mouse is released
                this.hide();
                const monitor = new globalMouseMoveMonitor_1.GlobalMouseMoveMonitor();
                monitor.startMonitoring(globalMouseMoveMonitor_1.standardMouseMoveMerger, () => { }, () => {
                    monitor.dispose();
                });
            }));
            this._register(this._editor.onDidChangeConfiguration(e => {
                // hide when told to do so
                if (e.contribInfo && !this._editor.getConfiguration().contribInfo.lightbulbEnabled) {
                    this.hide();
                }
            }));
        }
        dispose() {
            super.dispose();
            this._editor.removeContentWidget(this);
        }
        getId() {
            return 'LightBulbWidget';
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return this._position;
        }
        tryShow(newState) {
            if (newState.type !== 1 /* Triggered */ || this._position && (!newState.position || this._position.position && this._position.position.lineNumber !== newState.position.lineNumber)) {
                // hide when getting a 'hide'-request or when currently
                // showing on another line
                this.hide();
            }
            else if (this._futureFixes) {
                // cancel pending show request in any case
                this._futureFixes.cancel();
            }
            this._futureFixes = new cancellation_1.CancellationTokenSource();
            const { token } = this._futureFixes;
            this._state = newState;
            if (this._state.type === codeActionModel_1.CodeActionsState.Empty.type) {
                return;
            }
            const selection = this._state.rangeOrSelection;
            this._state.actions.then(fixes => {
                if (!token.isCancellationRequested && fixes.actions.length > 0 && selection) {
                    this._show(fixes);
                }
                else {
                    this.hide();
                }
            }).catch(() => {
                this.hide();
            });
        }
        set title(value) {
            this._domNode.title = value;
        }
        get title() {
            return this._domNode.title;
        }
        _show(codeActions) {
            const config = this._editor.getConfiguration();
            if (!config.contribInfo.lightbulbEnabled) {
                return;
            }
            if (this._state.type !== 1 /* Triggered */) {
                return;
            }
            const { lineNumber, column } = this._state.position;
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            const tabSize = model.getOptions().tabSize;
            const lineContent = model.getLineContent(lineNumber);
            const indent = textModel_1.TextModel.computeIndentLevel(lineContent, tabSize);
            const lineHasSpace = config.fontInfo.spaceWidth * indent > 22;
            const isFolded = (lineNumber) => {
                return lineNumber > 2 && this._editor.getTopForLineNumber(lineNumber) === this._editor.getTopForLineNumber(lineNumber - 1);
            };
            let effectiveLineNumber = lineNumber;
            if (!lineHasSpace) {
                if (lineNumber > 1 && !isFolded(lineNumber - 1)) {
                    effectiveLineNumber -= 1;
                }
                else if (!isFolded(lineNumber + 1)) {
                    effectiveLineNumber += 1;
                }
                else if (column * config.fontInfo.spaceWidth < 22) {
                    // cannot show lightbulb above/below and showing
                    // it inline would overlay the cursor...
                    this.hide();
                    return;
                }
            }
            this._position = {
                position: { lineNumber: effectiveLineNumber, column: 1 },
                preference: LightBulbWidget._posPref
            };
            dom.toggleClass(this._domNode, 'autofixable', codeActions.hasAutoFix);
            this._editor.layoutContentWidget(this);
        }
        hide() {
            this._position = null;
            this._state = codeActionModel_1.CodeActionsState.Empty;
            this._futureFixes.cancel();
            this._editor.layoutContentWidget(this);
        }
    }
    LightBulbWidget._posPref = [0 /* EXACT */];
    exports.LightBulbWidget = LightBulbWidget;
});
//# sourceMappingURL=lightBulbWidget.js.map