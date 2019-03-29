/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "fs", "os", "crypto", "assert", "vs/platform/files/common/files", "vs/platform/files/node/files", "vs/base/common/extpath", "vs/base/common/map", "vs/base/common/arrays", "vs/base/common/objects", "vs/base/node/extfs", "vs/base/common/async", "vs/base/common/uri", "vs/nls", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/base/node/pfs", "vs/base/node/encoding", "vs/base/node/flow", "vs/workbench/services/files/node/watcher/unix/watcherService", "vs/workbench/services/files/node/watcher/win32/watcherService", "vs/workbench/services/files/node/watcher/common", "vs/base/common/event", "vs/workbench/services/files/node/watcher/nsfw/watcherService", "vs/base/common/cancellation", "vs/base/common/labels", "vs/base/common/network", "vs/platform/notification/common/notification", "vs/base/common/errors", "vs/platform/product/node/product", "vs/workbench/services/files/node/encoding", "vs/workbench/services/files/node/streams"], function (require, exports, paths, fs, os, crypto, assert, files_1, files_2, extpath_1, map_1, arrays, objects, extfs, async_1, uri_1, nls, platform_1, lifecycle_1, pfs, encoding_1, flow, watcherService_1, watcherService_2, common_1, event_1, watcherService_3, cancellation_1, labels_1, network_1, notification_1, errors_1, product_1, encoding_2, streams_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FileService extends lifecycle_1.Disposable {
        constructor(contextService, environmentService, textResourceConfigurationService, configurationService, lifecycleService, storageService, notificationService, options = Object.create(null)) {
            super();
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.configurationService = configurationService;
            this.lifecycleService = lifecycleService;
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.options = options;
            this._onFileChanges = this._register(new event_1.Emitter());
            this._onAfterOperation = this._register(new event_1.Emitter());
            this._onDidChangeFileSystemProviderRegistrations = this._register(new event_1.Emitter());
            this.activeFileChangesWatchers = new map_1.ResourceMap();
            this.fileChangesWatchDelayer = new async_1.ThrottledDelayer(FileService.FS_EVENT_DELAY);
            this.undeliveredRawFileChangesEvents = [];
            this._encoding = new encoding_2.ResourceEncodings(textResourceConfigurationService, environmentService, contextService, this.options.encodingOverride);
            this.registerListeners();
        }
        get onFileChanges() { return this._onFileChanges.event; }
        get onAfterOperation() { return this._onAfterOperation.event; }
        get onDidChangeFileSystemProviderRegistrations() { return this._onDidChangeFileSystemProviderRegistrations.event; }
        get encoding() {
            return this._encoding;
        }
        registerListeners() {
            // Wait until we are fully running before starting file watchers
            this.lifecycleService.when(3 /* Restored */).then(() => {
                this.setupFileWatching();
            });
            // Workbench State Change
            this._register(this.contextService.onDidChangeWorkbenchState(() => {
                if (this.lifecycleService.phase >= 3 /* Restored */) {
                    this.setupFileWatching();
                }
            }));
            // Lifecycle
            this.lifecycleService.onShutdown(this.dispose, this);
        }
        handleError(error) {
            const msg = error ? error.toString() : undefined;
            if (!msg) {
                return;
            }
            // Forward to unexpected error handler
            errors_1.onUnexpectedError(msg);
            // Detect if we run < .NET Framework 4.5 (TODO@ben remove with new watcher impl)
            if (msg.indexOf(FileService.NET_VERSION_ERROR) >= 0 && !this.storageService.getBoolean(FileService.NET_VERSION_ERROR_IGNORE_KEY, 1 /* WORKSPACE */)) {
                this.notificationService.prompt(notification_1.Severity.Warning, nls.localize('netVersionError', "The Microsoft .NET Framework 4.5 is required. Please follow the link to install it."), [{
                        label: nls.localize('installNet', "Download .NET Framework 4.5"),
                        run: () => window.open('https://go.microsoft.com/fwlink/?LinkId=786533')
                    },
                    {
                        label: nls.localize('neverShowAgain', "Don't Show Again"),
                        isSecondary: true,
                        run: () => this.storageService.store(FileService.NET_VERSION_ERROR_IGNORE_KEY, true, 1 /* WORKSPACE */)
                    }], { sticky: true });
            }
            // Detect if we run into ENOSPC issues
            if (msg.indexOf(FileService.ENOSPC_ERROR) >= 0 && !this.storageService.getBoolean(FileService.ENOSPC_ERROR_IGNORE_KEY, 1 /* WORKSPACE */)) {
                this.notificationService.prompt(notification_1.Severity.Warning, nls.localize('enospcError', "{0} is unable to watch for file changes in this large workspace. Please follow the instructions link to resolve this issue.", product_1.default.nameLong), [{
                        label: nls.localize('learnMore', "Instructions"),
                        run: () => window.open('https://go.microsoft.com/fwlink/?linkid=867693')
                    },
                    {
                        label: nls.localize('neverShowAgain', "Don't Show Again"),
                        isSecondary: true,
                        run: () => this.storageService.store(FileService.ENOSPC_ERROR_IGNORE_KEY, true, 1 /* WORKSPACE */)
                    }], { sticky: true });
            }
        }
        setupFileWatching() {
            // dispose old if any
            if (this.activeWorkspaceFileChangeWatcher) {
                this.activeWorkspaceFileChangeWatcher.dispose();
            }
            // Return if not aplicable
            const workbenchState = this.contextService.getWorkbenchState();
            if (workbenchState === 1 /* EMPTY */ || this.options.disableWatcher) {
                return;
            }
            // new watcher: use it if setting tells us so or we run in multi-root environment
            const configuration = this.configurationService.getValue();
            if ((configuration.files && configuration.files.useExperimentalFileWatcher) || workbenchState === 3 /* WORKSPACE */) {
                const multiRootWatcher = new watcherService_3.FileWatcher(this.contextService, this.configurationService, e => this._onFileChanges.fire(e), err => this.handleError(err), this.environmentService.verbose);
                this.activeWorkspaceFileChangeWatcher = lifecycle_1.toDisposable(multiRootWatcher.startWatching());
            }
            // legacy watcher
            else {
                let watcherIgnoredPatterns = [];
                if (configuration.files && configuration.files.watcherExclude) {
                    watcherIgnoredPatterns = Object.keys(configuration.files.watcherExclude).filter(k => !!configuration.files.watcherExclude[k]);
                }
                if (platform_1.isWindows) {
                    const legacyWindowsWatcher = new watcherService_2.FileWatcher(this.contextService, watcherIgnoredPatterns, e => this._onFileChanges.fire(e), err => this.handleError(err), this.environmentService.verbose);
                    this.activeWorkspaceFileChangeWatcher = lifecycle_1.toDisposable(legacyWindowsWatcher.startWatching());
                }
                else {
                    const legacyUnixWatcher = new watcherService_1.FileWatcher(this.contextService, this.configurationService, e => this._onFileChanges.fire(e), err => this.handleError(err), this.environmentService.verbose);
                    this.activeWorkspaceFileChangeWatcher = lifecycle_1.toDisposable(legacyUnixWatcher.startWatching());
                }
            }
        }
        registerProvider(scheme, provider) {
            throw new Error('not implemented');
        }
        activateProvider(scheme) {
            return Promise.reject(new Error('not implemented'));
        }
        canHandleResource(resource) {
            return resource.scheme === network_1.Schemas.file;
        }
        resolveFile(resource, options) {
            return this.resolve(resource, options);
        }
        resolveFiles(toResolve) {
            return Promise.all(toResolve.map(resourceAndOptions => this.resolve(resourceAndOptions.resource, resourceAndOptions.options)
                .then(stat => ({ stat, success: true }), error => ({ stat: undefined, success: false }))));
        }
        existsFile(resource) {
            return this.resolveFile(resource).then(() => true, () => false);
        }
        resolveContent(resource, options) {
            return this.resolveStreamContent(resource, options).then(streamContent => {
                return new Promise((resolve, reject) => {
                    const result = {
                        resource: streamContent.resource,
                        name: streamContent.name,
                        mtime: streamContent.mtime,
                        etag: streamContent.etag,
                        encoding: streamContent.encoding,
                        isReadonly: streamContent.isReadonly,
                        value: ''
                    };
                    streamContent.value.on('data', chunk => result.value += chunk);
                    streamContent.value.on('error', err => reject(err));
                    streamContent.value.on('end', () => resolve(result));
                    return result;
                });
            });
        }
        resolveStreamContent(resource, options) {
            // Guard early against attempts to resolve an invalid file path
            if (resource.scheme !== network_1.Schemas.file || !resource.fsPath) {
                return Promise.reject(new files_1.FileOperationError(nls.localize('fileInvalidPath', "Invalid file resource ({0})", resource.toString(true)), 9 /* FILE_INVALID_PATH */, options));
            }
            const result = {
                resource: undefined,
                name: undefined,
                mtime: undefined,
                etag: undefined,
                encoding: undefined,
                isReadonly: false,
                value: undefined
            };
            const contentResolverTokenSource = new cancellation_1.CancellationTokenSource();
            const onStatError = (error) => {
                // error: stop reading the file the stat and content resolve call
                // usually race, mostly likely the stat call will win and cancel
                // the content call
                contentResolverTokenSource.cancel();
                // forward error
                return Promise.reject(error);
            };
            const statsPromise = this.resolveFile(resource).then(stat => {
                result.resource = stat.resource;
                result.name = stat.name;
                result.mtime = stat.mtime;
                result.etag = stat.etag;
                // Return early if resource is a directory
                if (stat.isDirectory) {
                    return onStatError(new files_1.FileOperationError(nls.localize('fileIsDirectoryError', "File is directory"), 1 /* FILE_IS_DIRECTORY */, options));
                }
                // Return early if file not modified since
                if (options && options.etag && options.etag === stat.etag) {
                    return onStatError(new files_1.FileOperationError(nls.localize('fileNotModifiedError', "File not modified since"), 3 /* FILE_NOT_MODIFIED_SINCE */, options));
                }
                // Return early if file is too large to load
                if (typeof stat.size === 'number') {
                    if (stat.size > Math.max(typeof this.environmentService.args['max-memory'] === 'string' ? parseInt(this.environmentService.args['max-memory']) * 1024 * 1024 || 0 : 0, files_2.MAX_HEAP_SIZE)) {
                        return onStatError(new files_1.FileOperationError(nls.localize('fileTooLargeForHeapError', "To open a file of this size, you need to restart VS Code and allow it to use more memory"), 10 /* FILE_EXCEED_MEMORY_LIMIT */));
                    }
                    if (stat.size > files_2.MAX_FILE_SIZE) {
                        return onStatError(new files_1.FileOperationError(nls.localize('fileTooLargeError', "File too large to open"), 8 /* FILE_TOO_LARGE */));
                    }
                }
                return undefined;
            }, err => {
                // Wrap file not found errors
                if (err.code === 'ENOENT') {
                    return onStatError(new files_1.FileOperationError(nls.localize('fileNotFoundError', "File not found ({0})", resource.toString(true)), 2 /* FILE_NOT_FOUND */, options));
                }
                return onStatError(err);
            });
            let completePromise;
            // await the stat iff we already have an etag so that we compare the
            // etag from the stat before we actually read the file again.
            if (options && options.etag) {
                completePromise = statsPromise.then(() => {
                    return this.fillInContents(result, resource, options, contentResolverTokenSource.token); // Waterfall -> only now resolve the contents
                });
            }
            // a fresh load without a previous etag which means we can resolve the file stat
            // and the content at the same time, avoiding the waterfall.
            else {
                let statsError;
                let contentsError;
                completePromise = Promise.all([
                    statsPromise.then(() => undefined, error => statsError = error),
                    this.fillInContents(result, resource, options, contentResolverTokenSource.token).then(() => undefined, error => contentsError = error)
                ]).then(() => {
                    // Since each file operation can return a FileOperationError
                    // we want to prefer that one if possible. Otherwise we just
                    // return with the first error we get.
                    if (files_1.FileOperationError.isFileOperationError(statsError)) {
                        return Promise.reject(statsError);
                    }
                    if (files_1.FileOperationError.isFileOperationError(contentsError)) {
                        return Promise.reject(contentsError);
                    }
                    if (statsError || contentsError) {
                        return Promise.reject(statsError || contentsError);
                    }
                    return undefined;
                });
            }
            return completePromise.then(() => {
                contentResolverTokenSource.dispose();
                return result;
            }, error => {
                contentResolverTokenSource.dispose();
                return Promise.reject(error);
            });
        }
        fillInContents(content, resource, options, token) {
            return this.resolveFileData(resource, options, token).then(data => {
                content.encoding = data.encoding;
                content.value = data.stream;
            });
        }
        resolveFileData(resource, options, token) {
            const chunkBuffer = Buffer.allocUnsafe(64 * 1024);
            const result = {
                encoding: undefined,
                stream: undefined
            };
            return new Promise((resolve, reject) => {
                fs.open(this.toAbsolutePath(resource), 'r', (err, fd) => {
                    if (err) {
                        if (err.code === 'ENOENT') {
                            // Wrap file not found errors
                            err = new files_1.FileOperationError(nls.localize('fileNotFoundError', "File not found ({0})", resource.toString(true)), 2 /* FILE_NOT_FOUND */, options);
                        }
                        return reject(err);
                    }
                    let decoder;
                    let totalBytesRead = 0;
                    const finish = (err) => {
                        if (err) {
                            if (err.code === 'EISDIR') {
                                // Wrap EISDIR errors (fs.open on a directory works, but you cannot read from it)
                                err = new files_1.FileOperationError(nls.localize('fileIsDirectoryError', "File is directory"), 1 /* FILE_IS_DIRECTORY */, options);
                            }
                            if (decoder) {
                                // If the decoder already started, we have to emit the error through it as
                                // event because the promise is already resolved!
                                decoder.emit('error', err);
                            }
                            else {
                                reject(err);
                            }
                        }
                        if (decoder) {
                            decoder.end();
                        }
                        if (fd) {
                            fs.close(fd, err => {
                                if (err) {
                                    this.handleError(`resolveFileData#close(): ${err.toString()}`);
                                }
                            });
                        }
                    };
                    const handleChunk = (bytesRead) => {
                        if (token.isCancellationRequested) {
                            // cancellation -> finish
                            finish(new Error('cancelled'));
                        }
                        else if (bytesRead === 0) {
                            // no more data -> finish
                            finish();
                        }
                        else if (bytesRead < chunkBuffer.length) {
                            // write the sub-part of data we received -> repeat
                            decoder.write(chunkBuffer.slice(0, bytesRead), readChunk);
                        }
                        else {
                            // write all data we received -> repeat
                            decoder.write(chunkBuffer, readChunk);
                        }
                    };
                    let currentPosition = (options && options.position) || null;
                    const readChunk = () => {
                        fs.read(fd, chunkBuffer, 0, chunkBuffer.length, currentPosition, (err, bytesRead) => {
                            totalBytesRead += bytesRead;
                            if (typeof currentPosition === 'number') {
                                // if we received a position argument as option we need to ensure that
                                // we advance the position by the number of bytesread
                                currentPosition += bytesRead;
                            }
                            if (totalBytesRead > Math.max(typeof this.environmentService.args['max-memory'] === 'number' ? parseInt(this.environmentService.args['max-memory']) * 1024 * 1024 || 0 : 0, files_2.MAX_HEAP_SIZE)) {
                                finish(new files_1.FileOperationError(nls.localize('fileTooLargeForHeapError', "To open a file of this size, you need to restart VS Code and allow it to use more memory"), 10 /* FILE_EXCEED_MEMORY_LIMIT */));
                            }
                            if (totalBytesRead > files_2.MAX_FILE_SIZE) {
                                // stop when reading too much
                                finish(new files_1.FileOperationError(nls.localize('fileTooLargeError', "File too large to open"), 8 /* FILE_TOO_LARGE */, options));
                            }
                            else if (err) {
                                // some error happened
                                finish(err);
                            }
                            else if (decoder) {
                                // pass on to decoder
                                handleChunk(bytesRead);
                            }
                            else {
                                // when receiving the first chunk of data we need to create the
                                // decoding stream which is then used to drive the string stream.
                                Promise.resolve(encoding_1.detectEncodingFromBuffer({ buffer: chunkBuffer, bytesRead }, (options && options.autoGuessEncoding) || this.textResourceConfigurationService.getValue(resource, 'files.autoGuessEncoding'))).then(detected => {
                                    if (options && options.acceptTextOnly && detected.seemsBinary) {
                                        // Return error early if client only accepts text and this is not text
                                        finish(new files_1.FileOperationError(nls.localize('fileBinaryError', "File seems to be binary and cannot be opened as text"), 0 /* FILE_IS_BINARY */, options));
                                    }
                                    else {
                                        result.encoding = this._encoding.getReadEncoding(resource, options, detected);
                                        result.stream = decoder = encoding_1.decodeStream(result.encoding);
                                        resolve(result);
                                        handleChunk(bytesRead);
                                    }
                                }).then(undefined, err => {
                                    // failed to get encoding
                                    finish(err);
                                });
                            }
                        });
                    };
                    // start reading
                    readChunk();
                });
            });
        }
        updateContent(resource, value, options = Object.create(null)) {
            if (options.writeElevated) {
                return this.doUpdateContentElevated(resource, value, options);
            }
            return this.doUpdateContent(resource, value, options);
        }
        doUpdateContent(resource, value, options = Object.create(null)) {
            const absolutePath = this.toAbsolutePath(resource);
            // 1.) check file for writing
            return this.checkFileBeforeWriting(absolutePath, options).then(exists => {
                let createParentsPromise;
                if (exists) {
                    createParentsPromise = Promise.resolve();
                }
                else {
                    createParentsPromise = pfs.mkdirp(paths.dirname(absolutePath));
                }
                // 2.) create parents as needed
                return createParentsPromise.then(() => {
                    const { encoding, hasBOM } = this._encoding.getWriteEncoding(resource, options.encoding);
                    let addBomPromise = Promise.resolve(false);
                    // Some encodings come with a BOM automatically
                    if (hasBOM) {
                        addBomPromise = Promise.resolve(hasBOM);
                    }
                    // Existing UTF-8 file: check for options regarding BOM
                    else if (exists && encoding === encoding_1.UTF8) {
                        if (options.overwriteEncoding) {
                            addBomPromise = Promise.resolve(false); // if we are to overwrite the encoding, we do not preserve it if found
                        }
                        else {
                            addBomPromise = encoding_1.detectEncodingByBOM(absolutePath).then(enc => enc === encoding_1.UTF8); // otherwise preserve it if found
                        }
                    }
                    // 3.) check to add UTF BOM
                    return addBomPromise.then(addBom => {
                        // 4.) set contents and resolve
                        if (!exists || !platform_1.isWindows) {
                            return this.doSetContentsAndResolve(resource, absolutePath, value, addBom, encoding);
                        }
                        // On Windows and if the file exists, we use a different strategy of saving the file
                        // by first truncating the file and then writing with r+ mode. This helps to save hidden files on Windows
                        // (see https://github.com/Microsoft/vscode/issues/931) and prevent removing alternate data streams
                        // (see https://github.com/Microsoft/vscode/issues/6363)
                        else {
                            // 4.) truncate
                            return pfs.truncate(absolutePath, 0).then(() => {
                                // 5.) set contents (with r+ mode) and resolve
                                return this.doSetContentsAndResolve(resource, absolutePath, value, addBom, encoding, { flag: 'r+' }).then(undefined, error => {
                                    if (this.environmentService.verbose) {
                                        console.error(`Truncate succeeded, but save failed (${error}), retrying after 100ms`);
                                    }
                                    // We heard from one user that fs.truncate() succeeds, but the save fails (https://github.com/Microsoft/vscode/issues/61310)
                                    // In that case, the file is now entirely empty and the contents are gone. This can happen if an external file watcher is
                                    // installed that reacts on the truncate and keeps the file busy right after. Our workaround is to retry to save after a
                                    // short timeout, assuming that the file is free to write then.
                                    return async_1.timeout(100).then(() => this.doSetContentsAndResolve(resource, absolutePath, value, addBom, encoding, { flag: 'r+' }));
                                });
                            }, error => {
                                if (this.environmentService.verbose) {
                                    console.error(`Truncate failed (${error}), falling back to normal save`);
                                }
                                // we heard from users that fs.truncate() fails (https://github.com/Microsoft/vscode/issues/59561)
                                // in that case we simply save the file without truncating first (same as macOS and Linux)
                                return this.doSetContentsAndResolve(resource, absolutePath, value, addBom, encoding);
                            });
                        }
                    });
                });
            }).then(undefined, error => {
                if (error.code === 'EACCES' || error.code === 'EPERM') {
                    return Promise.reject(new files_1.FileOperationError(nls.localize('filePermission', "Permission denied writing to file ({0})", resource.toString(true)), 7 /* FILE_PERMISSION_DENIED */, options));
                }
                return Promise.reject(error);
            });
        }
        doSetContentsAndResolve(resource, absolutePath, value, addBOM, encodingToWrite, options) {
            // Configure encoding related options as needed
            const writeFileOptions = options ? options : Object.create(null);
            if (addBOM || encodingToWrite !== encoding_1.UTF8) {
                writeFileOptions.encoding = {
                    charset: encodingToWrite,
                    addBOM
                };
            }
            let writeFilePromise;
            if (typeof value === 'string') {
                writeFilePromise = pfs.writeFile(absolutePath, value, writeFileOptions);
            }
            else {
                writeFilePromise = pfs.writeFile(absolutePath, streams_1.createReadableOfSnapshot(value), writeFileOptions);
            }
            // set contents
            return writeFilePromise.then(() => {
                // resolve
                return this.resolve(resource);
            });
        }
        doUpdateContentElevated(resource, value, options = Object.create(null)) {
            const absolutePath = this.toAbsolutePath(resource);
            // 1.) check file for writing
            return this.checkFileBeforeWriting(absolutePath, options, options.overwriteReadonly /* ignore readonly if we overwrite readonly, this is handled via sudo later */).then(exists => {
                const writeOptions = objects.assign(Object.create(null), options);
                writeOptions.writeElevated = false;
                writeOptions.encoding = this._encoding.getWriteEncoding(resource, options.encoding).encoding;
                // 2.) write to a temporary file to be able to copy over later
                const tmpPath = paths.join(os.tmpdir(), `code-elevated-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6)}`);
                return this.updateContent(uri_1.URI.file(tmpPath), value, writeOptions).then(() => {
                    // 3.) invoke our CLI as super user
                    return new Promise((resolve_1, reject_1) => { require(['sudo-prompt'], resolve_1, reject_1); }).then(sudoPrompt => {
                        return new Promise((resolve, reject) => {
                            const promptOptions = {
                                name: this.environmentService.appNameLong.replace('-', ''),
                                icns: (platform_1.isMacintosh && this.environmentService.isBuilt) ? paths.join(paths.dirname(this.environmentService.appRoot), `${product_1.default.nameShort}.icns`) : undefined
                            };
                            const sudoCommand = [`"${this.environmentService.cliPath}"`];
                            if (options.overwriteReadonly) {
                                sudoCommand.push('--file-chmod');
                            }
                            sudoCommand.push('--file-write', `"${tmpPath}"`, `"${absolutePath}"`);
                            sudoPrompt.exec(sudoCommand.join(' '), promptOptions, (error, stdout, stderr) => {
                                if (error || stderr) {
                                    reject(error || stderr);
                                }
                                else {
                                    resolve(undefined);
                                }
                            });
                        });
                    }).then(() => {
                        // 3.) delete temp file
                        return pfs.del(tmpPath, os.tmpdir()).then(() => {
                            // 4.) resolve again
                            return this.resolve(resource);
                        });
                    });
                });
            }).then(undefined, error => {
                if (this.environmentService.verbose) {
                    this.handleError(`Unable to write to file '${resource.toString(true)}' as elevated user (${error})`);
                }
                if (!files_1.FileOperationError.isFileOperationError(error)) {
                    error = new files_1.FileOperationError(nls.localize('filePermission', "Permission denied writing to file ({0})", resource.toString(true)), 7 /* FILE_PERMISSION_DENIED */, options);
                }
                return Promise.reject(error);
            });
        }
        createFile(resource, content = '', options = Object.create(null)) {
            const absolutePath = this.toAbsolutePath(resource);
            let checkFilePromise;
            if (options.overwrite) {
                checkFilePromise = Promise.resolve(false);
            }
            else {
                checkFilePromise = pfs.exists(absolutePath);
            }
            // Check file exists
            return checkFilePromise.then(exists => {
                if (exists && !options.overwrite) {
                    return Promise.reject(new files_1.FileOperationError(nls.localize('fileExists', "File to create already exists ({0})", resource.toString(true)), 4 /* FILE_MODIFIED_SINCE */, options));
                }
                // Create file
                return this.updateContent(resource, content).then(result => {
                    // Events
                    this._onAfterOperation.fire(new files_1.FileOperationEvent(resource, 0 /* CREATE */, result));
                    return result;
                });
            });
        }
        readFolder(resource) {
            const absolutePath = this.toAbsolutePath(resource);
            return pfs.readdir(absolutePath);
        }
        createFolder(resource) {
            // 1.) Create folder
            const absolutePath = this.toAbsolutePath(resource);
            return pfs.mkdirp(absolutePath).then(() => {
                // 2.) Resolve
                return this.resolve(resource).then(result => {
                    // Events
                    this._onAfterOperation.fire(new files_1.FileOperationEvent(resource, 0 /* CREATE */, result));
                    return result;
                });
            });
        }
        checkFileBeforeWriting(absolutePath, options = Object.create(null), ignoreReadonly) {
            return pfs.exists(absolutePath).then(exists => {
                if (exists) {
                    return pfs.stat(absolutePath).then(stat => {
                        if (stat.isDirectory()) {
                            return Promise.reject(new Error('Expected file is actually a directory'));
                        }
                        // Dirty write prevention: if the file on disk has been changed and does not match our expected
                        // mtime and etag, we bail out to prevent dirty writing.
                        //
                        // First, we check for a mtime that is in the future before we do more checks. The assumption is
                        // that only the mtime is an indicator for a file that has changd on disk.
                        //
                        // Second, if the mtime has advanced, we compare the size of the file on disk with our previous
                        // one using the etag() function. Relying only on the mtime check has prooven to produce false
                        // positives due to file system weirdness (especially around remote file systems). As such, the
                        // check for size is a weaker check because it can return a false negative if the file has changed
                        // but to the same length. This is a compromise we take to avoid having to produce checksums of
                        // the file content for comparison which would be much slower to compute.
                        if (typeof options.mtime === 'number' && typeof options.etag === 'string' && options.mtime < stat.mtime.getTime() && options.etag !== etag(stat.size, options.mtime)) {
                            return Promise.reject(new files_1.FileOperationError(nls.localize('fileModifiedError', "File Modified Since"), 4 /* FILE_MODIFIED_SINCE */, options));
                        }
                        // Throw if file is readonly and we are not instructed to overwrite
                        if (!ignoreReadonly && !(stat.mode & 128) /* readonly */) {
                            if (!options.overwriteReadonly) {
                                return this.readOnlyError(options);
                            }
                            // Try to change mode to writeable
                            let mode = stat.mode;
                            mode = mode | 128;
                            return pfs.chmod(absolutePath, mode).then(() => {
                                // Make sure to check the mode again, it could have failed
                                return pfs.stat(absolutePath).then(stat => {
                                    if (!(stat.mode & 128) /* readonly */) {
                                        return this.readOnlyError(options);
                                    }
                                    return exists;
                                });
                            });
                        }
                        return exists;
                    });
                }
                return exists;
            });
        }
        readOnlyError(options) {
            return Promise.reject(new files_1.FileOperationError(nls.localize('fileReadOnlyError', "File is Read Only"), 6 /* FILE_READ_ONLY */, options));
        }
        moveFile(source, target, overwrite) {
            return this.moveOrCopyFile(source, target, false, !!overwrite);
        }
        copyFile(source, target, overwrite) {
            return this.moveOrCopyFile(source, target, true, !!overwrite);
        }
        moveOrCopyFile(source, target, keepCopy, overwrite) {
            const sourcePath = this.toAbsolutePath(source);
            const targetPath = this.toAbsolutePath(target);
            // 1.) move / copy
            return this.doMoveOrCopyFile(sourcePath, targetPath, keepCopy, overwrite).then(() => {
                // 2.) resolve
                return this.resolve(target).then(result => {
                    // Events (unless it was a no-op because paths are identical)
                    if (sourcePath !== targetPath) {
                        this._onAfterOperation.fire(new files_1.FileOperationEvent(source, keepCopy ? 3 /* COPY */ : 2 /* MOVE */, result));
                    }
                    return result;
                });
            });
        }
        doMoveOrCopyFile(sourcePath, targetPath, keepCopy, overwrite) {
            // 1.) validate operation
            if (files_1.isParent(targetPath, sourcePath, !platform_1.isLinux)) {
                return Promise.reject(new Error('Unable to move/copy when source path is parent of target path'));
            }
            else if (sourcePath === targetPath) {
                return Promise.resolve(); // no-op but not an error
            }
            // 2.) check if target exists
            return pfs.exists(targetPath).then(exists => {
                const isCaseRename = sourcePath.toLowerCase() === targetPath.toLowerCase();
                // Return early with conflict if target exists and we are not told to overwrite
                if (exists && !isCaseRename && !overwrite) {
                    return Promise.reject(new files_1.FileOperationError(nls.localize('fileMoveConflict', "Unable to move/copy. File already exists at destination."), 5 /* FILE_MOVE_CONFLICT */));
                }
                // 3.) make sure target is deleted before we move/copy unless this is a case rename of the same file
                let deleteTargetPromise = Promise.resolve();
                if (exists && !isCaseRename) {
                    if (extpath_1.isEqualOrParent(sourcePath, targetPath, !platform_1.isLinux /* ignorecase */)) {
                        return Promise.reject(new Error(nls.localize('unableToMoveCopyError', "Unable to move/copy. File would replace folder it is contained in."))); // catch this corner case!
                    }
                    deleteTargetPromise = this.del(uri_1.URI.file(targetPath), { recursive: true });
                }
                return deleteTargetPromise.then(() => {
                    // 4.) make sure parents exists
                    return pfs.mkdirp(paths.dirname(targetPath)).then(() => {
                        // 4.) copy/move
                        if (keepCopy) {
                            return async_1.nfcall(extfs.copy, sourcePath, targetPath);
                        }
                        else {
                            return async_1.nfcall(extfs.mv, sourcePath, targetPath);
                        }
                    });
                });
            });
        }
        del(resource, options) {
            if (options && options.useTrash) {
                return this.doMoveItemToTrash(resource);
            }
            return this.doDelete(resource, !!(options && options.recursive));
        }
        doMoveItemToTrash(resource) {
            const absolutePath = resource.fsPath;
            const shell = require('electron').shell; // workaround for being able to run tests out of VSCode debugger
            const result = shell.moveItemToTrash(absolutePath);
            if (!result) {
                return Promise.reject(new Error(platform_1.isWindows ? nls.localize('binFailed', "Failed to move '{0}' to the recycle bin", paths.basename(absolutePath)) : nls.localize('trashFailed', "Failed to move '{0}' to the trash", paths.basename(absolutePath))));
            }
            this._onAfterOperation.fire(new files_1.FileOperationEvent(resource, 1 /* DELETE */));
            return Promise.resolve();
        }
        doDelete(resource, recursive) {
            const absolutePath = this.toAbsolutePath(resource);
            let assertNonRecursiveDelete;
            if (!recursive) {
                assertNonRecursiveDelete = pfs.stat(absolutePath).then(stat => {
                    if (!stat.isDirectory()) {
                        return undefined;
                    }
                    return pfs.readdir(absolutePath).then(children => {
                        if (children.length === 0) {
                            return undefined;
                        }
                        return Promise.reject(new Error(nls.localize('deleteFailed', "Failed to delete non-empty folder '{0}'.", paths.basename(absolutePath))));
                    });
                }, error => Promise.resolve() /* ignore errors */);
            }
            else {
                assertNonRecursiveDelete = Promise.resolve();
            }
            return assertNonRecursiveDelete.then(() => {
                return pfs.del(absolutePath, os.tmpdir()).then(() => {
                    // Events
                    this._onAfterOperation.fire(new files_1.FileOperationEvent(resource, 1 /* DELETE */));
                });
            });
        }
        // Helpers
        toAbsolutePath(arg1) {
            let resource;
            if (arg1 instanceof uri_1.URI) {
                resource = arg1;
            }
            else {
                resource = arg1.resource;
            }
            assert.ok(resource && resource.scheme === network_1.Schemas.file, `Invalid resource: ${resource}`);
            return paths.normalize(resource.fsPath);
        }
        resolve(resource, options = Object.create(null)) {
            return this.toStatResolver(resource).then(model => model.resolve(options));
        }
        toStatResolver(resource) {
            const absolutePath = this.toAbsolutePath(resource);
            return pfs.statLink(absolutePath).then(({ isSymbolicLink, stat }) => {
                return new StatResolver(resource, isSymbolicLink, stat.isDirectory(), stat.mtime.getTime(), stat.size, this.environmentService.verbose ? err => this.handleError(err) : undefined);
            });
        }
        watchFileChanges(resource) {
            assert.ok(resource && resource.scheme === network_1.Schemas.file, `Invalid resource for watching: ${resource}`);
            // Check for existing watcher first
            const entry = this.activeFileChangesWatchers.get(resource);
            if (entry) {
                entry.count += 1;
                return;
            }
            // Create or get watcher for provided path
            const fsPath = resource.fsPath;
            const fsName = paths.basename(resource.fsPath);
            const watcherDisposable = extfs.watch(fsPath, (eventType, filename) => {
                const renamedOrDeleted = ((filename && filename !== fsName) || eventType === 'rename');
                // The file was either deleted or renamed. Many tools apply changes to files in an
                // atomic way ("Atomic Save") by first renaming the file to a temporary name and then
                // renaming it back to the original name. Our watcher will detect this as a rename
                // and then stops to work on Mac and Linux because the watcher is applied to the
                // inode and not the name. The fix is to detect this case and trying to watch the file
                // again after a certain delay.
                // In addition, we send out a delete event if after a timeout we detect that the file
                // does indeed not exist anymore.
                if (renamedOrDeleted) {
                    // Very important to dispose the watcher which now points to a stale inode
                    watcherDisposable.dispose();
                    this.activeFileChangesWatchers.delete(resource);
                    // Wait a bit and try to install watcher again, assuming that the file was renamed quickly ("Atomic Save")
                    setTimeout(() => {
                        this.existsFile(resource).then(exists => {
                            // File still exists, so reapply the watcher
                            if (exists) {
                                this.watchFileChanges(resource);
                            }
                            // File seems to be really gone, so emit a deleted event
                            else {
                                this.onRawFileChange({
                                    type: 2 /* DELETED */,
                                    path: fsPath
                                });
                            }
                        });
                    }, FileService.FS_REWATCH_DELAY);
                }
                // Handle raw file change
                this.onRawFileChange({
                    type: 0 /* UPDATED */,
                    path: fsPath
                });
            }, (error) => this.handleError(error));
            // Remember in map
            this.activeFileChangesWatchers.set(resource, {
                count: 1,
                unwatch: () => watcherDisposable.dispose()
            });
        }
        onRawFileChange(event) {
            // add to bucket of undelivered events
            this.undeliveredRawFileChangesEvents.push(event);
            if (this.environmentService.verbose) {
                console.log('%c[File Watcher (node.js)]%c', 'color: blue', 'color: black', `${event.type === 1 /* ADDED */ ? '[ADDED]' : event.type === 2 /* DELETED */ ? '[DELETED]' : '[CHANGED]'} ${event.path}`);
            }
            // handle emit through delayer to accommodate for bulk changes
            this.fileChangesWatchDelayer.trigger(() => {
                const buffer = this.undeliveredRawFileChangesEvents;
                this.undeliveredRawFileChangesEvents = [];
                // Normalize
                const normalizedEvents = common_1.normalize(buffer);
                // Logging
                if (this.environmentService.verbose) {
                    normalizedEvents.forEach(r => {
                        console.log('%c[File Watcher (node.js)]%c >> normalized', 'color: blue', 'color: black', `${r.type === 1 /* ADDED */ ? '[ADDED]' : r.type === 2 /* DELETED */ ? '[DELETED]' : '[CHANGED]'} ${r.path}`);
                    });
                }
                // Emit
                this._onFileChanges.fire(common_1.toFileChangesEvent(normalizedEvents));
                return Promise.resolve();
            });
        }
        unwatchFileChanges(resource) {
            const watcher = this.activeFileChangesWatchers.get(resource);
            if (watcher && --watcher.count === 0) {
                watcher.unwatch();
                this.activeFileChangesWatchers.delete(resource);
            }
        }
        dispose() {
            super.dispose();
            if (this.activeWorkspaceFileChangeWatcher) {
                this.activeWorkspaceFileChangeWatcher.dispose();
                this.activeWorkspaceFileChangeWatcher = null;
            }
            this.activeFileChangesWatchers.forEach(watcher => watcher.unwatch());
            this.activeFileChangesWatchers.clear();
        }
    }
    FileService.FS_EVENT_DELAY = 50; // aggregate and only emit events when changes have stopped for this duration (in ms)
    FileService.FS_REWATCH_DELAY = 300; // delay to rewatch a file that was renamed or deleted (in ms)
    FileService.NET_VERSION_ERROR = 'System.MissingMethodException';
    FileService.NET_VERSION_ERROR_IGNORE_KEY = 'ignoreNetVersionError';
    FileService.ENOSPC_ERROR = 'ENOSPC';
    FileService.ENOSPC_ERROR_IGNORE_KEY = 'ignoreEnospcError';
    exports.FileService = FileService;
    function etag(arg1, arg2) {
        let size;
        let mtime;
        if (typeof arg2 === 'number') {
            size = arg1;
            mtime = arg2;
        }
        else {
            size = arg1.size;
            mtime = arg1.mtime.getTime();
        }
        return `"${crypto.createHash('sha1').update(String(size) + String(mtime)).digest('hex')}"`;
    }
    class StatResolver {
        constructor(resource, isSymbolicLink, isDirectory, mtime, size, errorLogger) {
            this.resource = resource;
            this.isSymbolicLink = isSymbolicLink;
            this.isDirectory = isDirectory;
            this.mtime = mtime;
            this.size = size;
            this.errorLogger = errorLogger;
            assert.ok(resource && resource.scheme === network_1.Schemas.file, `Invalid resource: ${resource}`);
            this.name = labels_1.getBaseLabel(resource);
            this.etag = etag(size, mtime);
        }
        resolve(options) {
            // General Data
            const fileStat = {
                resource: this.resource,
                isDirectory: this.isDirectory,
                isSymbolicLink: this.isSymbolicLink,
                isReadonly: false,
                name: this.name,
                etag: this.etag,
                size: this.size,
                mtime: this.mtime
            };
            // File Specific Data
            if (!this.isDirectory) {
                return Promise.resolve(fileStat);
            }
            // Directory Specific Data
            else {
                // Convert the paths from options.resolveTo to absolute paths
                let absoluteTargetPaths = null;
                if (options && options.resolveTo) {
                    absoluteTargetPaths = [];
                    for (const resource of options.resolveTo) {
                        absoluteTargetPaths.push(resource.fsPath);
                    }
                }
                return new Promise(resolve => {
                    // Load children
                    this.resolveChildren(this.resource.fsPath, absoluteTargetPaths, !!(options && options.resolveSingleChildDescendants), children => {
                        if (children) {
                            children = arrays.coalesce(children); // we don't want those null children (could be permission denied when reading a child)
                        }
                        fileStat.children = children || [];
                        resolve(fileStat);
                    });
                });
            }
        }
        resolveChildren(absolutePath, absoluteTargetPaths, resolveSingleChildDescendants, callback) {
            extfs.readdir(absolutePath, (error, files) => {
                if (error) {
                    if (this.errorLogger) {
                        this.errorLogger(error);
                    }
                    return callback(null); // return - we might not have permissions to read the folder
                }
                // for each file in the folder
                flow.parallel(files, (file, clb) => {
                    const fileResource = uri_1.URI.file(paths.resolve(absolutePath, file));
                    let fileStat;
                    let isSymbolicLink = false;
                    const $this = this;
                    flow.sequence(function onError(error) {
                        if ($this.errorLogger) {
                            $this.errorLogger(error);
                        }
                        clb(null, null); // return - we might not have permissions to read the folder or stat the file
                    }, function stat() {
                        extfs.statLink(fileResource.fsPath, this);
                    }, function countChildren(statAndLink) {
                        fileStat = statAndLink.stat;
                        isSymbolicLink = statAndLink.isSymbolicLink;
                        if (fileStat.isDirectory()) {
                            extfs.readdir(fileResource.fsPath, (error, result) => {
                                this(null, result ? result.length : 0);
                            });
                        }
                        else {
                            this(null, 0);
                        }
                    }, function resolve(childCount) {
                        const childStat = {
                            resource: fileResource,
                            isDirectory: fileStat.isDirectory(),
                            isSymbolicLink,
                            isReadonly: false,
                            name: file,
                            mtime: fileStat.mtime.getTime(),
                            etag: etag(fileStat),
                            size: fileStat.size
                        };
                        // Return early for files
                        if (!fileStat.isDirectory()) {
                            return clb(null, childStat);
                        }
                        // Handle Folder
                        let resolveFolderChildren = false;
                        if (files.length === 1 && resolveSingleChildDescendants) {
                            resolveFolderChildren = true;
                        }
                        else if (childCount > 0 && absoluteTargetPaths && absoluteTargetPaths.some(targetPath => extpath_1.isEqualOrParent(targetPath, fileResource.fsPath, !platform_1.isLinux /* ignorecase */))) {
                            resolveFolderChildren = true;
                        }
                        // Continue resolving children based on condition
                        if (resolveFolderChildren) {
                            $this.resolveChildren(fileResource.fsPath, absoluteTargetPaths, resolveSingleChildDescendants, children => {
                                if (children) {
                                    children = arrays.coalesce(children); // we don't want those null children
                                }
                                childStat.children = children || [];
                                clb(null, childStat);
                            });
                        }
                        // Otherwise return result
                        else {
                            clb(null, childStat);
                        }
                    });
                }, (errors, result) => {
                    callback(result);
                });
            });
        }
    }
    exports.StatResolver = StatResolver;
});
//# sourceMappingURL=fileService.js.map