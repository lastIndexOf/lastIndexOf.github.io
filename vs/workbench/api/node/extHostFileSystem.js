/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "./extHost.protocol", "vs/base/common/lifecycle", "vs/workbench/api/node/extHostTypes", "vs/workbench/api/node/extHostTypeConverters", "vs/base/common/network", "vs/editor/common/modes/linkComputer", "vs/base/common/strings"], function (require, exports, uri_1, extHost_protocol_1, lifecycle_1, extHostTypes_1, typeConverter, network_1, linkComputer_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FsLinkProvider {
        constructor() {
            this._schemes = [];
        }
        add(scheme) {
            this._stateMachine = undefined;
            this._schemes.push(scheme);
        }
        delete(scheme) {
            const idx = this._schemes.indexOf(scheme);
            if (idx >= 0) {
                this._schemes.splice(idx, 1);
                this._stateMachine = undefined;
            }
        }
        _initStateMachine() {
            if (!this._stateMachine) {
                // sort and compute common prefix with previous scheme
                // then build state transitions based on the data
                const schemes = this._schemes.sort();
                const edges = [];
                let prevScheme;
                let prevState;
                let nextState = 14 /* LastKnownState */;
                for (const scheme of schemes) {
                    // skip the common prefix of the prev scheme
                    // and continue with its last state
                    let pos = !prevScheme ? 0 : strings_1.commonPrefixLength(prevScheme, scheme);
                    if (pos === 0) {
                        prevState = 1 /* Start */;
                    }
                    else {
                        prevState = nextState;
                    }
                    for (; pos < scheme.length; pos++) {
                        // keep creating new (next) states until the
                        // end (and the BeforeColon-state) is reached
                        if (pos + 1 === scheme.length) {
                            nextState = 9 /* BeforeColon */;
                        }
                        else {
                            nextState += 1;
                        }
                        edges.push([prevState, scheme.toUpperCase().charCodeAt(pos), nextState]);
                        edges.push([prevState, scheme.toLowerCase().charCodeAt(pos), nextState]);
                        prevState = nextState;
                    }
                    prevScheme = scheme;
                }
                // all link must match this pattern `<scheme>:/<more>`
                edges.push([9 /* BeforeColon */, 58 /* Colon */, 10 /* AfterColon */]);
                edges.push([10 /* AfterColon */, 47 /* Slash */, 12 /* End */]);
                this._stateMachine = new linkComputer_1.StateMachine(edges);
            }
        }
        provideDocumentLinks(document) {
            this._initStateMachine();
            const result = [];
            const links = linkComputer_1.LinkComputer.computeLinks({
                getLineContent(lineNumber) {
                    return document.lineAt(lineNumber - 1).text;
                },
                getLineCount() {
                    return document.lineCount;
                }
            }, this._stateMachine);
            for (const link of links) {
                const docLink = typeConverter.DocumentLink.to(link);
                if (docLink.target) {
                    result.push(docLink);
                }
            }
            return result;
        }
    }
    class ExtHostFileSystem {
        constructor(mainContext, _extHostLanguageFeatures) {
            this._extHostLanguageFeatures = _extHostLanguageFeatures;
            this._linkProvider = new FsLinkProvider();
            this._fsProvider = new Map();
            this._usedSchemes = new Set();
            this._watches = new Map();
            // Used as a handle both for file system providers and resource label formatters (being lazy)
            this._handlePool = 0;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadFileSystem);
            this._usedSchemes.add(network_1.Schemas.file);
            this._usedSchemes.add(network_1.Schemas.untitled);
            this._usedSchemes.add(network_1.Schemas.vscode);
            this._usedSchemes.add(network_1.Schemas.inMemory);
            this._usedSchemes.add(network_1.Schemas.internal);
            this._usedSchemes.add(network_1.Schemas.http);
            this._usedSchemes.add(network_1.Schemas.https);
            this._usedSchemes.add(network_1.Schemas.mailto);
            this._usedSchemes.add(network_1.Schemas.data);
            this._usedSchemes.add(network_1.Schemas.command);
        }
        dispose() {
            lifecycle_1.dispose(this._linkProviderRegistration);
        }
        _registerLinkProviderIfNotYetRegistered() {
            if (!this._linkProviderRegistration) {
                this._linkProviderRegistration = this._extHostLanguageFeatures.registerDocumentLinkProvider(undefined, '*', this._linkProvider);
            }
        }
        registerFileSystemProvider(scheme, provider, options = {}) {
            if (this._usedSchemes.has(scheme)) {
                throw new Error(`a provider for the scheme '${scheme}' is already registered`);
            }
            //
            this._registerLinkProviderIfNotYetRegistered();
            const handle = this._handlePool++;
            this._linkProvider.add(scheme);
            this._usedSchemes.add(scheme);
            this._fsProvider.set(handle, provider);
            let capabilites = 2 /* FileReadWrite */;
            if (options.isCaseSensitive) {
                capabilites += 1024 /* PathCaseSensitive */;
            }
            if (options.isReadonly) {
                capabilites += 2048 /* Readonly */;
            }
            if (typeof provider.copy === 'function') {
                capabilites += 8 /* FileFolderCopy */;
            }
            if (typeof provider.open === 'function' && typeof provider.close === 'function'
                && typeof provider.read === 'function' && typeof provider.write === 'function') {
                capabilites += 4 /* FileOpenReadWriteClose */;
            }
            this._proxy.$registerFileSystemProvider(handle, scheme, capabilites);
            const subscription = provider.onDidChangeFile(event => {
                const mapped = [];
                for (const e of event) {
                    let { uri: resource, type } = e;
                    if (resource.scheme !== scheme) {
                        // dropping events for wrong scheme
                        continue;
                    }
                    let newType;
                    switch (type) {
                        case extHostTypes_1.FileChangeType.Changed:
                            newType = 0 /* UPDATED */;
                            break;
                        case extHostTypes_1.FileChangeType.Created:
                            newType = 1 /* ADDED */;
                            break;
                        case extHostTypes_1.FileChangeType.Deleted:
                            newType = 2 /* DELETED */;
                            break;
                        default:
                            throw new Error('Unknown FileChangeType');
                    }
                    mapped.push({ resource, type: newType });
                }
                this._proxy.$onFileSystemChange(handle, mapped);
            });
            return lifecycle_1.toDisposable(() => {
                subscription.dispose();
                this._linkProvider.delete(scheme);
                this._usedSchemes.delete(scheme);
                this._fsProvider.delete(handle);
                this._proxy.$unregisterProvider(handle);
            });
        }
        registerResourceLabelFormatter(formatter) {
            const handle = this._handlePool++;
            this._proxy.$registerResourceLabelFormatter(handle, formatter);
            return lifecycle_1.toDisposable(() => {
                this._proxy.$unregisterResourceLabelFormatter(handle);
            });
        }
        static _asIStat(stat) {
            const { type, ctime, mtime, size } = stat;
            return { type, ctime, mtime, size };
        }
        $stat(handle, resource) {
            return Promise.resolve(this.getProvider(handle).stat(uri_1.URI.revive(resource))).then(ExtHostFileSystem._asIStat);
        }
        $readdir(handle, resource) {
            return Promise.resolve(this.getProvider(handle).readDirectory(uri_1.URI.revive(resource)));
        }
        $readFile(handle, resource) {
            return Promise.resolve(this.getProvider(handle).readFile(uri_1.URI.revive(resource))).then(data => {
                return Buffer.isBuffer(data) ? data : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
            });
        }
        $writeFile(handle, resource, content, opts) {
            return Promise.resolve(this.getProvider(handle).writeFile(uri_1.URI.revive(resource), content, opts));
        }
        $delete(handle, resource, opts) {
            return Promise.resolve(this.getProvider(handle).delete(uri_1.URI.revive(resource), opts));
        }
        $rename(handle, oldUri, newUri, opts) {
            return Promise.resolve(this.getProvider(handle).rename(uri_1.URI.revive(oldUri), uri_1.URI.revive(newUri), opts));
        }
        $copy(handle, oldUri, newUri, opts) {
            const provider = this.getProvider(handle);
            if (!provider.copy) {
                throw new Error('FileSystemProvider does not implement "copy"');
            }
            return Promise.resolve(provider.copy(uri_1.URI.revive(oldUri), uri_1.URI.revive(newUri), opts));
        }
        $mkdir(handle, resource) {
            return Promise.resolve(this.getProvider(handle).createDirectory(uri_1.URI.revive(resource)));
        }
        $watch(handle, session, resource, opts) {
            const subscription = this.getProvider(handle).watch(uri_1.URI.revive(resource), opts);
            this._watches.set(session, subscription);
        }
        $unwatch(_handle, session) {
            const subscription = this._watches.get(session);
            if (subscription) {
                subscription.dispose();
                this._watches.delete(session);
            }
        }
        $open(handle, resource, opts) {
            const provider = this.getProvider(handle);
            if (!provider.open) {
                throw new Error('FileSystemProvider does not implement "open"');
            }
            return Promise.resolve(provider.open(uri_1.URI.revive(resource), opts));
        }
        $close(handle, fd) {
            const provider = this.getProvider(handle);
            if (!provider.close) {
                throw new Error('FileSystemProvider does not implement "close"');
            }
            return Promise.resolve(provider.close(fd));
        }
        $read(handle, fd, pos, length) {
            const provider = this.getProvider(handle);
            if (!provider.read) {
                throw new Error('FileSystemProvider does not implement "read"');
            }
            const data = Buffer.allocUnsafe(length);
            return Promise.resolve(provider.read(fd, pos, data, 0, length)).then(read => {
                return data.slice(0, read); // don't send zeros
            });
        }
        $write(handle, fd, pos, data) {
            const provider = this.getProvider(handle);
            if (!provider.write) {
                throw new Error('FileSystemProvider does not implement "write"');
            }
            return Promise.resolve(provider.write(fd, pos, data, 0, data.length));
        }
        getProvider(handle) {
            const provider = this._fsProvider.get(handle);
            if (!provider) {
                const err = new Error();
                err.name = 'ENOPRO';
                err.message = `no provider`;
                throw err;
            }
            return provider;
        }
    }
    exports.ExtHostFileSystem = ExtHostFileSystem;
});
//# sourceMappingURL=extHostFileSystem.js.map