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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/browser/core/editorState", "vs/editor/browser/editorExtensions", "vs/editor/common/modes", "vs/editor/contrib/codelens/codelens", "vs/editor/contrib/codelens/codelensWidget", "vs/platform/commands/common/commands", "vs/platform/notification/common/notification"], function (require, exports, async_1, errors_1, lifecycle_1, editorState_1, editorExtensions_1, modes_1, codelens_1, codelensWidget_1, commands_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CodeLensContribution = class CodeLensContribution {
        constructor(_editor, _commandService, _notificationService) {
            this._editor = _editor;
            this._commandService = _commandService;
            this._notificationService = _notificationService;
            this._isEnabled = this._editor.getConfiguration().contribInfo.codeLens;
            this._globalToDispose = [];
            this._localToDispose = [];
            this._lenses = [];
            this._currentFindCodeLensSymbolsPromise = null;
            this._modelChangeCounter = 0;
            this._globalToDispose.push(this._editor.onDidChangeModel(() => this._onModelChange()));
            this._globalToDispose.push(this._editor.onDidChangeModelLanguage(() => this._onModelChange()));
            this._globalToDispose.push(this._editor.onDidChangeConfiguration((e) => {
                let prevIsEnabled = this._isEnabled;
                this._isEnabled = this._editor.getConfiguration().contribInfo.codeLens;
                if (prevIsEnabled !== this._isEnabled) {
                    this._onModelChange();
                }
            }));
            this._globalToDispose.push(modes_1.CodeLensProviderRegistry.onDidChange(this._onModelChange, this));
            this._onModelChange();
        }
        dispose() {
            this._localDispose();
            this._globalToDispose = lifecycle_1.dispose(this._globalToDispose);
        }
        _localDispose() {
            if (this._currentFindCodeLensSymbolsPromise) {
                this._currentFindCodeLensSymbolsPromise.cancel();
                this._currentFindCodeLensSymbolsPromise = null;
                this._modelChangeCounter++;
            }
            if (this._currentResolveCodeLensSymbolsPromise) {
                this._currentResolveCodeLensSymbolsPromise.cancel();
                this._currentResolveCodeLensSymbolsPromise = null;
            }
            this._localToDispose = lifecycle_1.dispose(this._localToDispose);
        }
        getId() {
            return CodeLensContribution.ID;
        }
        _onModelChange() {
            this._localDispose();
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            if (!this._isEnabled) {
                return;
            }
            if (!modes_1.CodeLensProviderRegistry.has(model)) {
                return;
            }
            for (const provider of modes_1.CodeLensProviderRegistry.all(model)) {
                if (typeof provider.onDidChange === 'function') {
                    let registration = provider.onDidChange(() => scheduler.schedule());
                    this._localToDispose.push(registration);
                }
            }
            this._detectVisibleLenses = new async_1.RunOnceScheduler(() => {
                this._onViewportChanged();
            }, 500);
            const scheduler = new async_1.RunOnceScheduler(() => {
                const counterValue = ++this._modelChangeCounter;
                if (this._currentFindCodeLensSymbolsPromise) {
                    this._currentFindCodeLensSymbolsPromise.cancel();
                }
                this._currentFindCodeLensSymbolsPromise = async_1.createCancelablePromise(token => codelens_1.getCodeLensData(model, token));
                this._currentFindCodeLensSymbolsPromise.then((result) => {
                    if (counterValue === this._modelChangeCounter) { // only the last one wins
                        this._renderCodeLensSymbols(result);
                        this._detectVisibleLenses.schedule();
                    }
                }, errors_1.onUnexpectedError);
            }, 250);
            this._localToDispose.push(scheduler);
            this._localToDispose.push(this._detectVisibleLenses);
            this._localToDispose.push(this._editor.onDidChangeModelContent((e) => {
                this._editor.changeDecorations((changeAccessor) => {
                    this._editor.changeViewZones((viewAccessor) => {
                        let toDispose = [];
                        let lastLensLineNumber = -1;
                        this._lenses.forEach((lens) => {
                            if (!lens.isValid() || lastLensLineNumber === lens.getLineNumber()) {
                                // invalid -> lens collapsed, attach range doesn't exist anymore
                                // line_number -> lenses should never be on the same line
                                toDispose.push(lens);
                            }
                            else {
                                lens.update(viewAccessor);
                                lastLensLineNumber = lens.getLineNumber();
                            }
                        });
                        let helper = new codelensWidget_1.CodeLensHelper();
                        toDispose.forEach((l) => {
                            l.dispose(helper, viewAccessor);
                            this._lenses.splice(this._lenses.indexOf(l), 1);
                        });
                        helper.commit(changeAccessor);
                    });
                });
                // Compute new `visible` code lenses
                this._detectVisibleLenses.schedule();
                // Ask for all references again
                scheduler.schedule();
            }));
            this._localToDispose.push(this._editor.onDidScrollChange(e => {
                if (e.scrollTopChanged && this._lenses.length > 0) {
                    this._detectVisibleLenses.schedule();
                }
            }));
            this._localToDispose.push(this._editor.onDidLayoutChange(e => {
                this._detectVisibleLenses.schedule();
            }));
            this._localToDispose.push(lifecycle_1.toDisposable(() => {
                if (this._editor.getModel()) {
                    const scrollState = editorState_1.StableEditorScrollState.capture(this._editor);
                    this._editor.changeDecorations((changeAccessor) => {
                        this._editor.changeViewZones((accessor) => {
                            this._disposeAllLenses(changeAccessor, accessor);
                        });
                    });
                    scrollState.restore(this._editor);
                }
                else {
                    // No accessors available
                    this._disposeAllLenses(undefined, undefined);
                }
            }));
            this._localToDispose.push(this._editor.onDidChangeConfiguration(e => {
                if (e.fontInfo) {
                    for (const lens of this._lenses) {
                        lens.updateHeight();
                    }
                }
            }));
            this._localToDispose.push(this._editor.onMouseUp(e => {
                if (e.target.type === 9 /* CONTENT_WIDGET */ && e.target.element && e.target.element.tagName === 'A') {
                    for (const lens of this._lenses) {
                        let command = lens.getCommand(e.target.element);
                        if (command) {
                            this._commandService.executeCommand(command.id, ...(command.arguments || [])).catch(err => this._notificationService.error(err));
                            break;
                        }
                    }
                }
            }));
            scheduler.schedule();
        }
        _disposeAllLenses(decChangeAccessor, viewZoneChangeAccessor) {
            let helper = new codelensWidget_1.CodeLensHelper();
            this._lenses.forEach((lens) => lens.dispose(helper, viewZoneChangeAccessor));
            if (decChangeAccessor) {
                helper.commit(decChangeAccessor);
            }
            this._lenses = [];
        }
        _renderCodeLensSymbols(symbols) {
            if (!this._editor.hasModel()) {
                return;
            }
            let maxLineNumber = this._editor.getModel().getLineCount();
            let groups = [];
            let lastGroup;
            for (let symbol of symbols) {
                let line = symbol.symbol.range.startLineNumber;
                if (line < 1 || line > maxLineNumber) {
                    // invalid code lens
                    continue;
                }
                else if (lastGroup && lastGroup[lastGroup.length - 1].symbol.range.startLineNumber === line) {
                    // on same line as previous
                    lastGroup.push(symbol);
                }
                else {
                    // on later line as previous
                    lastGroup = [symbol];
                    groups.push(lastGroup);
                }
            }
            const scrollState = editorState_1.StableEditorScrollState.capture(this._editor);
            this._editor.changeDecorations((changeAccessor) => {
                this._editor.changeViewZones((accessor) => {
                    let codeLensIndex = 0, groupsIndex = 0, helper = new codelensWidget_1.CodeLensHelper();
                    while (groupsIndex < groups.length && codeLensIndex < this._lenses.length) {
                        let symbolsLineNumber = groups[groupsIndex][0].symbol.range.startLineNumber;
                        let codeLensLineNumber = this._lenses[codeLensIndex].getLineNumber();
                        if (codeLensLineNumber < symbolsLineNumber) {
                            this._lenses[codeLensIndex].dispose(helper, accessor);
                            this._lenses.splice(codeLensIndex, 1);
                        }
                        else if (codeLensLineNumber === symbolsLineNumber) {
                            this._lenses[codeLensIndex].updateCodeLensSymbols(groups[groupsIndex], helper);
                            groupsIndex++;
                            codeLensIndex++;
                        }
                        else {
                            this._lenses.splice(codeLensIndex, 0, new codelensWidget_1.CodeLens(groups[groupsIndex], this._editor, helper, accessor, () => this._detectVisibleLenses.schedule()));
                            codeLensIndex++;
                            groupsIndex++;
                        }
                    }
                    // Delete extra code lenses
                    while (codeLensIndex < this._lenses.length) {
                        this._lenses[codeLensIndex].dispose(helper, accessor);
                        this._lenses.splice(codeLensIndex, 1);
                    }
                    // Create extra symbols
                    while (groupsIndex < groups.length) {
                        this._lenses.push(new codelensWidget_1.CodeLens(groups[groupsIndex], this._editor, helper, accessor, () => this._detectVisibleLenses.schedule()));
                        groupsIndex++;
                    }
                    helper.commit(changeAccessor);
                });
            });
            scrollState.restore(this._editor);
        }
        _onViewportChanged() {
            if (this._currentResolveCodeLensSymbolsPromise) {
                this._currentResolveCodeLensSymbolsPromise.cancel();
                this._currentResolveCodeLensSymbolsPromise = null;
            }
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            const toResolve = [];
            const lenses = [];
            this._lenses.forEach((lens) => {
                const request = lens.computeIfNecessary(model);
                if (request) {
                    toResolve.push(request);
                    lenses.push(lens);
                }
            });
            if (toResolve.length === 0) {
                return;
            }
            this._currentResolveCodeLensSymbolsPromise = async_1.createCancelablePromise(token => {
                const promises = toResolve.map((request, i) => {
                    const resolvedSymbols = new Array(request.length);
                    const promises = request.map((request, i) => {
                        if (!request.symbol.command && typeof request.provider.resolveCodeLens === 'function') {
                            return Promise.resolve(request.provider.resolveCodeLens(model, request.symbol, token)).then(symbol => {
                                resolvedSymbols[i] = symbol;
                            });
                        }
                        else {
                            resolvedSymbols[i] = request.symbol;
                            return Promise.resolve(undefined);
                        }
                    });
                    return Promise.all(promises).then(() => {
                        lenses[i].updateCommands(resolvedSymbols);
                    });
                });
                return Promise.all(promises);
            });
            this._currentResolveCodeLensSymbolsPromise.then(() => {
                this._currentResolveCodeLensSymbolsPromise = null;
            }).catch(err => {
                this._currentResolveCodeLensSymbolsPromise = null;
                errors_1.onUnexpectedError(err);
            });
        }
    };
    CodeLensContribution.ID = 'css.editor.codeLens';
    CodeLensContribution = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, notification_1.INotificationService)
    ], CodeLensContribution);
    exports.CodeLensContribution = CodeLensContribution;
    editorExtensions_1.registerEditorContribution(CodeLensContribution);
});
//# sourceMappingURL=codelensController.js.map