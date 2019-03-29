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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/common/lifecycle", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/workbench/api/node/extHost.protocol", "vs/workbench/api/shared/editor", "vs/workbench/contrib/codeinset/electron-browser/codeInset.contribution", "vs/workbench/contrib/webview/electron-browser/webviewEditor", "vs/workbench/contrib/webview/electron-browser/webviewEditorInput", "vs/workbench/contrib/webview/electron-browser/webviewEditorService", "vs/workbench/contrib/webview/electron-browser/webviewElement", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/layout/browser/layoutService", "./extHostCustomers"], function (require, exports, errors_1, lifecycle_1, map, uri_1, codeEditorService_1, nls_1, instantiation_1, lifecycle_2, opener_1, telemetry_1, extHost_protocol_1, editor_1, codeInset_contribution_1, webviewEditor_1, webviewEditorInput_1, webviewEditorService_1, webviewElement_1, editorGroupsService_1, editorService_1, extensions_1, layoutService_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MainThreadWebviews_1;
    "use strict";
    let MainThreadWebviews = MainThreadWebviews_1 = class MainThreadWebviews extends lifecycle_1.Disposable {
        constructor(context, lifecycleService, extensionService, _editorGroupService, _editorService, _webviewService, _openerService, _telemetryService, _instantiationService, _codeEditorService, _layoutService) {
            super();
            this._editorGroupService = _editorGroupService;
            this._editorService = _editorService;
            this._webviewService = _webviewService;
            this._openerService = _openerService;
            this._telemetryService = _telemetryService;
            this._instantiationService = _instantiationService;
            this._codeEditorService = _codeEditorService;
            this._layoutService = _layoutService;
            this._webviews = new Map();
            this._webviewsElements = new Map();
            this._revivers = new Map();
            this._activeWebview = undefined;
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostWebviews);
            _editorService.onDidActiveEditorChange(this.onActiveEditorChanged, this, this._toDispose);
            _editorService.onDidVisibleEditorsChange(this.onVisibleEditorsChanged, this, this._toDispose);
            // This reviver's only job is to activate webview extensions
            // This should trigger the real reviver to be registered from the extension host side.
            this._toDispose.push(_webviewService.registerReviver({
                canRevive: (webview) => {
                    const viewType = webview.state.viewType;
                    if (viewType) {
                        extensionService.activateByEvent(`onWebviewPanel:${viewType}`);
                    }
                    return false;
                },
                reviveWebview: () => { throw new Error('not implemented'); }
            }));
            lifecycleService.onBeforeShutdown(e => {
                e.veto(this._onBeforeShutdown());
            }, this, this._toDispose);
        }
        $createWebviewPanel(handle, viewType, title, showOptions, options, extensionId, extensionLocation) {
            const mainThreadShowOptions = Object.create(null);
            if (showOptions) {
                mainThreadShowOptions.preserveFocus = !!showOptions.preserveFocus;
                mainThreadShowOptions.group = editor_1.viewColumnToEditorGroup(this._editorGroupService, showOptions.viewColumn);
            }
            const webview = this._webviewService.createWebview(this.getInternalWebviewId(viewType), title, mainThreadShowOptions, reviveWebviewOptions(options), uri_1.URI.revive(extensionLocation), this.createWebviewEventDelegate(handle));
            webview.state = {
                viewType: viewType,
                state: undefined
            };
            this._webviews.set(handle, webview);
            this._activeWebview = handle;
            /* __GDPR__
                "webviews:createWebviewPanel" : {
                    "extensionId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this._telemetryService.publicLog('webviews:createWebviewPanel', { extensionId: extensionId.value });
        }
        $createWebviewCodeInset(handle, symbolId, options, extensionLocation) {
            // todo@joh main is for the lack of a code-inset service
            // which we maybe wanna have... this is how it now works
            // 1) create webview element
            // 2) find the code inset controller that request it
            // 3) let the controller adopt the widget
            // 4) continue to forward messages to the webview
            const webview = this._instantiationService.createInstance(webviewElement_1.WebviewElement, this._layoutService.getContainer("workbench.parts.editor" /* EDITOR_PART */), {
                extensionLocation: uri_1.URI.revive(extensionLocation),
                enableFindWidget: false,
            }, {
                allowScripts: options.enableScripts,
            });
            let found = false;
            for (const editor of this._codeEditorService.listCodeEditors()) {
                const ctrl = codeInset_contribution_1.CodeInsetController.get(editor);
                if (ctrl && ctrl.acceptWebview(symbolId, webview)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                webview.dispose();
                return;
            }
            // this will leak... the adopted webview will be disposed by the
            // code inset controller. we might need a dispose-event here so that
            // we can clean up things.
            this._webviewsElements.set(handle, webview);
        }
        $disposeWebview(handle) {
            const webview = this.getWebview(handle);
            webview.dispose();
        }
        $setTitle(handle, value) {
            const webview = this.getWebview(handle);
            webview.setName(value);
        }
        $setIconPath(handle, value) {
            const webview = this.getWebview(handle);
            webview.iconPath = reviveWebviewIcon(value);
        }
        $setHtml(handle, value) {
            if (typeof handle === 'number') {
                this.getWebviewElement(handle).contents = value;
            }
            else {
                const webview = this.getWebview(handle);
                webview.html = value;
            }
        }
        $setOptions(handle, options) {
            if (typeof handle === 'number') {
                this.getWebviewElement(handle).options = reviveWebviewOptions(options);
            }
            else {
                const webview = this.getWebview(handle);
                webview.setOptions(reviveWebviewOptions(options));
            }
        }
        $reveal(handle, showOptions) {
            const webview = this.getWebview(handle);
            if (webview.isDisposed()) {
                return;
            }
            const targetGroup = this._editorGroupService.getGroup(editor_1.viewColumnToEditorGroup(this._editorGroupService, showOptions.viewColumn));
            if (targetGroup) {
                this._webviewService.revealWebview(webview, targetGroup || this._editorGroupService.getGroup(webview.group || editorService_1.ACTIVE_GROUP), !!showOptions.preserveFocus);
            }
        }
        $postMessage(handle, message) {
            if (typeof handle === 'number') {
                this.getWebviewElement(handle).sendMessage(message);
                return Promise.resolve(true);
            }
            else {
                const webview = this.getWebview(handle);
                const editors = this._editorService.visibleControls
                    .filter(e => e instanceof webviewEditor_1.WebviewEditor)
                    .map(e => e)
                    .filter(e => e.input.matches(webview));
                for (const editor of editors) {
                    editor.sendMessage(message);
                }
                return Promise.resolve(editors.length > 0);
            }
        }
        $registerSerializer(viewType) {
            if (this._revivers.has(viewType)) {
                throw new Error(`Reviver for ${viewType} already registered`);
            }
            this._revivers.set(viewType, this._webviewService.registerReviver({
                canRevive: (webview) => {
                    return webview.state && webview.state.viewType === viewType;
                },
                reviveWebview: (webview) => __awaiter(this, void 0, void 0, function* () {
                    const viewType = webview.state.viewType;
                    const handle = 'revival-' + MainThreadWebviews_1.revivalPool++;
                    this._webviews.set(handle, webview);
                    webview._events = this.createWebviewEventDelegate(handle);
                    let state = undefined;
                    if (webview.state.state) {
                        try {
                            state = JSON.parse(webview.state.state);
                        }
                        catch (_a) {
                            // noop
                        }
                    }
                    try {
                        yield this._proxy.$deserializeWebviewPanel(handle, viewType, webview.getTitle(), state, editor_1.editorGroupToViewColumn(this._editorGroupService, webview.group || editorService_1.ACTIVE_GROUP), webview.options);
                    }
                    catch (error) {
                        errors_1.onUnexpectedError(error);
                        webview.html = MainThreadWebviews_1.getDeserializationFailedContents(viewType);
                    }
                })
            }));
        }
        $unregisterSerializer(viewType) {
            const reviver = this._revivers.get(viewType);
            if (!reviver) {
                throw new Error(`No reviver for ${viewType} registered`);
            }
            reviver.dispose();
            this._revivers.delete(viewType);
        }
        getInternalWebviewId(viewType) {
            return `mainThreadWebview-${viewType}`;
        }
        _onBeforeShutdown() {
            this._webviews.forEach((webview) => {
                if (!webview.isDisposed() && webview.state && this._revivers.has(webview.state.viewType)) {
                    webview.state.state = webview.webviewState;
                }
            });
            return false; // Don't veto shutdown
        }
        createWebviewEventDelegate(handle) {
            return {
                onDidClickLink: uri => this.onDidClickLink(handle, uri),
                onMessage: message => this._proxy.$onMessage(handle, message),
                onDispose: () => {
                    this._proxy.$onDidDisposeWebviewPanel(handle).finally(() => {
                        this._webviews.delete(handle);
                    });
                }
            };
        }
        onActiveEditorChanged() {
            const activeEditor = this._editorService.activeControl;
            let newActiveWebview = undefined;
            if (activeEditor && activeEditor.input instanceof webviewEditorInput_1.WebviewEditorInput) {
                for (const handle of map.keys(this._webviews)) {
                    const input = this._webviews.get(handle);
                    if (input.matches(activeEditor.input)) {
                        newActiveWebview = { input, handle };
                        break;
                    }
                }
            }
            if (newActiveWebview && newActiveWebview.handle === this._activeWebview) {
                // Webview itself unchanged but position may have changed
                this._proxy.$onDidChangeWebviewPanelViewState(newActiveWebview.handle, {
                    active: true,
                    visible: true,
                    position: editor_1.editorGroupToViewColumn(this._editorGroupService, newActiveWebview.input.group || editorService_1.ACTIVE_GROUP)
                });
                return;
            }
            // Broadcast view state update for currently active
            if (typeof this._activeWebview !== 'undefined') {
                const oldActiveWebview = this._webviews.get(this._activeWebview);
                if (oldActiveWebview) {
                    this._proxy.$onDidChangeWebviewPanelViewState(this._activeWebview, {
                        active: false,
                        visible: this._editorService.visibleControls.some(editor => !!editor.input && editor.input.matches(oldActiveWebview)),
                        position: editor_1.editorGroupToViewColumn(this._editorGroupService, oldActiveWebview.group || editorService_1.ACTIVE_GROUP),
                    });
                }
            }
            // Then for newly active
            if (newActiveWebview) {
                this._proxy.$onDidChangeWebviewPanelViewState(newActiveWebview.handle, {
                    active: true,
                    visible: true,
                    position: editor_1.editorGroupToViewColumn(this._editorGroupService, activeEditor ? activeEditor.group : editorService_1.ACTIVE_GROUP),
                });
                this._activeWebview = newActiveWebview.handle;
            }
            else {
                this._activeWebview = undefined;
            }
        }
        onVisibleEditorsChanged() {
            this._webviews.forEach((input, handle) => {
                for (const workbenchEditor of this._editorService.visibleControls) {
                    if (workbenchEditor.input && workbenchEditor.input.matches(input)) {
                        const editorPosition = editor_1.editorGroupToViewColumn(this._editorGroupService, workbenchEditor.group);
                        input.updateGroup(workbenchEditor.group.id);
                        this._proxy.$onDidChangeWebviewPanelViewState(handle, {
                            active: handle === this._activeWebview,
                            visible: true,
                            position: editorPosition
                        });
                        break;
                    }
                }
            });
        }
        onDidClickLink(handle, link) {
            if (!link) {
                return;
            }
            const webview = this.getWebview(handle);
            const enableCommandUris = webview.options.enableCommandUris;
            if (MainThreadWebviews_1.standardSupportedLinkSchemes.indexOf(link.scheme) >= 0 || enableCommandUris && link.scheme === 'command') {
                this._openerService.open(link);
            }
        }
        getWebview(handle) {
            const webview = this._webviews.get(handle);
            if (!webview) {
                throw new Error('Unknown webview handle:' + handle);
            }
            return webview;
        }
        getWebviewElement(handle) {
            const webview = this._webviewsElements.get(handle);
            if (!webview) {
                throw new Error('Unknown webview handle:' + handle);
            }
            return webview;
        }
        static getDeserializationFailedContents(viewType) {
            return `<!DOCTYPE html>
		<html>
			<head>
				<base href="https://code.visualstudio.com/raw/">
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https:; script-src 'none'; style-src vscode-core-resource: https: 'unsafe-inline'; child-src 'none'; frame-src 'none';">
			</head>
			<body>${nls_1.localize('errorMessage', "An error occurred while restoring view:{0}", viewType)}</body>
		</html>`;
        }
    };
    MainThreadWebviews.standardSupportedLinkSchemes = ['http', 'https', 'mailto'];
    MainThreadWebviews.revivalPool = 0;
    MainThreadWebviews = MainThreadWebviews_1 = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadWebviews),
        __param(1, lifecycle_2.ILifecycleService),
        __param(2, extensions_1.IExtensionService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, editorService_1.IEditorService),
        __param(5, webviewEditorService_1.IWebviewEditorService),
        __param(6, opener_1.IOpenerService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, codeEditorService_1.ICodeEditorService),
        __param(10, layoutService_1.IWorkbenchLayoutService)
    ], MainThreadWebviews);
    exports.MainThreadWebviews = MainThreadWebviews;
    function reviveWebviewOptions(options) {
        return Object.assign({}, options, { localResourceRoots: Array.isArray(options.localResourceRoots) ? options.localResourceRoots.map(uri_1.URI.revive) : undefined });
    }
    function reviveWebviewIcon(value) {
        if (!value) {
            return undefined;
        }
        return {
            light: uri_1.URI.revive(value.light),
            dark: uri_1.URI.revive(value.dark)
        };
    }
});
//# sourceMappingURL=mainThreadWebview.js.map