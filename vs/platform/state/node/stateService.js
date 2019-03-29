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
define(["require", "exports", "vs/base/common/path", "fs", "vs/platform/environment/common/environment", "vs/base/node/extfs", "vs/base/common/types", "vs/platform/log/common/log", "vs/base/node/pfs"], function (require, exports, path, fs, environment_1, extfs_1, types_1, log_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FileStorage {
        constructor(dbPath, onError) {
            this.dbPath = dbPath;
            this.onError = onError;
            this._database = null;
            this.lastFlushedSerializedDatabase = null;
        }
        get database() {
            if (!this._database) {
                this._database = this.loadSync();
            }
            return this._database;
        }
        init() {
            return pfs_1.readFile(this.dbPath).then(contents => {
                try {
                    this.lastFlushedSerializedDatabase = contents.toString();
                    this._database = JSON.parse(this.lastFlushedSerializedDatabase);
                }
                catch (error) {
                    this._database = {};
                }
            }, error => {
                if (error.code !== 'ENOENT') {
                    this.onError(error);
                }
                this._database = {};
            });
        }
        loadSync() {
            try {
                this.lastFlushedSerializedDatabase = fs.readFileSync(this.dbPath).toString();
                return JSON.parse(this.lastFlushedSerializedDatabase);
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    this.onError(error);
                }
                return {};
            }
        }
        getItem(key, defaultValue) {
            const res = this.database[key];
            if (types_1.isUndefinedOrNull(res)) {
                return defaultValue;
            }
            return res;
        }
        setItem(key, data) {
            // Remove an item when it is undefined or null
            if (types_1.isUndefinedOrNull(data)) {
                return this.removeItem(key);
            }
            // Shortcut for primitives that did not change
            if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
                if (this.database[key] === data) {
                    return;
                }
            }
            this.database[key] = data;
            this.saveSync();
        }
        removeItem(key) {
            // Only update if the key is actually present (not undefined)
            if (!types_1.isUndefined(this.database[key])) {
                this.database[key] = undefined;
                this.saveSync();
            }
        }
        saveSync() {
            const serializedDatabase = JSON.stringify(this.database, null, 4);
            if (serializedDatabase === this.lastFlushedSerializedDatabase) {
                return; // return early if the database has not changed
            }
            try {
                extfs_1.writeFileAndFlushSync(this.dbPath, serializedDatabase); // permission issue can happen here
                this.lastFlushedSerializedDatabase = serializedDatabase;
            }
            catch (error) {
                this.onError(error);
            }
        }
    }
    exports.FileStorage = FileStorage;
    let StateService = class StateService {
        constructor(environmentService, logService) {
            this.fileStorage = new FileStorage(path.join(environmentService.userDataPath, StateService.STATE_FILE), error => logService.error(error));
        }
        init() {
            return this.fileStorage.init();
        }
        getItem(key, defaultValue) {
            return this.fileStorage.getItem(key, defaultValue);
        }
        setItem(key, data) {
            this.fileStorage.setItem(key, data);
        }
        removeItem(key) {
            this.fileStorage.removeItem(key);
        }
    };
    StateService.STATE_FILE = 'storage.json';
    StateService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, log_1.ILogService)
    ], StateService);
    exports.StateService = StateService;
});
//# sourceMappingURL=stateService.js.map