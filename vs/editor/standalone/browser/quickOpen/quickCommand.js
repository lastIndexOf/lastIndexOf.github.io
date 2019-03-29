/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/browser", "vs/base/common/errors", "vs/base/common/filters", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/standalone/browser/quickOpen/editorQuickOpen", "vs/platform/keybinding/common/keybinding"], function (require, exports, nls, browser, errors_1, filters_1, quickOpenModel_1, editorExtensions_1, editorContextKeys_1, editorQuickOpen_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EditorActionCommandEntry extends quickOpenModel_1.QuickOpenEntryGroup {
        constructor(key, keyAriaLabel, highlights, action, editor) {
            super();
            this.key = key;
            this.keyAriaLabel = keyAriaLabel;
            this.setHighlights(highlights);
            this.action = action;
            this.editor = editor;
        }
        getLabel() {
            return this.action.label;
        }
        getAriaLabel() {
            if (this.keyAriaLabel) {
                return nls.localize('ariaLabelEntryWithKey', "{0}, {1}, commands", this.getLabel(), this.keyAriaLabel);
            }
            return nls.localize('ariaLabelEntry', "{0}, commands", this.getLabel());
        }
        getGroupLabel() {
            return this.key;
        }
        run(mode, context) {
            if (mode === 1 /* OPEN */) {
                // Use a timeout to give the quick open widget a chance to close itself first
                setTimeout(() => {
                    // Some actions are enabled only when editor has focus
                    this.editor.focus();
                    try {
                        let promise = this.action.run() || Promise.resolve();
                        promise.then(undefined, errors_1.onUnexpectedError);
                    }
                    catch (error) {
                        errors_1.onUnexpectedError(error);
                    }
                }, 50);
                return true;
            }
            return false;
        }
    }
    exports.EditorActionCommandEntry = EditorActionCommandEntry;
    class QuickCommandAction extends editorQuickOpen_1.BaseEditorQuickOpenAction {
        constructor() {
            super(nls.localize('quickCommandActionInput', "Type the name of an action you want to execute"), {
                id: 'editor.action.quickCommand',
                label: nls.localize('QuickCommandAction.label', "Command Palette"),
                alias: 'Command Palette',
                precondition: null,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: (browser.isIE ? 512 /* Alt */ | 59 /* F1 */ : 59 /* F1 */),
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    group: 'z_commands',
                    order: 1
                }
            });
        }
        run(accessor, editor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            this._show(this.getController(editor), {
                getModel: (value) => {
                    return new quickOpenModel_1.QuickOpenModel(this._editorActionsToEntries(keybindingService, editor, value));
                },
                getAutoFocus: (searchValue) => {
                    return {
                        autoFocusFirstEntry: true,
                        autoFocusPrefixMatch: searchValue
                    };
                }
            });
        }
        _sort(elementA, elementB) {
            let elementAName = (elementA.getLabel() || '').toLowerCase();
            let elementBName = (elementB.getLabel() || '').toLowerCase();
            return elementAName.localeCompare(elementBName);
        }
        _editorActionsToEntries(keybindingService, editor, searchValue) {
            let actions = editor.getSupportedActions();
            let entries = [];
            for (const action of actions) {
                let keybinding = keybindingService.lookupKeybinding(action.id);
                if (action.label) {
                    let highlights = filters_1.matchesFuzzy(searchValue, action.label);
                    if (highlights) {
                        entries.push(new EditorActionCommandEntry(keybinding ? keybinding.getLabel() || '' : '', keybinding ? keybinding.getAriaLabel() || '' : '', highlights, action, editor));
                    }
                }
            }
            // Sort by name
            entries = entries.sort(this._sort);
            return entries;
        }
    }
    exports.QuickCommandAction = QuickCommandAction;
    editorExtensions_1.registerEditorAction(QuickCommandAction);
});
//# sourceMappingURL=quickCommand.js.map