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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/strings", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/workbench/browser/quickopen", "vs/base/common/filters", "vs/editor/common/model", "vs/platform/quickOpen/common/quickOpen", "vs/editor/contrib/quickOpen/quickOpen", "vs/editor/common/modes", "vs/platform/theme/common/themeService", "vs/editor/common/view/editorColorRegistry", "vs/workbench/services/editor/common/editorService", "vs/base/common/async", "vs/base/common/cancellation", "vs/css!vs/editor/contrib/documentSymbols/media/symbol-icons"], function (require, exports, nls, types, strings, quickOpenModel_1, quickopen_1, filters, model_1, quickOpen_1, quickOpen_2, modes_1, themeService_1, editorColorRegistry_1, editorService_1, async_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GOTO_SYMBOL_PREFIX = '@';
    exports.SCOPE_PREFIX = ':';
    const FALLBACK_NLS_SYMBOL_KIND = nls.localize('property', "properties ({0})");
    const NLS_SYMBOL_KIND_CACHE = {
        [5 /* Method */]: nls.localize('method', "methods ({0})"),
        [11 /* Function */]: nls.localize('function', "functions ({0})"),
        [8 /* Constructor */]: nls.localize('_constructor', "constructors ({0})"),
        [12 /* Variable */]: nls.localize('variable', "variables ({0})"),
        [4 /* Class */]: nls.localize('class', "classes ({0})"),
        [22 /* Struct */]: nls.localize('struct', "structs ({0})"),
        [23 /* Event */]: nls.localize('event', "events ({0})"),
        [24 /* Operator */]: nls.localize('operator', "operators ({0})"),
        [10 /* Interface */]: nls.localize('interface', "interfaces ({0})"),
        [2 /* Namespace */]: nls.localize('namespace', "namespaces ({0})"),
        [3 /* Package */]: nls.localize('package', "packages ({0})"),
        [25 /* TypeParameter */]: nls.localize('typeParameter', "type parameters ({0})"),
        [1 /* Module */]: nls.localize('modules', "modules ({0})"),
        [6 /* Property */]: nls.localize('property', "properties ({0})"),
        [9 /* Enum */]: nls.localize('enum', "enumerations ({0})"),
        [21 /* EnumMember */]: nls.localize('enumMember', "enumeration members ({0})"),
        [14 /* String */]: nls.localize('string', "strings ({0})"),
        [0 /* File */]: nls.localize('file', "files ({0})"),
        [17 /* Array */]: nls.localize('array', "arrays ({0})"),
        [15 /* Number */]: nls.localize('number', "numbers ({0})"),
        [16 /* Boolean */]: nls.localize('boolean', "booleans ({0})"),
        [18 /* Object */]: nls.localize('object', "objects ({0})"),
        [19 /* Key */]: nls.localize('key', "keys ({0})"),
        [7 /* Field */]: nls.localize('field', "fields ({0})"),
        [13 /* Constant */]: nls.localize('constant', "constants ({0})")
    };
    let GotoSymbolAction = class GotoSymbolAction extends quickopen_1.QuickOpenAction {
        constructor(actionId, actionLabel, quickOpenService) {
            super(actionId, actionLabel, exports.GOTO_SYMBOL_PREFIX, quickOpenService);
        }
    };
    GotoSymbolAction.ID = 'workbench.action.gotoSymbol';
    GotoSymbolAction.LABEL = nls.localize('gotoSymbol', "Go to Symbol in File...");
    GotoSymbolAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService)
    ], GotoSymbolAction);
    exports.GotoSymbolAction = GotoSymbolAction;
    class OutlineModel extends quickOpenModel_1.QuickOpenModel {
        applyFilter(searchValue) {
            // Normalize search
            let normalizedSearchValue = searchValue;
            if (searchValue.indexOf(exports.SCOPE_PREFIX) === 0) {
                normalizedSearchValue = normalizedSearchValue.substr(exports.SCOPE_PREFIX.length);
            }
            // Check for match and update visibility and group label
            this.entries.forEach((entry) => {
                // Clear all state first
                entry.setGroupLabel(undefined);
                entry.setShowBorder(false);
                entry.setHighlights([]);
                entry.setHidden(false);
                // Filter by search
                if (normalizedSearchValue) {
                    const highlights = filters.matchesFuzzy2(normalizedSearchValue, entry.getLabel());
                    if (highlights) {
                        entry.setHighlights(highlights);
                        entry.setHidden(false);
                    }
                    else if (!entry.isHidden()) {
                        entry.setHidden(true);
                    }
                }
            });
            // Sort properly if actually searching
            if (searchValue) {
                if (searchValue.indexOf(exports.SCOPE_PREFIX) === 0) {
                    this.entries.sort(this.sortScoped.bind(this, searchValue.toLowerCase()));
                }
                else {
                    this.entries.sort(this.sortNormal.bind(this, searchValue.toLowerCase()));
                }
            }
            // Otherwise restore order as appearing in outline
            else {
                this.entries.sort((a, b) => a.getIndex() - b.getIndex());
            }
            // Mark all type groups
            const visibleResults = this.getEntries(true);
            if (visibleResults.length > 0 && searchValue.indexOf(exports.SCOPE_PREFIX) === 0) {
                let currentType = null;
                let currentResult = null;
                let typeCounter = 0;
                for (let i = 0; i < visibleResults.length; i++) {
                    const result = visibleResults[i];
                    // Found new type
                    if (currentType !== result.getKind()) {
                        // Update previous result with count
                        if (currentResult) {
                            currentResult.setGroupLabel(typeof currentType === 'number' ? this.renderGroupLabel(currentType, typeCounter) : undefined);
                        }
                        currentType = result.getKind();
                        currentResult = result;
                        typeCounter = 1;
                        result.setShowBorder(i > 0);
                    }
                    // Existing type, keep counting
                    else {
                        typeCounter++;
                    }
                }
                // Update previous result with count
                if (currentResult) {
                    currentResult.setGroupLabel(typeof currentType === 'number' ? this.renderGroupLabel(currentType, typeCounter) : undefined);
                }
            }
            // Mark first entry as outline
            else if (visibleResults.length > 0) {
                visibleResults[0].setGroupLabel(nls.localize('symbols', "symbols ({0})", visibleResults.length));
            }
        }
        sortNormal(searchValue, elementA, elementB) {
            // Handle hidden elements
            if (elementA.isHidden() && elementB.isHidden()) {
                return 0;
            }
            else if (elementA.isHidden()) {
                return 1;
            }
            else if (elementB.isHidden()) {
                return -1;
            }
            const elementAName = elementA.getLabel().toLowerCase();
            const elementBName = elementB.getLabel().toLowerCase();
            // Compare by name
            const r = elementAName.localeCompare(elementBName);
            if (r !== 0) {
                return r;
            }
            // If name identical sort by range instead
            const elementARange = elementA.getRange();
            const elementBRange = elementB.getRange();
            return elementARange.startLineNumber - elementBRange.startLineNumber;
        }
        sortScoped(searchValue, elementA, elementB) {
            // Handle hidden elements
            if (elementA.isHidden() && elementB.isHidden()) {
                return 0;
            }
            else if (elementA.isHidden()) {
                return 1;
            }
            else if (elementB.isHidden()) {
                return -1;
            }
            // Remove scope char
            searchValue = searchValue.substr(exports.SCOPE_PREFIX.length);
            // Sort by type first if scoped search
            const elementATypeLabel = NLS_SYMBOL_KIND_CACHE[elementA.getKind()] || FALLBACK_NLS_SYMBOL_KIND;
            const elementBTypeLabel = NLS_SYMBOL_KIND_CACHE[elementB.getKind()] || FALLBACK_NLS_SYMBOL_KIND;
            let r = elementATypeLabel.localeCompare(elementBTypeLabel);
            if (r !== 0) {
                return r;
            }
            // Special sort when searching in scoped mode
            if (searchValue) {
                const elementAName = elementA.getLabel().toLowerCase();
                const elementBName = elementB.getLabel().toLowerCase();
                // Compare by name
                r = elementAName.localeCompare(elementBName);
                if (r !== 0) {
                    return r;
                }
            }
            // Default to sort by range
            const elementARange = elementA.getRange();
            const elementBRange = elementB.getRange();
            return elementARange.startLineNumber - elementBRange.startLineNumber;
        }
        renderGroupLabel(type, count) {
            let pattern = NLS_SYMBOL_KIND_CACHE[type];
            if (!pattern) {
                pattern = FALLBACK_NLS_SYMBOL_KIND;
            }
            return strings.format(pattern, count);
        }
    }
    class SymbolEntry extends quickopen_1.EditorQuickOpenEntryGroup {
        constructor(index, name, kind, description, icon, range, revealRange, highlights, editorService, handler) {
            super();
            this.index = index;
            this.name = name;
            this.kind = kind;
            this.icon = icon;
            this.description = description;
            this.range = range;
            this.revealRange = revealRange || range;
            this.setHighlights(highlights);
            this.editorService = editorService;
            this.handler = handler;
        }
        getIndex() {
            return this.index;
        }
        getLabel() {
            return this.name;
        }
        getAriaLabel() {
            return nls.localize('entryAriaLabel', "{0}, symbols", this.getLabel());
        }
        getIcon() {
            return this.icon;
        }
        getDescription() {
            return this.description;
        }
        getKind() {
            return this.kind;
        }
        getRange() {
            return this.range;
        }
        getInput() {
            return this.editorService.activeEditor || null;
        }
        getOptions(pinned) {
            return {
                selection: this.toSelection(),
                pinned
            };
        }
        run(mode, context) {
            if (mode === 1 /* OPEN */) {
                return this.runOpen(context);
            }
            return this.runPreview();
        }
        runOpen(context) {
            // Check for sideBySide use
            const sideBySide = context.keymods.ctrlCmd;
            if (sideBySide) {
                this.editorService.openEditor(this.getInput(), this.getOptions(context.keymods.alt), editorService_1.SIDE_GROUP);
            }
            // Apply selection and focus
            else {
                const range = this.toSelection();
                const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
                if (activeTextEditorWidget) {
                    activeTextEditorWidget.setSelection(range);
                    activeTextEditorWidget.revealRangeInCenter(range, 0 /* Smooth */);
                }
            }
            return true;
        }
        runPreview() {
            // Select Outline Position
            const range = this.toSelection();
            const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
            if (activeTextEditorWidget) {
                activeTextEditorWidget.revealRangeInCenter(range, 0 /* Smooth */);
                // Decorate if possible
                if (this.editorService.activeControl && types.isFunction(activeTextEditorWidget.changeDecorations)) {
                    this.handler.decorateOutline(this.range, range, activeTextEditorWidget, this.editorService.activeControl.group);
                }
            }
            return false;
        }
        toSelection() {
            return {
                startLineNumber: this.revealRange.startLineNumber,
                startColumn: this.revealRange.startColumn || 1,
                endLineNumber: this.revealRange.startLineNumber,
                endColumn: this.revealRange.startColumn || 1
            };
        }
    }
    let GotoSymbolHandler = class GotoSymbolHandler extends quickopen_1.QuickOpenHandler {
        constructor(editorService) {
            super();
            this.editorService = editorService;
            this.registerListeners();
        }
        registerListeners() {
            this.editorService.onDidActiveEditorChange(() => this.onDidActiveEditorChange());
        }
        onDidActiveEditorChange() {
            this.clearOutlineRequest();
            this.lastKnownEditorViewState = null;
            this.rangeHighlightDecorationId = undefined;
        }
        getResults(searchValue, token) {
            searchValue = searchValue.trim();
            // Support to cancel pending outline requests
            if (!this.pendingOutlineRequest) {
                this.pendingOutlineRequest = new cancellation_1.CancellationTokenSource();
            }
            // Remember view state to be able to restore on cancel
            if (!this.lastKnownEditorViewState) {
                const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
                if (activeTextEditorWidget) {
                    this.lastKnownEditorViewState = activeTextEditorWidget.saveViewState();
                }
            }
            // Resolve Outline Model
            return this.getOutline().then(outline => {
                if (!outline) {
                    return outline;
                }
                if (token.isCancellationRequested) {
                    return outline;
                }
                // Filter by search
                outline.applyFilter(searchValue);
                return outline;
            });
        }
        getEmptyLabel(searchString) {
            if (searchString.length > 0) {
                return nls.localize('noSymbolsMatching', "No symbols matching");
            }
            return nls.localize('noSymbolsFound', "No symbols found");
        }
        getAriaLabel() {
            return nls.localize('gotoSymbolHandlerAriaLabel', "Type to narrow down symbols of the currently active editor.");
        }
        canRun() {
            let canRun = false;
            const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
            if (activeTextEditorWidget) {
                let model = activeTextEditorWidget.getModel();
                if (model && model.modified && model.original) {
                    model = model.modified; // Support for diff editor models
                }
                if (model && types.isFunction(model.getLanguageIdentifier)) {
                    canRun = modes_1.DocumentSymbolProviderRegistry.has(model);
                }
            }
            return canRun ? true : activeTextEditorWidget !== null ? nls.localize('cannotRunGotoSymbolInFile', "No symbol information for the file") : nls.localize('cannotRunGotoSymbol', "Open a text file first to go to a symbol");
        }
        getAutoFocus(searchValue) {
            searchValue = searchValue.trim();
            // Remove any type pattern (:) from search value as needed
            if (searchValue.indexOf(exports.SCOPE_PREFIX) === 0) {
                searchValue = searchValue.substr(exports.SCOPE_PREFIX.length);
            }
            return {
                autoFocusPrefixMatch: searchValue,
                autoFocusFirstEntry: !!searchValue
            };
        }
        toQuickOpenEntries(flattened) {
            const results = [];
            for (let i = 0; i < flattened.length; i++) {
                const element = flattened[i];
                const label = strings.trim(element.name);
                // Show parent scope as description
                const description = element.containerName || '';
                const icon = modes_1.symbolKindToCssClass(element.kind);
                // Add
                results.push(new SymbolEntry(i, label, element.kind, description, `symbol-icon ${icon}`, element.range, element.selectionRange, [], this.editorService, this));
            }
            return results;
        }
        getOutline() {
            if (!this.cachedOutlineRequest) {
                this.cachedOutlineRequest = this.doGetActiveOutline();
            }
            return this.cachedOutlineRequest;
        }
        doGetActiveOutline() {
            const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
            if (activeTextEditorWidget) {
                let model = activeTextEditorWidget.getModel();
                if (model && model.modified && model.original) {
                    model = model.modified; // Support for diff editor models
                }
                if (model && types.isFunction(model.getLanguageIdentifier)) {
                    return Promise.resolve(async_1.asPromise(() => quickOpen_2.getDocumentSymbols(model, true, this.pendingOutlineRequest.token)).then(entries => {
                        return new OutlineModel(this.toQuickOpenEntries(entries));
                    }));
                }
            }
            return Promise.resolve(null);
        }
        decorateOutline(fullRange, startRange, editor, group) {
            editor.changeDecorations((changeAccessor) => {
                const deleteDecorations = [];
                if (this.rangeHighlightDecorationId) {
                    deleteDecorations.push(this.rangeHighlightDecorationId.lineDecorationId);
                    deleteDecorations.push(this.rangeHighlightDecorationId.rangeHighlightId);
                    this.rangeHighlightDecorationId = undefined;
                }
                const newDecorations = [
                    // rangeHighlight at index 0
                    {
                        range: fullRange,
                        options: {
                            className: 'rangeHighlight',
                            isWholeLine: true
                        }
                    },
                    // lineDecoration at index 1
                    {
                        range: startRange,
                        options: {
                            overviewRuler: {
                                color: themeService_1.themeColorFromId(editorColorRegistry_1.overviewRulerRangeHighlight),
                                position: model_1.OverviewRulerLane.Full
                            }
                        }
                    }
                ];
                const decorations = changeAccessor.deltaDecorations(deleteDecorations, newDecorations);
                const rangeHighlightId = decorations[0];
                const lineDecorationId = decorations[1];
                this.rangeHighlightDecorationId = {
                    groupId: group.id,
                    rangeHighlightId: rangeHighlightId,
                    lineDecorationId: lineDecorationId,
                };
            });
        }
        clearDecorations() {
            const rangeHighlightDecorationId = this.rangeHighlightDecorationId;
            if (rangeHighlightDecorationId) {
                this.editorService.visibleControls.forEach(editor => {
                    if (editor.group && editor.group.id === rangeHighlightDecorationId.groupId) {
                        const editorControl = editor.getControl();
                        editorControl.changeDecorations((changeAccessor) => {
                            changeAccessor.deltaDecorations([
                                rangeHighlightDecorationId.lineDecorationId,
                                rangeHighlightDecorationId.rangeHighlightId
                            ], []);
                        });
                    }
                });
                this.rangeHighlightDecorationId = undefined;
            }
        }
        onClose(canceled) {
            // Cancel any pending/cached outline request now
            this.clearOutlineRequest();
            // Clear Highlight Decorations if present
            this.clearDecorations();
            // Restore selection if canceled
            if (canceled && this.lastKnownEditorViewState) {
                const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
                if (activeTextEditorWidget) {
                    activeTextEditorWidget.restoreViewState(this.lastKnownEditorViewState);
                }
                this.lastKnownEditorViewState = null;
            }
        }
        clearOutlineRequest() {
            if (this.pendingOutlineRequest) {
                this.pendingOutlineRequest.cancel();
                this.pendingOutlineRequest.dispose();
                this.pendingOutlineRequest = undefined;
            }
            this.cachedOutlineRequest = undefined;
        }
    };
    GotoSymbolHandler.ID = 'workbench.picker.filesymbols';
    GotoSymbolHandler = __decorate([
        __param(0, editorService_1.IEditorService)
    ], GotoSymbolHandler);
    exports.GotoSymbolHandler = GotoSymbolHandler;
});
//# sourceMappingURL=gotoSymbolHandler.js.map