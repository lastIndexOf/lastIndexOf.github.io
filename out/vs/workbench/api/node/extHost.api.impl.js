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
define(["require", "exports", "vs/nls", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/uri", "vs/editor/common/config/editorOptions", "vs/editor/common/model", "vs/editor/common/modes/languageConfiguration", "vs/editor/common/modes/languageSelector", "vs/platform/files/common/files", "vs/platform/product/node/package", "vs/platform/product/node/product", "vs/workbench/api/node/extHost.protocol", "vs/workbench/api/node/extHostApiCommands", "vs/workbench/api/node/extHostClipboard", "vs/workbench/api/node/extHostCommands", "vs/workbench/api/node/extHostComments", "vs/workbench/api/node/extHostDebugService", "vs/workbench/api/node/extHostDecorations", "vs/workbench/api/node/extHostDiagnostics", "vs/workbench/api/node/extHostDialogs", "vs/workbench/api/node/extHostDocumentContentProviders", "vs/workbench/api/node/extHostDocumentSaveParticipant", "vs/workbench/api/node/extHostDocuments", "vs/workbench/api/node/extHostDocumentsAndEditors", "vs/workbench/api/node/extHostExtensionActivator", "vs/workbench/api/node/extHostFileSystem", "vs/workbench/api/node/extHostFileSystemEventService", "vs/workbench/api/node/extHostHeapService", "vs/workbench/api/node/extHostLanguageFeatures", "vs/workbench/api/node/extHostLanguages", "vs/workbench/api/node/extHostMessageService", "vs/workbench/api/node/extHostOutputService", "vs/workbench/api/node/extHostProgress", "vs/workbench/api/node/extHostQuickOpen", "vs/workbench/api/node/extHostSCM", "vs/workbench/api/node/extHostSearch", "vs/workbench/api/node/extHostStatusBar", "vs/workbench/api/node/extHostTask", "vs/workbench/api/node/extHostTerminalService", "vs/workbench/api/node/extHostTextEditors", "vs/workbench/api/node/extHostTreeViews", "vs/workbench/api/node/extHostTypeConverters", "vs/workbench/api/node/extHostTypes", "vs/workbench/api/node/extHostUrls", "vs/workbench/api/node/extHostWebview", "vs/workbench/api/node/extHostWindow", "vs/workbench/services/extensions/common/extensions", "vs/platform/extensions/common/extensions", "vs/base/common/resources", "vs/workbench/api/node/extHostCLIServer"], function (require, exports, nls_1, cancellation_1, errors, event_1, path, platform, severity_1, uri_1, editorOptions_1, model_1, languageConfiguration, languageSelector_1, files, package_1, product_1, extHost_protocol_1, extHostApiCommands_1, extHostClipboard_1, extHostCommands_1, extHostComments_1, extHostDebugService_1, extHostDecorations_1, extHostDiagnostics_1, extHostDialogs_1, extHostDocumentContentProviders_1, extHostDocumentSaveParticipant_1, extHostDocuments_1, extHostDocumentsAndEditors_1, extHostExtensionActivator_1, extHostFileSystem_1, extHostFileSystemEventService_1, extHostHeapService_1, extHostLanguageFeatures_1, extHostLanguages_1, extHostMessageService_1, extHostOutputService_1, extHostProgress_1, extHostQuickOpen_1, extHostSCM_1, extHostSearch_1, extHostStatusBar_1, extHostTask_1, extHostTerminalService_1, extHostTextEditors_1, extHostTreeViews_1, typeConverters, extHostTypes, extHostUrls_1, extHostWebview_1, extHostWindow_1, extensions_1, extensions_2, resources_1, extHostCLIServer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function proposedApiFunction(extension, fn) {
        if (extension.enableProposedApi) {
            return fn;
        }
        else {
            return extensions_1.throwProposedApiError.bind(null, extension);
        }
    }
    /**
     * This method instantiates and returns the extension API surface
     */
    function createApiFactory(initData, rpcProtocol, extHostWorkspace, extHostConfiguration, extensionService, extHostLogService, extHostStorage) {
        const schemeTransformer = null;
        // Addressable instances
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLogService, extHostLogService);
        const extHostHeapService = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostHeapService, new extHostHeapService_1.ExtHostHeapService());
        const extHostDecorations = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDecorations, new extHostDecorations_1.ExtHostDecorations(rpcProtocol));
        const extHostWebviews = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostWebviews, new extHostWebview_1.ExtHostWebviews(rpcProtocol));
        const extHostUrls = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostUrls, new extHostUrls_1.ExtHostUrls(rpcProtocol));
        const extHostDocumentsAndEditors = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocumentsAndEditors, new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors(rpcProtocol));
        const extHostDocuments = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocuments, new extHostDocuments_1.ExtHostDocuments(rpcProtocol, extHostDocumentsAndEditors));
        const extHostDocumentContentProviders = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocumentContentProviders, new extHostDocumentContentProviders_1.ExtHostDocumentContentProvider(rpcProtocol, extHostDocumentsAndEditors, extHostLogService));
        const extHostDocumentSaveParticipant = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocumentSaveParticipant, new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(extHostLogService, extHostDocuments, rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadTextEditors)));
        const extHostEditors = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostEditors, new extHostTextEditors_1.ExtHostEditors(rpcProtocol, extHostDocumentsAndEditors));
        const extHostCommands = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostCommands, new extHostCommands_1.ExtHostCommands(rpcProtocol, extHostHeapService, extHostLogService));
        const extHostTreeViews = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTreeViews, new extHostTreeViews_1.ExtHostTreeViews(rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadTreeViews), extHostCommands, extHostLogService));
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostWorkspace, extHostWorkspace);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostConfiguration, extHostConfiguration);
        const extHostDiagnostics = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDiagnostics, new extHostDiagnostics_1.ExtHostDiagnostics(rpcProtocol));
        const extHostLanguageFeatures = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLanguageFeatures, new extHostLanguageFeatures_1.ExtHostLanguageFeatures(rpcProtocol, schemeTransformer, extHostDocuments, extHostCommands, extHostHeapService, extHostDiagnostics, extHostLogService));
        const extHostFileSystem = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostFileSystem, new extHostFileSystem_1.ExtHostFileSystem(rpcProtocol, extHostLanguageFeatures));
        const extHostFileSystemEvent = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostFileSystemEventService, new extHostFileSystemEventService_1.ExtHostFileSystemEventService(rpcProtocol, extHostDocumentsAndEditors));
        const extHostQuickOpen = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostQuickOpen, new extHostQuickOpen_1.ExtHostQuickOpen(rpcProtocol, extHostWorkspace, extHostCommands));
        const extHostTerminalService = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTerminalService, new extHostTerminalService_1.ExtHostTerminalService(rpcProtocol, extHostConfiguration, extHostLogService));
        const extHostDebugService = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDebugService, new extHostDebugService_1.ExtHostDebugService(rpcProtocol, extHostWorkspace, extensionService, extHostDocumentsAndEditors, extHostConfiguration, extHostTerminalService, extHostCommands));
        const extHostSCM = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostSCM, new extHostSCM_1.ExtHostSCM(rpcProtocol, extHostCommands, extHostLogService));
        const extHostComment = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostComments, new extHostComments_1.ExtHostComments(rpcProtocol, extHostCommands, extHostDocuments));
        const extHostSearch = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostSearch, new extHostSearch_1.ExtHostSearch(rpcProtocol, schemeTransformer, extHostLogService));
        const extHostTask = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTask, new extHostTask_1.ExtHostTask(rpcProtocol, extHostWorkspace, extHostDocumentsAndEditors, extHostConfiguration, extHostTerminalService));
        const extHostWindow = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostWindow, new extHostWindow_1.ExtHostWindow(rpcProtocol));
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostExtensionService, extensionService);
        const extHostProgress = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostProgress, new extHostProgress_1.ExtHostProgress(rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadProgress)));
        const extHostOutputService = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostOutputService, new extHostOutputService_1.ExtHostOutputService(initData.logsLocation, rpcProtocol));
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostStorage, extHostStorage);
        if (initData.remoteAuthority) {
            const cliServer = new extHostCLIServer_1.CLIServer(extHostCommands);
            process.env['VSCODE_IPC_HOOK_CLI'] = cliServer.ipcHandlePath;
        }
        // Check that no named customers are missing
        const expected = Object.keys(extHost_protocol_1.ExtHostContext).map((key) => extHost_protocol_1.ExtHostContext[key]);
        rpcProtocol.assertRegistered(expected);
        // Other instances
        const extHostClipboard = new extHostClipboard_1.ExtHostClipboard(rpcProtocol);
        const extHostMessageService = new extHostMessageService_1.ExtHostMessageService(rpcProtocol);
        const extHostDialogs = new extHostDialogs_1.ExtHostDialogs(rpcProtocol);
        const extHostStatusBar = new extHostStatusBar_1.ExtHostStatusBar(rpcProtocol);
        const extHostLanguages = new extHostLanguages_1.ExtHostLanguages(rpcProtocol, extHostDocuments);
        // Register an output channel for exthost log
        const name = nls_1.localize('extensionsLog', "Extension Host");
        extHostOutputService.createOutputChannelFromLogFile(name, extHostLogService.logFile);
        // Register API-ish commands
        extHostApiCommands_1.ExtHostApiCommands.register(extHostCommands);
        return function (extension, extensionRegistry, configProvider) {
            // Check document selectors for being overly generic. Technically this isn't a problem but
            // in practice many extensions say they support `fooLang` but need fs-access to do so. Those
            // extension should specify then the `file`-scheme, e.g `{ scheme: 'fooLang', language: 'fooLang' }`
            // We only inform once, it is not a warning because we just want to raise awareness and because
            // we cannot say if the extension is doing it right or wrong...
            const checkSelector = (function () {
                let done = (!extension.isUnderDevelopment);
                function informOnce(selector) {
                    if (!done) {
                        console.info(`Extension '${extension.identifier.value}' uses a document selector without scheme. Learn more about this: https://go.microsoft.com/fwlink/?linkid=872305`);
                        done = true;
                    }
                }
                return function perform(selector) {
                    if (Array.isArray(selector)) {
                        selector.forEach(perform);
                    }
                    else if (typeof selector === 'string') {
                        informOnce(selector);
                    }
                    else {
                        if (typeof selector.scheme === 'undefined') {
                            informOnce(selector);
                        }
                        if (!extension.enableProposedApi && typeof selector.exclusive === 'boolean') {
                            extensions_1.throwProposedApiError(extension);
                        }
                    }
                    return selector;
                };
            })();
            // namespace: commands
            const commands = {
                registerCommand(id, command, thisArgs) {
                    return extHostCommands.registerCommand(true, id, command, thisArgs);
                },
                registerTextEditorCommand(id, callback, thisArg) {
                    return extHostCommands.registerCommand(true, id, (...args) => {
                        const activeTextEditor = extHostEditors.getActiveTextEditor();
                        if (!activeTextEditor) {
                            console.warn('Cannot execute ' + id + ' because there is no active text editor.');
                            return undefined;
                        }
                        return activeTextEditor.edit((edit) => {
                            args.unshift(activeTextEditor, edit);
                            callback.apply(thisArg, args);
                        }).then((result) => {
                            if (!result) {
                                console.warn('Edits from command ' + id + ' were not applied.');
                            }
                        }, (err) => {
                            console.warn('An error occurred while running command ' + id, err);
                        });
                    });
                },
                registerDiffInformationCommand: proposedApiFunction(extension, (id, callback, thisArg) => {
                    return extHostCommands.registerCommand(true, id, (...args) => __awaiter(this, void 0, void 0, function* () {
                        const activeTextEditor = extHostEditors.getActiveTextEditor();
                        if (!activeTextEditor) {
                            console.warn('Cannot execute ' + id + ' because there is no active text editor.');
                            return undefined;
                        }
                        const diff = yield extHostEditors.getDiffInformation(activeTextEditor.id);
                        callback.apply(thisArg, [diff, ...args]);
                    }));
                }),
                executeCommand(id, ...args) {
                    return extHostCommands.executeCommand(id, ...args);
                },
                getCommands(filterInternal = false) {
                    return extHostCommands.getCommands(filterInternal);
                }
            };
            // namespace: env
            const env = Object.freeze({
                get machineId() { return initData.telemetryInfo.machineId; },
                get sessionId() { return initData.telemetryInfo.sessionId; },
                get language() { return platform.language; },
                get appName() { return product_1.default.nameLong; },
                get appRoot() { return initData.environment.appRoot.fsPath; },
                get logLevel() {
                    extensions_1.checkProposedApiEnabled(extension);
                    return typeConverters.LogLevel.to(extHostLogService.getLevel());
                },
                get onDidChangeLogLevel() {
                    extensions_1.checkProposedApiEnabled(extension);
                    return event_1.Event.map(extHostLogService.onDidChangeLogLevel, l => typeConverters.LogLevel.to(l));
                },
                get clipboard() {
                    return extHostClipboard;
                },
                openExternal(uri) {
                    return extHostWindow.openUri(uri);
                }
            });
            // namespace: extensions
            const extensions = {
                getExtension(extensionId) {
                    const desc = extensionRegistry.getExtensionDescription(extensionId);
                    if (desc) {
                        return new Extension(extensionService, desc);
                    }
                    return undefined;
                },
                get all() {
                    return extensionRegistry.getAllExtensionDescriptions().map((desc) => new Extension(extensionService, desc));
                },
                get onDidChange() {
                    return extensionRegistry.onDidChange;
                }
            };
            // namespace: languages
            const languages = {
                createDiagnosticCollection(name) {
                    return extHostDiagnostics.createDiagnosticCollection(name);
                },
                get onDidChangeDiagnostics() {
                    return extHostDiagnostics.onDidChangeDiagnostics;
                },
                getDiagnostics: (resource) => {
                    return extHostDiagnostics.getDiagnostics(resource);
                },
                getLanguages() {
                    return extHostLanguages.getLanguages();
                },
                setTextDocumentLanguage(document, languageId) {
                    return extHostLanguages.changeLanguage(document.uri, languageId);
                },
                match(selector, document) {
                    return languageSelector_1.score(typeConverters.LanguageSelector.from(selector), document.uri, document.languageId, true);
                },
                registerCodeActionsProvider(selector, provider, metadata) {
                    return extHostLanguageFeatures.registerCodeActionProvider(extension, checkSelector(selector), provider, metadata);
                },
                registerCodeLensProvider(selector, provider) {
                    return extHostLanguageFeatures.registerCodeLensProvider(extension, checkSelector(selector), provider);
                },
                registerCodeInsetProvider(selector, provider) {
                    extensions_1.checkProposedApiEnabled(extension);
                    return extHostLanguageFeatures.registerCodeInsetProvider(extension, checkSelector(selector), provider);
                },
                registerDefinitionProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDefinitionProvider(extension, checkSelector(selector), provider);
                },
                registerDeclarationProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDeclarationProvider(extension, checkSelector(selector), provider);
                },
                registerImplementationProvider(selector, provider) {
                    return extHostLanguageFeatures.registerImplementationProvider(extension, checkSelector(selector), provider);
                },
                registerTypeDefinitionProvider(selector, provider) {
                    return extHostLanguageFeatures.registerTypeDefinitionProvider(extension, checkSelector(selector), provider);
                },
                registerHoverProvider(selector, provider) {
                    return extHostLanguageFeatures.registerHoverProvider(extension, checkSelector(selector), provider, extension.identifier);
                },
                registerDocumentHighlightProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDocumentHighlightProvider(extension, checkSelector(selector), provider);
                },
                registerReferenceProvider(selector, provider) {
                    return extHostLanguageFeatures.registerReferenceProvider(extension, checkSelector(selector), provider);
                },
                registerRenameProvider(selector, provider) {
                    return extHostLanguageFeatures.registerRenameProvider(extension, checkSelector(selector), provider);
                },
                registerDocumentSymbolProvider(selector, provider, metadata) {
                    return extHostLanguageFeatures.registerDocumentSymbolProvider(extension, checkSelector(selector), provider, metadata);
                },
                registerWorkspaceSymbolProvider(provider) {
                    return extHostLanguageFeatures.registerWorkspaceSymbolProvider(extension, provider);
                },
                registerDocumentFormattingEditProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDocumentFormattingEditProvider(extension, checkSelector(selector), provider);
                },
                registerDocumentRangeFormattingEditProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDocumentRangeFormattingEditProvider(extension, checkSelector(selector), provider);
                },
                registerOnTypeFormattingEditProvider(selector, provider, firstTriggerCharacter, ...moreTriggerCharacters) {
                    return extHostLanguageFeatures.registerOnTypeFormattingEditProvider(extension, checkSelector(selector), provider, [firstTriggerCharacter].concat(moreTriggerCharacters));
                },
                registerSignatureHelpProvider(selector, provider, firstItem, ...remaining) {
                    if (typeof firstItem === 'object') {
                        return extHostLanguageFeatures.registerSignatureHelpProvider(extension, checkSelector(selector), provider, firstItem);
                    }
                    return extHostLanguageFeatures.registerSignatureHelpProvider(extension, checkSelector(selector), provider, typeof firstItem === 'undefined' ? [] : [firstItem, ...remaining]);
                },
                registerCompletionItemProvider(selector, provider, ...triggerCharacters) {
                    return extHostLanguageFeatures.registerCompletionItemProvider(extension, checkSelector(selector), provider, triggerCharacters);
                },
                registerDocumentLinkProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDocumentLinkProvider(extension, checkSelector(selector), provider);
                },
                registerColorProvider(selector, provider) {
                    return extHostLanguageFeatures.registerColorProvider(extension, checkSelector(selector), provider);
                },
                registerFoldingRangeProvider(selector, provider) {
                    return extHostLanguageFeatures.registerFoldingRangeProvider(extension, checkSelector(selector), provider);
                },
                registerSelectionRangeProvider(selector, provider) {
                    return extHostLanguageFeatures.registerSelectionRangeProvider(extension, selector, provider);
                },
                setLanguageConfiguration: (language, configuration) => {
                    return extHostLanguageFeatures.setLanguageConfiguration(language, configuration);
                }
            };
            // namespace: window
            const window = {
                get activeTextEditor() {
                    return extHostEditors.getActiveTextEditor();
                },
                get visibleTextEditors() {
                    return extHostEditors.getVisibleTextEditors();
                },
                get activeTerminal() {
                    return extHostTerminalService.activeTerminal;
                },
                get terminals() {
                    return extHostTerminalService.terminals;
                },
                showTextDocument(documentOrUri, columnOrOptions, preserveFocus) {
                    let documentPromise;
                    if (uri_1.URI.isUri(documentOrUri)) {
                        documentPromise = Promise.resolve(workspace.openTextDocument(documentOrUri));
                    }
                    else {
                        documentPromise = Promise.resolve(documentOrUri);
                    }
                    return documentPromise.then(document => {
                        return extHostEditors.showTextDocument(document, columnOrOptions, preserveFocus);
                    });
                },
                createTextEditorDecorationType(options) {
                    return extHostEditors.createTextEditorDecorationType(options);
                },
                onDidChangeActiveTextEditor(listener, thisArg, disposables) {
                    return extHostEditors.onDidChangeActiveTextEditor(listener, thisArg, disposables);
                },
                onDidChangeVisibleTextEditors(listener, thisArg, disposables) {
                    return extHostEditors.onDidChangeVisibleTextEditors(listener, thisArg, disposables);
                },
                onDidChangeTextEditorSelection(listener, thisArgs, disposables) {
                    return extHostEditors.onDidChangeTextEditorSelection(listener, thisArgs, disposables);
                },
                onDidChangeTextEditorOptions(listener, thisArgs, disposables) {
                    return extHostEditors.onDidChangeTextEditorOptions(listener, thisArgs, disposables);
                },
                onDidChangeTextEditorVisibleRanges(listener, thisArgs, disposables) {
                    return extHostEditors.onDidChangeTextEditorVisibleRanges(listener, thisArgs, disposables);
                },
                onDidChangeTextEditorViewColumn(listener, thisArg, disposables) {
                    return extHostEditors.onDidChangeTextEditorViewColumn(listener, thisArg, disposables);
                },
                onDidCloseTerminal(listener, thisArg, disposables) {
                    return extHostTerminalService.onDidCloseTerminal(listener, thisArg, disposables);
                },
                onDidOpenTerminal(listener, thisArg, disposables) {
                    return extHostTerminalService.onDidOpenTerminal(listener, thisArg, disposables);
                },
                onDidChangeActiveTerminal(listener, thisArg, disposables) {
                    return extHostTerminalService.onDidChangeActiveTerminal(listener, thisArg, disposables);
                },
                onDidChangeTerminalDimensions(listener, thisArg, disposables) {
                    return extHostTerminalService.onDidChangeTerminalDimensions(listener, thisArg, disposables);
                },
                get state() {
                    return extHostWindow.state;
                },
                onDidChangeWindowState(listener, thisArg, disposables) {
                    return extHostWindow.onDidChangeWindowState(listener, thisArg, disposables);
                },
                showInformationMessage(message, first, ...rest) {
                    return extHostMessageService.showMessage(extension, severity_1.default.Info, message, first, rest);
                },
                showWarningMessage(message, first, ...rest) {
                    return extHostMessageService.showMessage(extension, severity_1.default.Warning, message, first, rest);
                },
                showErrorMessage(message, first, ...rest) {
                    return extHostMessageService.showMessage(extension, severity_1.default.Error, message, first, rest);
                },
                showQuickPick(items, options, token) {
                    return extHostQuickOpen.showQuickPick(items, !!extension.enableProposedApi, options, token);
                },
                showWorkspaceFolderPick(options) {
                    return extHostQuickOpen.showWorkspaceFolderPick(options);
                },
                showInputBox(options, token) {
                    return extHostQuickOpen.showInput(options, token);
                },
                showOpenDialog(options) {
                    return extHostDialogs.showOpenDialog(options);
                },
                showSaveDialog(options) {
                    return extHostDialogs.showSaveDialog(options);
                },
                createStatusBarItem(position, priority) {
                    return extHostStatusBar.createStatusBarEntry(extension.identifier, position, priority);
                },
                setStatusBarMessage(text, timeoutOrThenable) {
                    return extHostStatusBar.setStatusBarMessage(text, timeoutOrThenable);
                },
                withScmProgress(task) {
                    console.warn(`[Deprecation Warning] function 'withScmProgress' is deprecated and should no longer be used. Use 'withProgress' instead.`);
                    return extHostProgress.withProgress(extension, { location: extHostTypes.ProgressLocation.SourceControl }, (progress, token) => task({ report(n) { } }));
                },
                withProgress(options, task) {
                    return extHostProgress.withProgress(extension, options, task);
                },
                createOutputChannel(name) {
                    return extHostOutputService.createOutputChannel(name);
                },
                createWebviewPanel(viewType, title, showOptions, options) {
                    return extHostWebviews.createWebviewPanel(extension, viewType, title, showOptions, options);
                },
                createTerminal(nameOrOptions, shellPath, shellArgs) {
                    if (typeof nameOrOptions === 'object') {
                        return extHostTerminalService.createTerminalFromOptions(nameOrOptions);
                    }
                    return extHostTerminalService.createTerminal(nameOrOptions, shellPath, shellArgs);
                },
                createTerminalRenderer(name) {
                    return extHostTerminalService.createTerminalRenderer(name);
                },
                registerTreeDataProvider(viewId, treeDataProvider) {
                    return extHostTreeViews.registerTreeDataProvider(viewId, treeDataProvider, extension);
                },
                createTreeView(viewId, options) {
                    return extHostTreeViews.createTreeView(viewId, options, extension);
                },
                registerWebviewPanelSerializer: (viewType, serializer) => {
                    return extHostWebviews.registerWebviewPanelSerializer(viewType, serializer);
                },
                registerDecorationProvider: proposedApiFunction(extension, (provider) => {
                    return extHostDecorations.registerDecorationProvider(provider, extension.identifier);
                }),
                registerUriHandler(handler) {
                    return extHostUrls.registerUriHandler(extension.identifier, handler);
                },
                createQuickPick() {
                    return extHostQuickOpen.createQuickPick(extension.identifier, !!extension.enableProposedApi);
                },
                createInputBox() {
                    return extHostQuickOpen.createInputBox(extension.identifier);
                }
            };
            // namespace: workspace
            const workspace = {
                get rootPath() {
                    return extHostWorkspace.getPath();
                },
                set rootPath(value) {
                    throw errors.readonly();
                },
                getWorkspaceFolder(resource) {
                    return extHostWorkspace.getWorkspaceFolder(resource);
                },
                get workspaceFolders() {
                    return extHostWorkspace.getWorkspaceFolders();
                },
                get name() {
                    return extHostWorkspace.name;
                },
                set name(value) {
                    throw errors.readonly();
                },
                updateWorkspaceFolders: (index, deleteCount, ...workspaceFoldersToAdd) => {
                    return extHostWorkspace.updateWorkspaceFolders(extension, index, deleteCount || 0, ...workspaceFoldersToAdd);
                },
                onDidChangeWorkspaceFolders: function (listener, thisArgs, disposables) {
                    return extHostWorkspace.onDidChangeWorkspace(listener, thisArgs, disposables);
                },
                asRelativePath: (pathOrUri, includeWorkspace) => {
                    return extHostWorkspace.getRelativePath(pathOrUri, includeWorkspace);
                },
                findFiles: (include, exclude, maxResults, token) => {
                    return extHostWorkspace.findFiles(typeConverters.GlobPattern.from(include), typeConverters.GlobPattern.from(exclude), maxResults, extension.identifier, token);
                },
                findTextInFiles: (query, optionsOrCallback, callbackOrToken, token) => {
                    let options;
                    let callback;
                    if (typeof optionsOrCallback === 'object') {
                        options = optionsOrCallback;
                        callback = callbackOrToken;
                    }
                    else {
                        options = {};
                        callback = optionsOrCallback;
                        token = callbackOrToken;
                    }
                    return extHostWorkspace.findTextInFiles(query, options || {}, callback, extension.identifier, token);
                },
                saveAll: (includeUntitled) => {
                    return extHostWorkspace.saveAll(includeUntitled);
                },
                applyEdit(edit) {
                    return extHostEditors.applyWorkspaceEdit(edit);
                },
                createFileSystemWatcher: (pattern, ignoreCreate, ignoreChange, ignoreDelete) => {
                    return extHostFileSystemEvent.createFileSystemWatcher(typeConverters.GlobPattern.from(pattern), ignoreCreate, ignoreChange, ignoreDelete);
                },
                get textDocuments() {
                    return extHostDocuments.getAllDocumentData().map(data => data.document);
                },
                set textDocuments(value) {
                    throw errors.readonly();
                },
                openTextDocument(uriOrFileNameOrOptions) {
                    let uriPromise;
                    const options = uriOrFileNameOrOptions;
                    if (typeof uriOrFileNameOrOptions === 'string') {
                        uriPromise = Promise.resolve(uri_1.URI.file(uriOrFileNameOrOptions));
                    }
                    else if (uriOrFileNameOrOptions instanceof uri_1.URI) {
                        uriPromise = Promise.resolve(uriOrFileNameOrOptions);
                    }
                    else if (!options || typeof options === 'object') {
                        uriPromise = extHostDocuments.createDocumentData(options);
                    }
                    else {
                        throw new Error('illegal argument - uriOrFileNameOrOptions');
                    }
                    return uriPromise.then(uri => {
                        return extHostDocuments.ensureDocumentData(uri).then(() => {
                            return extHostDocuments.getDocument(uri);
                        });
                    });
                },
                onDidOpenTextDocument: (listener, thisArgs, disposables) => {
                    return extHostDocuments.onDidAddDocument(listener, thisArgs, disposables);
                },
                onDidCloseTextDocument: (listener, thisArgs, disposables) => {
                    return extHostDocuments.onDidRemoveDocument(listener, thisArgs, disposables);
                },
                onDidChangeTextDocument: (listener, thisArgs, disposables) => {
                    return extHostDocuments.onDidChangeDocument(listener, thisArgs, disposables);
                },
                onDidSaveTextDocument: (listener, thisArgs, disposables) => {
                    return extHostDocuments.onDidSaveDocument(listener, thisArgs, disposables);
                },
                onWillSaveTextDocument: (listener, thisArgs, disposables) => {
                    return extHostDocumentSaveParticipant.getOnWillSaveTextDocumentEvent(extension)(listener, thisArgs, disposables);
                },
                onDidChangeConfiguration: (listener, thisArgs, disposables) => {
                    return configProvider.onDidChangeConfiguration(listener, thisArgs, disposables);
                },
                getConfiguration(section, resource) {
                    resource = arguments.length === 1 ? undefined : resource;
                    return configProvider.getConfiguration(section, resource, extension.identifier);
                },
                registerTextDocumentContentProvider(scheme, provider) {
                    return extHostDocumentContentProviders.registerTextDocumentContentProvider(scheme, provider);
                },
                registerTaskProvider: (type, provider) => {
                    return extHostTask.registerTaskProvider(extension, provider);
                },
                registerFileSystemProvider(scheme, provider, options) {
                    return extHostFileSystem.registerFileSystemProvider(scheme, provider, options);
                },
                registerFileSearchProvider: proposedApiFunction(extension, (scheme, provider) => {
                    return extHostSearch.registerFileSearchProvider(scheme, provider);
                }),
                registerSearchProvider: proposedApiFunction(extension, () => {
                    // Temp for live share in Insiders
                    return { dispose: () => { } };
                }),
                registerTextSearchProvider: proposedApiFunction(extension, (scheme, provider) => {
                    return extHostSearch.registerTextSearchProvider(scheme, provider);
                }),
                registerDocumentCommentProvider: proposedApiFunction(extension, (provider) => {
                    return extHostComment.registerDocumentCommentProvider(extension.identifier, provider);
                }),
                registerWorkspaceCommentProvider: proposedApiFunction(extension, (provider) => {
                    return extHostComment.registerWorkspaceCommentProvider(extension.identifier, provider);
                }),
                registerRemoteAuthorityResolver: proposedApiFunction(extension, (authorityPrefix, resolver) => {
                    return extensionService.registerRemoteAuthorityResolver(authorityPrefix, resolver);
                }),
                registerResourceLabelFormatter: proposedApiFunction(extension, (formatter) => {
                    return extHostFileSystem.registerResourceLabelFormatter(formatter);
                }),
                onDidRenameFile: proposedApiFunction(extension, (listener, thisArg, disposables) => {
                    return extHostFileSystemEvent.onDidRenameFile(listener, thisArg, disposables);
                }),
                onWillRenameFile: proposedApiFunction(extension, (listener, thisArg, disposables) => {
                    return extHostFileSystemEvent.getOnWillRenameFileEvent(extension)(listener, thisArg, disposables);
                })
            };
            // namespace: scm
            const scm = {
                get inputBox() {
                    return extHostSCM.getLastInputBox(extension); // Strict null override - Deprecated api
                },
                createSourceControl(id, label, rootUri) {
                    return extHostSCM.createSourceControl(extension, id, label, rootUri);
                }
            };
            const comment = {
                createCommentController(id, label) {
                    return extHostComment.createCommentController(extension, id, label);
                }
            };
            // namespace: debug
            const debug = {
                get activeDebugSession() {
                    return extHostDebugService.activeDebugSession;
                },
                get activeDebugConsole() {
                    return extHostDebugService.activeDebugConsole;
                },
                get breakpoints() {
                    return extHostDebugService.breakpoints;
                },
                onDidStartDebugSession(listener, thisArg, disposables) {
                    return extHostDebugService.onDidStartDebugSession(listener, thisArg, disposables);
                },
                onDidTerminateDebugSession(listener, thisArg, disposables) {
                    return extHostDebugService.onDidTerminateDebugSession(listener, thisArg, disposables);
                },
                onDidChangeActiveDebugSession(listener, thisArg, disposables) {
                    return extHostDebugService.onDidChangeActiveDebugSession(listener, thisArg, disposables);
                },
                onDidReceiveDebugSessionCustomEvent(listener, thisArg, disposables) {
                    return extHostDebugService.onDidReceiveDebugSessionCustomEvent(listener, thisArg, disposables);
                },
                onDidChangeBreakpoints(listener, thisArgs, disposables) {
                    return extHostDebugService.onDidChangeBreakpoints(listener, thisArgs, disposables);
                },
                registerDebugConfigurationProvider(debugType, provider) {
                    return extHostDebugService.registerDebugConfigurationProvider(debugType, provider);
                },
                registerDebugAdapterDescriptorFactory(debugType, factory) {
                    return extHostDebugService.registerDebugAdapterDescriptorFactory(extension, debugType, factory);
                },
                registerDebugAdapterTrackerFactory(debugType, factory) {
                    return extHostDebugService.registerDebugAdapterTrackerFactory(debugType, factory);
                },
                startDebugging(folder, nameOrConfig) {
                    return extHostDebugService.startDebugging(folder, nameOrConfig);
                },
                addBreakpoints(breakpoints) {
                    return extHostDebugService.addBreakpoints(breakpoints);
                },
                removeBreakpoints(breakpoints) {
                    return extHostDebugService.removeBreakpoints(breakpoints);
                }
            };
            const tasks = {
                registerTaskProvider: (type, provider) => {
                    return extHostTask.registerTaskProvider(extension, provider);
                },
                fetchTasks: (filter) => {
                    return extHostTask.fetchTasks(filter);
                },
                executeTask: (task) => {
                    return extHostTask.executeTask(extension, task);
                },
                get taskExecutions() {
                    return extHostTask.taskExecutions;
                },
                onDidStartTask: (listeners, thisArgs, disposables) => {
                    return extHostTask.onDidStartTask(listeners, thisArgs, disposables);
                },
                onDidEndTask: (listeners, thisArgs, disposables) => {
                    return extHostTask.onDidEndTask(listeners, thisArgs, disposables);
                },
                onDidStartTaskProcess: (listeners, thisArgs, disposables) => {
                    return extHostTask.onDidStartTaskProcess(listeners, thisArgs, disposables);
                },
                onDidEndTaskProcess: (listeners, thisArgs, disposables) => {
                    return extHostTask.onDidEndTaskProcess(listeners, thisArgs, disposables);
                }
            };
            return {
                version: package_1.default.version,
                // namespaces
                commands,
                debug,
                env,
                extensions,
                languages,
                scm,
                comment,
                tasks,
                window,
                workspace,
                // types
                Breakpoint: extHostTypes.Breakpoint,
                CancellationTokenSource: cancellation_1.CancellationTokenSource,
                CodeAction: extHostTypes.CodeAction,
                CodeActionKind: extHostTypes.CodeActionKind,
                CodeActionTrigger: extHostTypes.CodeActionTrigger,
                CodeLens: extHostTypes.CodeLens,
                CodeInset: extHostTypes.CodeInset,
                Color: extHostTypes.Color,
                ColorInformation: extHostTypes.ColorInformation,
                ColorPresentation: extHostTypes.ColorPresentation,
                CommentThreadCollapsibleState: extHostTypes.CommentThreadCollapsibleState,
                CompletionItem: extHostTypes.CompletionItem,
                CompletionItemKind: extHostTypes.CompletionItemKind,
                CompletionList: extHostTypes.CompletionList,
                CompletionTriggerKind: extHostTypes.CompletionTriggerKind,
                ConfigurationTarget: extHostTypes.ConfigurationTarget,
                DebugAdapterExecutable: extHostTypes.DebugAdapterExecutable,
                DebugAdapterServer: extHostTypes.DebugAdapterServer,
                DecorationRangeBehavior: extHostTypes.DecorationRangeBehavior,
                Diagnostic: extHostTypes.Diagnostic,
                DiagnosticRelatedInformation: extHostTypes.DiagnosticRelatedInformation,
                DiagnosticSeverity: extHostTypes.DiagnosticSeverity,
                DiagnosticTag: extHostTypes.DiagnosticTag,
                Disposable: extHostTypes.Disposable,
                DocumentHighlight: extHostTypes.DocumentHighlight,
                DocumentHighlightKind: extHostTypes.DocumentHighlightKind,
                DocumentLink: extHostTypes.DocumentLink,
                DocumentSymbol: extHostTypes.DocumentSymbol,
                EndOfLine: extHostTypes.EndOfLine,
                EventEmitter: event_1.Emitter,
                CustomExecution: extHostTypes.CustomExecution,
                FileChangeType: extHostTypes.FileChangeType,
                FileSystemError: extHostTypes.FileSystemError,
                FileType: files.FileType,
                FoldingRange: extHostTypes.FoldingRange,
                FoldingRangeKind: extHostTypes.FoldingRangeKind,
                FunctionBreakpoint: extHostTypes.FunctionBreakpoint,
                Hover: extHostTypes.Hover,
                IndentAction: languageConfiguration.IndentAction,
                Location: extHostTypes.Location,
                LogLevel: extHostTypes.LogLevel,
                MarkdownString: extHostTypes.MarkdownString,
                OverviewRulerLane: model_1.OverviewRulerLane,
                ParameterInformation: extHostTypes.ParameterInformation,
                Position: extHostTypes.Position,
                ProcessExecution: extHostTypes.ProcessExecution,
                ProgressLocation: extHostTypes.ProgressLocation,
                QuickInputButtons: extHostTypes.QuickInputButtons,
                Range: extHostTypes.Range,
                RelativePattern: extHostTypes.RelativePattern,
                ResolvedAuthority: extHostTypes.ResolvedAuthority,
                Selection: extHostTypes.Selection,
                SelectionRange: extHostTypes.SelectionRange,
                ShellExecution: extHostTypes.ShellExecution,
                ShellQuoting: extHostTypes.ShellQuoting,
                SignatureHelpTriggerKind: extHostTypes.SignatureHelpTriggerKind,
                SignatureHelp: extHostTypes.SignatureHelp,
                SignatureInformation: extHostTypes.SignatureInformation,
                SnippetString: extHostTypes.SnippetString,
                SourceBreakpoint: extHostTypes.SourceBreakpoint,
                SourceControlInputBoxValidationType: extHostTypes.SourceControlInputBoxValidationType,
                StatusBarAlignment: extHostTypes.StatusBarAlignment,
                SymbolInformation: extHostTypes.SymbolInformation,
                SymbolKind: extHostTypes.SymbolKind,
                Task: extHostTypes.Task,
                Task2: extHostTypes.Task,
                TaskGroup: extHostTypes.TaskGroup,
                TaskPanelKind: extHostTypes.TaskPanelKind,
                TaskRevealKind: extHostTypes.TaskRevealKind,
                TaskScope: extHostTypes.TaskScope,
                TextDocumentSaveReason: extHostTypes.TextDocumentSaveReason,
                TextEdit: extHostTypes.TextEdit,
                TextEditorCursorStyle: editorOptions_1.TextEditorCursorStyle,
                TextEditorLineNumbersStyle: extHostTypes.TextEditorLineNumbersStyle,
                TextEditorRevealType: extHostTypes.TextEditorRevealType,
                TextEditorSelectionChangeKind: extHostTypes.TextEditorSelectionChangeKind,
                ThemeColor: extHostTypes.ThemeColor,
                ThemeIcon: extHostTypes.ThemeIcon,
                TreeItem: extHostTypes.TreeItem,
                TreeItem2: extHostTypes.TreeItem,
                TreeItemCollapsibleState: extHostTypes.TreeItemCollapsibleState,
                Uri: uri_1.URI,
                ViewColumn: extHostTypes.ViewColumn,
                WorkspaceEdit: extHostTypes.WorkspaceEdit,
            };
        };
    }
    exports.createApiFactory = createApiFactory;
    class Extension {
        constructor(extensionService, description) {
            this._extensionService = extensionService;
            this._identifier = description.identifier;
            this.id = description.identifier.value;
            this.extensionPath = path.normalize(resources_1.originalFSPath(description.extensionLocation));
            this.packageJSON = description;
        }
        get isActive() {
            return this._extensionService.isActivated(this._identifier);
        }
        get exports() {
            if (this.packageJSON.api === 'none') {
                return undefined; // Strict nulloverride - Public api
            }
            return this._extensionService.getExtensionExports(this._identifier);
        }
        activate() {
            return this._extensionService.activateByIdWithErrors(this._identifier, new extHostExtensionActivator_1.ExtensionActivatedByAPI(false)).then(() => this.exports);
        }
    }
    function initializeExtensionApi(extensionService, apiFactory, extensionRegistry, configProvider) {
        return extensionService.getExtensionPathIndex().then(trie => defineAPI(apiFactory, trie, extensionRegistry, configProvider));
    }
    exports.initializeExtensionApi = initializeExtensionApi;
    function defineAPI(factory, extensionPaths, extensionRegistry, configProvider) {
        // each extension is meant to get its own api implementation
        const extApiImpl = new Map();
        let defaultApiImpl;
        // if (process.env.isBrowser) {
        // }
        let node_module;
        if (process.env.isBrowser) {
            node_module = self['require'].__$__nodeRequire('module');
        }
        else {
            node_module = require.__$__nodeRequire('module');
        }
        const original = node_module._load;
        node_module._load = function load(request, parent, isMain) {
            if (request !== 'vscode') {
                return original.apply(this, arguments);
            }
            // get extension id from filename and api for extension
            const ext = extensionPaths.findSubstr(uri_1.URI.file(parent.filename).fsPath);
            if (ext) {
                let apiImpl = extApiImpl.get(extensions_2.ExtensionIdentifier.toKey(ext.identifier));
                if (!apiImpl) {
                    apiImpl = factory(ext, extensionRegistry, configProvider);
                    extApiImpl.set(extensions_2.ExtensionIdentifier.toKey(ext.identifier), apiImpl);
                }
                return apiImpl;
            }
            // fall back to a default implementation
            if (!defaultApiImpl) {
                let extensionPathsPretty = '';
                extensionPaths.forEach((value, index) => extensionPathsPretty += `\t${index} -> ${value.identifier.value}\n`);
                console.warn(`Could not identify extension for 'vscode' require call from ${parent.filename}. These are the extension path mappings: \n${extensionPathsPretty}`);
                defaultApiImpl = factory(extensions_1.nullExtensionDescription, extensionRegistry, configProvider);
            }
            return defaultApiImpl;
        };
    }
});
//# sourceMappingURL=extHost.api.impl.js.map