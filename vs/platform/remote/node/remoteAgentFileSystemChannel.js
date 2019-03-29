/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/common/uuid"], function (require, exports, event_1, lifecycle_1, uri_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.REMOTE_FILE_SYSTEM_CHANNEL_NAME = 'remotefilesystem';
    class RemoteExtensionsFileSystemProvider extends lifecycle_1.Disposable {
        constructor(channel) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChange.event;
            this._onDidChangeCapabilities = this._register(new event_1.Emitter());
            this.onDidChangeCapabilities = this._onDidChangeCapabilities.event;
            this._session = uuid_1.generateUuid();
            this._channel = channel;
            this.setCaseSensitive(true);
            this._channel.listen('filechange', [this._session])((events) => {
                this._onDidChange.fire(events.map(RemoteExtensionsFileSystemProvider._createFileChange));
            });
        }
        dispose() {
            super.dispose();
        }
        setCaseSensitive(isCaseSensitive) {
            let capabilities = (2 /* FileReadWrite */
                | 8 /* FileFolderCopy */);
            if (isCaseSensitive) {
                capabilities |= 1024 /* PathCaseSensitive */;
            }
            this.capabilities = capabilities;
            this._onDidChangeCapabilities.fire(undefined);
        }
        watch(resource, opts) {
            const req = Math.random();
            this._channel.call('watch', [this._session, req, resource, opts]);
            return lifecycle_1.toDisposable(() => {
                this._channel.call('unwatch', [this._session, req]);
            });
        }
        static _createFileChange(dto) {
            return { resource: uri_1.URI.revive(dto.resource), type: dto.type };
        }
        // --- forwarding calls
        static _asBuffer(data) {
            return Buffer.isBuffer(data) ? data : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
        }
        stat(resource) {
            return this._channel.call('stat', [resource]);
        }
        readFile(resource) {
            return this._channel.call('readFile', [resource]);
        }
        writeFile(resource, content, opts) {
            const contents = RemoteExtensionsFileSystemProvider._asBuffer(content);
            return this._channel.call('writeFile', [resource, contents, opts]);
        }
        delete(resource, opts) {
            return this._channel.call('delete', [resource, opts]);
        }
        mkdir(resource) {
            return this._channel.call('mkdir', [resource]);
        }
        readdir(resource) {
            return this._channel.call('readdir', [resource]);
        }
        rename(resource, target, opts) {
            return this._channel.call('rename', [resource, target, opts]);
        }
        copy(resource, target, opts) {
            return this._channel.call('copy', [resource, target, opts]);
        }
    }
    exports.RemoteExtensionsFileSystemProvider = RemoteExtensionsFileSystemProvider;
});
//# sourceMappingURL=remoteAgentFileSystemChannel.js.map