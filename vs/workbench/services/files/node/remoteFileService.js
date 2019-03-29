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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/resources", "vs/base/node/encoding", "vs/editor/common/services/resourceConfiguration", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/files/node/fileService", "vs/workbench/services/files/node/streams", "vs/platform/instantiation/common/extensions"], function (require, exports, arrays_1, lifecycle_1, map_1, network_1, resources, encoding_1, resourceConfiguration_1, nls_1, configuration_1, environment_1, files_1, lifecycle_2, notification_1, storage_1, workspace_1, extensions_1, fileService_1, streams_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TypeOnlyStat {
        constructor(type) {
            this.type = type;
            // todo@remote -> make a getter and warn when
            // being used in development.
            this.mtime = 0;
            this.ctime = 0;
            this.size = 0;
            //
        }
    }
    function toIFileStat(provider, tuple, recurse) {
        const [resource, stat] = tuple;
        const fileStat = {
            resource,
            name: resources.basename(resource),
            isDirectory: (stat.type & files_1.FileType.Directory) !== 0,
            isSymbolicLink: (stat.type & files_1.FileType.SymbolicLink) !== 0,
            isReadonly: !!(provider.capabilities & 2048 /* Readonly */),
            mtime: stat.mtime,
            size: stat.size,
            etag: stat.mtime.toString(29) + stat.size.toString(31),
        };
        if (fileStat.isDirectory) {
            if (recurse && recurse([resource, stat])) {
                // dir -> resolve
                return provider.readdir(resource).then(entries => {
                    // resolve children if requested
                    return Promise.all(entries.map(tuple => {
                        const [name, type] = tuple;
                        const childResource = resources.joinPath(resource, name);
                        return toIFileStat(provider, [childResource, new TypeOnlyStat(type)], recurse);
                    })).then(children => {
                        fileStat.children = children;
                        return fileStat;
                    });
                });
            }
        }
        // file or (un-resolved) dir
        return Promise.resolve(fileStat);
    }
    function toDeepIFileStat(provider, tuple, to) {
        const trie = map_1.TernarySearchTree.forPaths();
        trie.set(tuple[0].toString(), true);
        if (arrays_1.isNonEmptyArray(to)) {
            to.forEach(uri => trie.set(uri.toString(), true));
        }
        return toIFileStat(provider, tuple, candidate => {
            return Boolean(trie.findSuperstr(candidate[0].toString()) || trie.get(candidate[0].toString()));
        });
    }
    exports.toDeepIFileStat = toDeepIFileStat;
    let WorkspaceWatchLogic = class WorkspaceWatchLogic extends lifecycle_1.Disposable {
        constructor(_fileService, _configurationService, _contextService) {
            super();
            this._fileService = _fileService;
            this._configurationService = _configurationService;
            this._contextService = _contextService;
            this._watches = new Map();
            this._refresh();
            this._register(this._contextService.onDidChangeWorkspaceFolders(e => {
                for (const removed of e.removed) {
                    this._unwatchWorkspace(removed.uri);
                }
                for (const added of e.added) {
                    this._watchWorkspace(added.uri);
                }
            }));
            this._register(this._contextService.onDidChangeWorkbenchState(e => {
                this._refresh();
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('files.watcherExclude')) {
                    this._refresh();
                }
            }));
        }
        dispose() {
            this._unwatchWorkspaces();
            super.dispose();
        }
        _refresh() {
            this._unwatchWorkspaces();
            for (const folder of this._contextService.getWorkspace().folders) {
                if (folder.uri.scheme !== network_1.Schemas.file) {
                    this._watchWorkspace(folder.uri);
                }
            }
        }
        _watchWorkspace(resource) {
            let excludes = [];
            let config = this._configurationService.getValue({ resource });
            if (config.files && config.files.watcherExclude) {
                for (const key in config.files.watcherExclude) {
                    if (config.files.watcherExclude[key] === true) {
                        excludes.push(key);
                    }
                }
            }
            this._watches.set(resource.toString(), resource);
            this._fileService.watchFileChanges(resource, { recursive: true, excludes });
        }
        _unwatchWorkspace(resource) {
            if (this._watches.has(resource.toString())) {
                this._fileService.unwatchFileChanges(resource);
                this._watches.delete(resource.toString());
            }
        }
        _unwatchWorkspaces() {
            this._watches.forEach(uri => this._fileService.unwatchFileChanges(uri));
            this._watches.clear();
        }
    };
    WorkspaceWatchLogic = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, workspace_1.IWorkspaceContextService)
    ], WorkspaceWatchLogic);
    let RemoteFileService = class RemoteFileService extends fileService_1.FileService {
        constructor(_extensionService, storageService, environmentService, configurationService, contextService, lifecycleService, notificationService, textResourceConfigurationService) {
            super(contextService, environmentService, textResourceConfigurationService, configurationService, lifecycleService, storageService, notificationService);
            this._extensionService = _extensionService;
            this._activeWatches = new Map();
            this._provider = new Map();
            this._register(new WorkspaceWatchLogic(this, configurationService, contextService));
        }
        registerProvider(scheme, provider) {
            if (this._provider.has(scheme)) {
                throw new Error('a provider for that scheme is already registered');
            }
            this._provider.set(scheme, provider);
            this._onDidChangeFileSystemProviderRegistrations.fire({ added: true, scheme, provider });
            const reg = provider.onDidChangeFile(changes => {
                // forward change events
                this._onFileChanges.fire(new files_1.FileChangesEvent(changes));
            });
            return {
                dispose: () => {
                    this._onDidChangeFileSystemProviderRegistrations.fire({ added: false, scheme, provider });
                    this._provider.delete(scheme);
                    reg.dispose();
                }
            };
        }
        activateProvider(scheme) {
            return this._extensionService.activateByEvent('onFileSystem:' + scheme);
        }
        canHandleResource(resource) {
            return resource.scheme === network_1.Schemas.file || this._provider.has(resource.scheme);
        }
        _tryParseFileOperationResult(err) {
            if (!(err instanceof Error)) {
                return undefined;
            }
            let match = /^(.+) \(FileSystemError\)$/.exec(err.name);
            if (!match) {
                return undefined;
            }
            switch (match[1]) {
                case 'EntryNotFound':
                    return 2 /* FILE_NOT_FOUND */;
                case 'EntryIsADirectory':
                    return 1 /* FILE_IS_DIRECTORY */;
                case 'NoPermissions':
                    return 7 /* FILE_PERMISSION_DENIED */;
                case 'EntryExists':
                    return 5 /* FILE_MOVE_CONFLICT */;
                case 'EntryNotADirectory':
                default:
                    // todo
                    return undefined;
            }
        }
        // --- stat
        _withProvider(resource) {
            if (!resources.isAbsolutePath(resource)) {
                throw new files_1.FileOperationError(nls_1.localize('invalidPath', "The path of resource '{0}' must be absolute", resource.toString(true)), 9 /* FILE_INVALID_PATH */);
            }
            return Promise.all([
                this.activateProvider(resource.scheme)
            ]).then(() => {
                const provider = this._provider.get(resource.scheme);
                if (!provider) {
                    const err = new Error();
                    err.name = 'ENOPRO';
                    err.message = `no provider for ${resource.toString()}`;
                    throw err;
                }
                return provider;
            });
        }
        existsFile(resource) {
            if (resource.scheme === network_1.Schemas.file) {
                return super.existsFile(resource);
            }
            else {
                return this.resolveFile(resource).then(_data => true, _err => false);
            }
        }
        resolveFile(resource, options) {
            if (resource.scheme === network_1.Schemas.file) {
                return super.resolveFile(resource, options);
            }
            else {
                return this._doResolveFiles([{ resource, options }]).then(data => {
                    if (data.length !== 1 || !data[0].success) {
                        throw new files_1.FileOperationError(nls_1.localize('fileNotFoundError', "File not found ({0})", resource.toString(true)), 2 /* FILE_NOT_FOUND */);
                    }
                    else {
                        return data[0].stat;
                    }
                });
            }
        }
        resolveFiles(toResolve) {
            // soft-groupBy, keep order, don't rearrange/merge groups
            let groups = [];
            let group;
            for (const request of toResolve) {
                if (!group || group[0].resource.scheme !== request.resource.scheme) {
                    group = [];
                    groups.push(group);
                }
                group.push(request);
            }
            const promises = [];
            for (const group of groups) {
                if (group[0].resource.scheme === network_1.Schemas.file) {
                    promises.push(super.resolveFiles(group));
                }
                else {
                    promises.push(this._doResolveFiles(group));
                }
            }
            return Promise.all(promises).then(data => arrays_1.flatten(data));
        }
        _doResolveFiles(toResolve) {
            return this._withProvider(toResolve[0].resource).then(provider => {
                let result = [];
                let promises = toResolve.map((item, idx) => {
                    return provider.stat(item.resource).then(stat => {
                        return toDeepIFileStat(provider, [item.resource, stat], item.options && item.options.resolveTo).then(fileStat => {
                            result[idx] = { stat: fileStat, success: true };
                        });
                    }, _err => {
                        result[idx] = { stat: undefined, success: false };
                    });
                });
                return Promise.all(promises).then(() => result);
            });
        }
        // --- resolve
        resolveContent(resource, options) {
            if (resource.scheme === network_1.Schemas.file) {
                return super.resolveContent(resource, options);
            }
            else {
                return this._readFile(resource, options).then(RemoteFileService._asContent);
            }
        }
        resolveStreamContent(resource, options) {
            if (resource.scheme === network_1.Schemas.file) {
                return super.resolveStreamContent(resource, options);
            }
            else {
                return this._readFile(resource, options);
            }
        }
        _readFile(resource, options = Object.create(null)) {
            return this._withProvider(resource).then(provider => {
                return this.resolveFile(resource).then(fileStat => {
                    if (fileStat.isDirectory) {
                        // todo@joh cannot copy a folder
                        // https://github.com/Microsoft/vscode/issues/41547
                        throw new files_1.FileOperationError(nls_1.localize('fileIsDirectoryError', "File is directory"), 1 /* FILE_IS_DIRECTORY */, options);
                    }
                    if (fileStat.etag === options.etag) {
                        throw new files_1.FileOperationError(nls_1.localize('fileNotModifiedError', "File not modified since"), 3 /* FILE_NOT_MODIFIED_SINCE */, options);
                    }
                    const decodeStreamOpts = {
                        guessEncoding: options.autoGuessEncoding,
                        overwriteEncoding: detected => {
                            return this.encoding.getReadEncoding(resource, options, { encoding: detected, seemsBinary: false });
                        }
                    };
                    const readable = streams_1.createReadableOfProvider(provider, resource, options.position || 0);
                    return encoding_1.toDecodeStream(readable, decodeStreamOpts).then(data => {
                        if (options.acceptTextOnly && data.detected.seemsBinary) {
                            return Promise.reject(new files_1.FileOperationError(nls_1.localize('fileBinaryError', "File seems to be binary and cannot be opened as text"), 0 /* FILE_IS_BINARY */, options));
                        }
                        return {
                            encoding: data.detected.encoding,
                            value: data.stream,
                            resource: fileStat.resource,
                            name: fileStat.name,
                            etag: fileStat.etag,
                            mtime: fileStat.mtime,
                            isReadonly: fileStat.isReadonly
                        };
                    });
                });
            });
        }
        // --- saving
        static _mkdirp(provider, directory) {
            return __awaiter(this, void 0, void 0, function* () {
                let basenames = [];
                while (directory.path !== '/') {
                    try {
                        let stat = yield provider.stat(directory);
                        if ((stat.type & files_1.FileType.Directory) === 0) {
                            throw new Error(`${directory.toString()} is not a directory`);
                        }
                        break; // we have hit a directory -> good
                    }
                    catch (e) {
                        // ENOENT
                        basenames.push(resources.basename(directory));
                        directory = resources.dirname(directory);
                    }
                }
                for (let i = basenames.length - 1; i >= 0; i--) {
                    directory = resources.joinPath(directory, basenames[i]);
                    yield provider.mkdir(directory);
                }
            });
        }
        static _throwIfFileSystemIsReadonly(provider) {
            if (provider.capabilities & 2048 /* Readonly */) {
                throw new files_1.FileOperationError(nls_1.localize('err.readonly', "Resource can not be modified."), 7 /* FILE_PERMISSION_DENIED */);
            }
            return provider;
        }
        createFile(resource, content, options) {
            if (resource.scheme === network_1.Schemas.file) {
                return super.createFile(resource, content, options);
            }
            else {
                return this._withProvider(resource).then(RemoteFileService._throwIfFileSystemIsReadonly).then(provider => {
                    return RemoteFileService._mkdirp(provider, resources.dirname(resource)).then(() => {
                        const { encoding } = this.encoding.getWriteEncoding(resource);
                        return this._writeFile(provider, resource, new files_1.StringSnapshot(content || ''), encoding, { create: true, overwrite: Boolean(options && options.overwrite) });
                    });
                }).then(fileStat => {
                    this._onAfterOperation.fire(new files_1.FileOperationEvent(resource, 0 /* CREATE */, fileStat));
                    return fileStat;
                }, err => {
                    const message = nls_1.localize('err.create', "Failed to create file {0}", resource.toString(false));
                    const result = this._tryParseFileOperationResult(err);
                    throw new files_1.FileOperationError(message, result || -1, options);
                });
            }
        }
        updateContent(resource, value, options) {
            if (resource.scheme === network_1.Schemas.file) {
                return super.updateContent(resource, value, options);
            }
            else {
                return this._withProvider(resource).then(RemoteFileService._throwIfFileSystemIsReadonly).then(provider => {
                    return RemoteFileService._mkdirp(provider, resources.dirname(resource)).then(() => {
                        const snapshot = typeof value === 'string' ? new files_1.StringSnapshot(value) : value;
                        return this._writeFile(provider, resource, snapshot, options && options.encoding, { create: true, overwrite: true });
                    });
                });
            }
        }
        _writeFile(provider, resource, snapshot, preferredEncoding = undefined, options) {
            const readable = streams_1.createReadableOfSnapshot(snapshot);
            const { encoding, hasBOM } = this.encoding.getWriteEncoding(resource, preferredEncoding);
            const encoder = encoding_1.encodeStream(encoding, { addBOM: hasBOM });
            const target = streams_1.createWritableOfProvider(provider, resource, options);
            return new Promise((resolve, reject) => {
                readable.pipe(encoder).pipe(target);
                target.once('error', err => reject(err));
                target.once('finish', _ => resolve(undefined));
            }).then(_ => {
                return this.resolveFile(resource);
            });
        }
        static _asContent(content) {
            return new Promise((resolve, reject) => {
                let result = {
                    value: '',
                    encoding: content.encoding,
                    etag: content.etag,
                    mtime: content.mtime,
                    name: content.name,
                    resource: content.resource,
                    isReadonly: content.isReadonly
                };
                content.value.on('data', chunk => result.value += chunk);
                content.value.on('error', reject);
                content.value.on('end', () => resolve(result));
            });
        }
        // --- delete
        del(resource, options) {
            if (resource.scheme === network_1.Schemas.file) {
                return super.del(resource, options);
            }
            else {
                return this._withProvider(resource).then(RemoteFileService._throwIfFileSystemIsReadonly).then(provider => {
                    return provider.delete(resource, { recursive: !!(options && options.recursive) }).then(() => {
                        this._onAfterOperation.fire(new files_1.FileOperationEvent(resource, 1 /* DELETE */));
                    });
                });
            }
        }
        readFolder(resource) {
            if (resource.scheme === network_1.Schemas.file) {
                return super.readFolder(resource);
            }
            else {
                return this._withProvider(resource).then(provider => {
                    return provider.readdir(resource);
                }).then(list => list.map(l => l[0]));
            }
        }
        createFolder(resource) {
            if (resource.scheme === network_1.Schemas.file) {
                return super.createFolder(resource);
            }
            else {
                return this._withProvider(resource).then(RemoteFileService._throwIfFileSystemIsReadonly).then(provider => {
                    return RemoteFileService._mkdirp(provider, resources.dirname(resource)).then(() => {
                        return provider.mkdir(resource).then(() => {
                            return this.resolveFile(resource);
                        });
                    });
                }).then(fileStat => {
                    this._onAfterOperation.fire(new files_1.FileOperationEvent(resource, 0 /* CREATE */, fileStat));
                    return fileStat;
                });
            }
        }
        moveFile(source, target, overwrite) {
            if (source.scheme !== target.scheme) {
                return this._doMoveAcrossScheme(source, target);
            }
            else if (source.scheme === network_1.Schemas.file) {
                return super.moveFile(source, target, overwrite);
            }
            else {
                return this._doMoveWithInScheme(source, target, overwrite);
            }
        }
        _doMoveWithInScheme(source, target, overwrite = false) {
            const prepare = overwrite
                ? Promise.resolve(this.del(target, { recursive: true }).catch(_err => { }))
                : Promise.resolve();
            return prepare.then(() => this._withProvider(source)).then(RemoteFileService._throwIfFileSystemIsReadonly).then(provider => {
                return RemoteFileService._mkdirp(provider, resources.dirname(target)).then(() => {
                    return provider.rename(source, target, { overwrite }).then(() => {
                        return this.resolveFile(target);
                    }).then(fileStat => {
                        this._onAfterOperation.fire(new files_1.FileOperationEvent(source, 2 /* MOVE */, fileStat));
                        return fileStat;
                    }, err => {
                        const result = this._tryParseFileOperationResult(err);
                        if (result === 5 /* FILE_MOVE_CONFLICT */) {
                            throw new files_1.FileOperationError(nls_1.localize('fileMoveConflict', "Unable to move/copy. File already exists at destination."), result);
                        }
                        throw err;
                    });
                });
            });
        }
        _doMoveAcrossScheme(source, target, overwrite) {
            return this.copyFile(source, target, overwrite).then(() => {
                return this.del(source, { recursive: true });
            }).then(() => {
                return this.resolveFile(target);
            }).then(fileStat => {
                this._onAfterOperation.fire(new files_1.FileOperationEvent(source, 2 /* MOVE */, fileStat));
                return fileStat;
            });
        }
        copyFile(source, target, overwrite) {
            if (source.scheme === target.scheme && source.scheme === network_1.Schemas.file) {
                return super.copyFile(source, target, overwrite);
            }
            return this._withProvider(target).then(RemoteFileService._throwIfFileSystemIsReadonly).then(provider => {
                if (source.scheme === target.scheme && (provider.capabilities & 8 /* FileFolderCopy */)) {
                    // good: provider supports copy withing scheme
                    return provider.copy(source, target, { overwrite: !!overwrite }).then(() => {
                        return this.resolveFile(target);
                    }).then(fileStat => {
                        this._onAfterOperation.fire(new files_1.FileOperationEvent(source, 3 /* COPY */, fileStat));
                        return fileStat;
                    }, err => {
                        const result = this._tryParseFileOperationResult(err);
                        if (result === 5 /* FILE_MOVE_CONFLICT */) {
                            throw new files_1.FileOperationError(nls_1.localize('fileMoveConflict', "Unable to move/copy. File already exists at destination."), result);
                        }
                        throw err;
                    });
                }
                const prepare = overwrite
                    ? Promise.resolve(this.del(target, { recursive: true }).catch(_err => { }))
                    : Promise.resolve();
                // todo@ben, can only copy text files
                // https://github.com/Microsoft/vscode/issues/41543
                return prepare.then(() => {
                    return this.resolveContent(source, { acceptTextOnly: true }).then(content => {
                        return this._withProvider(target).then(provider => {
                            return this._writeFile(provider, target, new files_1.StringSnapshot(content.value), content.encoding, { create: true, overwrite: !!overwrite }).then(fileStat => {
                                this._onAfterOperation.fire(new files_1.FileOperationEvent(source, 3 /* COPY */, fileStat));
                                return fileStat;
                            });
                        }, err => {
                            const result = this._tryParseFileOperationResult(err);
                            if (result === 5 /* FILE_MOVE_CONFLICT */) {
                                throw new files_1.FileOperationError(nls_1.localize('fileMoveConflict', "Unable to move/copy. File already exists at destination."), result);
                            }
                            else if (err instanceof Error && err.name === 'ENOPRO') {
                                // file scheme
                                return super.updateContent(target, content.value, { encoding: content.encoding });
                            }
                            else {
                                return Promise.reject(err);
                            }
                        });
                    });
                });
            });
        }
        watchFileChanges(resource, opts = { recursive: false, excludes: [] }) {
            if (resource.scheme === network_1.Schemas.file) {
                return super.watchFileChanges(resource);
            }
            const key = resource.toString();
            const entry = this._activeWatches.get(key);
            if (entry) {
                entry.count += 1;
                return;
            }
            this._activeWatches.set(key, {
                count: 1,
                unwatch: this._withProvider(resource).then(provider => {
                    return provider.watch(resource, opts);
                }, _err => {
                    return { dispose() { } };
                })
            });
        }
        unwatchFileChanges(resource) {
            if (resource.scheme === network_1.Schemas.file) {
                return super.unwatchFileChanges(resource);
            }
            let entry = this._activeWatches.get(resource.toString());
            if (entry && --entry.count === 0) {
                entry.unwatch.then(lifecycle_1.dispose);
                this._activeWatches.delete(resource.toString());
            }
        }
    };
    RemoteFileService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, storage_1.IStorageService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, lifecycle_2.ILifecycleService),
        __param(6, notification_1.INotificationService),
        __param(7, resourceConfiguration_1.ITextResourceConfigurationService)
    ], RemoteFileService);
    exports.RemoteFileService = RemoteFileService;
    extensions_2.registerSingleton(files_1.IFileService, RemoteFileService);
});
//# sourceMappingURL=remoteFileService.js.map