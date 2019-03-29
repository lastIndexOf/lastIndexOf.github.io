/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/common/modes", "vs/editor/common/services/modelService"], function (require, exports, arrays_1, cancellation_1, errors_1, uri_1, editorExtensions_1, modes_1, modelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getCodeLensData(model, token) {
        const symbols = [];
        const provider = modes_1.CodeLensProviderRegistry.ordered(model);
        const promises = provider.map(provider => Promise.resolve(provider.provideCodeLenses(model, token)).then(result => {
            if (Array.isArray(result)) {
                for (let symbol of result) {
                    symbols.push({ symbol, provider });
                }
            }
        }).catch(errors_1.onUnexpectedExternalError));
        return Promise.all(promises).then(() => {
            return arrays_1.mergeSort(symbols, (a, b) => {
                // sort by lineNumber, provider-rank, and column
                if (a.symbol.range.startLineNumber < b.symbol.range.startLineNumber) {
                    return -1;
                }
                else if (a.symbol.range.startLineNumber > b.symbol.range.startLineNumber) {
                    return 1;
                }
                else if (provider.indexOf(a.provider) < provider.indexOf(b.provider)) {
                    return -1;
                }
                else if (provider.indexOf(a.provider) > provider.indexOf(b.provider)) {
                    return 1;
                }
                else if (a.symbol.range.startColumn < b.symbol.range.startColumn) {
                    return -1;
                }
                else if (a.symbol.range.startColumn > b.symbol.range.startColumn) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
        });
    }
    exports.getCodeLensData = getCodeLensData;
    editorExtensions_1.registerLanguageCommand('_executeCodeLensProvider', function (accessor, args) {
        let { resource, itemResolveCount } = args;
        if (!(resource instanceof uri_1.URI)) {
            throw errors_1.illegalArgument();
        }
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (!model) {
            throw errors_1.illegalArgument();
        }
        const result = [];
        return getCodeLensData(model, cancellation_1.CancellationToken.None).then(value => {
            let resolve = [];
            for (const item of value) {
                if (typeof itemResolveCount === 'undefined' || Boolean(item.symbol.command)) {
                    result.push(item.symbol);
                }
                else if (itemResolveCount-- > 0 && item.provider.resolveCodeLens) {
                    resolve.push(Promise.resolve(item.provider.resolveCodeLens(model, item.symbol, cancellation_1.CancellationToken.None)).then(symbol => result.push(symbol || item.symbol)));
                }
            }
            return Promise.all(resolve);
        }).then(() => {
            return result;
        });
    });
});
//# sourceMappingURL=codelens.js.map