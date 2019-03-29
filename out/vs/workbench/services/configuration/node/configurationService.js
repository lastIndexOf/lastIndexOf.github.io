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
define(["require", "exports", "vs/base/common/assert", "vs/base/common/event", "vs/base/common/map", "vs/base/common/objects", "vs/base/common/lifecycle", "vs/base/common/async", "vs/base/node/pfs", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/workspace/common/workspace", "vs/base/common/platform", "vs/platform/environment/common/environment", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configuration", "vs/workbench/services/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configuration", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands", "vs/platform/product/node/product", "vs/workbench/services/configuration/node/configurationEditingService", "vs/workbench/services/configuration/node/configuration", "vs/workbench/services/configuration/node/jsonEditingService", "vs/platform/configuration/node/configuration", "vs/nls", "vs/base/common/resources", "vs/base/common/performance", "vs/base/common/network"], function (require, exports, assert, event_1, map_1, objects_1, lifecycle_1, async_1, pfs_1, jsonContributionRegistry_1, workspace_1, platform_1, environment_1, configurationModels_1, configuration_1, configurationModels_2, configuration_2, platform_2, configurationRegistry_1, workspaces_1, extensions_1, commands_1, product_1, configurationEditingService_1, configuration_3, jsonEditingService_1, configuration_4, nls_1, resources_1, performance_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WorkspaceService extends lifecycle_1.Disposable {
        constructor(environmentService, workspaceSettingsRootFolder = configuration_2.FOLDER_CONFIG_FOLDER_NAME) {
            super();
            this.environmentService = environmentService;
            this.workspaceSettingsRootFolder = workspaceSettingsRootFolder;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._onDidChangeWorkspaceFolders = this._register(new event_1.Emitter());
            this.onDidChangeWorkspaceFolders = this._onDidChangeWorkspaceFolders.event;
            this._onDidChangeWorkspaceName = this._register(new event_1.Emitter());
            this.onDidChangeWorkspaceName = this._onDidChangeWorkspaceName.event;
            this._onDidChangeWorkbenchState = this._register(new event_1.Emitter());
            this.onDidChangeWorkbenchState = this._onDidChangeWorkbenchState.event;
            this.completeWorkspaceBarrier = new async_1.Barrier();
            this.defaultConfiguration = new configurationModels_1.DefaultConfigurationModel();
            this.userConfiguration = this._register(new configuration_4.UserConfiguration(environmentService.appSettingsPath));
            this.workspaceConfiguration = this._register(new configuration_3.WorkspaceConfiguration(environmentService));
            this._register(this.userConfiguration.onDidChangeConfiguration(userConfiguration => this.onUserConfigurationChanged(userConfiguration)));
            this._register(this.workspaceConfiguration.onDidUpdateConfiguration(() => this.onWorkspaceConfigurationChanged()));
            this._register(platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration).onDidSchemaChange(e => this.registerConfigurationSchemas()));
            this._register(platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration).onDidUpdateConfiguration(configurationProperties => this.onDefaultConfigurationChanged(configurationProperties)));
            this.workspaceEditingQueue = new async_1.Queue();
        }
        // Workspace Context Service Impl
        getCompleteWorkspace() {
            return this.completeWorkspaceBarrier.wait().then(() => this.getWorkspace());
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkbenchState() {
            // Workspace has configuration file
            if (this.workspace.configuration) {
                return 3 /* WORKSPACE */;
            }
            // Folder has single root
            if (this.workspace.folders.length === 1) {
                return 2 /* FOLDER */;
            }
            // Empty
            return 1 /* EMPTY */;
        }
        getWorkspaceFolder(resource) {
            return this.workspace.getFolder(resource);
        }
        addFolders(foldersToAdd, index) {
            return this.updateFolders(foldersToAdd, [], index);
        }
        removeFolders(foldersToRemove) {
            return this.updateFolders([], foldersToRemove);
        }
        updateFolders(foldersToAdd, foldersToRemove, index) {
            assert.ok(this.jsonEditingService, 'Workbench is not initialized yet');
            return Promise.resolve(this.workspaceEditingQueue.queue(() => this.doUpdateFolders(foldersToAdd, foldersToRemove, index)));
        }
        isInsideWorkspace(resource) {
            return !!this.getWorkspaceFolder(resource);
        }
        isCurrentWorkspace(workspaceIdentifier) {
            switch (this.getWorkbenchState()) {
                case 2 /* FOLDER */:
                    return workspaces_1.isSingleFolderWorkspaceIdentifier(workspaceIdentifier) && resources_1.isEqual(workspaceIdentifier, this.workspace.folders[0].uri);
                case 3 /* WORKSPACE */:
                    return workspaces_1.isWorkspaceIdentifier(workspaceIdentifier) && this.workspace.id === workspaceIdentifier.id;
            }
            return false;
        }
        doUpdateFolders(foldersToAdd, foldersToRemove, index) {
            if (this.getWorkbenchState() !== 3 /* WORKSPACE */) {
                return Promise.resolve(undefined); // we need a workspace to begin with
            }
            if (foldersToAdd.length + foldersToRemove.length === 0) {
                return Promise.resolve(undefined); // nothing to do
            }
            let foldersHaveChanged = false;
            // Remove first (if any)
            let currentWorkspaceFolders = this.getWorkspace().folders;
            let newStoredFolders = currentWorkspaceFolders.map(f => f.raw).filter((folder, index) => {
                if (!workspaces_1.isStoredWorkspaceFolder(folder)) {
                    return true; // keep entries which are unrelated
                }
                return !this.contains(foldersToRemove, currentWorkspaceFolders[index].uri); // keep entries which are unrelated
            });
            const slashForPath = workspaces_1.useSlashForPath(newStoredFolders);
            foldersHaveChanged = currentWorkspaceFolders.length !== newStoredFolders.length;
            // Add afterwards (if any)
            if (foldersToAdd.length) {
                // Recompute current workspace folders if we have folders to add
                const workspaceConfigFolder = resources_1.dirname(this.getWorkspace().configuration);
                currentWorkspaceFolders = workspace_1.toWorkspaceFolders(newStoredFolders, workspaceConfigFolder);
                const currentWorkspaceFolderUris = currentWorkspaceFolders.map(folder => folder.uri);
                const storedFoldersToAdd = [];
                foldersToAdd.forEach(folderToAdd => {
                    const folderURI = folderToAdd.uri;
                    if (this.contains(currentWorkspaceFolderUris, folderURI)) {
                        return; // already existing
                    }
                    storedFoldersToAdd.push(workspaces_1.getStoredWorkspaceFolder(folderURI, folderToAdd.name, workspaceConfigFolder, slashForPath));
                });
                // Apply to array of newStoredFolders
                if (storedFoldersToAdd.length > 0) {
                    foldersHaveChanged = true;
                    if (typeof index === 'number' && index >= 0 && index < newStoredFolders.length) {
                        newStoredFolders = newStoredFolders.slice(0);
                        newStoredFolders.splice(index, 0, ...storedFoldersToAdd);
                    }
                    else {
                        newStoredFolders = [...newStoredFolders, ...storedFoldersToAdd];
                    }
                }
            }
            // Set folders if we recorded a change
            if (foldersHaveChanged) {
                return this.setFolders(newStoredFolders);
            }
            return Promise.resolve(undefined);
        }
        setFolders(folders) {
            return this.workspaceConfiguration.setFolders(folders, this.jsonEditingService)
                .then(() => this.onWorkspaceConfigurationChanged());
        }
        contains(resources, toCheck) {
            return resources.some(resource => {
                if (platform_1.isLinux) {
                    return resource.toString() === toCheck.toString();
                }
                return resource.toString().toLowerCase() === toCheck.toString().toLowerCase();
            });
        }
        // Workspace Configuration Service Impl
        getConfigurationData() {
            const configurationData = this._configuration.toData();
            configurationData.isComplete = this.cachedFolderConfigs.values().every(c => c.loaded);
            return configurationData;
        }
        getValue(arg1, arg2) {
            const section = typeof arg1 === 'string' ? arg1 : undefined;
            const overrides = configuration_1.isConfigurationOverrides(arg1) ? arg1 : configuration_1.isConfigurationOverrides(arg2) ? arg2 : undefined;
            return this._configuration.getValue(section, overrides);
        }
        updateValue(key, value, arg3, arg4, donotNotifyError) {
            assert.ok(this.configurationEditingService, 'Workbench is not initialized yet');
            const overrides = configuration_1.isConfigurationOverrides(arg3) ? arg3 : undefined;
            const target = this.deriveConfigurationTarget(key, value, overrides, overrides ? arg4 : arg3);
            return target ? this.writeConfigurationValue(key, value, target, overrides, donotNotifyError)
                : Promise.resolve();
        }
        reloadConfiguration(folder, key) {
            if (folder) {
                return this.reloadWorkspaceFolderConfiguration(folder, key);
            }
            return this.reloadUserConfiguration()
                .then(userConfigurationModel => this.reloadWorkspaceConfiguration()
                .then(() => this.loadConfiguration(userConfigurationModel)));
        }
        inspect(key, overrides) {
            return this._configuration.inspect(key, overrides);
        }
        keys() {
            return this._configuration.keys();
        }
        initialize(arg, postInitialisationTask = () => null) {
            performance_1.mark('willInitWorkspaceService');
            return this.createWorkspace(arg)
                .then(workspace => this.updateWorkspaceAndInitializeConfiguration(workspace, postInitialisationTask)).then(() => {
                performance_1.mark('didInitWorkspaceService');
            });
        }
        acquireFileService(fileService) {
            this.fileService = fileService;
            const changedWorkspaceFolders = [];
            Promise.all([this.workspaceConfiguration.adopt(fileService), ...this.cachedFolderConfigs.values()
                    .map(folderConfiguration => folderConfiguration.adopt(fileService)
                    .then(result => {
                    if (result) {
                        changedWorkspaceFolders.push(folderConfiguration.workspaceFolder);
                    }
                    return result;
                }))])
                .then(([workspaceChanged]) => {
                if (workspaceChanged) {
                    this.onWorkspaceConfigurationChanged();
                }
                for (const workspaceFolder of changedWorkspaceFolders) {
                    this.onWorkspaceFolderConfigurationChanged(workspaceFolder);
                }
                this.releaseWorkspaceBarrier();
            });
        }
        acquireInstantiationService(instantiationService) {
            this.configurationEditingService = instantiationService.createInstance(configurationEditingService_1.ConfigurationEditingService);
            this.jsonEditingService = instantiationService.createInstance(jsonEditingService_1.JSONEditingService);
        }
        createWorkspace(arg) {
            if (workspaces_1.isWorkspaceIdentifier(arg)) {
                return this.createMultiFolderWorkspace(arg);
            }
            if (workspaces_1.isSingleFolderWorkspaceInitializationPayload(arg)) {
                return this.createSingleFolderWorkspace(arg);
            }
            return this.createEmptyWorkspace(arg);
        }
        createMultiFolderWorkspace(workspaceIdentifier) {
            return this.workspaceConfiguration.load({ id: workspaceIdentifier.id, configPath: workspaceIdentifier.configPath })
                .then(() => {
                const workspaceConfigPath = workspaceIdentifier.configPath;
                const workspaceFolders = workspace_1.toWorkspaceFolders(this.workspaceConfiguration.getFolders(), resources_1.dirname(workspaceConfigPath));
                const workspaceId = workspaceIdentifier.id;
                const workspace = new workspace_1.Workspace(workspaceId, workspaceFolders, workspaceConfigPath);
                if (workspace.configuration.scheme === network_1.Schemas.file) {
                    this.releaseWorkspaceBarrier(); // Release barrier as workspace is complete because it is from disk.
                }
                return workspace;
            });
        }
        createSingleFolderWorkspace(singleFolder) {
            const folder = singleFolder.folder;
            let configuredFolders;
            if (folder.scheme === 'file') {
                configuredFolders = [{ path: folder.fsPath }];
            }
            else {
                configuredFolders = [{ uri: folder.toString() }];
            }
            const workspace = new workspace_1.Workspace(singleFolder.id, workspace_1.toWorkspaceFolders(configuredFolders));
            this.releaseWorkspaceBarrier(); // Release barrier as workspace is complete because it is single folder.
            return Promise.resolve(workspace);
        }
        createEmptyWorkspace(emptyWorkspace) {
            const workspace = new workspace_1.Workspace(emptyWorkspace.id);
            this.releaseWorkspaceBarrier(); // Release barrier as workspace is complete because it is an empty workspace.
            return Promise.resolve(workspace);
        }
        releaseWorkspaceBarrier() {
            if (!this.completeWorkspaceBarrier.isOpen()) {
                this.completeWorkspaceBarrier.open();
            }
        }
        updateWorkspaceAndInitializeConfiguration(workspace, postInitialisationTask) {
            const hasWorkspaceBefore = !!this.workspace;
            let previousState;
            let previousWorkspacePath;
            let previousFolders;
            if (hasWorkspaceBefore) {
                previousState = this.getWorkbenchState();
                previousWorkspacePath = this.workspace.configuration ? this.workspace.configuration.fsPath : undefined;
                previousFolders = this.workspace.folders;
                this.workspace.update(workspace);
            }
            else {
                this.workspace = workspace;
            }
            return this.initializeConfiguration().then(() => {
                postInitialisationTask(); // Post initialisation task should be run before triggering events.
                // Trigger changes after configuration initialization so that configuration is up to date.
                if (hasWorkspaceBefore) {
                    const newState = this.getWorkbenchState();
                    if (previousState && newState !== previousState) {
                        this._onDidChangeWorkbenchState.fire(newState);
                    }
                    const newWorkspacePath = this.workspace.configuration ? this.workspace.configuration.fsPath : undefined;
                    if (previousWorkspacePath && newWorkspacePath !== previousWorkspacePath || newState !== previousState) {
                        this._onDidChangeWorkspaceName.fire();
                    }
                    const folderChanges = this.compareFolders(previousFolders, this.workspace.folders);
                    if (folderChanges && (folderChanges.added.length || folderChanges.removed.length || folderChanges.changed.length)) {
                        this._onDidChangeWorkspaceFolders.fire(folderChanges);
                    }
                }
            });
        }
        compareFolders(currentFolders, newFolders) {
            const result = { added: [], removed: [], changed: [] };
            result.added = newFolders.filter(newFolder => !currentFolders.some(currentFolder => newFolder.uri.toString() === currentFolder.uri.toString()));
            for (let currentIndex = 0; currentIndex < currentFolders.length; currentIndex++) {
                let currentFolder = currentFolders[currentIndex];
                let newIndex = 0;
                for (newIndex = 0; newIndex < newFolders.length && currentFolder.uri.toString() !== newFolders[newIndex].uri.toString(); newIndex++) { }
                if (newIndex < newFolders.length) {
                    if (currentIndex !== newIndex || currentFolder.name !== newFolders[newIndex].name) {
                        result.changed.push(currentFolder);
                    }
                }
                else {
                    result.removed.push(currentFolder);
                }
            }
            return result;
        }
        initializeConfiguration() {
            this.registerConfigurationSchemas();
            return this.userConfiguration.initialize()
                .then(userConfigurationModel => this.loadConfiguration(userConfigurationModel));
        }
        reloadUserConfiguration(key) {
            return this.userConfiguration.reload();
        }
        reloadWorkspaceConfiguration(key) {
            const workbenchState = this.getWorkbenchState();
            if (workbenchState === 2 /* FOLDER */) {
                return this.onWorkspaceFolderConfigurationChanged(this.workspace.folders[0], key);
            }
            if (workbenchState === 3 /* WORKSPACE */) {
                return this.workspaceConfiguration.reload().then(() => this.onWorkspaceConfigurationChanged());
            }
            return Promise.resolve(undefined);
        }
        reloadWorkspaceFolderConfiguration(folder, key) {
            return this.onWorkspaceFolderConfigurationChanged(folder, key);
        }
        loadConfiguration(userConfigurationModel) {
            // reset caches
            this.cachedFolderConfigs = new map_1.ResourceMap();
            const folders = this.workspace.folders;
            return this.loadFolderConfigurations(folders)
                .then((folderConfigurations) => {
                let workspaceConfiguration = this.getWorkspaceConfigurationModel(folderConfigurations);
                const folderConfigurationModels = new map_1.ResourceMap();
                folderConfigurations.forEach((folderConfiguration, index) => folderConfigurationModels.set(folders[index].uri, folderConfiguration));
                const currentConfiguration = this._configuration;
                this._configuration = new configurationModels_2.Configuration(this.defaultConfiguration, userConfigurationModel, workspaceConfiguration, folderConfigurationModels, new configurationModels_1.ConfigurationModel(), new map_1.ResourceMap(), this.workspace);
                if (currentConfiguration) {
                    const changedKeys = this._configuration.compare(currentConfiguration);
                    this.triggerConfigurationChange(new configurationModels_1.ConfigurationChangeEvent().change(changedKeys), 2 /* WORKSPACE */);
                }
                else {
                    this._onDidChangeConfiguration.fire(new configurationModels_2.AllKeysConfigurationChangeEvent(this._configuration, 2 /* WORKSPACE */, this.getTargetConfiguration(2 /* WORKSPACE */)));
                }
            });
        }
        getWorkspaceConfigurationModel(folderConfigurations) {
            switch (this.getWorkbenchState()) {
                case 2 /* FOLDER */:
                    return folderConfigurations[0];
                case 3 /* WORKSPACE */:
                    return this.workspaceConfiguration.getConfiguration();
                default:
                    return new configurationModels_1.ConfigurationModel();
            }
        }
        onDefaultConfigurationChanged(keys) {
            this.defaultConfiguration = new configurationModels_1.DefaultConfigurationModel();
            this.registerConfigurationSchemas();
            if (this.workspace && this._configuration) {
                this._configuration.updateDefaultConfiguration(this.defaultConfiguration);
                if (this.getWorkbenchState() === 2 /* FOLDER */) {
                    this._configuration.updateWorkspaceConfiguration(this.cachedFolderConfigs.get(this.workspace.folders[0].uri).reprocess());
                }
                else {
                    this._configuration.updateWorkspaceConfiguration(this.workspaceConfiguration.reprocessWorkspaceSettings());
                    this.workspace.folders.forEach(folder => this._configuration.updateFolderConfiguration(folder.uri, this.cachedFolderConfigs.get(folder.uri).reprocess()));
                }
                this.triggerConfigurationChange(new configurationModels_1.ConfigurationChangeEvent().change(keys), 4 /* DEFAULT */);
            }
        }
        registerConfigurationSchemas() {
            if (this.workspace) {
                const jsonRegistry = platform_2.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
                const convertToNotSuggestedProperties = (properties, errorMessage) => {
                    return Object.keys(properties).reduce((result, property) => {
                        result[property] = objects_1.deepClone(properties[property]);
                        result[property].deprecationMessage = errorMessage;
                        return result;
                    }, {});
                };
                const allSettingsSchema = { properties: configurationRegistry_1.allSettings.properties, patternProperties: configurationRegistry_1.allSettings.patternProperties, additionalProperties: false, errorMessage: 'Unknown configuration setting' };
                const unsupportedApplicationSettings = convertToNotSuggestedProperties(configurationRegistry_1.applicationSettings.properties, nls_1.localize('unsupportedApplicationSetting', "This setting can be applied only in User Settings"));
                const workspaceSettingsSchema = { properties: Object.assign({}, unsupportedApplicationSettings, configurationRegistry_1.windowSettings.properties, configurationRegistry_1.resourceSettings.properties), patternProperties: configurationRegistry_1.allSettings.patternProperties, additionalProperties: false, errorMessage: 'Unknown configuration setting' };
                jsonRegistry.registerSchema(configuration_2.defaultSettingsSchemaId, allSettingsSchema);
                jsonRegistry.registerSchema(configuration_2.userSettingsSchemaId, allSettingsSchema);
                if (3 /* WORKSPACE */ === this.getWorkbenchState()) {
                    const unsupportedWindowSettings = convertToNotSuggestedProperties(configurationRegistry_1.windowSettings.properties, nls_1.localize('unsupportedWindowSetting', "This setting cannot be applied now. It will be applied when you open this folder directly."));
                    const folderSettingsSchema = { properties: Object.assign({}, unsupportedApplicationSettings, unsupportedWindowSettings, configurationRegistry_1.resourceSettings.properties), patternProperties: configurationRegistry_1.allSettings.patternProperties, additionalProperties: false, errorMessage: 'Unknown configuration setting' };
                    jsonRegistry.registerSchema(configuration_2.workspaceSettingsSchemaId, workspaceSettingsSchema);
                    jsonRegistry.registerSchema(configuration_2.folderSettingsSchemaId, folderSettingsSchema);
                }
                else {
                    jsonRegistry.registerSchema(configuration_2.workspaceSettingsSchemaId, workspaceSettingsSchema);
                    jsonRegistry.registerSchema(configuration_2.folderSettingsSchemaId, workspaceSettingsSchema);
                }
            }
        }
        onUserConfigurationChanged(userConfiguration) {
            const keys = this._configuration.compareAndUpdateUserConfiguration(userConfiguration);
            this.triggerConfigurationChange(keys, 1 /* USER */);
        }
        onWorkspaceConfigurationChanged() {
            if (this.workspace && this.workspace.configuration && this._configuration) {
                const workspaceConfigurationChangeEvent = this._configuration.compareAndUpdateWorkspaceConfiguration(this.workspaceConfiguration.getConfiguration());
                let configuredFolders = workspace_1.toWorkspaceFolders(this.workspaceConfiguration.getFolders(), resources_1.dirname(this.workspace.configuration));
                const changes = this.compareFolders(this.workspace.folders, configuredFolders);
                if (changes.added.length || changes.removed.length || changes.changed.length) {
                    this.workspace.folders = configuredFolders;
                    return this.onFoldersChanged()
                        .then(foldersConfigurationChangeEvent => {
                        this.triggerConfigurationChange(foldersConfigurationChangeEvent.change(workspaceConfigurationChangeEvent), 3 /* WORKSPACE_FOLDER */);
                        this._onDidChangeWorkspaceFolders.fire(changes);
                    });
                }
                else {
                    this.triggerConfigurationChange(workspaceConfigurationChangeEvent, 2 /* WORKSPACE */);
                }
            }
            return Promise.resolve(undefined);
        }
        onWorkspaceFolderConfigurationChanged(folder, key) {
            return this.loadFolderConfigurations([folder])
                .then(([folderConfiguration]) => {
                const folderChangedKeys = this._configuration.compareAndUpdateFolderConfiguration(folder.uri, folderConfiguration);
                if (this.getWorkbenchState() === 2 /* FOLDER */) {
                    const workspaceChangedKeys = this._configuration.compareAndUpdateWorkspaceConfiguration(folderConfiguration);
                    this.triggerConfigurationChange(workspaceChangedKeys, 2 /* WORKSPACE */);
                }
                else {
                    this.triggerConfigurationChange(folderChangedKeys, 3 /* WORKSPACE_FOLDER */);
                }
            });
        }
        onFoldersChanged() {
            let changeEvent = new configurationModels_1.ConfigurationChangeEvent();
            // Remove the configurations of deleted folders
            for (const key of this.cachedFolderConfigs.keys()) {
                if (!this.workspace.folders.filter(folder => folder.uri.toString() === key.toString())[0]) {
                    const folderConfiguration = this.cachedFolderConfigs.get(key);
                    folderConfiguration.dispose();
                    this.cachedFolderConfigs.delete(key);
                    changeEvent = changeEvent.change(this._configuration.compareAndDeleteFolderConfiguration(key));
                }
            }
            const toInitialize = this.workspace.folders.filter(folder => !this.cachedFolderConfigs.has(folder.uri));
            if (toInitialize.length) {
                return this.loadFolderConfigurations(toInitialize)
                    .then(folderConfigurations => {
                    folderConfigurations.forEach((folderConfiguration, index) => {
                        changeEvent = changeEvent.change(this._configuration.compareAndUpdateFolderConfiguration(toInitialize[index].uri, folderConfiguration));
                    });
                    return changeEvent;
                });
            }
            return Promise.resolve(changeEvent);
        }
        loadFolderConfigurations(folders) {
            return Promise.all([...folders.map(folder => {
                    let folderConfiguration = this.cachedFolderConfigs.get(folder.uri);
                    if (!folderConfiguration) {
                        folderConfiguration = new configuration_3.FolderConfiguration(folder, this.workspaceSettingsRootFolder, this.getWorkbenchState(), this.environmentService, this.fileService);
                        this._register(folderConfiguration.onDidChange(() => this.onWorkspaceFolderConfigurationChanged(folder)));
                        this.cachedFolderConfigs.set(folder.uri, this._register(folderConfiguration));
                    }
                    return folderConfiguration.loadConfiguration();
                })]);
        }
        writeConfigurationValue(key, value, target, overrides, donotNotifyError) {
            if (target === 4 /* DEFAULT */) {
                return Promise.reject(new Error('Invalid configuration target'));
            }
            if (target === 5 /* MEMORY */) {
                this._configuration.updateValue(key, value, overrides);
                this.triggerConfigurationChange(new configurationModels_1.ConfigurationChangeEvent().change(overrides && overrides.overrideIdentifier ? [configuration_1.keyFromOverrideIdentifier(overrides.overrideIdentifier)] : [key], overrides && overrides.resource || undefined), target);
                return Promise.resolve(undefined);
            }
            return this.configurationEditingService.writeConfiguration(target, { key, value }, { scopes: overrides, donotNotifyError })
                .then(() => {
                switch (target) {
                    case 1 /* USER */:
                        return this.reloadUserConfiguration().then(_ => Promise.resolve());
                    case 2 /* WORKSPACE */:
                        return this.reloadWorkspaceConfiguration();
                    case 3 /* WORKSPACE_FOLDER */:
                        const workspaceFolder = overrides && overrides.resource ? this.workspace.getFolder(overrides.resource) : null;
                        if (workspaceFolder) {
                            return this.reloadWorkspaceFolderConfiguration(workspaceFolder, key);
                        }
                }
                return Promise.resolve();
            });
        }
        deriveConfigurationTarget(key, value, overrides, target) {
            if (target) {
                return target;
            }
            if (value === undefined) {
                // Ignore. But expected is to remove the value from all targets
                return undefined;
            }
            const inspect = this.inspect(key, overrides);
            if (objects_1.equals(value, inspect.value)) {
                // No change. So ignore.
                return undefined;
            }
            if (inspect.workspaceFolder !== undefined) {
                return 3 /* WORKSPACE_FOLDER */;
            }
            if (inspect.workspace !== undefined) {
                return 2 /* WORKSPACE */;
            }
            return 1 /* USER */;
        }
        triggerConfigurationChange(configurationEvent, target) {
            if (configurationEvent.affectedKeys.length) {
                configurationEvent.telemetryData(target, this.getTargetConfiguration(target));
                this._onDidChangeConfiguration.fire(new configurationModels_2.WorkspaceConfigurationChangeEvent(configurationEvent, this.workspace));
            }
        }
        getTargetConfiguration(target) {
            switch (target) {
                case 4 /* DEFAULT */:
                    return this._configuration.defaults.contents;
                case 1 /* USER */:
                    return this._configuration.user.contents;
                case 2 /* WORKSPACE */:
                    return this._configuration.workspace.contents;
            }
            return {};
        }
    }
    exports.WorkspaceService = WorkspaceService;
    let DefaultConfigurationExportHelper = class DefaultConfigurationExportHelper {
        constructor(environmentService, extensionService, commandService) {
            this.extensionService = extensionService;
            this.commandService = commandService;
            if (environmentService.args['export-default-configuration']) {
                this.writeConfigModelAndQuit(environmentService.args['export-default-configuration']);
            }
        }
        writeConfigModelAndQuit(targetPath) {
            return Promise.resolve(this.extensionService.whenInstalledExtensionsRegistered())
                .then(() => this.writeConfigModel(targetPath))
                .then(() => this.commandService.executeCommand('workbench.action.quit'))
                .then(() => { });
        }
        writeConfigModel(targetPath) {
            const config = this.getConfigModel();
            const resultString = JSON.stringify(config, undefined, '  ');
            return pfs_1.writeFile(targetPath, resultString);
        }
        getConfigModel() {
            const configRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
            const configurations = configRegistry.getConfigurations().slice();
            const settings = [];
            const processProperty = (name, prop) => {
                const propDetails = {
                    name,
                    description: prop.description || prop.markdownDescription || '',
                    default: prop.default,
                    type: prop.type
                };
                if (prop.enum) {
                    propDetails.enum = prop.enum;
                }
                if (prop.enumDescriptions || prop.markdownEnumDescriptions) {
                    propDetails.enumDescriptions = prop.enumDescriptions || prop.markdownEnumDescriptions;
                }
                settings.push(propDetails);
            };
            const processConfig = (config) => {
                if (config.properties) {
                    for (let name in config.properties) {
                        processProperty(name, config.properties[name]);
                    }
                }
                if (config.allOf) {
                    config.allOf.forEach(processConfig);
                }
            };
            configurations.forEach(processConfig);
            const excludedProps = configRegistry.getExcludedConfigurationProperties();
            for (let name in excludedProps) {
                processProperty(name, excludedProps[name]);
            }
            const result = {
                settings: settings.sort((a, b) => a.name.localeCompare(b.name)),
                buildTime: Date.now(),
                commit: product_1.default.commit,
                buildNumber: product_1.default.settingsSearchBuildId
            };
            return result;
        }
    };
    DefaultConfigurationExportHelper = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, extensions_1.IExtensionService),
        __param(2, commands_1.ICommandService)
    ], DefaultConfigurationExportHelper);
    exports.DefaultConfigurationExportHelper = DefaultConfigurationExportHelper;
});
//# sourceMappingURL=configurationService.js.map