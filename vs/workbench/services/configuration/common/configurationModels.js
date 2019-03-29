/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/map"], function (require, exports, objects_1, configuration_1, configurationModels_1, platform_1, configurationRegistry_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WorkspaceConfigurationModelParser extends configurationModels_1.ConfigurationModelParser {
        constructor(name) {
            super(name);
            this._folders = [];
            this._settingsModelParser = new FolderSettingsModelParser(name, [2 /* WINDOW */, 3 /* RESOURCE */]);
            this._launchModel = new configurationModels_1.ConfigurationModel();
        }
        get folders() {
            return this._folders;
        }
        get settingsModel() {
            return this._settingsModelParser.configurationModel;
        }
        get launchModel() {
            return this._launchModel;
        }
        reprocessWorkspaceSettings() {
            this._settingsModelParser.reprocess();
        }
        parseRaw(raw) {
            this._folders = (raw['folders'] || []);
            this._settingsModelParser.parse(raw['settings']);
            this._launchModel = this.createConfigurationModelFrom(raw, 'launch');
            return super.parseRaw(raw);
        }
        createConfigurationModelFrom(raw, key) {
            const data = raw[key];
            if (data) {
                const contents = configuration_1.toValuesTree(data, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
                const scopedContents = Object.create(null);
                scopedContents[key] = contents;
                const keys = Object.keys(data).map(k => `${key}.${k}`);
                return new configurationModels_1.ConfigurationModel(scopedContents, keys, []);
            }
            return new configurationModels_1.ConfigurationModel();
        }
    }
    exports.WorkspaceConfigurationModelParser = WorkspaceConfigurationModelParser;
    class StandaloneConfigurationModelParser extends configurationModels_1.ConfigurationModelParser {
        constructor(name, scope) {
            super(name);
            this.scope = scope;
        }
        parseRaw(raw) {
            const contents = configuration_1.toValuesTree(raw, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
            const scopedContents = Object.create(null);
            scopedContents[this.scope] = contents;
            const keys = Object.keys(raw).map(key => `${this.scope}.${key}`);
            return { contents: scopedContents, keys, overrides: [] };
        }
    }
    exports.StandaloneConfigurationModelParser = StandaloneConfigurationModelParser;
    class FolderSettingsModelParser extends configurationModels_1.ConfigurationModelParser {
        constructor(name, scopes) {
            super(name);
            this.scopes = scopes;
        }
        parse(content) {
            this._raw = typeof content === 'string' ? this.parseContent(content) : content;
            this.parseWorkspaceSettings(this._raw);
        }
        get configurationModel() {
            return this._settingsModel || new configurationModels_1.ConfigurationModel();
        }
        reprocess() {
            this.parse(this._raw);
        }
        parseWorkspaceSettings(rawSettings) {
            const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const rawWorkspaceSettings = this.filterByScope(rawSettings, configurationProperties, true);
            const configurationModel = this.parseRaw(rawWorkspaceSettings);
            this._settingsModel = new configurationModels_1.ConfigurationModel(configurationModel.contents, configurationModel.keys, configurationModel.overrides);
        }
        filterByScope(properties, configurationProperties, filterOverriddenProperties) {
            const result = {};
            for (let key in properties) {
                if (configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(key) && filterOverriddenProperties) {
                    result[key] = this.filterByScope(properties[key], configurationProperties, false);
                }
                else {
                    const scope = this.getScope(key, configurationProperties);
                    if (this.scopes.indexOf(scope) !== -1) {
                        result[key] = properties[key];
                    }
                }
            }
            return result;
        }
        getScope(key, configurationProperties) {
            const propertySchema = configurationProperties[key];
            return propertySchema && typeof propertySchema.scope !== 'undefined' ? propertySchema.scope : 2 /* WINDOW */;
        }
    }
    exports.FolderSettingsModelParser = FolderSettingsModelParser;
    class Configuration extends configurationModels_1.Configuration {
        constructor(defaults, user, workspaceConfiguration, folders, memoryConfiguration, memoryConfigurationByResource, _workspace) {
            super(defaults, user, workspaceConfiguration, folders, memoryConfiguration, memoryConfigurationByResource);
            this._workspace = _workspace;
        }
        getValue(key, overrides = {}) {
            return super.getValue(key, overrides, this._workspace);
        }
        inspect(key, overrides = {}) {
            return super.inspect(key, overrides, this._workspace);
        }
        keys() {
            return super.keys(this._workspace);
        }
        compareAndUpdateUserConfiguration(user) {
            const { added, updated, removed } = configuration_1.compare(this.user, user);
            let changedKeys = [...added, ...updated, ...removed];
            if (changedKeys.length) {
                super.updateUserConfiguration(user);
            }
            return new configurationModels_1.ConfigurationChangeEvent().change(changedKeys);
        }
        compareAndUpdateWorkspaceConfiguration(workspaceConfiguration) {
            const { added, updated, removed } = configuration_1.compare(this.workspace, workspaceConfiguration);
            let changedKeys = [...added, ...updated, ...removed];
            if (changedKeys.length) {
                super.updateWorkspaceConfiguration(workspaceConfiguration);
            }
            return new configurationModels_1.ConfigurationChangeEvent().change(changedKeys);
        }
        compareAndUpdateFolderConfiguration(resource, folderConfiguration) {
            const currentFolderConfiguration = this.folders.get(resource);
            if (currentFolderConfiguration) {
                const { added, updated, removed } = configuration_1.compare(currentFolderConfiguration, folderConfiguration);
                let changedKeys = [...added, ...updated, ...removed];
                if (changedKeys.length) {
                    super.updateFolderConfiguration(resource, folderConfiguration);
                }
                return new configurationModels_1.ConfigurationChangeEvent().change(changedKeys, resource);
            }
            else {
                super.updateFolderConfiguration(resource, folderConfiguration);
                return new configurationModels_1.ConfigurationChangeEvent().change(folderConfiguration.keys, resource);
            }
        }
        compareAndDeleteFolderConfiguration(folder) {
            if (this._workspace && this._workspace.folders.length > 0 && this._workspace.folders[0].uri.toString() === folder.toString()) {
                // Do not remove workspace configuration
                return new configurationModels_1.ConfigurationChangeEvent();
            }
            const folderConfig = this.folders.get(folder);
            if (!folderConfig) {
                throw new Error('Unknown folder');
            }
            const keys = folderConfig.keys;
            super.deleteFolderConfiguration(folder);
            return new configurationModels_1.ConfigurationChangeEvent().change(keys, folder);
        }
        compare(other) {
            const result = [];
            for (const key of this.allKeys()) {
                if (!objects_1.equals(this.getValue(key), other.getValue(key))
                    || (this._workspace && this._workspace.folders.some(folder => !objects_1.equals(this.getValue(key, { resource: folder.uri }), other.getValue(key, { resource: folder.uri }))))) {
                    result.push(key);
                }
            }
            return result;
        }
        allKeys() {
            return super.allKeys(this._workspace);
        }
    }
    exports.Configuration = Configuration;
    class AllKeysConfigurationChangeEvent extends configurationModels_1.AbstractConfigurationChangeEvent {
        constructor(_configuration, source, sourceConfig) {
            super();
            this._configuration = _configuration;
            this.source = source;
            this.sourceConfig = sourceConfig;
            this._changedConfiguration = null;
        }
        get changedConfiguration() {
            if (!this._changedConfiguration) {
                this._changedConfiguration = new configurationModels_1.ConfigurationModel();
                this.updateKeys(this._changedConfiguration, this.affectedKeys);
            }
            return this._changedConfiguration;
        }
        get changedConfigurationByResource() {
            return new map_1.ResourceMap();
        }
        get affectedKeys() {
            return this._configuration.allKeys();
        }
        affectsConfiguration(config, resource) {
            return this.doesConfigurationContains(this.changedConfiguration, config);
        }
    }
    exports.AllKeysConfigurationChangeEvent = AllKeysConfigurationChangeEvent;
    class WorkspaceConfigurationChangeEvent {
        constructor(configurationChangeEvent, workspace) {
            this.configurationChangeEvent = configurationChangeEvent;
            this.workspace = workspace;
        }
        get changedConfiguration() {
            return this.configurationChangeEvent.changedConfiguration;
        }
        get changedConfigurationByResource() {
            return this.configurationChangeEvent.changedConfigurationByResource;
        }
        get affectedKeys() {
            return this.configurationChangeEvent.affectedKeys;
        }
        get source() {
            return this.configurationChangeEvent.source;
        }
        get sourceConfig() {
            return this.configurationChangeEvent.sourceConfig;
        }
        affectsConfiguration(config, resource) {
            if (this.configurationChangeEvent.affectsConfiguration(config, resource)) {
                return true;
            }
            if (resource && this.workspace) {
                let workspaceFolder = this.workspace.getFolder(resource);
                if (workspaceFolder) {
                    return this.configurationChangeEvent.affectsConfiguration(config, workspaceFolder.uri);
                }
            }
            return false;
        }
    }
    exports.WorkspaceConfigurationChangeEvent = WorkspaceConfigurationChangeEvent;
});
//# sourceMappingURL=configurationModels.js.map