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
define(["require", "exports", "vs/base/common/event", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/arrays", "vs/platform/extensions/common/extensions", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/base/common/cancellation", "vs/workbench/services/remote/node/remoteAgentService", "vs/platform/extensionManagement/node/extensionManagementUtil", "vs/platform/log/common/log", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/nls", "vs/workbench/services/extensions/node/extensionsUtil", "vs/platform/instantiation/common/extensions"], function (require, exports, event_1, extensionManagement_1, arrays_1, extensions_1, lifecycle_1, configuration_1, cancellation_1, remoteAgentService_1, extensionManagementUtil_1, log_1, extensionManagementUtil_2, nls_1, extensionsUtil_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MultiExtensionManagementService = class MultiExtensionManagementService extends lifecycle_1.Disposable {
        constructor(extensionManagementServerService, extensionGalleryService, configurationService, remoteAgentService, logService) {
            super();
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionGalleryService = extensionGalleryService;
            this.configurationService = configurationService;
            this.remoteAgentService = remoteAgentService;
            this.logService = logService;
            this.servers = this.extensionManagementServerService.remoteExtensionManagementServer ? [this.extensionManagementServerService.localExtensionManagementServer, this.extensionManagementServerService.remoteExtensionManagementServer] : [this.extensionManagementServerService.localExtensionManagementServer];
            this.onInstallExtension = this._register(this.servers.reduce((emitter, server) => { emitter.add(server.extensionManagementService.onInstallExtension); return emitter; }, new event_1.EventMultiplexer())).event;
            this.onDidInstallExtension = this._register(this.servers.reduce((emitter, server) => { emitter.add(server.extensionManagementService.onDidInstallExtension); return emitter; }, new event_1.EventMultiplexer())).event;
            this.onUninstallExtension = this._register(this.servers.reduce((emitter, server) => { emitter.add(server.extensionManagementService.onUninstallExtension); return emitter; }, new event_1.EventMultiplexer())).event;
            this.onDidUninstallExtension = this._register(this.servers.reduce((emitter, server) => { emitter.add(server.extensionManagementService.onDidUninstallExtension); return emitter; }, new event_1.EventMultiplexer())).event;
        }
        getInstalled(type) {
            return Promise.all(this.servers.map(({ extensionManagementService }) => extensionManagementService.getInstalled(type)))
                .then(result => arrays_1.flatten(result));
        }
        uninstall(extension, force) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                    const server = this.getServer(extension);
                    if (!server) {
                        return Promise.reject(`Invalid location ${extension.location.toString()}`);
                    }
                    const syncExtensions = yield this.hasToSyncExtensions();
                    if (syncExtensions || extensions_1.isLanguagePackExtension(extension.manifest)) {
                        return this.uninstallEverywhere(extension, force);
                    }
                    return this.uninstallInServer(extension, server, force);
                }
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.uninstall(extension, force);
            });
        }
        uninstallEverywhere(extension, force) {
            return __awaiter(this, void 0, void 0, function* () {
                const server = this.getServer(extension);
                if (!server) {
                    return Promise.reject(`Invalid location ${extension.location.toString()}`);
                }
                const promise = server.extensionManagementService.uninstall(extension);
                const anotherServer = server === this.extensionManagementServerService.localExtensionManagementServer ? this.extensionManagementServerService.remoteExtensionManagementServer : this.extensionManagementServerService.localExtensionManagementServer;
                const installed = yield anotherServer.extensionManagementService.getInstalled(1 /* User */);
                extension = installed.filter(i => extensionManagementUtil_2.areSameExtensions(i.identifier, extension.identifier))[0];
                if (extension) {
                    yield anotherServer.extensionManagementService.uninstall(extension);
                }
                return promise;
            });
        }
        uninstallInServer(extension, server, force) {
            return __awaiter(this, void 0, void 0, function* () {
                if (server === this.extensionManagementServerService.localExtensionManagementServer) {
                    const installedExtensions = yield this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getInstalled(1 /* User */);
                    const dependentNonUIExtensions = installedExtensions.filter(i => !extensionsUtil_1.isUIExtension(i.manifest, this.configurationService)
                        && i.manifest.extensionDependencies && i.manifest.extensionDependencies.some(id => extensionManagementUtil_2.areSameExtensions({ id }, extension.identifier)));
                    if (dependentNonUIExtensions.length) {
                        return Promise.reject(new Error(this.getDependentsErrorMessage(extension, dependentNonUIExtensions)));
                    }
                }
                return server.extensionManagementService.uninstall(extension, force);
            });
        }
        getDependentsErrorMessage(extension, dependents) {
            if (dependents.length === 1) {
                return nls_1.localize('singleDependentError', "Cannot uninstall extension '{0}'. Extension '{1}' depends on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name);
            }
            if (dependents.length === 2) {
                return nls_1.localize('twoDependentsError', "Cannot uninstall extension '{0}'. Extensions '{1}' and '{2}' depend on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
            }
            return nls_1.localize('multipleDependentsError', "Cannot uninstall extension '{0}'. Extensions '{1}', '{2}' and others depend on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
        }
        reinstallFromGallery(extension) {
            const server = this.getServer(extension);
            if (server) {
                return server.extensionManagementService.reinstallFromGallery(extension);
            }
            return Promise.reject(`Invalid location ${extension.location.toString()}`);
        }
        updateMetadata(extension, metadata) {
            const server = this.getServer(extension);
            if (server) {
                return server.extensionManagementService.updateMetadata(extension, metadata);
            }
            return Promise.reject(`Invalid location ${extension.location.toString()}`);
        }
        zip(extension) {
            throw new Error('Not Supported');
        }
        unzip(zipLocation, type) {
            return Promise.all(this.servers.map(({ extensionManagementService }) => extensionManagementService.unzip(zipLocation, type))).then(([extensionIdentifier]) => extensionIdentifier);
        }
        install(vsix) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                    const syncExtensions = yield this.hasToSyncExtensions();
                    const manifest = yield extensionManagementUtil_1.getManifest(vsix.fsPath);
                    if (syncExtensions || extensions_1.isLanguagePackExtension(manifest)) {
                        // Install on both servers
                        const [extensionIdentifier] = yield Promise.all(this.servers.map(server => server.extensionManagementService.install(vsix)));
                        return extensionIdentifier;
                    }
                    if (extensionsUtil_1.isUIExtension(manifest, this.configurationService)) {
                        // Install only on local server
                        return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.install(vsix);
                    }
                    // Install only on remote server
                    const promise = this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.install(vsix);
                    // Install UI Dependencies on local server
                    yield this.installUIDependencies(manifest);
                    return promise;
                }
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.install(vsix);
            });
        }
        installFromGallery(gallery) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                    const [manifest, syncExtensions] = yield Promise.all([this.extensionGalleryService.getManifest(gallery, cancellation_1.CancellationToken.None), this.hasToSyncExtensions()]);
                    if (manifest) {
                        if (syncExtensions || extensions_1.isLanguagePackExtension(manifest)) {
                            // Install on both servers
                            return Promise.all(this.servers.map(server => server.extensionManagementService.installFromGallery(gallery))).then(() => undefined);
                        }
                        if (extensionsUtil_1.isUIExtension(manifest, this.configurationService)) {
                            // Install only on local server
                            return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.installFromGallery(gallery);
                        }
                        // Install only on remote server
                        const promise = this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.installFromGallery(gallery);
                        // Install UI Dependencies on local server
                        yield this.installUIDependencies(manifest);
                        return promise;
                    }
                    else {
                        this.logService.info('Manifest was not found. Hence installing only in local server');
                        return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.installFromGallery(gallery);
                    }
                }
                return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.installFromGallery(gallery);
            });
        }
        installUIDependencies(manifest) {
            return __awaiter(this, void 0, void 0, function* () {
                if (manifest.extensionDependencies && manifest.extensionDependencies.length) {
                    const dependencies = yield this.extensionGalleryService.loadAllDependencies(manifest.extensionDependencies.map(id => ({ id })), cancellation_1.CancellationToken.None);
                    if (dependencies.length) {
                        yield Promise.all(dependencies.map((d) => __awaiter(this, void 0, void 0, function* () {
                            const manifest = yield this.extensionGalleryService.getManifest(d, cancellation_1.CancellationToken.None);
                            if (manifest && extensionsUtil_1.isUIExtension(manifest, this.configurationService)) {
                                yield this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.installFromGallery(d);
                            }
                        })));
                    }
                }
            });
        }
        getExtensionsReport() {
            return this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.getExtensionsReport();
        }
        getServer(extension) {
            return this.extensionManagementServerService.getExtensionManagementServer(extension.location);
        }
        hasToSyncExtensions() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this.extensionManagementServerService.remoteExtensionManagementServer) {
                    return false;
                }
                const connection = this.remoteAgentService.getConnection();
                if (!connection) {
                    return false;
                }
                const remoteEnv = yield connection.getEnvironment();
                if (!remoteEnv) {
                    return false;
                }
                return remoteEnv.syncExtensions;
            });
        }
    };
    MultiExtensionManagementService = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementServerService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, remoteAgentService_1.IRemoteAgentService),
        __param(4, log_1.ILogService)
    ], MultiExtensionManagementService);
    exports.MultiExtensionManagementService = MultiExtensionManagementService;
    extensions_2.registerSingleton(extensionManagement_1.IExtensionManagementService, MultiExtensionManagementService);
});
//# sourceMappingURL=multiExtensionManagement.js.map