/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/standalone/browser/quickOpen/editorQuickOpen", "vs/css!./gotoLine"], function (require, exports, nls, quickOpenModel_1, editorBrowser_1, editorExtensions_1, position_1, range_1, editorContextKeys_1, editorQuickOpen_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class GotoLineEntry extends quickOpenModel_1.QuickOpenEntry {
        constructor(line, editor, decorator) {
            super();
            this.editor = editor;
            this.decorator = decorator;
            this.parseResult = this.parseInput(line);
        }
        parseInput(line) {
            const numbers = line.split(',').map(part => parseInt(part, 10)).filter(part => !isNaN(part));
            let position;
            if (numbers.length === 0) {
                position = new position_1.Position(-1, -1);
            }
            else if (numbers.length === 1) {
                position = new position_1.Position(numbers[0], 1);
            }
            else {
                position = new position_1.Position(numbers[0], numbers[1]);
            }
            let model;
            if (editorBrowser_1.isCodeEditor(this.editor)) {
                model = this.editor.getModel();
            }
            else {
                const diffModel = this.editor.getModel();
                model = diffModel ? diffModel.modified : null;
            }
            const isValid = model ? model.validatePosition(position).equals(position) : false;
            let label;
            if (isValid) {
                if (position.column && position.column > 1) {
                    label = nls.localize('gotoLineLabelValidLineAndColumn', "Go to line {0} and character {1}", position.lineNumber, position.column);
                }
                else {
                    label = nls.localize('gotoLineLabelValidLine', "Go to line {0}", position.lineNumber, position.column);
                }
            }
            else if (position.lineNumber < 1 || position.lineNumber > (model ? model.getLineCount() : 0)) {
                label = nls.localize('gotoLineLabelEmptyWithLineLimit', "Type a line number between 1 and {0} to navigate to", model ? model.getLineCount() : 0);
            }
            else {
                label = nls.localize('gotoLineLabelEmptyWithLineAndColumnLimit', "Type a character between 1 and {0} to navigate to", model ? model.getLineMaxColumn(position.lineNumber) : 0);
            }
            return {
                position: position,
                isValid: isValid,
                label: label
            };
        }
        getLabel() {
            return this.parseResult.label;
        }
        getAriaLabel() {
            const position = this.editor.getPosition();
            const currentLine = position ? position.lineNumber : 0;
            return nls.localize('gotoLineAriaLabel', "Current Line: {0}. Go to line {0}.", currentLine, this.parseResult.label);
        }
        run(mode, _context) {
            if (mode === 1 /* OPEN */) {
                return this.runOpen();
            }
            return this.runPreview();
        }
        runOpen() {
            // No-op if range is not valid
            if (!this.parseResult.isValid) {
                return false;
            }
            // Apply selection and focus
            const range = this.toSelection();
            this.editor.setSelection(range);
            this.editor.revealRangeInCenter(range, 0 /* Smooth */);
            this.editor.focus();
            return true;
        }
        runPreview() {
            // No-op if range is not valid
            if (!this.parseResult.isValid) {
                this.decorator.clearDecorations();
                return false;
            }
            // Select Line Position
            const range = this.toSelection();
            this.editor.revealRangeInCenter(range, 0 /* Smooth */);
            // Decorate if possible
            this.decorator.decorateLine(range, this.editor);
            return false;
        }
        toSelection() {
            return new range_1.Range(this.parseResult.position.lineNumber, this.parseResult.position.column, this.parseResult.position.lineNumber, this.parseResult.position.column);
        }
    }
    exports.GotoLineEntry = GotoLineEntry;
    class GotoLineAction extends editorQuickOpen_1.BaseEditorQuickOpenAction {
        constructor() {
            super(nls.localize('gotoLineActionInput', "Type a line number, followed by an optional colon and a character number to navigate to"), {
                id: 'editor.action.gotoLine',
                label: nls.localize('GotoLineAction.label', "Go to Line..."),
                alias: 'Go to Line...',
                precondition: null,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 2048 /* CtrlCmd */ | 37 /* KEY_G */,
                    mac: { primary: 256 /* WinCtrl */ | 37 /* KEY_G */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            this._show(this.getController(editor), {
                getModel: (value) => {
                    return new quickOpenModel_1.QuickOpenModel([new GotoLineEntry(value, editor, this.getController(editor))]);
                },
                getAutoFocus: (searchValue) => {
                    return {
                        autoFocusFirstEntry: searchValue.length > 0
                    };
                }
            });
        }
    }
    exports.GotoLineAction = GotoLineAction;
    editorExtensions_1.registerEditorAction(GotoLineAction);
});
//# sourceMappingURL=gotoLine.js.map