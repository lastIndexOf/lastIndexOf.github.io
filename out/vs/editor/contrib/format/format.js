/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/base/common/errors", "vs/base/common/uri", "vs/base/common/arrays", "vs/editor/common/core/range", "vs/editor/browser/editorExtensions", "vs/editor/common/modes", "vs/editor/common/services/modelService", "vs/base/common/async", "vs/editor/common/core/position", "vs/base/common/cancellation", "vs/editor/common/services/editorWorkerService", "vs/platform/telemetry/common/telemetry", "vs/platform/extensions/common/extensions"], function (require, exports, errors_1, uri_1, arrays_1, range_1, editorExtensions_1, modes_1, modelService_1, async_1, position_1, cancellation_1, editorWorkerService_1, telemetry_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var FormatMode;
    (function (FormatMode) {
        FormatMode[FormatMode["Auto"] = 1] = "Auto";
        FormatMode[FormatMode["Manual"] = 2] = "Manual";
    })(FormatMode = exports.FormatMode || (exports.FormatMode = {}));
    var FormatKind;
    (function (FormatKind) {
        FormatKind[FormatKind["Document"] = 8] = "Document";
        FormatKind[FormatKind["Range"] = 16] = "Range";
        FormatKind[FormatKind["OnType"] = 32] = "OnType";
    })(FormatKind = exports.FormatKind || (exports.FormatKind = {}));
    let _conflictResolver;
    function setFormatterConflictCallback(callback) {
        let oldCallback = _conflictResolver;
        _conflictResolver = callback;
        return {
            dispose() {
                if (oldCallback) {
                    _conflictResolver = oldCallback;
                    oldCallback = undefined;
                }
            }
        };
    }
    exports.setFormatterConflictCallback = setFormatterConflictCallback;
    function invokeFormatterCallback(formatter, model, mode) {
        if (_conflictResolver) {
            const ids = formatter.map(formatter => formatter.extensionId);
            _conflictResolver(ids, model, mode);
        }
    }
    function getDocumentRangeFormattingEdits(telemetryService, workerService, model, range, options, mode, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const providers = modes_1.DocumentRangeFormattingEditProviderRegistry.ordered(model);
            /* __GDPR__
                "formatterInfo" : {
                    "type" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "language" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "extensions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
             */
            telemetryService.publicLog('formatterInfo', {
                type: 'range',
                language: model.getLanguageIdentifier().language,
                count: providers.length,
                extensions: providers.map(p => p.extensionId ? extensions_1.ExtensionIdentifier.toKey(p.extensionId) : 'unknown')
            });
            invokeFormatterCallback(providers, model, mode | 16 /* Range */);
            return async_1.first(providers.map(provider => () => {
                return Promise.resolve(provider.provideDocumentRangeFormattingEdits(model, range, options, token)).catch(errors_1.onUnexpectedExternalError);
            }), arrays_1.isNonEmptyArray).then(edits => {
                // break edits into smaller edits
                return workerService.computeMoreMinimalEdits(model.uri, edits);
            });
        });
    }
    exports.getDocumentRangeFormattingEdits = getDocumentRangeFormattingEdits;
    function getDocumentFormattingEdits(telemetryService, workerService, model, options, mode, token) {
        const docFormattingProviders = modes_1.DocumentFormattingEditProviderRegistry.ordered(model);
        /* __GDPR__
            "formatterInfo" : {
                "type" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "language" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "extensions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            }
         */
        telemetryService.publicLog('formatterInfo', {
            type: 'document',
            language: model.getLanguageIdentifier().language,
            count: docFormattingProviders.length,
            extensions: docFormattingProviders.map(p => p.extensionId ? extensions_1.ExtensionIdentifier.toKey(p.extensionId) : 'unknown')
        });
        if (docFormattingProviders.length > 0) {
            return async_1.first(docFormattingProviders.map(provider => () => {
                // first with result wins...
                return Promise.resolve(provider.provideDocumentFormattingEdits(model, options, token)).catch(errors_1.onUnexpectedExternalError);
            }), arrays_1.isNonEmptyArray).then(edits => {
                // break edits into smaller edits
                return workerService.computeMoreMinimalEdits(model.uri, edits);
            });
        }
        else {
            // try range formatters when no document formatter is registered
            return getDocumentRangeFormattingEdits(telemetryService, workerService, model, model.getFullModelRange(), options, mode | 8 /* Document */, token);
        }
    }
    exports.getDocumentFormattingEdits = getDocumentFormattingEdits;
    function getOnTypeFormattingEdits(telemetryService, workerService, model, position, ch, options) {
        const providers = modes_1.OnTypeFormattingEditProviderRegistry.ordered(model);
        /* __GDPR__
            "formatterInfo" : {
                "type" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "language" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "extensions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            }
         */
        telemetryService.publicLog('formatterInfo', {
            type: 'ontype',
            language: model.getLanguageIdentifier().language,
            count: providers.length,
            extensions: providers.map(p => p.extensionId ? extensions_1.ExtensionIdentifier.toKey(p.extensionId) : 'unknown')
        });
        if (providers.length === 0) {
            return Promise.resolve(undefined);
        }
        if (providers[0].autoFormatTriggerCharacters.indexOf(ch) < 0) {
            return Promise.resolve(undefined);
        }
        return Promise.resolve(providers[0].provideOnTypeFormattingEdits(model, position, ch, options, cancellation_1.CancellationToken.None)).catch(errors_1.onUnexpectedExternalError).then(edits => {
            return workerService.computeMoreMinimalEdits(model.uri, edits);
        });
    }
    exports.getOnTypeFormattingEdits = getOnTypeFormattingEdits;
    editorExtensions_1.registerLanguageCommand('_executeFormatRangeProvider', function (accessor, args) {
        const { resource, range, options } = args;
        if (!(resource instanceof uri_1.URI) || !range_1.Range.isIRange(range)) {
            throw errors_1.illegalArgument();
        }
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (!model) {
            throw errors_1.illegalArgument('resource');
        }
        return getDocumentRangeFormattingEdits(accessor.get(telemetry_1.ITelemetryService), accessor.get(editorWorkerService_1.IEditorWorkerService), model, range_1.Range.lift(range), options, 1 /* Auto */, cancellation_1.CancellationToken.None);
    });
    editorExtensions_1.registerLanguageCommand('_executeFormatDocumentProvider', function (accessor, args) {
        const { resource, options } = args;
        if (!(resource instanceof uri_1.URI)) {
            throw errors_1.illegalArgument('resource');
        }
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (!model) {
            throw errors_1.illegalArgument('resource');
        }
        return getDocumentFormattingEdits(accessor.get(telemetry_1.ITelemetryService), accessor.get(editorWorkerService_1.IEditorWorkerService), model, options, 1 /* Auto */, cancellation_1.CancellationToken.None);
    });
    editorExtensions_1.registerLanguageCommand('_executeFormatOnTypeProvider', function (accessor, args) {
        const { resource, position, ch, options } = args;
        if (!(resource instanceof uri_1.URI) || !position_1.Position.isIPosition(position) || typeof ch !== 'string') {
            throw errors_1.illegalArgument();
        }
        const model = accessor.get(modelService_1.IModelService).getModel(resource);
        if (!model) {
            throw errors_1.illegalArgument('resource');
        }
        return getOnTypeFormattingEdits(accessor.get(telemetry_1.ITelemetryService), accessor.get(editorWorkerService_1.IEditorWorkerService), model, position_1.Position.lift(position), ch, options);
    });
});
//# sourceMappingURL=format.js.map