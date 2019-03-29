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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/resources", "vs/base/common/types", "vs/editor/common/core/token", "vs/editor/common/modes", "vs/editor/common/modes/nullMode", "vs/editor/common/modes/supports/tokenization", "vs/editor/common/services/modeService", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/workbench/services/textMate/common/TMGrammars", "vs/workbench/services/textMate/common/textMateService", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions"], function (require, exports, nls, dom, color_1, errors_1, event_1, resources, types, token_1, modes_1, nullMode_1, tokenization_1, modeService_1, files_1, log_1, notification_1, TMGrammars_1, textMateService_1, workbenchThemeService_1, lifecycle_1, configuration_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TMScopeRegistry {
        constructor() {
            this._onDidEncounterLanguage = new event_1.Emitter();
            this.onDidEncounterLanguage = this._onDidEncounterLanguage.event;
            this.reset();
        }
        reset() {
            this._scopeNameToLanguageRegistration = Object.create(null);
            this._encounteredLanguages = [];
        }
        register(scopeName, grammarLocation, embeddedLanguages, tokenTypes) {
            if (this._scopeNameToLanguageRegistration[scopeName]) {
                const existingRegistration = this._scopeNameToLanguageRegistration[scopeName];
                if (!resources.isEqual(existingRegistration.grammarLocation, grammarLocation)) {
                    console.warn(`Overwriting grammar scope name to file mapping for scope ${scopeName}.\n` +
                        `Old grammar file: ${existingRegistration.grammarLocation.toString()}.\n` +
                        `New grammar file: ${grammarLocation.toString()}`);
                }
            }
            this._scopeNameToLanguageRegistration[scopeName] = new TMLanguageRegistration(scopeName, grammarLocation, embeddedLanguages, tokenTypes);
        }
        getLanguageRegistration(scopeName) {
            return this._scopeNameToLanguageRegistration[scopeName] || null;
        }
        getGrammarLocation(scopeName) {
            let data = this.getLanguageRegistration(scopeName);
            return data ? data.grammarLocation : null;
        }
        /**
         * To be called when tokenization found/hit an embedded language.
         */
        onEncounteredLanguage(languageId) {
            if (!this._encounteredLanguages[languageId]) {
                this._encounteredLanguages[languageId] = true;
                this._onDidEncounterLanguage.fire(languageId);
            }
        }
    }
    exports.TMScopeRegistry = TMScopeRegistry;
    class TMLanguageRegistration {
        constructor(scopeName, grammarLocation, embeddedLanguages, tokenTypes) {
            this.scopeName = scopeName;
            this.grammarLocation = grammarLocation;
            // embeddedLanguages handling
            this.embeddedLanguages = Object.create(null);
            if (embeddedLanguages) {
                // If embeddedLanguages are configured, fill in `this._embeddedLanguages`
                let scopes = Object.keys(embeddedLanguages);
                for (let i = 0, len = scopes.length; i < len; i++) {
                    let scope = scopes[i];
                    let language = embeddedLanguages[scope];
                    if (typeof language !== 'string') {
                        // never hurts to be too careful
                        continue;
                    }
                    this.embeddedLanguages[scope] = language;
                }
            }
            this.tokenTypes = Object.create(null);
            if (tokenTypes) {
                // If tokenTypes is configured, fill in `this._tokenTypes`
                const scopes = Object.keys(tokenTypes);
                for (const scope of scopes) {
                    const tokenType = tokenTypes[scope];
                    switch (tokenType) {
                        case 'string':
                            this.tokenTypes[scope] = 2 /* String */;
                            break;
                        case 'other':
                            this.tokenTypes[scope] = 0 /* Other */;
                            break;
                        case 'comment':
                            this.tokenTypes[scope] = 1 /* Comment */;
                            break;
                    }
                }
            }
        }
    }
    exports.TMLanguageRegistration = TMLanguageRegistration;
    let TextMateService = class TextMateService extends lifecycle_1.Disposable {
        constructor(_modeService, _themeService, _fileService, _notificationService, _logService, _configurationService) {
            super();
            this._modeService = _modeService;
            this._themeService = _themeService;
            this._fileService = _fileService;
            this._notificationService = _notificationService;
            this._logService = _logService;
            this._configurationService = _configurationService;
            this._onDidEncounterLanguage = this._register(new event_1.Emitter());
            this.onDidEncounterLanguage = this._onDidEncounterLanguage.event;
            this._styleElement = dom.createStyleSheet();
            this._styleElement.className = 'vscode-tokens-styles';
            this._createdModes = [];
            this._scopeRegistry = new TMScopeRegistry();
            this._scopeRegistry.onDidEncounterLanguage((language) => this._onDidEncounterLanguage.fire(language));
            this._injections = {};
            this._injectedEmbeddedLanguages = {};
            this._languageToScope = new Map();
            this._grammarRegistry = null;
            this._tokenizersRegistrations = [];
            this._currentTokenColors = null;
            this._themeListener = null;
            TMGrammars_1.grammarsExtPoint.setHandler((extensions) => {
                this._scopeRegistry.reset();
                this._injections = {};
                this._injectedEmbeddedLanguages = {};
                this._languageToScope = new Map();
                this._grammarRegistry = null;
                this._tokenizersRegistrations = lifecycle_1.dispose(this._tokenizersRegistrations);
                this._currentTokenColors = null;
                if (this._themeListener) {
                    this._themeListener.dispose();
                    this._themeListener = null;
                }
                for (const extension of extensions) {
                    let grammars = extension.value;
                    for (const grammar of grammars) {
                        this._handleGrammarExtensionPointUser(extension.description.extensionLocation, grammar, extension.collector);
                    }
                }
                for (const createMode of this._createdModes) {
                    this._registerDefinitionIfAvailable(createMode);
                }
            });
            // Generate some color map until the grammar registry is loaded
            let colorTheme = this._themeService.getColorTheme();
            let defaultForeground = color_1.Color.transparent;
            let defaultBackground = color_1.Color.transparent;
            for (let i = 0, len = colorTheme.tokenColors.length; i < len; i++) {
                let rule = colorTheme.tokenColors[i];
                if (!rule.scope && rule.settings) {
                    if (rule.settings.foreground) {
                        defaultForeground = color_1.Color.fromHex(rule.settings.foreground);
                    }
                    if (rule.settings.background) {
                        defaultBackground = color_1.Color.fromHex(rule.settings.background);
                    }
                }
            }
            modes_1.TokenizationRegistry.setColorMap([null, defaultForeground, defaultBackground]);
            this._modeService.onDidCreateMode((mode) => {
                let modeId = mode.getId();
                this._createdModes.push(modeId);
                this._registerDefinitionIfAvailable(modeId);
            });
        }
        _registerDefinitionIfAvailable(modeId) {
            if (this._languageToScope.has(modeId)) {
                const promise = this._createGrammar(modeId).then((r) => {
                    return new TMTokenization(this._scopeRegistry, r.languageId, r.grammar, r.initialState, r.containsEmbeddedLanguages, this._notificationService, this._configurationService);
                }, e => {
                    errors_1.onUnexpectedError(e);
                    return null;
                });
                this._tokenizersRegistrations.push(modes_1.TokenizationRegistry.registerPromise(modeId, promise));
            }
        }
        _createGrammarRegistry() {
            return __awaiter(this, void 0, void 0, function* () {
                const { Registry, INITIAL, parseRawGrammar } = yield new Promise((resolve_1, reject_1) => { require(['vscode-textmate'], resolve_1, reject_1); });
                const grammarRegistry = new Registry({
                    loadGrammar: (scopeName) => __awaiter(this, void 0, void 0, function* () {
                        const location = this._scopeRegistry.getGrammarLocation(scopeName);
                        if (!location) {
                            this._logService.trace(`No grammar found for scope ${scopeName}`);
                            return null;
                        }
                        try {
                            const content = yield this._fileService.resolveContent(location, { encoding: 'utf8' });
                            return parseRawGrammar(content.value, location.path);
                        }
                        catch (e) {
                            this._logService.error(`Unable to load and parse grammar for scope ${scopeName} from ${location}`, e);
                            return null;
                        }
                    }),
                    getInjections: (scopeName) => {
                        const scopeParts = scopeName.split('.');
                        let injections = [];
                        for (let i = 1; i <= scopeParts.length; i++) {
                            const subScopeName = scopeParts.slice(0, i).join('.');
                            injections = [...injections, ...(this._injections[subScopeName] || [])];
                        }
                        return injections;
                    }
                });
                this._updateTheme(grammarRegistry);
                this._themeListener = this._themeService.onDidColorThemeChange((e) => this._updateTheme(grammarRegistry));
                return [grammarRegistry, INITIAL];
            });
        }
        _getOrCreateGrammarRegistry() {
            if (!this._grammarRegistry) {
                this._grammarRegistry = this._createGrammarRegistry();
            }
            return this._grammarRegistry;
        }
        static _toColorMap(colorMap) {
            let result = [null];
            for (let i = 1, len = colorMap.length; i < len; i++) {
                result[i] = color_1.Color.fromHex(colorMap[i]);
            }
            return result;
        }
        _updateTheme(grammarRegistry) {
            let colorTheme = this._themeService.getColorTheme();
            if (!this.compareTokenRules(colorTheme.tokenColors)) {
                return;
            }
            grammarRegistry.setTheme({ name: colorTheme.label, settings: colorTheme.tokenColors });
            let colorMap = TextMateService._toColorMap(grammarRegistry.getColorMap());
            let cssRules = tokenization_1.generateTokensCSSForColorMap(colorMap);
            this._styleElement.innerHTML = cssRules;
            modes_1.TokenizationRegistry.setColorMap(colorMap);
        }
        compareTokenRules(newRules) {
            let currRules = this._currentTokenColors;
            this._currentTokenColors = newRules;
            if (!newRules || !currRules || newRules.length !== currRules.length) {
                return true;
            }
            for (let i = newRules.length - 1; i >= 0; i--) {
                let r1 = newRules[i];
                let r2 = currRules[i];
                if (r1.scope !== r2.scope) {
                    return true;
                }
                let s1 = r1.settings;
                let s2 = r2.settings;
                if (s1 && s2) {
                    if (s1.fontStyle !== s2.fontStyle || s1.foreground !== s2.foreground || s1.background !== s2.background) {
                        return true;
                    }
                }
                else if (!s1 || !s2) {
                    return true;
                }
            }
            return false;
        }
        _handleGrammarExtensionPointUser(extensionLocation, syntax, collector) {
            if (syntax.language && ((typeof syntax.language !== 'string') || !this._modeService.isRegisteredMode(syntax.language))) {
                collector.error(nls.localize('invalid.language', "Unknown language in `contributes.{0}.language`. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, String(syntax.language)));
                return;
            }
            if (!syntax.scopeName || (typeof syntax.scopeName !== 'string')) {
                collector.error(nls.localize('invalid.scopeName', "Expected string in `contributes.{0}.scopeName`. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, String(syntax.scopeName)));
                return;
            }
            if (!syntax.path || (typeof syntax.path !== 'string')) {
                collector.error(nls.localize('invalid.path.0', "Expected string in `contributes.{0}.path`. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, String(syntax.path)));
                return;
            }
            if (syntax.injectTo && (!Array.isArray(syntax.injectTo) || syntax.injectTo.some(scope => typeof scope !== 'string'))) {
                collector.error(nls.localize('invalid.injectTo', "Invalid value in `contributes.{0}.injectTo`. Must be an array of language scope names. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, JSON.stringify(syntax.injectTo)));
                return;
            }
            if (syntax.embeddedLanguages && !types.isObject(syntax.embeddedLanguages)) {
                collector.error(nls.localize('invalid.embeddedLanguages', "Invalid value in `contributes.{0}.embeddedLanguages`. Must be an object map from scope name to language. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, JSON.stringify(syntax.embeddedLanguages)));
                return;
            }
            if (syntax.tokenTypes && !types.isObject(syntax.tokenTypes)) {
                collector.error(nls.localize('invalid.tokenTypes', "Invalid value in `contributes.{0}.tokenTypes`. Must be an object map from scope name to token type. Provided value: {1}", TMGrammars_1.grammarsExtPoint.name, JSON.stringify(syntax.tokenTypes)));
                return;
            }
            const grammarLocation = resources.joinPath(extensionLocation, syntax.path);
            if (!resources.isEqualOrParent(grammarLocation, extensionLocation)) {
                collector.warn(nls.localize('invalid.path.1', "Expected `contributes.{0}.path` ({1}) to be included inside extension's folder ({2}). This might make the extension non-portable.", TMGrammars_1.grammarsExtPoint.name, grammarLocation.path, extensionLocation.path));
            }
            this._scopeRegistry.register(syntax.scopeName, grammarLocation, syntax.embeddedLanguages, syntax.tokenTypes);
            if (syntax.injectTo) {
                for (let injectScope of syntax.injectTo) {
                    let injections = this._injections[injectScope];
                    if (!injections) {
                        this._injections[injectScope] = injections = [];
                    }
                    injections.push(syntax.scopeName);
                }
                if (syntax.embeddedLanguages) {
                    for (let injectScope of syntax.injectTo) {
                        let injectedEmbeddedLanguages = this._injectedEmbeddedLanguages[injectScope];
                        if (!injectedEmbeddedLanguages) {
                            this._injectedEmbeddedLanguages[injectScope] = injectedEmbeddedLanguages = [];
                        }
                        injectedEmbeddedLanguages.push(syntax.embeddedLanguages);
                    }
                }
            }
            let modeId = syntax.language;
            if (modeId) {
                this._languageToScope.set(modeId, syntax.scopeName);
            }
        }
        _resolveEmbeddedLanguages(embeddedLanguages) {
            let scopes = Object.keys(embeddedLanguages);
            let result = Object.create(null);
            for (let i = 0, len = scopes.length; i < len; i++) {
                let scope = scopes[i];
                let language = embeddedLanguages[scope];
                let languageIdentifier = this._modeService.getLanguageIdentifier(language);
                if (languageIdentifier) {
                    result[scope] = languageIdentifier.id;
                }
            }
            return result;
        }
        createGrammar(modeId) {
            return __awaiter(this, void 0, void 0, function* () {
                const { grammar } = yield this._createGrammar(modeId);
                return grammar;
            });
        }
        _createGrammar(modeId) {
            return __awaiter(this, void 0, void 0, function* () {
                const scopeName = this._languageToScope.get(modeId);
                if (typeof scopeName !== 'string') {
                    // No TM grammar defined
                    return Promise.reject(new Error(nls.localize('no-tm-grammar', "No TM Grammar registered for this language.")));
                }
                const languageRegistration = this._scopeRegistry.getLanguageRegistration(scopeName);
                if (!languageRegistration) {
                    // No TM grammar defined
                    return Promise.reject(new Error(nls.localize('no-tm-grammar', "No TM Grammar registered for this language.")));
                }
                let embeddedLanguages = this._resolveEmbeddedLanguages(languageRegistration.embeddedLanguages);
                let rawInjectedEmbeddedLanguages = this._injectedEmbeddedLanguages[scopeName];
                if (rawInjectedEmbeddedLanguages) {
                    let injectedEmbeddedLanguages = rawInjectedEmbeddedLanguages.map(this._resolveEmbeddedLanguages.bind(this));
                    for (const injected of injectedEmbeddedLanguages) {
                        for (const scope of Object.keys(injected)) {
                            embeddedLanguages[scope] = injected[scope];
                        }
                    }
                }
                let languageId = this._modeService.getLanguageIdentifier(modeId).id;
                let containsEmbeddedLanguages = (Object.keys(embeddedLanguages).length > 0);
                const [grammarRegistry, initialState] = yield this._getOrCreateGrammarRegistry();
                const grammar = yield grammarRegistry.loadGrammarWithConfiguration(scopeName, languageId, { embeddedLanguages, tokenTypes: languageRegistration.tokenTypes });
                return {
                    languageId: languageId,
                    grammar: grammar,
                    initialState: initialState,
                    containsEmbeddedLanguages: containsEmbeddedLanguages
                };
            });
        }
    };
    TextMateService = __decorate([
        __param(0, modeService_1.IModeService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, files_1.IFileService),
        __param(3, notification_1.INotificationService),
        __param(4, log_1.ILogService),
        __param(5, configuration_1.IConfigurationService)
    ], TextMateService);
    exports.TextMateService = TextMateService;
    let TMTokenization = class TMTokenization {
        constructor(scopeRegistry, languageId, grammar, initialState, containsEmbeddedLanguages, notificationService, configurationService) {
            this.notificationService = notificationService;
            this.configurationService = configurationService;
            this._scopeRegistry = scopeRegistry;
            this._languageId = languageId;
            this._grammar = grammar;
            this._initialState = initialState;
            this._containsEmbeddedLanguages = containsEmbeddedLanguages;
            this._seenLanguages = [];
            this._maxTokenizationLineLength = configurationService.getValue('editor.maxTokenizationLineLength');
        }
        getInitialState() {
            return this._initialState;
        }
        tokenize(line, state, offsetDelta) {
            throw new Error('Not supported!');
        }
        tokenize2(line, state, offsetDelta) {
            if (offsetDelta !== 0) {
                throw new Error('Unexpected: offsetDelta should be 0.');
            }
            // Do not attempt to tokenize if a line is too long
            if (line.length >= this._maxTokenizationLineLength) {
                if (!this._tokenizationWarningAlreadyShown) {
                    this._tokenizationWarningAlreadyShown = true;
                    this.notificationService.warn(nls.localize('too many characters', "Tokenization is skipped for long lines for performance reasons. The length of a long line can be configured via `editor.maxTokenizationLineLength`."));
                }
                console.log(`Line (${line.substr(0, 15)}...): longer than ${this._maxTokenizationLineLength} characters, tokenization skipped.`);
                return nullMode_1.nullTokenize2(this._languageId, line, state, offsetDelta);
            }
            let textMateResult = this._grammar.tokenizeLine2(line, state);
            if (this._containsEmbeddedLanguages) {
                let seenLanguages = this._seenLanguages;
                let tokens = textMateResult.tokens;
                // Must check if any of the embedded languages was hit
                for (let i = 0, len = (tokens.length >>> 1); i < len; i++) {
                    let metadata = tokens[(i << 1) + 1];
                    let languageId = modes_1.TokenMetadata.getLanguageId(metadata);
                    if (!seenLanguages[languageId]) {
                        seenLanguages[languageId] = true;
                        this._scopeRegistry.onEncounteredLanguage(languageId);
                    }
                }
            }
            let endState;
            // try to save an object if possible
            if (state.equals(textMateResult.ruleStack)) {
                endState = state;
            }
            else {
                endState = textMateResult.ruleStack;
            }
            return new token_1.TokenizationResult2(textMateResult.tokens, endState);
        }
    };
    TMTokenization = __decorate([
        __param(5, notification_1.INotificationService), __param(6, configuration_1.IConfigurationService)
    ], TMTokenization);
    extensions_1.registerSingleton(textMateService_1.ITextMateService, TextMateService);
});
//# sourceMappingURL=textMateService.js.map