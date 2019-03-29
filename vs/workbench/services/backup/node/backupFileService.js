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
define(["require", "exports", "vs/base/common/path", "crypto", "vs/base/node/pfs", "vs/base/common/uri", "vs/base/common/async", "vs/workbench/services/backup/common/backup", "vs/platform/files/common/files", "vs/base/node/stream", "vs/editor/common/model/textModel", "vs/base/common/map", "vs/base/common/network", "vs/platform/windows/common/windows", "vs/platform/instantiation/common/extensions"], function (require, exports, path, crypto, pfs, uri_1, async_1, backup_1, files_1, stream_1, textModel_1, map_1, network_1, windows_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BackupSnapshot {
        constructor(snapshot, preamble) {
            this.snapshot = snapshot;
            this.preamble = preamble;
        }
        read() {
            let value = this.snapshot.read();
            if (!this.preambleHandled) {
                this.preambleHandled = true;
                if (typeof value === 'string') {
                    value = this.preamble + value;
                }
                else {
                    value = this.preamble;
                }
            }
            return value;
        }
    }
    exports.BackupSnapshot = BackupSnapshot;
    class BackupFilesModel {
        constructor() {
            this.cache = Object.create(null);
        }
        resolve(backupRoot) {
            return pfs.readDirsInDir(backupRoot).then(backupSchemas => {
                // For all supported schemas
                return Promise.all(backupSchemas.map(backupSchema => {
                    // Read backup directory for backups
                    const backupSchemaPath = path.join(backupRoot, backupSchema);
                    return pfs.readdir(backupSchemaPath).then(backupHashes => {
                        // Remember known backups in our caches
                        backupHashes.forEach(backupHash => {
                            const backupResource = uri_1.URI.file(path.join(backupSchemaPath, backupHash));
                            this.add(backupResource);
                        });
                    });
                }));
            }).then(() => this, error => this);
        }
        add(resource, versionId = 0) {
            this.cache[resource.toString()] = versionId;
        }
        count() {
            return Object.keys(this.cache).length;
        }
        has(resource, versionId) {
            const cachedVersionId = this.cache[resource.toString()];
            if (typeof cachedVersionId !== 'number') {
                return false; // unknown resource
            }
            if (typeof versionId === 'number') {
                return versionId === cachedVersionId; // if we are asked with a specific version ID, make sure to test for it
            }
            return true;
        }
        get() {
            return Object.keys(this.cache).map(k => uri_1.URI.parse(k));
        }
        remove(resource) {
            delete this.cache[resource.toString()];
        }
        clear() {
            this.cache = Object.create(null);
        }
    }
    exports.BackupFilesModel = BackupFilesModel;
    let BackupFileService = class BackupFileService {
        constructor(windowService, fileService) {
            const backupWorkspacePath = windowService.getConfiguration().backupPath;
            if (backupWorkspacePath) {
                this.impl = new BackupFileServiceImpl(backupWorkspacePath, fileService);
            }
            else {
                this.impl = new InMemoryBackupFileService();
            }
        }
        initialize(backupWorkspacePath) {
            if (this.impl instanceof BackupFileServiceImpl) {
                this.impl.initialize(backupWorkspacePath);
            }
        }
        hasBackups() {
            return this.impl.hasBackups();
        }
        loadBackupResource(resource) {
            return this.impl.loadBackupResource(resource);
        }
        backupResource(resource, content, versionId) {
            return this.impl.backupResource(resource, content, versionId);
        }
        discardResourceBackup(resource) {
            return this.impl.discardResourceBackup(resource);
        }
        discardAllWorkspaceBackups() {
            return this.impl.discardAllWorkspaceBackups();
        }
        getWorkspaceFileBackups() {
            return this.impl.getWorkspaceFileBackups();
        }
        resolveBackupContent(backup) {
            return this.impl.resolveBackupContent(backup);
        }
        toBackupResource(resource) {
            return this.impl.toBackupResource(resource);
        }
    };
    BackupFileService = __decorate([
        __param(0, windows_1.IWindowService),
        __param(1, files_1.IFileService)
    ], BackupFileService);
    exports.BackupFileService = BackupFileService;
    let BackupFileServiceImpl = class BackupFileServiceImpl {
        constructor(backupWorkspacePath, fileService) {
            this.fileService = fileService;
            this.isShuttingDown = false;
            this.ioOperationQueues = new async_1.ResourceQueue();
            this.initialize(backupWorkspacePath);
        }
        initialize(backupWorkspacePath) {
            this.backupWorkspacePath = backupWorkspacePath;
            this.ready = this.init();
        }
        init() {
            const model = new BackupFilesModel();
            return model.resolve(this.backupWorkspacePath);
        }
        hasBackups() {
            return this.ready.then(model => {
                return model.count() > 0;
            });
        }
        loadBackupResource(resource) {
            return this.ready.then(model => {
                // Return directly if we have a known backup with that resource
                const backupResource = this.toBackupResource(resource);
                if (model.has(backupResource)) {
                    return backupResource;
                }
                return undefined;
            });
        }
        backupResource(resource, content, versionId) {
            if (this.isShuttingDown) {
                return Promise.resolve();
            }
            return this.ready.then(model => {
                const backupResource = this.toBackupResource(resource);
                if (model.has(backupResource, versionId)) {
                    return undefined; // return early if backup version id matches requested one
                }
                return this.ioOperationQueues.queueFor(backupResource).queue(() => {
                    const preamble = `${resource.toString()}${BackupFileServiceImpl.META_MARKER}`;
                    // Update content with value
                    return this.fileService.updateContent(backupResource, new BackupSnapshot(content, preamble), backup_1.BACKUP_FILE_UPDATE_OPTIONS).then(() => model.add(backupResource, versionId));
                });
            });
        }
        discardResourceBackup(resource) {
            return this.ready.then(model => {
                const backupResource = this.toBackupResource(resource);
                return this.ioOperationQueues.queueFor(backupResource).queue(() => {
                    return pfs.del(backupResource.fsPath).then(() => model.remove(backupResource));
                });
            });
        }
        discardAllWorkspaceBackups() {
            this.isShuttingDown = true;
            return this.ready.then(model => {
                return pfs.del(this.backupWorkspacePath).then(() => model.clear());
            });
        }
        getWorkspaceFileBackups() {
            return this.ready.then(model => {
                const readPromises = [];
                model.get().forEach(fileBackup => {
                    readPromises.push(stream_1.readToMatchingString(fileBackup.fsPath, BackupFileServiceImpl.META_MARKER, 2000, 10000).then(uri_1.URI.parse));
                });
                return Promise.all(readPromises);
            });
        }
        resolveBackupContent(backup) {
            return this.fileService.resolveStreamContent(backup, backup_1.BACKUP_FILE_RESOLVE_OPTIONS).then(content => {
                // Add a filter method to filter out everything until the meta marker
                let metaFound = false;
                const metaPreambleFilter = (chunk) => {
                    if (!metaFound && chunk) {
                        const metaIndex = chunk.indexOf(BackupFileServiceImpl.META_MARKER);
                        if (metaIndex === -1) {
                            return ''; // meta not yet found, return empty string
                        }
                        metaFound = true;
                        return chunk.substr(metaIndex + 1); // meta found, return everything after
                    }
                    return chunk;
                };
                return textModel_1.createTextBufferFactoryFromStream(content.value, metaPreambleFilter);
            });
        }
        toBackupResource(resource) {
            return uri_1.URI.file(path.join(this.backupWorkspacePath, resource.scheme, hashPath(resource)));
        }
    };
    BackupFileServiceImpl.META_MARKER = '\n';
    BackupFileServiceImpl = __decorate([
        __param(1, files_1.IFileService)
    ], BackupFileServiceImpl);
    class InMemoryBackupFileService {
        constructor() {
            this.backups = new Map();
        }
        hasBackups() {
            return Promise.resolve(this.backups.size > 0);
        }
        loadBackupResource(resource) {
            const backupResource = this.toBackupResource(resource);
            if (this.backups.has(backupResource.toString())) {
                return Promise.resolve(backupResource);
            }
            return Promise.resolve(undefined);
        }
        backupResource(resource, content, versionId) {
            const backupResource = this.toBackupResource(resource);
            this.backups.set(backupResource.toString(), content);
            return Promise.resolve();
        }
        resolveBackupContent(backupResource) {
            const snapshot = this.backups.get(backupResource.toString());
            if (snapshot) {
                return Promise.resolve(textModel_1.createTextBufferFactoryFromSnapshot(snapshot));
            }
            return Promise.resolve(undefined);
        }
        getWorkspaceFileBackups() {
            return Promise.resolve(map_1.keys(this.backups).map(key => uri_1.URI.parse(key)));
        }
        discardResourceBackup(resource) {
            this.backups.delete(this.toBackupResource(resource).toString());
            return Promise.resolve();
        }
        discardAllWorkspaceBackups() {
            this.backups.clear();
            return Promise.resolve();
        }
        toBackupResource(resource) {
            return uri_1.URI.file(path.join(resource.scheme, hashPath(resource)));
        }
    }
    exports.InMemoryBackupFileService = InMemoryBackupFileService;
    /*
     * Exported only for testing
     */
    function hashPath(resource) {
        const str = resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.untitled ? resource.fsPath : resource.toString();
        return crypto.createHash('md5').update(str).digest('hex');
    }
    exports.hashPath = hashPath;
    extensions_1.registerSingleton(backup_1.IBackupFileService, BackupFileService);
});
//# sourceMappingURL=backupFileService.js.map