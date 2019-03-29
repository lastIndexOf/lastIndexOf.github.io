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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/platform/environment/common/environment", "vs/base/node/storage", "vs/base/common/path", "vs/base/node/pfs", "vs/base/common/strings"], function (require, exports, instantiation_1, event_1, lifecycle_1, log_1, environment_1, storage_1, path_1, pfs_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IStorageMainService = instantiation_1.createDecorator('storageMainService');
    let StorageMainService = class StorageMainService extends lifecycle_1.Disposable {
        constructor(logService, environmentService) {
            super();
            this.logService = logService;
            this.environmentService = environmentService;
            this._onDidChangeStorage = this._register(new event_1.Emitter());
            this._onWillSaveState = this._register(new event_1.Emitter());
            // Until the storage has been initialized, it can only be in memory
            this.storage = new storage_1.Storage(new storage_1.InMemoryStorageDatabase());
        }
        get onDidChangeStorage() { return this._onDidChangeStorage.event; }
        get onWillSaveState() { return this._onWillSaveState.event; }
        get items() { return this.storage.items; }
        get storagePath() {
            if (!!this.environmentService.extensionTestsLocationURI) {
                return storage_1.SQLiteStorageDatabase.IN_MEMORY_PATH; // no storage during extension tests!
            }
            return path_1.join(this.environmentService.globalStorageHome, StorageMainService.STORAGE_NAME);
        }
        createLogginOptions() {
            return {
                logTrace: (this.logService.getLevel() === log_1.LogLevel.Trace) ? msg => this.logService.trace(msg) : undefined,
                logError: error => this.logService.error(error)
            };
        }
        initialize() {
            if (!this.initializePromise) {
                this.initializePromise = this.doInitialize();
            }
            return this.initializePromise;
        }
        doInitialize() {
            const useInMemoryStorage = this.storagePath === storage_1.SQLiteStorageDatabase.IN_MEMORY_PATH;
            let globalStorageExists;
            if (useInMemoryStorage) {
                globalStorageExists = Promise.resolve(true);
            }
            else {
                globalStorageExists = pfs_1.exists(this.storagePath);
            }
            return globalStorageExists.then(exists => {
                this.storage.dispose();
                this.storage = new storage_1.Storage(new storage_1.SQLiteStorageDatabase(this.storagePath, {
                    logging: this.createLogginOptions()
                }));
                this._register(this.storage.onDidChangeStorage(key => this._onDidChangeStorage.fire({ key })));
                return this.storage.init().then(() => {
                    // Migrate storage if this is the first start and we are not using in-memory
                    let migrationPromise;
                    if (!useInMemoryStorage && !exists) {
                        // TODO@Ben remove global storage migration and move Storage creation back to ctor
                        migrationPromise = this.migrateGlobalStorage().then(() => this.logService.info('[storage] migrated global storage'), error => this.logService.error(`[storage] migration error ${error}`));
                    }
                    else {
                        migrationPromise = Promise.resolve();
                    }
                    return migrationPromise;
                });
            });
        }
        migrateGlobalStorage() {
            this.logService.info('[storage] migrating global storage from localStorage into SQLite');
            const localStorageDBBackup = path_1.join(this.environmentService.userDataPath, 'Local Storage', 'file__0.vscmig');
            return pfs_1.exists(localStorageDBBackup).then(exists => {
                if (!exists) {
                    return Promise.resolve(); // return if there is no DB to migrate from
                }
                return pfs_1.readdir(this.environmentService.extensionsPath).then(extensions => {
                    const supportedKeys = new Map();
                    [
                        'editorFontInfo',
                        'peekViewLayout',
                        'expandSuggestionDocs',
                        'extensionsIdentifiers/disabled',
                        'integrityService',
                        'telemetry.lastSessionDate',
                        'telemetry.instanceId',
                        'telemetry.firstSessionDate',
                        'workbench.sidebar.width',
                        'workbench.panel.width',
                        'workbench.panel.height',
                        'workbench.panel.sizeBeforeMaximized',
                        'workbench.activity.placeholderViewlets',
                        'colorThemeData',
                        'iconThemeData',
                        'workbench.telemetryOptOutShown',
                        'workbench.hide.welcome',
                        'releaseNotes/lastVersion',
                        'debug.actionswidgetposition',
                        'debug.actionswidgety',
                        'editor.neverPromptForLargeFiles',
                        'menubar/electronFixRecommended',
                        'learnMoreDirtyWriteError',
                        'extensions.ignoredAutoUpdateExtension',
                        'askToInstallRemoteServerExtension',
                        'hasNotifiedOfSettingsAutosave',
                        'commandPalette.mru.cache',
                        'commandPalette.mru.counter',
                        'parts-splash-data',
                        'terminal.integrated.neverMeasureRenderTime',
                        'terminal.integrated.neverSuggestSelectWindowsShell',
                        'memento/workbench.parts.editor',
                        'memento/workbench.view.search',
                        'langugage.update.donotask',
                        'extensionsAssistant/languagePackSuggestionIgnore',
                        'workbench.panel.pinnedPanels',
                        'workbench.activity.pinnedViewlets',
                        'extensionsAssistant/ignored_recommendations',
                        'extensionsAssistant/recommendations',
                        'extensionsAssistant/importantRecommendationsIgnore',
                        'extensionsAssistant/fileExtensionsSuggestionIgnore',
                        'nps/skipVersion',
                        'nps/lastSessionDate',
                        'nps/sessionCount',
                        'nps/isCandidate',
                        'allExperiments',
                        'currentOrPreviouslyRunExperiments',
                        'update/win32-64bits',
                        'update/win32-fast-updates',
                        'update/lastKnownVersion',
                        'update/updateNotificationTime'
                    ].forEach(key => supportedKeys.set(key.toLowerCase(), key));
                    // https://github.com/Microsoft/vscode/issues/68468
                    const wellKnownPublishers = ['Microsoft', 'GitHub'];
                    const wellKnownExtensions = ['ms-vscode.Go', 'WallabyJs.quokka-vscode', 'Telerik.nativescript', 'Shan.code-settings-sync', 'ritwickdey.LiveServer', 'PKief.material-icon-theme', 'PeterJausovec.vscode-docker', 'ms-vscode.PowerShell', 'LaurentTreguier.vscode-simple-icons', 'KnisterPeter.vscode-github', 'DotJoshJohnson.xml', 'Dart-Code.dart-code', 'alefragnani.Bookmarks'];
                    // Support extension storage as well (always the ID of the extension)
                    extensions.forEach(extension => {
                        let extensionId;
                        if (extension.indexOf('-') >= 0) {
                            extensionId = extension.substring(0, extension.lastIndexOf('-')); // convert "author.extension-0.2.5" => "author.extension"
                        }
                        else {
                            extensionId = extension;
                        }
                        if (extensionId) {
                            for (let i = 0; i < wellKnownPublishers.length; i++) {
                                const publisher = wellKnownPublishers[i];
                                if (strings_1.startsWith(extensionId, `${publisher.toLowerCase()}.`)) {
                                    extensionId = `${publisher}${extensionId.substr(publisher.length)}`;
                                    break;
                                }
                            }
                            for (let j = 0; j < wellKnownExtensions.length; j++) {
                                const wellKnownExtension = wellKnownExtensions[j];
                                if (extensionId === wellKnownExtension.toLowerCase()) {
                                    extensionId = wellKnownExtension;
                                    break;
                                }
                            }
                            supportedKeys.set(extensionId.toLowerCase(), extensionId);
                        }
                    });
                    return new Promise((resolve_1, reject_1) => { require(['vscode-sqlite3'], resolve_1, reject_1); }).then(sqlite3 => {
                        return new Promise((resolve, reject) => {
                            const handleSuffixKey = (row, key, suffix) => {
                                if (strings_1.endsWith(key, suffix.toLowerCase())) {
                                    const value = row.value.toString('utf16le');
                                    const normalizedKey = key.substring(0, key.length - suffix.length) + suffix;
                                    this.store(normalizedKey, value);
                                    return true;
                                }
                                return false;
                            };
                            const db = new (sqlite3.Database)(localStorageDBBackup, error => {
                                if (error) {
                                    if (db) {
                                        db.close();
                                    }
                                    return reject(error);
                                }
                                db.all('SELECT key, value FROM ItemTable', (error, rows) => {
                                    if (error) {
                                        db.close();
                                        return reject(error);
                                    }
                                    try {
                                        rows.forEach(row => {
                                            let key = row.key;
                                            if (key.indexOf('storage://global/') !== 0) {
                                                return; // not a global key
                                            }
                                            // convert storage://global/colorthemedata => colorthemedata
                                            key = key.substr('storage://global/'.length);
                                            const supportedKey = supportedKeys.get(key);
                                            if (supportedKey) {
                                                const value = row.value.toString('utf16le');
                                                this.store(supportedKey, value);
                                            }
                                            // dynamic values
                                            else if (strings_1.endsWith(key, '.hidden') ||
                                                strings_1.startsWith(key, 'experiments.')) {
                                                const value = row.value.toString('utf16le');
                                                this.store(key, value);
                                            }
                                            // fix lowercased ".sessionCount"
                                            else if (handleSuffixKey(row, key, '.sessionCount')) { }
                                            // fix lowercased ".lastSessionDate"
                                            else if (handleSuffixKey(row, key, '.lastSessionDate')) { }
                                            // fix lowercased ".skipVersion"
                                            else if (handleSuffixKey(row, key, '.skipVersion')) { }
                                            // fix lowercased ".isCandidate"
                                            else if (handleSuffixKey(row, key, '.isCandidate')) { }
                                            // fix lowercased ".editedCount"
                                            else if (handleSuffixKey(row, key, '.editedCount')) { }
                                            // fix lowercased ".editedDate"
                                            else if (handleSuffixKey(row, key, '.editedDate')) { }
                                        });
                                        db.close();
                                    }
                                    catch (error) {
                                        db.close();
                                        return reject(error);
                                    }
                                    resolve();
                                });
                            });
                        });
                    });
                });
            });
        }
        get(key, fallbackValue) {
            return this.storage.get(key, fallbackValue);
        }
        getBoolean(key, fallbackValue) {
            return this.storage.getBoolean(key, fallbackValue);
        }
        getNumber(key, fallbackValue) {
            return this.storage.getNumber(key, fallbackValue);
        }
        store(key, value) {
            return this.storage.set(key, value);
        }
        remove(key) {
            return this.storage.delete(key);
        }
        close() {
            // Signal as event so that clients can still store data
            this._onWillSaveState.fire();
            // Do it
            return this.storage.close();
        }
        checkIntegrity(full) {
            return this.storage.checkIntegrity(full);
        }
    };
    StorageMainService.STORAGE_NAME = 'state.vscdb';
    StorageMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environment_1.IEnvironmentService)
    ], StorageMainService);
    exports.StorageMainService = StorageMainService;
});
//# sourceMappingURL=storageMainService.js.map