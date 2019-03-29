/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/workbench/api/node/extHostTypeConverters", "./extHost.protocol", "./extHostTypes"], function (require, exports, event_1, uri_1, typeConverters, extHost_protocol_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostWebview {
        constructor(handle, proxy, options) {
            this._isDisposed = false;
            this._onMessageEmitter = new event_1.Emitter();
            this.onDidReceiveMessage = this._onMessageEmitter.event;
            this._handle = handle;
            this._proxy = proxy;
            this._options = options;
        }
        dispose() {
            this._onMessageEmitter.dispose();
        }
        get html() {
            this.assertNotDisposed();
            return this._html;
        }
        set html(value) {
            this.assertNotDisposed();
            if (this._html !== value) {
                this._html = value;
                this._proxy.$setHtml(this._handle, value);
            }
        }
        get options() {
            this.assertNotDisposed();
            return this._options;
        }
        set options(newOptions) {
            this.assertNotDisposed();
            this._proxy.$setOptions(this._handle, newOptions);
            this._options = newOptions;
        }
        postMessage(message) {
            this.assertNotDisposed();
            return this._proxy.$postMessage(this._handle, message);
        }
        assertNotDisposed() {
            if (this._isDisposed) {
                throw new Error('Webview is disposed');
            }
        }
    }
    exports.ExtHostWebview = ExtHostWebview;
    class ExtHostWebviewPanel {
        constructor(handle, proxy, viewType, title, viewColumn, editorOptions, webview) {
            this._isDisposed = false;
            this._visible = true;
            this._active = true;
            this._onDisposeEmitter = new event_1.Emitter();
            this.onDidDispose = this._onDisposeEmitter.event;
            this._onDidChangeViewStateEmitter = new event_1.Emitter();
            this.onDidChangeViewState = this._onDidChangeViewStateEmitter.event;
            this._handle = handle;
            this._proxy = proxy;
            this._viewType = viewType;
            this._options = editorOptions;
            this._viewColumn = viewColumn;
            this._title = title;
            this._webview = webview;
        }
        dispose() {
            if (this._isDisposed) {
                return;
            }
            this._isDisposed = true;
            this._onDisposeEmitter.fire();
            this._proxy.$disposeWebview(this._handle);
            this._webview.dispose();
            this._onDisposeEmitter.dispose();
            this._onDidChangeViewStateEmitter.dispose();
        }
        get webview() {
            this.assertNotDisposed();
            return this._webview;
        }
        get viewType() {
            this.assertNotDisposed();
            return this._viewType;
        }
        get title() {
            this.assertNotDisposed();
            return this._title;
        }
        set title(value) {
            this.assertNotDisposed();
            if (this._title !== value) {
                this._title = value;
                this._proxy.$setTitle(this._handle, value);
            }
        }
        get iconPath() {
            this.assertNotDisposed();
            return this._iconPath;
        }
        set iconPath(value) {
            this.assertNotDisposed();
            if (this._iconPath !== value) {
                this._iconPath = value;
                this._proxy.$setIconPath(this._handle, uri_1.URI.isUri(value) ? { light: value, dark: value } : value);
            }
        }
        get options() {
            return this._options;
        }
        get viewColumn() {
            this.assertNotDisposed();
            if (typeof this._viewColumn === 'number' && this._viewColumn < 0) {
                // We are using a symbolic view column
                // Return undefined instead to indicate that the real view column is currently unknown but will be resolved.
                return undefined;
            }
            return this._viewColumn;
        }
        _setViewColumn(value) {
            this.assertNotDisposed();
            this._viewColumn = value;
        }
        get active() {
            this.assertNotDisposed();
            return this._active;
        }
        _setActive(value) {
            this.assertNotDisposed();
            this._active = value;
        }
        get visible() {
            this.assertNotDisposed();
            return this._visible;
        }
        _setVisible(value) {
            this.assertNotDisposed();
            this._visible = value;
        }
        postMessage(message) {
            this.assertNotDisposed();
            return this._proxy.$postMessage(this._handle, message);
        }
        reveal(viewColumn, preserveFocus) {
            this.assertNotDisposed();
            this._proxy.$reveal(this._handle, {
                viewColumn: viewColumn ? typeConverters.ViewColumn.from(viewColumn) : undefined,
                preserveFocus: !!preserveFocus
            });
        }
        assertNotDisposed() {
            if (this._isDisposed) {
                throw new Error('Webview is disposed');
            }
        }
    }
    exports.ExtHostWebviewPanel = ExtHostWebviewPanel;
    class ExtHostWebviews {
        constructor(mainContext) {
            this._webviewPanels = new Map();
            this._serializers = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadWebviews);
        }
        static newHandle() {
            return ExtHostWebviews.webviewHandlePool++ + '';
        }
        createWebviewPanel(extension, viewType, title, showOptions, options = {}) {
            const viewColumn = typeof showOptions === 'object' ? showOptions.viewColumn : showOptions;
            const webviewShowOptions = {
                viewColumn: typeConverters.ViewColumn.from(viewColumn),
                preserveFocus: typeof showOptions === 'object' && !!showOptions.preserveFocus
            };
            const handle = ExtHostWebviews.newHandle();
            this._proxy.$createWebviewPanel(handle, viewType, title, webviewShowOptions, options, extension.identifier, extension.extensionLocation);
            const webview = new ExtHostWebview(handle, this._proxy, options);
            const panel = new ExtHostWebviewPanel(handle, this._proxy, viewType, title, viewColumn, options, webview);
            this._webviewPanels.set(handle, panel);
            return panel;
        }
        registerWebviewPanelSerializer(viewType, serializer) {
            if (this._serializers.has(viewType)) {
                throw new Error(`Serializer for '${viewType}' already registered`);
            }
            this._serializers.set(viewType, serializer);
            this._proxy.$registerSerializer(viewType);
            return new extHostTypes_1.Disposable(() => {
                this._serializers.delete(viewType);
                this._proxy.$unregisterSerializer(viewType);
            });
        }
        $onMessage(handle, message) {
            const panel = this.getWebviewPanel(handle);
            if (panel) {
                panel.webview._onMessageEmitter.fire(message);
            }
        }
        $onDidChangeWebviewPanelViewState(handle, newState) {
            const panel = this.getWebviewPanel(handle);
            if (!panel) {
                return;
            }
            const viewColumn = typeConverters.ViewColumn.to(newState.position);
            if (panel.active !== newState.active || panel.visible !== newState.visible || panel.viewColumn !== viewColumn) {
                panel._setActive(newState.active);
                panel._setVisible(newState.visible);
                panel._setViewColumn(viewColumn);
                panel._onDidChangeViewStateEmitter.fire({ webviewPanel: panel });
            }
        }
        $onDidDisposeWebviewPanel(handle) {
            const panel = this.getWebviewPanel(handle);
            if (panel) {
                panel.dispose();
                this._webviewPanels.delete(handle);
            }
            return Promise.resolve(undefined);
        }
        $deserializeWebviewPanel(webviewHandle, viewType, title, state, position, options) {
            const serializer = this._serializers.get(viewType);
            if (!serializer) {
                return Promise.reject(new Error(`No serializer found for '${viewType}'`));
            }
            const webview = new ExtHostWebview(webviewHandle, this._proxy, options);
            const revivedPanel = new ExtHostWebviewPanel(webviewHandle, this._proxy, viewType, title, typeof position === 'number' && position >= 0 ? typeConverters.ViewColumn.to(position) : undefined, options, webview);
            this._webviewPanels.set(webviewHandle, revivedPanel);
            return Promise.resolve(serializer.deserializeWebviewPanel(revivedPanel, state));
        }
        getWebviewPanel(handle) {
            return this._webviewPanels.get(handle);
        }
    }
    ExtHostWebviews.webviewHandlePool = 1;
    exports.ExtHostWebviews = ExtHostWebviews;
});
//# sourceMappingURL=extHostWebview.js.map