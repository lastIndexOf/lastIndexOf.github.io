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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "./webviewEditorInput"], function (require, exports, arrays_1, lifecycle_1, map_1, instantiation_1, editorGroupsService_1, editorService_1, webviewEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWebviewEditorService = instantiation_1.createDecorator('webviewEditorService');
    function areWebviewInputOptionsEqual(a, b) {
        return a.enableCommandUris === b.enableCommandUris
            && a.enableFindWidget === b.enableFindWidget
            && a.enableScripts === b.enableScripts
            && a.retainContextWhenHidden === b.retainContextWhenHidden
            && a.tryRestoreScrollPosition === b.tryRestoreScrollPosition
            && (a.localResourceRoots === b.localResourceRoots || (Array.isArray(a.localResourceRoots) && Array.isArray(b.localResourceRoots) && arrays_1.equals(a.localResourceRoots, b.localResourceRoots, (a, b) => a.toString() === b.toString())));
    }
    exports.areWebviewInputOptionsEqual = areWebviewInputOptionsEqual;
    function canRevive(reviver, webview) {
        if (webview.isDisposed()) {
            return false;
        }
        return reviver.canRevive(webview);
    }
    class RevivalPool {
        constructor() {
            this._awaitingRevival = [];
        }
        add(input, resolve) {
            this._awaitingRevival.push({ input, resolve });
        }
        reviveFor(reviver) {
            const toRevive = this._awaitingRevival.filter(({ input }) => canRevive(reviver, input));
            this._awaitingRevival = this._awaitingRevival.filter(({ input }) => !canRevive(reviver, input));
            for (const { input, resolve } of toRevive) {
                reviver.reviveWebview(input).then(resolve);
            }
        }
    }
    let WebviewEditorService = class WebviewEditorService {
        constructor(_editorService, _instantiationService, _editorGroupService) {
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._editorGroupService = _editorGroupService;
            this._revivers = new Set();
            this._revivalPool = new RevivalPool();
        }
        createWebview(viewType, title, showOptions, options, extensionLocation, events) {
            const webviewInput = this._instantiationService.createInstance(webviewEditorInput_1.WebviewEditorInput, viewType, undefined, title, options, {}, events, extensionLocation, undefined);
            this._editorService.openEditor(webviewInput, { pinned: true, preserveFocus: showOptions.preserveFocus }, showOptions.group);
            return webviewInput;
        }
        revealWebview(webview, group, preserveFocus) {
            if (webview.group === group.id) {
                this._editorService.openEditor(webview, { preserveFocus }, webview.group);
            }
            else {
                const groupView = this._editorGroupService.getGroup(webview.group);
                if (groupView) {
                    groupView.moveEditor(webview, group, { preserveFocus });
                }
            }
        }
        reviveWebview(viewType, id, title, iconPath, state, options, extensionLocation, group) {
            const webviewInput = this._instantiationService.createInstance(webviewEditorInput_1.RevivedWebviewEditorInput, viewType, id, title, options, state, {}, extensionLocation, (webview) => __awaiter(this, void 0, void 0, function* () {
                const didRevive = yield this.tryRevive(webview);
                if (didRevive) {
                    return Promise.resolve(undefined);
                }
                // A reviver may not be registered yet. Put into pool and resolve promise when we can revive
                let resolve;
                const promise = new Promise(r => { resolve = r; });
                this._revivalPool.add(webview, resolve);
                return promise;
            }));
            webviewInput.iconPath = iconPath;
            if (typeof group === 'number') {
                webviewInput.updateGroup(group);
            }
            return webviewInput;
        }
        registerReviver(reviver) {
            this._revivers.add(reviver);
            this._revivalPool.reviveFor(reviver);
            return lifecycle_1.toDisposable(() => {
                this._revivers.delete(reviver);
            });
        }
        shouldPersist(webview) {
            // Has no state, don't persist
            if (!webview.state) {
                return false;
            }
            if (map_1.values(this._revivers).some(reviver => canRevive(reviver, webview))) {
                return true;
            }
            // Revived webviews may not have an actively registered reviver but we still want to presist them
            // since a reviver should exist when it is actually needed.
            return !(webview instanceof webviewEditorInput_1.RevivedWebviewEditorInput);
        }
        tryRevive(webview) {
            return __awaiter(this, void 0, void 0, function* () {
                for (const reviver of map_1.values(this._revivers)) {
                    if (canRevive(reviver, webview)) {
                        yield reviver.reviveWebview(webview);
                        return true;
                    }
                }
                return false;
            });
        }
    };
    WebviewEditorService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], WebviewEditorService);
    exports.WebviewEditorService = WebviewEditorService;
});
//# sourceMappingURL=webviewEditorService.js.map