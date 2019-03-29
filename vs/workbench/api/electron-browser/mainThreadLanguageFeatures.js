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
define(["require", "exports", "vs/base/common/event", "vs/editor/common/modes", "vs/workbench/contrib/search/common/search", "../node/extHost.protocol", "vs/editor/common/modes/languageConfigurationRegistry", "./mainThreadHeapService", "vs/editor/common/services/modeService", "vs/workbench/api/electron-browser/extHostCustomers", "vs/workbench/api/node/extHostTypeConverters", "vs/base/common/uri", "vs/workbench/contrib/codeinset/common/codeInset"], function (require, exports, event_1, modes, search, extHost_protocol_1, languageConfigurationRegistry_1, mainThreadHeapService_1, modeService_1, extHostCustomers_1, typeConverters, uri_1, codeInset) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MainThreadLanguageFeatures_1;
    "use strict";
    let MainThreadLanguageFeatures = MainThreadLanguageFeatures_1 = class MainThreadLanguageFeatures {
        constructor(extHostContext, heapService, modeService) {
            this._registrations = Object.create(null);
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostLanguageFeatures);
            this._heapService = heapService;
            this._modeService = modeService;
        }
        dispose() {
            for (const key in this._registrations) {
                this._registrations[key].dispose();
            }
        }
        $unregister(handle) {
            const registration = this._registrations[handle];
            if (registration) {
                registration.dispose();
                delete this._registrations[handle];
            }
        }
        static _reviveLocationDto(data) {
            if (!data) {
                return data;
            }
            else if (Array.isArray(data)) {
                data.forEach(l => MainThreadLanguageFeatures_1._reviveLocationDto(l));
                return data;
            }
            else {
                data.uri = uri_1.URI.revive(data.uri);
                return data;
            }
        }
        static _reviveLocationLinkDto(data) {
            if (!data) {
                return data;
            }
            else if (Array.isArray(data)) {
                data.forEach(l => MainThreadLanguageFeatures_1._reviveLocationLinkDto(l));
                return data;
            }
            else {
                data.uri = uri_1.URI.revive(data.uri);
                return data;
            }
        }
        static _reviveWorkspaceSymbolDto(data) {
            if (!data) {
                return data;
            }
            else if (Array.isArray(data)) {
                data.forEach(MainThreadLanguageFeatures_1._reviveWorkspaceSymbolDto);
                return data;
            }
            else {
                data.location = MainThreadLanguageFeatures_1._reviveLocationDto(data.location);
                return data;
            }
        }
        static _reviveCodeActionDto(data) {
            if (data) {
                data.forEach(code => extHost_protocol_1.reviveWorkspaceEditDto(code.edit));
            }
            return data;
        }
        static _reviveLinkDTO(data) {
            if (data.url && typeof data.url !== 'string') {
                data.url = uri_1.URI.revive(data.url);
            }
            return data;
        }
        //#endregion
        // --- outline
        $registerDocumentSymbolProvider(handle, selector, displayName) {
            this._registrations[handle] = modes.DocumentSymbolProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                displayName,
                provideDocumentSymbols: (model, token) => {
                    return this._proxy.$provideDocumentSymbols(handle, model.uri, token);
                }
            });
        }
        // --- code lens
        $registerCodeLensSupport(handle, selector, eventHandle) {
            const provider = {
                provideCodeLenses: (model, token) => {
                    return this._proxy.$provideCodeLenses(handle, model.uri, token).then(dto => {
                        if (dto) {
                            dto.forEach(obj => {
                                this._heapService.trackObject(obj);
                                this._heapService.trackObject(obj.command);
                            });
                        }
                        return dto;
                    });
                },
                resolveCodeLens: (model, codeLens, token) => {
                    return this._proxy.$resolveCodeLens(handle, model.uri, codeLens, token).then(obj => {
                        if (obj) {
                            this._heapService.trackObject(obj);
                            this._heapService.trackObject(obj.command);
                        }
                        return obj;
                    });
                }
            };
            if (typeof eventHandle === 'number') {
                const emitter = new event_1.Emitter();
                this._registrations[eventHandle] = emitter;
                provider.onDidChange = emitter.event;
            }
            this._registrations[handle] = modes.CodeLensProviderRegistry.register(typeConverters.LanguageSelector.from(selector), provider);
        }
        $emitCodeLensEvent(eventHandle, event) {
            const obj = this._registrations[eventHandle];
            if (obj instanceof event_1.Emitter) {
                obj.fire(event);
            }
        }
        // -- code inset
        $registerCodeInsetSupport(handle, selector, eventHandle) {
            const provider = {
                provideCodeInsets: (model, token) => {
                    return this._proxy.$provideCodeInsets(handle, model.uri, token).then(dto => {
                        if (dto) {
                            dto.forEach(obj => this._heapService.trackObject(obj));
                        }
                        return dto;
                    });
                },
                resolveCodeInset: (model, codeInset, token) => {
                    return this._proxy.$resolveCodeInset(handle, model.uri, codeInset, token).then(obj => {
                        this._heapService.trackObject(obj);
                        return obj;
                    });
                }
            };
            if (typeof eventHandle === 'number') {
                const emitter = new event_1.Emitter();
                this._registrations[eventHandle] = emitter;
                provider.onDidChange = emitter.event;
            }
            const langSelector = typeConverters.LanguageSelector.from(selector);
            this._registrations[handle] = codeInset.CodeInsetProviderRegistry.register(langSelector, provider);
        }
        // --- declaration
        $registerDefinitionSupport(handle, selector) {
            this._registrations[handle] = modes.DefinitionProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                provideDefinition: (model, position, token) => {
                    return this._proxy.$provideDefinition(handle, model.uri, position, token).then(MainThreadLanguageFeatures_1._reviveLocationLinkDto);
                }
            });
        }
        $registerDeclarationSupport(handle, selector) {
            this._registrations[handle] = modes.DeclarationProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                provideDeclaration: (model, position, token) => {
                    return this._proxy.$provideDeclaration(handle, model.uri, position, token).then(MainThreadLanguageFeatures_1._reviveLocationLinkDto);
                }
            });
        }
        $registerImplementationSupport(handle, selector) {
            this._registrations[handle] = modes.ImplementationProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                provideImplementation: (model, position, token) => {
                    return this._proxy.$provideImplementation(handle, model.uri, position, token).then(MainThreadLanguageFeatures_1._reviveLocationLinkDto);
                }
            });
        }
        $registerTypeDefinitionSupport(handle, selector) {
            this._registrations[handle] = modes.TypeDefinitionProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                provideTypeDefinition: (model, position, token) => {
                    return this._proxy.$provideTypeDefinition(handle, model.uri, position, token).then(MainThreadLanguageFeatures_1._reviveLocationLinkDto);
                }
            });
        }
        // --- extra info
        $registerHoverProvider(handle, selector) {
            this._registrations[handle] = modes.HoverProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                provideHover: (model, position, token) => {
                    return this._proxy.$provideHover(handle, model.uri, position, token);
                }
            });
        }
        // --- occurrences
        $registerDocumentHighlightProvider(handle, selector) {
            this._registrations[handle] = modes.DocumentHighlightProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                provideDocumentHighlights: (model, position, token) => {
                    return this._proxy.$provideDocumentHighlights(handle, model.uri, position, token);
                }
            });
        }
        // --- references
        $registerReferenceSupport(handle, selector) {
            this._registrations[handle] = modes.ReferenceProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                provideReferences: (model, position, context, token) => {
                    return this._proxy.$provideReferences(handle, model.uri, position, context, token).then(MainThreadLanguageFeatures_1._reviveLocationDto);
                }
            });
        }
        // --- quick fix
        $registerQuickFixSupport(handle, selector, providedCodeActionKinds) {
            this._registrations[handle] = modes.CodeActionProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                provideCodeActions: (model, rangeOrSelection, context, token) => {
                    return this._proxy.$provideCodeActions(handle, model.uri, rangeOrSelection, context, token).then(dto => {
                        if (dto) {
                            dto.forEach(obj => { this._heapService.trackObject(obj.command); });
                        }
                        return MainThreadLanguageFeatures_1._reviveCodeActionDto(dto);
                    });
                },
                providedCodeActionKinds
            });
        }
        // --- formatting
        $registerDocumentFormattingSupport(handle, selector, extensionId) {
            this._registrations[handle] = modes.DocumentFormattingEditProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                extensionId,
                provideDocumentFormattingEdits: (model, options, token) => {
                    return this._proxy.$provideDocumentFormattingEdits(handle, model.uri, options, token);
                }
            });
        }
        $registerRangeFormattingSupport(handle, selector, extensionId) {
            this._registrations[handle] = modes.DocumentRangeFormattingEditProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                extensionId,
                provideDocumentRangeFormattingEdits: (model, range, options, token) => {
                    return this._proxy.$provideDocumentRangeFormattingEdits(handle, model.uri, range, options, token);
                }
            });
        }
        $registerOnTypeFormattingSupport(handle, selector, autoFormatTriggerCharacters, extensionId) {
            this._registrations[handle] = modes.OnTypeFormattingEditProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                extensionId,
                autoFormatTriggerCharacters,
                provideOnTypeFormattingEdits: (model, position, ch, options, token) => {
                    return this._proxy.$provideOnTypeFormattingEdits(handle, model.uri, position, ch, options, token);
                }
            });
        }
        // --- navigate type
        $registerNavigateTypeSupport(handle) {
            let lastResultId;
            this._registrations[handle] = search.WorkspaceSymbolProviderRegistry.register({
                provideWorkspaceSymbols: (search, token) => {
                    return this._proxy.$provideWorkspaceSymbols(handle, search, token).then(result => {
                        if (lastResultId !== undefined) {
                            this._proxy.$releaseWorkspaceSymbols(handle, lastResultId);
                        }
                        lastResultId = result._id;
                        return MainThreadLanguageFeatures_1._reviveWorkspaceSymbolDto(result.symbols);
                    });
                },
                resolveWorkspaceSymbol: (item, token) => {
                    return this._proxy.$resolveWorkspaceSymbol(handle, item, token).then(i => {
                        if (i) {
                            return MainThreadLanguageFeatures_1._reviveWorkspaceSymbolDto(i);
                        }
                        return undefined;
                    });
                }
            });
        }
        // --- rename
        $registerRenameSupport(handle, selector, supportResolveLocation) {
            this._registrations[handle] = modes.RenameProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                provideRenameEdits: (model, position, newName, token) => {
                    return this._proxy.$provideRenameEdits(handle, model.uri, position, newName, token).then(extHost_protocol_1.reviveWorkspaceEditDto);
                },
                resolveRenameLocation: supportResolveLocation
                    ? (model, position, token) => this._proxy.$resolveRenameLocation(handle, model.uri, position, token)
                    : undefined
            });
        }
        // --- suggest
        $registerSuggestSupport(handle, selector, triggerCharacters, supportsResolveDetails) {
            this._registrations[handle] = modes.CompletionProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                triggerCharacters,
                provideCompletionItems: (model, position, context, token) => {
                    return this._proxy.$provideCompletionItems(handle, model.uri, position, context, token).then(result => {
                        if (!result) {
                            return result;
                        }
                        return {
                            suggestions: result.suggestions,
                            incomplete: result.incomplete,
                            dispose: () => {
                                if (typeof result._id === 'number') {
                                    this._proxy.$releaseCompletionItems(handle, result._id);
                                }
                            }
                        };
                    });
                },
                resolveCompletionItem: supportsResolveDetails
                    ? (model, position, suggestion, token) => this._proxy.$resolveCompletionItem(handle, model.uri, position, suggestion, token)
                    : undefined
            });
        }
        // --- parameter hints
        $registerSignatureHelpProvider(handle, selector, metadata) {
            this._registrations[handle] = modes.SignatureHelpProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                signatureHelpTriggerCharacters: metadata.triggerCharacters,
                signatureHelpRetriggerCharacters: metadata.retriggerCharacters,
                provideSignatureHelp: (model, position, token, context) => {
                    return this._proxy.$provideSignatureHelp(handle, model.uri, position, context, token);
                }
            });
        }
        // --- links
        $registerDocumentLinkProvider(handle, selector) {
            this._registrations[handle] = modes.LinkProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                provideLinks: (model, token) => {
                    return this._proxy.$provideDocumentLinks(handle, model.uri, token).then(dto => {
                        if (dto) {
                            dto.forEach(obj => {
                                MainThreadLanguageFeatures_1._reviveLinkDTO(obj);
                                this._heapService.trackObject(obj);
                            });
                        }
                        return dto;
                    });
                },
                resolveLink: (link, token) => {
                    return this._proxy.$resolveDocumentLink(handle, link, token).then(obj => {
                        if (obj) {
                            MainThreadLanguageFeatures_1._reviveLinkDTO(obj);
                            this._heapService.trackObject(obj);
                        }
                        return obj;
                    });
                }
            });
        }
        // --- colors
        $registerDocumentColorProvider(handle, selector) {
            const proxy = this._proxy;
            this._registrations[handle] = modes.ColorProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                provideDocumentColors: (model, token) => {
                    return proxy.$provideDocumentColors(handle, model.uri, token)
                        .then(documentColors => {
                        return documentColors.map(documentColor => {
                            const [red, green, blue, alpha] = documentColor.color;
                            const color = {
                                red: red,
                                green: green,
                                blue: blue,
                                alpha
                            };
                            return {
                                color,
                                range: documentColor.range
                            };
                        });
                    });
                },
                provideColorPresentations: (model, colorInfo, token) => {
                    return proxy.$provideColorPresentations(handle, model.uri, {
                        color: [colorInfo.color.red, colorInfo.color.green, colorInfo.color.blue, colorInfo.color.alpha],
                        range: colorInfo.range
                    }, token);
                }
            });
        }
        // --- folding
        $registerFoldingRangeProvider(handle, selector) {
            const proxy = this._proxy;
            this._registrations[handle] = modes.FoldingRangeProviderRegistry.register(typeConverters.LanguageSelector.from(selector), {
                provideFoldingRanges: (model, context, token) => {
                    return proxy.$provideFoldingRanges(handle, model.uri, context, token);
                }
            });
        }
        // -- smart select
        $registerSelectionRangeProvider(handle, selector) {
            this._registrations[handle] = modes.SelectionRangeRegistry.register(typeConverters.LanguageSelector.from(selector), {
                provideSelectionRanges: (model, positions, token) => {
                    return this._proxy.$provideSelectionRanges(handle, model.uri, positions, token);
                }
            });
        }
        // --- configuration
        static _reviveRegExp(regExp) {
            return new RegExp(regExp.pattern, regExp.flags);
        }
        static _reviveIndentationRule(indentationRule) {
            return {
                decreaseIndentPattern: MainThreadLanguageFeatures_1._reviveRegExp(indentationRule.decreaseIndentPattern),
                increaseIndentPattern: MainThreadLanguageFeatures_1._reviveRegExp(indentationRule.increaseIndentPattern),
                indentNextLinePattern: indentationRule.indentNextLinePattern ? MainThreadLanguageFeatures_1._reviveRegExp(indentationRule.indentNextLinePattern) : undefined,
                unIndentedLinePattern: indentationRule.unIndentedLinePattern ? MainThreadLanguageFeatures_1._reviveRegExp(indentationRule.unIndentedLinePattern) : undefined,
            };
        }
        static _reviveOnEnterRule(onEnterRule) {
            return {
                beforeText: MainThreadLanguageFeatures_1._reviveRegExp(onEnterRule.beforeText),
                afterText: onEnterRule.afterText ? MainThreadLanguageFeatures_1._reviveRegExp(onEnterRule.afterText) : undefined,
                oneLineAboveText: onEnterRule.oneLineAboveText ? MainThreadLanguageFeatures_1._reviveRegExp(onEnterRule.oneLineAboveText) : undefined,
                action: onEnterRule.action
            };
        }
        static _reviveOnEnterRules(onEnterRules) {
            return onEnterRules.map(MainThreadLanguageFeatures_1._reviveOnEnterRule);
        }
        $setLanguageConfiguration(handle, languageId, _configuration) {
            const configuration = {
                comments: _configuration.comments,
                brackets: _configuration.brackets,
                wordPattern: _configuration.wordPattern ? MainThreadLanguageFeatures_1._reviveRegExp(_configuration.wordPattern) : undefined,
                indentationRules: _configuration.indentationRules ? MainThreadLanguageFeatures_1._reviveIndentationRule(_configuration.indentationRules) : undefined,
                onEnterRules: _configuration.onEnterRules ? MainThreadLanguageFeatures_1._reviveOnEnterRules(_configuration.onEnterRules) : undefined,
                autoClosingPairs: undefined,
                surroundingPairs: undefined,
                __electricCharacterSupport: undefined
            };
            if (_configuration.__characterPairSupport) {
                // backwards compatibility
                configuration.autoClosingPairs = _configuration.__characterPairSupport.autoClosingPairs;
            }
            if (_configuration.__electricCharacterSupport && _configuration.__electricCharacterSupport.docComment) {
                configuration.__electricCharacterSupport = {
                    docComment: {
                        open: _configuration.__electricCharacterSupport.docComment.open,
                        close: _configuration.__electricCharacterSupport.docComment.close
                    }
                };
            }
            const languageIdentifier = this._modeService.getLanguageIdentifier(languageId);
            if (languageIdentifier) {
                this._registrations[handle] = languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(languageIdentifier, configuration);
            }
        }
    };
    MainThreadLanguageFeatures = MainThreadLanguageFeatures_1 = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadLanguageFeatures),
        __param(1, mainThreadHeapService_1.IHeapService),
        __param(2, modeService_1.IModeService)
    ], MainThreadLanguageFeatures);
    exports.MainThreadLanguageFeatures = MainThreadLanguageFeatures;
});
//# sourceMappingURL=mainThreadLanguageFeatures.js.map