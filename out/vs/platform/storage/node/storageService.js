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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/base/node/storage", "vs/base/common/actions", "vs/platform/windows/common/windows", "vs/nls", "vs/base/common/performance", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/platform/workspaces/common/workspaces", "vs/base/common/errors"], function (require, exports, lifecycle_1, event_1, log_1, storage_1, storage_2, actions_1, windows_1, nls_1, performance_1, path_1, pfs_1, environment_1, workspaces_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let StorageService = class StorageService extends lifecycle_1.Disposable {
        constructor(globalStorageDatabase, logService, environmentService) {
            super();
            this.logService = logService;
            this.environmentService = environmentService;
            this._onDidChangeStorage = this._register(new event_1.Emitter());
            this._onWillSaveState = this._register(new event_1.Emitter());
            // Global Storage
            this.globalStorage = new storage_2.Storage(globalStorageDatabase);
            this._register(this.globalStorage.onDidChangeStorage(key => this.handleDidChangeStorage(key, 0 /* GLOBAL */)));
        }
        get onDidChangeStorage() { return this._onDidChangeStorage.event; }
        get onWillSaveState() { return this._onWillSaveState.event; }
        handleDidChangeStorage(key, scope) {
            this._onDidChangeStorage.fire({ key, scope });
        }
        initialize(payload) {
            if (!this.initializePromise) {
                this.initializePromise = this.doInitialize(payload);
            }
            return this.initializePromise;
        }
        doInitialize(payload) {
            return Promise.all([
                // this.initializeGlobalStorage(),
                this.initializeWorkspaceStorage(payload)
            ]).then(() => undefined);
        }
        // private initializeGlobalStorage(): Promise<void> {
        // 	return this.globalStorage.init();
        // }
        initializeWorkspaceStorage(payload) {
            // Prepare workspace storage folder for DB
            return this.prepareWorkspaceStorageFolder(payload).then(result => {
                const useInMemoryStorage = !!this.environmentService.extensionTestsLocationURI; // no storage during extension tests!
                // Create workspace storage and initalize
                performance_1.mark('willInitWorkspaceStorage');
                return this.createWorkspaceStorage(useInMemoryStorage ? storage_2.SQLiteStorageDatabase.IN_MEMORY_PATH : path_1.join(result.path, StorageService.WORKSPACE_STORAGE_NAME), result.wasCreated ? storage_2.StorageHint.STORAGE_DOES_NOT_EXIST : undefined).init().then(() => {
                    performance_1.mark('didInitWorkspaceStorage');
                }, error => {
                    performance_1.mark('didInitWorkspaceStorage');
                    return Promise.reject(error);
                });
            }).then(undefined, error => {
                errors_1.onUnexpectedError(error);
                // Upon error, fallback to in-memory storage
                return this.createWorkspaceStorage(storage_2.SQLiteStorageDatabase.IN_MEMORY_PATH).init();
            });
        }
        createWorkspaceStorage(workspaceStoragePath, hint) {
            // Logger for workspace storage
            const workspaceLoggingOptions = {
                logTrace: (this.logService.getLevel() === log_1.LogLevel.Trace) ? msg => this.logService.trace(msg) : undefined,
                logError: error => this.logService.error(error)
            };
            // Dispose old (if any)
            this.workspaceStorage = lifecycle_1.dispose(this.workspaceStorage);
            this.workspaceStorageListener = lifecycle_1.dispose(this.workspaceStorageListener);
            // Create new
            this.workspaceStoragePath = workspaceStoragePath;
            this.workspaceStorage = new storage_2.Storage(new storage_2.SQLiteStorageDatabase(workspaceStoragePath, { logging: workspaceLoggingOptions }), { hint });
            this.workspaceStorageListener = this.workspaceStorage.onDidChangeStorage(key => this.handleDidChangeStorage(key, 1 /* WORKSPACE */));
            return this.workspaceStorage;
        }
        getWorkspaceStorageFolderPath(payload) {
            return path_1.join(this.environmentService.workspaceStorageHome, payload.id); // workspace home + workspace id;
        }
        prepareWorkspaceStorageFolder(payload) {
            const workspaceStorageFolderPath = this.getWorkspaceStorageFolderPath(payload);
            return pfs_1.exists(workspaceStorageFolderPath).then(exists => {
                if (exists) {
                    return { path: workspaceStorageFolderPath, wasCreated: false };
                }
                return pfs_1.mkdirp(workspaceStorageFolderPath).then(() => {
                    // Write metadata into folder
                    this.ensureWorkspaceStorageFolderMeta(payload);
                    return { path: workspaceStorageFolderPath, wasCreated: true };
                });
            });
        }
        ensureWorkspaceStorageFolderMeta(payload) {
            let meta = undefined;
            if (workspaces_1.isSingleFolderWorkspaceInitializationPayload(payload)) {
                meta = { folder: payload.folder.toString() };
            }
            else if (workspaces_1.isWorkspaceIdentifier(payload)) {
                meta = { configuration: payload.configPath };
            }
            if (meta) {
                const workspaceStorageMetaPath = path_1.join(this.getWorkspaceStorageFolderPath(payload), StorageService.WORKSPACE_META_NAME);
                pfs_1.exists(workspaceStorageMetaPath).then(exists => {
                    if (exists) {
                        return undefined; // already existing
                    }
                    return pfs_1.writeFile(workspaceStorageMetaPath, JSON.stringify(meta, undefined, 2));
                }).then(undefined, error => errors_1.onUnexpectedError(error));
            }
        }
        get(key, scope, fallbackValue) {
            return this.getStorage(scope).get(key, fallbackValue);
        }
        getBoolean(key, scope, fallbackValue) {
            return this.getStorage(scope).getBoolean(key, fallbackValue);
        }
        getNumber(key, scope, fallbackValue) {
            return this.getStorage(scope).getNumber(key, fallbackValue);
        }
        store(key, value, scope) {
            this.getStorage(scope).set(key, value);
        }
        remove(key, scope) {
            this.getStorage(scope).delete(key);
        }
        close() {
            // Signal as event so that clients can still store data
            this._onWillSaveState.fire({ reason: storage_1.WillSaveStateReason.SHUTDOWN });
            // Do it
            return Promise.all([
                this.globalStorage.close(),
                this.workspaceStorage.close()
            ]).then(() => undefined);
        }
        getStorage(scope) {
            return scope === 0 /* GLOBAL */ ? this.globalStorage : this.workspaceStorage;
        }
        getSize(scope) {
            return scope === 0 /* GLOBAL */ ? this.globalStorage.size : this.workspaceStorage.size;
        }
        checkIntegrity(scope, full) {
            return scope === 0 /* GLOBAL */ ? this.globalStorage.checkIntegrity(full) : this.workspaceStorage.checkIntegrity(full);
        }
        logStorage() {
            return Promise.all([
                this.globalStorage.items,
                this.workspaceStorage.items,
                this.globalStorage.checkIntegrity(true /* full */),
                this.workspaceStorage.checkIntegrity(true /* full */)
            ]).then(result => {
                const safeParse = (value) => {
                    try {
                        return JSON.parse(value);
                    }
                    catch (error) {
                        return value;
                    }
                };
                const globalItems = new Map();
                const globalItemsParsed = new Map();
                result[0].forEach((value, key) => {
                    globalItems.set(key, value);
                    globalItemsParsed.set(key, safeParse(value));
                });
                const workspaceItems = new Map();
                const workspaceItemsParsed = new Map();
                result[1].forEach((value, key) => {
                    workspaceItems.set(key, value);
                    workspaceItemsParsed.set(key, safeParse(value));
                });
                console.group(`Storage: Global (integrity: ${result[2]}, path: ${this.environmentService.globalStorageHome})`);
                let globalValues = [];
                globalItems.forEach((value, key) => {
                    globalValues.push({ key, value });
                });
                console.table(globalValues);
                console.groupEnd();
                console.log(globalItemsParsed);
                console.group(`Storage: Workspace (integrity: ${result[3]}, load: ${performance_1.getDuration('willInitWorkspaceStorage', 'didInitWorkspaceStorage')}, path: ${this.workspaceStoragePath})`);
                let workspaceValues = [];
                workspaceItems.forEach((value, key) => {
                    workspaceValues.push({ key, value });
                });
                console.table(workspaceValues);
                console.groupEnd();
                console.log(workspaceItemsParsed);
            });
        }
        migrate(toWorkspace) {
            if (this.workspaceStoragePath === storage_2.SQLiteStorageDatabase.IN_MEMORY_PATH) {
                return Promise.resolve(); // no migration needed if running in memory
            }
            // Close workspace DB to be able to copy
            return this.workspaceStorage.close().then(() => {
                // Prepare new workspace storage folder
                return this.prepareWorkspaceStorageFolder(toWorkspace).then(result => {
                    const newWorkspaceStoragePath = path_1.join(result.path, StorageService.WORKSPACE_STORAGE_NAME);
                    // Copy current storage over to new workspace storage
                    return pfs_1.copy(this.workspaceStoragePath, newWorkspaceStoragePath).then(() => {
                        // Recreate and init workspace storage
                        return this.createWorkspaceStorage(newWorkspaceStoragePath).init();
                    });
                });
            });
        }
    };
    StorageService.WORKSPACE_STORAGE_NAME = 'state.vscdb';
    StorageService.WORKSPACE_META_NAME = 'workspace.json';
    StorageService = __decorate([
        __param(1, log_1.ILogService),
        __param(2, environment_1.IEnvironmentService)
    ], StorageService);
    exports.StorageService = StorageService;
    let LogStorageAction = class LogStorageAction extends actions_1.Action {
        constructor(id, label, storageService, windowService) {
            super(id, label);
            this.storageService = storageService;
            this.windowService = windowService;
        }
        run() {
            this.storageService.logStorage();
            return this.windowService.openDevTools();
        }
    };
    LogStorageAction.ID = 'workbench.action.logStorage';
    LogStorageAction.LABEL = nls_1.localize({ key: 'logStorage', comment: ['A developer only action to log the contents of the storage for the current window.'] }, "Log Storage Database Contents");
    LogStorageAction = __decorate([
        __param(2, storage_1.IStorageService),
        __param(3, windows_1.IWindowService)
    ], LogStorageAction);
    exports.LogStorageAction = LogStorageAction;
});
//# sourceMappingURL=storageService.js.map