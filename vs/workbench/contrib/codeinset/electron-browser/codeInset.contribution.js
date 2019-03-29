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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/browser/core/editorState", "../common/codeInset", "./codeInsetWidget", "vs/editor/browser/editorExtensions", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/configuration/common/configuration"], function (require, exports, async_1, errors_1, lifecycle_1, editorState_1, codeInset_1, codeInsetWidget_1, editorExtensions_1, platform_1, configurationRegistry_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // import { localize } from 'vs/nls';
    let CodeInsetController = class CodeInsetController {
        constructor(_editor, _configService) {
            this._editor = _editor;
            this._configService = _configService;
            this._pendingWebviews = new Map();
            this._isEnabled = this._configService.getValue('editor.codeInsets');
            this._globalToDispose = [];
            this._localToDispose = [];
            this._insetWidgets = [];
            this._currentFindCodeInsetSymbolsPromise = null;
            this._modelChangeCounter = 0;
            this._globalToDispose.push(this._editor.onDidChangeModel(() => this._onModelChange()));
            this._globalToDispose.push(this._editor.onDidChangeModelLanguage(() => this._onModelChange()));
            this._globalToDispose.push(this._configService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.codeInsets')) {
                    let prevIsEnabled = this._isEnabled;
                    this._isEnabled = this._configService.getValue('editor.codeInsets');
                    if (prevIsEnabled !== this._isEnabled) {
                        this._onModelChange();
                    }
                }
            }));
            this._globalToDispose.push(codeInset_1.CodeInsetProviderRegistry.onDidChange(this._onModelChange, this));
            this._onModelChange();
        }
        static get(editor) {
            return editor.getContribution(CodeInsetController.ID);
        }
        dispose() {
            this._localDispose();
            this._globalToDispose = lifecycle_1.dispose(this._globalToDispose);
        }
        acceptWebview(symbolId, webviewElement) {
            const pendingWebview = this._pendingWebviews.get(symbolId);
            if (pendingWebview) {
                pendingWebview(webviewElement);
                this._pendingWebviews.delete(symbolId);
                return true;
            }
            return false;
        }
        _localDispose() {
            if (this._currentFindCodeInsetSymbolsPromise) {
                this._currentFindCodeInsetSymbolsPromise.cancel();
                this._currentFindCodeInsetSymbolsPromise = null;
                this._modelChangeCounter++;
            }
            if (this._currentResolveCodeInsetSymbolsPromise) {
                this._currentResolveCodeInsetSymbolsPromise.cancel();
                this._currentResolveCodeInsetSymbolsPromise = null;
            }
            this._localToDispose = lifecycle_1.dispose(this._localToDispose);
        }
        getId() {
            return CodeInsetController.ID;
        }
        _onModelChange() {
            this._localDispose();
            const model = this._editor.getModel();
            if (!model || !this._isEnabled || !codeInset_1.CodeInsetProviderRegistry.has(model)) {
                return;
            }
            for (const provider of codeInset_1.CodeInsetProviderRegistry.all(model)) {
                if (typeof provider.onDidChange === 'function') {
                    let registration = provider.onDidChange(() => scheduler.schedule());
                    this._localToDispose.push(registration);
                }
            }
            this._detectVisibleInsets = new async_1.RunOnceScheduler(() => {
                this._onViewportChanged();
            }, 500);
            const scheduler = new async_1.RunOnceScheduler(() => {
                const counterValue = ++this._modelChangeCounter;
                if (this._currentFindCodeInsetSymbolsPromise) {
                    this._currentFindCodeInsetSymbolsPromise.cancel();
                }
                this._currentFindCodeInsetSymbolsPromise = async_1.createCancelablePromise(token => codeInset_1.getCodeInsetData(model, token));
                this._currentFindCodeInsetSymbolsPromise.then(codeInsetData => {
                    if (counterValue === this._modelChangeCounter) { // only the last one wins
                        this._renderCodeInsetSymbols(codeInsetData);
                        this._detectVisibleInsets.schedule();
                    }
                }, errors_1.onUnexpectedError);
            }, 250);
            this._localToDispose.push(scheduler);
            this._localToDispose.push(this._detectVisibleInsets);
            this._localToDispose.push(this._editor.onDidChangeModelContent(() => {
                this._editor.changeDecorations(changeAccessor => {
                    this._editor.changeViewZones(viewAccessor => {
                        let toDispose = [];
                        let lastInsetLineNumber = -1;
                        this._insetWidgets.forEach(inset => {
                            if (!inset.isValid() || lastInsetLineNumber === inset.getLineNumber()) {
                                // invalid -> Inset collapsed, attach range doesn't exist anymore
                                // line_number -> insets should never be on the same line
                                toDispose.push(inset);
                            }
                            else {
                                inset.reposition(viewAccessor);
                                lastInsetLineNumber = inset.getLineNumber();
                            }
                        });
                        let helper = new codeInsetWidget_1.CodeInsetHelper();
                        toDispose.forEach((l) => {
                            l.dispose(helper, viewAccessor);
                            this._insetWidgets.splice(this._insetWidgets.indexOf(l), 1);
                        });
                        helper.commit(changeAccessor);
                    });
                });
                // Compute new `visible` code insets
                this._detectVisibleInsets.schedule();
                // Ask for all references again
                scheduler.schedule();
            }));
            this._localToDispose.push(this._editor.onDidScrollChange(e => {
                if (e.scrollTopChanged && this._insetWidgets.length > 0) {
                    this._detectVisibleInsets.schedule();
                }
            }));
            this._localToDispose.push(this._editor.onDidLayoutChange(() => {
                this._detectVisibleInsets.schedule();
            }));
            this._localToDispose.push(lifecycle_1.toDisposable(() => {
                if (this._editor.getModel()) {
                    const scrollState = editorState_1.StableEditorScrollState.capture(this._editor);
                    this._editor.changeDecorations((changeAccessor) => {
                        this._editor.changeViewZones((accessor) => {
                            this._disposeAllInsets(changeAccessor, accessor);
                        });
                    });
                    scrollState.restore(this._editor);
                }
                else {
                    // No accessors available
                    this._disposeAllInsets(null, null);
                }
            }));
            scheduler.schedule();
        }
        _disposeAllInsets(decChangeAccessor, viewZoneChangeAccessor) {
            let helper = new codeInsetWidget_1.CodeInsetHelper();
            this._insetWidgets.forEach((Inset) => Inset.dispose(helper, viewZoneChangeAccessor));
            if (decChangeAccessor) {
                helper.commit(decChangeAccessor);
            }
            this._insetWidgets = [];
        }
        _renderCodeInsetSymbols(symbols) {
            if (!this._editor.hasModel()) {
                return;
            }
            let maxLineNumber = this._editor.getModel().getLineCount();
            let groups = [];
            let lastGroup;
            for (let symbol of symbols) {
                let line = symbol.symbol.range.startLineNumber;
                if (line < 1 || line > maxLineNumber) {
                    // invalid code Inset
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
            this._editor.changeDecorations(changeAccessor => {
                this._editor.changeViewZones(accessor => {
                    let codeInsetIndex = 0, groupsIndex = 0, helper = new codeInsetWidget_1.CodeInsetHelper();
                    while (groupsIndex < groups.length && codeInsetIndex < this._insetWidgets.length) {
                        let symbolsLineNumber = groups[groupsIndex][0].symbol.range.startLineNumber;
                        let codeInsetLineNumber = this._insetWidgets[codeInsetIndex].getLineNumber();
                        if (codeInsetLineNumber < symbolsLineNumber) {
                            this._insetWidgets[codeInsetIndex].dispose(helper, accessor);
                            this._insetWidgets.splice(codeInsetIndex, 1);
                        }
                        else if (codeInsetLineNumber === symbolsLineNumber) {
                            this._insetWidgets[codeInsetIndex].updateCodeInsetSymbols(groups[groupsIndex], helper);
                            groupsIndex++;
                            codeInsetIndex++;
                        }
                        else {
                            this._insetWidgets.splice(codeInsetIndex, 0, new codeInsetWidget_1.CodeInsetWidget(groups[groupsIndex], this._editor, helper));
                            codeInsetIndex++;
                            groupsIndex++;
                        }
                    }
                    // Delete extra code insets
                    while (codeInsetIndex < this._insetWidgets.length) {
                        this._insetWidgets[codeInsetIndex].dispose(helper, accessor);
                        this._insetWidgets.splice(codeInsetIndex, 1);
                    }
                    // Create extra symbols
                    while (groupsIndex < groups.length) {
                        this._insetWidgets.push(new codeInsetWidget_1.CodeInsetWidget(groups[groupsIndex], this._editor, helper));
                        groupsIndex++;
                    }
                    helper.commit(changeAccessor);
                });
            });
            scrollState.restore(this._editor);
        }
        _onViewportChanged() {
            if (this._currentResolveCodeInsetSymbolsPromise) {
                this._currentResolveCodeInsetSymbolsPromise.cancel();
                this._currentResolveCodeInsetSymbolsPromise = null;
            }
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            const allWidgetRequests = [];
            const insetWidgets = [];
            this._insetWidgets.forEach(inset => {
                const widgetRequests = inset.computeIfNecessary(model);
                if (widgetRequests) {
                    allWidgetRequests.push(widgetRequests);
                    insetWidgets.push(inset);
                }
            });
            if (allWidgetRequests.length === 0) {
                return;
            }
            this._currentResolveCodeInsetSymbolsPromise = async_1.createCancelablePromise(token => {
                const allPromises = allWidgetRequests.map((widgetRequests, r) => {
                    const widgetPromises = widgetRequests.map(request => {
                        if (request.resolved) {
                            return Promise.resolve(undefined);
                        }
                        let a = new Promise(resolve => {
                            this._pendingWebviews.set(request.symbol.id, element => {
                                request.resolved = true;
                                insetWidgets[r].adoptWebview(element);
                                resolve();
                            });
                        });
                        let b = request.provider.resolveCodeInset(model, request.symbol, token);
                        return Promise.all([a, b]);
                    });
                    return Promise.all(widgetPromises);
                });
                return Promise.all(allPromises);
            });
            this._currentResolveCodeInsetSymbolsPromise.then(() => {
                this._currentResolveCodeInsetSymbolsPromise = null;
            }).catch(err => {
                this._currentResolveCodeInsetSymbolsPromise = null;
                errors_1.onUnexpectedError(err);
            });
        }
    };
    CodeInsetController.ID = 'css.editor.codeInset';
    CodeInsetController = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], CodeInsetController);
    exports.CodeInsetController = CodeInsetController;
    editorExtensions_1.registerEditorContribution(CodeInsetController);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'editor',
        properties: {
        // ['editor.codeInsets']: {
        // 	description: localize('editor.codeInsets', "Enable/disable editor code insets"),
        // 	type: 'boolean',
        // 	default: false
        // }
        }
    });
});
//# sourceMappingURL=codeInset.contribution.js.map