/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/editor/browser/editorExtensions", "vs/editor/common/modes", "vs/platform/contextkey/common/contextkey", "vs/base/common/cancellation"], function (require, exports, async_1, errors_1, editorExtensions_1, modes, contextkey_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Context = {
        Visible: new contextkey_1.RawContextKey('parameterHintsVisible', false),
        MultipleSignatures: new contextkey_1.RawContextKey('parameterHintsMultipleSignatures', false),
    };
    function provideSignatureHelp(model, position, context, token) {
        const supports = modes.SignatureHelpProviderRegistry.ordered(model);
        return async_1.first(supports.map(support => () => {
            return Promise.resolve(support.provideSignatureHelp(model, position, token, context)).catch(errors_1.onUnexpectedExternalError);
        }));
    }
    exports.provideSignatureHelp = provideSignatureHelp;
    editorExtensions_1.registerDefaultLanguageCommand('_executeSignatureHelpProvider', (model, position, args) => provideSignatureHelp(model, position, {
        triggerKind: modes.SignatureHelpTriggerKind.Invoke,
        isRetrigger: false,
        triggerCharacter: args['triggerCharacter']
    }, cancellation_1.CancellationToken.None));
});
//# sourceMappingURL=provideSignatureHelp.js.map