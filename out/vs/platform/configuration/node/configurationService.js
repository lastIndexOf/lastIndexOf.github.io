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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/base/common/event", "vs/platform/environment/common/environment", "vs/platform/configuration/node/configuration"], function (require, exports, platform_1, configurationRegistry_1, lifecycle_1, configuration_1, configurationModels_1, event_1, environment_1, configuration_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ConfigurationService = class ConfigurationService extends lifecycle_1.Disposable {
        constructor(environmentService) {
            super();
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.userConfiguration = this._register(new configuration_2.UserConfiguration(environmentService.appSettingsPath));
            // Initialize
            const defaults = new configurationModels_1.DefaultConfigurationModel();
            const user = this.userConfiguration.initializeSync();
            this._configuration = new configurationModels_1.Configuration(defaults, user);
            // Listeners
            this._register(this.userConfiguration.onDidChangeConfiguration(userConfigurationModel => this.onDidChangeUserConfiguration(userConfigurationModel)));
            this._register(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).onDidUpdateConfiguration(configurationProperties => this.onDidDefaultConfigurationChange(configurationProperties)));
        }
        get configuration() {
            return this._configuration;
        }
        getConfigurationData() {
            return this.configuration.toData();
        }
        getValue(arg1, arg2) {
            const section = typeof arg1 === 'string' ? arg1 : undefined;
            const overrides = configuration_1.isConfigurationOverrides(arg1) ? arg1 : configuration_1.isConfigurationOverrides(arg2) ? arg2 : {};
            return this.configuration.getValue(section, overrides, undefined);
        }
        updateValue(key, value, arg3, arg4) {
            return Promise.reject(new Error('not supported'));
        }
        inspect(key) {
            return this.configuration.inspect(key, {}, undefined);
        }
        keys() {
            return this.configuration.keys(undefined);
        }
        reloadConfiguration(folder) {
            return folder ? Promise.resolve(undefined) :
                this.userConfiguration.reload().then(userConfigurationModel => this.onDidChangeUserConfiguration(userConfigurationModel));
        }
        onDidChangeUserConfiguration(userConfigurationModel) {
            const { added, updated, removed } = configuration_1.compare(this._configuration.user, userConfigurationModel);
            const changedKeys = [...added, ...updated, ...removed];
            if (changedKeys.length) {
                this._configuration.updateUserConfiguration(userConfigurationModel);
                this.trigger(changedKeys, 1 /* USER */);
            }
        }
        onDidDefaultConfigurationChange(keys) {
            this._configuration.updateDefaultConfiguration(new configurationModels_1.DefaultConfigurationModel());
            this.trigger(keys, 4 /* DEFAULT */);
        }
        trigger(keys, source) {
            this._onDidChangeConfiguration.fire(new configurationModels_1.ConfigurationChangeEvent().change(keys).telemetryData(source, this.getTargetConfiguration(source)));
        }
        getTargetConfiguration(target) {
            switch (target) {
                case 4 /* DEFAULT */:
                    return this._configuration.defaults.contents;
                case 1 /* USER */:
                    return this._configuration.user.contents;
            }
            return {};
        }
    };
    ConfigurationService = __decorate([
        __param(0, environment_1.IEnvironmentService)
    ], ConfigurationService);
    exports.ConfigurationService = ConfigurationService;
});
//# sourceMappingURL=configurationService.js.map