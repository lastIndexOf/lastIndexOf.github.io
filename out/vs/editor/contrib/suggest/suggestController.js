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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/contrib/snippet/snippetController2", "vs/editor/contrib/snippet/snippetParser", "vs/editor/contrib/suggest/suggestMemory", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "./suggest", "./suggestAlternatives", "./suggestModel", "./suggestWidget", "vs/editor/contrib/suggest/wordContextKey", "vs/base/common/event", "vs/editor/common/services/editorWorkerService", "vs/base/common/async", "vs/editor/common/core/characterClassifier", "vs/base/common/types"], function (require, exports, aria_1, arrays_1, errors_1, lifecycle_1, editorExtensions_1, editOperation_1, range_1, editorContextKeys_1, snippetController2_1, snippetParser_1, suggestMemory_1, nls, commands_1, contextkey_1, instantiation_1, suggest_1, suggestAlternatives_1, suggestModel_1, suggestWidget_1, wordContextKey_1, event_1, editorWorkerService_1, async_1, characterClassifier_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AcceptOnCharacterOracle {
        constructor(editor, widget, accept) {
            this._disposables = [];
            this._disposables.push(widget.onDidShow(() => this._onItem(widget.getFocusedItem())));
            this._disposables.push(widget.onDidFocus(this._onItem, this));
            this._disposables.push(widget.onDidHide(this.reset, this));
            this._disposables.push(editor.onWillType(text => {
                if (this._active) {
                    const ch = text.charCodeAt(text.length - 1);
                    if (this._active.acceptCharacters.has(ch) && editor.getConfiguration().contribInfo.acceptSuggestionOnCommitCharacter) {
                        accept(this._active.item);
                    }
                }
            }));
        }
        _onItem(selected) {
            if (!selected || !arrays_1.isNonEmptyArray(selected.item.completion.commitCharacters)) {
                this.reset();
                return;
            }
            const acceptCharacters = new characterClassifier_1.CharacterSet();
            for (const ch of selected.item.completion.commitCharacters) {
                if (ch.length > 0) {
                    acceptCharacters.add(ch.charCodeAt(0));
                }
            }
            this._active = { acceptCharacters, item: selected };
        }
        reset() {
            this._active = undefined;
        }
        dispose() {
            lifecycle_1.dispose(this._disposables);
        }
    }
    let SuggestController = class SuggestController {
        constructor(_editor, editorWorker, _memoryService, _commandService, _contextKeyService, _instantiationService) {
            this._editor = _editor;
            this._memoryService = _memoryService;
            this._commandService = _commandService;
            this._contextKeyService = _contextKeyService;
            this._instantiationService = _instantiationService;
            this._toDispose = [];
            this._sticky = false; // for development purposes only
            this._model = new suggestModel_1.SuggestModel(this._editor, editorWorker);
            this._widget = new async_1.IdleValue(() => {
                const widget = this._instantiationService.createInstance(suggestWidget_1.SuggestWidget, this._editor);
                this._toDispose.push(widget);
                this._toDispose.push(widget.onDidSelect(item => this._onDidSelectItem(item, false, true), this));
                // Wire up logic to accept a suggestion on certain characters
                const autoAcceptOracle = new AcceptOnCharacterOracle(this._editor, widget, item => this._onDidSelectItem(item, false, true));
                this._toDispose.push(autoAcceptOracle, this._model.onDidSuggest(e => {
                    if (e.completionModel.items.length === 0) {
                        autoAcceptOracle.reset();
                    }
                }));
                // Wire up makes text edit context key
                let makesTextEdit = suggest_1.Context.MakesTextEdit.bindTo(this._contextKeyService);
                this._toDispose.push(widget.onDidFocus(({ item }) => {
                    const position = this._editor.getPosition();
                    const startColumn = item.completion.range.startColumn;
                    const endColumn = position.column;
                    let value = true;
                    if (this._editor.getConfiguration().contribInfo.acceptSuggestionOnEnter === 'smart'
                        && this._model.state === 2 /* Auto */
                        && !item.completion.command
                        && !item.completion.additionalTextEdits
                        && !(item.completion.insertTextRules & 4 /* InsertAsSnippet */)
                        && endColumn - startColumn === item.completion.insertText.length) {
                        const oldText = this._editor.getModel().getValueInRange({
                            startLineNumber: position.lineNumber,
                            startColumn,
                            endLineNumber: position.lineNumber,
                            endColumn
                        });
                        value = oldText !== item.completion.insertText;
                    }
                    makesTextEdit.set(value);
                }));
                this._toDispose.push({
                    dispose() { makesTextEdit.reset(); }
                });
                return widget;
            });
            this._alternatives = new async_1.IdleValue(() => {
                let res = new suggestAlternatives_1.SuggestAlternatives(this._editor, this._contextKeyService);
                this._toDispose.push(res);
                return res;
            });
            this._toDispose.push(_instantiationService.createInstance(wordContextKey_1.WordContextKey, _editor));
            this._toDispose.push(this._model.onDidTrigger(e => {
                this._widget.getValue().showTriggered(e.auto, e.shy ? 250 : 50);
            }));
            this._toDispose.push(this._model.onDidSuggest(e => {
                if (!e.shy) {
                    let index = this._memoryService.select(this._editor.getModel(), this._editor.getPosition(), e.completionModel.items);
                    this._widget.getValue().showSuggestions(e.completionModel, index, e.isFrozen, e.auto);
                }
            }));
            this._toDispose.push(this._model.onDidCancel(e => {
                if (this._widget && !e.retrigger) {
                    this._widget.getValue().hideWidget();
                }
            }));
            this._toDispose.push(this._editor.onDidBlurEditorWidget(() => {
                if (!this._sticky) {
                    this._model.cancel();
                }
            }));
            // Manage the acceptSuggestionsOnEnter context key
            let acceptSuggestionsOnEnter = suggest_1.Context.AcceptSuggestionsOnEnter.bindTo(_contextKeyService);
            let updateFromConfig = () => {
                const { acceptSuggestionOnEnter } = this._editor.getConfiguration().contribInfo;
                acceptSuggestionsOnEnter.set(acceptSuggestionOnEnter === 'on' || acceptSuggestionOnEnter === 'smart');
            };
            this._toDispose.push(this._editor.onDidChangeConfiguration((e) => updateFromConfig()));
            updateFromConfig();
        }
        static get(editor) {
            return editor.getContribution(SuggestController.ID);
        }
        getId() {
            return SuggestController.ID;
        }
        dispose() {
            this._toDispose = lifecycle_1.dispose(this._toDispose);
            this._widget.dispose();
            if (this._model) {
                this._model.dispose();
            }
        }
        _onDidSelectItem(event, keepAlternativeSuggestions, undoStops) {
            if (!event || !event.item) {
                this._alternatives.getValue().reset();
                this._model.cancel();
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            const modelVersionNow = model.getAlternativeVersionId();
            const { completion: suggestion, position } = event.item;
            const editorColumn = this._editor.getPosition().column;
            const columnDelta = editorColumn - position.column;
            // pushing undo stops *before* additional text edits and
            // *after* the main edit
            if (undoStops) {
                this._editor.pushUndoStop();
            }
            if (Array.isArray(suggestion.additionalTextEdits)) {
                this._editor.executeEdits('suggestController.additionalTextEdits', suggestion.additionalTextEdits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text)));
            }
            // keep item in memory
            this._memoryService.memorize(model, this._editor.getPosition(), event.item);
            let { insertText } = suggestion;
            if (!(suggestion.insertTextRules & 4 /* InsertAsSnippet */)) {
                insertText = snippetParser_1.SnippetParser.escape(insertText);
            }
            const overwriteBefore = position.column - suggestion.range.startColumn;
            const overwriteAfter = suggestion.range.endColumn - position.column;
            snippetController2_1.SnippetController2.get(this._editor).insert(insertText, overwriteBefore + columnDelta, overwriteAfter, false, false, !(suggestion.insertTextRules & 1 /* KeepWhitespace */));
            if (undoStops) {
                this._editor.pushUndoStop();
            }
            if (!suggestion.command) {
                // done
                this._model.cancel();
            }
            else if (suggestion.command.id === TriggerSuggestAction.id) {
                // retigger
                this._model.trigger({ auto: true, shy: false }, true);
            }
            else {
                // exec command, done
                this._commandService.executeCommand(suggestion.command.id, ...(suggestion.command.arguments ? [...suggestion.command.arguments] : [])).catch(errors_1.onUnexpectedError);
                this._model.cancel();
            }
            if (keepAlternativeSuggestions) {
                this._alternatives.getValue().set(event, next => {
                    // this is not so pretty. when inserting the 'next'
                    // suggestion we undo until we are at the state at
                    // which we were before inserting the previous suggestion...
                    while (model.canUndo()) {
                        if (modelVersionNow !== model.getAlternativeVersionId()) {
                            model.undo();
                        }
                        this._onDidSelectItem(next, false, false);
                        break;
                    }
                });
            }
            this._alertCompletionItem(event.item);
        }
        _alertCompletionItem({ completion: suggestion }) {
            if (arrays_1.isNonEmptyArray(suggestion.additionalTextEdits)) {
                let msg = nls.localize('arai.alert.snippet', "Accepting '{0}' made {1} additional edits", suggestion.label, suggestion.additionalTextEdits.length);
                aria_1.alert(msg);
            }
        }
        triggerSuggest(onlyFrom) {
            if (this._editor.hasModel()) {
                this._model.trigger({ auto: false, shy: false }, false, onlyFrom);
                this._editor.revealLine(this._editor.getPosition().lineNumber, 0 /* Smooth */);
                this._editor.focus();
            }
        }
        triggerSuggestAndAcceptBest(arg) {
            if (!this._editor.hasModel()) {
                return;
            }
            const positionNow = this._editor.getPosition();
            const fallback = () => {
                if (positionNow.equals(this._editor.getPosition())) {
                    this._commandService.executeCommand(arg.fallback);
                }
            };
            const makesTextEdit = (item) => {
                if (item.completion.insertTextRules & 4 /* InsertAsSnippet */ || item.completion.additionalTextEdits) {
                    // snippet, other editor -> makes edit
                    return true;
                }
                const position = this._editor.getPosition();
                const startColumn = item.completion.range.startColumn;
                const endColumn = position.column;
                if (endColumn - startColumn !== item.completion.insertText.length) {
                    // unequal lengths -> makes edit
                    return true;
                }
                const textNow = this._editor.getModel().getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn,
                    endLineNumber: position.lineNumber,
                    endColumn
                });
                // unequal text -> makes edit
                return textNow !== item.completion.insertText;
            };
            event_1.Event.once(this._model.onDidTrigger)(_ => {
                // wait for trigger because only then the cancel-event is trustworthy
                let listener = [];
                event_1.Event.any(this._model.onDidTrigger, this._model.onDidCancel)(() => {
                    // retrigger or cancel -> try to type default text
                    lifecycle_1.dispose(listener);
                    fallback();
                }, undefined, listener);
                this._model.onDidSuggest(({ completionModel }) => {
                    lifecycle_1.dispose(listener);
                    if (completionModel.items.length === 0) {
                        fallback();
                        return;
                    }
                    const index = this._memoryService.select(this._editor.getModel(), this._editor.getPosition(), completionModel.items);
                    const item = completionModel.items[index];
                    if (!makesTextEdit(item)) {
                        fallback();
                        return;
                    }
                    this._editor.pushUndoStop();
                    this._onDidSelectItem({ index, item, model: completionModel }, true, false);
                }, undefined, listener);
            });
            this._model.trigger({ auto: false, shy: true });
            this._editor.revealLine(positionNow.lineNumber, 0 /* Smooth */);
            this._editor.focus();
        }
        acceptSelectedSuggestion(keepAlternativeSuggestions) {
            if (this._widget) {
                const item = this._widget.getValue().getFocusedItem();
                this._onDidSelectItem(item, !!keepAlternativeSuggestions, true);
            }
        }
        acceptNextSuggestion() {
            this._alternatives.getValue().next();
        }
        acceptPrevSuggestion() {
            this._alternatives.getValue().prev();
        }
        cancelSuggestWidget() {
            if (this._widget) {
                this._model.cancel();
                this._widget.getValue().hideWidget();
            }
        }
        selectNextSuggestion() {
            if (this._widget) {
                this._widget.getValue().selectNext();
            }
        }
        selectNextPageSuggestion() {
            if (this._widget) {
                this._widget.getValue().selectNextPage();
            }
        }
        selectLastSuggestion() {
            if (this._widget) {
                this._widget.getValue().selectLast();
            }
        }
        selectPrevSuggestion() {
            if (this._widget) {
                this._widget.getValue().selectPrevious();
            }
        }
        selectPrevPageSuggestion() {
            if (this._widget) {
                this._widget.getValue().selectPreviousPage();
            }
        }
        selectFirstSuggestion() {
            if (this._widget) {
                this._widget.getValue().selectFirst();
            }
        }
        toggleSuggestionDetails() {
            if (this._widget) {
                this._widget.getValue().toggleDetails();
            }
        }
        toggleSuggestionFocus() {
            if (this._widget) {
                this._widget.getValue().toggleDetailsFocus();
            }
        }
    };
    SuggestController.ID = 'editor.contrib.suggestController';
    SuggestController = __decorate([
        __param(1, editorWorkerService_1.IEditorWorkerService),
        __param(2, suggestMemory_1.ISuggestMemoryService),
        __param(3, commands_1.ICommandService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, instantiation_1.IInstantiationService)
    ], SuggestController);
    exports.SuggestController = SuggestController;
    class TriggerSuggestAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: TriggerSuggestAction.id,
                label: nls.localize('suggest.trigger.label', "Trigger Suggest"),
                alias: 'Trigger Suggest',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCompletionItemProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* CtrlCmd */ | 10 /* Space */,
                    mac: { primary: 256 /* WinCtrl */ | 10 /* Space */ },
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = SuggestController.get(editor);
            if (!controller) {
                return;
            }
            controller.triggerSuggest();
        }
    }
    TriggerSuggestAction.id = 'editor.action.triggerSuggest';
    exports.TriggerSuggestAction = TriggerSuggestAction;
    editorExtensions_1.registerEditorContribution(SuggestController);
    editorExtensions_1.registerEditorAction(TriggerSuggestAction);
    const weight = 100 /* EditorContrib */ + 90;
    const SuggestCommand = editorExtensions_1.EditorCommand.bindToContribution(SuggestController.get);
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'acceptSelectedSuggestion',
        precondition: suggest_1.Context.Visible,
        handler: x => x.acceptSelectedSuggestion(true),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2 /* Tab */
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'acceptSelectedSuggestionOnEnter',
        precondition: suggest_1.Context.Visible,
        handler: x => x.acceptSelectedSuggestion(false),
        kbOpts: {
            weight: weight,
            kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, suggest_1.Context.AcceptSuggestionsOnEnter, suggest_1.Context.MakesTextEdit),
            primary: 3 /* Enter */
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'hideSuggestWidget',
        precondition: suggest_1.Context.Visible,
        handler: x => x.cancelSuggestWidget(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 9 /* Escape */,
            secondary: [1024 /* Shift */ | 9 /* Escape */]
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'selectNextSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.MultipleSuggestions),
        handler: c => c.selectNextSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 18 /* DownArrow */,
            secondary: [2048 /* CtrlCmd */ | 18 /* DownArrow */],
            mac: { primary: 18 /* DownArrow */, secondary: [2048 /* CtrlCmd */ | 18 /* DownArrow */, 256 /* WinCtrl */ | 44 /* KEY_N */] }
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'selectNextPageSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.MultipleSuggestions),
        handler: c => c.selectNextPageSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 12 /* PageDown */,
            secondary: [2048 /* CtrlCmd */ | 12 /* PageDown */]
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'selectLastSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.MultipleSuggestions),
        handler: c => c.selectLastSuggestion()
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'selectPrevSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.MultipleSuggestions),
        handler: c => c.selectPrevSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 16 /* UpArrow */,
            secondary: [2048 /* CtrlCmd */ | 16 /* UpArrow */],
            mac: { primary: 16 /* UpArrow */, secondary: [2048 /* CtrlCmd */ | 16 /* UpArrow */, 256 /* WinCtrl */ | 46 /* KEY_P */] }
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'selectPrevPageSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.MultipleSuggestions),
        handler: c => c.selectPrevPageSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 11 /* PageUp */,
            secondary: [2048 /* CtrlCmd */ | 11 /* PageUp */]
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'selectFirstSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(suggest_1.Context.Visible, suggest_1.Context.MultipleSuggestions),
        handler: c => c.selectFirstSuggestion()
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'toggleSuggestionDetails',
        precondition: suggest_1.Context.Visible,
        handler: x => x.toggleSuggestionDetails(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2048 /* CtrlCmd */ | 10 /* Space */,
            mac: { primary: 256 /* WinCtrl */ | 10 /* Space */ }
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'toggleSuggestionFocus',
        precondition: suggest_1.Context.Visible,
        handler: x => x.toggleSuggestionFocus(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 10 /* Space */,
            mac: { primary: 256 /* WinCtrl */ | 512 /* Alt */ | 10 /* Space */ }
        }
    }));
    //#region tab completions
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'insertBestCompletion',
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.editor.tabCompletion', 'on'), wordContextKey_1.WordContextKey.AtEnd, suggest_1.Context.Visible.toNegated(), suggestAlternatives_1.SuggestAlternatives.OtherSuggestions.toNegated(), snippetController2_1.SnippetController2.InSnippetMode.toNegated()),
        handler: (x, arg) => {
            x.triggerSuggestAndAcceptBest(types_1.isObject(arg) ? Object.assign({ fallback: 'tab' }, arg) : { fallback: 'tab' });
        },
        kbOpts: {
            weight,
            primary: 2 /* Tab */
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'insertNextSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.editor.tabCompletion', 'on'), suggestAlternatives_1.SuggestAlternatives.OtherSuggestions, suggest_1.Context.Visible.toNegated(), snippetController2_1.SnippetController2.InSnippetMode.toNegated()),
        handler: x => x.acceptNextSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2 /* Tab */
        }
    }));
    editorExtensions_1.registerEditorCommand(new SuggestCommand({
        id: 'insertPrevSuggestion',
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.editor.tabCompletion', 'on'), suggestAlternatives_1.SuggestAlternatives.OtherSuggestions, suggest_1.Context.Visible.toNegated(), snippetController2_1.SnippetController2.InSnippetMode.toNegated()),
        handler: x => x.acceptPrevSuggestion(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 1024 /* Shift */ | 2 /* Tab */
        }
    }));
});
//# sourceMappingURL=suggestController.js.map