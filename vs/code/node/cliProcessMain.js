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
define(["require", "exports", "vs/nls", "vs/platform/product/node/product", "vs/platform/product/node/package", "vs/base/common/path", "semver", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/instantiationService", "vs/platform/environment/common/environment", "vs/platform/environment/node/environmentService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/extensionManagement/node/extensionGalleryService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/node/commonProperties", "vs/platform/request/node/request", "vs/platform/request/node/requestService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/node/configurationService", "vs/platform/telemetry/node/appInsightsAppender", "vs/base/node/pfs", "vs/base/common/labels", "vs/platform/state/common/state", "vs/platform/state/node/stateService", "vs/platform/log/node/spdlogService", "vs/platform/log/common/log", "vs/base/common/errors", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/uri", "vs/platform/extensionManagement/node/extensionManagementUtil", "vs/platform/extensions/common/extensions", "vs/platform/extensions/node/extensionsUtil", "vs/base/common/cancellation", "vs/platform/localizations/node/localizations"], function (require, exports, nls_1, product_1, package_1, path, semver, serviceCollection_1, descriptors_1, instantiation_1, instantiationService_1, environment_1, environmentService_1, extensionManagement_1, extensionManagementService_1, extensionGalleryService_1, telemetry_1, telemetryUtils_1, telemetryService_1, commonProperties_1, request_1, requestService_1, configuration_1, configurationService_1, appInsightsAppender_1, pfs_1, labels_1, state_1, stateService_1, spdlogService_1, log_1, errors_1, extensionManagementUtil_1, uri_1, extensionManagementUtil_2, extensions_1, extensionsUtil_1, cancellation_1, localizations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const notFound = (id) => nls_1.localize('notFound', "Extension '{0}' not found.", id);
    const notInstalled = (id) => nls_1.localize('notInstalled', "Extension '{0}' is not installed.", id);
    const useId = nls_1.localize('useId', "Make sure you use the full extension ID, including the publisher, eg: {0}", 'ms-vscode.csharp');
    function getId(manifest, withVersion) {
        if (withVersion) {
            return `${manifest.publisher}.${manifest.name}@${manifest.version}`;
        }
        else {
            return `${manifest.publisher}.${manifest.name}`;
        }
    }
    const EXTENSION_ID_REGEX = /^([^.]+\..+)@(\d+\.\d+\.\d+(-.*)?)$/;
    function getIdAndVersion(id) {
        const matches = EXTENSION_ID_REGEX.exec(id);
        if (matches && matches[1]) {
            return [extensionManagementUtil_1.adoptToGalleryExtensionId(matches[1]), matches[2]];
        }
        return [extensionManagementUtil_1.adoptToGalleryExtensionId(id), undefined];
    }
    exports.getIdAndVersion = getIdAndVersion;
    let Main = class Main {
        constructor(remote, instantiationService, environmentService, configurationService, extensionManagementService, extensionGalleryService) {
            this.remote = remote;
            this.instantiationService = instantiationService;
            this.environmentService = environmentService;
            this.configurationService = configurationService;
            this.extensionManagementService = extensionManagementService;
            this.extensionGalleryService = extensionGalleryService;
        }
        run(argv) {
            return __awaiter(this, void 0, void 0, function* () {
                if (argv['install-source']) {
                    yield this.setInstallSource(argv['install-source']);
                }
                else if (argv['list-extensions']) {
                    yield this.listExtensions(!!argv['show-versions']);
                }
                else if (argv['install-extension']) {
                    const arg = argv['install-extension'];
                    const args = typeof arg === 'string' ? [arg] : arg;
                    yield this.installExtensions(args, argv['force']);
                }
                else if (argv['uninstall-extension']) {
                    const arg = argv['uninstall-extension'];
                    const ids = typeof arg === 'string' ? [arg] : arg;
                    yield this.uninstallExtension(ids);
                }
            });
        }
        setInstallSource(installSource) {
            return pfs_1.writeFile(this.environmentService.installSourcePath, installSource.slice(0, 30));
        }
        listExtensions(showVersions) {
            return __awaiter(this, void 0, void 0, function* () {
                const extensions = yield this.extensionManagementService.getInstalled(1 /* User */);
                extensions.forEach(e => console.log(getId(e.manifest, showVersions)));
            });
        }
        installExtensions(extensions, force) {
            return __awaiter(this, void 0, void 0, function* () {
                const failed = [];
                const installedExtensionsManifests = [];
                for (const extension of extensions) {
                    try {
                        const manifest = yield this.installExtension(extension, force);
                        if (manifest) {
                            installedExtensionsManifests.push(manifest);
                        }
                    }
                    catch (err) {
                        console.error(err.message || err.stack || err);
                        failed.push(extension);
                    }
                }
                if (installedExtensionsManifests.some(manifest => extensions_1.isLanguagePackExtension(manifest))) {
                    yield this.updateLocalizationsCache();
                }
                return failed.length ? Promise.reject(nls_1.localize('installation failed', "Failed Installing Extensions: {0}", failed.join(', '))) : Promise.resolve();
            });
        }
        installExtension(extension, force) {
            return __awaiter(this, void 0, void 0, function* () {
                if (/\.vsix$/i.test(extension)) {
                    extension = path.isAbsolute(extension) ? extension : path.join(process.cwd(), extension);
                    const manifest = yield extensionManagementUtil_2.getManifest(extension);
                    if (this.remote && (!extensions_1.isLanguagePackExtension(manifest) && extensionsUtil_1.isUIExtension(manifest, [], this.configurationService))) {
                        console.log(nls_1.localize('notSupportedUIExtension', "Can't install extension {0} since UI Extensions are not supported", labels_1.getBaseLabel(extension)));
                        return null;
                    }
                    const valid = yield this.validate(manifest, force);
                    if (valid) {
                        return this.extensionManagementService.install(uri_1.URI.file(extension)).then(id => {
                            console.log(nls_1.localize('successVsixInstall', "Extension '{0}' was successfully installed!", labels_1.getBaseLabel(extension)));
                            return manifest;
                        }, error => {
                            if (errors_1.isPromiseCanceledError(error)) {
                                console.log(nls_1.localize('cancelVsixInstall', "Cancelled installing Extension '{0}'.", labels_1.getBaseLabel(extension)));
                                return null;
                            }
                            else {
                                return Promise.reject(error);
                            }
                        });
                    }
                    return null;
                }
                const [id, version] = getIdAndVersion(extension);
                return this.extensionManagementService.getInstalled(1 /* User */)
                    .then(installed => this.extensionGalleryService.getCompatibleExtension({ id }, version)
                    .then(null, err => {
                    if (err.responseText) {
                        try {
                            const response = JSON.parse(err.responseText);
                            return Promise.reject(response.message);
                        }
                        catch (e) {
                            // noop
                        }
                    }
                    return Promise.reject(err);
                })
                    .then((extension) => __awaiter(this, void 0, void 0, function* () {
                    if (!extension) {
                        return Promise.reject(new Error(`${notFound(version ? `${id}@${version}` : id)}\n${useId}`));
                    }
                    const manifest = yield this.extensionGalleryService.getManifest(extension, cancellation_1.CancellationToken.None);
                    if (this.remote && manifest && (!extensions_1.isLanguagePackExtension(manifest) && extensionsUtil_1.isUIExtension(manifest, [], this.configurationService))) {
                        console.log(nls_1.localize('notSupportedUIExtension', "Can't install extension {0} since UI Extensions are not supported", extension.identifier.id));
                        return null;
                    }
                    const [installedExtension] = installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, { id }));
                    if (installedExtension) {
                        if (extension.version === installedExtension.manifest.version) {
                            console.log(nls_1.localize('alreadyInstalled', "Extension '{0}' is already installed.", version ? `${id}@${version}` : id));
                            return Promise.resolve(null);
                        }
                        if (!version && !force) {
                            console.log(nls_1.localize('forceUpdate', "Extension '{0}' v{1} is already installed, but a newer version {2} is available in the marketplace. Use '--force' option to update to newer version.", id, installedExtension.manifest.version, extension.version));
                            return Promise.resolve(null);
                        }
                        console.log(nls_1.localize('updateMessage', "Updating the Extension '{0}' to the version {1}", id, extension.version));
                    }
                    else {
                        console.log(nls_1.localize('foundExtension', "Found '{0}' in the marketplace.", id));
                    }
                    yield this.installFromGallery(id, extension);
                    return manifest;
                })));
            });
        }
        validate(manifest, force) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!manifest) {
                    throw new Error('Invalid vsix');
                }
                const extensionIdentifier = { id: extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name) };
                const installedExtensions = yield this.extensionManagementService.getInstalled(1 /* User */);
                const newer = installedExtensions.filter(local => extensionManagementUtil_1.areSameExtensions(extensionIdentifier, local.identifier) && semver.gt(local.manifest.version, manifest.version))[0];
                if (newer && !force) {
                    console.log(nls_1.localize('forceDowngrade', "A newer version of this extension '{0}' v{1} is already installed. Use '--force' option to downgrade to older version.", newer.identifier.id, newer.manifest.version, manifest.version));
                    return false;
                }
                return true;
            });
        }
        installFromGallery(id, extension) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(nls_1.localize('installing', "Installing..."));
                try {
                    yield this.extensionManagementService.installFromGallery(extension);
                    console.log(nls_1.localize('successInstall', "Extension '{0}' v{1} was successfully installed!", id, extension.version));
                }
                catch (error) {
                    if (errors_1.isPromiseCanceledError(error)) {
                        console.log(nls_1.localize('cancelVsixInstall', "Cancelled installing Extension '{0}'.", id));
                    }
                    else {
                        throw error;
                    }
                }
            });
        }
        uninstallExtension(extensions) {
            return __awaiter(this, void 0, void 0, function* () {
                function getExtensionId(extensionDescription) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (!/\.vsix$/i.test(extensionDescription)) {
                            return extensionDescription;
                        }
                        const zipPath = path.isAbsolute(extensionDescription) ? extensionDescription : path.join(process.cwd(), extensionDescription);
                        const manifest = yield extensionManagementUtil_2.getManifest(zipPath);
                        return getId(manifest);
                    });
                }
                const uninstalledExtensions = [];
                for (const extension of extensions) {
                    const id = yield getExtensionId(extension);
                    const installed = yield this.extensionManagementService.getInstalled(1 /* User */);
                    const [extensionToUninstall] = installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, { id }));
                    if (!extensionToUninstall) {
                        return Promise.reject(new Error(`${notInstalled(id)}\n${useId}`));
                    }
                    console.log(nls_1.localize('uninstalling', "Uninstalling {0}...", id));
                    yield this.extensionManagementService.uninstall(extensionToUninstall, true);
                    uninstalledExtensions.push(extensionToUninstall);
                    console.log(nls_1.localize('successUninstall', "Extension '{0}' was successfully uninstalled!", id));
                }
                if (uninstalledExtensions.some(e => extensions_1.isLanguagePackExtension(e.manifest))) {
                    yield this.updateLocalizationsCache();
                }
            });
        }
        updateLocalizationsCache() {
            return __awaiter(this, void 0, void 0, function* () {
                const localizationService = this.instantiationService.createInstance(localizations_1.LocalizationsService);
                yield localizationService.update();
                localizationService.dispose();
            });
        }
    };
    Main = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, extensionManagement_1.IExtensionManagementService),
        __param(5, extensionManagement_1.IExtensionGalleryService)
    ], Main);
    exports.Main = Main;
    const eventPrefix = 'monacoworkbench';
    function main(argv) {
        const services = new serviceCollection_1.ServiceCollection();
        const environmentService = new environmentService_1.EnvironmentService(argv, process.execPath);
        const logService = spdlogService_1.createSpdLogService('cli', log_1.getLogLevel(environmentService), environmentService.logsPath);
        process.once('exit', () => logService.dispose());
        logService.info('main', argv);
        services.set(environment_1.IEnvironmentService, environmentService);
        services.set(log_1.ILogService, logService);
        services.set(state_1.IStateService, new descriptors_1.SyncDescriptor(stateService_1.StateService));
        const instantiationService = new instantiationService_1.InstantiationService(services);
        return instantiationService.invokeFunction(accessor => {
            const envService = accessor.get(environment_1.IEnvironmentService);
            const stateService = accessor.get(state_1.IStateService);
            return Promise.all([envService.appSettingsHome, envService.extensionsPath].map(p => pfs_1.mkdirp(p))).then(() => {
                const { appRoot, extensionsPath, extensionDevelopmentLocationURI, isBuilt, installSourcePath } = envService;
                const services = new serviceCollection_1.ServiceCollection();
                services.set(configuration_1.IConfigurationService, new descriptors_1.SyncDescriptor(configurationService_1.ConfigurationService));
                services.set(request_1.IRequestService, new descriptors_1.SyncDescriptor(requestService_1.RequestService));
                services.set(extensionManagement_1.IExtensionManagementService, new descriptors_1.SyncDescriptor(extensionManagementService_1.ExtensionManagementService, [false]));
                services.set(extensionManagement_1.IExtensionGalleryService, new descriptors_1.SyncDescriptor(extensionGalleryService_1.ExtensionGalleryService));
                const appenders = [];
                if (isBuilt && !extensionDevelopmentLocationURI && !envService.args['disable-telemetry'] && product_1.default.enableTelemetry) {
                    if (product_1.default.aiConfig && product_1.default.aiConfig.asimovKey) {
                        appenders.push(new appInsightsAppender_1.AppInsightsAppender(eventPrefix, null, product_1.default.aiConfig.asimovKey, logService));
                    }
                    const config = {
                        appender: telemetryUtils_1.combinedAppender(...appenders),
                        commonProperties: commonProperties_1.resolveCommonProperties(product_1.default.commit, package_1.default.version, stateService.getItem('telemetry.machineId'), installSourcePath),
                        piiPaths: [appRoot, extensionsPath]
                    };
                    services.set(telemetry_1.ITelemetryService, new descriptors_1.SyncDescriptor(telemetryService_1.TelemetryService, [config]));
                }
                else {
                    services.set(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
                }
                const instantiationService2 = instantiationService.createChild(services);
                const main = instantiationService2.createInstance(Main, false);
                return main.run(argv).then(() => {
                    // Dispose the AI adapter so that remaining data gets flushed.
                    return telemetryUtils_1.combinedAppender(...appenders).dispose();
                });
            });
        });
    }
    exports.main = main;
});
//# sourceMappingURL=cliProcessMain.js.map