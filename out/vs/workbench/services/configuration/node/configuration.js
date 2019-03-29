/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/base/common/uri", "crypto", "vs/base/common/resources", "vs/base/common/event", "vs/base/node/pfs", "vs/base/common/errors", "vs/base/common/collections", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configuration", "vs/base/node/extfs", "vs/base/common/path", "vs/base/common/objects", "vs/base/common/network"], function (require, exports, uri_1, crypto_1, resources, event_1, pfs, errors, collections, lifecycle_1, async_1, configurationModels_1, configurationModels_2, configuration_1, extfs, path_1, objects_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WorkspaceConfiguration extends lifecycle_1.Disposable {
        constructor(environmentService) {
            super();
            this._workspaceIdentifier = null;
            this._fileService = null;
            this._onDidUpdateConfiguration = this._register(new event_1.Emitter());
            this.onDidUpdateConfiguration = this._onDidUpdateConfiguration.event;
            this._cachedConfiguration = new CachedWorkspaceConfiguration(environmentService);
            this._workspaceConfiguration = this._cachedConfiguration;
        }
        adopt(fileService) {
            if (!this._fileService) {
                this._fileService = fileService;
                if (this.adoptWorkspaceConfiguration()) {
                    if (this._workspaceIdentifier) {
                        return this._workspaceConfiguration.load(this._workspaceIdentifier).then(() => true);
                    }
                }
            }
            return Promise.resolve(false);
        }
        load(workspaceIdentifier) {
            this._workspaceIdentifier = workspaceIdentifier;
            this.adoptWorkspaceConfiguration();
            return this._workspaceConfiguration.load(this._workspaceIdentifier);
        }
        reload() {
            return this._workspaceIdentifier ? this.load(this._workspaceIdentifier) : Promise.resolve();
        }
        getFolders() {
            return this._workspaceConfiguration.getFolders();
        }
        setFolders(folders, jsonEditingService) {
            if (this._workspaceIdentifier) {
                return jsonEditingService.write(this._workspaceIdentifier.configPath, { key: 'folders', value: folders }, true)
                    .then(() => this.reload());
            }
            return Promise.resolve();
        }
        getConfiguration() {
            return this._workspaceConfiguration.getWorkspaceSettings();
        }
        reprocessWorkspaceSettings() {
            this._workspaceConfiguration.reprocessWorkspaceSettings();
            return this.getConfiguration();
        }
        adoptWorkspaceConfiguration() {
            if (this._workspaceIdentifier) {
                if (this._fileService) {
                    if (!(this._workspaceConfiguration instanceof FileServiceBasedWorkspaceConfiguration)) {
                        const oldWorkspaceConfiguration = this._workspaceConfiguration;
                        this._workspaceConfiguration = new FileServiceBasedWorkspaceConfiguration(this._fileService, oldWorkspaceConfiguration);
                        this._register(this._workspaceConfiguration.onDidChange(e => this.onDidWorkspaceConfigurationChange()));
                        if (oldWorkspaceConfiguration instanceof CachedWorkspaceConfiguration) {
                            this.updateCache();
                            return true;
                        }
                        else {
                            lifecycle_1.dispose(oldWorkspaceConfiguration);
                            return false;
                        }
                    }
                    return false;
                }
                if (this._workspaceIdentifier.configPath.scheme === network_1.Schemas.file) {
                    if (!(this._workspaceConfiguration instanceof NodeBasedWorkspaceConfiguration)) {
                        lifecycle_1.dispose(this._workspaceConfiguration);
                        this._workspaceConfiguration = new NodeBasedWorkspaceConfiguration();
                        return true;
                    }
                    return false;
                }
            }
            return false;
        }
        onDidWorkspaceConfigurationChange() {
            this.updateCache();
            this.reload().then(() => this._onDidUpdateConfiguration.fire());
        }
        updateCache() {
            if (this._workspaceIdentifier && this._workspaceIdentifier.configPath.scheme !== network_1.Schemas.file && this._workspaceConfiguration instanceof FileServiceBasedWorkspaceConfiguration) {
                return this._workspaceConfiguration.load(this._workspaceIdentifier)
                    .then(() => this._cachedConfiguration.updateWorkspace(this._workspaceIdentifier, this._workspaceConfiguration.getConfigurationModel()));
            }
            return Promise.resolve(undefined);
        }
    }
    exports.WorkspaceConfiguration = WorkspaceConfiguration;
    class AbstractWorkspaceConfiguration extends lifecycle_1.Disposable {
        constructor(from) {
            super();
            this._workspaceIdentifier = null;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.workspaceConfigurationModelParser = from ? from.workspaceConfigurationModelParser : new configurationModels_2.WorkspaceConfigurationModelParser('');
            this.workspaceSettings = from ? from.workspaceSettings : new configurationModels_1.ConfigurationModel();
        }
        get workspaceIdentifier() {
            return this._workspaceIdentifier;
        }
        load(workspaceIdentifier) {
            this._workspaceIdentifier = workspaceIdentifier;
            return this.loadWorkspaceConfigurationContents(workspaceIdentifier)
                .then(contents => {
                this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser(workspaceIdentifier.id);
                this.workspaceConfigurationModelParser.parse(contents);
                this.consolidate();
            });
        }
        getConfigurationModel() {
            return this.workspaceConfigurationModelParser.configurationModel;
        }
        getFolders() {
            return this.workspaceConfigurationModelParser.folders;
        }
        getWorkspaceSettings() {
            return this.workspaceSettings;
        }
        reprocessWorkspaceSettings() {
            this.workspaceConfigurationModelParser.reprocessWorkspaceSettings();
            this.consolidate();
            return this.getWorkspaceSettings();
        }
        consolidate() {
            this.workspaceSettings = this.workspaceConfigurationModelParser.settingsModel.merge(this.workspaceConfigurationModelParser.launchModel);
        }
    }
    class NodeBasedWorkspaceConfiguration extends AbstractWorkspaceConfiguration {
        loadWorkspaceConfigurationContents(workspaceIdentifier) {
            return pfs.readFile(workspaceIdentifier.configPath.fsPath)
                .then(contents => contents.toString(), e => {
                errors.onUnexpectedError(e);
                return '';
            });
        }
    }
    class FileServiceBasedWorkspaceConfiguration extends AbstractWorkspaceConfiguration {
        constructor(fileService, from) {
            super(from);
            this.fileService = fileService;
            this.workspaceConfig = null;
            this.workspaceConfig = from && from.workspaceIdentifier ? from.workspaceIdentifier.configPath : null;
            this._register(fileService.onFileChanges(e => this.handleWorkspaceFileEvents(e)));
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this._onDidChange.fire(), 50));
            this.watchWorkspaceConfigurationFile();
            this._register(lifecycle_1.toDisposable(() => this.unWatchWorkspaceConfigurtionFile()));
        }
        watchWorkspaceConfigurationFile() {
            if (this.workspaceConfig) {
                this.fileService.watchFileChanges(this.workspaceConfig);
            }
        }
        unWatchWorkspaceConfigurtionFile() {
            if (this.workspaceConfig) {
                this.fileService.unwatchFileChanges(this.workspaceConfig);
            }
        }
        loadWorkspaceConfigurationContents(workspaceIdentifier) {
            if (!(this.workspaceConfig && resources.isEqual(this.workspaceConfig, workspaceIdentifier.configPath))) {
                this.unWatchWorkspaceConfigurtionFile();
                this.workspaceConfig = workspaceIdentifier.configPath;
                this.watchWorkspaceConfigurationFile();
            }
            return this.fileService.resolveContent(this.workspaceConfig)
                .then(content => content.value, e => {
                errors.onUnexpectedError(e);
                return '';
            });
        }
        handleWorkspaceFileEvents(event) {
            if (this.workspaceConfig) {
                const events = event.changes;
                let affectedByChanges = false;
                // Find changes that affect workspace file
                for (let i = 0, len = events.length; i < len && !affectedByChanges; i++) {
                    affectedByChanges = resources.isEqual(this.workspaceConfig, events[i].resource);
                }
                if (affectedByChanges) {
                    this.reloadConfigurationScheduler.schedule();
                }
            }
        }
    }
    class CachedWorkspaceConfiguration extends lifecycle_1.Disposable {
        constructor(environmentService) {
            super();
            this.environmentService = environmentService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser('');
            this.workspaceSettings = new configurationModels_1.ConfigurationModel();
        }
        load(workspaceIdentifier) {
            this.createPaths(workspaceIdentifier);
            return pfs.readFile(this.cachedConfigurationPath)
                .then(contents => {
                this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser(this.cachedConfigurationPath);
                this.workspaceConfigurationModelParser.parse(contents.toString());
                this.workspaceSettings = this.workspaceConfigurationModelParser.settingsModel.merge(this.workspaceConfigurationModelParser.launchModel);
            }, () => { });
        }
        get workspaceIdentifier() {
            return null;
        }
        getConfigurationModel() {
            return this.workspaceConfigurationModelParser.configurationModel;
        }
        getFolders() {
            return this.workspaceConfigurationModelParser.folders;
        }
        getWorkspaceSettings() {
            return this.workspaceSettings;
        }
        reprocessWorkspaceSettings() {
            return this.workspaceSettings;
        }
        updateWorkspace(workspaceIdentifier, configurationModel) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    this.createPaths(workspaceIdentifier);
                    if (configurationModel.keys.length) {
                        const exists = yield pfs.exists(this.cachedWorkspacePath);
                        if (!exists) {
                            yield pfs.mkdirp(this.cachedWorkspacePath);
                        }
                        const raw = JSON.stringify(configurationModel.toJSON().contents);
                        yield pfs.writeFile(this.cachedConfigurationPath, raw);
                    }
                    else {
                        pfs.rimraf(this.cachedWorkspacePath);
                    }
                }
                catch (error) {
                    errors.onUnexpectedError(error);
                }
            });
        }
        createPaths(workspaceIdentifier) {
            this.cachedWorkspacePath = path_1.join(this.environmentService.userDataPath, 'CachedConfigurations', 'workspaces', workspaceIdentifier.id);
            this.cachedConfigurationPath = path_1.join(this.cachedWorkspacePath, 'workspace.json');
        }
    }
    function isFolderConfigurationFile(resource) {
        const configurationNameResource = uri_1.URI.from({ scheme: resource.scheme, path: resources.basename(resource) });
        return [`${configuration_1.FOLDER_SETTINGS_NAME}.json`, `${configuration_1.TASKS_CONFIGURATION_KEY}.json`, `${configuration_1.LAUNCH_CONFIGURATION_KEY}.json`].some(configurationFileName => resources.isEqual(configurationNameResource, uri_1.URI.from({ scheme: resource.scheme, path: configurationFileName }))); // only workspace config files
    }
    function isFolderSettingsConfigurationFile(resource) {
        return resources.isEqual(uri_1.URI.from({ scheme: resource.scheme, path: resources.basename(resource) }), uri_1.URI.from({ scheme: resource.scheme, path: `${configuration_1.FOLDER_SETTINGS_NAME}.json` }));
    }
    class AbstractFolderConfiguration extends lifecycle_1.Disposable {
        constructor(folder, workbenchState, from) {
            super();
            this.folder = folder;
            this._loaded = false;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._folderSettingsModelParser = from ? from._folderSettingsModelParser : new configurationModels_2.FolderSettingsModelParser(configuration_1.FOLDER_SETTINGS_PATH, 3 /* WORKSPACE */ === workbenchState ? [3 /* RESOURCE */] : [2 /* WINDOW */, 3 /* RESOURCE */]);
            this._standAloneConfigurations = from ? from._standAloneConfigurations : [];
            this._cache = from ? from._cache : new configurationModels_1.ConfigurationModel();
        }
        get loaded() {
            return this._loaded;
        }
        loadConfiguration() {
            return this.loadFolderConfigurationContents()
                .then((contents) => {
                // reset
                this._standAloneConfigurations = [];
                this._folderSettingsModelParser.parse('');
                // parse
                this.parseContents(contents);
                // Consolidate (support *.json files in the workspace settings folder)
                this.consolidate();
                this._loaded = true;
                return this._cache;
            });
        }
        reprocess() {
            const oldContents = this._folderSettingsModelParser.configurationModel.contents;
            this._folderSettingsModelParser.reprocess();
            if (!objects_1.equals(oldContents, this._folderSettingsModelParser.configurationModel.contents)) {
                this.consolidate();
            }
            return this._cache;
        }
        consolidate() {
            this._cache = this._folderSettingsModelParser.configurationModel.merge(...this._standAloneConfigurations);
        }
        parseContents(contents) {
            for (const content of contents) {
                if (isFolderSettingsConfigurationFile(content.resource)) {
                    this._folderSettingsModelParser.parse(content.value);
                }
                else {
                    const name = resources.basename(content.resource);
                    const matches = /([^\.]*)*\.json/.exec(name);
                    if (matches && matches[1]) {
                        const standAloneConfigurationModelParser = new configurationModels_2.StandaloneConfigurationModelParser(content.resource.toString(), matches[1]);
                        standAloneConfigurationModelParser.parse(content.value);
                        this._standAloneConfigurations.push(standAloneConfigurationModelParser.configurationModel);
                    }
                }
            }
        }
    }
    exports.AbstractFolderConfiguration = AbstractFolderConfiguration;
    class NodeBasedFolderConfiguration extends AbstractFolderConfiguration {
        constructor(folder, configFolderRelativePath, workbenchState) {
            super(folder, workbenchState);
            this.folderConfigurationPath = resources.joinPath(folder, configFolderRelativePath);
        }
        loadFolderConfigurationContents() {
            return this.resolveStat(this.folderConfigurationPath).then(stat => {
                if (!stat.isDirectory || !stat.children) {
                    return Promise.resolve([]);
                }
                return this.resolveContents(stat.children.filter(stat => isFolderConfigurationFile(stat.resource))
                    .map(stat => stat.resource));
            }, err => [] /* never fail this call */)
                .then(undefined, e => {
                errors.onUnexpectedError(e);
                return [];
            });
        }
        resolveContents(resources) {
            return Promise.all(resources.map(resource => pfs.readFile(resource.fsPath)
                .then(contents => ({ resource, value: contents.toString() }))));
        }
        resolveStat(resource) {
            return new Promise((c, e) => {
                extfs.readdir(resource.fsPath, (error, children) => {
                    if (error) {
                        if (error.code === 'ENOTDIR') {
                            c({ resource });
                        }
                        else {
                            e(error);
                        }
                    }
                    else {
                        c({
                            resource,
                            isDirectory: true,
                            children: children.map(child => { return { resource: resources.joinPath(resource, child) }; })
                        });
                    }
                });
            });
        }
    }
    exports.NodeBasedFolderConfiguration = NodeBasedFolderConfiguration;
    class FileServiceBasedFolderConfiguration extends AbstractFolderConfiguration {
        constructor(folder, configFolderRelativePath, workbenchState, fileService, from) {
            super(folder, workbenchState, from);
            this.configFolderRelativePath = configFolderRelativePath;
            this.fileService = fileService;
            this.loadConfigurationDelayer = new async_1.Delayer(50);
            this.folderConfigurationPath = resources.joinPath(folder, configFolderRelativePath);
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this._onDidChange.fire(), 50));
            this._register(fileService.onFileChanges(e => this.handleWorkspaceFileEvents(e)));
        }
        loadFolderConfigurationContents() {
            return Promise.resolve(this.loadConfigurationDelayer.trigger(() => this.doLoadFolderConfigurationContents()));
        }
        doLoadFolderConfigurationContents() {
            const workspaceFilePathToConfiguration = Object.create(null);
            const bulkContentFetchromise = Promise.resolve(this.fileService.resolveFile(this.folderConfigurationPath))
                .then(stat => {
                if (stat.isDirectory && stat.children) {
                    stat.children
                        .filter(child => isFolderConfigurationFile(child.resource))
                        .forEach(child => {
                        const folderRelativePath = this.toFolderRelativePath(child.resource);
                        if (folderRelativePath) {
                            workspaceFilePathToConfiguration[folderRelativePath] = Promise.resolve(this.fileService.resolveContent(child.resource)).then(undefined, errors.onUnexpectedError);
                        }
                    });
                }
            }).then(undefined, err => [] /* never fail this call */);
            return bulkContentFetchromise.then(() => Promise.all(collections.values(workspaceFilePathToConfiguration))).then(contents => contents.filter(content => content !== undefined));
        }
        handleWorkspaceFileEvents(event) {
            const events = event.changes;
            let affectedByChanges = false;
            // Find changes that affect workspace configuration files
            for (let i = 0, len = events.length; i < len; i++) {
                const resource = events[i].resource;
                const basename = resources.basename(resource);
                const isJson = path_1.extname(basename) === '.json';
                const isDeletedSettingsFolder = (events[i].type === 2 /* DELETED */ && basename === this.configFolderRelativePath);
                if (!isJson && !isDeletedSettingsFolder) {
                    continue; // only JSON files or the actual settings folder
                }
                const folderRelativePath = this.toFolderRelativePath(resource);
                if (!folderRelativePath) {
                    continue; // event is not inside folder
                }
                // Handle case where ".vscode" got deleted
                if (isDeletedSettingsFolder) {
                    affectedByChanges = true;
                    break;
                }
                // only valid workspace config files
                if (!isFolderConfigurationFile(resource)) {
                    continue;
                }
                affectedByChanges = true;
                break;
            }
            if (affectedByChanges) {
                this.reloadConfigurationScheduler.schedule();
            }
        }
        toFolderRelativePath(resource) {
            if (resources.isEqualOrParent(resource, this.folderConfigurationPath)) {
                return resources.relativePath(this.folderConfigurationPath, resource);
            }
            return undefined;
        }
    }
    exports.FileServiceBasedFolderConfiguration = FileServiceBasedFolderConfiguration;
    class CachedFolderConfiguration extends lifecycle_1.Disposable {
        constructor(folder, configFolderRelativePath, environmentService) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.loaded = false;
            this.cachedFolderPath = path_1.join(environmentService.userDataPath, 'CachedConfigurations', 'folders', crypto_1.createHash('md5').update(path_1.join(folder.path, configFolderRelativePath)).digest('hex'));
            this.cachedConfigurationPath = path_1.join(this.cachedFolderPath, 'configuration.json');
            this.configurationModel = new configurationModels_1.ConfigurationModel();
        }
        loadConfiguration() {
            return pfs.readFile(this.cachedConfigurationPath)
                .then(contents => {
                const parsed = JSON.parse(contents.toString());
                this.configurationModel = new configurationModels_1.ConfigurationModel(parsed.contents, parsed.keys, parsed.overrides);
                this.loaded = true;
                return this.configurationModel;
            }, () => this.configurationModel);
        }
        updateConfiguration(configurationModel) {
            const raw = JSON.stringify(configurationModel.toJSON());
            return this.createCachedFolder().then(created => {
                if (created) {
                    return configurationModel.keys.length ? pfs.writeFile(this.cachedConfigurationPath, raw) : pfs.rimraf(this.cachedFolderPath);
                }
                return undefined;
            });
        }
        reprocess() {
            return this.configurationModel;
        }
        getUnsupportedKeys() {
            return [];
        }
        createCachedFolder() {
            return Promise.resolve(pfs.exists(this.cachedFolderPath))
                .then(undefined, () => false)
                .then(exists => exists ? exists : pfs.mkdirp(this.cachedFolderPath).then(() => true, () => false));
        }
    }
    exports.CachedFolderConfiguration = CachedFolderConfiguration;
    class FolderConfiguration extends lifecycle_1.Disposable {
        constructor(workspaceFolder, configFolderRelativePath, workbenchState, environmentService, fileService) {
            super();
            this.workspaceFolder = workspaceFolder;
            this.configFolderRelativePath = configFolderRelativePath;
            this.workbenchState = workbenchState;
            this.environmentService = environmentService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._loaded = false;
            this.cachedFolderConfiguration = new CachedFolderConfiguration(this.workspaceFolder.uri, this.configFolderRelativePath, this.environmentService);
            this.folderConfiguration = this.cachedFolderConfiguration;
            if (fileService) {
                this.folderConfiguration = new FileServiceBasedFolderConfiguration(this.workspaceFolder.uri, this.configFolderRelativePath, this.workbenchState, fileService);
            }
            else if (this.workspaceFolder.uri.scheme === network_1.Schemas.file) {
                this.folderConfiguration = new NodeBasedFolderConfiguration(this.workspaceFolder.uri, this.configFolderRelativePath, this.workbenchState);
            }
            this._register(this.folderConfiguration.onDidChange(e => this.onDidFolderConfigurationChange()));
        }
        loadConfiguration() {
            return this.folderConfiguration.loadConfiguration()
                .then(model => {
                this._loaded = this.folderConfiguration.loaded;
                return model;
            });
        }
        reprocess() {
            return this.folderConfiguration.reprocess();
        }
        get loaded() {
            return this._loaded;
        }
        adopt(fileService) {
            if (fileService) {
                if (this.folderConfiguration instanceof CachedFolderConfiguration) {
                    return this.adoptFromCachedConfiguration(fileService);
                }
                if (this.folderConfiguration instanceof NodeBasedFolderConfiguration) {
                    return this.adoptFromNodeBasedConfiguration(fileService);
                }
            }
            return Promise.resolve(false);
        }
        adoptFromCachedConfiguration(fileService) {
            const folderConfiguration = new FileServiceBasedFolderConfiguration(this.workspaceFolder.uri, this.configFolderRelativePath, this.workbenchState, fileService);
            return folderConfiguration.loadConfiguration()
                .then(() => {
                this.folderConfiguration = folderConfiguration;
                this._register(this.folderConfiguration.onDidChange(e => this.onDidFolderConfigurationChange()));
                this.updateCache();
                return true;
            });
        }
        adoptFromNodeBasedConfiguration(fileService) {
            const oldFolderConfiguration = this.folderConfiguration;
            this.folderConfiguration = new FileServiceBasedFolderConfiguration(this.workspaceFolder.uri, this.configFolderRelativePath, this.workbenchState, fileService, oldFolderConfiguration);
            oldFolderConfiguration.dispose();
            this._register(this.folderConfiguration.onDidChange(e => this.onDidFolderConfigurationChange()));
            return Promise.resolve(false);
        }
        onDidFolderConfigurationChange() {
            this.updateCache();
            this._onDidChange.fire();
        }
        updateCache() {
            if (this.workspaceFolder.uri.scheme !== network_1.Schemas.file && this.folderConfiguration instanceof FileServiceBasedFolderConfiguration) {
                return this.folderConfiguration.loadConfiguration()
                    .then(configurationModel => this.cachedFolderConfiguration.updateConfiguration(configurationModel));
            }
            return Promise.resolve(undefined);
        }
    }
    exports.FolderConfiguration = FolderConfiguration;
});
//# sourceMappingURL=configuration.js.map