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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/webview/electron-browser/webviewProtocols", "./webviewEditorService", "./webviewFindWidget", "vs/base/common/strings", "vs/base/common/platform"], function (require, exports, dom_1, event_1, lifecycle_1, uri_1, environment_1, files_1, instantiation_1, colorRegistry, themeService_1, webviewProtocols_1, webviewEditorService_1, webviewFindWidget_1, strings_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WebviewProtocolProvider extends lifecycle_1.Disposable {
        constructor(webview, _extensionLocation, _getLocalResourceRoots, _environmentService, _fileService) {
            super();
            this._extensionLocation = _extensionLocation;
            this._getLocalResourceRoots = _getLocalResourceRoots;
            this._environmentService = _environmentService;
            this._fileService = _fileService;
            let loaded = false;
            this._register(dom_1.addDisposableListener(webview, 'did-start-loading', () => {
                if (loaded) {
                    return;
                }
                loaded = true;
                const contents = webview.getWebContents();
                if (contents) {
                    this.registerFileProtocols(contents);
                }
            }));
        }
        registerFileProtocols(contents) {
            if (contents.isDestroyed()) {
                return;
            }
            const appRootUri = uri_1.URI.file(this._environmentService.appRoot);
            webviewProtocols_1.registerFileProtocol(contents, "vscode-core-resource" /* CoreResource */, this._fileService, null, () => [
                appRootUri
            ]);
            webviewProtocols_1.registerFileProtocol(contents, "vscode-resource" /* VsCodeResource */, this._fileService, this._extensionLocation, () => this._getLocalResourceRoots());
        }
    }
    class SvgBlocker extends lifecycle_1.Disposable {
        constructor(webview, _options) {
            super();
            this._options = _options;
            this._onDidBlockSvg = this._register(new event_1.Emitter());
            this.onDidBlockSvg = this._onDidBlockSvg.event;
            let loaded = false;
            this._register(dom_1.addDisposableListener(webview, 'did-start-loading', () => {
                if (loaded) {
                    return;
                }
                loaded = true;
                const contents = webview.getWebContents();
                if (!contents) {
                    return;
                }
                contents.session.webRequest.onBeforeRequest((details, callback) => {
                    if (details.url.indexOf('.svg') > 0) {
                        const uri = uri_1.URI.parse(details.url);
                        if (uri && !uri.scheme.match(/file/i) && strings_1.endsWith(uri.path, '.svg') && !this.isAllowedSvg(uri)) {
                            this._onDidBlockSvg.fire();
                            return callback({ cancel: true });
                        }
                    }
                    return callback({});
                });
                contents.session.webRequest.onHeadersReceived((details, callback) => {
                    const contentType = details.responseHeaders['content-type'] || details.responseHeaders['Content-Type'];
                    if (contentType && Array.isArray(contentType) && contentType.some(x => x.toLowerCase().indexOf('image/svg') >= 0)) {
                        const uri = uri_1.URI.parse(details.url);
                        if (uri && !this.isAllowedSvg(uri)) {
                            this._onDidBlockSvg.fire();
                            return callback({ cancel: true });
                        }
                    }
                    return callback({ cancel: false, responseHeaders: details.responseHeaders });
                });
            }));
        }
        isAllowedSvg(uri) {
            if (this._options.svgWhiteList) {
                return this._options.svgWhiteList.indexOf(uri.authority.toLowerCase()) >= 0;
            }
            return false;
        }
    }
    class WebviewKeyboardHandler extends lifecycle_1.Disposable {
        constructor(_webview) {
            super();
            this._webview = _webview;
            this._ignoreMenuShortcut = false;
            if (this.shouldToggleMenuShortcutsEnablement) {
                this._register(dom_1.addDisposableListener(this._webview, 'did-start-loading', () => {
                    const contents = this.getWebContents();
                    if (contents) {
                        contents.on('before-input-event', (_event, input) => {
                            if (input.type === 'keyDown' && document.activeElement === this._webview) {
                                this._ignoreMenuShortcut = input.control || input.meta;
                                this.setIgnoreMenuShortcuts(this._ignoreMenuShortcut);
                            }
                        });
                    }
                }));
            }
            this._register(dom_1.addDisposableListener(this._webview, 'ipc-message', (event) => {
                switch (event.channel) {
                    case 'did-keydown':
                        // Electron: workaround for https://github.com/electron/electron/issues/14258
                        // We have to detect keyboard events in the <webview> and dispatch them to our
                        // keybinding service because these events do not bubble to the parent window anymore.
                        this.handleKeydown(event.args[0]);
                        return;
                    case 'did-focus':
                        this.setIgnoreMenuShortcuts(this._ignoreMenuShortcut);
                        break;
                    case 'did-blur':
                        this.setIgnoreMenuShortcuts(false);
                        return;
                }
            }));
        }
        get shouldToggleMenuShortcutsEnablement() {
            return platform_1.isMacintosh;
        }
        setIgnoreMenuShortcuts(value) {
            if (!this.shouldToggleMenuShortcutsEnablement) {
                return;
            }
            const contents = this.getWebContents();
            if (contents) {
                contents.setIgnoreMenuShortcuts(value);
            }
        }
        getWebContents() {
            const contents = this._webview.getWebContents();
            if (contents && !contents.isDestroyed()) {
                return contents;
            }
            return undefined;
        }
        handleKeydown(event) {
            // Create a fake KeyboardEvent from the data provided
            const emulatedKeyboardEvent = new KeyboardEvent('keydown', event);
            // Force override the target
            Object.defineProperty(emulatedKeyboardEvent, 'target', {
                get: () => this._webview
            });
            // And re-dispatch
            window.dispatchEvent(emulatedKeyboardEvent);
        }
    }
    let WebviewElement = class WebviewElement extends lifecycle_1.Disposable {
        constructor(_styleElement, _options, _contentOptions, instantiationService, themeService, environmentService, fileService) {
            super();
            this._styleElement = _styleElement;
            this._options = _options;
            this._contentOptions = _contentOptions;
            this._findStarted = false;
            this._contents = '';
            this._state = undefined;
            this._focused = false;
            this._onDidFocus = this._register(new event_1.Emitter());
            this._onDidClickLink = this._register(new event_1.Emitter());
            this.onDidClickLink = this._onDidClickLink.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this._onDidUpdateState = this._register(new event_1.Emitter());
            this.onDidUpdateState = this._onDidUpdateState.event;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._webview = document.createElement('webview');
            this._webview.setAttribute('partition', `webview${Date.now()}`);
            this._webview.setAttribute('webpreferences', 'contextIsolation=yes');
            this._webview.style.flex = '0 1';
            this._webview.style.width = '0';
            this._webview.style.height = '0';
            this._webview.style.outline = '0';
            this._webview.preload = require.toUrl('./webview-pre.js');
            this._webview.src = 'data:text/html;charset=utf-8,%3C%21DOCTYPE%20html%3E%0D%0A%3Chtml%20lang%3D%22en%22%20style%3D%22width%3A%20100%25%3B%20height%3A%20100%25%22%3E%0D%0A%3Chead%3E%0D%0A%09%3Ctitle%3EVirtual%20Document%3C%2Ftitle%3E%0D%0A%3C%2Fhead%3E%0D%0A%3Cbody%20style%3D%22margin%3A%200%3B%20overflow%3A%20hidden%3B%20width%3A%20100%25%3B%20height%3A%20100%25%22%3E%0D%0A%3C%2Fbody%3E%0D%0A%3C%2Fhtml%3E';
            this._ready = new Promise(resolve => {
                const subscription = this._register(dom_1.addDisposableListener(this._webview, 'ipc-message', (event) => {
                    if (event.channel === 'webview-ready') {
                        // console.info('[PID Webview] ' event.args[0]);
                        dom_1.addClass(this._webview, 'ready'); // can be found by debug command
                        subscription.dispose();
                        resolve();
                    }
                }));
            });
            this._register(new WebviewProtocolProvider(this._webview, this._options.extensionLocation, () => (this._contentOptions.localResourceRoots || []), environmentService, fileService));
            if (!this._options.allowSvgs) {
                const svgBlocker = this._register(new SvgBlocker(this._webview, this._contentOptions));
                svgBlocker.onDidBlockSvg(() => this.onDidBlockSvg());
            }
            this._register(new WebviewKeyboardHandler(this._webview));
            this._register(dom_1.addDisposableListener(this._webview, 'console-message', function (e) {
                console.log(`[Embedded Page] ${e.message}`);
            }));
            this._register(dom_1.addDisposableListener(this._webview, 'dom-ready', () => {
                this.layout();
                // Workaround for https://github.com/electron/electron/issues/14474
                if (this._focused || document.activeElement === this._webview) {
                    this._webview.blur();
                    this._webview.focus();
                }
            }));
            this._register(dom_1.addDisposableListener(this._webview, 'crashed', () => {
                console.error('embedded page crashed');
            }));
            this._register(dom_1.addDisposableListener(this._webview, 'ipc-message', (event) => {
                switch (event.channel) {
                    case 'onmessage':
                        if (event.args && event.args.length) {
                            this._onMessage.fire(event.args[0]);
                        }
                        return;
                    case 'did-click-link':
                        let [uri] = event.args;
                        this._onDidClickLink.fire(uri_1.URI.parse(uri));
                        return;
                    case 'did-set-content':
                        this._webview.style.flex = '';
                        this._webview.style.width = '100%';
                        this._webview.style.height = '100%';
                        this.layout();
                        return;
                    case 'did-scroll':
                        if (event.args && typeof event.args[0] === 'number') {
                            this._onDidScroll.fire({ scrollYPercentage: event.args[0] });
                        }
                        return;
                    case 'do-reload':
                        this.reload();
                        return;
                    case 'do-update-state':
                        this._state = event.args[0];
                        this._onDidUpdateState.fire(this._state);
                        return;
                    case 'did-focus':
                        this.handleFocusChange(true);
                        return;
                    case 'did-blur':
                        this.handleFocusChange(false);
                        return;
                }
            }));
            this._register(dom_1.addDisposableListener(this._webview, 'devtools-opened', () => {
                this._send('devtools-opened');
            }));
            if (_options.enableFindWidget) {
                this._webviewFindWidget = this._register(instantiationService.createInstance(webviewFindWidget_1.WebviewFindWidget, this));
            }
            this.style(themeService.getTheme());
            themeService.onThemeChange(this.style, this, this._toDispose);
        }
        get onDidFocus() { return this._onDidFocus.event; }
        mountTo(parent) {
            if (this._webviewFindWidget) {
                parent.appendChild(this._webviewFindWidget.getDomNode());
            }
            parent.appendChild(this._webview);
        }
        dispose() {
            if (this._webview) {
                if (this._webview.parentElement) {
                    this._webview.parentElement.removeChild(this._webview);
                }
            }
            this._webview = undefined;
            this._webviewFindWidget = undefined;
            super.dispose();
        }
        _send(channel, ...args) {
            this._ready
                .then(() => this._webview.send(channel, ...args))
                .catch(err => console.error(err));
        }
        set initialScrollProgress(value) {
            this._send('initial-scroll-position', value);
        }
        set state(value) {
            this._state = value;
        }
        set options(value) {
            if (this._contentOptions && webviewEditorService_1.areWebviewInputOptionsEqual(value, this._contentOptions)) {
                return;
            }
            this._contentOptions = value;
            this._send('content', {
                contents: this._contents,
                options: this._contentOptions,
                state: this._state
            });
        }
        set contents(value) {
            this._contents = value;
            this._send('content', {
                contents: value,
                options: this._contentOptions,
                state: this._state
            });
        }
        update(value, options, retainContextWhenHidden) {
            if (retainContextWhenHidden && value === this._contents && this._contentOptions && webviewEditorService_1.areWebviewInputOptionsEqual(options, this._contentOptions)) {
                return;
            }
            this._contents = value;
            this._contentOptions = options;
            this._send('content', {
                contents: this._contents,
                options: this._contentOptions,
                state: this._state
            });
        }
        set baseUrl(value) {
            this._send('baseUrl', value);
        }
        focus() {
            this._webview.focus();
            this._send('focus');
            // Handle focus change programmatically (do not rely on event from <webview>)
            this.handleFocusChange(true);
        }
        handleFocusChange(isFocused) {
            this._focused = isFocused;
            if (isFocused) {
                this._onDidFocus.fire();
            }
        }
        sendMessage(data) {
            this._send('message', data);
        }
        onDidBlockSvg() {
            this.sendMessage({
                name: 'vscode-did-block-svg'
            });
        }
        style(theme) {
            const { fontFamily, fontWeight, fontSize } = window.getComputedStyle(this._styleElement); // TODO@theme avoid styleElement
            const exportedColors = colorRegistry.getColorRegistry().getColors().reduce((colors, entry) => {
                const color = theme.getColor(entry.id);
                if (color) {
                    colors['vscode-' + entry.id.replace('.', '-')] = color.toString();
                }
                return colors;
            }, {});
            const styles = Object.assign({ 'vscode-editor-font-family': fontFamily, 'vscode-editor-font-weight': fontWeight, 'vscode-editor-font-size': fontSize }, exportedColors);
            const activeTheme = ApiThemeClassName.fromTheme(theme);
            this._send('styles', styles, activeTheme);
            if (this._webviewFindWidget) {
                this._webviewFindWidget.updateTheme(theme);
            }
        }
        layout() {
            const contents = this._webview.getWebContents();
            if (!contents || contents.isDestroyed()) {
                return;
            }
            const window = contents.getOwnerBrowserWindow();
            if (!window || !window.webContents || window.webContents.isDestroyed()) {
                return;
            }
            window.webContents.getZoomFactor(factor => {
                if (contents.isDestroyed()) {
                    return;
                }
                contents.setZoomFactor(factor);
            });
        }
        startFind(value, options) {
            if (!value) {
                return;
            }
            // ensure options is defined without modifying the original
            options = options || {};
            // FindNext must be false for a first request
            const findOptions = {
                forward: options.forward,
                findNext: false,
                matchCase: options.matchCase,
                medialCapitalAsWordStart: options.medialCapitalAsWordStart
            };
            this._findStarted = true;
            this._webview.findInPage(value, findOptions);
        }
        /**
         * Webviews expose a stateful find API.
         * Successive calls to find will move forward or backward through onFindResults
         * depending on the supplied options.
         *
         * @param value The string to search for. Empty strings are ignored.
         */
        find(value, options) {
            // Searching with an empty value will throw an exception
            if (!value) {
                return;
            }
            if (!this._findStarted) {
                this.startFind(value, options);
                return;
            }
            this._webview.findInPage(value, options);
        }
        stopFind(keepSelection) {
            this._findStarted = false;
            this._webview.stopFindInPage(keepSelection ? 'keepSelection' : 'clearSelection');
        }
        showFind() {
            if (this._webviewFindWidget) {
                this._webviewFindWidget.reveal();
            }
        }
        hideFind() {
            if (this._webviewFindWidget) {
                this._webviewFindWidget.hide();
            }
        }
        reload() {
            this.contents = this._contents;
        }
        selectAll() {
            this._webview.selectAll();
        }
        copy() {
            this._webview.copy();
        }
        paste() {
            this._webview.paste();
        }
        cut() {
            this._webview.cut();
        }
        undo() {
            this._webview.undo();
        }
        redo() {
            this._webview.redo();
        }
    };
    WebviewElement = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, themeService_1.IThemeService),
        __param(5, environment_1.IEnvironmentService),
        __param(6, files_1.IFileService)
    ], WebviewElement);
    exports.WebviewElement = WebviewElement;
    var ApiThemeClassName;
    (function (ApiThemeClassName) {
        ApiThemeClassName["light"] = "vscode-light";
        ApiThemeClassName["dark"] = "vscode-dark";
        ApiThemeClassName["highContrast"] = "vscode-high-contrast";
    })(ApiThemeClassName || (ApiThemeClassName = {}));
    (function (ApiThemeClassName) {
        function fromTheme(theme) {
            if (theme.type === themeService_1.LIGHT) {
                return ApiThemeClassName.light;
            }
            else if (theme.type === themeService_1.DARK) {
                return ApiThemeClassName.dark;
            }
            else {
                return ApiThemeClassName.highContrast;
            }
        }
        ApiThemeClassName.fromTheme = fromTheme;
    })(ApiThemeClassName || (ApiThemeClassName = {}));
});
//# sourceMappingURL=webviewElement.js.map