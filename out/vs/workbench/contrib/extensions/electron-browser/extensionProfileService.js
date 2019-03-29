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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/base/browser/dom", "vs/workbench/browser/parts/statusbar/statusbar", "vs/platform/registry/common/platform", "vs/workbench/contrib/extensions/electron-browser/runtimeExtensionsEditor", "vs/workbench/services/editor/common/editorService", "vs/platform/windows/common/windows", "vs/platform/dialogs/common/dialogs", "vs/base/node/ports", "vs/platform/product/node/product", "vs/workbench/contrib/extensions/electron-browser/runtimeExtensionsInput", "vs/platform/extensions/common/extensions"], function (require, exports, nls, event_1, instantiation_1, extensions_1, lifecycle_1, errors_1, dom_1, statusbar_1, platform_1, runtimeExtensionsEditor_1, editorService_1, windows_1, dialogs_1, ports_1, product_1, runtimeExtensionsInput_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtensionHostProfileService = class ExtensionHostProfileService extends lifecycle_1.Disposable {
        constructor(_extensionService, _editorService, _instantiationService, _windowsService, _dialogService) {
            super();
            this._extensionService = _extensionService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._windowsService = _windowsService;
            this._dialogService = _dialogService;
            this._onDidChangeState = this._register(new event_1.Emitter());
            this.onDidChangeState = this._onDidChangeState.event;
            this._onDidChangeLastProfile = this._register(new event_1.Emitter());
            this.onDidChangeLastProfile = this._onDidChangeLastProfile.event;
            this._unresponsiveProfiles = new Map();
            this._profile = null;
            this._profileSession = null;
            this._setState(runtimeExtensionsEditor_1.ProfileSessionState.None);
        }
        get state() { return this._state; }
        get lastProfile() { return this._profile; }
        _setState(state) {
            if (this._state === state) {
                return;
            }
            this._state = state;
            if (this._state === runtimeExtensionsEditor_1.ProfileSessionState.Running) {
                ProfileExtHostStatusbarItem.instance.show(() => {
                    this.stopProfiling();
                    this._editorService.openEditor(this._instantiationService.createInstance(runtimeExtensionsInput_1.RuntimeExtensionsInput), { revealIfOpened: true });
                });
            }
            else if (this._state === runtimeExtensionsEditor_1.ProfileSessionState.Stopping) {
                ProfileExtHostStatusbarItem.instance.hide();
            }
            this._onDidChangeState.fire(undefined);
        }
        startProfiling() {
            if (this._state !== runtimeExtensionsEditor_1.ProfileSessionState.None) {
                return null;
            }
            if (!this._extensionService.canProfileExtensionHost()) {
                return this._dialogService.confirm({
                    type: 'info',
                    message: nls.localize('restart1', "Profile Extensions"),
                    detail: nls.localize('restart2', "In order to profile extensions a restart is required. Do you want to restart '{0}' now?", product_1.default.nameLong),
                    primaryButton: nls.localize('restart3', "Restart"),
                    secondaryButton: nls.localize('cancel', "Cancel")
                }).then(res => {
                    if (res.confirmed) {
                        this._windowsService.relaunch({ addArgs: [`--inspect-extensions=${ports_1.randomPort()}`] });
                    }
                });
            }
            this._setState(runtimeExtensionsEditor_1.ProfileSessionState.Starting);
            return this._extensionService.startExtensionHostProfile().then((value) => {
                this._profileSession = value;
                this._setState(runtimeExtensionsEditor_1.ProfileSessionState.Running);
            }, (err) => {
                errors_1.onUnexpectedError(err);
                this._setState(runtimeExtensionsEditor_1.ProfileSessionState.None);
            });
        }
        stopProfiling() {
            if (this._state !== runtimeExtensionsEditor_1.ProfileSessionState.Running || !this._profileSession) {
                return;
            }
            this._setState(runtimeExtensionsEditor_1.ProfileSessionState.Stopping);
            this._profileSession.stop().then((result) => {
                this._setLastProfile(result);
                this._setState(runtimeExtensionsEditor_1.ProfileSessionState.None);
            }, (err) => {
                errors_1.onUnexpectedError(err);
                this._setState(runtimeExtensionsEditor_1.ProfileSessionState.None);
            });
            this._profileSession = null;
        }
        _setLastProfile(profile) {
            this._profile = profile;
            this._onDidChangeLastProfile.fire(undefined);
        }
        getUnresponsiveProfile(extensionId) {
            return this._unresponsiveProfiles.get(extensions_2.ExtensionIdentifier.toKey(extensionId));
        }
        setUnresponsiveProfile(extensionId, profile) {
            this._unresponsiveProfiles.set(extensions_2.ExtensionIdentifier.toKey(extensionId), profile);
            this._setLastProfile(profile);
        }
    };
    ExtensionHostProfileService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, editorService_1.IEditorService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, windows_1.IWindowsService),
        __param(4, dialogs_1.IDialogService)
    ], ExtensionHostProfileService);
    exports.ExtensionHostProfileService = ExtensionHostProfileService;
    class ProfileExtHostStatusbarItem {
        constructor() {
            ProfileExtHostStatusbarItem.instance = this;
            this.toDispose = [];
            this.timeStarted = 0;
        }
        show(clickHandler) {
            this.clickHandler = clickHandler;
            if (this.timeStarted === 0) {
                this.timeStarted = new Date().getTime();
                this.statusBarItem.hidden = false;
                this.labelUpdater = setInterval(() => {
                    this.updateLabel();
                }, 1000);
                this.updateLabel();
            }
        }
        hide() {
            this.clickHandler = null;
            this.statusBarItem.hidden = true;
            this.timeStarted = 0;
            clearInterval(this.labelUpdater);
            this.labelUpdater = null;
        }
        render(container) {
            if (!this.statusBarItem && container) {
                this.statusBarItem = dom_1.append(container, dom_1.$('.profileExtHost-statusbar-item'));
                this.toDispose.push(dom_1.addDisposableListener(this.statusBarItem, 'click', () => {
                    if (this.clickHandler) {
                        this.clickHandler();
                    }
                }));
                this.statusBarItem.title = nls.localize('selectAndStartDebug', "Click to stop profiling.");
                const a = dom_1.append(this.statusBarItem, dom_1.$('a'));
                dom_1.append(a, dom_1.$('.icon'));
                this.label = dom_1.append(a, dom_1.$('span.label'));
                this.updateLabel();
                this.statusBarItem.hidden = true;
            }
            return this;
        }
        updateLabel() {
            let label = 'Profiling Extension Host';
            if (this.timeStarted > 0) {
                let secondsRecoreded = (new Date().getTime() - this.timeStarted) / 1000;
                label = `Profiling Extension Host (${Math.round(secondsRecoreded)} sec)`;
            }
            this.label.textContent = label;
        }
        dispose() {
            this.toDispose = lifecycle_1.dispose(this.toDispose);
        }
    }
    exports.ProfileExtHostStatusbarItem = ProfileExtHostStatusbarItem;
    platform_1.Registry.as(statusbar_1.Extensions.Statusbar).registerStatusbarItem(new statusbar_1.StatusbarItemDescriptor(ProfileExtHostStatusbarItem, 1 /* RIGHT */));
});
//# sourceMappingURL=extensionProfileService.js.map