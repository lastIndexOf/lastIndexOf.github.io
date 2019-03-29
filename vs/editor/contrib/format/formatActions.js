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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/editor/browser/core/editorState", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/characterClassifier", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/modes", "vs/editor/common/services/editorWorkerService", "vs/editor/contrib/format/format", "vs/editor/contrib/format/formattingEdit", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/telemetry/common/telemetry"], function (require, exports, aria_1, arrays_1, cancellation_1, keyCodes_1, lifecycle_1, editorState_1, editorExtensions_1, codeEditorService_1, characterClassifier_1, range_1, editorContextKeys_1, modes_1, editorWorkerService_1, format_1, formattingEdit_1, nls, commands_1, contextkey_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function alertFormattingEdits(edits) {
        edits = edits.filter(edit => edit.range);
        if (!edits.length) {
            return;
        }
        let { range } = edits[0];
        for (let i = 1; i < edits.length; i++) {
            range = range_1.Range.plusRange(range, edits[i].range);
        }
        const { startLineNumber, endLineNumber } = range;
        if (startLineNumber === endLineNumber) {
            if (edits.length === 1) {
                aria_1.alert(nls.localize('hint11', "Made 1 formatting edit on line {0}", startLineNumber));
            }
            else {
                aria_1.alert(nls.localize('hintn1', "Made {0} formatting edits on line {1}", edits.length, startLineNumber));
            }
        }
        else {
            if (edits.length === 1) {
                aria_1.alert(nls.localize('hint1n', "Made 1 formatting edit between lines {0} and {1}", startLineNumber, endLineNumber));
            }
            else {
                aria_1.alert(nls.localize('hintnn', "Made {0} formatting edits between lines {1} and {2}", edits.length, startLineNumber, endLineNumber));
            }
        }
    }
    var FormatRangeType;
    (function (FormatRangeType) {
        FormatRangeType[FormatRangeType["Full"] = 0] = "Full";
        FormatRangeType[FormatRangeType["Selection"] = 1] = "Selection";
    })(FormatRangeType || (FormatRangeType = {}));
    function formatDocumentRange(telemetryService, workerService, editor, rangeOrRangeType, options, token) {
        const state = new editorState_1.EditorState(editor, 1 /* Value */ | 4 /* Position */);
        const model = editor.getModel();
        let range;
        if (rangeOrRangeType === 0 /* Full */) {
            // full
            range = model.getFullModelRange();
        }
        else if (rangeOrRangeType === 1 /* Selection */) {
            // selection or line (when empty)
            range = editor.getSelection();
            if (range.isEmpty()) {
                range = new range_1.Range(range.startLineNumber, 1, range.endLineNumber, model.getLineMaxColumn(range.endLineNumber));
            }
        }
        else {
            // as is
            range = rangeOrRangeType;
        }
        return format_1.getDocumentRangeFormattingEdits(telemetryService, workerService, model, range, options, 2 /* Manual */, token).then(edits => {
            // make edit only when the editor didn't change while
            // computing and only when there are edits
            if (state.validate(editor) && arrays_1.isNonEmptyArray(edits)) {
                formattingEdit_1.FormattingEdit.execute(editor, edits);
                alertFormattingEdits(edits);
                editor.focus();
                editor.revealPositionInCenterIfOutsideViewport(editor.getPosition(), 1 /* Immediate */);
            }
        });
    }
    function formatDocument(telemetryService, workerService, editor, options, token) {
        const allEdits = [];
        const state = new editorState_1.EditorState(editor, 1 /* Value */ | 4 /* Position */);
        return format_1.getDocumentFormattingEdits(telemetryService, workerService, editor.getModel(), options, 2 /* Manual */, token).then(edits => {
            // make edit only when the editor didn't change while
            // computing and only when there are edits
            if (state.validate(editor) && arrays_1.isNonEmptyArray(edits)) {
                formattingEdit_1.FormattingEdit.execute(editor, edits);
                alertFormattingEdits(allEdits);
                editor.pushUndoStop();
                editor.focus();
                editor.revealPositionInCenterIfOutsideViewport(editor.getPosition(), 1 /* Immediate */);
            }
        });
    }
    let FormatOnType = class FormatOnType {
        constructor(editor, _telemetryService, _workerService) {
            this._telemetryService = _telemetryService;
            this._workerService = _workerService;
            this._callOnDispose = [];
            this._callOnModel = [];
            this._editor = editor;
            this._callOnDispose.push(editor.onDidChangeConfiguration(() => this.update()));
            this._callOnDispose.push(editor.onDidChangeModel(() => this.update()));
            this._callOnDispose.push(editor.onDidChangeModelLanguage(() => this.update()));
            this._callOnDispose.push(modes_1.OnTypeFormattingEditProviderRegistry.onDidChange(this.update, this));
        }
        update() {
            // clean up
            this._callOnModel = lifecycle_1.dispose(this._callOnModel);
            // we are disabled
            if (!this._editor.getConfiguration().contribInfo.formatOnType) {
                return;
            }
            // no model
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            // no support
            const [support] = modes_1.OnTypeFormattingEditProviderRegistry.ordered(model);
            if (!support || !support.autoFormatTriggerCharacters) {
                return;
            }
            // register typing listeners that will trigger the format
            let triggerChars = new characterClassifier_1.CharacterSet();
            for (let ch of support.autoFormatTriggerCharacters) {
                triggerChars.add(ch.charCodeAt(0));
            }
            this._callOnModel.push(this._editor.onDidType((text) => {
                let lastCharCode = text.charCodeAt(text.length - 1);
                if (triggerChars.has(lastCharCode)) {
                    this.trigger(String.fromCharCode(lastCharCode));
                }
            }));
        }
        trigger(ch) {
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._editor.getSelections().length > 1) {
                return;
            }
            const model = this._editor.getModel();
            const position = this._editor.getPosition();
            let canceled = false;
            // install a listener that checks if edits happens before the
            // position on which we format right now. If so, we won't
            // apply the format edits
            const unbind = this._editor.onDidChangeModelContent((e) => {
                if (e.isFlush) {
                    // a model.setValue() was called
                    // cancel only once
                    canceled = true;
                    unbind.dispose();
                    return;
                }
                for (let i = 0, len = e.changes.length; i < len; i++) {
                    const change = e.changes[i];
                    if (change.range.endLineNumber <= position.lineNumber) {
                        // cancel only once
                        canceled = true;
                        unbind.dispose();
                        return;
                    }
                }
            });
            format_1.getOnTypeFormattingEdits(this._telemetryService, this._workerService, model, position, ch, model.getFormattingOptions()).then(edits => {
                unbind.dispose();
                if (canceled) {
                    return;
                }
                if (arrays_1.isNonEmptyArray(edits)) {
                    formattingEdit_1.FormattingEdit.execute(this._editor, edits);
                    alertFormattingEdits(edits);
                }
            }, (err) => {
                unbind.dispose();
                throw err;
            });
        }
        getId() {
            return FormatOnType.ID;
        }
        dispose() {
            this._callOnDispose = lifecycle_1.dispose(this._callOnDispose);
            this._callOnModel = lifecycle_1.dispose(this._callOnModel);
        }
    };
    FormatOnType.ID = 'editor.contrib.autoFormat';
    FormatOnType = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, editorWorkerService_1.IEditorWorkerService)
    ], FormatOnType);
    let FormatOnPaste = class FormatOnPaste {
        constructor(editor, workerService, telemetryService) {
            this.editor = editor;
            this.workerService = workerService;
            this.telemetryService = telemetryService;
            this.callOnDispose = [];
            this.callOnModel = [];
            this.callOnDispose.push(editor.onDidChangeConfiguration(() => this.update()));
            this.callOnDispose.push(editor.onDidChangeModel(() => this.update()));
            this.callOnDispose.push(editor.onDidChangeModelLanguage(() => this.update()));
            this.callOnDispose.push(modes_1.DocumentRangeFormattingEditProviderRegistry.onDidChange(this.update, this));
        }
        update() {
            // clean up
            this.callOnModel = lifecycle_1.dispose(this.callOnModel);
            // we are disabled
            if (!this.editor.getConfiguration().contribInfo.formatOnPaste) {
                return;
            }
            // no model
            if (!this.editor.hasModel()) {
                return;
            }
            let model = this.editor.getModel();
            // no support
            if (!modes_1.DocumentRangeFormattingEditProviderRegistry.has(model)) {
                return;
            }
            this.callOnModel.push(this.editor.onDidPaste((range) => {
                this.trigger(range);
            }));
        }
        trigger(range) {
            if (!this.editor.hasModel()) {
                return;
            }
            if (this.editor.getSelections().length > 1) {
                return;
            }
            const model = this.editor.getModel();
            formatDocumentRange(this.telemetryService, this.workerService, this.editor, range, model.getFormattingOptions(), cancellation_1.CancellationToken.None);
        }
        getId() {
            return FormatOnPaste.ID;
        }
        dispose() {
            this.callOnDispose = lifecycle_1.dispose(this.callOnDispose);
            this.callOnModel = lifecycle_1.dispose(this.callOnModel);
        }
    };
    FormatOnPaste.ID = 'editor.contrib.formatOnPaste';
    FormatOnPaste = __decorate([
        __param(1, editorWorkerService_1.IEditorWorkerService),
        __param(2, telemetry_1.ITelemetryService)
    ], FormatOnPaste);
    class FormatDocumentAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatDocument',
                label: nls.localize('formatDocument.label', "Format Document"),
                alias: 'Format Document',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* Shift */ | 512 /* Alt */ | 36 /* KEY_F */,
                    // secondary: [KeyChord(KeyMod.CtrlCmd | KeyCode.KEY_K, KeyMod.CtrlCmd | KeyCode.KEY_D)],
                    linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 39 /* KEY_I */ },
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    when: editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider,
                    group: '1_modification',
                    order: 1.3
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const workerService = accessor.get(editorWorkerService_1.IEditorWorkerService);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            return formatDocument(telemetryService, workerService, editor, editor.getModel().getFormattingOptions(), cancellation_1.CancellationToken.None);
        }
    }
    exports.FormatDocumentAction = FormatDocumentAction;
    class FormatSelectionAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatSelection',
                label: nls.localize('formatSelection.label', "Format Selection"),
                alias: 'Format Code',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 36 /* KEY_F */),
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasDocumentSelectionFormattingProvider, editorContextKeys_1.EditorContextKeys.hasNonEmptySelection),
                    group: '1_modification',
                    order: 1.31
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const workerService = accessor.get(editorWorkerService_1.IEditorWorkerService);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            return formatDocumentRange(telemetryService, workerService, editor, 1 /* Selection */, editor.getModel().getFormattingOptions(), cancellation_1.CancellationToken.None);
        }
    }
    exports.FormatSelectionAction = FormatSelectionAction;
    editorExtensions_1.registerEditorContribution(FormatOnType);
    editorExtensions_1.registerEditorContribution(FormatOnPaste);
    editorExtensions_1.registerEditorAction(FormatDocumentAction);
    editorExtensions_1.registerEditorAction(FormatSelectionAction);
    // this is the old format action that does both (format document OR format selection)
    // and we keep it here such that existing keybinding configurations etc will still work
    commands_1.CommandsRegistry.registerCommand('editor.action.format', accessor => {
        const editor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
        if (!editor || !editor.hasModel()) {
            return undefined;
        }
        const workerService = accessor.get(editorWorkerService_1.IEditorWorkerService);
        const telemetryService = accessor.get(telemetry_1.ITelemetryService);
        if (editor.getSelection().isEmpty()) {
            return formatDocument(telemetryService, workerService, editor, editor.getModel().getFormattingOptions(), cancellation_1.CancellationToken.None);
        }
        else {
            return formatDocumentRange(telemetryService, workerService, editor, 1 /* Selection */, editor.getModel().getFormattingOptions(), cancellation_1.CancellationToken.None);
        }
    });
});
//# sourceMappingURL=formatActions.js.map