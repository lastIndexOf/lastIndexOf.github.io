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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/common/editor", "vs/workbench/services/layout/browser/layoutService"], function (require, exports, dom, event_1, lifecycle_1, uri_1, editor_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WebviewEditorInput = class WebviewEditorInput extends editor_1.EditorInput {
        constructor(viewType, id, name, options, state, events, extensionLocation, _layoutService) {
            super();
            this.viewType = viewType;
            this._layoutService = _layoutService;
            this._html = '';
            this._currentWebviewHtml = '';
            this._webviewDisposables = [];
            this._scrollYPercentage = 0;
            this._onDidChangeIcon = this._register(new event_1.Emitter());
            this.onDidChangeIcon = this._onDidChangeIcon.event;
            if (typeof id === 'number') {
                this._id = id;
                WebviewEditorInput.handlePool = Math.max(id, WebviewEditorInput.handlePool) + 1;
            }
            else {
                this._id = WebviewEditorInput.handlePool++;
            }
            this._name = name;
            this._options = options;
            this._events = events;
            this._state = state;
            this.extensionLocation = extensionLocation;
        }
        static updateStyleElement(id, iconPath) {
            if (!this._styleElement) {
                this._styleElement = dom.createStyleSheet();
                this._styleElement.className = 'webview-icons';
            }
            if (!iconPath) {
                this._icons.delete(id);
            }
            else {
                this._icons.set(id, iconPath);
            }
            const cssRules = [];
            this._icons.forEach((value, key) => {
                const webviewSelector = `.show-file-icons .webview-${key}-name-file-icon::before`;
                if (uri_1.URI.isUri(value)) {
                    cssRules.push(`${webviewSelector} { content: ""; background-image: url(${value.toString()}); }`);
                }
                else {
                    cssRules.push(`.vs ${webviewSelector} { content: ""; background-image: url(${value.light.toString()}); }`);
                    cssRules.push(`.vs-dark ${webviewSelector} { content: ""; background-image: url(${value.dark.toString()}); }`);
                }
            });
            this._styleElement.innerHTML = cssRules.join('\n');
        }
        getTypeId() {
            return WebviewEditorInput.typeId;
        }
        getId() {
            return this._id;
        }
        dispose() {
            this.disposeWebview();
            if (this._container) {
                this._container.remove();
                this._container = undefined;
            }
            if (this._events && this._events.onDispose) {
                this._events.onDispose();
            }
            this._events = undefined;
            this._webview = undefined;
            super.dispose();
        }
        getResource() {
            return uri_1.URI.from({
                scheme: 'webview-panel',
                path: `webview-panel/webview-${this._id}`
            });
        }
        getName() {
            return this._name;
        }
        getTitle() {
            return this.getName();
        }
        getDescription() {
            return null;
        }
        setName(value) {
            this._name = value;
            this._onDidChangeLabel.fire();
        }
        get iconPath() {
            return this._iconPath;
        }
        set iconPath(value) {
            this._iconPath = value;
            WebviewEditorInput.updateStyleElement(this._id, value);
        }
        matches(other) {
            return other === this || (other instanceof WebviewEditorInput && other._id === this._id);
        }
        get group() {
            return this._group;
        }
        get html() {
            return this._html;
        }
        set html(value) {
            if (value === this._currentWebviewHtml) {
                return;
            }
            this._html = value;
            if (this._webview) {
                this._webview.contents = value;
                this._currentWebviewHtml = value;
            }
        }
        get state() {
            return this._state;
        }
        set state(value) {
            this._state = value;
        }
        get webviewState() {
            return this._state.state;
        }
        get options() {
            return this._options;
        }
        setOptions(value) {
            this._options = Object.assign({}, this._options, value);
            if (this._webview) {
                this._webview.options = {
                    allowScripts: this._options.enableScripts,
                    localResourceRoots: this._options.localResourceRoots
                };
            }
        }
        resolve() {
            return Promise.resolve(new editor_1.EditorModel());
        }
        supportsSplitEditor() {
            return false;
        }
        get container() {
            if (!this._container) {
                this._container = document.createElement('div');
                this._container.id = `webview-${this._id}`;
                const part = this._layoutService.getContainer("workbench.parts.editor" /* EDITOR_PART */);
                if (part) {
                    part.appendChild(this._container);
                }
            }
            return this._container;
        }
        get webview() {
            return this._webview;
        }
        set webview(value) {
            this._webviewDisposables = lifecycle_1.dispose(this._webviewDisposables);
            this._webview = value;
            if (!this._webview) {
                return;
            }
            this._webview.onDidClickLink(link => {
                if (this._events && this._events.onDidClickLink) {
                    this._events.onDidClickLink(link, this._options);
                }
            }, null, this._webviewDisposables);
            this._webview.onMessage(message => {
                if (this._events && this._events.onMessage) {
                    this._events.onMessage(message);
                }
            }, null, this._webviewDisposables);
            this._webview.onDidScroll(message => {
                this._scrollYPercentage = message.scrollYPercentage;
            }, null, this._webviewDisposables);
            this._webview.onDidUpdateState(newState => {
                this._state.state = newState;
            }, null, this._webviewDisposables);
        }
        get scrollYPercentage() {
            return this._scrollYPercentage;
        }
        claimWebview(owner) {
            this._webviewOwner = owner;
        }
        releaseWebview(owner) {
            if (this._webviewOwner === owner) {
                this._webviewOwner = undefined;
                if (this._options.retainContextWhenHidden && this._container) {
                    this._container.style.visibility = 'hidden';
                }
                else {
                    this.disposeWebview();
                }
            }
        }
        disposeWebview() {
            // The input owns the webview and its parent
            if (this._webview) {
                this._webview.dispose();
                this._webview = undefined;
            }
            this._webviewDisposables = lifecycle_1.dispose(this._webviewDisposables);
            this._webviewOwner = undefined;
            if (this._container) {
                this._container.style.visibility = 'hidden';
            }
            this._currentWebviewHtml = '';
        }
        updateGroup(group) {
            this._group = group;
        }
    };
    WebviewEditorInput.handlePool = 0;
    WebviewEditorInput._icons = new Map();
    WebviewEditorInput.typeId = 'workbench.editors.webviewInput';
    WebviewEditorInput = __decorate([
        __param(7, layoutService_1.IWorkbenchLayoutService)
    ], WebviewEditorInput);
    exports.WebviewEditorInput = WebviewEditorInput;
    let RevivedWebviewEditorInput = class RevivedWebviewEditorInput extends WebviewEditorInput {
        constructor(viewType, id, name, options, state, events, extensionLocation, reviver, partService) {
            super(viewType, id, name, options, state, events, extensionLocation, partService);
            this.reviver = reviver;
            this._revived = false;
        }
        resolve() {
            const _super = Object.create(null, {
                resolve: { get: () => super.resolve }
            });
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._revived) {
                    this._revived = true;
                    yield this.reviver(this);
                }
                return _super.resolve.call(this);
            });
        }
    };
    RevivedWebviewEditorInput = __decorate([
        __param(8, layoutService_1.IWorkbenchLayoutService)
    ], RevivedWebviewEditorInput);
    exports.RevivedWebviewEditorInput = RevivedWebviewEditorInput;
});
//# sourceMappingURL=webviewEditorInput.js.map