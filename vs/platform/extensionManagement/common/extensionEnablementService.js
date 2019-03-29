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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/platform/environment/common/environment", "vs/base/common/types"], function (require, exports, nls_1, event_1, lifecycle_1, extensionManagement_1, extensionManagementUtil_1, workspace_1, storage_1, environment_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const DISABLED_EXTENSIONS_STORAGE_PATH = 'extensionsIdentifiers/disabled';
    const ENABLED_EXTENSIONS_STORAGE_PATH = 'extensionsIdentifiers/enabled';
    let ExtensionEnablementService = class ExtensionEnablementService extends lifecycle_1.Disposable {
        constructor(storageService, contextService, environmentService, extensionManagementService) {
            super();
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.extensionManagementService = extensionManagementService;
            this._onEnablementChanged = new event_1.Emitter();
            this.onEnablementChanged = this._onEnablementChanged.event;
            this.storageManger = this._register(new StorageManager(storageService));
            this._register(this.storageManger.onDidChange(extensions => this.onDidChangeStorage(extensions)));
            this._register(extensionManagementService.onDidInstallExtension(this._onDidInstallExtension, this));
            this._register(extensionManagementService.onDidUninstallExtension(this._onDidUninstallExtension, this));
        }
        get hasWorkspace() {
            return this.contextService.getWorkbenchState() !== 1 /* EMPTY */;
        }
        get allUserExtensionsDisabled() {
            return this.environmentService.disableExtensions === true;
        }
        getDisabledExtensions() {
            return __awaiter(this, void 0, void 0, function* () {
                let result = this._getDisabledExtensions(0 /* GLOBAL */);
                if (this.hasWorkspace) {
                    for (const e of this._getDisabledExtensions(1 /* WORKSPACE */)) {
                        if (!result.some(r => extensionManagementUtil_1.areSameExtensions(r, e))) {
                            result.push(e);
                        }
                    }
                    const workspaceEnabledExtensions = this._getEnabledExtensions(1 /* WORKSPACE */);
                    if (workspaceEnabledExtensions.length) {
                        result = result.filter(r => !workspaceEnabledExtensions.some(e => extensionManagementUtil_1.areSameExtensions(e, r)));
                    }
                }
                if (this.environmentService.disableExtensions) {
                    const allInstalledExtensions = yield this.extensionManagementService.getInstalled();
                    for (const installedExtension of allInstalledExtensions) {
                        if (this._isExtensionDisabledInEnvironment(installedExtension)) {
                            if (!result.some(r => extensionManagementUtil_1.areSameExtensions(r, installedExtension.identifier))) {
                                result.push(installedExtension.identifier);
                            }
                        }
                    }
                }
                return result;
            });
        }
        getEnablementState(extension) {
            if (this._isExtensionDisabledInEnvironment(extension)) {
                return 0 /* Disabled */;
            }
            const identifier = extension.identifier;
            if (this.hasWorkspace) {
                if (this._getEnabledExtensions(1 /* WORKSPACE */).filter(e => extensionManagementUtil_1.areSameExtensions(e, identifier))[0]) {
                    return 3 /* WorkspaceEnabled */;
                }
                if (this._getDisabledExtensions(1 /* WORKSPACE */).filter(e => extensionManagementUtil_1.areSameExtensions(e, identifier))[0]) {
                    return 1 /* WorkspaceDisabled */;
                }
            }
            if (this._getDisabledExtensions(0 /* GLOBAL */).filter(e => extensionManagementUtil_1.areSameExtensions(e, identifier))[0]) {
                return 0 /* Disabled */;
            }
            return 2 /* Enabled */;
        }
        canChangeEnablement(extension) {
            if (extension.manifest && extension.manifest.contributes && extension.manifest.contributes.localizations && extension.manifest.contributes.localizations.length) {
                return false;
            }
            if (extension.type === 1 /* User */ && this.environmentService.disableExtensions) {
                return false;
            }
            return true;
        }
        setEnablement(extensions, newState) {
            return __awaiter(this, void 0, void 0, function* () {
                const workspace = newState === 1 /* WorkspaceDisabled */ || newState === 3 /* WorkspaceEnabled */;
                if (workspace && !this.hasWorkspace) {
                    return Promise.reject(new Error(nls_1.localize('noWorkspace', "No workspace.")));
                }
                const result = yield Promise.all(extensions.map(e => this._setEnablement(e, newState)));
                const changedExtensions = extensions.filter((e, index) => result[index]);
                if (changedExtensions.length) {
                    this._onEnablementChanged.fire(changedExtensions);
                }
                return result;
            });
        }
        _setEnablement(extension, newState) {
            const currentState = this._getEnablementState(extension.identifier);
            if (currentState === newState) {
                return Promise.resolve(false);
            }
            switch (newState) {
                case 2 /* Enabled */:
                    this._enableExtension(extension.identifier);
                    break;
                case 0 /* Disabled */:
                    this._disableExtension(extension.identifier);
                    break;
                case 3 /* WorkspaceEnabled */:
                    this._enableExtensionInWorkspace(extension.identifier);
                    break;
                case 1 /* WorkspaceDisabled */:
                    this._disableExtensionInWorkspace(extension.identifier);
                    break;
            }
            return Promise.resolve(true);
        }
        isEnabled(extension) {
            const enablementState = this.getEnablementState(extension);
            return enablementState === 3 /* WorkspaceEnabled */ || enablementState === 2 /* Enabled */;
        }
        _isExtensionDisabledInEnvironment(extension) {
            if (this.allUserExtensionsDisabled) {
                return extension.type === 1 /* User */;
            }
            const disabledExtensions = this.environmentService.disableExtensions;
            if (Array.isArray(disabledExtensions)) {
                return disabledExtensions.some(id => extensionManagementUtil_1.areSameExtensions({ id }, extension.identifier));
            }
            return false;
        }
        _getEnablementState(identifier) {
            if (this.hasWorkspace) {
                if (this._getEnabledExtensions(1 /* WORKSPACE */).filter(e => extensionManagementUtil_1.areSameExtensions(e, identifier))[0]) {
                    return 3 /* WorkspaceEnabled */;
                }
                if (this._getDisabledExtensions(1 /* WORKSPACE */).filter(e => extensionManagementUtil_1.areSameExtensions(e, identifier))[0]) {
                    return 1 /* WorkspaceDisabled */;
                }
            }
            if (this._getDisabledExtensions(0 /* GLOBAL */).filter(e => extensionManagementUtil_1.areSameExtensions(e, identifier))[0]) {
                return 0 /* Disabled */;
            }
            return 2 /* Enabled */;
        }
        _enableExtension(identifier) {
            this._removeFromDisabledExtensions(identifier, 1 /* WORKSPACE */);
            this._removeFromEnabledExtensions(identifier, 1 /* WORKSPACE */);
            this._removeFromDisabledExtensions(identifier, 0 /* GLOBAL */);
        }
        _disableExtension(identifier) {
            this._removeFromDisabledExtensions(identifier, 1 /* WORKSPACE */);
            this._removeFromEnabledExtensions(identifier, 1 /* WORKSPACE */);
            this._addToDisabledExtensions(identifier, 0 /* GLOBAL */);
        }
        _enableExtensionInWorkspace(identifier) {
            this._removeFromDisabledExtensions(identifier, 1 /* WORKSPACE */);
            this._addToEnabledExtensions(identifier, 1 /* WORKSPACE */);
        }
        _disableExtensionInWorkspace(identifier) {
            this._addToDisabledExtensions(identifier, 1 /* WORKSPACE */);
            this._removeFromEnabledExtensions(identifier, 1 /* WORKSPACE */);
        }
        _addToDisabledExtensions(identifier, scope) {
            if (scope === 1 /* WORKSPACE */ && !this.hasWorkspace) {
                return Promise.resolve(false);
            }
            let disabledExtensions = this._getDisabledExtensions(scope);
            if (disabledExtensions.every(e => !extensionManagementUtil_1.areSameExtensions(e, identifier))) {
                disabledExtensions.push(identifier);
                this._setDisabledExtensions(disabledExtensions, scope);
                return Promise.resolve(true);
            }
            return Promise.resolve(false);
        }
        _removeFromDisabledExtensions(identifier, scope) {
            if (scope === 1 /* WORKSPACE */ && !this.hasWorkspace) {
                return false;
            }
            let disabledExtensions = this._getDisabledExtensions(scope);
            for (let index = 0; index < disabledExtensions.length; index++) {
                const disabledExtension = disabledExtensions[index];
                if (extensionManagementUtil_1.areSameExtensions(disabledExtension, identifier)) {
                    disabledExtensions.splice(index, 1);
                    this._setDisabledExtensions(disabledExtensions, scope);
                    return true;
                }
            }
            return false;
        }
        _addToEnabledExtensions(identifier, scope) {
            if (scope === 1 /* WORKSPACE */ && !this.hasWorkspace) {
                return false;
            }
            let enabledExtensions = this._getEnabledExtensions(scope);
            if (enabledExtensions.every(e => !extensionManagementUtil_1.areSameExtensions(e, identifier))) {
                enabledExtensions.push(identifier);
                this._setEnabledExtensions(enabledExtensions, scope);
                return true;
            }
            return false;
        }
        _removeFromEnabledExtensions(identifier, scope) {
            if (scope === 1 /* WORKSPACE */ && !this.hasWorkspace) {
                return false;
            }
            let enabledExtensions = this._getEnabledExtensions(scope);
            for (let index = 0; index < enabledExtensions.length; index++) {
                const disabledExtension = enabledExtensions[index];
                if (extensionManagementUtil_1.areSameExtensions(disabledExtension, identifier)) {
                    enabledExtensions.splice(index, 1);
                    this._setEnabledExtensions(enabledExtensions, scope);
                    return true;
                }
            }
            return false;
        }
        _getEnabledExtensions(scope) {
            return this._getExtensions(ENABLED_EXTENSIONS_STORAGE_PATH, scope);
        }
        _setEnabledExtensions(enabledExtensions, scope) {
            this._setExtensions(ENABLED_EXTENSIONS_STORAGE_PATH, enabledExtensions, scope);
        }
        _getDisabledExtensions(scope) {
            return this._getExtensions(DISABLED_EXTENSIONS_STORAGE_PATH, scope);
        }
        _setDisabledExtensions(disabledExtensions, scope) {
            this._setExtensions(DISABLED_EXTENSIONS_STORAGE_PATH, disabledExtensions, scope);
        }
        _getExtensions(storageId, scope) {
            if (scope === 1 /* WORKSPACE */ && !this.hasWorkspace) {
                return [];
            }
            return this.storageManger.get(storageId, scope);
        }
        _setExtensions(storageId, extensions, scope) {
            this.storageManger.set(storageId, extensions, scope);
        }
        onDidChangeStorage(extensionIdentifiers) {
            return __awaiter(this, void 0, void 0, function* () {
                const installedExtensions = yield this.extensionManagementService.getInstalled();
                const extensions = installedExtensions.filter(installedExtension => extensionIdentifiers.some(identifier => extensionManagementUtil_1.areSameExtensions(identifier, installedExtension.identifier)));
                this._onEnablementChanged.fire(extensions);
            });
        }
        _onDidInstallExtension(event) {
            if (event.local && event.operation === 1 /* Install */) {
                const wasDisabled = !this.isEnabled(event.local);
                this._reset(event.local.identifier);
                if (wasDisabled) {
                    this._onEnablementChanged.fire([event.local]);
                }
            }
        }
        _onDidUninstallExtension({ identifier, error }) {
            if (!error) {
                this._reset(identifier);
            }
        }
        _reset(extension) {
            this._removeFromDisabledExtensions(extension, 1 /* WORKSPACE */);
            this._removeFromEnabledExtensions(extension, 1 /* WORKSPACE */);
            this._removeFromDisabledExtensions(extension, 0 /* GLOBAL */);
        }
    };
    ExtensionEnablementService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, extensionManagement_1.IExtensionManagementService)
    ], ExtensionEnablementService);
    exports.ExtensionEnablementService = ExtensionEnablementService;
    class StorageManager extends lifecycle_1.Disposable {
        constructor(storageService) {
            super();
            this.storageService = storageService;
            this.storage = Object.create(null);
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(storageService.onDidChangeStorage(e => this.onDidStorageChange(e)));
        }
        get(key, scope) {
            let value;
            if (scope === 0 /* GLOBAL */) {
                if (types_1.isUndefinedOrNull(this.storage[key])) {
                    this.storage[key] = this._get(key, scope);
                }
                value = this.storage[key];
            }
            else {
                value = this._get(key, scope);
            }
            return JSON.parse(value);
        }
        set(key, value, scope) {
            let newValue = JSON.stringify(value.map(({ id, uuid }) => ({ id, uuid })));
            const oldValue = this._get(key, scope);
            if (oldValue !== newValue) {
                if (scope === 0 /* GLOBAL */) {
                    if (value.length) {
                        this.storage[key] = newValue;
                    }
                    else {
                        delete this.storage[key];
                    }
                }
                this._set(key, value.length ? newValue : undefined, scope);
            }
        }
        onDidStorageChange(workspaceStorageChangeEvent) {
            if (workspaceStorageChangeEvent.scope === 0 /* GLOBAL */) {
                if (!types_1.isUndefinedOrNull(this.storage[workspaceStorageChangeEvent.key])) {
                    const newValue = this._get(workspaceStorageChangeEvent.key, workspaceStorageChangeEvent.scope);
                    if (newValue !== this.storage[workspaceStorageChangeEvent.key]) {
                        const oldValues = this.get(workspaceStorageChangeEvent.key, workspaceStorageChangeEvent.scope);
                        delete this.storage[workspaceStorageChangeEvent.key];
                        const newValues = this.get(workspaceStorageChangeEvent.key, workspaceStorageChangeEvent.scope);
                        const added = oldValues.filter(oldValue => !newValues.some(newValue => extensionManagementUtil_1.areSameExtensions(oldValue, newValue)));
                        const removed = newValues.filter(newValue => !oldValues.some(oldValue => extensionManagementUtil_1.areSameExtensions(oldValue, newValue)));
                        if (added.length || removed.length) {
                            this._onDidChange.fire([...added, ...removed]);
                        }
                    }
                }
            }
        }
        _get(key, scope) {
            return this.storageService.get(key, scope, '[]');
        }
        _set(key, value, scope) {
            if (value) {
                this.storageService.store(key, value, scope);
            }
            else {
                this.storageService.remove(key, scope);
            }
        }
    }
});
//# sourceMappingURL=extensionEnablementService.js.map