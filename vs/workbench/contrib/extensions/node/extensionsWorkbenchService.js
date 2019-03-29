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
define(["require", "exports", "vs/nls", "semver", "vs/base/common/event", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/paging", "vs/platform/telemetry/common/telemetry", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/platform/windows/common/windows", "vs/base/common/severity", "vs/base/common/uri", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/editor/common/editorService", "vs/platform/url/common/url", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/platform/product/node/product", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/platform/notification/common/notification", "vs/base/common/resources", "vs/platform/storage/common/storage", "vs/platform/files/common/files", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/node/extensionsUtil"], function (require, exports, nls, semver, event_1, arrays_1, async_1, errors_1, lifecycle_1, paging_1, telemetry_1, extensionManagement_1, extensionManagementUtil_1, instantiation_1, configuration_1, windows_1, severity_1, uri_1, extensions_1, editorService_1, url_1, extensionsInput_1, product_1, log_1, progress_1, notification_1, resources, storage_1, files_1, extensions_2, extensionsUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Extension {
        constructor(galleryService, stateProvider, local, gallery, telemetryService, logService, fileService) {
            this.galleryService = galleryService;
            this.stateProvider = stateProvider;
            this.local = local;
            this.gallery = gallery;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.fileService = fileService;
            this.enablementState = 2 /* Enabled */;
            this.isMalicious = false;
        }
        get type() {
            return this.local ? this.local.type : undefined;
        }
        get name() {
            return this.gallery ? this.gallery.name : this.local.manifest.name;
        }
        get displayName() {
            if (this.gallery) {
                return this.gallery.displayName || this.gallery.name;
            }
            return this.local.manifest.displayName || this.local.manifest.name;
        }
        get identifier() {
            if (this.gallery) {
                return this.gallery.identifier;
            }
            return this.local.identifier;
        }
        get uuid() {
            return this.gallery ? this.gallery.identifier.uuid : this.local.identifier.uuid;
        }
        get publisher() {
            return this.gallery ? this.gallery.publisher : this.local.manifest.publisher;
        }
        get publisherDisplayName() {
            if (this.gallery) {
                return this.gallery.publisherDisplayName || this.gallery.publisher;
            }
            if (this.local.metadata && this.local.metadata.publisherDisplayName) {
                return this.local.metadata.publisherDisplayName;
            }
            return this.local.manifest.publisher;
        }
        get version() {
            return this.local ? this.local.manifest.version : this.latestVersion;
        }
        get latestVersion() {
            return this.gallery ? this.gallery.version : this.local.manifest.version;
        }
        get description() {
            return this.gallery ? this.gallery.description : this.local.manifest.description || '';
        }
        get url() {
            if (!product_1.default.extensionsGallery || !this.gallery) {
                return undefined;
            }
            return `${product_1.default.extensionsGallery.itemUrl}?itemName=${this.publisher}.${this.name}`;
        }
        get iconUrl() {
            return this.galleryIconUrl || this.localIconUrl || this.defaultIconUrl;
        }
        get iconUrlFallback() {
            return this.galleryIconUrlFallback || this.localIconUrl || this.defaultIconUrl;
        }
        get localIconUrl() {
            if (this.local && this.local.manifest.icon) {
                return resources.joinPath(this.local.location, this.local.manifest.icon).toString();
            }
            return null;
        }
        get galleryIconUrl() {
            return this.gallery ? this.gallery.assets.icon.uri : null;
        }
        get galleryIconUrlFallback() {
            return this.gallery ? this.gallery.assets.icon.fallbackUri : null;
        }
        get defaultIconUrl() {
            if (this.type === 0 /* System */ && this.local) {
                if (this.local.manifest && this.local.manifest.contributes) {
                    if (Array.isArray(this.local.manifest.contributes.themes) && this.local.manifest.contributes.themes.length) {
                        return require.toUrl('../electron-browser/media/theme-icon.png');
                    }
                    if (Array.isArray(this.local.manifest.contributes.grammars) && this.local.manifest.contributes.grammars.length) {
                        return require.toUrl('../electron-browser/media/language-icon.svg');
                    }
                }
            }
            return require.toUrl('../electron-browser/media/defaultIcon.png');
        }
        get repository() {
            return this.gallery && this.gallery.assets.repository ? this.gallery.assets.repository.uri : undefined;
        }
        get licenseUrl() {
            return this.gallery && this.gallery.assets.license ? this.gallery.assets.license.uri : undefined;
        }
        get state() {
            return this.stateProvider(this);
        }
        get installCount() {
            return this.gallery ? this.gallery.installCount : undefined;
        }
        get rating() {
            return this.gallery ? this.gallery.rating : undefined;
        }
        get ratingCount() {
            return this.gallery ? this.gallery.ratingCount : undefined;
        }
        get outdated() {
            return !!this.gallery && this.type === 1 /* User */ && semver.gt(this.latestVersion, this.version);
        }
        get telemetryData() {
            const { local, gallery } = this;
            if (gallery) {
                return extensionManagementUtil_1.getGalleryExtensionTelemetryData(gallery);
            }
            else {
                return extensionManagementUtil_1.getLocalExtensionTelemetryData(local);
            }
        }
        get preview() {
            return this.gallery ? this.gallery.preview : false;
        }
        isGalleryOutdated() {
            return this.local && this.gallery ? semver.gt(this.local.manifest.version, this.gallery.version) : false;
        }
        getManifest(token) {
            if (this.gallery && !this.isGalleryOutdated()) {
                if (this.gallery.assets.manifest) {
                    return this.galleryService.getManifest(this.gallery, token);
                }
                this.logService.error(nls.localize('Manifest is not found', "Manifest is not found"), this.identifier.id);
                return Promise.resolve(null);
            }
            return Promise.resolve(this.local.manifest);
        }
        hasReadme() {
            if (this.gallery && !this.isGalleryOutdated() && this.gallery.assets.readme) {
                return true;
            }
            if (this.local && this.local.readmeUrl) {
                return true;
            }
            return this.type === 0 /* System */;
        }
        getReadme(token) {
            if (this.gallery && !this.isGalleryOutdated()) {
                if (this.gallery.assets.readme) {
                    return this.galleryService.getReadme(this.gallery, token);
                }
                this.telemetryService.publicLog('extensions:NotFoundReadMe', this.telemetryData);
            }
            if (this.local && this.local.readmeUrl) {
                return this.fileService.resolveContent(this.local.readmeUrl, { encoding: 'utf8' }).then(content => content.value);
            }
            if (this.type === 0 /* System */) {
                return Promise.resolve(`# ${this.displayName || this.name}
**Notice:** This extension is bundled with Visual Studio Code. It can be disabled but not uninstalled.
## Features
${this.description}
`);
            }
            return Promise.reject(new Error('not available'));
        }
        hasChangelog() {
            if (this.gallery && this.gallery.assets.changelog && !this.isGalleryOutdated()) {
                return true;
            }
            if (this.local && this.local.changelogUrl) {
                return true;
            }
            return this.type === 0 /* System */;
        }
        getChangelog(token) {
            if (this.gallery && this.gallery.assets.changelog && !this.isGalleryOutdated()) {
                return this.galleryService.getChangelog(this.gallery, token);
            }
            const changelogUrl = this.local && this.local.changelogUrl;
            if (!changelogUrl) {
                if (this.type === 0 /* System */) {
                    return Promise.resolve('Please check the [VS Code Release Notes](command:update.showCurrentReleaseNotes) for changes to the built-in extensions.');
                }
                return Promise.reject(new Error('not available'));
            }
            return this.fileService.resolveContent(changelogUrl, { encoding: 'utf8' }).then(content => content.value);
        }
        get dependencies() {
            const { local, gallery } = this;
            if (gallery && !this.isGalleryOutdated()) {
                return gallery.properties.dependencies || [];
            }
            if (local && local.manifest.extensionDependencies) {
                return local.manifest.extensionDependencies;
            }
            return [];
        }
        get extensionPack() {
            const { local, gallery } = this;
            if (gallery && !this.isGalleryOutdated()) {
                return gallery.properties.extensionPack || [];
            }
            if (local && local.manifest.extensionPack) {
                return local.manifest.extensionPack;
            }
            return [];
        }
    }
    class ExtensionDependencies {
        constructor(_extension, _identifier, _map, _dependent = null) {
            this._extension = _extension;
            this._identifier = _identifier;
            this._map = _map;
            this._dependent = _dependent;
            this._hasDependencies = null;
        }
        get hasDependencies() {
            if (this._hasDependencies === null) {
                this._hasDependencies = this.computeHasDependencies();
            }
            return this._hasDependencies;
        }
        get extension() {
            return this._extension;
        }
        get identifier() {
            return this._identifier;
        }
        get dependent() {
            return this._dependent;
        }
        get dependencies() {
            if (!this.hasDependencies) {
                return [];
            }
            return this._extension.dependencies.map(id => new ExtensionDependencies(this._map.get(id), id, this._map, this));
        }
        computeHasDependencies() {
            if (this._extension && this._extension.dependencies.length > 0) {
                let dependent = this._dependent;
                while (dependent !== null) {
                    if (dependent.identifier === this.identifier) {
                        return false;
                    }
                    dependent = dependent.dependent;
                }
                return true;
            }
            return false;
        }
    }
    let ExtensionsWorkbenchService = class ExtensionsWorkbenchService {
        constructor(instantiationService, editorService, extensionService, galleryService, configurationService, telemetryService, notificationService, urlService, extensionEnablementService, windowService, logService, progressService, extensionManagementServerService, storageService, fileService) {
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.extensionService = extensionService;
            this.galleryService = galleryService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.extensionEnablementService = extensionEnablementService;
            this.windowService = windowService;
            this.logService = logService;
            this.progressService = progressService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.storageService = storageService;
            this.fileService = fileService;
            this.installing = [];
            this.uninstalling = [];
            this.installed = [];
            this.disposables = [];
            this._onChange = new event_1.Emitter();
            this.stateProvider = ext => this.getExtensionState(ext);
            extensionService.onInstallExtension(this.onInstallExtension, this, this.disposables);
            extensionService.onDidInstallExtension(this.onDidInstallExtension, this, this.disposables);
            extensionService.onUninstallExtension(this.onUninstallExtension, this, this.disposables);
            extensionService.onDidUninstallExtension(this.onDidUninstallExtension, this, this.disposables);
            extensionEnablementService.onEnablementChanged(this.onEnablementChanged, this, this.disposables);
            this.syncDelayer = new async_1.ThrottledDelayer(ExtensionsWorkbenchService.SyncPeriod);
            this.autoUpdateDelayer = new async_1.ThrottledDelayer(1000);
            urlService.registerHandler(this);
            this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(extensions_1.AutoUpdateConfigurationKey)) {
                    if (this.isAutoUpdateEnabled()) {
                        this.checkForUpdates();
                    }
                }
                if (e.affectsConfiguration(extensions_1.AutoCheckUpdatesConfigurationKey)) {
                    if (this.isAutoCheckUpdatesEnabled()) {
                        this.checkForUpdates();
                    }
                }
            }, this, this.disposables);
            this.queryLocal().then(() => {
                this.resetIgnoreAutoUpdateExtensions();
                this.eventuallySyncWithGallery(true);
            });
        }
        get onChange() { return this._onChange.event; }
        get local() {
            const installing = this.installing
                .filter(e => !this.installed.some(installed => extensionManagementUtil_1.areSameExtensions(installed.identifier, e.identifier)))
                .map(e => e);
            return [...this.installed, ...installing];
        }
        queryLocal() {
            return this.extensionService.getInstalled()
                .then(installed => {
                if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                    installed = installed.filter(installed => this.belongsToWindow(installed));
                }
                const installedById = arrays_1.index(this.installed, e => e.identifier.id);
                this.installed = installed.map(local => {
                    const extension = installedById[local.identifier.id] || new Extension(this.galleryService, this.stateProvider, local, undefined, this.telemetryService, this.logService, this.fileService);
                    extension.enablementState = this.extensionEnablementService.getEnablementState(local);
                    return extension;
                });
                this._onChange.fire(undefined);
                return this.local;
            });
        }
        queryGallery(options = {}) {
            return this.extensionService.getExtensionsReport()
                .then(report => {
                const maliciousSet = extensionManagementUtil_1.getMaliciousExtensionsSet(report);
                return this.galleryService.query(options)
                    .then(result => paging_1.mapPager(result, gallery => this.fromGallery(gallery, maliciousSet)))
                    .then(undefined, err => {
                    if (/No extension gallery service configured/.test(err.message)) {
                        return Promise.resolve(paging_1.singlePagePager([]));
                    }
                    return Promise.reject(err);
                });
            });
        }
        loadDependencies(extension, token) {
            if (!extension.dependencies.length) {
                return Promise.resolve(null);
            }
            return this.extensionService.getExtensionsReport()
                .then(report => {
                const maliciousSet = extensionManagementUtil_1.getMaliciousExtensionsSet(report);
                return this.galleryService.loadAllDependencies(extension.dependencies.map(id => ({ id })), token)
                    .then(galleryExtensions => {
                    const extensions = [...this.local, ...galleryExtensions.map(galleryExtension => this.fromGallery(galleryExtension, maliciousSet))];
                    const map = new Map();
                    for (const extension of extensions) {
                        map.set(extension.identifier.id, extension);
                    }
                    return new ExtensionDependencies(extension, extension.identifier.id, map);
                });
            });
        }
        open(extension, sideByside = false) {
            return Promise.resolve(this.editorService.openEditor(this.instantiationService.createInstance(extensionsInput_1.ExtensionsInput, extension), undefined, sideByside ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP));
        }
        belongsToWindow(extension) {
            if (!this.extensionManagementServerService.remoteExtensionManagementServer) {
                return true;
            }
            const extensionManagementServer = this.extensionManagementServerService.getExtensionManagementServer(extension.location);
            if (extensionsUtil_1.isUIExtension(extension.manifest, this.configurationService)) {
                if (this.extensionManagementServerService.localExtensionManagementServer === extensionManagementServer) {
                    return true;
                }
            }
            else {
                if (this.extensionManagementServerService.remoteExtensionManagementServer === extensionManagementServer) {
                    return true;
                }
            }
            return false;
        }
        fromGallery(gallery, maliciousExtensionSet) {
            let result = this.getInstalledExtensionMatchingGallery(gallery);
            if (result) {
                // Loading the compatible version only there is an engine property
                // Otherwise falling back to old way so that we will not make many roundtrips
                if (gallery.properties.engine) {
                    this.galleryService.getCompatibleExtension(gallery)
                        .then(compatible => compatible ? this.syncLocalWithGalleryExtension(result, compatible) : null);
                }
                else {
                    this.syncLocalWithGalleryExtension(result, gallery);
                }
            }
            else {
                result = new Extension(this.galleryService, this.stateProvider, undefined, gallery, this.telemetryService, this.logService, this.fileService);
            }
            if (maliciousExtensionSet.has(result.identifier.id)) {
                result.isMalicious = true;
            }
            return result;
        }
        getInstalledExtensionMatchingGallery(gallery) {
            for (const installed of this.installed) {
                if (installed.uuid) { // Installed from Gallery
                    if (installed.uuid === gallery.identifier.uuid) {
                        return installed;
                    }
                }
                else {
                    if (extensionManagementUtil_1.areSameExtensions(installed.identifier, gallery.identifier)) { // Installed from other sources
                        return installed;
                    }
                }
            }
            return null;
        }
        syncLocalWithGalleryExtension(extension, gallery) {
            // Sync the local extension with gallery extension if local extension doesnot has metadata
            if (extension.local) {
                (extension.local.metadata ? Promise.resolve(extension.local) : this.extensionService.updateMetadata(extension.local, { id: gallery.identifier.uuid, publisherDisplayName: gallery.publisherDisplayName, publisherId: gallery.publisherId }))
                    .then(local => {
                    extension.local = local;
                    extension.gallery = gallery;
                    this._onChange.fire(extension);
                    this.eventuallyAutoUpdateExtensions();
                });
            }
            else {
                this._onChange.fire(extension);
            }
        }
        checkForUpdates() {
            return Promise.resolve(this.syncDelayer.trigger(() => this.syncWithGallery(), 0));
        }
        isAutoUpdateEnabled() {
            return this.configurationService.getValue(extensions_1.AutoUpdateConfigurationKey);
        }
        isAutoCheckUpdatesEnabled() {
            return this.configurationService.getValue(extensions_1.AutoCheckUpdatesConfigurationKey);
        }
        eventuallySyncWithGallery(immediate = false) {
            const shouldSync = this.isAutoUpdateEnabled() || this.isAutoCheckUpdatesEnabled();
            const loop = () => (shouldSync ? this.syncWithGallery() : Promise.resolve(undefined)).then(() => this.eventuallySyncWithGallery());
            const delay = immediate ? 0 : ExtensionsWorkbenchService.SyncPeriod;
            this.syncDelayer.trigger(loop, delay)
                .then(undefined, err => null);
        }
        syncWithGallery() {
            const ids = [], names = [];
            for (const installed of this.installed) {
                if (installed.type === 1 /* User */) {
                    if (installed.uuid) {
                        ids.push(installed.uuid);
                    }
                    else {
                        names.push(installed.identifier.id);
                    }
                }
            }
            const promises = [];
            if (ids.length) {
                promises.push(this.queryGallery({ ids, pageSize: ids.length }));
            }
            if (names.length) {
                promises.push(this.queryGallery({ names, pageSize: names.length }));
            }
            return Promise.all(promises).then(() => undefined);
        }
        eventuallyAutoUpdateExtensions() {
            this.autoUpdateDelayer.trigger(() => this.autoUpdateExtensions())
                .then(undefined, err => null);
        }
        autoUpdateExtensions() {
            if (!this.isAutoUpdateEnabled()) {
                return Promise.resolve();
            }
            const toUpdate = this.local.filter(e => e.outdated && e.state !== 0 /* Installing */
                && e.local && !this.isAutoUpdateIgnored(new extensions_2.ExtensionIdentifierWithVersion(e.identifier, e.version)));
            return Promise.all(toUpdate.map(e => this.install(e)));
        }
        canInstall(extension) {
            if (!(extension instanceof Extension)) {
                return false;
            }
            if (extension.isMalicious) {
                return false;
            }
            return !!extension.gallery;
        }
        install(extension) {
            if (typeof extension === 'string') {
                return this.installWithProgress(() => __awaiter(this, void 0, void 0, function* () {
                    const extensionIdentifier = yield this.extensionService.install(uri_1.URI.file(extension));
                    this.checkAndEnableDisabledDependencies(extensionIdentifier);
                    return this.local.filter(local => extensionManagementUtil_1.areSameExtensions(local.identifier, extensionIdentifier))[0];
                }));
            }
            if (extension.isMalicious) {
                return Promise.reject(new Error(nls.localize('malicious', "This extension is reported to be problematic.")));
            }
            const gallery = extension.gallery;
            if (!gallery) {
                return Promise.reject(new Error('Missing gallery'));
            }
            return this.installWithProgress(() => __awaiter(this, void 0, void 0, function* () {
                yield this.extensionService.installFromGallery(gallery);
                this.checkAndEnableDisabledDependencies(gallery.identifier);
                return this.local.filter(local => extensionManagementUtil_1.areSameExtensions(local.identifier, gallery.identifier))[0];
            }), gallery.displayName);
        }
        setEnablement(extensions, enablementState) {
            extensions = Array.isArray(extensions) ? extensions : [extensions];
            return this.promptAndSetEnablement(extensions, enablementState);
        }
        uninstall(extension) {
            const ext = extension.local ? extension : this.installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, extension.identifier))[0];
            const toUninstall = ext && ext.local ? ext.local : null;
            if (!toUninstall) {
                return Promise.reject(new Error('Missing local'));
            }
            this.logService.info(`Requested uninstalling the extension ${extension.identifier.id} from window ${this.windowService.getCurrentWindowId()}`);
            return this.progressService.withProgress({
                location: 5 /* Extensions */,
                title: nls.localize('uninstallingExtension', 'Uninstalling extension....'),
                source: `${toUninstall.identifier.id}`
            }, () => this.extensionService.uninstall(toUninstall).then(() => undefined));
        }
        installVersion(extension, version) {
            if (!(extension instanceof Extension)) {
                return Promise.resolve(extension);
            }
            if (!extension.gallery) {
                return Promise.reject(new Error('Missing gallery'));
            }
            return this.galleryService.getCompatibleExtension(extension.gallery.identifier, version)
                .then(gallery => {
                if (!gallery) {
                    return Promise.reject(new Error(nls.localize('incompatible', "Unable to install extension '{0}' with version '{1}' as it is not compatible with VS Code.", extension.gallery.identifier.id, version)));
                }
                return this.installWithProgress(() => __awaiter(this, void 0, void 0, function* () {
                    yield this.extensionService.installFromGallery(gallery);
                    if (extension.latestVersion !== version) {
                        this.ignoreAutoUpdate(new extensions_2.ExtensionIdentifierWithVersion(gallery.identifier, version));
                    }
                    return this.local.filter(local => extensionManagementUtil_1.areSameExtensions(local.identifier, gallery.identifier))[0];
                }), gallery.displayName);
            });
        }
        reinstall(extension) {
            const ext = extension.local ? extension : this.installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, extension.identifier))[0];
            const toReinstall = ext && ext.local ? ext.local : null;
            if (!toReinstall) {
                return Promise.reject(new Error('Missing local'));
            }
            return this.progressService.withProgress({
                location: 5 /* Extensions */,
                source: `${toReinstall.identifier.id}`
            }, () => this.extensionService.reinstallFromGallery(toReinstall).then(() => this.local.filter(local => extensionManagementUtil_1.areSameExtensions(local.identifier, extension.identifier))[0]));
        }
        installWithProgress(installTask, extensionName) {
            const title = extensionName ? nls.localize('installing named extension', "Installing '{0}' extension....", extensionName) : nls.localize('installing extension', 'Installing extension....');
            return this.progressService.withProgress({
                location: 5 /* Extensions */,
                title
            }, () => installTask());
        }
        checkAndEnableDisabledDependencies(extensionIdentifier) {
            const extension = this.local.filter(e => (e.local || e.gallery) && extensionManagementUtil_1.areSameExtensions(extensionIdentifier, e.identifier))[0];
            if (extension) {
                const disabledDepencies = this.getExtensionsRecursively([extension], this.local, 2 /* Enabled */, { dependencies: true, pack: false });
                if (disabledDepencies.length) {
                    return this.setEnablement(disabledDepencies, 2 /* Enabled */);
                }
            }
            return Promise.resolve();
        }
        promptAndSetEnablement(extensions, enablementState) {
            const enable = enablementState === 2 /* Enabled */ || enablementState === 3 /* WorkspaceEnabled */;
            if (enable) {
                const allDependenciesAndPackedExtensions = this.getExtensionsRecursively(extensions, this.local, enablementState, { dependencies: true, pack: true });
                return this.checkAndSetEnablement(extensions, allDependenciesAndPackedExtensions, enablementState);
            }
            else {
                const packedExtensions = this.getExtensionsRecursively(extensions, this.local, enablementState, { dependencies: false, pack: true });
                if (packedExtensions.length) {
                    return this.checkAndSetEnablement(extensions, packedExtensions, enablementState);
                }
                return this.checkAndSetEnablement(extensions, [], enablementState);
            }
        }
        checkAndSetEnablement(extensions, otherExtensions, enablementState) {
            const allExtensions = [...extensions, ...otherExtensions];
            const enable = enablementState === 2 /* Enabled */ || enablementState === 3 /* WorkspaceEnabled */;
            if (!enable) {
                for (const extension of extensions) {
                    let dependents = this.getDependentsAfterDisablement(extension, allExtensions, this.local);
                    if (dependents.length) {
                        return Promise.reject(new Error(this.getDependentsErrorMessage(extension, allExtensions, dependents)));
                    }
                }
            }
            return this.doSetEnablement(allExtensions, enablementState);
        }
        getExtensionsRecursively(extensions, installed, enablementState, options, checked = []) {
            const toCheck = extensions.filter(e => checked.indexOf(e) === -1);
            if (toCheck.length) {
                for (const extension of toCheck) {
                    checked.push(extension);
                }
                const extensionsToDisable = installed.filter(i => {
                    if (checked.indexOf(i) !== -1) {
                        return false;
                    }
                    if (i.enablementState === enablementState) {
                        return false;
                    }
                    const enable = enablementState === 2 /* Enabled */ || enablementState === 3 /* WorkspaceEnabled */;
                    return (enable || i.type === 1 /* User */) // Include all Extensions for enablement and only user extensions for disablement
                        && (options.dependencies || options.pack)
                        && extensions.some(extension => (options.dependencies && extension.dependencies.some(id => extensionManagementUtil_1.areSameExtensions({ id }, i.identifier)))
                            || (options.pack && extension.extensionPack.some(id => extensionManagementUtil_1.areSameExtensions({ id }, i.identifier))));
                });
                if (extensionsToDisable.length) {
                    extensionsToDisable.push(...this.getExtensionsRecursively(extensionsToDisable, installed, enablementState, options, checked));
                }
                return extensionsToDisable;
            }
            return [];
        }
        getDependentsAfterDisablement(extension, extensionsToDisable, installed) {
            return installed.filter(i => {
                if (i.dependencies.length === 0) {
                    return false;
                }
                if (i === extension) {
                    return false;
                }
                if (i.enablementState === 1 /* WorkspaceDisabled */ || i.enablementState === 0 /* Disabled */) {
                    return false;
                }
                if (extensionsToDisable.indexOf(i) !== -1) {
                    return false;
                }
                return i.dependencies.some(dep => [extension, ...extensionsToDisable].some(d => extensionManagementUtil_1.areSameExtensions(d.identifier, { id: dep })));
            });
        }
        getDependentsErrorMessage(extension, allDisabledExtensions, dependents) {
            for (const e of [extension, ...allDisabledExtensions]) {
                let dependentsOfTheExtension = dependents.filter(d => d.dependencies.some(id => extensionManagementUtil_1.areSameExtensions({ id }, e.identifier)));
                if (dependentsOfTheExtension.length) {
                    return this.getErrorMessageForDisablingAnExtensionWithDependents(e, dependentsOfTheExtension);
                }
            }
            return '';
        }
        getErrorMessageForDisablingAnExtensionWithDependents(extension, dependents) {
            if (dependents.length === 1) {
                return nls.localize('singleDependentError', "Cannot disable extension '{0}'. Extension '{1}' depends on this.", extension.displayName, dependents[0].displayName);
            }
            if (dependents.length === 2) {
                return nls.localize('twoDependentsError', "Cannot disable extension '{0}'. Extensions '{1}' and '{2}' depend on this.", extension.displayName, dependents[0].displayName, dependents[1].displayName);
            }
            return nls.localize('multipleDependentsError', "Cannot disable extension '{0}'. Extensions '{1}', '{2}' and others depend on this.", extension.displayName, dependents[0].displayName, dependents[1].displayName);
        }
        doSetEnablement(extensions, enablementState) {
            return __awaiter(this, void 0, void 0, function* () {
                const changed = yield this.extensionEnablementService.setEnablement(extensions.map(e => e.local), enablementState);
                for (let i = 0; i < changed.length; i++) {
                    if (changed[i]) {
                        /* __GDPR__
                        "extension:enable" : {
                            "${include}": [
                                "${GalleryExtensionTelemetryData}"
                            ]
                        }
                        */
                        /* __GDPR__
                        "extension:disable" : {
                            "${include}": [
                                "${GalleryExtensionTelemetryData}"
                            ]
                        }
                        */
                        this.telemetryService.publicLog(enablementState === 2 /* Enabled */ || enablementState === 3 /* WorkspaceEnabled */ ? 'extension:enable' : 'extension:disable', extensions[i].telemetryData);
                    }
                }
                return changed;
            });
        }
        get allowedBadgeProviders() {
            if (!this._extensionAllowedBadgeProviders) {
                this._extensionAllowedBadgeProviders = (product_1.default.extensionAllowedBadgeProviders || []).map(s => s.toLowerCase());
            }
            return this._extensionAllowedBadgeProviders;
        }
        onInstallExtension(event) {
            const { gallery } = event;
            if (!gallery) {
                return;
            }
            let extension = this.installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, gallery.identifier))[0];
            if (!extension) {
                extension = new Extension(this.galleryService, this.stateProvider, undefined, gallery, this.telemetryService, this.logService, this.fileService);
            }
            this.installing.push(extension);
            this._onChange.fire(extension);
        }
        onDidInstallExtension(event) {
            const { local, zipPath, error, gallery } = event;
            const installingExtension = gallery ? this.installing.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, gallery.identifier))[0] : null;
            this.installing = installingExtension ? this.installing.filter(e => e !== installingExtension) : this.installing;
            if (local && !this.belongsToWindow(local)) {
                return;
            }
            let extension = installingExtension ? installingExtension : zipPath ? new Extension(this.galleryService, this.stateProvider, local, undefined, this.telemetryService, this.logService, this.fileService) : undefined;
            if (extension) {
                if (local) {
                    const installed = this.installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, extension.identifier))[0];
                    if (installed) {
                        extension = installed;
                    }
                    else {
                        this.installed.push(extension);
                    }
                    extension.local = local;
                    extension.gallery = gallery;
                }
            }
            this._onChange.fire(error ? undefined : extension);
        }
        onUninstallExtension(identifier) {
            const extension = this.installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, identifier))[0];
            if (!extension) {
                return;
            }
            const uninstalling = this.uninstalling.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, identifier))[0] || extension;
            this.uninstalling = [uninstalling, ...this.uninstalling.filter(e => !extensionManagementUtil_1.areSameExtensions(e.identifier, identifier))];
            this._onChange.fire(uninstalling);
        }
        onDidUninstallExtension({ identifier, error }) {
            if (!error) {
                this.installed = this.installed.filter(e => !extensionManagementUtil_1.areSameExtensions(e.identifier, identifier));
            }
            const uninstalling = this.uninstalling.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, identifier))[0];
            this.uninstalling = this.uninstalling.filter(e => !extensionManagementUtil_1.areSameExtensions(e.identifier, identifier));
            if (!uninstalling) {
                return;
            }
            this._onChange.fire(uninstalling);
        }
        onEnablementChanged(platformExtensions) {
            const extensions = this.local.filter(e => platformExtensions.some(p => extensionManagementUtil_1.areSameExtensions(e.identifier, p.identifier)));
            for (const extension of extensions) {
                if (extension.local) {
                    const enablementState = this.extensionEnablementService.getEnablementState(extension.local);
                    if (enablementState !== extension.enablementState) {
                        extension.enablementState = enablementState;
                        this._onChange.fire(extension);
                    }
                }
            }
        }
        getExtensionState(extension) {
            if (extension.gallery && this.installing.some(e => !!e.gallery && extensionManagementUtil_1.areSameExtensions(e.gallery.identifier, extension.gallery.identifier))) {
                return 0 /* Installing */;
            }
            if (this.uninstalling.some(e => extensionManagementUtil_1.areSameExtensions(e.identifier, extension.identifier))) {
                return 2 /* Uninstalling */;
            }
            const local = this.installed.filter(e => e === extension || (e.gallery && extension.gallery && extensionManagementUtil_1.areSameExtensions(e.gallery.identifier, extension.gallery.identifier)))[0];
            return local ? 1 /* Installed */ : 3 /* Uninstalled */;
        }
        onError(err) {
            if (errors_1.isPromiseCanceledError(err)) {
                return;
            }
            const message = err && err.message || '';
            if (/getaddrinfo ENOTFOUND|getaddrinfo ENOENT|connect EACCES|connect ECONNREFUSED/.test(message)) {
                return;
            }
            this.notificationService.error(err);
        }
        handleURL(uri) {
            if (!/^extension/.test(uri.path)) {
                return Promise.resolve(false);
            }
            this.onOpenExtensionUrl(uri);
            return Promise.resolve(true);
        }
        onOpenExtensionUrl(uri) {
            const match = /^extension\/([^/]+)$/.exec(uri.path);
            if (!match) {
                return;
            }
            const extensionId = match[1];
            this.queryLocal().then(local => {
                const extension = local.filter(local => extensionManagementUtil_1.areSameExtensions(local.identifier, { id: extensionId }))[0];
                if (extension) {
                    return this.windowService.show()
                        .then(() => this.open(extension));
                }
                return this.queryGallery({ names: [extensionId], source: 'uri' }).then(result => {
                    if (result.total < 1) {
                        return Promise.resolve(null);
                    }
                    const extension = result.firstPage[0];
                    return this.windowService.show().then(() => {
                        return this.open(extension).then(() => {
                            this.notificationService.prompt(severity_1.default.Info, nls.localize('installConfirmation', "Would you like to install the '{0}' extension?", extension.displayName, extension.publisher), [{
                                    label: nls.localize('install', "Install"),
                                    run: () => this.install(extension).then(undefined, error => this.onError(error))
                                }], { sticky: true });
                        });
                    });
                });
            }).then(undefined, error => this.onError(error));
        }
        get ignoredAutoUpdateExtensions() {
            if (!this._ignoredAutoUpdateExtensions) {
                this._ignoredAutoUpdateExtensions = JSON.parse(this.storageService.get('extensions.ignoredAutoUpdateExtension', 0 /* GLOBAL */, '[]') || '[]');
            }
            return this._ignoredAutoUpdateExtensions;
        }
        set ignoredAutoUpdateExtensions(extensionIds) {
            this._ignoredAutoUpdateExtensions = arrays_1.distinct(extensionIds.map(id => id.toLowerCase()));
            this.storageService.store('extensions.ignoredAutoUpdateExtension', JSON.stringify(this._ignoredAutoUpdateExtensions), 0 /* GLOBAL */);
        }
        ignoreAutoUpdate(identifierWithVersion) {
            if (!this.isAutoUpdateIgnored(identifierWithVersion)) {
                this.ignoredAutoUpdateExtensions = [...this.ignoredAutoUpdateExtensions, identifierWithVersion.key()];
            }
        }
        isAutoUpdateIgnored(identifierWithVersion) {
            return this.ignoredAutoUpdateExtensions.indexOf(identifierWithVersion.key()) !== -1;
        }
        resetIgnoreAutoUpdateExtensions() {
            this.ignoredAutoUpdateExtensions = this.ignoredAutoUpdateExtensions.filter(extensionId => this.local.some(local => !!local.local && new extensions_2.ExtensionIdentifierWithVersion(local.identifier, local.version).key() === extensionId));
        }
        dispose() {
            this.syncDelayer.cancel();
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    };
    ExtensionsWorkbenchService.SyncPeriod = 1000 * 60 * 60 * 12; // 12 hours
    ExtensionsWorkbenchService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, editorService_1.IEditorService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, extensionManagement_1.IExtensionGalleryService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, notification_1.INotificationService),
        __param(7, url_1.IURLService),
        __param(8, extensionManagement_1.IExtensionEnablementService),
        __param(9, windows_1.IWindowService),
        __param(10, log_1.ILogService),
        __param(11, progress_1.IProgressService2),
        __param(12, extensionManagement_1.IExtensionManagementServerService),
        __param(13, storage_1.IStorageService),
        __param(14, files_1.IFileService)
    ], ExtensionsWorkbenchService);
    exports.ExtensionsWorkbenchService = ExtensionsWorkbenchService;
});
//# sourceMappingURL=extensionsWorkbenchService.js.map