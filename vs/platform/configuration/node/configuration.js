/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/platform/configuration/common/configurationModels", "vs/base/node/config", "vs/base/common/event"], function (require, exports, lifecycle_1, errors_1, configurationModels_1, config_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class UserConfiguration extends lifecycle_1.Disposable {
        constructor(settingsPath) {
            super();
            this.settingsPath = settingsPath;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
        }
        initialize() {
            if (!this.initializePromise) {
                this.initializePromise = new Promise((c, e) => {
                    this.userConfigModelWatcher = new config_1.ConfigWatcher(this.settingsPath, {
                        changeBufferDelay: 300, onError: error => errors_1.onUnexpectedError(error), defaultConfig: new configurationModels_1.ConfigurationModelParser(this.settingsPath), parse: (content, parseErrors) => {
                            const userConfigModelParser = new configurationModels_1.ConfigurationModelParser(this.settingsPath);
                            userConfigModelParser.parse(content);
                            parseErrors = [...userConfigModelParser.errors];
                            return userConfigModelParser;
                        }, initCallback: () => c(undefined)
                    });
                    this._register(this.userConfigModelWatcher);
                    // Listeners
                    this._register(this.userConfigModelWatcher.onDidUpdateConfiguration(() => this._onDidChangeConfiguration.fire(this.userConfigModelWatcher.getConfig().configurationModel)));
                });
            }
            return this.initializePromise.then(() => this.userConfigModelWatcher.getConfig().configurationModel);
        }
        initializeSync() {
            this.initialize();
            return this.userConfigModelWatcher.getConfig().configurationModel;
        }
        reload() {
            return this.initialize().then(() => new Promise(c => this.userConfigModelWatcher.reload(userConfigModelParser => c(userConfigModelParser.configurationModel))));
        }
    }
    exports.UserConfiguration = UserConfiguration;
});
//# sourceMappingURL=configuration.js.map