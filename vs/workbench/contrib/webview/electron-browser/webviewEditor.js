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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/windows/common/windows", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/contrib/webview/electron-browser/webviewEditorInput", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/layout/browser/layoutService", "./webviewElement"], function (require, exports, DOM, event_1, lifecycle_1, contextkey_1, instantiation_1, storage_1, telemetry_1, themeService_1, windows_1, workspace_1, baseEditor_1, webviewEditorInput_1, editorService_1, layoutService_1, webviewElement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**  A context key that is set when the find widget in a webview is visible. */
    exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE = new contextkey_1.RawContextKey('webviewFindWidgetVisible', false);
    let WebviewEditor = class WebviewEditor extends baseEditor_1.BaseEditor {
        constructor(telemetryService, themeService, _contextKeyService, _layoutService, _contextService, _instantiationService, _editorService, _windowService, storageService) {
            super(WebviewEditor.ID, telemetryService, themeService, storageService);
            this._contextKeyService = _contextKeyService;
            this._layoutService = _layoutService;
            this._contextService = _contextService;
            this._instantiationService = _instantiationService;
            this._editorService = _editorService;
            this._windowService = _windowService;
            this._webviewFocusTrackerDisposables = [];
            this._onDidFocusWebview = this._register(new event_1.Emitter());
            this.pendingMessages = [];
            if (_contextKeyService) {
                this.findWidgetVisible = exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE.bindTo(_contextKeyService);
            }
        }
        get onDidFocus() { return this._onDidFocusWebview.event; }
        createEditor(parent) {
            this._editorFrame = parent;
            this._content = document.createElement('div');
            parent.appendChild(this._content);
        }
        doUpdateContainer() {
            const webviewContainer = this.input && this.input.container;
            if (webviewContainer && webviewContainer.parentElement) {
                const frameRect = this._editorFrame.getBoundingClientRect();
                const containerRect = webviewContainer.parentElement.getBoundingClientRect();
                webviewContainer.style.position = 'absolute';
                webviewContainer.style.top = `${frameRect.top - containerRect.top}px`;
                webviewContainer.style.left = `${frameRect.left - containerRect.left}px`;
                webviewContainer.style.width = `${frameRect.width}px`;
                webviewContainer.style.height = `${frameRect.height}px`;
            }
        }
        dispose() {
            this.pendingMessages = [];
            // Let the editor input dispose of the webview.
            this._webview = undefined;
            this._webviewContent = undefined;
            if (this._content && this._content.parentElement) {
                this._content.parentElement.removeChild(this._content);
                this._content = undefined;
            }
            this._webviewFocusTrackerDisposables = lifecycle_1.dispose(this._webviewFocusTrackerDisposables);
            if (this._onFocusWindowHandler) {
                this._onFocusWindowHandler.dispose();
            }
            super.dispose();
        }
        sendMessage(data) {
            if (this._webview) {
                this._webview.sendMessage(data);
            }
            else {
                this.pendingMessages.push(data);
            }
        }
        showFind() {
            if (this._webview) {
                this._webview.showFind();
                this.findWidgetVisible.set(true);
            }
        }
        hideFind() {
            this.findWidgetVisible.reset();
            if (this._webview) {
                this._webview.hideFind();
            }
        }
        get isWebviewEditor() {
            return true;
        }
        reload() {
            this.withWebviewElement(webview => webview.reload());
        }
        layout(_dimension) {
            this.withWebviewElement(webview => {
                this.doUpdateContainer();
                webview.layout();
            });
        }
        focus() {
            super.focus();
            if (!this._onFocusWindowHandler) {
                // Make sure we restore focus when switching back to a VS Code window
                this._onFocusWindowHandler = this._windowService.onDidChangeFocus(focused => {
                    if (focused && this._editorService.activeControl === this) {
                        this.focus();
                    }
                });
            }
            this.withWebviewElement(webview => webview.focus());
        }
        selectAll() {
            this.withWebviewElement(webview => webview.selectAll());
        }
        copy() {
            this.withWebviewElement(webview => webview.copy());
        }
        paste() {
            this.withWebviewElement(webview => webview.paste());
        }
        cut() {
            this.withWebviewElement(webview => webview.cut());
        }
        undo() {
            this.withWebviewElement(webview => webview.undo());
        }
        redo() {
            this.withWebviewElement(webview => webview.redo());
        }
        withWebviewElement(f) {
            if (this._webview) {
                f(this._webview);
            }
        }
        setEditorVisible(visible, group) {
            if (this.input && this.input instanceof webviewEditorInput_1.WebviewEditorInput) {
                if (visible) {
                    this.input.claimWebview(this);
                }
                else {
                    this.input.releaseWebview(this);
                }
                this.updateWebview(this.input);
            }
            if (this._webviewContent) {
                if (visible) {
                    this._webviewContent.style.visibility = 'visible';
                    this.doUpdateContainer();
                }
                else {
                    this._webviewContent.style.visibility = 'hidden';
                }
            }
            super.setEditorVisible(visible, group);
        }
        clearInput() {
            if (this.input && this.input instanceof webviewEditorInput_1.WebviewEditorInput) {
                this.input.releaseWebview(this);
            }
            this._webview = undefined;
            this._webviewContent = undefined;
            this.pendingMessages = [];
            super.clearInput();
        }
        setInput(input, options, token) {
            if (this.input) {
                this.input.releaseWebview(this);
                this._webview = undefined;
                this._webviewContent = undefined;
            }
            this.pendingMessages = [];
            return super.setInput(input, options, token)
                .then(() => input.resolve())
                .then(() => {
                if (token.isCancellationRequested) {
                    return;
                }
                if (this.group) {
                    input.updateGroup(this.group.id);
                }
                this.updateWebview(input);
            });
        }
        updateWebview(input) {
            const webview = this.getWebview(input);
            input.claimWebview(this);
            webview.update(input.html, {
                allowScripts: input.options.enableScripts,
                localResourceRoots: input.options.localResourceRoots || this.getDefaultLocalResourceRoots(),
            }, !!input.options.retainContextWhenHidden);
            if (this._webviewContent) {
                this._webviewContent.style.visibility = 'visible';
            }
            this.doUpdateContainer();
        }
        getDefaultLocalResourceRoots() {
            const rootPaths = this._contextService.getWorkspace().folders.map(x => x.uri);
            const extensionLocation = this.input.extensionLocation;
            if (extensionLocation) {
                rootPaths.push(extensionLocation);
            }
            return rootPaths;
        }
        getWebview(input) {
            if (this._webview) {
                return this._webview;
            }
            this._webviewContent = input.container;
            if (input.webview) {
                this._webview = input.webview;
            }
            else {
                if (input.options.enableFindWidget) {
                    this._contextKeyService = this._register(this._contextKeyService.createScoped(this._webviewContent));
                    this.findWidgetVisible = exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE.bindTo(this._contextKeyService);
                }
                this._webview = this._instantiationService.createInstance(webviewElement_1.WebviewElement, this._layoutService.getContainer("workbench.parts.editor" /* EDITOR_PART */), {
                    allowSvgs: true,
                    extensionLocation: input.extensionLocation,
                    enableFindWidget: input.options.enableFindWidget
                }, {});
                this._webview.mountTo(this._webviewContent);
                input.webview = this._webview;
                if (input.options.tryRestoreScrollPosition) {
                    this._webview.initialScrollProgress = input.scrollYPercentage;
                }
                this._webview.state = input.webviewState;
                this._content.setAttribute('aria-flowto', this._webviewContent.id);
                this.doUpdateContainer();
            }
            for (const message of this.pendingMessages) {
                this._webview.sendMessage(message);
            }
            this.pendingMessages = [];
            this.trackFocus();
            return this._webview;
        }
        trackFocus() {
            this._webviewFocusTrackerDisposables = lifecycle_1.dispose(this._webviewFocusTrackerDisposables);
            // Track focus in webview content
            const webviewContentFocusTracker = DOM.trackFocus(this._webviewContent);
            this._webviewFocusTrackerDisposables.push(webviewContentFocusTracker);
            this._webviewFocusTrackerDisposables.push(webviewContentFocusTracker.onDidFocus(() => this._onDidFocusWebview.fire()));
            // Track focus in webview element
            this._webviewFocusTrackerDisposables.push(this._webview.onDidFocus(() => this._onDidFocusWebview.fire()));
        }
    };
    WebviewEditor.ID = 'WebviewEditor';
    WebviewEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, editorService_1.IEditorService),
        __param(7, windows_1.IWindowService),
        __param(8, storage_1.IStorageService)
    ], WebviewEditor);
    exports.WebviewEditor = WebviewEditor;
});
//# sourceMappingURL=webviewEditor.js.map