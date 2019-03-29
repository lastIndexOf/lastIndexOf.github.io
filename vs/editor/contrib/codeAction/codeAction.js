/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/common/services/modelService", "./codeActionTrigger"], function (require, exports, arrays_1, cancellation_1, errors_1, uri_1, editorExtensions_1, range_1, modes_1, modelService_1, codeActionTrigger_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CodeActionSet {
        static codeActionsComparator(a, b) {
            if (arrays_1.isNonEmptyArray(a.diagnostics)) {
                if (arrays_1.isNonEmptyArray(b.diagnostics)) {
                    return a.diagnostics[0].message.localeCompare(b.diagnostics[0].message);
                }
                else {
                    return -1;
                }
            }
            else if (arrays_1.isNonEmptyArray(b.diagnostics)) {
                return 1;
            }
            else {
                return 0; // both have no diagnostics
            }
        }
        constructor(actions) {
            this.actions = arrays_1.mergeSort(actions, CodeActionSet.codeActionsComparator);
        }
        get hasAutoFix() {
            return this.actions.some(fix => !!fix.kind && codeActionTrigger_1.CodeActionKind.QuickFix.contains(new codeActionTrigger_1.CodeActionKind(fix.kind)) && !!fix.isPreferred);
        }
    }
    exports.CodeActionSet = CodeActionSet;
    function getCodeActions(model, rangeOrSelection, trigger, token) {
        const filter = trigger.filter || {};
        const codeActionContext = {
            only: filter.kind ? filter.kind.value : undefined,
            trigger: trigger.type === 'manual' ? 2 /* Manual */ : 1 /* Automatic */
        };
        const promises = getCodeActionProviders(model, filter).map(provider => {
            return Promise.resolve(provider.provideCodeActions(model, rangeOrSelection, codeActionContext, token)).then(providedCodeActions => {
                if (!Array.isArray(providedCodeActions)) {
                    return [];
                }
                return providedCodeActions.filter(action => action && codeActionTrigger_1.filtersAction(filter, action));
            }, (err) => {
                if (errors_1.isPromiseCanceledError(err)) {
                    throw err;
                }
                errors_1.onUnexpectedExternalError(err);
                return [];
            });
        });
        return Promise.all(promises)
            .then(arrays_1.flatten)
            .then(actions => new CodeActionSet(actions));
    }
    exports.getCodeActions = getCodeActions;
    function getCodeActionProviders(model, filter) {
        return modes_1.CodeActionProviderRegistry.all(model)
            // Don't include providers that we know will not return code actions of interest
            .filter(provider => {
            if (!provider.providedCodeActionKinds) {
                // We don't know what type of actions this provider will return.
                return true;
            }
            return provider.providedCodeActionKinds.some(kind => codeActionTrigger_1.mayIncludeActionsOfKind(filter, new codeActionTrigger_1.CodeActionKind(kind)));
        });
    }
    editorExtensions_1.registerLanguageCommand('_executeCodeActionProvider', function (accessor, args) {
        const { resource, range, kind } = args;
        if (!(resource instanceof uri_1.URI) || !range_1.Range.isIRange(range)) {
            throw errors_1.illegalArgument();
        }
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (!model) {
            throw errors_1.illegalArgument();
        }
        return getCodeActions(model, model.validateRange(range), { type: 'manual', filter: { includeSourceActions: true, kind: kind && kind.value ? new codeActionTrigger_1.CodeActionKind(kind.value) : undefined } }, cancellation_1.CancellationToken.None).then(actions => actions.actions);
    });
});
//# sourceMappingURL=codeAction.js.map