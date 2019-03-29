/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/map", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/base/common/uuid", "vs/platform/telemetry/node/workbenchCommonProperties"], function (require, exports, event_1, map_1, lifecycle_1, errors_1, uuid_1, workbenchCommonProperties_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class GlobalStorageDatabaseChannel extends lifecycle_1.Disposable {
        constructor(logService, storageMainService) {
            super();
            this.logService = logService;
            this.storageMainService = storageMainService;
            this._onDidChangeItems = this._register(new event_1.Emitter());
            this.whenReady = this.init();
        }
        get onDidChangeItems() { return this._onDidChangeItems.event; }
        init() {
            return this.storageMainService.initialize().then(undefined, error => {
                errors_1.onUnexpectedError(error);
                this.logService.error(error);
            }).then(() => {
                // Apply global telemetry values as part of the initialization
                // These are global across all windows and thereby should be
                // written from the main process once.
                this.initTelemetry();
                // Setup storage change listeners
                this.registerListeners();
            });
        }
        initTelemetry() {
            const instanceId = this.storageMainService.get(workbenchCommonProperties_1.instanceStorageKey, undefined);
            if (instanceId === undefined) {
                this.storageMainService.store(workbenchCommonProperties_1.instanceStorageKey, uuid_1.generateUuid());
            }
            const firstSessionDate = this.storageMainService.get(workbenchCommonProperties_1.firstSessionDateStorageKey, undefined);
            if (firstSessionDate === undefined) {
                this.storageMainService.store(workbenchCommonProperties_1.firstSessionDateStorageKey, new Date().toUTCString());
            }
            const lastSessionDate = this.storageMainService.get(workbenchCommonProperties_1.currentSessionDateStorageKey, undefined); // previous session date was the "current" one at that time
            const currentSessionDate = new Date().toUTCString(); // current session date is "now"
            this.storageMainService.store(workbenchCommonProperties_1.lastSessionDateStorageKey, typeof lastSessionDate === 'undefined' ? null : lastSessionDate);
            this.storageMainService.store(workbenchCommonProperties_1.currentSessionDateStorageKey, currentSessionDate);
        }
        registerListeners() {
            // Listen for changes in global storage to send to listeners
            // that are listening. Use a debouncer to reduce IPC traffic.
            this._register(event_1.Event.debounce(this.storageMainService.onDidChangeStorage, (prev, cur) => {
                if (!prev) {
                    prev = [cur];
                }
                else {
                    prev.push(cur);
                }
                return prev;
            }, GlobalStorageDatabaseChannel.STORAGE_CHANGE_DEBOUNCE_TIME)(events => {
                if (events.length) {
                    this._onDidChangeItems.fire(this.serializeEvents(events));
                }
            }));
        }
        serializeEvents(events) {
            const items = new Map();
            events.forEach(event => items.set(event.key, this.storageMainService.get(event.key)));
            return { items: map_1.mapToSerializable(items) };
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeItems': return this.onDidChangeItems;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'getItems': {
                    return this.whenReady.then(() => map_1.mapToSerializable(this.storageMainService.items));
                }
                case 'updateItems': {
                    return this.whenReady.then(() => {
                        const items = arg;
                        if (items.insert) {
                            for (const [key, value] of items.insert) {
                                this.storageMainService.store(key, value);
                            }
                        }
                        if (items.delete) {
                            items.delete.forEach(key => this.storageMainService.remove(key));
                        }
                    });
                }
                case 'checkIntegrity': {
                    return this.whenReady.then(() => this.storageMainService.checkIntegrity(arg));
                }
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    GlobalStorageDatabaseChannel.STORAGE_CHANGE_DEBOUNCE_TIME = 100;
    exports.GlobalStorageDatabaseChannel = GlobalStorageDatabaseChannel;
    class GlobalStorageDatabaseChannelClient extends lifecycle_1.Disposable {
        constructor(channel) {
            super();
            this.channel = channel;
            this._onDidChangeItemsExternal = this._register(new event_1.Emitter());
            this.registerListeners();
        }
        get onDidChangeItemsExternal() { return this._onDidChangeItemsExternal.event; }
        registerListeners() {
            this.onDidChangeItemsOnMainListener = this.channel.listen('onDidChangeItems')((e) => this.onDidChangeItemsOnMain(e));
        }
        onDidChangeItemsOnMain(e) {
            if (Array.isArray(e.items)) {
                this._onDidChangeItemsExternal.fire({ items: map_1.serializableToMap(e.items) });
            }
        }
        getItems() {
            return this.channel.call('getItems').then((data) => map_1.serializableToMap(data));
        }
        updateItems(request) {
            let updateCount = 0;
            const serializableRequest = Object.create(null);
            if (request.insert) {
                serializableRequest.insert = map_1.mapToSerializable(request.insert);
                updateCount += request.insert.size;
            }
            if (request.delete) {
                serializableRequest.delete = map_1.values(request.delete);
                updateCount += request.delete.size;
            }
            if (updateCount === 0) {
                return Promise.resolve(); // prevent work if not needed
            }
            return this.channel.call('updateItems', serializableRequest);
        }
        checkIntegrity(full) {
            return this.channel.call('checkIntegrity', full);
        }
        close() {
            // when we are about to close, we start to ignore main-side changes since we close anyway
            this.onDidChangeItemsOnMainListener = lifecycle_1.dispose(this.onDidChangeItemsOnMainListener);
            return Promise.resolve(); // global storage is closed on the main side
        }
        dispose() {
            super.dispose();
            this.onDidChangeItemsOnMainListener = lifecycle_1.dispose(this.onDidChangeItemsOnMainListener);
        }
    }
    exports.GlobalStorageDatabaseChannelClient = GlobalStorageDatabaseChannelClient;
});
//# sourceMappingURL=storageIpc.js.map