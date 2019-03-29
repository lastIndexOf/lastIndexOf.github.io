/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/async", "vs/base/common/types", "vs/base/common/map", "vs/base/common/path", "vs/base/node/pfs", "vs/base/common/arrays"], function (require, exports, lifecycle_1, event_1, async_1, types_1, map_1, path_1, pfs_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var StorageHint;
    (function (StorageHint) {
        // A hint to the storage that the storage
        // does not exist on disk yet. This allows
        // the storage library to improve startup
        // time by not checking the storage for data.
        StorageHint[StorageHint["STORAGE_DOES_NOT_EXIST"] = 0] = "STORAGE_DOES_NOT_EXIST";
    })(StorageHint = exports.StorageHint || (exports.StorageHint = {}));
    var StorageState;
    (function (StorageState) {
        StorageState[StorageState["None"] = 0] = "None";
        StorageState[StorageState["Initialized"] = 1] = "Initialized";
        StorageState[StorageState["Closed"] = 2] = "Closed";
    })(StorageState || (StorageState = {}));
    class Storage extends lifecycle_1.Disposable {
        constructor(database, options = Object.create(null)) {
            super();
            this.database = database;
            this.options = options;
            this._onDidChangeStorage = this._register(new event_1.Emitter());
            this.state = StorageState.None;
            this.cache = new Map();
            this.pendingDeletes = new Set();
            this.pendingInserts = new Map();
            this.flushDelayer = this._register(new async_1.ThrottledDelayer(Storage.DEFAULT_FLUSH_DELAY));
            this.registerListeners();
        }
        get onDidChangeStorage() { return this._onDidChangeStorage.event; }
        registerListeners() {
            this._register(this.database.onDidChangeItemsExternal(e => this.onDidChangeItemsExternal(e)));
        }
        onDidChangeItemsExternal(e) {
            // items that change external require us to update our
            // caches with the values. we just accept the value and
            // emit an event if there is a change.
            e.items.forEach((value, key) => this.accept(key, value));
        }
        accept(key, value) {
            if (this.state === StorageState.Closed) {
                return; // Return early if we are already closed
            }
            let changed = false;
            // Item got removed, check for deletion
            if (types_1.isUndefinedOrNull(value)) {
                changed = this.cache.delete(key);
            }
            // Item got updated, check for change
            else {
                const currentValue = this.cache.get(key);
                if (currentValue !== value) {
                    this.cache.set(key, value);
                    changed = true;
                }
            }
            // Signal to outside listeners
            if (changed) {
                this._onDidChangeStorage.fire(key);
            }
        }
        get items() {
            return this.cache;
        }
        get size() {
            return this.cache.size;
        }
        init() {
            if (this.state !== StorageState.None) {
                return Promise.resolve(); // either closed or already initialized
            }
            this.state = StorageState.Initialized;
            if (this.options.hint === StorageHint.STORAGE_DOES_NOT_EXIST) {
                // return early if we know the storage file does not exist. this is a performance
                // optimization to not load all items of the underlying storage if we know that
                // there can be no items because the storage does not exist.
                return Promise.resolve();
            }
            return this.database.getItems().then(items => {
                this.cache = items;
            });
        }
        get(key, fallbackValue) {
            const value = this.cache.get(key);
            if (types_1.isUndefinedOrNull(value)) {
                return fallbackValue;
            }
            return value;
        }
        getBoolean(key, fallbackValue) {
            const value = this.get(key);
            if (types_1.isUndefinedOrNull(value)) {
                return fallbackValue;
            }
            return value === 'true';
        }
        getNumber(key, fallbackValue) {
            const value = this.get(key);
            if (types_1.isUndefinedOrNull(value)) {
                return fallbackValue;
            }
            return parseInt(value, 10);
        }
        set(key, value) {
            if (this.state === StorageState.Closed) {
                return Promise.resolve(); // Return early if we are already closed
            }
            // We remove the key for undefined/null values
            if (types_1.isUndefinedOrNull(value)) {
                return this.delete(key);
            }
            // Otherwise, convert to String and store
            const valueStr = String(value);
            // Return early if value already set
            const currentValue = this.cache.get(key);
            if (currentValue === valueStr) {
                return Promise.resolve();
            }
            // Update in cache and pending
            this.cache.set(key, valueStr);
            this.pendingInserts.set(key, valueStr);
            this.pendingDeletes.delete(key);
            // Event
            this._onDidChangeStorage.fire(key);
            // Accumulate work by scheduling after timeout
            return this.flushDelayer.trigger(() => this.flushPending());
        }
        delete(key) {
            if (this.state === StorageState.Closed) {
                return Promise.resolve(); // Return early if we are already closed
            }
            // Remove from cache and add to pending
            const wasDeleted = this.cache.delete(key);
            if (!wasDeleted) {
                return Promise.resolve(); // Return early if value already deleted
            }
            if (!this.pendingDeletes.has(key)) {
                this.pendingDeletes.add(key);
            }
            this.pendingInserts.delete(key);
            // Event
            this._onDidChangeStorage.fire(key);
            // Accumulate work by scheduling after timeout
            return this.flushDelayer.trigger(() => this.flushPending());
        }
        close() {
            if (this.state === StorageState.Closed) {
                return Promise.resolve(); // return if already closed
            }
            // Update state
            this.state = StorageState.Closed;
            // Trigger new flush to ensure data is persisted and then close
            // even if there is an error flushing. We must always ensure
            // the DB is closed to avoid corruption.
            //
            // Recovery: we pass our cache over as recovery option in case
            // the DB is not healthy.
            const onDone = () => this.database.close(() => this.cache);
            return this.flushDelayer.trigger(() => this.flushPending(), 0 /* as soon as possible */).then(onDone, onDone);
        }
        flushPending() {
            if (this.pendingInserts.size === 0 && this.pendingDeletes.size === 0) {
                return Promise.resolve(); // return early if nothing to do
            }
            // Get pending data
            const updateRequest = { insert: this.pendingInserts, delete: this.pendingDeletes };
            // Reset pending data for next run
            this.pendingDeletes = new Set();
            this.pendingInserts = new Map();
            // Update in storage
            return this.database.updateItems(updateRequest);
        }
        checkIntegrity(full) {
            return this.database.checkIntegrity(full);
        }
    }
    Storage.DEFAULT_FLUSH_DELAY = 100;
    exports.Storage = Storage;
    class SQLiteStorageDatabase {
        constructor(path, options = Object.create(null)) {
            this.path = path;
            this.name = path_1.basename(path);
            this.logger = new SQLiteStorageDatabaseLogger(options.logging);
            this.whenConnected = this.connect(path);
        }
        get onDidChangeItemsExternal() { return event_1.Event.None; } // since we are the only client, there can be no external changes
        getItems() {
            return this.whenConnected.then(connection => {
                const items = new Map();
                return this.all(connection, 'SELECT * FROM ItemTable').then(rows => {
                    rows.forEach(row => items.set(row.key, row.value));
                    if (this.logger.isTracing) {
                        this.logger.trace(`[storage ${this.name}] getItems(): ${items.size} rows`);
                    }
                    return items;
                });
            });
        }
        updateItems(request) {
            return this.whenConnected.then(connection => this.doUpdateItems(connection, request));
        }
        doUpdateItems(connection, request) {
            let updateCount = 0;
            if (request.insert) {
                updateCount += request.insert.size;
            }
            if (request.delete) {
                updateCount += request.delete.size;
            }
            if (updateCount === 0) {
                return Promise.resolve();
            }
            if (this.logger.isTracing) {
                this.logger.trace(`[storage ${this.name}] updateItems(): insert(${request.insert ? map_1.mapToString(request.insert) : '0'}), delete(${request.delete ? map_1.setToString(request.delete) : '0'})`);
            }
            return this.transaction(connection, () => {
                // INSERT
                if (request.insert && request.insert.size > 0) {
                    const keysValuesChunks = [];
                    keysValuesChunks.push([]); // seed with initial empty chunk
                    // Split key/values into chunks of SQLiteStorageDatabase.MAX_HOST_PARAMETERS
                    // so that we can efficiently run the INSERT with as many HOST parameters as possible
                    let currentChunkIndex = 0;
                    request.insert.forEach((value, key) => {
                        let keyValueChunk = keysValuesChunks[currentChunkIndex];
                        if (keyValueChunk.length > SQLiteStorageDatabase.MAX_HOST_PARAMETERS) {
                            currentChunkIndex++;
                            keyValueChunk = [];
                            keysValuesChunks.push(keyValueChunk);
                        }
                        keyValueChunk.push(key, value);
                    });
                    keysValuesChunks.forEach(keysValuesChunk => {
                        this.prepare(connection, `INSERT INTO ItemTable VALUES ${arrays_1.fill(keysValuesChunk.length / 2, '(?,?)').join(',')}`, stmt => stmt.run(keysValuesChunk), () => {
                            const keys = [];
                            let length = 0;
                            request.insert.forEach((value, key) => {
                                keys.push(key);
                                length += value.length;
                            });
                            return `Keys: ${keys.join(', ')} Length: ${length}`;
                        });
                    });
                }
                // DELETE
                if (request.delete && request.delete.size) {
                    const keysChunks = [];
                    keysChunks.push([]); // seed with initial empty chunk
                    // Split keys into chunks of SQLiteStorageDatabase.MAX_HOST_PARAMETERS
                    // so that we can efficiently run the DELETE with as many HOST parameters
                    // as possible
                    let currentChunkIndex = 0;
                    request.delete.forEach(key => {
                        let keyChunk = keysChunks[currentChunkIndex];
                        if (keyChunk.length > SQLiteStorageDatabase.MAX_HOST_PARAMETERS) {
                            currentChunkIndex++;
                            keyChunk = [];
                            keysChunks.push(keyChunk);
                        }
                        keyChunk.push(key);
                    });
                    keysChunks.forEach(keysChunk => {
                        this.prepare(connection, `DELETE FROM ItemTable WHERE key IN (${arrays_1.fill(keysChunk.length, '?').join(',')})`, stmt => stmt.run(keysChunk), () => {
                            const keys = [];
                            request.delete.forEach(key => {
                                keys.push(key);
                            });
                            return `Keys: ${keys.join(', ')}`;
                        });
                    });
                }
            });
        }
        close(recovery) {
            this.logger.trace(`[storage ${this.name}] close()`);
            return this.whenConnected.then(connection => this.doClose(connection, recovery));
        }
        doClose(connection, recovery) {
            return new Promise((resolve, reject) => {
                connection.db.close(closeError => {
                    if (closeError) {
                        this.handleSQLiteError(connection, closeError, `[storage ${this.name}] close(): ${closeError}`);
                    }
                    // Return early if this storage was created only in-memory
                    // e.g. when running tests we do not need to backup.
                    if (this.path === SQLiteStorageDatabase.IN_MEMORY_PATH) {
                        return resolve();
                    }
                    // If the DB closed successfully and we are not running in-memory
                    // and the DB did not get errors during runtime, make a backup
                    // of the DB so that we can use it as fallback in case the actual
                    // DB becomes corrupt in the future.
                    if (!connection.isErroneous && !connection.isInMemory) {
                        return this.backup().then(resolve, error => {
                            this.logger.error(`[storage ${this.name}] backup(): ${error}`);
                            return resolve(); // ignore failing backup
                        });
                    }
                    // Recovery: if we detected errors while using the DB or we are using
                    // an inmemory DB (as a fallback to not being able to open the DB initially)
                    // and we have a recovery function provided, we recreate the DB with this
                    // data to recover all known data without loss if possible.
                    if (typeof recovery === 'function') {
                        // Delete the existing DB. If the path does not exist or fails to
                        // be deleted, we do not try to recover anymore because we assume
                        // that the path is no longer writeable for us.
                        return pfs_1.unlink(this.path).then(() => {
                            // Re-open the DB fresh
                            return this.doConnect(this.path).then(recoveryConnection => {
                                const closeRecoveryConnection = () => {
                                    return this.doClose(recoveryConnection, undefined /* do not attempt to recover again */);
                                };
                                // Store items
                                return this.doUpdateItems(recoveryConnection, { insert: recovery() }).then(() => closeRecoveryConnection(), error => {
                                    // In case of an error updating items, still ensure to close the connection
                                    // to prevent SQLITE_BUSY errors when the connection is restablished
                                    closeRecoveryConnection();
                                    return Promise.reject(error);
                                });
                            });
                        }).then(resolve, reject);
                    }
                    // Finally without recovery we just reject
                    return reject(closeError || new Error('Database has errors or is in-memory without recovery option'));
                });
            });
        }
        backup() {
            const backupPath = this.toBackupPath(this.path);
            return pfs_1.copy(this.path, backupPath);
        }
        toBackupPath(path) {
            return `${path}.backup`;
        }
        checkIntegrity(full) {
            this.logger.trace(`[storage ${this.name}] checkIntegrity(full: ${full})`);
            return this.whenConnected.then(connection => {
                return this.get(connection, full ? 'PRAGMA integrity_check' : 'PRAGMA quick_check').then(row => {
                    const integrity = full ? row['integrity_check'] : row['quick_check'];
                    if (connection.isErroneous) {
                        return `${integrity} (last error: ${connection.lastError})`;
                    }
                    if (connection.isInMemory) {
                        return `${integrity} (in-memory!)`;
                    }
                    return integrity;
                });
            });
        }
        connect(path, retryOnBusy = true) {
            this.logger.trace(`[storage ${this.name}] open(${path}, retryOnBusy: ${retryOnBusy})`);
            return this.doConnect(path).then(undefined, error => {
                this.logger.error(`[storage ${this.name}] open(): Unable to open DB due to ${error}`);
                // SQLITE_BUSY should only arise if another process is locking the same DB we want
                // to open at that time. This typically never happens because a DB connection is
                // limited per window. However, in the event of a window reload, it may be possible
                // that the previous connection was not properly closed while the new connection is
                // already established.
                //
                // In this case we simply wait for some time and retry once to establish the connection.
                //
                if (error.code === 'SQLITE_BUSY' && retryOnBusy) {
                    return async_1.timeout(SQLiteStorageDatabase.BUSY_OPEN_TIMEOUT).then(() => this.connect(path, false /* not another retry */));
                }
                // Otherwise, best we can do is to recover from a backup if that exists, as such we
                // move the DB to a different filename and try to load from backup. If that fails,
                // a new empty DB is being created automatically.
                //
                // The final fallback is to use an in-memory DB which should only happen if the target
                // folder is really not writeable for us.
                //
                return pfs_1.unlink(path)
                    .then(() => pfs_1.renameIgnoreError(this.toBackupPath(path), path))
                    .then(() => this.doConnect(path))
                    .then(undefined, error => {
                    this.logger.error(`[storage ${this.name}] open(): Unable to use backup due to ${error}`);
                    // In case of any error to open the DB, use an in-memory
                    // DB so that we always have a valid DB to talk to.
                    return this.doConnect(SQLiteStorageDatabase.IN_MEMORY_PATH);
                });
            });
        }
        handleSQLiteError(connection, error, msg) {
            connection.isErroneous = true;
            connection.lastError = msg;
            this.logger.error(msg);
        }
        doConnect(path) {
            return new Promise((resolve, reject) => {
                new Promise((resolve_1, reject_1) => { require(['vscode-sqlite3'], resolve_1, reject_1); }).then(sqlite3 => {
                    const connection = {
                        db: new (this.logger.isTracing ? sqlite3.verbose().Database : sqlite3.Database)(path, error => {
                            if (error) {
                                return connection.db ? connection.db.close(() => reject(error)) : reject(error);
                            }
                            // The following exec() statement serves two purposes:
                            // - create the DB if it does not exist yet
                            // - validate that the DB is not corrupt (the open() call does not throw otherwise)
                            return this.exec(connection, [
                                'PRAGMA user_version = 1;',
                                'CREATE TABLE IF NOT EXISTS ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB)'
                            ].join('')).then(() => {
                                return resolve(connection);
                            }, error => {
                                return connection.db.close(() => reject(error));
                            });
                        }),
                        isInMemory: path === SQLiteStorageDatabase.IN_MEMORY_PATH
                    };
                    // Errors
                    connection.db.on('error', error => this.handleSQLiteError(connection, error, `[storage ${this.name}] Error (event): ${error}`));
                    // Tracing
                    if (this.logger.isTracing) {
                        connection.db.on('trace', sql => this.logger.trace(`[storage ${this.name}] Trace (event): ${sql}`));
                    }
                }, reject);
            });
        }
        exec(connection, sql) {
            return new Promise((resolve, reject) => {
                connection.db.exec(sql, error => {
                    if (error) {
                        this.handleSQLiteError(connection, error, `[storage ${this.name}] exec(): ${error}`);
                        return reject(error);
                    }
                    return resolve();
                });
            });
        }
        get(connection, sql) {
            return new Promise((resolve, reject) => {
                connection.db.get(sql, (error, row) => {
                    if (error) {
                        this.handleSQLiteError(connection, error, `[storage ${this.name}] get(): ${error}`);
                        return reject(error);
                    }
                    return resolve(row);
                });
            });
        }
        all(connection, sql) {
            return new Promise((resolve, reject) => {
                connection.db.all(sql, (error, rows) => {
                    if (error) {
                        this.handleSQLiteError(connection, error, `[storage ${this.name}] all(): ${error}`);
                        return reject(error);
                    }
                    return resolve(rows);
                });
            });
        }
        transaction(connection, transactions) {
            return new Promise((resolve, reject) => {
                connection.db.serialize(() => {
                    connection.db.run('BEGIN TRANSACTION');
                    transactions();
                    connection.db.run('END TRANSACTION', error => {
                        if (error) {
                            this.handleSQLiteError(connection, error, `[storage ${this.name}] transaction(): ${error}`);
                            return reject(error);
                        }
                        return resolve();
                    });
                });
            });
        }
        prepare(connection, sql, runCallback, errorDetails) {
            const stmt = connection.db.prepare(sql);
            const statementErrorListener = error => {
                this.handleSQLiteError(connection, error, `[storage ${this.name}] prepare(): ${error} (${sql}). Details: ${errorDetails()}`);
            };
            stmt.on('error', statementErrorListener);
            runCallback(stmt);
            stmt.finalize(error => {
                if (error) {
                    statementErrorListener(error);
                }
                stmt.removeListener('error', statementErrorListener);
            });
        }
    }
    SQLiteStorageDatabase.IN_MEMORY_PATH = ':memory:';
    SQLiteStorageDatabase.BUSY_OPEN_TIMEOUT = 2000; // timeout in ms to retry when opening DB fails with SQLITE_BUSY
    SQLiteStorageDatabase.MAX_HOST_PARAMETERS = 256; // maximum number of parameters within a statement
    exports.SQLiteStorageDatabase = SQLiteStorageDatabase;
    class SQLiteStorageDatabaseLogger {
        constructor(options) {
            if (options && typeof options.logTrace === 'function') {
                this.logTrace = options.logTrace;
            }
            if (options && typeof options.logError === 'function') {
                this.logError = options.logError;
            }
        }
        get isTracing() {
            return !!this.logTrace;
        }
        trace(msg) {
            if (this.logTrace) {
                this.logTrace(msg);
            }
        }
        error(error) {
            if (this.logError) {
                this.logError(error);
            }
        }
    }
    class InMemoryStorageDatabase {
        constructor() {
            this.onDidChangeItemsExternal = event_1.Event.None;
            this.items = new Map();
        }
        getItems() {
            return Promise.resolve(this.items);
        }
        updateItems(request) {
            if (request.insert) {
                request.insert.forEach((value, key) => this.items.set(key, value));
            }
            if (request.delete) {
                request.delete.forEach(key => this.items.delete(key));
            }
            return Promise.resolve();
        }
        close() {
            return Promise.resolve();
        }
        checkIntegrity(full) {
            return Promise.resolve('ok');
        }
    }
    exports.InMemoryStorageDatabase = InMemoryStorageDatabase;
});
//# sourceMappingURL=storage.js.map