/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/arrays", "vs/editor/common/modes/languageFeatureRegistry"], function (require, exports, errors_1, arrays_1, languageFeatureRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeInsetProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    function getCodeInsetData(model, token) {
        const symbols = [];
        const providers = exports.CodeInsetProviderRegistry.ordered(model);
        const promises = providers.map(provider => Promise.resolve(provider.provideCodeInsets(model, token)).then(result => {
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
                else if (providers.indexOf(a.provider) < providers.indexOf(b.provider)) {
                    return -1;
                }
                else if (providers.indexOf(a.provider) > providers.indexOf(b.provider)) {
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
    exports.getCodeInsetData = getCodeInsetData;
});
//# sourceMappingURL=codeInset.js.map